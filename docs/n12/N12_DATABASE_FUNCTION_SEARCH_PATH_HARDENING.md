# N12 — Database Function Search-Path Hardening

## Scope
This migration addresses six Supabase security-advisor warnings by pinning the execution search path for reviewed append-only / transition guard trigger functions:
- `prevent_candidate_application_event_mutation()`
- `prevent_candidate_outcome_ledger_mutation()`
- `guard_candidate_outcome_identity()`
- `guard_n09_communication_state()`
- `prevent_n09_ledger_delete()`
- `n10_prevent_finance_audit_mutation()`

Each function is configured with `search_path = pg_catalog, public, pg_temp`, putting system catalog resolution first and temporary objects last. The reviewed function bodies use trigger records and raise exceptions; they do not require unqualified references to application tables.

## Deliberate non-changes
- No rows or table data are modified.
- No RLS policies or table grants are changed.
- N10 finance tables with RLS enabled and no policies remain deny-by-default for browser roles; server access remains governed by the existing explicit grants/RPC boundary.
- This migration does not make PayFast or N11 release-ready and must not be applied ahead of the approved migration chain.

## Validation
Run `npm run n12:security:validate`. The source validator checks all six exact ALTER FUNCTION statements, their pinned search path, and that no additional functions are altered.

## Rollout
This is a draft follow-on to the N11 dependency branch. First obtain a genuine green Actions result and finish the approved N10/N11 release gates. Then apply the ordered migration in staging, rerun the Supabase security advisor, and confirm these six `function_search_path_mutable` warnings are cleared. Other findings must be reviewed separately; do not suppress or mislabel them as resolved.
