// Run against an isolated PGlite install; never connects to the hosted database.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('test.uid',true),'')::uuid $$;
    CREATE TABLE public.users(id uuid PRIMARY KEY,role text,barangay text,full_name text,
      department_id uuid,is_active boolean DEFAULT true,verification_status text DEFAULT 'pending');
    CREATE TABLE public.complaints(id uuid PRIMARY KEY,created_by uuid,status text DEFAULT 'pending',
      barangay text,rating integer,resolution_notes text);
    CREATE TABLE public.complaint_status_history(complaint_id uuid,from_status text,to_status text,changed_by uuid,note text);
    CREATE TABLE public.notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES users,
      related_user_id uuid,complaint_id uuid,type text,title text,body text,should_email boolean);
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/20261102010000_account_approval_notifications.sql', import.meta.url), 'utf8'));
  await db.exec(`
    CREATE TRIGGER registration AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION notify_captains_citizen_registration();
    CREATE TRIGGER resubmission AFTER UPDATE ON users FOR EACH ROW EXECUTE FUNCTION notify_admins_user_resubmission();
    CREATE TRIGGER complaints_notify AFTER INSERT OR UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION on_complaint_status_change();
  `);
  const ids = { captain: '00000000-0000-0000-0000-000000000001', other: '00000000-0000-0000-0000-000000000002',
    citizen: '00000000-0000-0000-0000-000000000003', inactive: '00000000-0000-0000-0000-000000000004' };
  const as = async id => db.query("SELECT set_config('test.uid',$1,false)", [id || '']);
  await db.query(`INSERT INTO users(id,role,barangay,verification_status,is_active) VALUES
    ($1,'brgy_captain','A','verified',true),($2,'brgy_captain','B','verified',true),
    ($3,'brgy_captain','A','verified',false)`, [ids.captain, ids.other, ids.inactive]);
  await as(ids.captain);
  await db.query("SELECT register_push_subscription('https://fcm.googleapis.com/fcm/send/test', repeat('a',87),repeat('b',22))");
  await as(ids.citizen);
  await db.query("INSERT INTO users(id,role,barangay,verification_status) VALUES ($1,'citizen','A','verified')", [ids.citizen]);
  assert.equal((await db.query('SELECT verification_status FROM users WHERE id=$1', [ids.citizen])).rows[0].verification_status, 'pending');
  const registrations = (await db.query("SELECT * FROM notifications WHERE event_key='citizen_registered'")).rows;
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].user_id, ids.captain);
  assert.equal((await db.query('SELECT * FROM notification_deliveries')).rows.length, 2);
  console.log('PASS registration defaults to Pending and queues email/push only for the matching active captain');
  await assert.rejects(db.query("UPDATE users SET verification_status='verified' WHERE id=$1", [ids.citizen]));
  await assert.rejects(db.query("UPDATE users SET role='admin' WHERE id=$1", [ids.citizen]));
  await assert.rejects(db.query("INSERT INTO complaints(id,created_by,barangay) VALUES (gen_random_uuid(),$1,'A')", [ids.citizen]));
  console.log('PASS citizen cannot self-approve, elevate privileges, or submit before approval');
  await as(ids.other);
  await assert.rejects(db.query("UPDATE users SET verification_status='verified' WHERE id=$1", [ids.citizen]));
  await as(ids.captain);
  await db.query("UPDATE users SET verification_status='verified' WHERE id=$1", [ids.citizen]);
  const approval = (await db.query("SELECT * FROM notifications WHERE event_key='account_approved'")).rows;
  assert.equal(approval.length, 1);
  assert.equal(approval[0].user_id, ids.citizen);
  assert.equal(approval[0].body, 'Your account has been approved. You can now submit a complaint.');
  await db.query("UPDATE users SET verification_status='verified' WHERE id=$1", [ids.citizen]);
  assert.equal((await db.query("SELECT * FROM notifications WHERE event_key='account_approved'")).rows.length, 1);
  console.log('PASS matching captain approval generates exactly one citizen email and approval audit');
  await as(ids.citizen);
  await db.query("INSERT INTO complaints(id,created_by,barangay) VALUES (gen_random_uuid(),$1,'A')", [ids.citizen]);
  await assert.rejects(db.query("INSERT INTO complaints(id,created_by,barangay) VALUES (gen_random_uuid(),$1,'B')", [ids.citizen]));
  assert.equal((await db.query("SELECT user_id FROM notifications WHERE event_key='complaint_submitted'")).rows[0].user_id, ids.captain);
  await db.query("INSERT INTO notifications(user_id,type,title,event_key) VALUES ($1,'system','Spoof','account_approved')", [ids.citizen]);
  assert.equal((await db.query("SELECT event_key FROM notifications WHERE title='Spoof'")).rows[0].event_key, null);
  console.log('PASS approved submission routes only within barangay and client notices cannot forge delivery events');
  const jobs = (await db.query('SELECT * FROM claim_notification_deliveries(2)')).rows;
  assert.equal(jobs.length, 2);
  assert.ok(jobs.every(job => job.attempts === 1 && job.lease_token));
  const more = (await db.query('SELECT * FROM claim_notification_deliveries(20)')).rows;
  assert.ok(more.every(job => !jobs.some(first => first.id === job.id)));
  await db.query("UPDATE notification_deliveries SET attempts=5,locked_at=now()-interval '11 minutes' WHERE id=$1", [jobs[0].id]);
  await db.query('SELECT * FROM claim_notification_deliveries(20)');
  assert.equal((await db.query('SELECT status FROM notification_deliveries WHERE id=$1', [jobs[0].id])).rows[0].status, 'failed');
  console.log('PASS queue claiming leases, concurrent-claim exclusion and exhausted-job cleanup');
} finally {
  await db.close();
}
