# Trusted candidate identity provisioning

This is an operator-only procedure. There is deliberately no public HTTP endpoint for identity binding.

## Preconditions
- Work against the explicitly selected staging project first.
- Verify the person owns the candidate account using the approved operational identity-check process. Do not use email equality alone to claim a candidate record.
- The person must complete Supabase Auth email verification before binding.
- Obtain the exact candidate UUID from the authorized candidate-management workflow and the Auth user UUID from the verified Auth account.
- Confirm the candidate is not already linked. The database function also enforces this and refuses reassignment.

## Execute
Run from a trusted operator environment, never a browser or public CI job. Keep the service-role key in the operator's secret manager or shell environment; never commit it, paste it into chat, or print it.

```sh
CANDIDATE_ID="<exact-candidate-uuid>" \
SUPABASE_AUTH_USER_ID="<verified-auth-user-uuid>" \
SUPABASE_URL="https://<staging-project-ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<loaded-from-secret-manager>" \
node scripts/provision-candidate-auth.mjs
```

The script requires HTTPS and exact UUIDs, calls only the privileged binding RPC, times out, and does not print the service-role key or raw database errors. A successful HTTP response is not by itself proof of the full candidate journey.

## Verify and record
Using the staging database's authorized SQL console, confirm the exact pair:
```sql
select candidate_id, auth_user_id
from public.candidate_accounts
where candidate_id = '<exact-candidate-uuid>'::uuid;
```
Do not export unrelated candidate data. Record operator, timestamp, ticket/reference, and the redacted outcome in the approved audit system.

## Required follow-up before launch
- Test with two distinct verified test accounts and prove each account cannot read or modify the other's candidate rows/documents.
- Test login, logout, expired sessions, and the candidate Apply-Now journey against staging.
- Do not mark RLS/runtime launch gates passed until their evidence is captured and reviewed.
