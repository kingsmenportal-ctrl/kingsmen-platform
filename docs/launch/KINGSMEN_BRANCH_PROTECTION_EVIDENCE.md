# Main branch protection evidence capture

This is a **read-only verifier**, not a settings mutator. It requests the GitHub branch-protection endpoint for `main` using the workflow token and emits a redacted JSON report at:

`reports/repo/main-branch-protection-apply-latest.json`

It checks all five release-contract requirements:

1. `source-guard` is a required status check.
2. At least one approving pull-request review is required.
3. Admin enforcement is enabled.
4. Force pushes are disabled.
5. Branch deletion is disabled.

The report includes the HTTP status, pass/fail booleans, timestamp, and SHA-256 digest of its canonical fields. It never includes the token or raw API response. The report always sets `reviewed: false`; a passing API response is evidence of current configuration, not founder review or final assembly approval.

Run it from GitHub Actions → **Kingsmen Main Branch Protection Evidence** → **Run workflow**. The workflow is intentionally manual so a permissions or configuration gap does not make every pull request fail. Its artifact is retained for 14 days.

Interpretation:
- `VERIFIED_REQUIRED_PROTECTION_ACTIVE`: all five controls were observed active.
- `BLOCKED_PROTECTION_INCOMPLETE`: the endpoint was readable, but at least one control is absent.
- `UNVERIFIED_PERMISSION_DENIED`: the workflow token cannot read branch protection; no claim about actual configuration is justified.
- `BLOCKED_PROTECTION_NOT_FOUND_OR_NOT_VISIBLE`: GitHub returned 404; protection may be absent or the token may lack visibility.

A failed or unverified result must not be edited into a passing report. If protection is incomplete, an authorized repository administrator must apply the settings and then rerun this workflow. The report must be reviewed before final assembly.
