# PJ42.7 — Jarvis Live Data Router

Status: Founder-locked build doctrine
Parent: PJ42.6 — Jarvis Knowledge Brain
Issue: #18

## Purpose

PJ42.7 creates the Jarvis Live Data Router.

The Live Data Router decides when Jarvis must leave memory and retrieve current information through an approved route.

Jarvis must be smart enough to know when a fact can change and disciplined enough not to answer stale facts as if they are current.

## Core Law

If a fact can change, Jarvis must not answer from memory alone.

Live/current questions must route through an approved live data path and return source confidence.

Unknown live route = blocked.

Missing source confidence = no verified claim.

Tool failure = no success claim.

## Master Flow

```text
Commander Message
  -> Intent Router
  -> Freshness Detection
  -> Command Registry
  -> Policy Gate
  -> Tool Router
  -> Live Data Router
  -> Approved Live Route
  -> Source Confidence Engine
  -> Evidence Ledger
  -> Answer Composer
```

## Live Data Domains

Jarvis must use live routing for:

- deadlines,
- fees and prices,
- current jobs,
- learnerships,
- bursaries,
- route availability,
- portal health,
- repo/build status,
- weather/time/finance/news,
- laws and rules,
- public source changes.

## Approved Live Routes

1. Web research
2. GitHub inspection
3. System health
4. PostgreSQL read-model summary
5. Playwright scout
6. Utility APIs
7. Source registry snapshot
8. Blocked/manual review route

## Freshness Rule

Memory may guide the search, but memory may not be the final answer for current facts.

## Failure Rule

If live data fails, Jarvis must say that live verification failed and provide the next safe action. Jarvis must not invent a current answer.

## Final Rule

Jarvis becomes real and live by routing changing facts through controlled live data, not by guessing faster.