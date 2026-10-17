# PR #86 — Candidate application tracker UI batch

Date: 2026-10-17

## Delivered
- Updated the candidate application page to render validated rows from a successful authenticated API response.
- Shows internal reference, route type, tracker state, portal health, source-confidence band, update time, and MAP fallback flag.
- Includes explicit loading, signed-out, unlinked, unavailable, malformed-response, and authenticated-empty states plus retry.
- Validates every returned row and fails closed if any row has an unexpected shape.
- Labels records as internal tracker state and explicitly avoids presenting them as proof of external submission, admission, employment, payment, or official decisions.

## Integration boundary
The Next.js `/api/candidate/applications` route still intentionally returns a profile-link-required response after Supabase authentication. This UI change does not bypass that authorization boundary. Real rows will render only when the route is safely connected to an owner-scoped service and returns the documented shape.

## Verification
A source validator was added and registered. It has not been executed in this commit session; no build or browser test is claimed.
