# Live Edge Function source baseline — Supabase staging — 29 October 2026

Captured directly from the active Supabase project `euhubhhnumtibbyufghm`. Supabase `ezbr_sha256` digests below identify the deployed source at capture time; they are not deployment/test evidence for the current Git branch.

| Function | Live version | Supabase deployed-source digest | Git source disposition |
| --- | ---: | --- | --- |
| `candidate-application-preparation` | 15 | `cfe8b6374f655a31b615447d3dedbd6dcfcc668afe4a28199b038879b199457a` | `supabase/functions/candidate-application-preparation/index.ts` matches deployed body byte-for-byte by direct string comparison at capture time. |
| `candidate-workspace-readiness` | 4 | `3cfe816c81252df062cfebfaf17be1d8b431f89c387d180e310a37c7ac9226a1` | `supabase/functions/candidate-workspace-readiness/index.ts` matches deployed body byte-for-byte by direct string comparison at capture time. |
| `n15-candidate-opportunities` | 2 | `0acbc93c3ad1af2d2f33cc76e1fb72f1369f73e49e81aacfab825a1303c0035f` | **Source drift unresolved.** The live v2 body is 6,958 characters. Git `supabase/functions/n15-candidate-opportunities/index.ts` is a different 8,161-character source. It was not overwritten; compare behaviour, contract tests and deployment history before choosing canonical source. |

All three live sources read Supabase credentials from runtime environment variables; no secret values were copied into this register. Before any function is deployed, run CI, review the exact source diff, confirm required environment-variable names and allowed CORS origins, then compare the new live digest against the reviewed Git source.

## Data-integrity finding

As of 29 October 2026 staging inspection:

- `public.opportunity_programmes` contains zero rows.
- `public.route_programmes` contains six `EMPLOYER / VERIFIED / OPEN / confidence A` records and two manual-check anchors (CAO, NSFAS).
- Those six employment records point to the South African Department of Employment and Labour vacancy list, closing 30 October 2026; their stored source-check timestamp is 23 October 2026 13:45 UTC. They exceed the N15 feed's 24-hour freshness requirement, so they must **not** be advertised as freshly verified-open without a fresh source observation.
- The N15 live feed reads the distinct `candidate_opportunity_matches` + `opportunity_programmes` + `opportunity_providers` + `external_source_observations` domain. With no programme rows, an empty candidate-facing feed is correct and safer than inventing or copying stale records.

The required next implementation is one verified source-ingestion/review path that writes current evidence into the canonical opportunity model, plus an explicit mapping from a verified opportunity to the reusable candidate tracker. Do not map an N15 programme reference to a `route_programmes.id` without proof; a live staging comparison of the two identifiers returned zero exact UUID matches.
