# Kingsmen Route House — Public Experience Contract

**Module:** N18 — Public website / Route House  
**Boundary:** Public, candidate-facing information only. This surface is not the N08 Founder Control Plane, N17 Founder Command Ops, or Jarvis.  
**Status of this specification:** Product/design contract. A written requirement is not proof of runtime implementation.

## 1. Product identity

Kingsmen is a South African opportunity navigation and application-execution service. The Route House is its public front door: it explains the connected service and guides candidates toward the right next step. It is not a generic job board, a college directory, an admissions guarantee, or a conventional SaaS landing page.

The core promise is disciplined assistance across the journey: **discover → verify → prepare → execute or guide → record evidence → follow through**. The candidate should understand what is known, what is missing, who has authority, what has happened, and what to do next.

## 2. Visual language

- Premium, distinctive, editorial “Route House” identity; deliberate and architectural, not a stock template.
- Near-black ink / deep navy foundation, warm brass or gold, ivory text, muted field-note colours.
- Strong serif display typography paired with compact monospaced route labels and readable body text.
- A custom route atlas / connected journey graphic, coordinates, field dossiers, numbered routes, source and evidence marks.
- Clear grid, asymmetric compositions, restrained linework, meaningful information density, deliberate whitespace.
- Avoid generic gradient blobs, stock photography, repeated rounded SaaS cards, fake dashboard statistics, and decorative elements that do not explain the product.
- Mobile-first, keyboard-accessible, visible focus states, reduced-motion support, high contrast, and no horizontal overflow.

## 3. Six connected opportunity pathways

1. **Higher education:** universities, Universities of Technology, CAO and programme-choice preparation.
2. **TVET and colleges:** TVET colleges, NC(V), NATED / Report 191 and accredited private-college routes.
3. **SETA, learnerships and skills:** SETAs, learnerships, occupational qualifications and QCTO-related pathways.
4. **Work experience:** internships, apprenticeships and work-integrated learning (WIL).
5. **Employment:** source-checked vacancies and application preparation.
6. **Funding and practical support:** NSFAS guidance, bursaries, sponsors, accommodation and transport dependencies.

These routes are connected, not isolated catalogues. For example, a study route may depend on funding and accommodation; a skills route may lead to workplace learning and employment. Do not imply that every candidate is eligible for every route.

## 4. Candidate journey and service model

### Discover
- Establish the candidate's goal, qualifications, location and practical constraints when a real authenticated journey exists.
- Show opportunities with source authority and freshness context.
- A source directory is not proof that a specific opportunity is currently open.
- Do not invent vacancies, programmes, deadlines, provider relationships, eligibility or success rates.

### Verify
- Preserve the authoritative source, source reference, checked-at timestamp and relevant freshness state.
- Mark missing, stale, unavailable or conflicting information as uncertain.
- Fail closed when evidence is insufficient to make a material claim.

### Prepare
- Explain requirements and map each requirement to supporting evidence.
- Identify missing items and dependencies before submission.
- Keep sensitive identity and application documents inside the protected N05 Document Vault flow, never a public marketing form or browser-only mock storage.

### Execute or guide
- Record the actual action and its outcome.
- If automation is blocked by CAPTCHA, OTP, provider outage, selector change or capacity, disclose the failure and route through the approved MAP/manual or Phoenix recovery path where configured.
- Never imply a portal action occurred when it did not.

### Record and follow through
- Persist submission references, timestamps, status provenance and audit evidence in the authoritative backend when authenticated flows are implemented.
- Candidate-reported submission is a distinct state from provider-confirmed receipt or outcome.
- A provider-confirmed outcome requires provider-originated evidence; do not infer acceptance, rejection, funding approval or employment.

## 5. Evidence language

Use accurate distinctions:
- **Source found:** an authority or source has been identified.
- **Currentness checked:** available information has been reviewed at a timestamp.
- **Preparation ready:** known requirements have been addressed or explicitly marked missing.
- **Submission reported:** the candidate/operator reports an action.
- **Provider confirmed:** provider-originated evidence supports the specific claim.
- **Outcome recorded:** the evidence and authority support the recorded outcome.

Never present a stale or unknown source as current. Never represent a candidate report as provider proof. Never invent operational metrics or candidate counts for visual impact.

## 6. Required public routes

- `/` — Route House: product identity, route atlas, six pathways, candidate lifecycle, evidence doctrine, clear next step.
- `/pathways` — six routes with useful descriptions and functional navigation/filtering.
- `/how-it-works` — practical lifecycle, preparation and follow-through, failure/fallback transparency.
- `/trust` — source freshness, evidence provenance, privacy boundaries, authority and honest status language.
- `/get-started` — clearly described early-access/preview route until real candidate authentication and persistence are connected.

Every navigation element must lead to an implemented page or a clearly-labelled external authority. No dead buttons, fake forms, pretend registrations, or false “saved/submitted” success messages.

## 7. Privacy and candidate safety

- Do not request or accept identity numbers, credentials, or private supporting documents on the public preview.
- Explain that candidate-specific records and sensitive evidence require authenticated, access-controlled flows.
- POPIA-minded minimisation, consent, purpose limitation, retention and auditability are product requirements, not a claim of certified legal compliance.
- Never expose one candidate's records to another candidate.
- Do not place secrets or service-role credentials in browser code.

## 8. System boundaries

- **N18 Route House:** public website and clear entry into candidate journeys.
- **N19 Candidate PWA:** authenticated candidate experience and continuity, when integrated.
- **N08 Founder Control Plane:** private operational queues, approvals, capacity, incidents, worker health, fallback, kill switches and evidence.
- **N17 Founder Command Ops:** founder's daily/night operations and command workflow.
- **Jarvis:** separate command cockpit with its own guarded command interface; never pretend a static public page is the real command agent.
- **N03 PostgreSQL Truth Vault:** authoritative persisted business state.
- **N05 Document Vault:** private candidate evidence.
- **N07 Airtable:** mirror/integration, not the source of truth.

Public marketing routes must not leak private control-plane or candidate data. Internal systems must enforce server-side authentication and authorization before returning operational information.

## 9. Acceptance checks

- Public homepage loads without 404 or runtime error.
- All five public routes resolve directly and through navigation.
- Pathway filters and expandable route details work with mouse, touch and keyboard.
- Responsive layout is readable at narrow mobile widths without horizontal scrolling.
- Links are real; no placeholder anchors, invented contact details or fake success states.
- No fake statistics, partner logos, live opportunity claims or invented provider outcomes.
- Privacy language makes the preview's non-persistence and lack of candidate backend explicit.
- Accessibility: semantic landmarks, useful labels, keyboard operation, visible focus and reduced-motion handling.
- Build/lint and relevant tests run; failures are recorded rather than described as passed.
- Deployment is only called live after a public URL is returned and the deployed pages are actually checked.
- Implemented, tested, deployed and end-to-end verified are tracked as separate states.

## 10. Release reporting

For this module report separate percentages:
- **Implemented:** source/UI work completed.
- **Tested:** automated and interaction checks actually run.
- **Deployed:** public hosting confirms a completed deployment.
- **End-to-end verified:** actual deployed routes and interactions are checked in a browser.

A merged commit, successful typecheck, preview URL, or generated screenshot alone is not proof of a working public deployment.
