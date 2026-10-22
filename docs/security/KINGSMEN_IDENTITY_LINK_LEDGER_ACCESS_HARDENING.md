# Candidate identity-link ledger access hardening

Staging migration version `20261022183219` is named `revoke_client_candidate_identity_link_table_access`.

The identity-link ledger is backend-only. Anonymous and authenticated roles must not have direct SELECT or INSERT privileges. The service role retains access for the audited identity review workflow. The table retains RLS and the existing backend-only policy.

Live staging privilege checks on 2026-10-22:
- anon SELECT: false
- authenticated SELECT: false
- anon INSERT: false
- authenticated INSERT: false
- service_role SELECT: true

This is a staging evidence note. The matching SQL migration must be committed to the repository migration history before this change is considered fully reconciled across source and deployed database.
