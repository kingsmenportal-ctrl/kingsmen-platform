# Candidate Ownership Integrity Gate — 2026-10-17

## What changed in this batch

- Corrected the candidate ownership/application integrity validator's document-route regular expressions. The previous patterns escaped whitespace twice, so they could fail to detect missing status and signed-URL boundary assertions.
- Added the root command `npm run candidate:validate:ownership-integrity` so the check is discoverable and can be included in local/CI verification.

## Scope of this gate

This is a static source-contract check only. It checks that:
- candidate applications require a configured identity provider and server-verified identity;
- signed-out callers receive 401 and an authenticated user without a verified candidate-profile link receives 503;
- application lifecycle outcomes are evidence-gated and declare audit/atomic-persistence requirements;
- document upload, read, and status routes stay blocked until candidate authorization and private storage are actually wired.

## Not claimed

The GitHub connector cannot execute this Node validator in the repository runtime. No validator pass, build, browser test, database-policy test, or current-head CI pass is claimed by this commit. The corrected patterns need to be exercised by the repository's test runner.

## Remaining blockers before candidate tracker/document access can be enabled

1. Establish a reviewed, unique Supabase Auth user ID → candidate profile mapping in the actual schema; never map by email alone.
2. Implement owner-scoped application persistence and transactional audit writes; enforce ownership at the database boundary (including RLS where applicable).
3. Implement private document storage and authorization before issuing signed upload/read URLs.
4. Add integration tests for two distinct test candidates, cross-candidate reads/writes, signed-out requests, missing profile mapping, and storage access.
5. Verify the API lockfile/reproducible install, migrations, backup/restore rehearsal, and latest-head CI.

## Safety decision

The application and document routes remain fail-closed. Do not return an empty application list as a substitute for failed authorization, and do not represent source-level assertions as runtime security proof.
