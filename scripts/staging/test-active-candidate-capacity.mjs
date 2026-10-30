#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const enabled = process.env.KINGSMEN_CAPACITY_TEST_ALLOW_MUTATION === "true";
const connectionString = process.env.KINGSMEN_CAPACITY_TEST_DATABASE_URL ?? "";
if (!enabled) throw new Error("KINGSMEN_CAPACITY_TEST_ALLOW_MUTATION=true is required");
if (!connectionString) throw new Error("KINGSMEN_CAPACITY_TEST_DATABASE_URL is required");
const target = new URL(connectionString);
if (!["127.0.0.1", "localhost", "::1"].includes(target.hostname) ||
    target.pathname !== "/kingsmen_capacity_test") {
  throw new Error("Refusing to mutate any database except the isolated local kingsmen_capacity_test service");
}

const require = createRequire(import.meta.url);
const pgPath = require.resolve("pg", { paths: [path.join(root, "apps/api")] });
const { Pool, Client } = require(pgPath);
const pool = new Pool({ connectionString, max: 8, connectionTimeoutMillis: 5000 });

const log = (message) => process.stdout.write("PASS " + message + "\n");
const sql = async (file) => pool.query(await fs.readFile(path.join(root, file), "utf8"));
const activeCount = async () => Number((await pool.query("select count(*)::int as n from public.candidates where is_active is true")).rows[0].n);

try {
  const db = await pool.query("select current_database() as name, current_user as role");
  assert.equal(db.rows[0].name, "kingsmen_capacity_test");
  assert.equal(db.rows[0].role, "postgres");

  await pool.query(`
    do $roles$
    begin
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
      if not exists (select 1 from pg_roles where rolname='supabase_admin') then create role supabase_admin nologin superuser; end if;
    end
    $roles$;
  `);

  await pool.query("drop table if exists public.candidates cascade");
  await pool.query("drop table if exists public.system_runtime_config cascade");
  await pool.query(`
    create table public.system_runtime_config (
      key text primary key,
      value jsonb not null,
      description text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table public.candidates (
      id uuid primary key default gen_random_uuid(),
      public_ref text not null unique,
      email text not null,
      display_name text not null,
      current_state text not null default 'NEW',
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    insert into public.system_runtime_config(key,value,description)
    values ('KINGSMEN_CAP_ACTIVE_CANDIDATES','{"value":500}'::jsonb,'Isolated capacity test fixture');
  `);

  // Simulate the audited staging baseline: existing grants and both roles' default ACLs.
  await pool.query("grant select, insert, update, delete, truncate, references, trigger to anon, authenticated on public.candidates, public.system_runtime_config");
  await pool.query("alter default privileges for role postgres in schema public grant truncate, references, trigger on tables to anon, authenticated");
  await pool.query("alter default privileges for role supabase_admin in schema public grant truncate, references, trigger on tables to anon, authenticated");

  await sql("db/migrations/0097_revoke_client_non_dml_privileges.sql");
  await sql("scripts/security/test-client-non-dml-privileges.sql");
  const acl = await pool.query(`
    select has_table_privilege('anon','public.candidates','TRUNCATE') as anon_truncate,
           has_table_privilege('authenticated','public.candidates','TRIGGER') as auth_trigger,
           has_table_privilege('anon','public.candidates','SELECT') as anon_select
  `);
  assert.equal(acl.rows[0].anon_truncate, false);
  assert.equal(acl.rows[0].auth_trigger, false);
  assert.equal(acl.rows[0].anon_select, true, "migration must preserve DML/select grants");
  log("0097 revokes current non-DML grants and changes only postgres defaults; immutable Supabase defaults are handled by preflight");

  await sql("db/migrations/0098_enforce_active_candidate_capacity.sql");

  await pool.query(`insert into public.candidates(public_ref,email,display_name,is_active)
    select 'CAP-'||g, 'cap-'||g||'@example.invalid', 'Capacity Fixture', true
      from generate_series(1,499) g`);
  assert.equal(await activeCount(), 499);
  await pool.query("insert into public.candidates(public_ref,email,display_name) values ('CAP-500','cap-500@example.invalid','Capacity Fixture')");
  assert.equal(await activeCount(), 500);
  log("499 active candidates: 500th admission succeeds");

  await assert.rejects(
    pool.query("insert into public.candidates(public_ref,email,display_name) values ('CAP-501','cap-501@example.invalid','Capacity Fixture')"),
    (error) => error.code === "23514" && error.message.includes("ACTIVE_CANDIDATE_CAP_EXCEEDED")
  );
  assert.equal(await activeCount(), 500);
  log("501st active candidate is rejected and count remains exactly 500");

  await pool.query("insert into public.candidates(public_ref,email,display_name,is_active) values ('CAP-INACTIVE','cap-inactive@example.invalid','Capacity Fixture',false)");
  assert.equal(await activeCount(), 500);
  await pool.query("update public.candidates set is_active=false where public_ref='CAP-500'");
  await pool.query("update public.candidates set is_active=true where public_ref='CAP-INACTIVE'");
  assert.equal(await activeCount(), 500);
  await assert.rejects(
    pool.query("update public.candidates set is_active=true where public_ref='CAP-500'"),
    (error) => error.code === "23514" && error.message.includes("ACTIVE_CANDIDATE_CAP_EXCEEDED")
  );
  log("Inactive rows do not consume capacity; false-to-true activation is guarded");

  await pool.query("truncate public.candidates");
  await pool.query(`insert into public.candidates(public_ref,email,display_name,is_active)
    select 'RACE-'||g, 'race-'||g||'@example.invalid', 'Capacity Fixture', true
      from generate_series(1,499) g`);
  const clients = [new Client({ connectionString }), new Client({ connectionString })];
  await Promise.all(clients.map(c => c.connect()));
  const attempt = async (client, index) => {
    await client.query("begin");
    try {
      await client.query(
        "insert into public.candidates(public_ref,email,display_name,is_active) values ($1,$2,$3,true)",
        ["RACE-500-"+index,"race-500-"+index+"@example.invalid","Capacity Fixture"]
      );
      await client.query("commit");
      return "accepted";
    } catch (error) {
      await client.query("rollback");
      if (error.code === "23514" && String(error.message).includes("ACTIVE_CANDIDATE_CAP_EXCEEDED")) return "rejected";
      throw error;
    }
  };
  const race = await Promise.all(clients.map(attempt).map((p,i)=>p.catch(e=>{throw e;})));
  await Promise.all(clients.map(c => c.end()));
  assert.equal(race.filter(x => x === "accepted").length, 1);
  assert.equal(race.filter(x => x === "rejected").length, 1);
  assert.equal(await activeCount(), 500);
  log("Concurrent admission race: exactly one winner, one fail-closed rejection, persisted count 500");

  process.stdout.write("ACTIVE CANDIDATE CAPACITY TESTS: ALL PASS\n");
} finally {
  await pool.end();
}
