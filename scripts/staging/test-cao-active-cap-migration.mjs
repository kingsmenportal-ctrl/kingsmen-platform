#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const enabled = process.env.KINGSMEN_CAO_CAP_TEST_ALLOW_MUTATION === "true";
const connectionString = process.env.KINGSMEN_CAO_CAP_TEST_DATABASE_URL ?? "";
if (!enabled) throw new Error("KINGSMEN_CAO_CAP_TEST_ALLOW_MUTATION=true is required");
if (!connectionString) throw new Error("KINGSMEN_CAO_CAP_TEST_DATABASE_URL is required");

const target = new URL(connectionString);
if (!["127.0.0.1", "localhost", "::1"].includes(target.hostname) ||
    target.pathname !== "/kingsmen_cao_capacity_test") {
  throw new Error("Refusing to mutate any database except the isolated local kingsmen_cao_capacity_test service");
}

const require = createRequire(import.meta.url);
const pgPath = require.resolve("pg", { paths: [path.join(root, "apps/api")] });
const { Pool, Client } = require(pgPath);
const pool = new Pool({ connectionString, max: 8, connectionTimeoutMillis: 5000 });
const migrationPath = "supabase/migrations/20261029194500_reconcile_cao_client_privileges_and_active_candidate_cap.sql";
const log = (message) => process.stdout.write("PASS " + message + "\n");
const activeCount = async () => Number((await pool.query(
  "select count(*)::int as n from public.candidates where is_active is true"
)).rows[0].n);

try {
  const identity = await pool.query("select current_database() as name, current_user as role");
  assert.equal(identity.rows[0].name, "kingsmen_cao_capacity_test");
  assert.equal(identity.rows[0].role, "postgres");

  await pool.query(`
    do $roles$
    begin
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
    end
    $roles$;
  `);

  await pool.query("drop table if exists public.cao_choice_items cascade");
  await pool.query("drop table if exists public.candidates cascade");
  await pool.query("drop table if exists public.system_runtime_config cascade");
  await pool.query(`
    create table public.system_runtime_config (
      key text primary key,
      value jsonb not null
    );
    create table public.candidates (
      id uuid primary key default gen_random_uuid(),
      public_ref text not null unique,
      email text not null,
      display_name text not null,
      is_active boolean not null default true,
      created_at timestamptz not null default now()
    );
    create table public.cao_choice_items (
      id uuid primary key default gen_random_uuid(),
      candidate_id uuid,
      candidate_application_id uuid
    );
    alter table public.cao_choice_items enable row level security;
    insert into public.system_runtime_config(key,value)
    values ('KINGSMEN_CAP_ACTIVE_CANDIDATES','{"value":500}'::jsonb);
    -- Deliberately recreate broad legacy grants. The migration must remove
    -- both explicit role grants and privileges inherited from PUBLIC.
    grant all privileges on table public.cao_choice_items to PUBLIC, anon, authenticated;
  `);

  const migration = await fs.readFile(path.join(root, migrationPath), "utf8");
  await pool.query(migration);
  log("migration applies cleanly against the isolated PostgreSQL 17 fixture");

  const grants = await pool.query(`
    select
      has_table_privilege('anon','public.cao_choice_items','SELECT') as anon_select,
      has_table_privilege('anon','public.cao_choice_items','INSERT') as anon_insert,
      has_table_privilege('anon','public.cao_choice_items','UPDATE') as anon_update,
      has_table_privilege('anon','public.cao_choice_items','DELETE') as anon_delete,
      has_table_privilege('anon','public.cao_choice_items','TRUNCATE') as anon_truncate,
      has_table_privilege('anon','public.cao_choice_items','REFERENCES') as anon_references,
      has_table_privilege('anon','public.cao_choice_items','TRIGGER') as anon_trigger,
      has_table_privilege('anon','public.cao_choice_items','MAINTAIN') as anon_maintain,
      has_table_privilege('authenticated','public.cao_choice_items','SELECT') as auth_select,
      has_table_privilege('authenticated','public.cao_choice_items','INSERT') as auth_insert,
      has_table_privilege('authenticated','public.cao_choice_items','UPDATE') as auth_update,
      has_table_privilege('authenticated','public.cao_choice_items','DELETE') as auth_delete,
      has_table_privilege('authenticated','public.cao_choice_items','TRUNCATE') as auth_truncate,
      has_table_privilege('authenticated','public.cao_choice_items','REFERENCES') as auth_references,
      has_table_privilege('authenticated','public.cao_choice_items','TRIGGER') as auth_trigger,
      has_table_privilege('authenticated','public.cao_choice_items','MAINTAIN') as auth_maintain,
      has_table_privilege('service_role','public.cao_choice_items','SELECT') as service_select,
      has_table_privilege('service_role','public.cao_choice_items','INSERT') as service_insert,
      has_table_privilege('service_role','public.cao_choice_items','UPDATE') as service_update,
      has_table_privilege('service_role','public.cao_choice_items','DELETE') as service_delete,
      has_function_privilege('anon','public.enforce_candidate_active_capacity()','EXECUTE') as anon_trigger_function_execute,
      has_function_privilege('authenticated','public.enforce_candidate_active_capacity()','EXECUTE') as auth_trigger_function_execute
  `);
  const acl = grants.rows[0];
  for (const key of Object.keys(acl).filter((key) => key.startsWith("anon_") || key.startsWith("auth_"))) {
    assert.equal(acl[key], false, `client privilege must be denied: ${key}`);
  }
  for (const key of ["service_select", "service_insert", "service_update", "service_delete"]) {
    assert.equal(acl[key], true, `service_role must retain backend CRUD: ${key}`);
  }
  log("CAO bridge denies anon/authenticated privileges and grants backend-only service_role CRUD");

  await pool.query(`
    insert into public.candidates(public_ref,email,display_name,is_active)
    select 'CAP-'||g, 'cap-'||g||'@example.invalid', 'Capacity Fixture', true
      from generate_series(1,499) g
  `);
  assert.equal(await activeCount(), 499);
  await pool.query("insert into public.candidates(public_ref,email,display_name) values ('CAP-500','cap-500@example.invalid','Capacity Fixture')");
  assert.equal(await activeCount(), 500);
  log("499 active candidates: 500th admission succeeds");

  await assert.rejects(
    pool.query("insert into public.candidates(public_ref,email,display_name) values ('CAP-501','cap-501@example.invalid','Capacity Fixture')"),
    (error) => error.code === "23514" && error.message.includes("ACTIVE_CANDIDATE_CAP_EXCEEDED")
  );
  assert.equal(await activeCount(), 500);
  log("501st active candidate is rejected and persisted count remains exactly 500");

  await pool.query("insert into public.candidates(public_ref,email,display_name,is_active) values ('CAP-INACTIVE','inactive@example.invalid','Capacity Fixture',false)");
  assert.equal(await activeCount(), 500);
  await pool.query("update public.candidates set is_active=false where public_ref='CAP-500'");
  await pool.query("update public.candidates set is_active=true where public_ref='CAP-INACTIVE'");
  assert.equal(await activeCount(), 500);
  await assert.rejects(
    pool.query("update public.candidates set is_active=true where public_ref='CAP-500'"),
    (error) => error.code === "23514" && error.message.includes("ACTIVE_CANDIDATE_CAP_EXCEEDED")
  );
  await pool.query("update public.candidates set is_active=true where public_ref='CAP-INACTIVE'");
  assert.equal(await activeCount(), 500);
  log("inactive records do not consume capacity; reactivation is guarded; active-to-active updates remain admissible");

  await pool.query("insert into public.candidates(public_ref,email,display_name,is_active) values ('CAP-INVALID','invalid@example.invalid','Capacity Fixture',false)");
  await pool.query("update public.system_runtime_config set value=jsonb_build_object('value', 999) where key='KINGSMEN_CAP_ACTIVE_CANDIDATES'");
  await assert.rejects(
    pool.query("update public.candidates set is_active=true where public_ref='CAP-INVALID'"),
    (error) => error.message.includes("ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED")
  );
  await pool.query("update public.system_runtime_config set value=jsonb_build_object('value', 500) where key='KINGSMEN_CAP_ACTIVE_CANDIDATES'");
  log("unregistered cap stages fail closed");

  await pool.query("truncate public.candidates");
  await pool.query(`
    insert into public.candidates(public_ref,email,display_name,is_active)
    select 'RACE-'||g, 'race-'||g||'@example.invalid', 'Capacity Fixture', true
      from generate_series(1,499) g
  `);
  const clients = [new Client({ connectionString }), new Client({ connectionString })];
  await Promise.all(clients.map((client) => client.connect()));
  let ready = 0;
  let release;
  const barrier = new Promise((resolve) => { release = resolve; });
  const attempt = async (client, index) => {
    await client.query("begin");
    ready += 1;
    if (ready === clients.length) release();
    await barrier;
    try {
      await client.query(
        "insert into public.candidates(public_ref,email,display_name,is_active) values ($1,$2,$3,true)",
        [`RACE-500-${index}`, `race-500-${index}@example.invalid`, "Capacity Fixture"]
      );
      await client.query("commit");
      return "accepted";
    } catch (error) {
      await client.query("rollback");
      if (error.code === "23514" && String(error.message).includes("ACTIVE_CANDIDATE_CAP_EXCEEDED")) return "rejected";
      throw error;
    }
  };
  let race;
  try {
    race = await Promise.all(clients.map((client, index) => attempt(client, index)));
  } finally {
    await Promise.all(clients.map((client) => client.end()));
  }
  assert.equal(race.filter((result) => result === "accepted").length, 1);
  assert.equal(race.filter((result) => result === "rejected").length, 1);
  assert.equal(await activeCount(), 500);
  log("concurrent race at 499: exactly one admission succeeds and the final persisted count is 500");

  process.stdout.write(JSON.stringify({
    schema: "kingsmen.cao-active-cap-postgres-integration.v1",
    status: "PASSED",
    passed: true,
    postgresVersion: (await pool.query("show server_version")).rows[0].server_version,
    cap: 500,
    checks: 7,
    liveSupabaseTouched: false,
    mutatedDatabase: "isolated ephemeral PostgreSQL test service"
  }, null, 2) + "\n");
} finally {
  await pool.end();
}
