-- RC1 security hardening: client roles must never hold privileges that bypass row-level policies.
-- TRUNCATE, TRIGGER, REFERENCES and MAINTAIN are not required by the browser/PostgREST client.
-- Preserve SELECT/INSERT/UPDATE/DELETE grants; row-level policies continue to govern those operations.
begin;

do $$
declare
  t record;
begin
  for t in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
    order by tablename
  loop
    execute format(
      'revoke truncate, references, trigger, maintain on table %I.%I from anon, authenticated',
      t.schemaname, t.tablename
    );
  end loop;
end
$$;

-- Both roles have public-table default ACLs in the live staging database.
-- Harden both creator contexts so the result does not depend on which migration owner runs DDL.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;
alter default privileges for role supabase_admin in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;

commit;
