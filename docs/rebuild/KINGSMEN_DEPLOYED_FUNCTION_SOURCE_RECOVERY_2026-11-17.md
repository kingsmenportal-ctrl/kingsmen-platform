# Recovered Deployed Edge Function Sources — 17 November 2026

These four function source files were retrieved directly from the ACTIVE Supabase staging deployment and copied without edits into the isolated Kingsmen rebuild branch. This is source recovery only; no Edge Function was redeployed and no live Supabase configuration was changed.

| Function | Deployed version | verify_jwt | Supabase bundle SHA-256 | Bytes |
|---|---:|---:|---|---:|
| `n08-founder-control-plane-health` | 4 | true | `4d7ce0268d43c9162583c2b071642e890e7a18e7d257b7f0a9afa6bec5fe304f` | 6275 |
| `n07-airtable-enqueue` | 3 | true | `7e9cdb23150d7a3b2d0217beea7cd4624352eff67002640cc8a81f17a9f42605` | 6830 |
| `candidate-application-outcomes` | 3 | true | `cbda1a81dc87361a66109afb1630140e8b1bf3d39e6123e0c99471aa3566a40a` | 8294 |
| `candidate-application-outcome-review` | 3 | true | `c142c456a5269ba4a20c4cf90cca6ffbe3f68ef8ef62a61f6f45c784debd1c73` | 6471 |

## Files recovered

- `supabase/functions/n08-founder-control-plane-health/index.ts`
- `supabase/functions/n07-airtable-enqueue/index.ts`
- `supabase/functions/candidate-application-outcomes/index.ts`
- `supabase/functions/candidate-application-outcome-review/index.ts`

## Review notes

- `n08-founder-control-plane-health`: GET-only operational health read; verifies caller identity and requires an active PLATFORM_ADMIN grant for user tokens; returns aggregate counts, not candidate records.
- `n07-airtable-enqueue`: requires an active reviewer/operator grant for user tokens, accepts a narrow scalar payload allow-list, derives an idempotency key and calls the durable PostgreSQL outbox RPC. Airtable remains an asynchronous mirror.
- `candidate-application-outcomes`: read-only candidate application history; resolves the signed-in user through a VERIFIED candidate identity link before reading candidate-owned application, evidence, event and outcome records.
- `candidate-application-outcome-review`: requires active APPLICATION_REVIEWER or PLATFORM_ADMIN role; lists reviewer-verified provider outcome notices and delegates confirmation to the guarded database RPC.

All four deployed functions report `verify_jwt=true`. The service-role path in the founder/outbox functions depends on the Supabase Edge Gateway validating the signed JWT before the handler runs. Do not change the gateway JWT setting or expose the service-role key.

## Required before reuse

1. Run source-level tests and static analysis.
2. Compare these files with the PR #254/PR #316 source copies, if any, and retain the deployed-version metadata as evidence.
3. Exercise positive and negative authorization paths in an isolated test environment.
4. Review the hard-coded staging CORS allow-list before any new hosting origin is introduced.
5. Verify the database RPC and table dependencies before deployment.

The bundle SHA-256 values above are Supabase deployment metadata, not a claim that a local source file was independently byte-compared to the deployed artifact.

**No deployment is claimed. No live function was modified.**
