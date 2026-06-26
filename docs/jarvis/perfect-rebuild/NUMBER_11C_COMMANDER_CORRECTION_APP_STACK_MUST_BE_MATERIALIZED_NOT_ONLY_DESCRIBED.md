# NUMBER 11C — COMMANDER CORRECTION: APP STACK MUST BE MATERIALIZED, NOT ONLY DESCRIBED

Status: LOCKED
Owner: Commander
Scope: Correction after Number 11B
Reason: Commander identified that Number 11B repeated the same mistake as Number 11 by describing boundaries without materializing the operating registry strongly enough.

## 1. Correction accepted

The Commander said:

"So you did the same as number 11"

Correction accepted.

The error was that the app stack was described as doctrine, but the operating consequence was still too weak. A proper correction requires a materialized registry and validator, not only another explanation document.

This file locks that the Commander-supplied app stack must become an operating input for future numbers.

## 2. What was wrong

The wrong pattern was:

- write another doctrine explanation,
- say apps are listed,
- say future numbers must use them,
- but not create a concrete registry file,
- not create a validator,
- not make Lovable availability testable,
- not force future numbers to check the registry.

That is the same class of mistake as Number 11 being too soft about Lovable availability.

## 3. What was corrected now

The app stack is now materialized as:

- manifests/jarvis/jarvis-commander-app-stack.json

The validation rule is now materialized as:

- scripts/validators/validate-jarvis-commander-app-stack.mjs

The manifest records every Commander-listed app with:

- key,
- displayName,
- category,
- availability,
- routePurpose,
- allowedActions,
- blockedActions,
- dataBoundary,
- evidenceType,
- approvalRequired,
- sourceOfTruthStatus,
- hudChip.

The validator fails if:

- any Commander-listed app is missing,
- Lovable is not marked available like other apps,
- Lovable is treated as source of truth,
- Lovable does not block secrets,
- Lovable does not block raw candidate data,
- Airtable is not mirror-only,
- GitHub is not repo proof,
- futureNumbersMustUseThisRegistry is not true,
- external tools are allowed to receive secrets,
- external tools are allowed to receive raw candidate data,
- write actions do not require Commander approval.

## 4. Correct operating rule going forward

Future numbers must not freehand apps from memory.

Future numbers must use the app stack registry as the reference.

The apps/tools/connectors section of every future number must:

1. identify which apps from the registry are directly relevant,
2. identify which apps are not used and why when necessary,
3. preserve each app boundary,
4. preserve Lovable as available like other apps,
5. preserve Airtable as mirror-only,
6. preserve GitHub as repo proof,
7. preserve PostgreSQL/Truth Vault as internal truth,
8. preserve approval gates for write/risky actions,
9. preserve no secrets and no raw candidate data to external tools,
10. preserve evidence type distinctions.

## 5. Lovable correction remains active

Lovable must not be treated as merely conceptual.

Lovable must be present in:

- manifest registry,
- tool route law,
- HUD app/tool connector stack,
- validator checks,
- future numbers where UI/app prototyping is relevant.

Lovable remains:

- available like other apps,
- controlled prototype route,
- not source of truth,
- not GitHub replacement,
- not PostgreSQL replacement,
- not secret store,
- not raw candidate data destination,
- not production proof by itself.

## 6. No movement to Number 12 yet

This correction stays inside the Number 11 correction lane.

The sequence must not move to Number 12 until the app stack accuracy lock is accepted as materialized.

## 7. Completion rule

This correction is complete only when:

- the Commander app stack registry exists,
- the validator exists,
- Lovable is testably marked available like other apps,
- future number generation uses the registry,
- Jarvis stops repeating app lists as loose doctrine,
- Jarvis treats the app stack as a command routing input.

This file records the correction and prevents repeating the Number 11 mistake.
