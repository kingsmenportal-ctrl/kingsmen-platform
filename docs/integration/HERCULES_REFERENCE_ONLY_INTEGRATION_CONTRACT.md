# Hercules Reference-Only Integration Contract

**Status:** Proposed integration contract; not a deployment or runtime verification  
**Updated:** 2026-11-25  
**Canonical repository:** `kingsmenportal-ctrl/kingsmen-platform`

## Decision

Hercules may be used as a reference/build workspace for Kingsmen, but it must not become a competing production architecture. The existing GitHub repository and the approved Kingsmen Supabase project remain the canonical implementation and data authority. This contract preserves useful Hercules catalogue, founder-access and verification work without silently duplicating or replacing production services.

This document records the boundary only. It does not claim that Hercules is currently connected to GitHub, Supabase, Netlify, or any other Kingsmen service.

## Source-of-truth boundaries

| Domain | Canonical authority | Permitted Hercules role |
| --- | --- | --- |
| Application source, migrations, tests and release history | This GitHub repository and reviewed branches/commits | Reference material, drafts and implementation proposals; changes must be transferred through a reviewed PR |
| Candidate identity, profiles, consent, applications, documents, payments and audit records | Approved Kingsmen Supabase project and its authorised APIs | No independent production copy; use synthetic/demo data unless an explicitly approved integration exists |
| Opportunity/provider records and verification evidence | Canonical Kingsmen schema and evidence-backed ingestion process | Catalogue research and draft records with source URL, captured time, freshness, eligibility/deadline evidence and review state |
| Founder permissions and high-impact decisions | Existing Kingsmen server-side authorization and audit controls | UI/reference design only until the action is implemented and authorized in the canonical backend |
| Deployment and runtime status | Exact reviewed commit plus provider-generated deployment/runtime evidence | No deployment claims based on a preview, project URL, screenshot or generated code alone |
| Governance and architecture records | Existing Kingsmen governance records, including Notion as an index | Proposals and traceable evidence links; not a replacement database |

## Required catalogue evidence states

A source link is not proof that an opportunity is open. Every candidate-facing opportunity must preserve an explicit state and evidence provenance:

- `UNVERIFIED`: source or material details have not been checked.
- `VERIFIED`: an authoritative source and the required details were reviewed.
- `OPEN`: only when official evidence supports current availability, deadline, eligibility and freshness.
- `CLOSED`, `LAPSED`, `CANCELLED` or `UNRESOLVED`: retain the appropriate non-open state when evidence requires it.

Do not promote demo, seeded or stale records to `OPEN`. Store source anchor, last checked timestamp, deadline where applicable, eligibility evidence, reviewer and change history.

## Founder access and action authorization

A founder-facing screen is not an authorization boundary. Before any write or high-impact action:

1. Authenticate the actor server-side.
2. Resolve the actor's current role and scope from canonical data.
3. Check the specific action and resource at execution time.
4. Revalidate preconditions and current state.
5. Require explicit Founder approval where the action policy requires it.
6. Enforce idempotency for retried actions.
7. Record actor, action, resource, reason, correlation ID, result and timestamp in the canonical audit trail.
8. Fail closed on missing identity, policy, evidence, approval or audit persistence.

Hercules must not independently approve candidate identity, provider submissions, payments/refunds, admissions, production releases or other reserved Founder decisions.

## Integration workflow

1. **Inventory:** identify the existing Hercules catalogue, founder-access and verification components, their data shapes, authentication assumptions and current runtime state.
2. **Map:** map each useful component to a canonical Kingsmen route, API, table, contract or evidence record. Mark unmapped items as proposals, not integrated features.
3. **Classify:** label every item as reference-only, reusable UI, backend-dependent, security-sensitive or duplicate/conflicting.
4. **Implement:** move selected changes into a feature branch in this repository; reuse existing contracts and avoid parallel databases, identity systems, payment ledgers or opportunity registries.
5. **Validate:** add focused tests for authorization, evidence state transitions, data isolation, idempotency and failure paths.
6. **Review:** open a pull request with a change map, test output, risk notes and any required migration plan. Do not bypass branch protection or required review.
7. **Release separately:** only after review and approved runtime prerequisites, verify exact commit, environment, deployment identifier and authenticated end-to-end evidence.

## Release gates and prohibited shortcuts

- No new staging DDL, data import or destructive recovery action while migration provenance and backup/isolated-restore requirements remain unresolved.
- Do not create a second production database or replace Supabase with an unapproved service.
- Do not connect or reconfigure Netlify as part of this reference-only workstream.
- Do not claim that a candidate journey, integration, deployment or provider submission works without corresponding runtime evidence.
- Do not use real candidate personal data in Hercules demo content.
- Do not treat a successful build or green CI as proof of authenticated end-to-end behavior.
- Keep Playwright limited to approved QA/read-only scouting until separate authorization explicitly permits any operational action.

## Acceptance checklist

- [ ] Hercules components and current state inventoried with evidence.
- [ ] Catalogue data mapped to canonical Kingsmen opportunity/source/evidence contracts.
- [ ] Founder-facing actions mapped to server-side authorization and audit requirements.
- [ ] No duplicate production source of truth introduced.
- [ ] Proposed code changes are in a feature branch and reviewed through a pull request.
- [ ] Tests cover evidence state, permissions, isolation and failure behavior.
- [ ] Runtime/deployment claims cite exact, current evidence.
- [ ] Outstanding blockers and Founder decisions are explicit.

## Current known blockers

The last available Kingsmen release record leaves PR #316 open pending independent review and authenticated runtime proof. The repository's integration tracker is [issue #280](https://github.com/kingsmenportal-ctrl/kingsmen-platform/issues/280); migration provenance and encrypted backup/isolated restore remain tracked in [issue #264](https://github.com/kingsmenportal-ctrl/kingsmen-platform/issues/264). These records must be refreshed before release decisions. This contract does not close either issue or assert current staging health.
