# Kingsmen Portal — Candidate Ownership and Application Integrity Batch

Date: 2026-10-17
Branch: `feat/phase-a1-public-destiny-auth-foundation`
Validator commit: `67b1239b1ebb7a352dd964d1bcb35f21a3b29a31`

## Scope
Added `scripts/validators/validate-candidate-ownership-and-application-integrity.mjs` as a static source-contract regression gate for candidate application access and document security boundaries.

## Checks encoded
- Candidate applications route checks server-side auth configuration and verified identity.
- Signed-out requests are represented as 401, not as an empty application list.
- Authenticated identity without a verified candidate-profile mapping fails closed with 503.
- The application lifecycle policy declares all nine lifecycle states and evidence mismatch/required behavior.
- The lifecycle policy explicitly communicates audit and atomic persistence obligations to its caller.
- Regression source includes invalid-transition, missing-receipt, fabricated-outcome, audit/persistence, and closure coverage.
- Candidate document upload/read signing and status routes remain unavailable (503, no-store) until candidate ownership and a real private storage signer exist.

## Evidence classification
This is a **static source-contract validator**. It does not prove that the validator has been executed, that TypeScript compiles, that runtime routes behave as expected, that database row-level security is correct, or that a storage provider is configured. Those must be separately tested.

## Known blockers
- No trusted Supabase-user-to-candidate profile mapping is wired into the applications route.
- Application tracker persistence, transactional audit writes, and cross-candidate authorization tests are still absent.
- Document routes remain intentionally blocked pending verified identity, owner-scoped metadata and private storage signing.
- API lockfile/reproducible install and backup/restore rehearsal remain unverified.
- Payment and notification providers lack live evidence.
- Latest-head CI status must be verified after this commit.

## Safety
PR #86 stays open and unmerged. No deployment, migration, secret change, production configuration change, or live integration activation was performed.
