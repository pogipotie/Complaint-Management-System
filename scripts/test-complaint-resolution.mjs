// node scripts/test-complaint-resolution.mjs <isolated-pglite/dist/index.js>
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(process.argv[2]
  ? pathToFileURL(process.argv[2]).href : '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`
    CREATE TABLE public.complaints (
      id integer PRIMARY KEY, status text, created_at timestamptz,
      resolved_at timestamptz, rating integer, resolution_notes text
    );
    CREATE TABLE public.complaint_status_history (
      complaint_id integer, from_status text, to_status text, created_at timestamptz
    );
    INSERT INTO complaints(id,status,created_at,resolved_at) VALUES
      (1,'resolved','2026-01-01',NULL),
      (2,'resolved','2026-01-01',NULL),
      (3,'resolved','2026-01-01','2026-01-03'),
      (4,'pending','2026-01-01',NULL),
      (5,'resolved','2026-01-01',NULL);
    INSERT INTO complaint_status_history VALUES
      (1,'assigned','resolved','2026-01-02'),
      (1,'resolved','resolved','2026-01-04'),
      (3,'assigned','resolved','2026-01-02'),
      (4,'assigned','resolved','2026-01-02'),
      (5,'assigned','resolved','2025-01-01'),
      (5,'assigned','resolved','2099-01-01'),
      (5,NULL,'resolved','2026-01-02');
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/20261102000000_complaint_resolution_timestamp.sql', import.meta.url), 'utf8'));
  const row = async id => (await db.query('SELECT *, resolved_at::text AS timestamp FROM complaints WHERE id=$1', [id])).rows[0];
  assert.match((await row(1)).timestamp, /2026-01-02/);
  assert.equal((await row(2)).resolved_at, null);
  assert.match((await row(3)).timestamp, /2026-01-03/);
  assert.equal((await row(4)).resolved_at, null);
  assert.equal((await row(5)).resolved_at, null);
  console.log('PASS historical backfill preserves known dates and does not guess missing dates');

  await db.exec("UPDATE complaints SET status='resolved', resolved_at='2000-01-01' WHERE id=4");
  const saved = (await row(4)).timestamp;
  assert.ok(Date.parse(saved) > Date.now() - 60000);
  console.log('PASS resolution uses server time instead of a client-supplied timestamp');

  await db.exec("UPDATE complaints SET rating=5, resolution_notes='Updated', resolved_at=NULL WHERE id=4");
  assert.equal((await row(4)).timestamp, saved);
  await db.exec("UPDATE complaints SET resolved_at='2000-01-01' WHERE id=4");
  assert.equal((await row(4)).timestamp, saved);
  await db.exec("UPDATE complaints SET rating=5 WHERE id=2");
  assert.equal((await row(2)).resolved_at, null);
  console.log('PASS subsequent ratings and edits preserve original or unknown resolution dates');

  await db.exec("INSERT INTO complaints(id,status,created_at,resolved_at) VALUES (6,'pending',now(),'2000-01-01'),(7,'resolved',now(),'2000-01-01')");
  assert.equal((await row(6)).resolved_at, null);
  assert.ok(Date.parse((await row(7)).timestamp) > Date.now() - 60000);
  await db.exec("UPDATE complaints SET resolved_at=now() WHERE id=6");
  assert.equal((await row(6)).resolved_at, null);
  console.log('PASS inserts and non-resolution edits cannot forge timestamps');
} finally {
  await db.close();
}
