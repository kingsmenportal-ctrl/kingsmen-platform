#!/usr/bin/env bash
set -Eeuo pipefail

# Guarded stabilization runner.
# This script prepares local evidence directories and checks prerequisites.
# It deliberately does NOT apply database migrations, restore databases,
# create cloud projects, run staging E2E against guessed URLs, split/merge PRs,
# or claim any gate has passed. Those steps require reviewed SQL and verified
# environment-specific evidence.

readonly EXPECTED_BRANCH="fix/kingsmen-ci-real-validation-gates"
readonly EXPECTED_BASE_PREFIX="7c97d21a"
readonly STAGING_REF="euhubhhnumtibbyufghm"

die() { printf 'BLOCKED: %s\n' "$*" >&2; exit 2; }
note() { printf '\n== %s ==\n' "$*"; }

note "Kingsmen guarded stabilization runner"
command -v git >/dev/null || die "git is required"
[[ -d .git ]] || die "Run from the repository root"
branch="$(git branch --show-current)"
[[ "$branch" == "$EXPECTED_BRANCH" ]] || die "Expected branch $EXPECTED_BRANCH, found $branch"
head="$(git rev-parse HEAD)"
printf 'Branch: %s\nHEAD: %s\nExpected baseline prefix: %s\n' "$branch" "$head" "$EXPECTED_BASE_PREFIX"
if [[ "$head" != "$EXPECTED_BASE_PREFIX"* ]]; then
  printf 'NOTICE: HEAD differs from the requested baseline; continuing in audit-only mode.\n'
fi

note "Prepare evidence locations (no evidence is fabricated)"
mkdir -p evidence/backup-restore evidence/finance-baseline evidence/staging-2026-10-16 evidence/release-review
[[ -f evidence/README.md ]] || die "Missing evidence/README.md; review and create it before continuing"

note "Check current tracked files"
git status --short
printf '\nMigration files currently present:\n'
find supabase/migrations -maxdepth 1 -type f -print 2>/dev/null | sort || true
printf '\nFinance-related test files currently present:\n'
find . -type f \( -iname '*finance*.test.*' -o -iname '*finance*.spec.*' -o -iname '*ledger*.test.*' -o -iname '*ledger*.spec.*' \) \
  -not -path './node_modules/*' -not -path './.git/*' -print | sort || true

note "Safety gates"
printf 'Staging project reference: %s\n' "$STAGING_REF"
printf '%s\n'   "NOT RUN: backup/restore rehearsal"   "NOT RUN: finance baseline tests"   "NOT RUN: migrations 0031–0035"   "NOT RUN: authenticated staging Playwright tests"   "NOT VERIFIED: PayFast sandbox, communications provider, runtime secrets health"   "BLOCKED: launch readiness until dated, reviewed evidence is collected"

cat <<'NEXT'
Next safe steps:
1. Inspect the exact live migration history and review each migration SQL file against the deployed schema.
2. Complete and record a backup AND restore into a separate disposable project before any migration application.
3. Locate the repository's actual finance package/test paths and run existing tests; record real output and exit code.
4. Confirm the staging URL, app selectors, authenticated Supabase client setup, dedicated test users, and safe test cleanup before running Playwright.
5. Apply migrations only after the above checks pass and an explicit operator confirms the target is staging.
6. Re-run the existing Source Guard without weakening or bypassing it.
NEXT

note "Audit-only run complete; no database or pull request was modified"
