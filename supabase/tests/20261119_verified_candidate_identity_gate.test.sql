-- KINGSMEN IDENTITY GATE REGRESSION TEST
-- Run ONLY against a disposable Supabase database after applying the proposal in
-- docs/rebuild/proposals/20261119_verified_candidate_identity_gate.md.
-- Do NOT run this file against live staging. All synthetic public-table inserts
-- are wrapped in one transaction and rolled back at the end.
BEGIN;

SELECT plan(7);

CREATE TEMP TABLE km_identity_gate_fixture (
  case_name text PRIMARY KEY,
  candidate_id uuid NOT NULL DEFAULT gen_random_uuid(),
  linked_user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  link_status text,
  verified_at timestamptz,
  verified_by text,
  revocation_reason text
) ON COMMIT DROP;

INSERT INTO km_identity_gate_fixture
  (case_name, link_status, verified_at, verified_by, revocation_reason)
VALUES
  ('pending', 'PENDING', NULL, NULL, NULL),
  ('revoked', 'REVOKED', now() - interval '1 day', '00000000-0000-4000-8000-000000000002', 'test fixture revoked'),
  ('verified', 'VERIFIED', now() - interval '1 minute', '00000000-0000-4000-8000-000000000003', NULL),
  ('future_verified', 'VERIFIED', now() + interval '1 hour', '00000000-0000-4000-8000-000000000004', NULL),
  ('mismatched_user', 'VERIFIED', now() - interval '1 minute', '00000000-0000-4000-8000-000000000005', NULL),
  ('no_link', NULL, NULL, NULL, NULL);

UPDATE km_identity_gate_fixture
SET request_user_id = linked_user_id
WHERE case_name <> 'mismatched_user';

INSERT INTO public.candidates (id, public_ref, email, display_name, current_state, is_active)
SELECT candidate_id,
       'KNG-TEST-' || substr(replace(candidate_id::text, '-', ''), 1, 12),
       'km-id-gate-' || candidate_id::text || '@example.invalid',
       'Kingsmen Identity Gate Test',
       'NEW',
       true
FROM km_identity_gate_fixture;

INSERT INTO public.candidate_auth_identity_links
  (supabase_user_id, candidate_id, link_status, verified_at, verified_by, revocation_reason)
SELECT linked_user_id, candidate_id, link_status, verified_at, verified_by, revocation_reason
FROM km_identity_gate_fixture
WHERE case_name <> 'no_link';

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT request_user_id::text FROM km_identity_gate_fixture WHERE case_name = 'pending'),
  true
);
SELECT is(kingsmen_security.current_authenticated_candidate_id(), NULL::uuid,
  'pending identity link grants no candidate ID');

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT request_user_id::text FROM km_identity_gate_fixture WHERE case_name = 'revoked'),
  true
);
SELECT is(kingsmen_security.current_authenticated_candidate_id(), NULL::uuid,
  'revoked identity link grants no candidate ID even with historical verification fields');

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT request_user_id::text FROM km_identity_gate_fixture WHERE case_name = 'future_verified'),
  true
);
SELECT is(kingsmen_security.current_authenticated_candidate_id(), NULL::uuid,
  'future-dated verification grants no candidate ID');

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT request_user_id::text FROM km_identity_gate_fixture WHERE case_name = 'mismatched_user'),
  true
);
SELECT is(kingsmen_security.current_authenticated_candidate_id(), NULL::uuid,
  'a user not matching the linked Auth user gets no candidate ID');

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT request_user_id::text FROM km_identity_gate_fixture WHERE case_name = 'no_link'),
  true
);
SELECT is(kingsmen_security.current_authenticated_candidate_id(), NULL::uuid,
  'an Auth user with no identity link gets no candidate ID');

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT request_user_id::text FROM km_identity_gate_fixture WHERE case_name = 'verified'),
  true
);
SELECT is(
  kingsmen_security.current_authenticated_candidate_id(),
  (SELECT candidate_id FROM km_identity_gate_fixture WHERE case_name = 'verified'),
  'verified identity link resolves the linked candidate without relying on candidate_accounts'
);
SELECT is(
  (SELECT count(*) FROM public.candidate_accounts ca
   JOIN km_identity_gate_fixture f ON f.candidate_id = ca.candidate_id
   WHERE f.case_name = 'verified'),
  0::bigint,
  'verified-link fixture has no legacy candidate_accounts row'
);

SELECT * FROM finish();
ROLLBACK;
