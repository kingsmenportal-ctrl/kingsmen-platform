# N05 authenticated staging isolation test

This test is intentionally separate from source-only CI. It requires a deployed staging build and two dedicated staging candidate accounts; do not use real candidate records.

## Required environment

- `N05_BASE_URL`: staging origin, without a trailing slash.
- `N05_CANDIDATE_A_TOKEN`: current Supabase access token for candidate A.
- `N05_CANDIDATE_B_TOKEN`: current Supabase access token for candidate B.
- `N05_CANDIDATE_A_DOCUMENT_ID`: an active document record owned by candidate A.

Never put tokens in source control, issue comments, build logs, or chat. Supply them through a protected local shell or a protected CI secret store. Do not use a service-role key for either candidate token.

## Run

```sh
npm run n05:test:isolation
```

The harness checks that unauthenticated status access is denied, both candidates resolve separate candidate records, their document lists do not overlap, candidate B receives `404 DOCUMENT_NOT_FOUND` when attempting to read candidate A's document, and candidate A can receive a 10-minute signed read URL for their own active document.

The owner-read check creates a normal `FILE_ACCESSED` audit event and issues a temporary signed URL. The harness does not upload, delete, or modify document records. Use a dedicated synthetic document.

A missing variable is a blocked test (exit code 2), not a pass. A failed assertion exits non-zero. This integration test is not production-readiness evidence until it has been run against the actual protected staging deployment and its output has been reviewed.
