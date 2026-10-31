# N15 date-only deadline support — 31 October 2026

This change adds generic date-only closing-date support. It does not import or publish any opportunity rows.

- Migration: `db/migrations/0090_n15_date_only_deadline_support.sql` adds nullable `closes_on date`, prevents simultaneous use with `closes_at`, and adds a partial index for confirmed date-only deadlines.
- Candidate feed: timestamp deadlines continue to use timestamp comparison; date-only deadlines compare against the current calendar date in `Africa/Johannesburg`.
- Candidate UI: date-only deadlines render as `DD/MM/YYYY` text and explicitly state that the source supplied no closing time. They are not converted to synthetic timestamps.
- Test: `scripts/staging/test-n15-date-only-deadline-support.mjs` checks migration safety, local midnight boundary handling, same-day/expired dates, and UI formatting. It does not connect to or mutate Supabase.

The PR does not seed the separate DBE vacancy batch. Exact vacancy identifiers, advert content, closing date/time and current status need current authoritative verification before any data import. The DBE seed must not be applied with this schema-only change.

Migration application remains subject to independent review, the protected backup/isolated-restore gate, formal change approval and founder authorization. No opportunity import, candidate matching, notifications, provider route activation, deployment or provider submission is authorized by this change.
