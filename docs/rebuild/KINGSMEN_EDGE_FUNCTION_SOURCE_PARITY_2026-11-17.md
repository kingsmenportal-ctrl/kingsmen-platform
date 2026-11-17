# Kingsmen Edge Function Source Parity — 17 November 2026

**Project:** `kingsmen-portal-staging` (`euhubhhnumtibbyufghm`)  
**Source branch:** `rebuild/kingsmen-one-foundation-2026-11-17`  
**Branch head checked:** `b5009562e7de7737dec9dd8af05696810eaee1a6`  
**Audit:** Each deployed function was retrieved from Supabase and compared directly with the corresponding source file at the recorded rebuild branch commit.

## Result

- **21/21 deployed function entrypoints present and byte-for-byte equal to the active deployed `index.ts`.**
- `candidate-private-documents/document-signature.mjs` also matches the deployed helper file exactly.
- All listed function versions and `verify_jwt` settings were read from Supabase.
- No function was redeployed or modified in the live project.
- Supabase bundle SHA-256 is recorded as returned by Supabase. It is deployment metadata; it is not asserted to be the SHA-256 of the local source file.

## Exact parity register

| Function | Deployed version | verify_jwt | Supabase bundle SHA-256 | Source parity |
|---|---:|---:|---|---|
| `candidate-application-outcome-review` | 3 | true | `c142c456a5269ba4a20c4cf90cca6ffbe3f68ef8ef62a61f6f45c784debd1c73` | BYTE-EXACT |
| `candidate-application-outcomes` | 3 | true | `cbda1a81dc87361a66109afb1630140e8b1bf3d39e6123e0c99471aa3566a40a` | BYTE-EXACT |
| `candidate-application-preparation` | 17 | true | `8636b7f75873f02aef0a1df0f402e28a9480d992ca460a0377a4daab4a55c739` | BYTE-EXACT |
| `candidate-identity-review-decision` | 4 | true | `5510c5fd5d53897aba85b3060a53dde00804a1462fe1b21c7d8266df457ea1b8` | BYTE-EXACT |
| `candidate-identity-review-evidence-decision` | 2 | true | `822a0a33b403385f78c05e88b35b3cb04e4e1aff0dab6b185a3f5f7afaaf0ca6` | BYTE-EXACT |
| `candidate-identity-review-evidence-read` | 2 | true | `922078b54eeb65970853b52cee7632179c7448b0b882784f2b658b6766090715` | BYTE-EXACT |
| `candidate-identity-review-evidence-upload` | 4 | true | `2edc49a0da252eb4a1c55ba08282a4b30945b91e3e6ab55a179baf4eff8de791` | BYTE-EXACT |
| `candidate-identity-review-followup` | 2 | true | `57f19db658bcd77c810d1c4e2cf560d3f9044c73a2fc135ee378a45928f64445` | BYTE-EXACT |
| `candidate-identity-review-queue` | 3 | true | `5bbfccaba98363b821b20ad9c557936db43bc984415f16c53e02c70c4d4f3d06` | BYTE-EXACT |
| `candidate-identity-review-request` | 4 | true | `0088d8563477c7ff68124f66bf26a82997824d29deb6ce2aea9c10111d5368b1` | BYTE-EXACT |
| `candidate-identity-review-status` | 2 | true | `01c588b572d89984b45a35005645993aadf1081825c825921dbf554f4f80b2b9` | BYTE-EXACT |
| `candidate-master-profile` | 4 | true | `824ec08a6c9f21f7e33bd974ed21e2609419c73492721be18e7d1c02af977bf9` | BYTE-EXACT |
| `candidate-private-documents` | 17 | true | `04ba536c2a7d4a30f02ed1f3d0449b150a7ca5fbc4daf113b1556e2a7d16eb10` | BYTE-EXACT |
| `candidate-profile-review` | 3 | true | `06b06306da0ac16b778b138adee78787f900876594c447475cc8f03c026df9b6` | BYTE-EXACT |
| `candidate-save-verified-opportunity` | 4 | true | `4fa2199309074ce3db6b0e78757b1bfb6076e2e45faf5faaf301ba280d88e292` | BYTE-EXACT |
| `candidate-workspace-readiness` | 5 | true | `3cfe816c81252df062cfebfaf17be1d8b431f89c387d180e310a37c7ac9226a1` | BYTE-EXACT |
| `n07-airtable-enqueue` | 3 | true | `7e9cdb23150d7a3b2d0217beea7cd4624352eff67002640cc8a81f17a9f42605` | BYTE-EXACT |
| `n08-founder-control-plane-health` | 4 | true | `4d7ce0268d43c9162583c2b071642e890e7a18e7d257b7f0a9afa6bec5fe304f` | BYTE-EXACT |
| `n15-candidate-opportunities` | 3 | true | `0acbc93c3ad1af2d2f33cc76e1fb72f1369f73e49e81aacfab825a1303c0035f` | BYTE-EXACT |
| `n15-source-ingestion` | 3 | true | `6811334d276077b81b95c7b407c641235a68414d9768bb26fa4b4931025cf95f` | BYTE-EXACT |
| `payfast-sandbox` | 10 | false | `a4405200982d646cf195d5b894c7ce735b424529aba4ce1495a36fa9c8f9ff62` | BYTE-EXACT |

Additional exact helper:
- `supabase/functions/candidate-private-documents/document-signature.mjs` — 954 bytes; compared byte-for-byte with the deployed helper.

## Important execution boundaries

- `payfast-sandbox` intentionally has `verify_jwt=false` because it is the provider notification/webhook boundary. The deployed source is retained exactly. The function performs its own PayFast signature, merchant, source IP, amount, completion-state, replay and idempotency checks. Keep this endpoint sandbox-only until full independent ITN runtime proof is captured.
- The other 20 functions have `verify_jwt=true`.
- Service-role credentials remain server-side; do not put secrets in source, chat, logs or browser bundles.
- The recovered source is not proof that each endpoint has passed a live authenticated functional test. It closes the source-provenance gap only.
- No staging schema changes, data mutations, payment tests, function deployments or production actions were performed by this parity check.

## Reuse decision

Treat this branch's 21-function source set as the recovered reference copy for the rebuild. Review each function's table/RPC dependencies and authorization contract before consolidating or replacing any endpoint. Do not redeploy functions merely to make versions look uniform.
