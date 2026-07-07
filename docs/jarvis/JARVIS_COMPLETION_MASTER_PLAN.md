# JARVIS COMPLETION MASTER PLAN

Status: ACTIVE PROCEDURE — supersedes ad-hoc chat instructions.
Purpose: the exact, ordered steps to take Jarvis from its current state to fully
matching `docs/jarvis/JARVIS_LOCKED_PRODUCT_SPEC.md`, with nothing faked and
nothing skipped.

**Put this file at `docs/jarvis/JARVIS_COMPLETION_MASTER_PLAN.md` in the repo.**
Every future Jarvis session — ChatGPT, Claude, Claude Code, whoever — reads
this file FIRST, before writing any code.

---

## 0. GROUND RULES (non-negotiable, apply to every phase below)

Paste this block at the start of every session, before any phase prompt:

```
Before doing anything else, read:
1. docs/jarvis/JARVIS_LOCKED_PRODUCT_SPEC.md
2. docs/jarvis/JARVIS_COMPLETION_MASTER_PLAN.md (this file)
3. The specific phase section below that we are working on.

Rules for this entire session:
- One phase at a time. Do not start the next phase until the current phase's
  "Definition of Done" is fully met and I have explicitly confirmed it.
- No rewrites of working files. Prefer the smallest possible diff. If a change
  can be done in CSS only, do it in CSS only — do not touch the .tsx logic.
- Before editing any file, restore it fresh from origin/main first
  (git checkout origin/main -- <file>), so we never build on top of a
  previously broken/half-edited version.
- No hardcoded numbers, statuses, or claims. Every number/status shown to the
  user comes from a real API call, or displays literally "adapter-gated" or
  "proof-needed" if no real data source exists yet.
- After every code change: run the validators listed in the phase. Do not
  commit if any validator fails.
- After every deploy: run the live proof check listed in the phase, which
  must include BOTH a check that old/wrong content is gone AND a check that
  the new real content is actually present. "HTTP 200" is never proof by
  itself.
- Before any deploy, run the shadow-file audit (Section 1 below). This has
  broken the build silently multiple times already.
- If a build or validator fails, fix the SPECIFIC reported error only. Do not
  regenerate the whole file from scratch as the first response to a failure.
- Do not claim a phase is complete in words alone. State the exact validator
  output and live proof output that supports the claim.
- If you are about to produce a single script longer than ~150 lines, stop
  and split it into two smaller steps instead.
```

---

## 1. SHADOW-FILE AUDIT (run before every single deploy, permanently)

This exact bug — a stale file under `apps/web/public/**` silently overriding
a real Next.js route — has already cost multiple full days. Check for it
every time, not just once.

```powershell
cd C:\Kingsmen\kingsmen-platform-claude
git ls-files apps/web/public | Select-String "index.html"
```

**Definition of Done:** the only results allowed are files under
`apps/web/public/jarvis/reports/`. Anything else (e.g. another
`index.html` under a route folder) must be investigated and removed before
continuing, using the same method that fixed `/jarvis`:
1. Confirm the real route file (`page.tsx`) renders the real component.
2. Delete the shadow file in `public/`.
3. Patch any generator script so it can never write that file again.
4. Rebuild, validate, deploy, live-check.

---

## 2. UNIVERSAL VALIDATION COMMANDS (run after every phase's code change)

```powershell
cd C:\Kingsmen\kingsmen-platform-claude
Push-Location apps\web
npm run build
Pop-Location
npm run jarvis:validate
npm run jarvis:validate:core
npm run web:validate:backend-boundary
```

All four must pass with exit code 0 before committing.

## 3. UNIVERSAL LIVE PROOF TEMPLATE (run after every phase's deploy)

```powershell
$liveUrl = "https://kingsmen-jarvis-command-zungu.netlify.app/jarvis?proof=$(Get-Date -Format yyyyMMddHHmmss)"
$html = (Invoke-WebRequest -Uri $liveUrl -UseBasicParsing -TimeoutSec 60).Content

# Negative check — old/wrong content must be gone
if ($html -match "Static Live Surface" -or $html -match "Jarvis Agent Function" -or `
    $html -match "Premium Command House" -or $html -match 'src="/jarvis-os/jarvis-os.html"') {
  throw "FAILED: old or shadow content still present."
}

# Positive check — real content must be present (customize per phase, see below)
if ($html -notmatch "JarvisHudClient|Kingsmen Command|api/jarvis/status") {
  throw "FAILED: no real Jarvis content marker found. Do not trust this as success."
}

Write-Host "LIVE PROOF PASSED" -ForegroundColor Green
```

Each phase below adds its OWN additional positive check specific to what
that phase built — append it to this template, don't replace it.

---

## PHASE 1 — Confirm current real baseline (no code changes)

**Goal:** know exactly what's true right now before building anything else.

**Prompt for ChatGPT:**
```
Report only, change nothing.
1. Show apps/web/src/app/jarvis/page.tsx in full.
2. Confirm it renders JarvisHudClient and contains no iframe.
3. Run the shadow-file audit from JARVIS_COMPLETION_MASTER_PLAN.md section 1
   and report the result.
4. Show apps/web/src/app/jarvis/JarvisHudClient.tsx — confirm it has exactly
   one `export default function JarvisHudClient`.
5. List which sections from JARVIS_LOCKED_PRODUCT_SPEC.md section 5
   (Function Lock, items 1-10) currently render real API data vs.
   hardcoded/placeholder vs. not present at all.
6. Report back as a table: Section | Present | Real data or placeholder.
```

**Definition of Done:** you have an honest table of all 10 Function Lock
sections and their real state. Update the Section Approval Tracker in
`JARVIS_LOCKED_PRODUCT_SPEC.md` section 7 to match reality before proceeding.

---

## PHASE 2 — Voice, honestly (browser-native only)

**Goal:** Section 2 of the locked spec (Identity Lock) — speak, listen, wake,
honest unsupported states. No external voice service needed or wanted here.

**Prompt for ChatGPT:**
```
In JarvisHudClient.tsx only, ensure these exist (add only what's missing,
do not rewrite the whole file):
- A "Voice Link" panel with three states: idle, listening, speaking, and
  unsupported.
- Wake/greet button uses window.speechSynthesis directly. If
  "speechSynthesis" not in window, show "VOICE_UNAVAILABLE" and do not
  pretend it worked.
- Listen button uses window.SpeechRecognition or webkitSpeechRecognition.
  If neither exists, show "LISTENER_UNAVAILABLE" and do not pretend it
  worked.
- No external voice API, no hardcoded audio file playback claiming to be
  Jarvis speaking live.
Show me the diff before applying it.
```

**Validation:** Section 2 universal commands.

**Live proof addition:**
```powershell
if ($html -notmatch "VOICE_UNAVAILABLE|LISTENER_UNAVAILABLE|SpeechRecognition|speechSynthesis") {
  throw "FAILED: no honest voice state markers found in live HTML/JS bundle."
}
```

**Definition of Done:** on a browser/device where mic or speech isn't
available, Jarvis says so — it never silently fails or fakes a response.
Mark this row done in the Section 7 tracker only after you've personally
tested both the working and the "unavailable" path.

---

## PHASE 3 — One real number, end to end

**Goal:** prove the full chain (browser → `/api/jarvis/status` or
`/api/jarvis/command` → backend API → Postgres/Truth Vault → back to screen)
works with real data, before wiring anything else.

**Prompt for ChatGPT:**
```
Pick the single simplest real data point available right now — for example,
total candidate count from readCandidateStatus, or the count of entries in
the evidence ledger. Confirm which is actually queryable today given the
current Truth Vault storage mode (memory or postgres).

Wire exactly one number in JarvisHudClient.tsx's Mission Stats panel to this
real source via the existing /api/jarvis/status route. If the API doesn't
expose this number yet, add the smallest possible addition to
apps/api/src/api routes to expose it — do not add unrelated fields.

If Truth Vault storage mode is memory_development_only, say so explicitly in
your response, and confirm the number will read 0 or empty until Postgres
mode is enabled — do not fabricate a number to make it look populated.
```

**Live proof addition:**
```powershell
# Confirm the panel shows either a real number or an honest "proof-needed" state,
# never a hardcoded decorative number like the 47/128/86 style seen in mockups.
```

**Definition of Done:** you can restart the backend, and the number on
screen changes (or honestly reads empty/zero) based on real Truth Vault
state — not a number that stays the same no matter what the database says.

---

## PHASE 4 — OpenClaw Gateway panel (real, not decorative)

**Goal:** Function Lock item 2.

**Prompt for ChatGPT:**
```
Show me the real OpenClaw-related code: packages/jarvis-core/src/jarvis-policy-gate.ts,
jarvis-command-runner.ts, jarvis-evidence-ledger.ts.

Wire the OpenClaw Gateway panel in JarvisHudClient.tsx to call a real command
through /api/jarvis/command (e.g. OPENCLAW_GRIP_CHECK per the existing quick
command list) and display the real JarvisDecision (ALLOW / DRY_RUN_ONLY /
APPROVAL_REQUIRED / BLOCK) and reasonCode returned by the policy gate.

Do not display "adapter-gated" here if the policy gate itself is real and
answering — only use that label for genuinely unconnected external services.
```

**Definition of Done:** clicking the OpenClaw panel's check button in the
live app shows a real decision code that changes if you send a different
command (e.g. one that matches a blocked pattern vs. one that's SAFE_READ).

---

## PHASE 5 — Playwright Scout panel

**Goal:** Function Lock item 3.

**Prompt for ChatGPT:**
```
Confirm whether a real Playwright scout/probe script exists and can run in
this environment right now (check data/ and scripts/ for a scout runner).

If yes: wire the panel to trigger it and show real last-run status/timestamp.
If no real scout exists yet, or it can't run from this web context: the panel
must say "proof-needed" honestly — do not simulate a scout run.
```

**Definition of Done:** the panel's label matches reality exactly — if there
is no real Playwright integration reachable from the web app, it says so.

---

## PHASE 6 — Oracle Lite Runtime panel

**Goal:** Function Lock item 4.

**Prompt for ChatGPT:**
```
Check for a real local runtime health endpoint (Oracle Lite / local Commander
runtime). If apps/api exposes a health check reachable from the web app via
KINGSMEN_BACKEND_BASE_URL, wire this panel to it.

If Oracle Lite only exists as local PowerShell scripts with no web-reachable
endpoint, the panel must say "local runtime — proof-needed from this web
surface" rather than claiming a false connection.
```

**Definition of Done:** no false "runtime verified" claim exists unless a
real HTTP check actually succeeded moments before rendering.

---

## PHASE 7 — Kingsmen Work Map (N00–N20)

**Goal:** Function Lock item 5 — replace any static list with real per-module
status pulled from `manifests/` or `reports/` where those exist.

**Prompt for ChatGPT:**
```
List every N00-N20 related manifest/report file that actually exists in the
repo right now with real passed/failed/pending status (you have many of
these already from launch-readiness work).

Build a small read-only API route that assembles these into one JSON object:
module id, name, status (built / validated / blocked / not_started), based
ONLY on real file contents — never inferred or guessed.

Wire the Work Map grid in JarvisHudClient.tsx to this route. Modules with no
real manifest yet must show "not_started", never a fabricated status.
```

**Definition of Done:** the grid's status per module matches what
`kingsmen:launch:audit` and existing manifests actually say, verifiable by
you cross-checking three random modules by hand.

---

## PHASE 8 — Candidate Operations snapshot

**Goal:** Function Lock item 6.

**Prompt for ChatGPT:**
```
Wire this panel to real counts from the Truth Vault repository methods that
already exist (readCandidateStatus, readApplicationWorkbench, or aggregate
queries you add following the same repository pattern).

If storage mode is still memory_development_only, the panel must show
"0 — memory mode, not persisted" rather than any other number.
```

**Definition of Done:** same restart test as Phase 3 — numbers reflect real
persisted state, not app-session memory that resets.

---

## PHASE 9 — Route Universe map

**Goal:** Function Lock item 7.

**Prompt for ChatGPT:**
```
Check ROUTE-WORKBENCH related tables/manifests (route universe, source
registry) for real data. Wire the map/list to real counts per route type
(CAO, NSFAS, TVET, SETA, bursary, employer) if that data exists in Postgres
or a manifest.

If the Route Workbench layers aren't built yet per the master layer index,
this panel must say "route universe — not yet built" rather than showing
placeholder pins.
```

**Definition of Done:** matches Section 1 baseline finding from Phase 1 —
no invented map data.

---

## PHASE 10 — Provider Matrix (real per-provider checks)

**Goal:** Function Lock item 8 — this is the one place where "adapter-gated"
is often the honest and correct answer, but verify per provider rather than
blanket-labeling everything gated.

**Prompt for ChatGPT:**
```
For each provider already connected with real credentials in this
environment (confirmed earlier: GitHub, Netlify, Airtable, Supabase [inactive],
Neon [no projects], Catalyst, OpenAI, Lovable) — check if a real, lightweight
status check is possible (e.g. GitHub: confirm repo reachable; Netlify: confirm
site ID resolves; Supabase: confirm project active or inactive; Neon: confirm
project exists or not).

Wire the Provider Matrix to real per-provider checks where possible. Where a
real check truly isn't feasible from this web surface, keep the label
"adapter-gated / proof-needed" — but do not apply that label to a provider
that could trivially be checked for real.
```

**Definition of Done:** at least GitHub, Netlify, Supabase, and Neon show
real live-checked status (even if that status is "inactive" or "no
projects") rather than a uniform gated label across the board.

---

## PHASE 11 — Founder Command Plane

**Goal:** Function Lock item 10.

**Prompt for ChatGPT:**
```
Wire the Founder Command Plane's quick-action buttons to real commands
already defined in the Jarvis command registry (SYSTEM_VALIDATE_N20,
DB_LEDGER_CHECK, QUEUE_HEALTH_CHECK, INCIDENT_REVIEW, etc.) via the existing
/api/jarvis/command route. Each button press must show the real returned
decision/result, not a canned success message.
```

**Definition of Done:** pressing two different quick commands produces two
different real results, not the same static confirmation text.

---

## PHASE 12 — Evidence & Proof Centre

**Goal:** Function Lock item 9.

**Prompt for ChatGPT:**
```
Wire this panel to the real evidence ledger (jarvis-evidence-ledger.ts /
evidence_ledger table if Postgres mode is on). Show the last N real evidence
events with their real event types and timestamps.

In memory mode, show real in-memory events generated during this session
(not fabricated historical ones), clearly labeled as memory-mode/non-persistent.
```

**Definition of Done:** triggering an action elsewhere in the app (e.g. a
command from Phase 11) causes a new real entry to appear here.

---

## PHASE 13 — Final consolidated audit

**Goal:** confirm the whole Jarvis surface matches the locked spec, honestly.

**Prompt for ChatGPT:**
```
Go through JARVIS_LOCKED_PRODUCT_SPEC.md section 5 (all 10 Function Lock
items) and section 7 (Section Approval Tracker). For each row, state:
- Built: yes/no
- Deployed: yes/no, with live URL checked just now
- Wired to real data: yes/no, with specific evidence (API route name, or
  manifest file, or "still memory mode" honestly stated)

Do not mark anything "done" that hasn't been personally verified live in
this response.
```

**Definition of Done — JARVIS IS COMPLETE when:**
- Every row in the Section 7 tracker is Built = yes, Deployed = yes.
- Every number/status on the live page is either real-data-backed or
  explicitly and correctly labeled "proof-needed."
- The shadow-file audit (Section 1) is clean.
- You (Commander) have opened the live URL yourself and confirmed it matches
  the locked visual spec AND behaves correctly (voice, commands, evidence
  updating live) — not just "looks right in a screenshot."

---

## CHANGE LOG

- v1 — initial master plan created after PR #53/#54 fixed the public/
  static-file route shadow bug, to prevent further scope drift and repeated
  black/white regressions.