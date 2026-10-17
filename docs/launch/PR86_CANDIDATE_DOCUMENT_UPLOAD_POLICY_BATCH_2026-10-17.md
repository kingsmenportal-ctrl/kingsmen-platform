# PR #86 — Candidate document upload policy

Date: 2026-10-17

## Added
- A pure upload-plan policy that validates server-resolved candidate/Auth UUIDs, document type, display name, correlation ID, MIME allowlist, and a 25 MiB maximum.
- Opaque storage keys use only the candidate UUID and a server-generated object UUID; client filenames and client-selected paths are not used as storage keys.
- A fixed five-minute expiry value is included as a contract for a future signer.
- Unit tests and a source-level validator.

## Deliberate limitations
- This policy does not prove candidate ownership itself: its caller must resolve the candidate from the verified identity link and check ownership before invoking it.
- It does not inspect actual file bytes, detect MIME spoofing, scan for malware, upload data, or issue a signed URL.
- A production adapter must enforce private bucket ACLs, server-side size/type checks, one-time/short-lived upload semantics where supported, and content scanning before a document is trusted.
- Candidate web document routes remain fail-closed. No production integration or live test is claimed.
