// Run with an isolated @electric-sql/pglite installation:
// node scripts/test-complaint-escalation.mjs <path-to-pglite/dist/index.js>
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(process.argv[2]
  ? pathToFileURL(process.argv[2]).href : '@electric-sql/pglite');
const db = new PGlite();
let passed = 0;
const ids = {
  citizen: '10000000-0000-0000-0000-000000000001',
  other: '10000000-0000-0000-0000-000000000002',
  captain: '10000000-0000-0000-0000-000000000003',
  admin: '10000000-0000-0000-0000-000000000004',
  foreignCaptain: '10000000-0000-0000-0000-000000000005',
  inactive: '10000000-0000-0000-0000-000000000006'
};
let sequence = 0;
const nextId = () => `20000000-0000-0000-0000-${String(++sequence).padStart(12, '0')}`;

// A minimal Supabase-compatible fixture uses the same columns, roles and broad
// pre-existing owner UPDATE policy. No network or production data is used.
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated;
  CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
  GRANT USAGE ON SCHEMA auth, public TO authenticated, anon;
  CREATE TYPE public.user_role AS ENUM ('citizen','brgy_captain','admin','staff');
  CREATE TYPE public.complaint_status AS ENUM ('pending','assigned','resolved','rejected');
  CREATE TABLE public.users (
    id uuid PRIMARY KEY, role public.user_role NOT NULL,
    barangay text, is_active boolean NOT NULL DEFAULT true
  );
  CREATE TABLE public.complaints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid NOT NULL REFERENCES public.users(id),
    barangay text, title text DEFAULT 'Test complaint',
    status public.complaint_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    is_escalated boolean NOT NULL DEFAULT false,
    resolution_notes text, resolution_images text[] DEFAULT '{}',
    rating integer, feedback_text text
  );
  CREATE TABLE public.complaint_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id uuid REFERENCES public.complaints(id),
    changed_by uuid REFERENCES public.users(id),
    from_status public.complaint_status, to_status public.complaint_status,
    created_at timestamptz DEFAULT now()
  );
  CREATE TABLE public.complaint_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id uuid REFERENCES public.complaints(id),
    user_id uuid REFERENCES public.users(id),
    body text, is_internal boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id), complaint_id uuid,
    type text, title text, body text, should_email boolean
  );
  CREATE FUNCTION public.on_complaint_escalation() RETURNS trigger
    LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;
  CREATE TRIGGER trg_complaint_escalation AFTER UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.on_complaint_escalation();
  ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
  CREATE POLICY owner_access ON public.complaints FOR ALL
    USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
  CREATE POLICY officials_access ON public.complaints FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()
      AND (role = 'admin' OR (role = 'brgy_captain' AND barangay = complaints.barangay)))
  );
  GRANT SELECT ON public.users TO authenticated;
  GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
  GRANT SELECT, INSERT ON public.complaint_comments TO authenticated;
`);
await db.query(`INSERT INTO public.users VALUES
  ($1,'citizen','A',true), ($2,'citizen','A',true),
  ($3,'brgy_captain','A',true), ($4,'admin','A',true),
  ($5,'brgy_captain','B',true), ($6,'citizen','A',false)`, Object.values(ids));

async function actor(name) {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [name ? ids[name] : '']);
  if (name) await db.exec('SET ROLE authenticated');
}
async function complaint(age = '48 hours', status = 'pending', owner = ids.citizen) {
  await actor(null);
  const id = nextId();
  await db.query(`INSERT INTO public.complaints(id,created_by,barangay,status,created_at)
    VALUES ($1,$2,'A',$3,now()-$4::interval)`, [id, owner, status, age]);
  return id;
}
async function eligibility(id) {
  return (await db.query('SELECT public.get_complaint_escalation_eligibility($1) AS result', [id])).rows[0].result;
}
async function escalate(id, reason = 'No captain action on this complaint.') {
  return (await db.query('SELECT public.escalate_complaint($1,$2) AS result', [id, reason])).rows[0].result;
}
async function test(name, run) {
  await run();
  console.log(`PASS ${name}`);
  passed++;
}

const historical = await complaint();
await db.query(`INSERT INTO public.complaint_comments(complaint_id,user_id,body,created_at)
  VALUES ($1,$2,'Captain response',now()-interval '10 hours')`, [historical, ids.captain]);
const historicalStatus = await complaint();
await db.query(`INSERT INTO public.complaint_status_history
  (complaint_id,changed_by,from_status,to_status,created_at)
  VALUES ($1,$2,'pending','assigned',now()-interval '3 hours')`, [historicalStatus, ids.captain]);
const historicalInternal = await complaint();
await db.query(`INSERT INTO public.complaint_comments(complaint_id,user_id,body,is_internal)
  VALUES ($1,$2,'Automatic note',true)`, [historicalInternal, ids.captain]);

try {
  await db.exec(await readFile(new URL('../supabase/migrations/20261101000000_citizen_complaint_escalation.sql', import.meta.url), 'utf8'));

  await test('historical captain responses and status changes restart the clock', async () => {
    await actor('citizen');
    assert.equal((await eligibility(historical)).can_escalate, false);
    assert.equal((await eligibility(historicalStatus)).can_escalate, false);
    assert.equal((await eligibility(historicalInternal)).can_escalate, true);
  });
  await test('new complaint waits 24 hours and direct updates cannot bypass the rule', async () => {
    const id = await complaint('23 hours');
    await actor('citizen');
    assert.equal((await eligibility(id)).can_escalate, false);
    await assert.rejects(escalate(id), /24 hours/);
    await assert.rejects(db.query(`UPDATE public.complaints SET is_escalated=true,
      escalation_reason='Please take action.' WHERE id=$1`, [id]), /24 hours/);
    await assert.rejects(db.query(`UPDATE public.complaints SET created_at=now()-interval '3 days' WHERE id=$1`, [id]), /submission date/);
  });
  await test('citizen cannot insert a backdated or already escalated complaint', async () => {
    await actor('citizen');
    const result = await db.query(`INSERT INTO public.complaints(created_by,barangay,created_at)
      VALUES ($1,'A',now()-interval '3 days') RETURNING id`, [ids.citizen]);
    assert.equal((await eligibility(result.rows[0].id)).can_escalate, false);
    await assert.rejects(db.query(`INSERT INTO public.complaints(created_by,barangay,is_escalated)
      VALUES ($1,'A',true)`, [ids.citizen]), /already escalated/);
  });
  await test('exact 24-hour boundary allows escalation without a status change', async () => {
    const id = await complaint('24 hours');
    await actor('citizen');
    assert.equal((await eligibility(id)).can_escalate, true);
    const record = await escalate(id);
    assert.equal(record.escalated_by, ids.citizen);
    assert.equal(record.escalated_by_role, 'citizen');
    assert.equal(record.is_escalated, true);
    assert.equal((await eligibility(id)).status, 'pending');
  });
  await test('reason is required and server limits match UI limits', async () => {
    const id = await complaint();
    await actor('citizen');
    for (const reason of ['', '   ', 'short', 'x'.repeat(2001)]) {
      await assert.rejects(escalate(id, reason), /10 and 2000/);
    }
  });
  await test('duplicates do not create extra notifications or comments', async () => {
    const id = await complaint();
    await actor('citizen');
    await escalate(id, '  No captain action on this complaint.  ');
    await assert.rejects(escalate(id), /already been escalated/);
    await actor(null);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.notifications WHERE complaint_id=$1', [id])).rows[0].n, 3);
    const comments = (await db.query('SELECT * FROM public.complaint_comments WHERE complaint_id=$1', [id])).rows;
    assert.equal(comments.length, 1);
    assert.match(comments[0].body, /citizen/);
    assert.equal(comments[0].user_id, ids.citizen);
    const notices = (await db.query('SELECT * FROM public.notifications WHERE complaint_id=$1', [id])).rows;
    assert.match(notices.find(n => n.user_id === ids.admin).body, /citizen/);
    assert.ok(notices.find(n => n.user_id === ids.captain));
  });
  await test('other citizens, wrong-barangay captains and inactive owners are rejected', async () => {
    const id = await complaint();
    for (const name of ['other', 'foreignCaptain']) {
      await actor(name);
      await assert.rejects(eligibility(id), /cannot access/);
      await assert.rejects(escalate(id), /cannot access/);
    }
    const inactive = await complaint('48 hours', 'pending', ids.inactive);
    await actor('inactive');
    await assert.rejects(escalate(inactive), /active account/);
  });
  await test('resolved and rejected complaints cannot be escalated', async () => {
    for (const status of ['resolved', 'rejected']) {
      const id = await complaint('48 hours', status);
      await actor('citizen');
      assert.equal((await eligibility(id)).can_escalate, false);
      await assert.rejects(escalate(id), /pending or assigned/);
    }
  });
  await test('captain may escalate immediately with correct attribution', async () => {
    const id = await complaint('1 hour');
    await actor('captain');
    assert.equal((await eligibility(id)).can_escalate, true);
    const record = await escalate(id, 'Municipal resources are required.');
    assert.equal(record.escalated_by_role, 'brgy_captain');
    await actor(null);
    const notices = (await db.query('SELECT * FROM public.notifications WHERE complaint_id=$1', [id])).rows;
    assert.equal(notices.length, 2);
    assert.match(notices.find(n => n.user_id === ids.admin).body, /Barangay Captain/);
  });
  await test('captain response restarts waiting and cannot be forged by citizens', async () => {
    const id = await complaint();
    await actor('captain');
    await db.query(`INSERT INTO public.complaint_comments(complaint_id,user_id,body)
      VALUES ($1,$2,'We are reviewing the report.')`, [id, ids.captain]);
    await actor('citizen');
    assert.equal((await eligibility(id)).can_escalate, false);
    await assert.rejects(escalate(id), /24 hours/);
    await assert.rejects(db.query(`INSERT INTO public.complaint_captain_actions(complaint_id,action)
      VALUES ($1,'response')`, [id]), /permission denied/);
  });
  await test('captain status change restarts waiting; unrelated edits and citizen messages do not', async () => {
    const id = await complaint();
    await actor('citizen');
    await db.query(`INSERT INTO public.complaint_comments(complaint_id,user_id,body)
      VALUES ($1,$2,'Following up.')`, [id, ids.citizen]);
    await actor('captain');
    await db.query("UPDATE public.complaints SET title='Updated title' WHERE id=$1", [id]);
    await actor('citizen');
    assert.equal((await eligibility(id)).can_escalate, true);
    await actor('captain');
    await db.query("UPDATE public.complaints SET status='assigned' WHERE id=$1", [id]);
    await actor('citizen');
    assert.equal((await eligibility(id)).can_escalate, false);
    await assert.rejects(db.query("UPDATE public.complaints SET status='pending' WHERE id=$1", [id]), /cannot change complaint status/);
  });
  await test('metadata cannot be forged, reversed or edited; admin retains resolution control', async () => {
    const id = await complaint();
    await actor('citizen');
    await db.query(`UPDATE public.complaints SET is_escalated=true, escalation_reason='Please take action.',
      escalated_by=$2, escalated_by_role='admin', escalated_at=now()-interval '1 day' WHERE id=$1`, [id, ids.admin]);
    const record = await eligibility(id);
    assert.equal(record.escalated_by, ids.citizen);
    assert.equal(record.escalated_by_role, 'citizen');
    await assert.rejects(db.query("UPDATE public.complaints SET is_escalated=false WHERE id=$1", [id]), /cannot be reversed/);
    await assert.rejects(db.query("UPDATE public.complaints SET escalation_reason='Changed reason' WHERE id=$1", [id]), /cannot be edited/);
    await actor('captain');
    await assert.rejects(db.query("UPDATE public.complaints SET status='resolved' WHERE id=$1", [id]), /Only administrators/);
    await db.query(`INSERT INTO public.complaint_comments(complaint_id,user_id,body)
      VALUES ($1,$2,'Coordinating with admin.')`, [id, ids.captain]);
    await actor('admin');
    await db.query("UPDATE public.complaints SET status='resolved' WHERE id=$1", [id]);
    await actor('citizen');
    await db.query("UPDATE public.complaints SET rating=5, feedback_text='Thank you' WHERE id=$1", [id]);
  });
  await test('notification failure rolls back the referral and activity comment atomically', async () => {
    const id = await complaint();
    await db.exec(`CREATE FUNCTION public.reject_test_notification() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Simulated notification failure'; END; $$;
      CREATE TRIGGER reject_test_notification BEFORE INSERT ON public.notifications
      FOR EACH ROW EXECUTE FUNCTION public.reject_test_notification();`);
    await actor('citizen');
    await assert.rejects(escalate(id), /Simulated notification failure/);
    assert.equal((await eligibility(id)).is_escalated, false);
    await actor(null);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.complaint_comments WHERE complaint_id=$1', [id])).rows[0].n, 0);
    await db.exec('DROP TRIGGER reject_test_notification ON public.notifications; DROP FUNCTION public.reject_test_notification();');
  });
  await test('anonymous callers cannot invoke the escalation endpoints', async () => {
    const id = await complaint();
    await db.exec('SET ROLE anon');
    await assert.rejects(escalate(id), /permission denied/);
    await assert.rejects(eligibility(id), /permission denied/);
    await actor(null);
  });
  console.log(`Database escalation verification: ${passed} checks passed.`);
} finally {
  await db.close();
}
