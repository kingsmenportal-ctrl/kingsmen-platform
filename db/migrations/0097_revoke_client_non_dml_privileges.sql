-- RC1 security hardening: client roles must never hold privileges that bypass row-level policies.
-- TRUNCATE, TRIGGER, REFERENCES and MAINTAIN are not required by the browser/PostgREST client.
-- Preserve SELECT/INSERT/UPDATE/DELETE grants; row-level policies continue to govern those operations.
--
-- Supabase reserves supabase_admin. The postgres migration role cannot alter its default ACLs.
-- Those defaults matter only for objects supabase_admin owns in public. Preflight requires
-- that extension-owned objects are kept out of public; new extensions must use an appropriate
-- non-exposed schema (normally extensions), and any non-relocatable exception requires review.

begin;

do $preflight$
begin
  if exists (
    select 1
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relowner = 'supabase_admin'::regrole
      and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
    union all
    select 1
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proowner = 'supabase_admin'::regrole
  ) then
    raise exception
      'Refusing 0097: supabase_admin owns objects in public; move relocatable extensions out of public or obtain Supabase Support guidance';
  end if;

  if exists (
    select 1 from pg_extension
    where extnamespace = 'public'::regnamespace
  ) then
    raise exception
      'Refusing 0097: an extension is installed in public; review/move it to a non-exposed schema before applying client privilege hardening';
  end if;
end
$preflight$;

do $revoke_existing$
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
      'revoke truncate, references, trigger, maintain on table %I.%I from PUBLIC, anon, authenticated',
      t.schemaname, t.tablename
    );
  end loop;
end
$revoke_existing$;

-- This changes future objects created by postgres only. Supabase's internal
-- supabase_admin default ACL is reserved and intentionally not altered.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from PUBLIC, anon, authenticated;

commit;
