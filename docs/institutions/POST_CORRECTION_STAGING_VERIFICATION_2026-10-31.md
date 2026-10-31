# Post-correction staging verification — 2026-10-31

This is a follow-up to `docs/institutions/MIGRATION_AND_FRESHNESS_RECONCILIATION_2026-10-31.md`.

## Verified after correction

Read-only SQL against the live staging database returned exactly these availability counts:

| Availability status | Rows |
|---|---:|
| `CLOSED` | 6 |
| `MANUAL_CHECK_REQUIRED` | 2 |
| `OPEN` | 0 |

The six rows marked `CLOSED` all have `metadata.closing_date=2026-10-30` and `metadata.availability_guard_action=AUTO_CLOSED_EXPIRED_DEADLINE`. This confirms the expired listings are no longer presented in the database as open. The remaining two are CAO and NSFAS support anchors with manual-check-required status.

## What this does and does not prove

- Proves: staging no longer contains any programme row marked `OPEN` in the current eight-row route inventory.
- Does not prove: the public website consumes this exact table; cache invalidation or UI rendering has been checked; any application connector works; CAO/NSFAS has a currently open opportunity; or the candidate journey has passed.
- Do not reopen any expired labour listing without a new authoritative source check of the exact vacancy, date/cutoff, requirements and route.

## Remaining change-control blockers

Independent reviewer identities have not been established in the repository's available collaborators/org context. A repository owner cannot satisfy an independent review requirement by approving their own changes. The staging database has no recorded restore-drill evidence, and the current tool access did not provide a verified encrypted backup archive plus isolated restore execution. Therefore migrations 0096–0098 and imports 0099–0106 remain unapplied; the next required inputs are a qualified external GitHub reviewer and authorized backup/restore/change-control evidence.

The readiness PR's prior exact-head checks passed at SHA `754820ff4ae0bbafb5418cdf600f62b309049457`; the later documentation commits have not returned new PR-triggered workflow runs, so those prior checks must not be represented as checks on the latest commit.
