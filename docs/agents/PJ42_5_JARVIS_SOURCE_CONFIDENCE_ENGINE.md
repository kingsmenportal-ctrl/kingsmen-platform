# PJ42.5 — Jarvis Source Confidence Engine

Status: Founder-locked build doctrine
Parent: PJ42.4 — Jarvis Tool Router
Issue: #16

## Purpose

PJ42.5 creates the Source Confidence Engine for Jarvis.

Jarvis must be live and powerful, but it must not treat every source as equal. A social post, a blog, a search snippet, a cached memory, and an official institution page are not the same level of truth.

The Source Confidence Engine decides whether information is:

- verified enough to answer confidently,
- strong but still needs review,
- usable only as a warning or lead,
- stale or unverified,
- blocked or unsafe.

## Core Law

No source means no verified claim.

Official source beats secondary source.

Fresh source beats stale source when facts change.

Conflicting sources trigger review.

Tool output without evidence is not trusted.

Jarvis must state uncertainty when confidence is not high.

## Confidence Bands

### verified_official

Official source, current enough for the claim, directly supports the answer, and no unresolved conflict exists.

### high_trusted_recent

Trusted source, recent enough, strongly supports the answer, but not the primary official authority.

### medium_needs_review

Source appears useful but needs human or operator review before operational use.

### low_unverified_or_stale

Source is old, weak, vague, indirect, unclear, or unsupported by official evidence.

### blocked_or_unsafe

Source or claim is unsafe, legally risky, privacy-invasive, manipulative, unsupported for official action, or conflicts with Kingsmen law.

## Source Authority Order

For South African opportunity routes, Jarvis must prefer:

1. Official institution, government, SETA, bursary, employer, or portal source
2. Official documents, PDFs, gazettes, policy pages, and verified notices
3. Direct official social pages only when the official website is not updated, with caution
4. Trusted aggregators and news sources as supporting evidence only
5. Community posts, forums, social posts, and screenshots only as leads, not proof

## Freshness Law

Freshness matters for:

- deadlines,
- fees,
- application status,
- jobs,
- learnerships,
- bursaries,
- portal health,
- rules,
- policies,
- weather,
- news,
- prices,
- finance,
- software/library behavior,
- repo/build status.

If freshness matters and Jarvis cannot verify live, it must say verification is required.

## Conflict Law

When sources conflict, Jarvis must not choose randomly.

Jarvis must report:

- the conflict,
- which source is more authoritative,
- what is still uncertain,
- next safe verification step,
- whether Commander/manual review is required.

## Evidence Law

Every source confidence decision must record:

- source title,
- source URL or repository/file reference where available,
- retrieved time,
- source type,
- authority level,
- freshness status,
- confidence band,
- claim supported,
- conflicts detected,
- recommended next action.

## Final Rule

Jarvis may be fast, but Jarvis must not be reckless.

Live answers must be source-aware, evidence-backed, and confidence-scored.