-- Provenance reconciliation only; this migration MUST NOT recreate CAO schema objects.
-- The live staging schema was observed to contain the 0096 CAO bridge contract while
-- the Supabase migration ledger still ended at 0095. This records a reviewed, fail-closed
-- attestation at its own execution time; it does not backdate or identify the original actor.
-- Apply only after independent review, approved backup/change control and live inspection.

DO $reconcile$
DECLARE
  v_missing text[] := ARRAY[]::text[];
  v_list_oid oid;
  v_get_oid oid;
  v_save_oid oid;
  v_list_def text;
  v_get_def text;
  v_save_def text;
  v_search_path text[] := ARRAY['search_path=pg_catalog, public, kingsmen_security'];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cao_choice_items'
      AND column_name = 'candidate_application_id' AND data_type = 'uuid'
  ) THEN v_missing := array_append(v_missing, 'candidate_application_id uuid'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.cao_choice_items'::regclass
      AND attname = 'application_id' AND attnotnull = false AND NOT attisdropped
  ) THEN v_missing := array_append(v_missing, 'legacy application_id nullable'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.cao_choice_items'::regclass
      AND conname = 'cao_choice_items_candidate_parent_fk'
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE
        '%FOREIGN KEY (candidate_application_id, candidate_id) REFERENCES candidate_applications(id, candidate_id)%'
  ) THEN v_missing := array_append(v_missing, 'owner-bound composite foreign key'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.cao_choice_items'::regclass
      AND conname = 'cao_choice_items_exactly_one_parent_check' AND contype = 'c'
  ) THEN v_missing := array_append(v_missing, 'exactly-one-parent constraint'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.candidate_applications'::regclass AND i.indisunique
      AND (
        SELECT array_agg(a.attname ORDER BY k.ordinality)
        FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ordinality)
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE k.ordinality <= i.indnkeyatts
      ) = ARRAY['id', 'candidate_id']::name[]
  ) THEN v_missing := array_append(v_missing, 'candidate_applications unique (id,candidate_id) key'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class ix ON ix.oid = i.indexrelid
    WHERE i.indrelid = 'public.cao_choice_items'::regclass
      AND ix.relname = 'cao_choice_items_legacy_parent_choice_number_uq'
      AND i.indisunique
      AND pg_get_indexdef(i.indexrelid) ILIKE '%(application_id, choice_number)%'
      AND pg_get_expr(i.indpred, i.indrelid) ILIKE '%application_id IS NOT NULL%'
  ) THEN v_missing := array_append(v_missing, 'legacy parent choice unique index and predicate'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class ix ON ix.oid = i.indexrelid
    WHERE i.indrelid = 'public.cao_choice_items'::regclass
      AND ix.relname = 'cao_choice_items_candidate_parent_choice_number_uq'
      AND i.indisunique
      AND pg_get_indexdef(i.indexrelid) ILIKE '%(candidate_application_id, choice_number)%'
      AND pg_get_expr(i.indpred, i.indrelid) ILIKE '%candidate_application_id IS NOT NULL%'
  ) THEN v_missing := array_append(v_missing, 'candidate parent choice unique index and predicate'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_index i JOIN pg_class ix ON ix.oid = i.indexrelid
    WHERE i.indrelid = 'public.cao_choice_items'::regclass
      AND ix.relname = 'cao_choice_items_candidate_parent_idx'
      AND pg_get_indexdef(i.indexrelid) ILIKE '%(candidate_application_id, candidate_id, choice_number)%'
      AND pg_get_expr(i.indpred, i.indrelid) ILIKE '%candidate_application_id IS NOT NULL%'
  ) THEN v_missing := array_append(v_missing, 'candidate parent lookup index and predicate'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.candidate_application_events'::regclass
      AND conname = 'candidate_application_events_event_type_check'
      AND pg_get_constraintdef(oid) ILIKE '%CAO_CHOICES_UPDATED%'
  ) THEN v_missing := array_append(v_missing, 'CAO_CHOICES_UPDATED event allow-list'); END IF;

  v_list_oid := to_regprocedure('public.list_candidate_cao_parents()');
  v_get_oid := to_regprocedure('public.get_candidate_cao_choices(uuid)');
  v_save_oid := to_regprocedure('public.save_candidate_cao_choices(uuid,jsonb)');

  IF v_list_oid IS NULL THEN v_missing := array_append(v_missing, 'list_candidate_cao_parents RPC'); END IF;
  IF v_get_oid IS NULL THEN v_missing := array_append(v_missing, 'get_candidate_cao_choices RPC'); END IF;
  IF v_save_oid IS NULL THEN v_missing := array_append(v_missing, 'save_candidate_cao_choices RPC'); END IF;

  IF v_list_oid IS NOT NULL THEN
    SELECT pg_get_functiondef(v_list_oid) INTO v_list_def;
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = v_list_oid)
      OR NOT (SELECT proconfig @> v_search_path FROM pg_proc WHERE oid = v_list_oid)
      OR has_function_privilege('anon', v_list_oid, 'EXECUTE')
      OR NOT has_function_privilege('authenticated', v_list_oid, 'EXECUTE')
      OR EXISTS (
        SELECT 1 FROM aclexplode(coalesce(
          (SELECT proacl FROM pg_proc WHERE oid = v_list_oid),
          acldefault('f', (SELECT proowner FROM pg_proc WHERE oid = v_list_oid))
        )) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE'
      )
      OR position('auth.uid()' in v_list_def) = 0
      OR position('current_authenticated_candidate_id()' in v_list_def) = 0
      OR position('VERIFIED_CANDIDATE_IDENTITY_REQUIRED' in v_list_def) = 0
      OR position('OFFICIAL_VERIFIED' in v_list_def) = 0
    THEN v_missing := array_append(v_missing, 'list_candidate_cao_parents security/owner guard'); END IF;
  END IF;

  IF v_get_oid IS NOT NULL THEN
    SELECT pg_get_functiondef(v_get_oid) INTO v_get_def;
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = v_get_oid)
      OR NOT (SELECT proconfig @> v_search_path FROM pg_proc WHERE oid = v_get_oid)
      OR has_function_privilege('anon', v_get_oid, 'EXECUTE')
      OR NOT has_function_privilege('authenticated', v_get_oid, 'EXECUTE')
      OR EXISTS (
        SELECT 1 FROM aclexplode(coalesce(
          (SELECT proacl FROM pg_proc WHERE oid = v_get_oid),
          acldefault('f', (SELECT proowner FROM pg_proc WHERE oid = v_get_oid))
        )) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE'
      )
      OR position('auth.uid()' in v_get_def) = 0
      OR position('current_authenticated_candidate_id()' in v_get_def) = 0
      OR position('VERIFIED_CANDIDATE_IDENTITY_REQUIRED' in v_get_def) = 0
      OR position('CAO_PARENT_NOT_AVAILABLE' in v_get_def) = 0
      OR position('candidate_id = v_candidate_id' in v_get_def) = 0
    THEN v_missing := array_append(v_missing, 'get_candidate_cao_choices security/owner guard'); END IF;
  END IF;

  IF v_save_oid IS NOT NULL THEN
    SELECT pg_get_functiondef(v_save_oid) INTO v_save_def;
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = v_save_oid)
      OR NOT (SELECT proconfig @> v_search_path FROM pg_proc WHERE oid = v_save_oid)
      OR has_function_privilege('anon', v_save_oid, 'EXECUTE')
      OR NOT has_function_privilege('authenticated', v_save_oid, 'EXECUTE')
      OR EXISTS (
        SELECT 1 FROM aclexplode(coalesce(
          (SELECT proacl FROM pg_proc WHERE oid = v_save_oid),
          acldefault('f', (SELECT proowner FROM pg_proc WHERE oid = v_save_oid))
        )) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE'
      )
      OR position('auth.uid()' in v_save_def) = 0
      OR position('current_authenticated_candidate_id()' in v_save_def) = 0
      OR position('VERIFIED_CANDIDATE_IDENTITY_REQUIRED' in v_save_def) = 0
      OR position('PROFILE_PROCESSING' in v_save_def) = 0
      OR position('CAO_PROFILE_PROCESSING_CONSENT_REQUIRED' in v_save_def) = 0
      OR position('CAO_PARENT_MUST_BE_AN_OWNED_DRAFT' in v_save_def) = 0
      OR position('CAO_CHOICES_UPDATED' in v_save_def) = 0
      OR position('provider_submission_sent' in v_save_def) = 0
    THEN v_missing := array_append(v_missing, 'save_candidate_cao_choices consent/owner/audit/draft guard'); END IF;
  END IF;

  IF coalesce((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.cao_choice_items'::regclass), false) = false THEN
    v_missing := array_append(v_missing, 'cao_choice_items RLS enabled');
  END IF;

  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION 'CAO_0096_PROVENANCE_RECONCILIATION_FAILED: %', array_to_string(v_missing, '; ');
  END IF;

  RAISE NOTICE 'CAO_0096_PROVENANCE_RECONCILIATION_PASSED: live schema satisfies the owner-bound, consent-gated, draft-only contract. This records reconciliation time only; original application provenance remains unknown.';
END
$reconcile$;
