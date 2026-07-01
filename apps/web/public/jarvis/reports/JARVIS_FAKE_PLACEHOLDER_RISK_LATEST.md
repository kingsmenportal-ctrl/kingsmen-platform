# JARVIS FAKE / PLACEHOLDER / MOCK RISK INVENTORY

Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.

Risk hits found: 1702

Every hit must be reviewed before a live claim is made.

.env.example:1 | [example] # Kingsmen environment example
.github/ISSUE_TEMPLATE/kingsmen-module.yml:53 | [placeholder] placeholder: |
.github/ISSUE_TEMPLATE/kingsmen-module.yml:68 | [placeholder] placeholder: |
.github/ISSUE_TEMPLATE/kingsmen-module.yml:92 | [placeholder] placeholder: |
.github/ISSUE_TEMPLATE/kingsmen-module.yml:104 | [placeholder] placeholder: |
.github/ISSUE_TEMPLATE/kingsmen-module.yml:93 | [fake] No fake guarantees.
.github/ISSUE_TEMPLATE/kingsmen-module.yml:13 | [example] description: Example: BATCH 02 — Creator Normalize, GROWTH.2 — Micro-Fact Content Engine, N21 — Mirror Intelligence
README.md:61 | [fake] The repo now has a strict launch-readiness gate. It does not fake production readiness; it reports the exact blockers that must be repaired before public candidates, payments, or production data.
apps/api/src/ai-decision/ai-boundary-policy.ts:15 | [fake] NO_FAKE_GUARANTEES: "No fake guarantees.",
apps/api/src/candidate-mobile/candidate-mobile-types.ts:66 | [fake] noFakeStatus: boolean;
apps/api/src/candidate-mobile/mobile-policy.ts:9 | [fake] { key: "NO_FAKE_STATUS", rule: "Candidate mobile must never invent official results, admissions decisions, funding decisions, deadlines, or employer outcomes." },
apps/api/src/candidate-mobile/mobile-policy.ts:24 | [fake] noFakeStatus: true
apps/api/src/candidate-mobile/mobile-policy.ts:50 | [fake] throw new Error("NO_FAKE_STATUS: Candidate mobile cannot claim official outcomes without verified source evidence.");
apps/api/src/db/truth-vault-repository.ts:74 | [static] static fromEnvironment(): TruthVaultRepository {
apps/api/src/finance/payfast-finance-repository.ts:99 | [static] static fromEnvironment(): PayFastFinanceRepository {
apps/api/src/finance/payfast-runtime-gate.ts:18 | [placeholder] redactedRuntime: Record<string, "present" | "missing" | "placeholder" | "invalid">;
apps/api/src/finance/payfast-runtime-gate.ts:21 | [placeholder] const PLACEHOLDER_TOKENS = [
apps/api/src/finance/payfast-runtime-gate.ts:30 | [placeholder] "placeholder"
apps/api/src/finance/payfast-runtime-gate.ts:57 | [placeholder] function isPlaceholder(value: string | undefined): boolean {
apps/api/src/finance/payfast-runtime-gate.ts:59 | [placeholder] return clean.length === 0 || PLACEHOLDER_TOKENS.some((token) => clean.includes(token));
apps/api/src/finance/payfast-runtime-gate.ts:62 | [placeholder] function classifyEnvValue(value: string | undefined): "present" | "missing" | "placeholder" {
apps/api/src/finance/payfast-runtime-gate.ts:64 | [placeholder] return isPlaceholder(value) ? "placeholder" : "present";
apps/api/src/finance/payfast-runtime-gate.ts:67 | [placeholder] function validateUrl(name: string, value: string | undefined, environment: PayFastEnvironment | "invalid", allowLocalhostUrls: boolean, blockers: string[], warnings: string[]): "present" | "missing" | "placeholder" | "invalid" {
apps/api/src/finance/payfast-runtime-gate.ts:106 | [placeholder] if (classification === "placeholder") blockers.push(`${key} is a placeholder and must be replaced outside Git.`);
apps/api/src/finance/payfast-runtime-gate.ts:29 | [fake] "fake_",
apps/api/src/finance/payfast-runtime-gate.ts:28 | [dummy] "dummy_",
apps/api/src/finance/payfast-runtime-gate.ts:24 | [example] "example.com",
apps/api/src/finance/pricing-catalog.ts:26 | [fake] doctrineNotes: "Never invent fake experience, qualifications, references, certificates, skills, or results."
apps/api/src/finance/pricing-catalog.ts:51 | [fake] if (!plan.doctrineNotes.includes("Never invent fake")) {
apps/api/src/founder-ops/founder-command-policy.ts:9 | [fake] "FAKE_OFFICIAL_STATUS",
apps/api/src/founder-ops/founder-read-model.ts:15 | [fake] "No fake official status",
apps/api/src/kernel/constitution-loader.ts:251 | [hardcoded] assertJsonBooleanLock(checks, { object: creatorConfig, dottedPath: "blockedContent.hardcodedSecrets", expected: true, source: "creator_config", file: SOURCE_FILES.creatorConfig, name: "creator:block-hardcoded-secrets" });
apps/api/src/opportunity/opportunity-engine.ts:76 | [fake] NO_FAKE_DEADLINES: "No fake deadlines.",
apps/api/src/opportunity/opportunity-engine.ts:77 | [fake] NO_FAKE_LINKS: "No fake links.",
apps/api/src/opportunity/opportunity-engine.ts:78 | [fake] NO_FAKE_AVAILABILITY: "No fake programme availability.",
apps/api/src/opportunity/opportunity-engine.ts:79 | [fake] NO_FAKE_ELIGIBILITY: "No fake eligibility claims.",
apps/api/src/opportunity/opportunity-engine.ts:80 | [fake] NO_FAKE_GUARANTEES: "No fake acceptance or placement guarantees.",
apps/api/src/opportunity/opportunity-engine.ts:90 | [fake] export function assertNoFakeOpportunityClaim(input: {
apps/api/src/opportunity/opportunity-engine.ts:98 | [fake] if (!input.sourceUrl) throw new Error("NO_FAKE_LINKS_SOURCE_URL_REQUIRED");
apps/api/src/opportunity/opportunity-engine.ts:116 | [fake] assertNoFakeOpportunityClaim({
apps/api/src/public-website/content-guardrails.ts:28 | [fake] export function assertNoFakeTestimonials(copy: string): true {
apps/api/src/public-website/content-guardrails.ts:31 | [fake] throw new Error("PUBLIC_COPY_FAKE_TESTIMONIAL_RISK");
apps/api/src/public-website/content-guardrails.ts:47 | [fake] assertNoFakeTestimonials(copy);
apps/api/src/public-website/website-read-model.ts:25 | [static] export function publicWebsiteIsStaticFirstOracleLite(): true {
apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs:121 | [demo] ? "Backend local boundary accepted the safe demo Free Destiny Map payload."
apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs:129 | [demo] const localDataFile = path.join(localDataDir, "backend-runtime-demo-intakes.jsonl");
apps/api/src/server.ts:122 | [example] email: safeText(payload.email, existing?.email ?? "unknown@example.invalid"),
apps/api/src/server.ts:154 | [example] email: existing?.email ?? "unknown@example.invalid",
apps/api/src/system/kingsmen-operating-system-spine.ts:253 | [placeholder] launchBlockers: ["raw secret in Git", "runtime secret proof missing", "provider placeholder"]
apps/api/src/system/kingsmen-operating-system-spine.ts:149 | [fake] launchBlockers: ["fake institution data", "missing source confidence", "no manual fallback"]
apps/api/src/system/kingsmen-operating-system-spine.ts:262 | [fake] toolBoundary: "Only verified/credited links; no fake opportunities.",
apps/web/jarvis-os/jarvis-os.html:48 | [static] @media(max-width:1200px){.shell,.header{grid-template-columns:1fr}.header,.footer{grid-column:auto}.workGrid{grid-template-columns:repeat(3,1fr)}.providers{grid-template-columns:repeat(2,1fr)}.timeline{grid-template-columns:1fr}.stream,.context{position:static;width:auto}.orbBig:before{display:none}}
apps/web/jarvis-os/jarvis-os.html:113 | [static] <footer class="panel footer"><span>KINGSMEN PROTOCOL · Zero Trust Architecture · Evidence Before Claims</span><span>Jarvis OS Visual Lock · Static Live Surface + Jarvis Agent Function</span></footer>
apps/web/public/founder/proof-centre/adapter.json:8 | [static] "runtimeScope": "local_static_founder_page_wiring_only",
apps/web/scripts/build-jarvis-luxury.cjs:120 | [fake] <p class="subtitle">A luxury Commander-only operating shell for Kingsmen. Live on Netlify. Provider-aware. Doctrine-safe. Evidence-first. No fake connections.</p>
apps/web/scripts/build-jarvis-luxury.cjs:216 | [static] add("JARVIS", "WAKE", "Welcome to Kingsmen Command, Commander. Jarvis is live. The command house is awake.", "Mode: static luxury shell plus dedicated Jarvis function. Boundary: external tools require secured adapters.");
apps/web/scripts/build-jarvis-luxury.cjs:232 | [static] console.log("KINGSMEN_JARVIS_LUXURY_STATIC_BUILD_COMPLETE");
apps/web/scripts/build-static-jarvis.cjs:112 | [fake] <p class="subtitle">Commander-only visual command shell. Live on Netlify. Doctrine-safe. Evidence-first. No fake provider claims.</p>
apps/web/scripts/build-static-jarvis.cjs:229 | [static] add("JARVIS", "WAKE", "Welcome to Kingsmen Command, Commander. Jarvis is live. The command house is awake.", "Mode: Netlify static visual shell plus dedicated Jarvis function. Boundary: local tools remain on the Commander machine until secured adapters exist.");
apps/web/scripts/build-static-jarvis.cjs:244 | [static] console.log("STATIC_JARVIS_BUILD_COMPLETE");
apps/web/src/app/api/jarvis/agent/route.ts:145 | [fake] "This command requires the local Commander Windows runtime. The deployed Netlify surface will not fake PowerShell, Git, PostgreSQL, or filesystem execution.",
apps/web/src/app/api/jarvis/agent/route.ts:184 | [fake] "- No fake tool connection.",
apps/web/src/app/founder/launch-control/jarvis-ai-email-provider-proof/page.tsx:19 | [mock] "Mock AI completions do not count as live proof.",
apps/web/src/app/founder/launch-control/jarvis-live-evidence-acceptance-pack/page.tsx:75 | [fake] This is the final pack runner surface. It does not fake readiness. It waits for real accepted runtime, provider, payment, and launch-audit evidence before any live claim can move forward.
apps/web/src/app/founder/launch-control/jarvis-live-evidence-execution-sequence/page.tsx:73 | [fake] <h1 style={{ margin: "10px 0", fontSize: "clamp(2.4rem, 6vw, 5.4rem)", lineHeight: 0.9 }}>Evidence execution, not fake launch</h1>
apps/web/src/app/founder/launch-control/jarvis-live-proof-queue/page.tsx:67 | [fake] This page does not run Docker, providers, shell commands, or database calls. It shows the remaining live proof queue clearly so Jarvis can move from source-ready to production-ready without fake claims.
apps/web/src/app/founder/launch-control/jarvis-provider-tool-runtime-proof/page.tsx:27 | [fake] "No fake connector status or guessed proof"
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [fake] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [fake data] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/launch-control/jarvis/page.tsx:34 | [fake] <p style={muted}>This is the founder launch-control board for Jarvis. It shows what is source-complete and what still blocks production. It does not fake readiness, execute shell commands, call providers, or expose secrets.</p>
apps/web/src/app/founder/launch-control/jarvis/page.tsx:58 | [fake] <p style={kicker}>No fake launch rule</p>
apps/web/src/app/free-destiny-map/page.tsx:176 | [placeholder] placeholder="Example: I want to know the safest route and what documents I need."
apps/web/src/app/free-destiny-map/page.tsx:176 | [example] placeholder="Example: I want to know the safest route and what documents I need."
apps/web/src/app/jarvis/JarvisAgentClient.tsx:351 | [placeholder] placeholder="Command Jarvis from Kingsmen Command..."
apps/web/src/app/jarvis/JarvisHud.module.css:343 | [placeholder] .cameraPlaceholder {
apps/web/src/app/jarvis/JarvisHud.module.css:354 | [placeholder] .cameraPlaceholder span {
apps/web/src/app/jarvis/JarvisHudClient.tsx:259 | [placeholder] placeholder="Type command e.g. DB_LEDGER_CHECK"
apps/web/src/app/jarvis/JarvisHudClient.tsx:302 | [placeholder] <div className={styles.cameraPlaceholder}>
apps/web/src/app/jarvis/JarvisHudClient.tsx:209 | [fake] evidence output, and policy boundaries. This is not a fake chatbot and it does not replace
apps/web/src/app/jarvis/JarvisProductionCommand.module.css:292 | [placeholder] .askBar textarea::placeholder { color: rgba(255,224,138,.82); }
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:402 | [placeholder] <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Jarvis anything about Kingsmen, strategy, operations, research, build steps, providers, payments, candidates or launch..." />
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:198 | [fake] const reply = "Sir, Jarvis conversation route is unavailable. I cannot fake a brain response. Check the web route and backend provider configuration.";
apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx:22 | [fake] noFakeData: boolean;
apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx:238 | [fake] Final source command room for founder control, completion tracking, provider readiness, live proof queue, evidence collection, launch gates, proof-pack index, runtime blockers, and no fake production claims.
apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx:401 | [fake] <p style={label}>No fake data lock</p>
apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx:401 | [fake data] <p style={label}>No fake data lock</p>
apps/web/src/app/jarvis/page.tsx:84 | [fake] output: "Operating rule: evidence before claims, no fake connections, no useless layers."
apps/web/src/app/jarvis/page.tsx:141 | [fake] Commander-only visual command shell. Live on Netlify. Doctrine-safe. Evidence-first. No fake provider claims.
apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx:245 | [placeholder] placeholder="Company or employer name"
apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx:250 | [placeholder] placeholder="Role or opportunity title"
apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx:255 | [placeholder] placeholder="Location"
apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx:260 | [placeholder] placeholder="Where you found/heard it"
apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx:273 | [placeholder] placeholder="Requirements, closing date, contact person, salary signal, documents needed, or anything you know"
apps/web/src/app/personal-job-desk/application-tracker/ApplicationTrackerClient.tsx:262 | [placeholder] placeholder="Ask a question or add a note..."
apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx:417 | [placeholder] placeholder="Paste application reference, email sent proof, portal confirmation, screenshot note, or employer response."
apps/web/src/app/personal-job-desk/apply-pack-builder/ApplyPackBuilderClient.tsx:117 | [placeholder] <Input label="Target roles" value={profile.targetRoles} onChange={(v) => update("targetRoles", v)} placeholder="cashier, retail assistant, general worker" />
apps/web/src/app/personal-job-desk/apply-pack-builder/ApplyPackBuilderClient.tsx:118 | [placeholder] <Input label="Skills" value={profile.skills} onChange={(v) => update("skills", v)} placeholder="customer service, POS, stock control" />
apps/web/src/app/personal-job-desk/apply-pack-builder/ApplyPackBuilderClient.tsx:183 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/apply-pack-builder/ApplyPackBuilderClient.tsx:187 | [placeholder] <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/daily-worklist/DailyWorklistClient.tsx:280 | [placeholder] <Input label="Decision" value={selected.founderDecision.decision} onChange={(v) => patchFounder("decision", v)} placeholder="approve / block / defer / close" />
apps/web/src/app/personal-job-desk/daily-worklist/DailyWorklistClient.tsx:307 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/daily-worklist/DailyWorklistClient.tsx:311 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/document-pack-index/DocumentPackIndexClient.tsx:130 | [fake] <p style={muted}>Application document readiness and evidence attachment map. No fake documents, no submission, no employer contact.</p>
apps/web/src/app/personal-job-desk/follow-up-inbox/FollowUpInboxClient.tsx:243 | [placeholder] <Input label="Manual send channel" value={selected.operator.manualSendChannel} onChange={(v) => patchOperator("manualSendChannel", v)} placeholder="in-app / email / WhatsApp manual / phone" />
apps/web/src/app/personal-job-desk/follow-up-inbox/FollowUpInboxClient.tsx:244 | [placeholder] <Input label="Manual sent at" value={selected.operator.manualSentAt} onChange={(v) => patchOperator("manualSentAt", v)} placeholder="YYYY-MM-DD HH:mm" />
apps/web/src/app/personal-job-desk/follow-up-inbox/FollowUpInboxClient.tsx:245 | [placeholder] <Input label="Manual send proof" value={selected.operator.manualSendProof} onChange={(v) => patchOperator("manualSendProof", v)} placeholder="copy/paste proof reference" />
apps/web/src/app/personal-job-desk/follow-up-inbox/FollowUpInboxClient.tsx:283 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/follow-up-inbox/FollowUpInboxClient.tsx:287 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx:311 | [placeholder] <textarea value={activeRecord.recruiterResponse || ""} onChange={(event) => patchRecord(activeRecord.id, { recruiterResponse: event.target.value, status: event.target.value.trim() ? "RECRUITER_REPLIED" : activeRecord.status })} rows={4} placeholder="Paste the truthful response summary here. Do not invent replies." style={textareaStyle} />
apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx:121 | [example] "- Prepare one example of solving a problem, helping a customer, learning quickly, or handling pressure.",
apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx:328 | [example] <button type="button" onClick={() => patchRecord(activeRecord.id, { status: "INTERVIEW_PREP_READY", nextAction: "Practise introduction, role fit, examples, availability, salary, and questions for the employer." })} style={buttonStyle}>Mark interview prep ready</button>
apps/web/src/app/personal-job-desk/import-search/JobSearchImportClient.tsx:438 | [placeholder] <input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} style={inputStyle} placeholder="Indeed, LinkedIn, company site, WhatsApp, Facebook..." />
apps/web/src/app/personal-job-desk/import-search/JobSearchImportClient.tsx:458 | [placeholder] placeholder={"Paste job URLs or copied listings here.\n\nExample:\nAdmin Assistant\nCompany: Example Retail\nLocation: Johannesburg\nSalary: R6500 per month\nClosing date: 2026-07-15\nhttps://example.com/careers/admin-assistant"}
apps/web/src/app/personal-job-desk/import-search/JobSearchImportClient.tsx:458 | [example] placeholder={"Paste job URLs or copied listings here.\n\nExample:\nAdmin Assistant\nCompany: Example Retail\nLocation: Johannesburg\nSalary: R6500 per month\nClosing date: 2026-07-15\nhttps://example.com/careers/admin-assistant"}
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:248 | [placeholder] <Input label="Application method" value={selected.execution.applicationMethod} onChange={(v) => patchExecution("applicationMethod", v)} placeholder="official portal / email / walk-in / other" />
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:249 | [placeholder] <Input label="Started at" value={selected.execution.startedAt} onChange={(v) => patchExecution("startedAt", v)} placeholder="YYYY-MM-DD HH:mm" />
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:250 | [placeholder] <Input label="Submitted at" value={selected.execution.submittedAt} onChange={(v) => patchExecution("submittedAt", v)} placeholder="YYYY-MM-DD HH:mm" />
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:251 | [placeholder] <Input label="Proof type" value={selected.execution.proofType} onChange={(v) => patchExecution("proofType", v)} placeholder="screenshot / email / reference number" />
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:253 | [placeholder] <Input label="Follow-up date" value={selected.execution.followUpDate} onChange={(v) => patchExecution("followUpDate", v)} placeholder="YYYY-MM-DD" />
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:307 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:311 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/normalizer/ImportNormalizerClient.tsx:62 | [example] examples: Array<{
apps/web/src/app/personal-job-desk/normalizer/ImportNormalizerClient.tsx:329 | [example] examples: normalizedLeads.slice(0, 5).map((lead, index) => ({
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:380 | [placeholder] placeholder="Example: Capitec, Shoprite, Transnet"
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:390 | [placeholder] placeholder="Example: Junior Admin Clerk"
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:400 | [placeholder] placeholder="Paste job link or company career page"
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:425 | [placeholder] placeholder="Johannesburg, Durban, Remote, etc."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:509 | [placeholder] placeholder="Salary range, stipend, benefits, transport risk, unpaid warning, etc."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:519 | [placeholder] placeholder="Matric, license, experience, certificates, skills, documents..."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:529 | [placeholder] placeholder="Why this is worth applying for and how the CV should be positioned."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:539 | [placeholder] placeholder="Scam risk, fee warning, unclear source, outdated post, no official link..."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:558 | [placeholder] placeholder="Application reference, confirmation screenshot note, email sent proof, portal status..."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:660 | [placeholder] placeholder="Search company, role, source, location, status..."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:380 | [example] placeholder="Example: Capitec, Shoprite, Transnet"
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:390 | [example] placeholder="Example: Junior Admin Clerk"
apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx:482 | [placeholder] <textarea value={activeOutcome.salaryText} onChange={(event) => patchOutcome(activeOutcome.id, { salaryText: event.target.value })} rows={3} placeholder="Capture salary, stipend, hours, transport, contract type, probation, benefits or missing terms." style={textareaStyle} />
apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx:487 | [placeholder] <input value={activeOutcome.proofReference} onChange={(event) => patchOutcome(activeOutcome.id, { proofReference: event.target.value })} placeholder="Offer letter file, email subject, screenshot name, reference number, interview invite proof." style={inputStyle} />
apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx:492 | [placeholder] <textarea value={activeOutcome.riskNotes} onChange={(event) => patchOutcome(activeOutcome.id, { riskNotes: event.target.value })} rows={3} placeholder="Fees, unclear employer, unsafe route, transport risk, contract uncertainty, suspicious request, missing written proof." style={textareaStyle} />
apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx:239 | [example] if (interviews.length > 0) commands.push(`Prepare for ${interviews.length} interview-stage route(s): practise truthful examples and confirm attendance details.`);
apps/web/src/app/personal-job-desk/page.tsx:39 | [placeholder] <input style={searchInput} placeholder="Search role, company, learnership, bursary..." />
apps/web/src/app/personal-job-desk/page.tsx:40 | [placeholder] <input style={whereInput} placeholder="Johannesburg" />
apps/web/src/app/personal-job-desk/proof-review-board/ProofReviewBoardClient.tsx:278 | [placeholder] <Input label="Proof type" value={selected.proof.proofType} onChange={(v) => patchProof("proofType", v)} placeholder="screenshot / email / ref / portal / call note" />
apps/web/src/app/personal-job-desk/proof-review-board/ProofReviewBoardClient.tsx:297 | [placeholder] <Input label="Decision" value={selected.reviewDecision.decision} onChange={(v) => patchDecision("decision", v)} placeholder="approve / reject / block / defer" />
apps/web/src/app/personal-job-desk/proof-review-board/ProofReviewBoardClient.tsx:346 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/proof-review-board/ProofReviewBoardClient.tsx:350 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/readiness-queue/ReadinessQueueClient.tsx:216 | [placeholder] <Input label="Operator decision" value={selected.operatorDecision} onChange={(v) => patchItem("operatorDecision", v)} placeholder="review / ready / blocked / closed" />
apps/web/src/app/personal-job-desk/readiness-queue/ReadinessQueueClient.tsx:250 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/readiness-queue/ReadinessQueueClient.tsx:254 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/response-library/ResponseLibraryClient.tsx:281 | [placeholder] <Input label="Manual channel" value={selected.manualSend.channel} onChange={(v) => patchManualSend("channel", v)} placeholder="in-app / email manual / WhatsApp urgent-only" />
apps/web/src/app/personal-job-desk/response-library/ResponseLibraryClient.tsx:282 | [placeholder] <Input label="Sent at" value={selected.manualSend.sentAt} onChange={(v) => patchManualSend("sentAt", v)} placeholder="YYYY-MM-DD HH:mm" />
apps/web/src/app/personal-job-desk/response-library/ResponseLibraryClient.tsx:321 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/response-library/ResponseLibraryClient.tsx:325 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:230 | [placeholder] <Input label="Application method" value={selected.review.applicationMethod} onChange={(v) => patchSelected("applicationMethod", v)} placeholder="official portal / email / walk-in / other" />
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:231 | [placeholder] <Input label="Submitted at" value={selected.review.submittedAt} onChange={(v) => patchSelected("submittedAt", v)} placeholder="YYYY-MM-DD HH:mm or note" />
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:232 | [placeholder] <Input label="Proof type" value={selected.review.proofType} onChange={(v) => patchSelected("proofType", v)} placeholder="screenshot / email / reference number" />
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:234 | [placeholder] <Input label="Follow-up date" value={selected.review.followUpDate} onChange={(v) => patchSelected("followUpDate", v)} placeholder="YYYY-MM-DD" />
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:291 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:295 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/source-runner/SourceRunnerClient.tsx:451 | [placeholder] <textarea value={leadNotes} onChange={(event) => setLeadNotes(event.target.value)} style={textareaStyle} placeholder="What did you verify? Employer name, deadline, no fee, requirements, location, official source, salary/stipend if visible." />
apps/web/src/app/personal-job-desk/status-advancement/StatusAdvancementClient.tsx:324 | [placeholder] function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
apps/web/src/app/personal-job-desk/status-advancement/StatusAdvancementClient.tsx:328 | [placeholder] <input value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:510 | [placeholder] placeholder="Paste official job source or portal link"
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:522 | [placeholder] placeholder="Example: screenshot filename, confirmation number, sent email subject, portal reference"
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:534 | [placeholder] placeholder="What happened, what proof exists, what is still missing?"
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:522 | [example] placeholder="Example: screenshot filename, confirmation number, sent email subject, portal reference"
apps/web/src/candidate-mobile/CandidateMobileShell.tsx:7 | [fake] "NO_FAKE_STATUS",
apps/web/src/candidate-mobile/MobileStatusCardsPanel.tsx:5 | [fake] <h2 className="mt-2 text-2xl font-black">Visible progress, no fake official claims</h2>
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:79 | [placeholder] <input name="fullName" style={fieldStyle} placeholder="Full name" />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:84 | [placeholder] <input name="province" style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:89 | [placeholder] <input name="knownRoute" style={fieldStyle} placeholder="Example: UJ, TVET, NSFAS, CV, accommodation, learnership..." />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:94 | [placeholder] <textarea name="currentSituation" style={{ ...fieldStyle, minHeight: 96 }} placeholder="Tell Kingsmen what you are trying to do." />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:116 | [placeholder] <input name="accommodationArea" style={fieldStyle} placeholder="Example: Durban, Johannesburg, Cape Town, campus/workplace area..." />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:136 | [placeholder] <input name="randomSourceName" style={fieldStyle} placeholder="Name or link to check later" />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:84 | [example] <input name="province" style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:89 | [example] <input name="knownRoute" style={fieldStyle} placeholder="Example: UJ, TVET, NSFAS, CV, accommodation, learnership..." />
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:116 | [example] <input name="accommodationArea" style={fieldStyle} placeholder="Example: Durban, Johannesburg, Cape Town, campus/workplace area..." />
apps/web/src/components/kingsmen/FreeDestinyMapFormShell.tsx:29 | [placeholder] <input style={fieldStyle} placeholder="Full name" />
apps/web/src/components/kingsmen/FreeDestinyMapFormShell.tsx:34 | [placeholder] <input style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
apps/web/src/components/kingsmen/FreeDestinyMapFormShell.tsx:54 | [placeholder] <input style={fieldStyle} placeholder="Bursary, job, college, landlord, learnership, accommodation, training provider..." />
apps/web/src/components/kingsmen/FreeDestinyMapFormShell.tsx:59 | [placeholder] <textarea style={{ ...fieldStyle, minHeight: 110 }} placeholder="Documents, CV, marks, ID, proof, known route, accommodation need..." />
apps/web/src/components/kingsmen/FreeDestinyMapFormShell.tsx:34 | [example] <input style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
apps/web/src/final-assembly/SystemLockPanel.tsx:10 | [fake] "NO_FAKE_STATUS",
apps/web/src/founder/founder-control-plane-client.ts:77 | [fake] { moduleCode: "N06", name: "Route Universe and Application Workbench", proofStatus: "VALIDATOR_REQUIRED", owner: "JARVIS_BRAIN_ROUTER", validatorCommand: "npm run kingsmen:launch:audit", reportPath: "reports/launch/kingsmen-launch-readiness-latest.json", blockers: ["fake institution data", "no manual fallback"] },
apps/web/src/opportunity/OpportunityEnginePanel.tsx:3 | [fake] "No fake deadlines",
apps/web/src/opportunity/OpportunityEnginePanel.tsx:4 | [fake] "No fake links",
apps/web/src/opportunity/OpportunityEnginePanel.tsx:5 | [fake] "No fake availability",
apps/web/src/orchestrator/ManualHandoffPanel.tsx:7 | [fake] CAPTCHA, OTP, blocked portals, portal downtime, manual-only routes, and hard blockers create visible handoffs instead of fake automation success.
config/creator.config.json:29 | [placeholder] "description": "Create canonical Kingsmen repository directories and .gitkeep placeholders.",
config/creator.config.json:106 | [hardcoded] "hardcodedSecrets": true,
config/jarvis/jarvis-command-profile.json:68 | [fake] "no_fake_documents": true,
config/jarvis/jarvis-command-profile.json:69 | [fake] "no_fake_applications": true,
config/jarvis/jarvis-command-profile.json:70 | [fake] "no_fake_status": true,
config/jarvis/jarvis-command-profile.json:71 | [fake] "no_fake_guarantees": true,
config/providers/provider-registry.json:22 | [hardcoded] "noHardcodedSecrets": true,
data/personal-job-desk/job-search-sources.local.example.json:30 | [example] "id": "example-greenhouse",
data/personal-job-desk/job-search-sources.local.example.json:31 | [example] "label": "Example Greenhouse board adapter",
data/personal-job-desk/job-search-sources.local.example.json:38 | [example] "id": "example-lever",
data/personal-job-desk/job-search-sources.local.example.json:39 | [example] "label": "Example Lever board adapter",
data/personal-job-desk/job-search-sources.local.example.json:46 | [example] "id": "example-playwright-careers-page",
data/personal-job-desk/job-search-sources.local.example.json:47 | [example] "label": "Example Playwright careers page scout",
data/personal-job-desk/job-search-sources.local.example.json:50 | [example] "url": "https://example.com/careers",
db/migrations/0011_n13_observability_reports_incidents.sql:52 | [sample] create table if not exists public.metric_samples (
db/migrations/0011_n13_observability_reports_incidents.sql:63 | [sample] sampled_at timestamptz not null default now(),
db/migrations/0011_n13_observability_reports_incidents.sql:256 | [sample] create index if not exists idx_metric_samples_name on public.metric_samples(metric_name, sampled_at desc);
db/migrations/0011_n13_observability_reports_incidents.sql:271 | [sample] alter table public.metric_samples enable row level security;
db/migrations/0011_n13_observability_reports_incidents.sql:289 | [sample] drop policy if exists metric_samples_all on public.metric_samples;
db/migrations/0011_n13_observability_reports_incidents.sql:290 | [sample] create policy metric_samples_all on public.metric_samples for all using (true) with check (true);
db/migrations/0017_n19_candidate_mobile_public_portal.sql:3 | [fake] -- Markers: MOBILE_WEB_FIRST PUBLIC_TO_PORTAL_HANDOFF EMAIL_PRIMARY WHATSAPP_URGENT_ONLY NO_FAKE_STATUS
db/migrations/0018_n20_final_assembly_system_lock.sql:5 | [fake] -- Markers: NO_FAKE_STATUS NO_FAKE_DEADLINES NO_FAKE_ACCEPTANCE_CLAIMS NO_FAKE_PAYMENT_SUCCESS
db/migrations/0018_n20_final_assembly_system_lock.sql:6 | [fake] -- Markers: NO_FAKE_AI_GOVERNANCE MAP_FALLBACK_REQUIRED PHOENIX_FALLBACK_CONTROLLED CAPS_LIMIT_VOLUME_NOT_SCOPE
db/seeds/n10_finance_payfast_seed.sql:5 | [fake] ('CV_REVAMP_R49_99','CV Revamp','15 personalised truthful CV versions and 15 matching motivation letters. Never invent fake experience, qualifications, references, certificates, skills, or results.',4999,'ZAR',0,0,15,15,'Truthful South African ATS-ready CV and motivation letter service.'),
db/seeds/n17_founder_command_ops_seed.sql:40 | [fake] ('REQUEST_SOURCE_REVIEW','Request Source Review','SOURCE_REVIEW','Send uncertain source/deadline/fee/requirement to source confidence review.','N12_GOVERNANCE_AND_N16_ORCHESTRATOR',false,true,true,false,'No fake source claims.'),
db/seeds/n18_public_website_seed.sql:106 | [fake] ('NO_FAKE_GUARANTEES','No fake guarantees','CLAIMS','BLOCK','Public copy must not guarantee admission, funding, employment, accommodation, official acceptance, or official response speed.',true),
db/seeds/n18_public_website_seed.sql:110 | [fake] ('TRUTHFUL_CV_BOUNDARY','Truthful CV boundary','PROOF','BLOCK','CV service copy must never invent fake experience, qualifications, references, certificates, skills, or achievements.',true),
db/seeds/n18_public_website_seed.sql:15 | [static] ('PUBLIC_SITE_ORACLE_LITE_STATIC_FIRST','true'::jsonb,'RUNTIME',true)
db/seeds/n19_candidate_mobile_seed.sql:12 | [fake] ('MOBILE_NO_FAKE_STATUS', '"true"', 'Mobile status cards must not invent official results, deadlines, admissions status, NSFAS outcomes, or employer decisions.'),
db/seeds/n20_final_assembly_seed.sql:14 | [fake] ('KINGSMEN_NO_FAKE_CLAIMS', '"true"', 'No fake status, deadlines, acceptance, funding, payment, refund, or AI governance claims.'),
docker-compose.yml:129 | [placeholder] const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kingsmen Portal</title></head><body style="font-family:Arial;background:#05070d;color:#f5d37b;padding:32px"><h1>Kingsmen Portal</h1><p>Oracle Lite boot skeleton. productionReady=false.</p><p>Next UI layer will replace this placeholder with the real mobile-first public/candidate/founder surfaces.</p></body></html>';
docs/N00-doctrine/jarvis-app-connector-law.md:277 | [mock] - Mock-only modules presented as real
docs/N00-doctrine/jarvis-app-connector-law.md:276 | [fake] - Fake AI layers
docs/N00-doctrine/jarvis-app-connector-law.md:225 | [example] .env.example        names only, no real values
docs/N00-doctrine/jarvis-app-connector-law.md:235 | [example] !.env.example
docs/N00-doctrine/jarvis-app-connector-law.md:330 | [example] Example:
docs/N00-doctrine/kimi-repo-access-law.md:220 | [mock] 5. Mock-only modules presented as production-ready
docs/N00-doctrine/kimi-repo-access-law.md:219 | [fake] 4. Fake AI modules
docs/N00-doctrine/kimi-repo-access-law.md:97 | [example] Examples:
docs/N00-doctrine/kimi-repo-access-law.md:146 | [example] Forbidden secret examples:
docs/N00-doctrine/kimi-repo-access-law.md:164 | [example] .env.example     names only, no real values
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:12 | [demo] Kingsmen will build a real Jarvis, not a copied demo assistant.
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:46 | [demo] | Simple Jarvis demos | Voice/HUD inspiration only | Low-medium |
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:113 | [example] Live-data examples:
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md:12 | [demo] - no-secret demos
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:72 | [example] Examples:
docs/agents/PJ42_6_JARVIS_KNOWLEDGE_BRAIN.md:62 | [fake] - fake proof or unsupported status claims.
docs/agents/PJ44_JARVIS_UI_HUD_IMPLEMENTATION.md:25 | [placeholder] - approval placeholder,
docs/agents/PJ44_JARVIS_UI_HUD_IMPLEMENTATION.md:42 | [placeholder] 7. Approval modal placeholder
docs/agents/PJ46_JARVIS_SYSTEM_PROMPT_PERSONALITY_KERNEL.md:43 | [fake] Jarvis must not be vague, dramatic, fake, or careless.
docs/api/KINGSMEN_DEPLOYABLE_API.md:66 | [demo] "commandId": "cmd_demo_001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:68 | [demo] "idempotencyKey": "idem_demo_001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:69 | [demo] "correlationId": "corr_demo_001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:70 | [demo] "actor": { "type": "candidate", "id": "candidate_demo" },
docs/api/KINGSMEN_DEPLOYABLE_API.md:71 | [demo] "candidateId": "KM-DEMO-001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:74 | [demo] "payload": { "displayName": "Demo Candidate", "email": "demo@example.invalid" }
docs/api/KINGSMEN_DEPLOYABLE_API.md:81 | [demo] curl -s http://localhost:8080/api/candidates/KM-DEMO-001/status
docs/api/KINGSMEN_DEPLOYABLE_API.md:90 | [demo] "workflowRunId": "wf_demo_001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:92 | [demo] "candidateId": "KM-DEMO-001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:93 | [demo] "applicationId": "APP-DEMO-001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:94 | [demo] "idempotencyKey": "idem_wf_demo_001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:95 | [demo] "correlationId": "corr_demo_001",
docs/api/KINGSMEN_DEPLOYABLE_API.md:108 | [demo] curl -s http://localhost:8080/api/applications/APP-DEMO-001/workbench
docs/api/KINGSMEN_DEPLOYABLE_API.md:60 | [example] ## Command intake example
docs/api/KINGSMEN_DEPLOYABLE_API.md:74 | [example] "payload": { "displayName": "Demo Candidate", "email": "demo@example.invalid" }
docs/api/KINGSMEN_DEPLOYABLE_API.md:84 | [example] ## Workflow result example
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:104 | [demo] "actor": { "type": "candidate", "id": "candidate_demo" },
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:105 | [demo] "candidateId": "KM-DEMO-001",
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:109 | [demo] "displayName": "Demo Candidate",
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:110 | [demo] "email": "demo@example.invalid",
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:119 | [demo] curl -s http://localhost:8080/api/candidates/KM-DEMO-001/status
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:130 | [demo] "candidateId": "KM-DEMO-001",
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:131 | [demo] "applicationId": "APP-DEMO-001",
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:147 | [demo] curl -s http://localhost:8080/api/applications/APP-DEMO-001/workbench
docs/api/KINGSMEN_TRUTH_VAULT_PERSISTENCE.md:110 | [example] "email": "demo@example.invalid",
docs/constitution/reality-trained-kingsmen-constitution.md:91 | [fake] CV Revamp is locked at R49.99 as a low-cost entry product. If a CV Revamp user upgrades to any Kingsmen package, the upgrade grants +2 active managed applications/routes on top of the selected package quantity. CV Revamp must not invent fake qualifications or fake experience.
docs/control-plane/founder-proof-centre-runtime-reachability.md:5 | [static] BATCH 26 proves that the BATCH 25 Founder Proof Centre static page is reachable through the local Docker Oracle Lite web runtime.
docs/finance/KINGSMEN_PAYFAST_LIVE_RUNTIME_GATE.md:77 | [fake] The source-level gate is built, but live payments stay blocked until real PayFast verification and runtime evidence pass. This is intentional. It protects Kingsmen from false payment activation, double-charging, fake paid status, and unsafe launch claims.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:195 | [fake] - Playwright must not fake official status.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:373 | [fake] - No fake documents.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:431 | [fake] - Jarvis must not fake payment status.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:84 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:163 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:257 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:289 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:317 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:347 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:377 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:404 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:435 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:459 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:485 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:508 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:531 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:562 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:587 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:616 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:642 | [example] Example commands:
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:656 | [example] Examples:
docs/jarvis/JARVIS_AIRTABLE_HUMAN_MIRROR_BOUNDARY.md:21 | [fake] - no fake status
docs/jarvis/JARVIS_AI_EMAIL_PROVIDER_LIVE_PROOF.md:46 | [mock] - A mock completion is presented as a live AI proof.
docs/jarvis/JARVIS_AI_PROVIDER_CREDENTIAL_BOUNDARY.md:15 | [fake] - no fake status
docs/jarvis/JARVIS_AI_TOOLS_RUNTIME_READINESS.md:25 | [fake] - no fake status
docs/jarvis/JARVIS_COMMAND_RUNTIME_TRUTH_VAULT_PROOF.md:32 | [fake] - no fake status
docs/jarvis/JARVIS_COMMAND_STANDARD.md:405 | [fake] - No fake documents.
docs/jarvis/JARVIS_COMMAND_STANDARD.md:406 | [fake] - No fake applications.
docs/jarvis/JARVIS_COMMAND_STANDARD.md:407 | [fake] - No fake status.
docs/jarvis/JARVIS_COMMAND_STANDARD.md:408 | [fake] - No fake guarantees.
docs/jarvis/JARVIS_COMMAND_STANDARD.md:52 | [example] Correct examples:
docs/jarvis/JARVIS_COMMAND_STANDARD.md:62 | [example] Incorrect examples:
docs/jarvis/JARVIS_COMMAND_STANDARD.md:177 | [example] Example:
docs/jarvis/JARVIS_COMMAND_STANDARD.md:185 | [example] Example:
docs/jarvis/JARVIS_COMMAND_STANDARD.md:193 | [example] Example:
docs/jarvis/JARVIS_COMMAND_STANDARD.md:201 | [example] Example:
docs/jarvis/JARVIS_COMMAND_TRUTH_VAULT_PERSISTENCE.md:17 | [fake] ## No fake data rule
docs/jarvis/JARVIS_COMMAND_TRUTH_VAULT_PERSISTENCE.md:21 | [fake] ## no fake status
docs/jarvis/JARVIS_COMMAND_TRUTH_VAULT_PERSISTENCE.md:17 | [fake data] ## No fake data rule
docs/jarvis/JARVIS_DASHBOARD_COMPLETION_BOARD.md:19 | [fake] - No fake production readiness.
docs/jarvis/JARVIS_DOCKER_TRUTH_VAULT_RUNTIME_PROOF.md:34 | [mock] - Storage mode is memory or mock.
docs/jarvis/JARVIS_EMAIL_PRIMARY_CHANNEL_BOUNDARY.md:24 | [fake] - no fake status
docs/jarvis/JARVIS_FINAL_HUD_LIVE_PROOF_QUEUE.md:32 | [fake] - No fake data and no secret exposure locks.
docs/jarvis/JARVIS_FINAL_HUD_LIVE_PROOF_QUEUE.md:32 | [fake data] - No fake data and no secret exposure locks.
docs/jarvis/JARVIS_GITHUB_TOOL_CONNECTOR_BOUNDARY.md:22 | [fake] - no fake status
docs/jarvis/JARVIS_LIVE_PROOF_ACCEPTANCE_GATE.md:27 | [placeholder] - Not derived from fake placeholders.
docs/jarvis/JARVIS_LIVE_PROOF_ACCEPTANCE_GATE.md:35 | [mock] - AI proof from browser-side provider calls or mock completions.
docs/jarvis/JARVIS_LIVE_PROOF_ACCEPTANCE_GATE.md:27 | [fake] - Not derived from fake placeholders.
docs/jarvis/JARVIS_LIVE_PROOF_QUEUE.md:37 | [fake] - No fake readiness.
docs/jarvis/JARVIS_N8N_AIRTABLE_GITHUB_RUNTIME_PROOF.md:67 | [static] - Runtime proof is only a static source route.
docs/jarvis/JARVIS_N8N_THIN_RELAY_BOUNDARY.md:13 | [fake] - No fake status is allowed.
docs/jarvis/JARVIS_PAYFAST_PROVIDER_PROOF_QUEUE_BOUNDARY.md:57 | [fake] - no fake status
docs/jarvis/JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY.md:17 | [fake] - No fake status.
docs/jarvis/JARVIS_PRODUCTION_COMMAND_SURFACE.md:12 | [fake] - The page does not substitute fake candidate, payment, route, AI, or operational data when backend status is unavailable.
docs/jarvis/JARVIS_PRODUCTION_COMMAND_SURFACE.md:3 | [demo] Jarvis is now treated as a live Kingsmen command surface, not a local demo screen.
docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md:3 | [fake] Jarvis production is not allowed to display fake status for AI, tools, apps, agents, payments, evidence, or infrastructure.
docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md:21 | [fake] - no fake status.
docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md:5 | [dummy] The route `/api/jarvis/live-index` returns a real boundary index for the current deployment. It does not execute local shell commands, does not write proof files from the web app, does not read raw secrets, and does not substitute dummy provider state.
docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md:23 | [dummy] - No dummy provider cards.
docs/jarvis/JARVIS_SOURCE_COMPLETION_SEAL.md:29 | [fake] - No fake production readiness.
docs/jarvis/JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY.md:37 | [fake] - no fake status
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:12 | [placeholder] 2. reject placeholders such as `...`, `changeme`, `your_value_here`, `example.com`, `REAL_VALUE`, `REAL_BUCKET`, `dummy_*`, or `fake_*`;
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:33 | [placeholder] | Truth Vault | `KINGSMEN_DATABASE_URL`, `DATABASE_URL` | Must be present, non-placeholder, and runtime proof must pass. |
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:34 | [placeholder] | Queue Fabric | `REDIS_URL` | Must be present, non-placeholder, and observability queue/DLQ proof must pass. |
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:153 | [placeholder] | `BLOCKED_CREDENTIALS` | Required environment values are missing or placeholders. |
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:163 | [placeholder] 3. Replace any `PLACEHOLDER_REJECTED` or missing values.
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:171 | [placeholder] Values such as `REAL_VALUE`, `REAL_BUCKET`, `REAL_SECRET`, `REAL_KEY`, `REAL_TOKEN`, `dummy_*`, and `fake_*` are treated as placeholders. They must never create a passed staging proof or a ready activation matrix state.
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:12 | [fake] 2. reject placeholders such as `...`, `changeme`, `your_value_here`, `example.com`, `REAL_VALUE`, `REAL_BUCKET`, `dummy_*`, or `fake_*`;
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:171 | [fake] Values such as `REAL_VALUE`, `REAL_BUCKET`, `REAL_SECRET`, `REAL_KEY`, `REAL_TOKEN`, `dummy_*`, and `fake_*` are treated as placeholders. They must never create a passed staging proof or a ready activation matrix state.
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:12 | [dummy] 2. reject placeholders such as `...`, `changeme`, `your_value_here`, `example.com`, `REAL_VALUE`, `REAL_BUCKET`, `dummy_*`, or `fake_*`;
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:169 | [dummy] ## Dummy value rejection
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:171 | [dummy] Values such as `REAL_VALUE`, `REAL_BUCKET`, `REAL_SECRET`, `REAL_KEY`, `REAL_TOKEN`, `dummy_*`, and `fake_*` are treated as placeholders. They must never create a passed staging proof or a ready activation matrix state.
docs/jarvis/KINGSMEN_JARVIS_CREDENTIAL_ACTIVATION.md:12 | [example] 2. reject placeholders such as `...`, `changeme`, `your_value_here`, `example.com`, `REAL_VALUE`, `REAL_BUCKET`, `dummy_*`, or `fake_*`;
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_03_JOELSHINE_JARVIS_V2.md:55 | [demo] The project demonstrates simple human command patterns such as greeting Jarvis, waking Jarvis, opening apps, taking screenshots, taking notes, checking time/date/weather, searching, and extracting text from an image.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_03_JOELSHINE_JARVIS_V2.md:74 | [demo] The project demonstrates practical desktop-helper thinking: app opening, screenshots, notes, battery/system information, media controls, OCR, and utility windows.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_03_JOELSHINE_JARVIS_V2.md:59 | [example] Jarvis needs a plain command vocabulary that the founder can remember, for example:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:116 | [example] 3. Raw `.env` examples that encourage weak secret handling
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:90 | [demo] The public project demonstrates a plugin model where a new command can be added as a separate function/module.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:144 | [hardcoded] hardcoded secrets
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:251 | [hardcoded] hardcoded secrets
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:197 | [example] -> launchpad, local utility feel, old-style assistant command examples
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:83 | [example] 7. Simple command examples for founder training
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:115 | [example] JarvisFounderTrainingCommandExamples
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:288 | [example] Gladiator07/JARVIS is valuable as a public example of:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md:72 | [example] Examples:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md:147 | [example] Examples:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_19_CLINE.md:16 | [example] Cline is relevant to Kingsmen because it is one of the strongest public examples of a repo-native coding agent. It can operate through CLI, IDE extension, SDK, and a Kanban-style multi-agent task board.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_21_ROO_CODE.md:43 | [demo] - JarvisCodeMode
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_27_CREWAI.md:210 | [example] Example:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:158 | [example] ## 8. Kingsmen app examples
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:95 | [fake] - inventing a fake sequence,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:285 | [fake] The HUD must never show fake progress.
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:347 | [fake] → fake completion claim
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:413 | [fake] Evidence is not just audit. It protects Jarvis from fake memory and fake completion.
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:588 | [fake] - no fake new number,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:691 | [fake] - validate-jarvis-command-received-no-fake-completion.mjs
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:753 | [fake] 11. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:116 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:397 | [example] Example evidence event:
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:555 | [example] ## 14. Real-life examples
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:557 | [example] ### Example A — normal command
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:575 | [example] ### Example B — correction command
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:592 | [example] ### Example C — voice command
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:611 | [example] ### Example D — unsafe command
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:780 | [fake] 14. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:133 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:143 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:153 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:238 | [example] Example:
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:312 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:426 | [example] For example, Jarvis may remember:
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:547 | [example] ## 14. Real-life examples
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:549 | [example] ### Example A — simple explanation
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:559 | [example] ### Example B — question requiring live verification
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:569 | [example] ### Example C — question about a contact
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:579 | [example] ### Example D — question about a Drive file
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:589 | [example] ### Example E — question about schedule
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:599 | [example] ### Example F — unsafe overclaim
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:296 | [fake] Voice must never speak fake certainty.
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:828 | [fake] 15. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:107 | [example] Example:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:178 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:188 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:198 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:208 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:218 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:298 | [example] Example spoken response:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:366 | [example] Examples that must trigger Number 03:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:450 | [example] Example response shape:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:602 | [example] Those are examples of current facts, not replacements for the main number.
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:610 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:612 | [example] ### Example A — current official information
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:622 | [example] ### Example B — current repo information
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:632 | [example] ### Example C — current system status
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:642 | [example] ### Example D — current payment state
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:652 | [example] ### Example E — current calendar
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:662 | [example] ### Example F — current contact
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:672 | [example] ### Example G — current portal
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:819 | [fake] 15. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:108 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:151 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:161 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:171 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:181 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:191 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:593 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:595 | [example] ### Example A — application opening date
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:613 | [example] ### Example B — closing date risk
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:623 | [example] ### Example C — conflicting dates
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:633 | [example] ### Example D — candidate reminder
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:643 | [example] ### Example E — portal blocker
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:653 | [example] ### Example F — payment deadline
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:685 | [fake] 13. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:128 | [static] Weather must be treated as live intelligence, not static knowledge.
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:99 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:136 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:146 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:156 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:166 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:497 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:499 | [example] ### Example A — simple weather request
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:509 | [example] ### Example B — travel risk
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:519 | [example] ### Example C — agriculture/homestead work
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:529 | [example] ### Example D — morning command brief
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:539 | [example] ### Example E — unclear location
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:777 | [fake] 15. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:114 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:157 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:167 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:177 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:187 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:197 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:273 | [example] Example spoken answer:
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:569 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:571 | [example] ### Example A — general news brief
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:581 | [example] ### Example B — Kingsmen-relevant news
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:591 | [example] ### Example C — developing story
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:601 | [example] ### Example D — official update
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:611 | [example] ### Example E — unsupported rumour
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:621 | [example] ### Example F — action request from news
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:82 | [fake] - avoid fake guarantees.
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:320 | [fake] The HUD must not show fake certainty such as “job secured” unless actual employer-confirmed proof exists.
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:453 | [fake] - correction rule: no fake job guarantees,
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:503 | [fake] Relevant when CV, ID, certificates, qualifications, payslips, or supporting documents must be checked for readiness. No fake documents.
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:734 | [fake] - validate-jarvis-job-no-fake-guarantees.mjs
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:801 | [fake] 15. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:118 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:162 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:172 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:182 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:192 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:202 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:586 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:588 | [example] ### Example A — job search
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:598 | [example] ### Example B — weak lead verification
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:608 | [example] ### Example C — CV route
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:618 | [example] ### Example D — document sharing
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:628 | [example] ### Example E — learnership route
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:638 | [example] ### Example F — suspicious opportunity
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:61 | [fake] It means Jarvis must not answer business matters with shallow inspiration, generic startup advice, or fake certainty. Jarvis must analyse the actual business issue, separate what is commercially real from what is only theoretical, identify risk, and present the strongest practical path for the Commander.
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:155 | [fake] - making fake revenue claims,
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:467 | [fake] - no fake guarantees,
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:734 | [fake] - validate-jarvis-business-no-fake-guarantees.mjs
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:801 | [fake] 16. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:118 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:172 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:182 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:192 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:202 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:212 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:591 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:593 | [example] ### Example A — business idea
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:603 | [example] ### Example B — Kingsmen pricing
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:613 | [example] ### Example C — module decision
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:623 | [example] ### Example D — partner route
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:633 | [example] ### Example E — zero-capital path
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:643 | [example] ### Example F — PayFast boundary
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:823 | [fake] 16. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:139 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:184 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:194 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:204 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:214 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:224 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:608 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:610 | [example] ### Example A — choosing a tool
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:620 | [example] ### Example B — voice architecture
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:630 | [example] ### Example C — Airtable boundary
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:640 | [example] ### Example D — n8n boundary
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:650 | [example] ### Example E — repo proof vs runtime proof
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:660 | [example] ### Example F — avoiding useless layers
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:157 | [placeholder] - using placeholders as final code,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:177 | [fake] Code damage means Jarvis makes a change that appears useful but breaks the repo, weakens doctrine, hides the real fault, removes working behaviour, or creates fake progress.
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:431 | [fake] - no fake completion claim,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:852 | [fake] 18. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:135 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:185 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:195 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:205 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:215 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:225 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:629 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:631 | [example] ### Example A — code inspection
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:641 | [example] ### Example B — GitHub file creation
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:651 | [example] ### Example C — build failure
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:661 | [example] ### Example D — unsafe rewrite
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:671 | [example] ### Example E — runtime proof boundary
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:681 | [example] ### Example F — validator need
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:389 | [fake] - No agent may fake completion, official status, or payment status.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:452 | [fake] - no fake guarantees,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:490 | [fake] Prevents AI/agent overreach, private data exposure, fake authority, and unsafe actions.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:792 | [fake] 17. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:117 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:160 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:170 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:180 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:190 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:200 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:526 | [example] Relevant as the later specialised gateway number. For Number 11, OpenClaw remains an example of a governed agent-routing boundary, not uncontrolled automation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:574 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:576 | [example] ### Example A — agent role design
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:586 | [example] ### Example B — AI versus rules
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:596 | [example] ### Example C — agent tool boundary
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:606 | [example] ### Example D — unsafe full autonomy
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:616 | [example] ### Example E — OpenClaw boundary
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:626 | [example] ### Example F — runtime proof boundary
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:780 | [fake] 17. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:133 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:172 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:182 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:192 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:202 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:212 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:570 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:572 | [example] ### Example A — gateway explanation
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:582 | [example] ### Example B — routing agents
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:592 | [example] ### Example C — unsafe submission
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:602 | [example] ### Example D — payment boundary
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:612 | [example] ### Example E — runtime proof boundary
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:74 | [fake] It means Jarvis must never describe Playwright as an autonomous decision-maker or unsafe portal-submission machine. Playwright may help scout portals and gather evidence, but it must not override controls, bypass CAPTCHA or OTP, force submissions, fake results, or mark anything as official without verified evidence.
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:167 | [fake] Portal automation harm means a browser automation tool acts beyond its authority, bypasses controls, mishandles private data, creates fake application confidence, or causes the Commander to believe an official action happened when it did not.
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:398 | [fake] - Playwright must not fake official status.
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:463 | [fake] - Playwright must not fake official status,
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:712 | [fake] "forbiddenActions": ["bypass_captcha", "bypass_otp", "force_submission", "fake_official_result"],
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:736 | [fake] - validate-jarvis-playwright-no-fake-official-result.mjs
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:750 | [fake] - Jarvis allows fake official result claims,
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:800 | [fake] 8. Jarvis can block fake official-result claims.
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:809 | [fake] 17. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:131 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:175 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:185 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:195 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:205 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:215 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:588 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:590 | [example] ### Example A — scout explanation
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:600 | [example] ### Example B — portal inspection
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:610 | [example] ### Example C — CAPTCHA blocker
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:620 | [example] ### Example D — unsafe submission
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:630 | [example] ### Example E — runtime proof boundary
docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md:640 | [example] ### Example F — manual fallback
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:170 | [fake] Workflow overreach means n8n quietly becomes the decision-maker, mutates state without authority, duplicates actions, sends unapproved communications, exposes data, or creates fake operational success.
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:479 | [fake] - no fake completion,
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:829 | [fake] 19. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:132 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:178 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:188 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:198 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:208 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:218 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:599 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:601 | [example] ### Example A — worker explanation
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:611 | [example] ### Example B — reminder workflow
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:621 | [example] ### Example C — unsafe bulk messaging
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:631 | [example] ### Example D — truth boundary
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:641 | [example] ### Example E — payment boundary
docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md:651 | [example] ### Example F — runtime proof boundary
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:32 | [placeholder] The Commander supplied a placeholder path for Number 15. Jarvis must not create a file literally named `NUMBER_15_....md` because ellipses are not a canonical doctrine title.
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:43 | [placeholder] - do not create placeholder filenames,
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:458 | [fake] - no fake status,
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:797 | [fake] 18. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:125 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:168 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:178 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:188 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:198 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:208 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:575 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:577 | [example] ### Example A — mirror explanation
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:587 | [example] ### Example B — operator view
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:597 | [example] ### Example C — false status risk
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:607 | [example] ### Example D — sync conflict
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:617 | [example] ### Example E — payment boundary
docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md:627 | [example] ### Example F — runtime proof boundary
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:471 | [fake] - no fake status,
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:813 | [fake] 19. No fake completion claim is made.
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:125 | [example] Examples:
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:171 | [example] Example 1:
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:181 | [example] Example 2:
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:191 | [example] Example 3:
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:201 | [example] Example 4:
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:211 | [example] Example 5:
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:589 | [example] ## 15. Real-life examples
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:591 | [example] ### Example A — Truth Vault explanation
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:601 | [example] ### Example B — Airtable conflict
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:611 | [example] ### Example C — raw data request
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:621 | [example] ### Example D — mutation request
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:631 | [example] ### Example E — migration proof boundary
docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md:641 | [example] ### Example F — read model
docs/jarvis/v5/script-library/NUMBER_18_WHEN_THE_COMMANDER_ASKS_ABOUT_GITHUB.md:102 | [fake] - no fake runtime claim,
docs/jarvis/v5/script-library/NUMBER_24_WHEN_THE_COMMANDER_ASKS_ABOUT_REPORTS.md:51 | [fake] - fake operational proof,
docs/jarvis/v5/script-library/NUMBER_25_WHEN_THE_COMMANDER_ASKS_FOR_STRATEGY.md:118 | [fake] - no fake certainty,
docs/jarvis/v5/script-library/NUMBER_26_WHEN_THE_COMMANDER_ASKS_FOR_REPAIR.md:51 | [fake] - fake completion claim,
docs/jarvis/v5/script-library/NUMBER_27_WHEN_THE_COMMANDER_ASKS_FOR_INSPECTION.md:50 | [fake] - fake validator proof,
docs/jarvis/v5/script-library/NUMBER_29_WHEN_THE_COMMANDER_CORRECTS_YOU.md:54 | [fake] - fake apology without material change,
docs/jarvis/v5/script-library/NUMBER_30_WHEN_EVIDENCE_IS_MISSING.md:49 | [fake] - fake verification,
docs/jarvis/v5/script-library/NUMBER_31_WHEN_THE_SYSTEM_IS_STABLE.md:50 | [fake] - fake runtime proof,
docs/jarvis/v5/script-library/NUMBER_34_WHEN_COMMAND_IS_COMPLETE.md:56 | [fake] - fake “done”,
docs/launch/KINGSMEN_LAUNCH_READINESS.md:182 | [sample] Staging observability proof still required: API health proof, database health proof, queue/DLQ proof, structured log sample with correlationId, alert proof, SEV1/SEV2/SEV3 incident drill, founder escalation, and no PII or secrets in logs proof.
docs/launch/KINGSMEN_STAGING_RUNTIME_EVIDENCE_CAPTURE.md:57 | [fake] A report may become `passed: true` only after the real staging check passes. The runner does not fake external provider proofs.
docs/master/KINGSMEN_BUILD_ORDER_AND_PROOF_RULES.md:10 | [fake] Do not move forward on fake proof.
docs/master/KINGSMEN_MASTER_LAYER_INDEX.md:121 | [demo] - N20.5 — End-to-End Interaction Proof / Demo Seed / Luxury UI / Mobile Test
docs/n06/N06_ROUTE_03_BACKEND_TYPES_SAFETY_READINESS_CHOICE_OPTIMIZER.md:10 | [fake] - no guarantee / no fake success claims
docs/ops/KINGSMEN_LOCAL_TRUTH_VAULT_POSTGRES.md:3 | [placeholder] This is a **local/staging-only** PostgreSQL starter for generating real Truth Vault evidence without using placeholder database URLs.
docs/personal-jobs/apply-now-today.md:18 | [fake] This does not fake submissions, bypass portals, bypass logins, bypass OTP/CAPTCHA, invent jobs, invent documents or guarantee employment.
docs/personal-jobs/personal-jobs-19-playwright-source-scout.md:39 | [static] - `HEALTHY_STATIC`
docs/personal-jobs/personal-jobs-20b-opportunity-quality-gate.md:1 | [demo] # PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion
docs/personal-jobs/personal-jobs-36-platform-shell.md:14 | [placeholder] - Mobile navigation placeholder structure
docs/public/first-public-website-free-destiny-map.md:60 | [static] This batch creates static route/page/components/contracts/validator only.
docs/runtime/free-destiny-map-backend-runtime-boundary.md:19 | [demo] - `/api/public/free-destiny-map/intake/local` accepts a safe demo payload
docs/runtime/free-destiny-map-controlled-web-api-integration-proof.md:11 | [demo] BATCH 15B now adds a real Next route handler at `/api/public/free-destiny-map/intake/local`, starts the controlled local Next dev server, fetches the Free Destiny Map page, posts a safe demo intake payload to the local API route, verifies HTTP 202, writes local JSONL proof, and shuts the server down.
docs/runtime/free-destiny-map-controlled-web-api-integration-proof.md:18 | [demo] - a safe demo intake payload can be posted to the same-origin local API route
docs/runtime/free-destiny-map-local-http-exercise.md:13 | [demo] - a safe demo payload can be POSTed as JSON
docs/runtime/free-destiny-map-local-route-exercise.md:7 | [demo] It proves the local pathway from a safe demo payload into a local JSONL proof record, while keeping production runtime claims blocked.
docs/runtime/free-destiny-map-local-route-exercise.md:27 | [demo] - a safe demo payload can be shaped into a local intake exercise
docs/runtime/free-destiny-map-local-web-http-exercise.md:7 | [demo] BATCH 09 proved a temporary local HTTP API route. BATCH 10 proves a temporary local web shell can serve a Free Destiny Map page and route a safe demo intake payload to the local HTTP intake endpoint.
docs/security/KINGSMEN_RLS_SECURITY_PROOF.md:31 | [example] SET LOCAL app.candidate_public_ref = 'KM-EXAMPLE-0001';
docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md:42 | [placeholder] It must contain empty placeholders only. Real values belong in local `.env`, GitHub Secrets, Oracle environment variables, or a future vault/KMS.
docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md:11 | [hardcoded] Kingsmen must run from environment-managed secrets, not hardcoded repo values. The repo may store names, providers, required status, rotation metadata, and masked health results only.
docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md:34 | [example] ## Runtime environment example
docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md:39 | [example] .env.example
docs/web/KINGSMEN_SAFE_WEB_BACKEND_BOUNDARY.md:81 | [static] It renders backend health and static command options only.
doctrine/n00/kingsmen-laws.json:18 | [fake] "No fake guarantees.",
incoming/BATCH-04.txt:261 | [placeholder] <input style={fieldStyle} placeholder="Full name" />
incoming/BATCH-04.txt:266 | [placeholder] <input style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
incoming/BATCH-04.txt:286 | [placeholder] <input style={fieldStyle} placeholder="Bursary, job, college, landlord, learnership, accommodation, training provider..." />
incoming/BATCH-04.txt:291 | [placeholder] <textarea style={{ ...fieldStyle, minHeight: 110 }} placeholder="Documents, CV, marks, ID, proof, known route, accommodation need..." />
incoming/BATCH-04.txt:62 | [static] This batch creates static route/page/components/contracts/validator only.
incoming/BATCH-04.txt:266 | [example] <input style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
incoming/BATCH-07.txt:270 | [placeholder] <input name="fullName" style={fieldStyle} placeholder="Full name" />
incoming/BATCH-07.txt:275 | [placeholder] <input name="province" style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
incoming/BATCH-07.txt:280 | [placeholder] <input name="knownRoute" style={fieldStyle} placeholder="Example: UJ, TVET, NSFAS, CV, accommodation, learnership..." />
incoming/BATCH-07.txt:285 | [placeholder] <textarea name="currentSituation" style={{ ...fieldStyle, minHeight: 96 }} placeholder="Tell Kingsmen what you are trying to do." />
incoming/BATCH-07.txt:307 | [placeholder] <input name="accommodationArea" style={fieldStyle} placeholder="Example: Durban, Johannesburg, Cape Town, campus/workplace area..." />
incoming/BATCH-07.txt:327 | [placeholder] <input name="randomSourceName" style={fieldStyle} placeholder="Name or link to check later" />
incoming/BATCH-07.txt:454 | [static] runtime_scope: "static local boot proof only; no server started; no production storage",
incoming/BATCH-07.txt:481 | [static] "runtime_scope": "static local boot proof only; no server started; no production storage",
incoming/BATCH-07.txt:275 | [example] <input name="province" style={fieldStyle} placeholder="Example: KwaZulu-Natal, Gauteng, Eastern Cape" />
incoming/BATCH-07.txt:280 | [example] <input name="knownRoute" style={fieldStyle} placeholder="Example: UJ, TVET, NSFAS, CV, accommodation, learnership..." />
incoming/BATCH-07.txt:307 | [example] <input name="accommodationArea" style={fieldStyle} placeholder="Example: Durban, Johannesburg, Cape Town, campus/workplace area..." />
incoming/BATCH-08.txt:9 | [demo] It proves the local pathway from a safe demo payload into a local JSONL proof record, while keeping production runtime claims blocked.
incoming/BATCH-08.txt:29 | [demo] - a safe demo payload can be shaped into a local intake exercise
incoming/BATCH-08.txt:74 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-08.txt:109 | [demo] fullName: "Kingsmen Demo Candidate";
incoming/BATCH-08.txt:179 | [demo] const localDataFile = path.join(localDataDir, "demo-intakes.jsonl");
incoming/BATCH-08.txt:228 | [demo] const demoPayload = {
incoming/BATCH-08.txt:229 | [demo] fullName: "Kingsmen Demo Candidate",
incoming/BATCH-08.txt:231 | [demo] currentSituation: "Demo user wants a full route map across study, TVET, funding, accommodation and CV readiness.",
incoming/BATCH-08.txt:239 | [demo] randomSourceName: "Demo bursary or learnership source to check later",
incoming/BATCH-08.txt:244 | [demo] const hasConsent = demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true;
incoming/BATCH-08.txt:246 | [demo] demoPayload.routeInterests.length > 0 ||
incoming/BATCH-08.txt:247 | [demo] Boolean(demoPayload.currentSituation) ||
incoming/BATCH-08.txt:248 | [demo] Boolean(demoPayload.knownRoute) ||
incoming/BATCH-08.txt:249 | [demo] Boolean(demoPayload.randomSourceName);
incoming/BATCH-08.txt:251 | [demo] check("demo-payload-has-consent", hasConsent, "contact and basic-info processing consent true");
incoming/BATCH-08.txt:252 | [demo] check("demo-payload-has-route-intent", hasIntent, "route interest or situation present");
incoming/BATCH-08.txt:253 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
incoming/BATCH-08.txt:269 | [demo] payload: demoPayload,
incoming/BATCH-08.txt:299 | [demo] demo_reference: reference,
incoming/BATCH-08.txt:378 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
incoming/BATCH-08.txt:389 | [demo] ["scripts/proof/prove-free-destiny-map-local-route-exercise.mjs", ["LOCAL_ROUTE_EXERCISE_PROVEN", "demo-payload-has-consent", "local-jsonl-proof-write", "storesProductionData: false"]],
incoming/BATCH-09.txt:15 | [demo] - a safe demo payload can be POSTed as JSON
incoming/BATCH-09.txt:67 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-09.txt:104 | [demo] fullName: "Kingsmen HTTP Demo Candidate";
incoming/BATCH-09.txt:183 | [demo] const localDataFile = path.join(localDataDir, "http-demo-intakes.jsonl");
incoming/BATCH-09.txt:258 | [demo] const demoPayload = {
incoming/BATCH-09.txt:259 | [demo] fullName: "Kingsmen HTTP Demo Candidate",
incoming/BATCH-09.txt:261 | [demo] currentSituation: "HTTP demo user wants a route map across study, TVET, funding, accommodation and CV readiness.",
incoming/BATCH-09.txt:269 | [demo] randomSourceName: "HTTP demo bursary or learnership source to check later",
incoming/BATCH-09.txt:274 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
incoming/BATCH-09.txt:275 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
incoming/BATCH-09.txt:276 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
incoming/BATCH-09.txt:356 | [demo] nextAction: accepted ? "Local HTTP shell accepted the demo payload." : "Fix local HTTP demo payload issues.",
incoming/BATCH-09.txt:414 | [demo] body: JSON.stringify(demoPayload)
incoming/BATCH-09.txt:540 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
incoming/BATCH-10.txt:9 | [demo] BATCH 09 proved a temporary local HTTP API route. BATCH 10 proves a temporary local web shell can serve a Free Destiny Map page and route a safe demo intake payload to the local HTTP intake endpoint.
incoming/BATCH-10.txt:71 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-10.txt:111 | [demo] fullName: "Kingsmen Web Demo Candidate";
incoming/BATCH-10.txt:190 | [demo] const localDataFile = path.join(localDataDir, "web-http-demo-intakes.jsonl");
incoming/BATCH-10.txt:292 | [demo] <input name="fullName" value="Kingsmen Web Demo Candidate" />
incoming/BATCH-10.txt:295 | [demo] <textarea name="currentSituation">Web demo user wants a route map across study, TVET, funding, accommodation and CV readiness.</textarea>
incoming/BATCH-10.txt:301 | [demo] <input name="randomSourceName" value="Web demo bursary or learnership source to check later" />
incoming/BATCH-10.txt:315 | [demo] const demoPayload = {
incoming/BATCH-10.txt:316 | [demo] fullName: "Kingsmen Web Demo Candidate",
incoming/BATCH-10.txt:318 | [demo] currentSituation: "Web demo user wants a route map across study, TVET, funding, accommodation and CV readiness.",
incoming/BATCH-10.txt:326 | [demo] randomSourceName: "Web demo bursary or learnership source to check later",
incoming/BATCH-10.txt:331 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
incoming/BATCH-10.txt:332 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
incoming/BATCH-10.txt:333 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
incoming/BATCH-10.txt:420 | [demo] nextAction: accepted ? "Local web-to-HTTP shell accepted the demo payload." : "Fix local web-to-HTTP demo payload issues.",
incoming/BATCH-10.txt:488 | [demo] body: JSON.stringify(demoPayload)
incoming/BATCH-10.txt:616 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
incoming/BATCH-11.txt:79 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-11.txt:116 | [demo] fullName: "Kingsmen Browser Demo Candidate";
incoming/BATCH-11.txt:195 | [demo] const localDataFile = path.join(localDataDir, "browser-style-demo-intakes.jsonl");
incoming/BATCH-11.txt:373 | [demo] <input name="fullName" value="Kingsmen Browser Demo Candidate" />
incoming/BATCH-11.txt:376 | [demo] <textarea name="currentSituation">Browser-style demo user wants a route map across study, TVET, funding, accommodation and CV readiness.</textarea>
incoming/BATCH-11.txt:388 | [demo] <input name="randomSourceName" value="Browser demo bursary or learnership source to check later" />
incoming/BATCH-11.txt:487 | [demo] nextAction: accepted ? "Browser-style submit proof accepted the demo payload." : "Fix browser-style demo payload issues.",
incoming/BATCH-11.txt:552 | [demo] check("browser-style-extracted-full-name", extractedPayload.fullName === "Kingsmen Browser Demo Candidate", extractedPayload.fullName);
incoming/BATCH-11.txt:704 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
incoming/BATCH-12.txt:194 | [demo] const nodeModulesExists = exists("node_modules");
incoming/BATCH-12.txt:195 | [demo] const webNodeModulesExists = exists("apps/web/node_modules");
incoming/BATCH-12.txt:272 | [demo] const dependencyInstallEvidence = nodeModulesExists || webNodeModulesExists;
incoming/BATCH-12.txt:354 | [demo] nodeModulesExists,
incoming/BATCH-12.txt:355 | [demo] webNodeModulesExists
incoming/BATCH-13.txt:130 | [example] !.env.example
incoming/BATCH-15B.txt:13 | [demo] BATCH 15B now adds a real Next route handler at `/api/public/free-destiny-map/intake/local`, starts the controlled local Next dev server, fetches the Free Destiny Map page, posts a safe demo intake payload to the local API route, verifies HTTP 202, writes local JSONL proof, and shuts the server down.
incoming/BATCH-15B.txt:20 | [demo] - a safe demo intake payload can be posted to the same-origin local API route
incoming/BATCH-15B.txt:71 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-15B.txt:184 | [demo] ? "Controlled local Next API accepted the safe demo Free Destiny Map payload."
incoming/BATCH-15B.txt:192 | [demo] const localDataFile = path.join(localDataDir, "next-api-demo-intakes.jsonl");
incoming/BATCH-15B.txt:320 | [demo] const localDataFile = path.join(root, "data/local/free-destiny-map/next-api-integration/next-api-demo-intakes.jsonl");
incoming/BATCH-15B.txt:456 | [demo] check("next-api-route-writes-local-jsonl", route.includes("next-api-demo-intakes.jsonl"), "local JSONL write");
incoming/BATCH-15B.txt:476 | [demo] const demoPayload = {
incoming/BATCH-15B.txt:477 | [demo] fullName: "Kingsmen Integrated Demo Candidate",
incoming/BATCH-15B.txt:479 | [demo] currentSituation: "Integrated local web plus API demo user wants study, funding, accommodation and CV route guidance.",
incoming/BATCH-15B.txt:487 | [demo] randomSourceName: "Integrated demo bursary or learnership source to check later",
incoming/BATCH-15B.txt:492 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
incoming/BATCH-15B.txt:493 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
incoming/BATCH-15B.txt:494 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
incoming/BATCH-15B.txt:574 | [demo] body: JSON.stringify(demoPayload)
incoming/BATCH-15B.txt:734 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
incoming/BATCH-15B.txt:745 | [demo] ["apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts", ["export async function POST", "runtime = \"nodejs\"", "next-api-demo-intakes.jsonl", "productionReady: false", "officialApplicationSubmitted: false", "paymentInstructionSent: false", "documentUploadAccepted: false", "emailSent: false"]],
incoming/BATCH-17.txt:21 | [demo] - `/api/public/free-destiny-map/intake/local` accepts a safe demo payload
incoming/BATCH-17.txt:72 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-17.txt:216 | [demo] ? "Backend local boundary accepted the safe demo Free Destiny Map payload."
incoming/BATCH-17.txt:224 | [demo] const localDataFile = path.join(localDataDir, "backend-runtime-demo-intakes.jsonl");
incoming/BATCH-17.txt:409 | [demo] const localDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");
incoming/BATCH-17.txt:499 | [demo] const demoPayload = {
incoming/BATCH-17.txt:500 | [demo] fullName: "Kingsmen Backend Runtime Demo Candidate",
incoming/BATCH-17.txt:502 | [demo] currentSituation: "Backend boundary demo user wants study, funding, accommodation and CV route guidance.",
incoming/BATCH-17.txt:510 | [demo] randomSourceName: "Backend demo bursary or learnership source to check later",
incoming/BATCH-17.txt:515 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
incoming/BATCH-17.txt:516 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
incoming/BATCH-17.txt:517 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
incoming/BATCH-17.txt:568 | [demo] body: JSON.stringify(demoPayload)
incoming/BATCH-17.txt:733 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
incoming/BATCH-18.txt:82 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-18.txt:244 | [demo] const localDataFile = path.join(localDataDir, "next-api-demo-intakes.jsonl");
incoming/BATCH-18.txt:340 | [demo] ? "Next API route bridged the safe demo Free Destiny Map payload to the backend runtime boundary."
incoming/BATCH-18.txt:376 | [demo] nextAction: "Controlled local Next API accepted the safe demo Free Destiny Map payload.",
incoming/BATCH-18.txt:491 | [demo] const backendLocalDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");
incoming/BATCH-18.txt:679 | [demo] const demoPayload = {
incoming/BATCH-18.txt:680 | [demo] fullName: "Kingsmen Next Backend Bridge Demo Candidate",
incoming/BATCH-18.txt:682 | [demo] currentSituation: "Next-to-backend bridge demo user wants study, funding, accommodation and CV route guidance.",
incoming/BATCH-18.txt:690 | [demo] randomSourceName: "Next bridge demo bursary or learnership source to check later",
incoming/BATCH-18.txt:695 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
incoming/BATCH-18.txt:696 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
incoming/BATCH-18.txt:697 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
incoming/BATCH-18.txt:786 | [demo] body: JSON.stringify(demoPayload)
incoming/BATCH-18.txt:977 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
incoming/BATCH-19.txt:90 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-19.txt:129 | [example] !.env.example
incoming/BATCH-20.txt:85 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-21.txt:83 | [demo] "usesDemoPayloadOnly": true,
incoming/BATCH-21.txt:188 | [demo] const backendLocalDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");
incoming/BATCH-21.txt:399 | [demo] const demoPayload = {
incoming/BATCH-21.txt:400 | [demo] fullName: "Kingsmen Docker Runtime Demo Candidate",
incoming/BATCH-21.txt:402 | [demo] currentSituation: "Docker runtime demo user wants study, funding, accommodation and CV route guidance.",
incoming/BATCH-21.txt:410 | [demo] randomSourceName: "Docker runtime demo bursary or learnership source to check later",
incoming/BATCH-21.txt:415 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
incoming/BATCH-21.txt:416 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
incoming/BATCH-21.txt:417 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
incoming/BATCH-21.txt:468 | [demo] body: JSON.stringify(demoPayload)
kingsmen/config/creator.config.json:120 | [TODO] "todoMarkersInValidatedFiles": true,
kingsmen/config/creator.config.json:114 | [hardcoded] "hardcodedSecrets": true,
kingsmen/openclaw/openclaw-operator-policy.json:94 | [fake] "examples": ["bypass CAPTCHA", "bypass OTP", "delete production data", "impersonate institution", "fake proof"]
kingsmen/openclaw/openclaw-operator-policy.json:63 | [example] "examples": ["secrets", "MFA", "payment keys", "raw candidate documents", "production database passwords"]
kingsmen/openclaw/openclaw-operator-policy.json:68 | [example] "examples": ["reports", "validator summaries", "logs with candidate IDs masked", "provider health status"]
kingsmen/openclaw/openclaw-operator-policy.json:73 | [example] "examples": ["git status", "node validators", "PowerShell validators", "disk and memory checks", "docker ps"]
kingsmen/openclaw/openclaw-operator-policy.json:78 | [example] "examples": ["draft patch", "draft issue", "draft founder action packet", "draft staff instruction"]
kingsmen/openclaw/openclaw-operator-policy.json:83 | [example] "examples": ["branch patch", "non-sensitive tracker draft", "docs patch"],
kingsmen/openclaw/openclaw-operator-policy.json:89 | [example] "examples": ["deploy", "real emails", "partner contact", "pricing change", "candidate escalation"]
kingsmen/openclaw/openclaw-operator-policy.json:94 | [example] "examples": ["bypass CAPTCHA", "bypass OTP", "delete production data", "impersonate institution", "fake proof"]
kingsmen/oracle/oracle-free-bootstrap-plan.json:44 | [demo] "targetUse": "single-founder low-concurrency Kingsmen build, validation, demo, and first Oracle Lite runtime proof",
manifests/candidate/free-destiny-map-intake-capture.json:17 | [static] "candidateDataScope": "non_sensitive_static_ui_only_no_submit_no_storage",
manifests/control-plane/founder-proof-centre-page-wiring.json:5 | [static] "scope": "local_static_founder_page_wiring_only",
manifests/credentials/credentials.registry.json:34 | [static] "fallback_if_missing": "Runtime disabled; validators may still inspect static files.",
manifests/credentials/secrets-wiring-proof-v1.json:25 | [placeholder] "runtime_env_example_has_empty_placeholders_only",
manifests/credentials/secrets-wiring-proof-v1.json:13 | [example] "runtimeEnvExample": ".env.example",
manifests/credentials/secrets-wiring-proof-v1.json:25 | [example] "runtime_env_example_has_empty_placeholders_only",
manifests/credentials/secrets-wiring-proof-v1.json:63 | [example] ".env.example",
manifests/jarvis/jarvis-adapter-contracts.json:67 | [fake] "must_not": ["store_private_raw_data", "create_fake_proof"]
manifests/jarvis/jarvis-ai-email-provider-live-evidence-capture-v1.json:17 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-ai-email-provider-live-proof-v1.json:23 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-branch-protection-final-launch-audit-v1.json:27 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-command-runtime-truth-vault-proof-v1.json:10 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-command-truth-vault-persistence-v1.json:11 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-completion-board-v1.json:10 | [fake] "sourceSafePurpose": "Continue Jarvis build work while local Docker/API runtime is blocked, without making fake production or runtime claims.",
manifests/jarvis/jarvis-dashboard-completion-board-v1.json:17 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-dashboard-completion-board-v1.json:29 | [fake] "runtimeBlockerPolicy": "Docker/API runtime proof stays separate from source completion and must not be faked.",
manifests/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-v1.json:27 | [fake] "fakeRuntimeReady"
manifests/jarvis/jarvis-docker-truth-vault-runtime-proof-v1.json:24 | [fake] "fake runtime readiness",
manifests/jarvis/jarvis-docker-truth-vault-runtime-proof-v1.json:27 | [static] "static source route treated as live proof",
manifests/jarvis/jarvis-email-primary-channel-boundary-v1.json:15 | [fake] "noFakeStatus": true,
manifests/jarvis/jarvis-final-source-closeout-seal-v1.json:9 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-kernel-smoke-scenarios.json:14 | [static] "expected_source_confidence": "not_required_for_static_explanation",
manifests/jarvis/jarvis-knowledge-memory-boundary.json:26 | [fake] "fake_or_unsupported_status_claim"
manifests/jarvis/jarvis-live-cache-policy.json:27 | [static] "static_kingsmen_doctrine": 604800,
manifests/jarvis/jarvis-live-cache-policy.json:43 | [static] "may_use_cache_without_refresh_for_static_doctrine": true,
manifests/jarvis/jarvis-live-evidence-acceptance-pack-v1.json:23 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-live-evidence-execution-sequence-v1.json:8 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-live-freshness-triggers.json:71 | [static] "domain": "static_kingsmen_doctrine",
manifests/jarvis/jarvis-live-proof-acceptance-gate-v1.json:17 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-live-proof-evidence-ledger-v1.json:32 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-live-proof-queue-v1.json:27 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-live-proof-runbook-v1.json:27 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-live-routing-matrix.json:49 | [static] "freshness_domains": ["static_kingsmen_doctrine", "created_files", "issues", "commits"],
manifests/jarvis/jarvis-n8n-airtable-github-runtime-proof-v1.json:15 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-payfast-accepted-itn-evidence-capture-v1.json:19 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-payfast-provider-proof-queue-boundary-v1.json:7 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-production-command-surface-v1.json:7 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-production-command-surface-v1.json:30 | [fake] "no fake data empty states"
manifests/jarvis/jarvis-production-command-surface-v1.json:30 | [fake data] "no fake data empty states"
manifests/jarvis/jarvis-production-live-index-v1.json:7 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-production-live-index-v1.json:23 | [dummy] "noDummyProviderCards": true,
manifests/jarvis/jarvis-source-authority.json:77 | [fake] "fake proof",
manifests/jarvis/jarvis-source-authority.json:10 | [example] "examples": [
manifests/jarvis/jarvis-source-authority.json:25 | [example] "examples": [
manifests/jarvis/jarvis-source-authority.json:36 | [example] "examples": [
manifests/jarvis/jarvis-source-authority.json:48 | [example] "examples": [
manifests/jarvis/jarvis-source-authority.json:60 | [example] "examples": [
manifests/jarvis/jarvis-source-authority.json:73 | [example] "examples": [
manifests/jarvis/jarvis-source-completion-seal-v1.json:28 | [fake] "noFakeData": true,
manifests/jarvis/jarvis-source-confidence-rules.json:25 | [static] "static_doctrine": "latest_repo_version_required"
manifests/jarvis/jarvis-source-conflict-handling.json:39 | [fake] "description": "Source asks for bypass, deception, unsupported claim, fake proof, private data exposure, or unsafe action.",
manifests/jarvis/jarvis-source-conflict-handling.json:62 | [fake] "fake_proof_required",
manifests/jarvis/live-build-passes/pass-07.json:43 | [static] "JarvisFounderConsoleStaticHtml",
manifests/jarvis/live-build-passes/pass-08.json:5 | [static] "purpose": "Founder-console static shell, safe client state, UI data fixtures, and smoke validator for Jarvis HUD/read surfaces.",
manifests/jarvis/live-build-passes/pass-08.json:7 | [static] "packages/jarvis-core/src/jarvis-founder-console-static-html.ts",
manifests/jarvis/live-build-passes/pass-08.json:16 | [static] "JarvisFounderConsoleStaticHtml",
manifests/jarvis/live-build-passes/pass-08.json:28 | [static] "Static HTML is a founder console shell only.",
manifests/jarvis/live-build-passes/pass-08.json:37 | [static] "JarvisConsoleStaticSmokePage",
manifests/jarvis/live-build-passes/pass-09.json:9 | [static] "packages/jarvis-core/src/jarvis-console-static-smoke-page.ts",
manifests/jarvis/live-build-passes/pass-09.json:19 | [static] "JarvisConsoleStaticSmokePage",
manifests/jarvis/live-build-passes/pass-09.json:28 | [static] { "sha": "b3f07f0bef2f1de46511cbc04c2c64627fecdade", "summary": "Add Jarvis console static smoke page" },
manifests/jarvis/live-build-passes/pass-09.json:40 | [static] "Static smoke page uses deterministic fixture data only.",
manifests/jarvis/pj44-ui-hud-implementation.json:20 | [placeholder] "approval_modal_placeholder",
manifests/jarvis/public-reference-studies/kishanrajput23-desktop-voice-assistant-study.json:23 | [hardcoded] "hardcoded secrets",
manifests/jarvis/public-reference-studies/roo-code-study.json:45 | [demo] "JarvisCodeMode",
manifests/master-build-index.json:224 | [hardcoded] "hardcodedSecrets": true,
manifests/master/kingsmen-master-layer-index.json:30 | [demo] { "id": "N20.5", "name": "End-to-End Interaction Proof / Demo Seed / Luxury UI / Mobile Test", "status": "future_mandatory_reality_gate" }
manifests/modules/N09.3-communications-contracts.json:37 | [hardcoded] "hardcodedSecrets": true,
manifests/n04/candidate-core-portal.json:16 | [fake] "No fake qualifications, references, certificates, skills, results, or experience.",
manifests/n06/route-universe-workbench.json:18 | [fake] "No fake deadlines, fake links, fake requirements, fake programme availability, or fake acceptance claims.",
manifests/n10/finance-payfast-runtime.json:16 | [fake] "CV Revamp must never invent fake experience, certificates, references, skills, or qualifications."
manifests/n11/ai-decision-matching-engine.json:8 | [fake] "No fake guarantees.",
manifests/n12/governance-policy-runtime.json:11 | [fake] "No fake guarantees.",
manifests/n15/opportunity-engine-source-intelligence.json:7 | [fake] "No fake deadlines.",
manifests/n15/opportunity-engine-source-intelligence.json:8 | [fake] "No fake links.",
manifests/n15/opportunity-engine-source-intelligence.json:9 | [fake] "No fake programme availability.",
manifests/n15/opportunity-engine-source-intelligence.json:10 | [fake] "No fake eligibility claims.",
manifests/n15/opportunity-engine-source-intelligence.json:11 | [fake] "No fake acceptance or placement guarantees.",
manifests/n17/founder-command-ops-runtime.json:12 | [fake] "Founder commands may not directly submit applications, approve refunds, decide fraud, alter privacy status, or fake official status.",
manifests/n18/public-website-route-house-front-door.json:19 | [fake] "Never invent fake experience, qualifications, references, certificates, skills, testimonials, acceptance claims, deadlines, fees, official status, or official relationships.",
manifests/n18/public-website-route-house-front-door.json:27 | [static] "The public website must be Oracle Lite deployable and static-first where possible."
manifests/n19/candidate-mobile-public-portal.json:12 | [fake] "NO_FAKE_STATUS",
manifests/n19/candidate-mobile-public-portal.json:13 | [fake] "NO_FAKE_DEADLINES",
manifests/n19/candidate-mobile-public-portal.json:14 | [fake] "NO_FAKE_ACCEPTANCE_CLAIMS",
manifests/n19/candidate-mobile-public-portal.json:25 | [example] "runtime_example": "runtime/candidate-mobile/candidate-mobile-runtime.example.json",
manifests/n20/final-assembly-system-lock-production-readiness.json:39 | [fake] "NO_FAKE_STATUS",
manifests/n20/final-assembly-system-lock-production-readiness.json:40 | [fake] "NO_FAKE_DEADLINES",
manifests/n20/final-assembly-system-lock-production-readiness.json:41 | [fake] "NO_FAKE_ACCEPTANCE_CLAIMS",
manifests/n20/final-assembly-system-lock-production-readiness.json:42 | [fake] "NO_FAKE_PAYMENT_SUCCESS",
manifests/n20/final-assembly-system-lock-production-readiness.json:43 | [fake] "NO_FAKE_REFUND_DECISION",
manifests/n20/final-assembly-system-lock-production-readiness.json:44 | [fake] "NO_FAKE_AI_GOVERNANCE",
manifests/n20/final-assembly-system-lock-production-readiness.json:56 | [example] "runtime_example": "runtime/release/kingsmen-production-readiness.example.json",
manifests/ops/observability-incident-proof-v1.json:47 | [sample] "redacted structured log sample",
manifests/personal-jobs/apply-now-today.json:12 | [fake] "uses_fake_jobs": false,
manifests/personal-jobs/personal-jobs-17-real-job-discovery-agent.json:13 | [example] "source_registry_example": "data/personal-job-desk/job-search-sources.local.example.json",
manifests/personal-jobs/personal-jobs-18-sa-source-expansion.json:12 | [example] "source_registry_example": "data/personal-job-desk/sa-job-sources.local.example.json",
manifests/personal-jobs/personal-jobs-19-playwright-source-scout.json:31 | [static] "HEALTHY_STATIC",
manifests/personal-jobs/personal-jobs-20b-opportunity-quality-gate.json:3 | [demo] "module": "PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
manifests/personal-jobs/personal-jobs-20b-opportunity-quality-gate.json:10 | [demo] "search_landing_pages_demoted": true,
manifests/personal-jobs/personal-jobs-20b-opportunity-quality-gate.json:11 | [demo] "government_documents_demoted": true,
manifests/personal-jobs/personal-jobs-20b-opportunity-quality-gate.json:12 | [demo] "login_register_pages_demoted": true,
manifests/proof/proof-standard.json:28 | [placeholder] "description": "File contains meaningful Kingsmen content, not an empty placeholder."
manifests/proof/proof-standard.json:81 | [mock] "No mock/random analytics as production truth."
manifests/proof/proof-standard.json:79 | [fake] "No fake guarantee of acceptance, funding, job, accommodation, or success.",
manifests/providers/provider-registry.json:45 | [demo] "candidate_visible_effect": "Only static/demo pages until configured.",
manifests/providers/provider-registry.json:45 | [static] "candidate_visible_effect": "Only static/demo pages until configured.",
manifests/providers/provider-registry.json:46 | [static] "fallback": "Static proof, test fixtures, or local development database.",
manifests/providers/provider-registry.json:134 | [static] "fallback": "Static template validation.",
manifests/reality/source-confidence-bands.json:48 | [example] "examples": ["Kingsmen helps map routes, documents, accommodation needs, CV readiness, and source checks."],
manifests/reality/source-confidence-bands.json:56 | [example] "examples": ["TVET colleges are part of the public post-school system.", "NSFAS funding is separate from admission."],
manifests/reality/source-confidence-bands.json:64 | [example] "examples": ["UJ, DUT, UKZN, UNISA, TVET colleges, Services SETA, NSFAS."],
manifests/reality/source-confidence-bands.json:73 | [example] "examples": ["A bursary is open", "A learnership closes on a specific date", "An accommodation listing is available"],
manifests/reality/source-confidence-bands.json:81 | [example] "examples": ["fee amount", "payment instruction", "deposit amount", "funding status", "candidate accepted", "candidate placed", "candidate found accommodation"],
manifests/runtime/docker-oracle-lite-container-preparation.json:25 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/docker-oracle-lite-controlled-build-proof.json:23 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/docker-oracle-lite-controlled-runtime-proof.json:27 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/free-destiny-map-backend-runtime-boundary.json:20 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/free-destiny-map-browser-style-submit-proof.json:22 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/free-destiny-map-controlled-web-api-integration-proof.json:20 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/free-destiny-map-local-http-exercise.json:22 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/free-destiny-map-local-route-exercise.json:19 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/free-destiny-map-local-web-http-exercise.json:22 | [demo] "usesDemoPayloadOnly": true,
manifests/runtime/free-destiny-map-next-backend-bridge-proof.json:25 | [demo] "usesDemoPayloadOnly": true,
packages/contracts/src/founder-proof-centre-page.ts:19 | [static] runtimeScope: "local_static_founder_page_wiring_only";
packages/contracts/src/free-destiny-map-browser-style-submit-proof.ts:16 | [demo] fullName: "Kingsmen Browser Demo Candidate";
packages/contracts/src/free-destiny-map-intake-capture.ts:13 | [static] candidateDataScope: "non_sensitive_static_ui_only_no_submit_no_storage";
packages/contracts/src/free-destiny-map-local-exercise.ts:14 | [demo] fullName: "Kingsmen Demo Candidate";
packages/contracts/src/free-destiny-map-local-http-exercise.ts:16 | [demo] fullName: "Kingsmen HTTP Demo Candidate";
packages/contracts/src/free-destiny-map-local-web-http-exercise.ts:19 | [demo] fullName: "Kingsmen Web Demo Candidate";
packages/contracts/src/personal-jobs-18-sa-source-expansion.ts:11 | [example] sourceRegistryExample: "data/personal-job-desk/sa-job-sources.local.example.json",
packages/contracts/src/personal-jobs-19-playwright-source-scout.ts:19 | [static] "HEALTHY_STATIC",
packages/contracts/src/personal-jobs-20b-opportunity-quality-gate.ts:3 | [demo] title: "Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
packages/jarvis-core/src/jarvis-console-static-smoke-page.ts:1 | [static] import { jarvisCreateFounderConsoleStaticHtml } from './jarvis-founder-console-static-html';
packages/jarvis-core/src/jarvis-console-static-smoke-page.ts:4 | [static] export type JarvisConsoleStaticSmokePage = {
packages/jarvis-core/src/jarvis-console-static-smoke-page.ts:12 | [static] export function jarvisCreateConsoleStaticSmokePage(): JarvisConsoleStaticSmokePage {
packages/jarvis-core/src/jarvis-console-static-smoke-page.ts:16 | [static] pageId: 'jarvis-console-static-smoke-page',
packages/jarvis-core/src/jarvis-console-static-smoke-page.ts:18 | [static] html: jarvisCreateFounderConsoleStaticHtml(),
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:8 | [placeholder] | 'PLACEHOLDER_REJECTED'
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:41 | [placeholder] readonly placeholderCount: number;
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:245 | [placeholder] const JARVIS_PLACEHOLDER_VALUES = new Set([
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:251 | [placeholder] 'placeholder',
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:269 | [placeholder] export function jarvisIsCredentialPlaceholder(value: string | undefined | null): boolean {
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:274 | [placeholder] JARVIS_PLACEHOLDER_VALUES.has(normalized) ||
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:285 | [placeholder] if (jarvisIsCredentialPlaceholder(value)) return 'missing_or_placeholder';
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:296 | [placeholder] const placeholder = jarvisIsCredentialPlaceholder(value);
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:301 | [placeholder] status: placeholder ? 'PLACEHOLDER_REJECTED' : 'PRESENT_REDACTED',
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:319 | [placeholder] const placeholderCount = moduleChecks.filter((check) => check.status === 'PLACEHOLDER_REJECTED').length;
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:326 | [placeholder] placeholderCount,
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:327 | [placeholder] readyForStagingProof: missingCount === 0 && placeholderCount === 0,
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:328 | [placeholder] readyForLiveAfterApproval: missingCount === 0 && placeholderCount === 0
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:265 | [fake] 'fake',
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:266 | [fake] 'fake_value'
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:279 | [fake] normalized.startsWith('fake_') ||
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:263 | [dummy] 'dummy',
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:264 | [dummy] 'dummy_value',
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:278 | [dummy] normalized.startsWith('dummy_') ||
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:249 | [TODO] 'todo',
packages/jarvis-core/src/jarvis-credential-orchestrator.ts:280 | [example] normalized.includes('example.com')
packages/jarvis-core/src/jarvis-founder-console-route-mount.ts:6 | [static] source: 'jarvis-founder-console-static-html';
packages/jarvis-core/src/jarvis-founder-console-route-mount.ts:16 | [static] source: 'jarvis-founder-console-static-html',
packages/jarvis-core/src/jarvis-founder-console-static-html.ts:1 | [static] export type JarvisFounderConsoleStaticHtmlInput = {
packages/jarvis-core/src/jarvis-founder-console-static-html.ts:15 | [static] export const jarvisCreateFounderConsoleStaticHtml = (
packages/jarvis-core/src/jarvis-founder-console-static-html.ts:16 | [static] input: JarvisFounderConsoleStaticHtmlInput,
packages/jarvis-core/src/jarvis-founder-console-static-html.ts:26 | [static] <main data-jarvis-founder-console="static-html">
packages/jarvis-core/src/jarvis-v5-script-library-runtime.ts:188 | [fake] mustNeverDo: ['bypass CAPTCHA', 'bypass OTP', 'force submission', 'fake official result'],
packages/jarvis-core/src/live-pass-08-index.ts:1 | [static] export { jarvisCreateFounderConsoleStaticHtml } from './jarvis-founder-console-static-html';
packages/jarvis-core/src/live-pass-09-index.ts:3 | [static] export { jarvisCreateConsoleStaticSmokePage } from './jarvis-console-static-smoke-page';
prompts/jarvis/system.prompt.md:76 | [fake] - No fake documents.
prompts/jarvis/system.prompt.md:77 | [fake] - No fake applications.
prompts/jarvis/system.prompt.md:78 | [fake] - No fake status.
prompts/jarvis/system.prompt.md:79 | [fake] - No fake guarantees.
reports/candidate/free-destiny-map-intake-capture-proof.json:12 | [static] "candidateDataScope": "non_sensitive_static_ui_only_no_submit_no_storage",
reports/candidate/free-destiny-map-intake-capture-proof.json:124 | [static] "name": "page-is-static-server-page",
reports/control-plane/founder-proof-centre-page-wiring-proof.json:46 | [static] "name": "uses-public-static-wiring",
reports/control-plane/founder-proof-centre-page-wiring-proof.json:113 | [static] "detail": "local_static_founder_page_wiring_only"
reports/control-plane/founder-proof-centre-runtime-adapter-capture.json:8 | [static] "runtimeScope": "local_static_founder_page_wiring_only",
reports/control-plane/founder-proof-centre-runtime-page-capture.html:1 | [static] <!DOCTYPE html><!--yo3swfkH4jWtXnhMbuQHl--><html lang="en-ZA"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-078f6dfb37dff419.js"/><script src="/_next/static/chunks/4bd1b696-c023c6e3521b1417.js" async=""></script><script src="/_next/static/chunks/255-98a0bdaa30757bda.js" async=""></script><script src="/_next/static/chunks/main-app-4b7594a048ed623f.js" async=""
reports/control-plane/proof-centre-registry-runtime-page-capture.html:1 | [static] <!DOCTYPE html><!--aLvYTlQEpXNNvC0Wo_M9c--><html lang="en-ZA"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-078f6dfb37dff419.js"/><script src="/_next/static/chunks/4bd1b696-c023c6e3521b1417.js" async=""></script><script src="/_next/static/chunks/255-98a0bdaa30757bda.js" async=""></script><script src="/_next/static/chunks/main-app-4b7594a048ed623f.js" async=""
reports/creator/creator-n09-3-validation-bridge-report.json:60 | [TODO] "name":  "forbidden:packages/db/src/n09-action-packet-bridge-policy.ts:todoMarker",
reports/creator/creator-n09-3-validation-bridge-report.json:102 | [TODO] "name":  "forbidden:scripts/validators/validate-n09-3.mjs:todoMarker",
reports/creator/creator-n09-3-validation-bridge-report.json:144 | [TODO] "name":  "forbidden:manifests/modules/N09.3-communications-contracts.json:todoMarker",
reports/creator/test-kingsmen-creator-report.json:22 | [static] "detail":  "static token check"
reports/creator/test-kingsmen-creator-report.json:27 | [static] "detail":  "static token check"
reports/creator/test-kingsmen-creator-report.json:32 | [static] "detail":  "static token check"
reports/creator/test-kingsmen-creator-report.json:37 | [static] "detail":  "static token check"
reports/creator/test-kingsmen-creator-report.json:42 | [static] "detail":  "static token check"
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:9 | [placeholder] - Placeholder numbers.
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:24 | [placeholder] - Fake/placeholder removal list.
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:8 | [fake] - Static fake dashboard.
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:10 | [fake] - Fake connected provider claims.
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:21 | [fake] - Provider matrix with real status, not fake connected claims.
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:24 | [fake] - Fake/placeholder removal list.
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:3 | [static] The current black/white/static Jarvis screen is rejected.
reports/jarvis/JARVIS_CURRENT_SCREEN_REJECTED_AND_BLOCKED.md:8 | [static] - Static fake dashboard.
reports/jarvis/JARVIS_VISUAL_LOCK.md:15 | [fake] - Provider actions must be evidence-gated. Jarvis must not fake unconnected tools.
reports/jarvis/PJ38_REAL_JARVIS_HUD.md:3 | [static] This replaces the previous static Jarvis shell with a real founder/operator HUD:
reports/jarvis/PJ41_REAL_JARVIS_AGENT_RUNTIME.md:3 | [dummy] This replaces the dummy HUD with a real local Jarvis operator.
reports/local-backups/jarvis-v5-repair-20260630-010519/docs/jarvis/v5/script-library/NUMBER_31_WHEN_THE_SYSTEM_IS_STABLE.md:50 | [fake] - fake runtime proof,
reports/local-backups/jarvis-v5-repair-20260630-010519/docs/jarvis/v5/script-library/NUMBER_34_WHEN_COMMAND_IS_COMPLETE.md:56 | [fake] - fake “done”,
reports/n01/N01_RUNTIME_REPORT.md:10 | [example] - .env.n01.example
reports/n06/N06_REPAIR_MAP_VALIDATION_REPORT.md:20 | [fake] - No fake route submission or portal bypass is introduced.
reports/n06/N06_ROUTE_UNIVERSE_WORKBENCH_REPORT.md:55 | [fake] - No fake links, fake deadlines, fake requirements, or fake acceptance claims.
reports/n09/n09-3-validation-report.json:192 | [hardcoded] "name": "forbidden:packages/db/src/n09-action-packet-bridge-policy.ts:hardcodedPasswordAssignment",
reports/n09/n09-3-validation-report.json:198 | [hardcoded] "name": "forbidden:packages/db/src/n09-action-packet-bridge-policy.ts:hardcodedTokenAssignment",
reports/n09/n09-3-validation-report.json:204 | [hardcoded] "name": "forbidden:packages/db/src/n09-action-packet-bridge-policy.ts:hardcodedApiKeyAssignment",
reports/n09/n09-3-validation-report.json:210 | [hardcoded] "name": "forbidden:packages/db/src/n09-action-packet-bridge-policy.ts:hardcodedSecretAssignment",
reports/n09/n09-3-validation-report.json:246 | [hardcoded] "name": "forbidden:scripts/validators/validate-n09-3.mjs:hardcodedPasswordAssignment",
reports/n09/n09-3-validation-report.json:252 | [hardcoded] "name": "forbidden:scripts/validators/validate-n09-3.mjs:hardcodedTokenAssignment",
reports/n09/n09-3-validation-report.json:258 | [hardcoded] "name": "forbidden:scripts/validators/validate-n09-3.mjs:hardcodedApiKeyAssignment",
reports/n09/n09-3-validation-report.json:264 | [hardcoded] "name": "forbidden:scripts/validators/validate-n09-3.mjs:hardcodedSecretAssignment",
reports/n09/n09-3-validation-report.json:300 | [hardcoded] "name": "forbidden:manifests/modules/N09.3-communications-contracts.json:hardcodedPasswordAssignment",
reports/n09/n09-3-validation-report.json:306 | [hardcoded] "name": "forbidden:manifests/modules/N09.3-communications-contracts.json:hardcodedTokenAssignment",
reports/n09/n09-3-validation-report.json:312 | [hardcoded] "name": "forbidden:manifests/modules/N09.3-communications-contracts.json:hardcodedApiKeyAssignment",
reports/n09/n09-3-validation-report.json:318 | [hardcoded] "name": "forbidden:manifests/modules/N09.3-communications-contracts.json:hardcodedSecretAssignment",
reports/n10/N10_FINANCE_PAYFAST_REPORT.md:39 | [fake] - CV Revamp must never invent fake experience, certificates, references, skills, or qualifications.
reports/n10/N10_FINANCE_PAYFAST_REPORT.md:20 | [example] - PayFast runtime example
reports/n11/N11_AI_DECISION_MATCHING_REPORT.md:41 | [fake] - No fake guarantees.
reports/n12/N12_GOVERNANCE_POLICY_RUNTIME_REPORT.md:47 | [fake] - No fake guarantees.
reports/n12/N12_GOVERNANCE_POLICY_RUNTIME_REPORT.md:25 | [example] - non-secret runtime example
reports/n13/N13_OBSERVABILITY_REPORTS_INCIDENTS_REPORT.md:11 | [example] - non-secret observability runtime example
reports/n14/N14_INTEGRATIONS_WORKFLOW_CONNECTORS_REPORT.md:19 | [example] - non-secret runtime example
reports/n15/N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md:14 | [fake] - prevent fake opportunity claims
reports/n15/N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md:35 | [fake] - No fake deadlines.
reports/n15/N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md:36 | [fake] - No fake links.
reports/n15/N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md:37 | [fake] - No fake programme availability.
reports/n15/N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md:38 | [fake] - No fake eligibility claims.
reports/n15/N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md:39 | [fake] - No fake acceptance or placement guarantees.
reports/n15/N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md:28 | [example] - source intelligence runtime example
reports/n16/N16_ORCHESTRATOR_EXECUTION_RUNTIME_REPORT.md:23 | [example] - runtime example
reports/n17/N17_FOUNDER_COMMAND_OPS_RUNTIME_REPORT.md:49 | [fake] - no fake official status
reports/n17/N17_FOUNDER_COMMAND_OPS_RUNTIME_REPORT.md:28 | [example] - runtime example
reports/n18/N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md:54 | [fake] - Public copy must not invent fake testimonials or proof claims.
reports/n18/N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md:55 | [fake] - CV service copy must never invent fake experience, qualifications, references, certificates, skills, or achievements.
reports/n18/N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md:69 | [static] - Static-first.
reports/n18/N18_PUBLIC_WEBSITE_ROUTE_HOUSE_FRONT_DOOR_REPORT.md:13 | [example] - runtime example
reports/n19/N19_CANDIDATE_MOBILE_PUBLIC_PORTAL_REPORT.md:22 | [fake] - NO_FAKE_STATUS
reports/n19/N19_VALIDATION_RESULT.json:15 | [fake] "NO_FAKE_STATUS",
reports/n20/N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md:28 | [fake] - NO_FAKE_STATUS
reports/n20/N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md:29 | [fake] - NO_FAKE_DEADLINES
reports/n20/N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md:30 | [fake] - NO_FAKE_ACCEPTANCE_CLAIMS
reports/n20/N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md:31 | [fake] - NO_FAKE_PAYMENT_SUCCESS
reports/n20/N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md:32 | [fake] - NO_FAKE_REFUND_DECISION
reports/n20/N20_FINAL_ASSEMBLY_SYSTEM_LOCK_REPORT.md:33 | [fake] - NO_FAKE_AI_GOVERNANCE
reports/n20/N20_VALIDATION_RESULT.json:21 | [fake] "NO_FAKE_STATUS",
reports/n20/N20_VALIDATION_RESULT.json:22 | [fake] "NO_FAKE_DEADLINES",
reports/n20/N20_VALIDATION_RESULT.json:23 | [fake] "NO_FAKE_ACCEPTANCE_CLAIMS",
reports/n20/N20_VALIDATION_RESULT.json:24 | [fake] "NO_FAKE_PAYMENT_SUCCESS",
reports/n20/N20_VALIDATION_RESULT.json:25 | [fake] "NO_FAKE_REFUND_DECISION",
reports/n20/N20_VALIDATION_RESULT.json:26 | [fake] "NO_FAKE_AI_GOVERNANCE",
reports/oracle/oracle-action-packet-validation-report.json:391 | [TODO] "name": "forbidden:scripts/oracle/Write-OracleFounderActionPacket.ps1:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:415 | [TODO] "name": "forbidden:reports/oracle/oracle-founder-action-packet-report.json:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:439 | [TODO] "name": "forbidden:kingsmen/oracle/action-packets/oracle-founder-action-packet.json:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:463 | [TODO] "name": "forbidden:docs/oracle/oracle-founder-action-packet.md:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:487 | [TODO] "name": "forbidden:reports/oracle/oracle-prerequisites-validation-report.json:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:511 | [TODO] "name": "forbidden:reports/oracle/oracle-free-prerequisites-report.json:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:535 | [TODO] "name": "forbidden:reports/oracle/oracle-workspace-validation-report.json:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:559 | [TODO] "name": "forbidden:reports/openclaw/openclaw-safety-report.json:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:583 | [TODO] "name": "forbidden:kingsmen/oracle/cost-guard/oracle-cost-guard.json:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:607 | [TODO] "name": "forbidden:config/environment/.env.template:todoMarker",
reports/oracle/oracle-action-packet-validation-report.json:631 | [TODO] "name": "forbidden:config/providers/provider-registry.json:todoMarker",
reports/oracle/oracle-free-bootstrap-report.json:88 | [TODO] "name": "forbidden:kingsmen/oracle/oracle-free-bootstrap-plan.json:todoMarker",
reports/oracle/oracle-free-bootstrap-report.json:118 | [TODO] "name": "forbidden:config/environment/.env.template:todoMarker",
reports/oracle/oracle-free-bootstrap-report.json:148 | [TODO] "name": "forbidden:config/providers/provider-registry.json:todoMarker",
reports/oracle/oracle-free-bootstrap-report.json:178 | [TODO] "name": "forbidden:reports/openclaw/openclaw-safety-report.json:todoMarker",
reports/oracle/oracle-free-bootstrap-report.json:208 | [TODO] "name": "forbidden:scripts/validators/validate-oracle-bootstrap.mjs:todoMarker",
reports/oracle/oracle-free-bootstrap-report.json:328 | [hardcoded] "name": "provider-registry:noHardcodedSecrets",
reports/oracle/oracle-prerequisites-validation-report.json:260 | [TODO] "name": "forbidden:scripts/oracle/Test-OracleFreePrerequisites.ps1:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:302 | [TODO] "name": "forbidden:reports/oracle/oracle-free-prerequisites-report.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:344 | [TODO] "name": "forbidden:reports/oracle/oracle-free-bootstrap-report.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:386 | [TODO] "name": "forbidden:reports/oracle/oracle-free-workspace-report.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:428 | [TODO] "name": "forbidden:reports/oracle/oracle-workspace-validation-report.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:470 | [TODO] "name": "forbidden:reports/openclaw/openclaw-safety-report.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:512 | [TODO] "name": "forbidden:kingsmen/oracle/oracle-free-bootstrap-plan.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:554 | [TODO] "name": "forbidden:kingsmen/oracle/workspace/oracle-workspace-config.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:596 | [TODO] "name": "forbidden:kingsmen/oracle/checklists/founder-oracle-free-checklist.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:638 | [TODO] "name": "forbidden:kingsmen/oracle/cost-guard/oracle-cost-guard.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:680 | [TODO] "name": "forbidden:config/environment/.env.template:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:722 | [TODO] "name": "forbidden:config/providers/provider-registry.json:todoMarker",
reports/oracle/oracle-prerequisites-validation-report.json:253 | [hardcoded] "name": "forbidden:scripts/oracle/Test-OracleFreePrerequisites.ps1:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:295 | [hardcoded] "name": "forbidden:reports/oracle/oracle-free-prerequisites-report.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:337 | [hardcoded] "name": "forbidden:reports/oracle/oracle-free-bootstrap-report.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:379 | [hardcoded] "name": "forbidden:reports/oracle/oracle-free-workspace-report.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:421 | [hardcoded] "name": "forbidden:reports/oracle/oracle-workspace-validation-report.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:463 | [hardcoded] "name": "forbidden:reports/openclaw/openclaw-safety-report.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:505 | [hardcoded] "name": "forbidden:kingsmen/oracle/oracle-free-bootstrap-plan.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:547 | [hardcoded] "name": "forbidden:kingsmen/oracle/workspace/oracle-workspace-config.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:589 | [hardcoded] "name": "forbidden:kingsmen/oracle/checklists/founder-oracle-free-checklist.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:631 | [hardcoded] "name": "forbidden:kingsmen/oracle/cost-guard/oracle-cost-guard.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:673 | [hardcoded] "name": "forbidden:config/environment/.env.template:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:715 | [hardcoded] "name": "forbidden:config/providers/provider-registry.json:hardcodedSecretValue",
reports/oracle/oracle-prerequisites-validation-report.json:1373 | [hardcoded] "name": "provider-registry:noHardcodedSecrets",
reports/oracle/oracle-runtime-install-plan-validation-report.json:439 | [TODO] "name": "safe:scripts/oracle/Prepare-OracleRuntimeInstallPlan.ps1:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:457 | [TODO] "name": "safe:reports/oracle/oracle-runtime-install-plan-report.json:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:475 | [TODO] "name": "safe:kingsmen/oracle/vm-bootstrap/runtime/oracle-runtime-install-plan.json:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:493 | [TODO] "name": "safe:docs/oracle/oracle-runtime-install-plan.md:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:511 | [TODO] "name": "safe:reports/oracle/oracle-first-login-checklist-validation-report.json:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:529 | [TODO] "name": "safe:reports/oracle/oracle-first-login-checklist-report.json:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:547 | [TODO] "name": "safe:kingsmen/oracle/vm-bootstrap/first-login/oracle-first-login-checklist.json:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:565 | [TODO] "name": "safe:docs/oracle/oracle-first-login-checklist.md:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:583 | [TODO] "name": "safe:kingsmen/oracle/vm-bootstrap/oracle-vm-bootstrap-plan.json:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:601 | [TODO] "name": "safe:config/environment/.env.template:no-todo",
reports/oracle/oracle-runtime-install-plan-validation-report.json:619 | [TODO] "name": "safe:config/providers/provider-registry.json:no-todo",
reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json:225 | [fake] "name": "client-no-fake-reference",
reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json:227 | [fake] "detail": "no fake references"
reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json:230 | [fake] "name": "client-no-fake-certificates",
reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json:232 | [fake] "detail": "no fake certificates"
reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json:30 | [example] "name": "expected-file:data/personal-job-desk/job-search-sources.local.example.json",
reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json:32 | [example] "detail": "data/personal-job-desk/job-search-sources.local.example.json"
reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json:90 | [example] "name": "source-example-valid-json",
reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json:92 | [example] "detail": "source example json"
reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json:95 | [example] "name": "source-example-has-real-adapters",
reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json:100 | [example] "name": "source-example-has-playwright-adapter",
reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json:34 | [example] "name": "expected-file:data/personal-job-desk/sa-job-sources.local.example.json",
reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json:36 | [example] "detail": "data/personal-job-desk/sa-job-sources.local.example.json"
reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json:94 | [example] "name": "source-example-valid-json",
reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json:99 | [example] "name": "source-example-sa-country",
reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json:104 | [example] "name": "source-example-dpsa",
reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json:109 | [example] "name": "source-example-public-careers",
reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json:114 | [example] "name": "source-example-search-landings",
reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json:35 | [example] "name": "expected-file:data/personal-job-desk/source-scout-queue.local.example.json",
reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json:37 | [example] "detail": "data/personal-job-desk/source-scout-queue.local.example.json"
reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json:100 | [example] "name": "queue-example-valid-json",
reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json:102 | [example] "detail": "valid queue example json"
reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json:105 | [example] "name": "queue-example-schema",
reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json:110 | [example] "name": "queue-example-safety",
reports/personal-jobs/personal-jobs-20b-opportunity-quality-gate-proof.json:3 | [demo] "module": "PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
reports/phases/n01-6-phase-runner-report.json:62 | [placeholder] "detail":  "{\r\n  \"module\": \"N01\",\r\n  \"submodule\": \"N01.5.2\",\r\n  \"validator\": \"validate-provider-health.mjs\",\r\n  \"productionReady\": false,\r\n  \"generatedAt\": \"2026-05-31T10:28:05.279Z\",\r\n  \"passed\": true,\r\n  \"totalChecks\": 186,\r\n  \"failedChecks\": 0,\r\n  \"providerGroupsChecked\": [\r\n    \"database\",\r\n    \"queue\",\r\n    \"storage\",\r\n    \"email\",\r\n    \"whatsapp\",\r\n    \"sms\",\r\n    \"payments\",\r\n    \"airtable\",\r\n    \"playwright\"\
reports/phases/n01-6-phase-runner-report.json:62 | [hardcoded] "detail":  "{\r\n  \"module\": \"N01\",\r\n  \"submodule\": \"N01.5.2\",\r\n  \"validator\": \"validate-provider-health.mjs\",\r\n  \"productionReady\": false,\r\n  \"generatedAt\": \"2026-05-31T10:28:05.279Z\",\r\n  \"passed\": true,\r\n  \"totalChecks\": 186,\r\n  \"failedChecks\": 0,\r\n  \"providerGroupsChecked\": [\r\n    \"database\",\r\n    \"queue\",\r\n    \"storage\",\r\n    \"email\",\r\n    \"whatsapp\",\r\n    \"sms\",\r\n    \"payments\",\r\n    \"airtable\",\r\n    \"playwright\"\
reports/runtime/batch21c-docker-runtime-proof.json:71 | [static] "stdout_tail": "ndidate/workbench/readiness           200 B         103 kB\n#21 29.95 ├ ƒ /api/founder/airtable/health                 200 B         103 kB\n#21 29.95 ├ ƒ /api/founder/airtable/sync/enqueue           200 B         103 kB\n#21 29.95 ├ ƒ /api/founder/alerts/mobile                   200 B         103 kB\n#21 29.95 ├ ƒ /api/founder/backend-readiness               200 B         103 kB\n#21 29.95 ├ ƒ /api/founder/commands/approve                200 B         103 kB\n#21 29.95 ├ ƒ /api/
reports/runtime/docker-oracle-lite-controlled-runtime-proof.json:31 | [demo] "local_data_file": "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl",
reports/runtime/docker-oracle-lite-controlled-runtime-proof.json:114 | [demo] "name": "demo-payload-has-consent",
reports/runtime/docker-oracle-lite-controlled-runtime-proof.json:119 | [demo] "name": "demo-payload-has-route-intent",
reports/runtime/docker-oracle-lite-controlled-runtime-proof.json:124 | [demo] "name": "demo-payload-no-sensitive-fields",
reports/runtime/docker-oracle-lite-controlled-runtime-proof.json:211 | [demo] "detail": "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl"
reports/runtime/free-destiny-map-api-wiring-proof.json:91 | [static] "runtime_scope": "static local boot proof only; no server started; no production storage",
reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json:19 | [demo] "local_data_file": "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl",
reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json:117 | [demo] "name": "demo-payload-has-consent",
reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json:122 | [demo] "name": "demo-payload-has-route-intent",
reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json:127 | [demo] "name": "demo-payload-no-sensitive-fields",
reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json:199 | [demo] "detail": "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl"
reports/runtime/free-destiny-map-browser-style-submit-proof.json:121 | [demo] "detail": "Kingsmen Browser Demo Candidate"
reports/runtime/free-destiny-map-browser-style-submit-proof.json:176 | [demo] "detail": "data\\local\\free-destiny-map\\browser-style-submit\\browser-style-demo-intakes.jsonl"
reports/runtime/free-destiny-map-browser-style-submit-proof.json:195 | [demo] "local_data_file": "data/local/free-destiny-map/browser-style-submit/browser-style-demo-intakes.jsonl",
reports/runtime/free-destiny-map-controlled-production-build-proof.json:246 | [static] "   Generating static pages (0/6) ...",
reports/runtime/free-destiny-map-controlled-production-build-proof.json:247 | [static] "   Generating static pages (1/6) ",
reports/runtime/free-destiny-map-controlled-production-build-proof.json:248 | [static] "   Generating static pages (2/6) ",
reports/runtime/free-destiny-map-controlled-production-build-proof.json:249 | [static] "   Generating static pages (4/6) ",
reports/runtime/free-destiny-map-controlled-production-build-proof.json:250 | [static] " ✓ Generating static pages (6/6)",
reports/runtime/free-destiny-map-controlled-production-build-proof.json:263 | [static] "○  (Static)   prerendered as static content",
reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json:134 | [demo] "name": "demo-payload-has-consent",
reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json:139 | [demo] "name": "demo-payload-has-route-intent",
reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json:144 | [demo] "name": "demo-payload-no-sensitive-fields",
reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json:216 | [demo] "detail": "data/local/free-destiny-map/next-api-integration/next-api-demo-intakes.jsonl"
reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json:227 | [demo] "local_data_file": "data/local/free-destiny-map/next-api-integration/next-api-demo-intakes.jsonl",
reports/runtime/free-destiny-map-local-http-exercise-proof.json:64 | [demo] "name": "demo-payload-has-consent",
reports/runtime/free-destiny-map-local-http-exercise-proof.json:69 | [demo] "name": "demo-payload-has-route-intent",
reports/runtime/free-destiny-map-local-http-exercise-proof.json:74 | [demo] "name": "demo-payload-no-sensitive-fields",
reports/runtime/free-destiny-map-local-http-exercise-proof.json:121 | [demo] "detail": "data\\local\\free-destiny-map\\http-exercise\\http-demo-intakes.jsonl"
reports/runtime/free-destiny-map-local-http-exercise-proof.json:138 | [demo] "local_data_file": "data/local/free-destiny-map/http-exercise/http-demo-intakes.jsonl",
reports/runtime/free-destiny-map-local-route-exercise-proof.json:79 | [demo] "name": "demo-payload-has-consent",
reports/runtime/free-destiny-map-local-route-exercise-proof.json:84 | [demo] "name": "demo-payload-has-route-intent",
reports/runtime/free-destiny-map-local-route-exercise-proof.json:89 | [demo] "name": "demo-payload-no-sensitive-fields",
reports/runtime/free-destiny-map-local-route-exercise-proof.json:96 | [demo] "detail": "data\\local\\free-destiny-map\\exercise\\demo-intakes.jsonl"
reports/runtime/free-destiny-map-local-route-exercise-proof.json:103 | [demo] "local_data_file": "data/local/free-destiny-map/exercise/demo-intakes.jsonl",
reports/runtime/free-destiny-map-local-route-exercise-proof.json:104 | [demo] "demo_reference": "KM-FDM-LOCAL08",
reports/runtime/free-destiny-map-local-web-http-exercise-proof.json:79 | [demo] "name": "demo-payload-has-consent",
reports/runtime/free-destiny-map-local-web-http-exercise-proof.json:84 | [demo] "name": "demo-payload-has-route-intent",
reports/runtime/free-destiny-map-local-web-http-exercise-proof.json:89 | [demo] "name": "demo-payload-no-sensitive-fields",
reports/runtime/free-destiny-map-local-web-http-exercise-proof.json:156 | [demo] "detail": "data\\local\\free-destiny-map\\web-http-exercise\\web-http-demo-intakes.jsonl"
reports/runtime/free-destiny-map-local-web-http-exercise-proof.json:175 | [demo] "local_data_file": "data/local/free-destiny-map/web-http-exercise/web-http-demo-intakes.jsonl",
reports/runtime/free-destiny-map-next-backend-bridge-proof.json:25 | [demo] "local_data_file": "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl",
reports/runtime/free-destiny-map-next-backend-bridge-proof.json:143 | [demo] "name": "demo-payload-has-consent",
reports/runtime/free-destiny-map-next-backend-bridge-proof.json:148 | [demo] "name": "demo-payload-has-route-intent",
reports/runtime/free-destiny-map-next-backend-bridge-proof.json:153 | [demo] "name": "demo-payload-no-sensitive-fields",
reports/runtime/free-destiny-map-next-backend-bridge-proof.json:245 | [demo] "detail": "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl"
reports/runtime/free-destiny-map-real-web-readiness-proof.json:452 | [demo] "nodeModulesExists": false,
reports/runtime/free-destiny-map-real-web-readiness-proof.json:453 | [demo] "webNodeModulesExists": true
reports/validation/apply-now-latest.json:49 | [fake] "name": "no_fake_submission_claim",
reports/validation/founder-proof-centre-page-wiring-latest.json:21 | [static] "oracle_lite_impact": "none_local_static_web_page_only",
reports/validation/founder-proof-centre-page-wiring-latest.json:22 | [static] "control_plane_impact": "Founder can view BATCH 24 proof cards through a tiny static web page once the local web app is running.",
reports/validation/founder-proof-centre-runtime-reachability-latest.json:23 | [static] "control_plane_impact": "Founder Proof Centre static page is proven reachable through the local web runtime.",
reports/validation/n01-readiness-report.json:2362 | [hardcoded] "name": "provider-registry:doctrine:noHardcodedSecrets",
reports/validation/personal-jobs-20b-opportunity-quality-gate-latest.json:3 | [demo] "module": "PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
reports/validation/personal-jobs-40-route-menu-latest.json:256 | [fake] "rule":  "Menu is generated from real route folders with page.tsx. Do not add fake menu items."
runtime/ai/ai-decision-runtime.example.json:2 | [example] "purpose": "Non-secret AI decision runtime example for Kingsmen N11.",
runtime/airtable/airtable-runtime.example.json:2 | [example] "purpose": "Non-secret Airtable runtime example. Secrets are never committed.",
runtime/candidate-mobile/candidate-mobile-runtime.example.json:14 | [fake] "NO_FAKE_STATUS": true,
runtime/founder-ops/founder-command-runtime.example.json:36 | [fake] "fake official status",
runtime/founder-ops/founder-command-runtime.example.json:2 | [example] "purpose": "Non-secret runtime example for the founder/operator command cockpit.",
runtime/governance/governance-runtime.example.json:2 | [example] "purpose": "Non-secret governance runtime example for Kingsmen N12.",
runtime/integrations/integrations-runtime.example.json:2 | [example] "purpose": "Non-secret runtime example for N14 integrations and workflow connectors.",
runtime/observability/observability-runtime.example.json:2 | [example] "purpose": "Non-secret observability runtime example for Kingsmen N13.",
runtime/opportunity/opportunity-runtime.example.json:4 | [fake] "noFakeDeadlines": true,
runtime/opportunity/opportunity-runtime.example.json:5 | [fake] "noFakeLinks": true,
runtime/opportunity/opportunity-runtime.example.json:6 | [fake] "noFakeProgrammeAvailability": true,
runtime/opportunity/opportunity-runtime.example.json:7 | [fake] "noFakeEligibilityClaims": true,
runtime/opportunity/opportunity-runtime.example.json:8 | [fake] "noFakeGuarantees": true,
runtime/opportunity/opportunity-runtime.example.json:2 | [example] "purpose": "Non-secret opportunity source intelligence runtime example.",
runtime/orchestrator/orchestrator-runtime.example.json:2 | [example] "purpose": "Non-secret runtime example for backend-controlled execution.",
runtime/payfast/payfast-runtime.example.json:2 | [example] "purpose": "Non-secret PayFast runtime example. Real credentials are never committed.",
runtime/public-website/public-website-runtime.example.json:41 | [fake] "no fake claims",
runtime/public-website/public-website-runtime.example.json:42 | [fake] "no fake testimonials",
runtime/public-website/public-website-runtime.example.json:44 | [fake] "no fake CV details",
runtime/public-website/public-website-runtime.example.json:5 | [static] "staticFirst": true,
runtime/public-website/public-website-runtime.example.json:2 | [example] "purpose": "Non-secret runtime example for N18 public website front door.",
runtime/release/kingsmen-production-readiness.example.json:15 | [fake] "NO_FAKE_STATUS": true,
runtime/release/kingsmen-production-readiness.example.json:16 | [fake] "NO_FAKE_DEADLINES": true,
runtime/release/kingsmen-production-readiness.example.json:17 | [fake] "NO_FAKE_ACCEPTANCE_CLAIMS": true,
runtime/release/kingsmen-production-readiness.example.json:18 | [fake] "NO_FAKE_PAYMENT_SUCCESS": true,
runtime/release/kingsmen-production-readiness.example.json:19 | [fake] "NO_FAKE_REFUND_DECISION": true,
runtime/release/kingsmen-production-readiness.example.json:20 | [fake] "NO_FAKE_AI_GOVERNANCE": true,
scripts/KINGSMEN_CREATOR.ps1:236 | [example] examples = @(
scripts/KINGSMEN_CREATOR_PHASE.ps1:134 | [TODO] @{ Name = 'todoMarker'; Pattern = '\bTODO\b' },
scripts/agents/personal-job-discovery-agent.mjs:12 | [example] const SOURCE_EXAMPLE_PATH = "data/personal-job-desk/job-search-sources.local.example.json";
scripts/agents/personal-job-discovery-agent.mjs:37 | [example] const example = path.join(root, SOURCE_EXAMPLE_PATH);
scripts/agents/personal-job-discovery-agent.mjs:39 | [example] if (!fs.existsSync(local) && fs.existsSync(example)) {
scripts/agents/personal-job-discovery-agent.mjs:40 | [example] fs.copyFileSync(example, local);
scripts/agents/personal-job-discovery-agent.mjs:466 | [example] const sourcesConfig = readJson(SOURCE_LOCAL_PATH, readJson(SOURCE_EXAMPLE_PATH, { sources: [] }));
scripts/agents/personal-job-follow-up-inbox.mjs:105 | [fake] return `Hi, for ${title} at ${company}, we will only use truthful documents and details already provided or verified by you. No fake qualifications, references, or experience will be added.`;
scripts/agents/personal-job-opportunity-quality-gate.mjs:271 | [demo] reasons.push("demote_search_landing");
scripts/agents/personal-job-opportunity-quality-gate.mjs:276 | [demo] reasons.push("demote_gov_source_document");
scripts/agents/personal-job-playwright-source-scout.mjs:22 | [static] HEALTHY_STATIC: "HEALTHY_STATIC",
scripts/agents/personal-job-playwright-source-scout.mjs:12 | [example] const PJ18_SOURCES_EXAMPLE_PATH = "data/personal-job-desk/sa-job-sources.local.example.json";
scripts/agents/personal-job-playwright-source-scout.mjs:14 | [example] const QUEUE_EXAMPLE_PATH = "data/personal-job-desk/source-scout-queue.local.example.json";
scripts/agents/personal-job-playwright-source-scout.mjs:198 | [example] function ensureQueueExample() {
scripts/agents/personal-job-playwright-source-scout.mjs:200 | [example] const example = absolute(QUEUE_EXAMPLE_PATH);
scripts/agents/personal-job-playwright-source-scout.mjs:202 | [example] if (!fs.existsSync(local) && fs.existsSync(example)) {
scripts/agents/personal-job-playwright-source-scout.mjs:203 | [example] fs.copyFileSync(example, local);
scripts/agents/personal-job-playwright-source-scout.mjs:263 | [example] const saSourceConfig = readJson(PJ18_SOURCES_LOCAL_PATH, readJson(PJ18_SOURCES_EXAMPLE_PATH, { sources: [] }));
scripts/agents/personal-job-playwright-source-scout.mjs:531 | [example] ensureQueueExample();
scripts/agents/personal-job-response-library.mjs:104 | [fake] body: "Hi, Kingsmen will only use truthful documents and details already provided or verified by you. No fake qualifications, references, work history, certificates, or experience will be added.",
scripts/agents/personal-job-review-ledger.mjs:166 | [fake] "No fake skills, certificates, references, salary history, or qualifications are added"
scripts/agents/personal-job-sa-source-runner.mjs:367 | [static] notes: "Kingsmen reached the public careers page but did not extract clear job links from static HTML. This may be a JavaScript-rendered careers portal. Use Playwright scout or manual review."
scripts/agents/personal-job-sa-source-runner.mjs:396 | [static] notes: "Kingsmen reached the DPSA public vacancy circular landing page but did not extract circular links from static HTML. Manual review required."
scripts/agents/personal-job-sa-source-runner.mjs:12 | [example] const SA_SOURCE_EXAMPLE_PATH = "data/personal-job-desk/sa-job-sources.local.example.json";
scripts/agents/personal-job-sa-source-runner.mjs:43 | [example] const example = absolute(SA_SOURCE_EXAMPLE_PATH);
scripts/agents/personal-job-sa-source-runner.mjs:45 | [example] if (!fs.existsSync(local) && fs.existsSync(example)) {
scripts/agents/personal-job-sa-source-runner.mjs:46 | [example] fs.copyFileSync(example, local);
scripts/agents/personal-job-sa-source-runner.mjs:519 | [example] const config = readJson(SA_SOURCE_LOCAL_PATH, readJson(SA_SOURCE_EXAMPLE_PATH, { sources: [] }));
scripts/agents/playwright-job-source-scout.mjs:30 | [example] message: "Pass --url https://example.com/careers to scout an authorised careers page.",
scripts/api/Start-KingsmenLocalApi.ps1:190 | [lorem] if ([string]::IsNullOrWhiteSpace($ContainerName) -or [string]::IsNullOrWhiteSpace($Database) -or [string]::IsNullOrWhiteSpace($User) -or [string]::IsNullOrEmpty($Password)) { return $false }
scripts/install-git-hooks.ps1:114 | [hardcoded] add_failure "$FILE_PATH" "SECRET_ASSIGNMENT_BLOCKED" "possible hardcoded credential assignment found"
scripts/install-git-hooks.ps1:192 | [hardcoded] 'possible hardcoded credential assignments',
scripts/install-git-hooks.ps1:159 | [example] echo "Kingsmen commit message should reference a tracker row or phase, for example: CREATOR.5: install git hooks"
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:12 | [placeholder] function Test-KingsmenPlaceholder {
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:23 | [placeholder] "placeholder",
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:52 | [placeholder] if (Test-KingsmenPlaceholder $Value) { return "missing_or_placeholder" }
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:103 | [placeholder] if ((-not (Test-KingsmenPlaceholder $kingsmenDb)) -and (Test-KingsmenPlaceholder $databaseUrl)) {
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:106 | [placeholder] if ((-not (Test-KingsmenPlaceholder $databaseUrl)) -and (Test-KingsmenPlaceholder $kingsmenDb)) {
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:141 | [placeholder] $placeholder = Test-KingsmenPlaceholder $value
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:146 | [placeholder] status = if ($placeholder) { "PLACEHOLDER_REJECTED" } else { "PRESENT_REDACTED" }
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:160 | [placeholder] $placeholder = @($moduleChecks | Where-Object { $_.status -eq "PLACEHOLDER_REJECTED" }).Count
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:166 | [placeholder] placeholderCount = $placeholder
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:167 | [placeholder] readyForStagingProof = ($present -eq $moduleChecks.Count -and $placeholder -eq 0)
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:168 | [placeholder] readyForLiveAfterApproval = ($present -eq $moduleChecks.Count -and $placeholder -eq 0)
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:185 | [placeholder] placeholderValuesAccepted = $false
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:193 | [placeholder] nextAction = if ($allReady) { "Run staging proofs for AI provider routing, communications, PayFast, observability, storage, and final evidence before live activation." } else { "Replace placeholders outside Git, rerun Jarvis credential readiness, then run module staging proofs. AI provider routing requires KINGSMEN_AI_PROVIDER, KINGSMEN_AI_MODEL, and OPENAI_API_KEY outside Git." }
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:37 | [fake] "fake",
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:38 | [fake] "fake_value"
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:45 | [fake] if ($normalized.StartsWith("fake_")) { return $true }
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:35 | [dummy] "dummy",
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:36 | [dummy] "dummy_value",
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:44 | [dummy] if ($normalized.StartsWith("dummy_")) { return $true }
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:21 | [TODO] "todo",
scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1:46 | [example] if ($normalized.Contains("example.com")) { return $true }
scripts/oracle/ORACLE_01_MaterializeBoundary.ps1:123 | [placeholder] - public SSH key placeholders
scripts/oracle/ORACLE_01_MaterializeBoundary.ps1:122 | [example] - Terraform variable examples
scripts/oracle/Write-OracleSshBootstrapGuide.ps1:266 | [example] ## Future command examples
scripts/powershell/jarvis-total-inventory-audit.cjs:18 | [placeholder] fakeRisk: path.join(outDir, `jarvis-fake-placeholder-risk-${stamp}.md`),
scripts/powershell/jarvis-total-inventory-audit.cjs:30 | [placeholder] fakeRisk: path.join(outDir, "JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md"),
scripts/powershell/jarvis-total-inventory-audit.cjs:85 | [placeholder] "- Placeholder numbers.",
scripts/powershell/jarvis-total-inventory-audit.cjs:100 | [placeholder] "- Fake/placeholder removal list.",
scripts/powershell/jarvis-total-inventory-audit.cjs:242 | [placeholder] FAKE_PLACEHOLDER_MOCK_RISKS: [
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [placeholder] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:362 | [placeholder] const fakeRiskHits = hitsFor("FAKE_PLACEHOLDER_MOCK_RISKS");
scripts/powershell/jarvis-total-inventory-audit.cjs:476 | [placeholder] "FAKE / PLACEHOLDER / MOCK RISK HITS:",
scripts/powershell/jarvis-total-inventory-audit.cjs:477 | [placeholder] formatHits("FAKE_PLACEHOLDER_MOCK_RISKS", 1000),
scripts/powershell/jarvis-total-inventory-audit.cjs:542 | [placeholder] "# JARVIS FAKE / PLACEHOLDER / MOCK RISK INVENTORY",
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [placeholder] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:550 | [placeholder] formatHits("FAKE_PLACEHOLDER_MOCK_RISKS", 2000)
scripts/powershell/jarvis-total-inventory-audit.cjs:577 | [placeholder] "The next Jarvis build must be generated from the repo inventory and must not introduce black-and-white child-play UI, placeholder numbers, or fake connected provider claims.",
scripts/powershell/jarvis-total-inventory-audit.cjs:617 | [placeholder] `Fake/placeholder/mock risk hits found: ${hitCounts.FAKE_PLACEHOLDER_MOCK_RISKS}`,
scripts/powershell/jarvis-total-inventory-audit.cjs:618 | [placeholder] "Required: remove or clearly label all placeholder/static/hardcoded/demo/sample/fake data before claiming live operation.",
scripts/powershell/jarvis-total-inventory-audit.cjs:242 | [mock] FAKE_PLACEHOLDER_MOCK_RISKS: [
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [mock] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:362 | [mock] const fakeRiskHits = hitsFor("FAKE_PLACEHOLDER_MOCK_RISKS");
scripts/powershell/jarvis-total-inventory-audit.cjs:476 | [mock] "FAKE / PLACEHOLDER / MOCK RISK HITS:",
scripts/powershell/jarvis-total-inventory-audit.cjs:477 | [mock] formatHits("FAKE_PLACEHOLDER_MOCK_RISKS", 1000),
scripts/powershell/jarvis-total-inventory-audit.cjs:542 | [mock] "# JARVIS FAKE / PLACEHOLDER / MOCK RISK INVENTORY",
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [mock] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:550 | [mock] formatHits("FAKE_PLACEHOLDER_MOCK_RISKS", 2000)
scripts/powershell/jarvis-total-inventory-audit.cjs:617 | [mock] `Fake/placeholder/mock risk hits found: ${hitCounts.FAKE_PLACEHOLDER_MOCK_RISKS}`,
scripts/powershell/jarvis-total-inventory-audit.cjs:18 | [fake] fakeRisk: path.join(outDir, `jarvis-fake-placeholder-risk-${stamp}.md`),
scripts/powershell/jarvis-total-inventory-audit.cjs:30 | [fake] fakeRisk: path.join(outDir, "JARVIS_FAKE_PLACEHOLDER_RISK_LATEST.md"),
scripts/powershell/jarvis-total-inventory-audit.cjs:84 | [fake] "- Static fake dashboard.",
scripts/powershell/jarvis-total-inventory-audit.cjs:86 | [fake] "- Fake connected provider claims.",
scripts/powershell/jarvis-total-inventory-audit.cjs:97 | [fake] "- Provider matrix with real status, not fake connected claims.",
scripts/powershell/jarvis-total-inventory-audit.cjs:100 | [fake] "- Fake/placeholder removal list.",
scripts/powershell/jarvis-total-inventory-audit.cjs:242 | [fake] FAKE_PLACEHOLDER_MOCK_RISKS: [
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [fake] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:244 | [fake] "hardcoded", "static", "example", "test data", "fake data", "coming soon"
scripts/powershell/jarvis-total-inventory-audit.cjs:362 | [fake] const fakeRiskHits = hitsFor("FAKE_PLACEHOLDER_MOCK_RISKS");
scripts/powershell/jarvis-total-inventory-audit.cjs:476 | [fake] "FAKE / PLACEHOLDER / MOCK RISK HITS:",
scripts/powershell/jarvis-total-inventory-audit.cjs:477 | [fake] formatHits("FAKE_PLACEHOLDER_MOCK_RISKS", 1000),
scripts/powershell/jarvis-total-inventory-audit.cjs:480 | [fake] "Create the live Jarvis from this inventory only after reviewing voice, greetings, OpenClaw, Playwright, providers, N00-N20, evidence, and fake data risks."
scripts/powershell/jarvis-total-inventory-audit.cjs:526 | [fake] "- Jarvis must not fake microphone/speech support.",
scripts/powershell/jarvis-total-inventory-audit.cjs:541 | [fake] const fakeMd = [
scripts/powershell/jarvis-total-inventory-audit.cjs:542 | [fake] "# JARVIS FAKE / PLACEHOLDER / MOCK RISK INVENTORY",
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [fake] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:546 | [fake] `Risk hits found: ${fakeRiskHits.length}`,
scripts/powershell/jarvis-total-inventory-audit.cjs:550 | [fake] formatHits("FAKE_PLACEHOLDER_MOCK_RISKS", 2000)
scripts/powershell/jarvis-total-inventory-audit.cjs:552 | [fake] write(files.fakeRisk, fakeMd);
scripts/powershell/jarvis-total-inventory-audit.cjs:577 | [fake] "The next Jarvis build must be generated from the repo inventory and must not introduce black-and-white child-play UI, placeholder numbers, or fake connected provider claims.",
scripts/powershell/jarvis-total-inventory-audit.cjs:616 | [fake] "10. FAKE DATA REMOVAL",
scripts/powershell/jarvis-total-inventory-audit.cjs:617 | [fake] `Fake/placeholder/mock risk hits found: ${hitCounts.FAKE_PLACEHOLDER_MOCK_RISKS}`,
scripts/powershell/jarvis-total-inventory-audit.cjs:618 | [fake] "Required: remove or clearly label all placeholder/static/hardcoded/demo/sample/fake data before claiming live operation.",
scripts/powershell/jarvis-total-inventory-audit.cjs:625 | [fake] "Do not build until the inventory, provider matrix, voice inventory, OpenClaw/Playwright inventory, and fake-risk report are reviewed."
scripts/powershell/jarvis-total-inventory-audit.cjs:654 | [fake] `Fake risk inventory: ${rel(files.fakeRisk)}`,
scripts/powershell/jarvis-total-inventory-audit.cjs:664 | [fake] `Latest fake risk inventory: ${rel(latest.fakeRisk)}`,
scripts/powershell/jarvis-total-inventory-audit.cjs:675 | [fake] copy(files.fakeRisk, latest.fakeRisk);
scripts/powershell/jarvis-total-inventory-audit.cjs:687 | [fake] console.log("Fake risk:        " + rel(files.fakeRisk));
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [sample] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [sample] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:618 | [sample] "Required: remove or clearly label all placeholder/static/hardcoded/demo/sample/fake data before claiming live operation.",
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [demo] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [demo] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:618 | [demo] "Required: remove or clearly label all placeholder/static/hardcoded/demo/sample/fake data before claiming live operation.",
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [dummy] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [dummy] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [lorem] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:243 | [TODO] "placeholder", "mock", "fake", "sample", "demo", "dummy", "lorem", "TODO",
scripts/powershell/jarvis-total-inventory-audit.cjs:244 | [hardcoded] "hardcoded", "static", "example", "test data", "fake data", "coming soon"
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [hardcoded] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:618 | [hardcoded] "Required: remove or clearly label all placeholder/static/hardcoded/demo/sample/fake data before claiming live operation.",
scripts/powershell/jarvis-total-inventory-audit.cjs:79 | [static] "The current black/white/static Jarvis screen is rejected.",
scripts/powershell/jarvis-total-inventory-audit.cjs:84 | [static] "- Static fake dashboard.",
scripts/powershell/jarvis-total-inventory-audit.cjs:244 | [static] "hardcoded", "static", "example", "test data", "fake data", "coming soon"
scripts/powershell/jarvis-total-inventory-audit.cjs:544 | [static] "Rule: Kingsmen must not claim live operation using fake, placeholder, mock, demo, static, dummy, sample, or hardcoded data.",
scripts/powershell/jarvis-total-inventory-audit.cjs:618 | [static] "Required: remove or clearly label all placeholder/static/hardcoded/demo/sample/fake data before claiming live operation.",
scripts/powershell/jarvis-total-inventory-audit.cjs:621 | [static] "The rejected static screen must not be used as the Jarvis standard.",
scripts/powershell/jarvis-total-inventory-audit.cjs:122 | [example] ".sql", ".toml", ".yml", ".yaml", ".env", ".example"
scripts/powershell/jarvis-total-inventory-audit.cjs:244 | [example] "hardcoded", "static", "example", "test data", "fake data", "coming soon"
scripts/powershell/jarvis-total-inventory-audit.cjs:244 | [test data] "hardcoded", "static", "example", "test data", "fake data", "coming soon"
scripts/powershell/jarvis-total-inventory-audit.cjs:244 | [fake data] "hardcoded", "static", "example", "test data", "fake data", "coming soon"
scripts/powershell/jarvis-total-inventory-audit.cjs:480 | [fake data] "Create the live Jarvis from this inventory only after reviewing voice, greetings, OpenClaw, Playwright, providers, N00-N20, evidence, and fake data risks."
scripts/powershell/jarvis-total-inventory-audit.cjs:616 | [fake data] "10. FAKE DATA REMOVAL",
scripts/powershell/jarvis-total-inventory-audit.cjs:618 | [fake data] "Required: remove or clearly label all placeholder/static/hardcoded/demo/sample/fake data before claiming live operation.",
scripts/powershell/jarvis-total-inventory-audit.cjs:244 | [coming soon] "hardcoded", "static", "example", "test data", "fake data", "coming soon"
scripts/proof/accept-jarvis-live-evidence-pack.mjs:95 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs:202 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs:232 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-branch-protection-final-launch-audit-evidence.mjs:108 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs:152 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-docker-truth-vault-runtime-evidence.mjs:182 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs:215 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-n8n-airtable-github-evidence.mjs:249 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs:215 | [fake] noFakeData: true,
scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs:248 | [fake] noFakeData: true,
scripts/proof/prove-docker-oracle-lite-controlled-runtime-ci.mjs:135 | [demo] fullName: "Kingsmen GitHub Actions Runtime Demo Candidate",
scripts/proof/prove-docker-oracle-lite-controlled-runtime-ci.mjs:145 | [demo] randomSourceName: "GitHub Actions runtime demo bursary or learnership source to check later",
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:9 | [demo] const backendLocalDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:314 | [demo] const demoPayload = {
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:315 | [demo] fullName: "Kingsmen Docker Runtime Demo Candidate",
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:317 | [demo] currentSituation: "Docker runtime demo user wants study, funding, accommodation and CV route guidance.",
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:325 | [demo] randomSourceName: "Docker runtime demo bursary or learnership source to check later",
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:330 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:331 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:332 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs:383 | [demo] body: JSON.stringify(demoPayload)
scripts/proof/prove-founder-proof-centre-page-wiring.mjs:62 | [static] check("uses-public-static-wiring", true, "No App Router path is guessed.");
scripts/proof/prove-founder-proof-centre-page-wiring.mjs:92 | [static] runtimeScope: "local_static_founder_page_wiring_only",
scripts/proof/prove-founder-proof-centre-page-wiring.mjs:323 | [static] check("founder-page-local-only", pageModel.runtimeScope === "local_static_founder_page_wiring_only", pageModel.runtimeScope);
scripts/proof/prove-free-destiny-map-api-wiring.mjs:69 | [static] runtime_scope: "static local boot proof only; no server started; no production storage",
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:10 | [demo] const localDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:100 | [demo] const demoPayload = {
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:101 | [demo] fullName: "Kingsmen Backend Runtime Demo Candidate",
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:103 | [demo] currentSituation: "Backend boundary demo user wants study, funding, accommodation and CV route guidance.",
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:111 | [demo] randomSourceName: "Backend demo bursary or learnership source to check later",
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:116 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:117 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:118 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs:169 | [demo] body: JSON.stringify(demoPayload)
scripts/proof/prove-free-destiny-map-browser-style-submit.mjs:9 | [demo] const localDataFile = path.join(localDataDir, "browser-style-demo-intakes.jsonl");
scripts/proof/prove-free-destiny-map-browser-style-submit.mjs:187 | [demo] <input name="fullName" value="Kingsmen Browser Demo Candidate" />
scripts/proof/prove-free-destiny-map-browser-style-submit.mjs:190 | [demo] <textarea name="currentSituation">Browser-style demo user wants a route map across study, TVET, funding, accommodation and CV readiness.</textarea>
scripts/proof/prove-free-destiny-map-browser-style-submit.mjs:202 | [demo] <input name="randomSourceName" value="Browser demo bursary or learnership source to check later" />
scripts/proof/prove-free-destiny-map-browser-style-submit.mjs:301 | [demo] nextAction: accepted ? "Browser-style submit proof accepted the demo payload." : "Fix browser-style demo payload issues.",
scripts/proof/prove-free-destiny-map-browser-style-submit.mjs:366 | [demo] check("browser-style-extracted-full-name", extractedPayload.fullName === "Kingsmen Browser Demo Candidate", extractedPayload.fullName);
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:10 | [demo] const localDataFile = path.join(root, "data/local/free-destiny-map/next-api-integration/next-api-demo-intakes.jsonl");
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:146 | [demo] check("next-api-route-writes-local-jsonl", route.includes("next-api-demo-intakes.jsonl"), "local JSONL write");
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:166 | [demo] const demoPayload = {
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:167 | [demo] fullName: "Kingsmen Integrated Demo Candidate",
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:169 | [demo] currentSituation: "Integrated local web plus API demo user wants study, funding, accommodation and CV route guidance.",
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:177 | [demo] randomSourceName: "Integrated demo bursary or learnership source to check later",
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:182 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:183 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:184 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs:264 | [demo] body: JSON.stringify(demoPayload)
scripts/proof/prove-free-destiny-map-intake-capture.mjs:75 | [static] check("page-is-static-server-page", !page.includes('"use client"') && !page.includes("'use client'"), "no client component");
scripts/proof/prove-free-destiny-map-intake-capture.mjs:114 | [static] candidateDataScope: "non_sensitive_static_ui_only_no_submit_no_storage",
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:9 | [demo] const localDataFile = path.join(localDataDir, "http-demo-intakes.jsonl");
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:84 | [demo] const demoPayload = {
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:85 | [demo] fullName: "Kingsmen HTTP Demo Candidate",
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:87 | [demo] currentSituation: "HTTP demo user wants a route map across study, TVET, funding, accommodation and CV readiness.",
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:95 | [demo] randomSourceName: "HTTP demo bursary or learnership source to check later",
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:100 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:101 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:102 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:182 | [demo] nextAction: accepted ? "Local HTTP shell accepted the demo payload." : "Fix local HTTP demo payload issues.",
scripts/proof/prove-free-destiny-map-local-http-exercise.mjs:240 | [demo] body: JSON.stringify(demoPayload)
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:8 | [demo] const localDataFile = path.join(localDataDir, "demo-intakes.jsonl");
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:57 | [demo] const demoPayload = {
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:58 | [demo] fullName: "Kingsmen Demo Candidate",
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:60 | [demo] currentSituation: "Demo user wants a full route map across study, TVET, funding, accommodation and CV readiness.",
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:68 | [demo] randomSourceName: "Demo bursary or learnership source to check later",
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:73 | [demo] const hasConsent = demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true;
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:75 | [demo] demoPayload.routeInterests.length > 0 ||
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:76 | [demo] Boolean(demoPayload.currentSituation) ||
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:77 | [demo] Boolean(demoPayload.knownRoute) ||
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:78 | [demo] Boolean(demoPayload.randomSourceName);
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:80 | [demo] check("demo-payload-has-consent", hasConsent, "contact and basic-info processing consent true");
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:81 | [demo] check("demo-payload-has-route-intent", hasIntent, "route interest or situation present");
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:82 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:98 | [demo] payload: demoPayload,
scripts/proof/prove-free-destiny-map-local-route-exercise.mjs:128 | [demo] demo_reference: reference,
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:9 | [demo] const localDataFile = path.join(localDataDir, "web-http-demo-intakes.jsonl");
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:111 | [demo] <input name="fullName" value="Kingsmen Web Demo Candidate" />
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:114 | [demo] <textarea name="currentSituation">Web demo user wants a route map across study, TVET, funding, accommodation and CV readiness.</textarea>
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:120 | [demo] <input name="randomSourceName" value="Web demo bursary or learnership source to check later" />
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:134 | [demo] const demoPayload = {
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:135 | [demo] fullName: "Kingsmen Web Demo Candidate",
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:137 | [demo] currentSituation: "Web demo user wants a route map across study, TVET, funding, accommodation and CV readiness.",
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:145 | [demo] randomSourceName: "Web demo bursary or learnership source to check later",
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:150 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:151 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:152 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:239 | [demo] nextAction: accepted ? "Local web-to-HTTP shell accepted the demo payload." : "Fix local web-to-HTTP demo payload issues.",
scripts/proof/prove-free-destiny-map-local-web-http-exercise.mjs:307 | [demo] body: JSON.stringify(demoPayload)
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:11 | [demo] const backendLocalDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:199 | [demo] const demoPayload = {
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:200 | [demo] fullName: "Kingsmen Next Backend Bridge Demo Candidate",
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:202 | [demo] currentSituation: "Next-to-backend bridge demo user wants study, funding, accommodation and CV route guidance.",
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:210 | [demo] randomSourceName: "Next bridge demo bursary or learnership source to check later",
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:215 | [demo] check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:216 | [demo] check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:217 | [demo] check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");
scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs:306 | [demo] body: JSON.stringify(demoPayload)
scripts/proof/prove-free-destiny-map-real-web-readiness.mjs:41 | [demo] const nodeModulesExists = exists("node_modules");
scripts/proof/prove-free-destiny-map-real-web-readiness.mjs:42 | [demo] const webNodeModulesExists = exists("apps/web/node_modules");
scripts/proof/prove-free-destiny-map-real-web-readiness.mjs:119 | [demo] const dependencyInstallEvidence = nodeModulesExists || webNodeModulesExists;
scripts/proof/prove-free-destiny-map-real-web-readiness.mjs:201 | [demo] nodeModulesExists,
scripts/proof/prove-free-destiny-map-real-web-readiness.mjs:202 | [demo] webNodeModulesExists
scripts/proof/prove-personal-jobs-04-cv-motivation-apply-pack-builder.mjs:108 | [fake] push(checks, "client-no-fake-reference", client.includes("false references") || client.includes("Never invent references"), "no fake references");
scripts/proof/prove-personal-jobs-04-cv-motivation-apply-pack-builder.mjs:109 | [fake] push(checks, "client-no-fake-certificates", client.includes("false certificates") || client.includes("Never invent certificates"), "no fake certificates");
scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs:40 | [example] "data/personal-job-desk/job-search-sources.local.example.json",
scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs:58 | [example] const sourceExample = exists(expectedFiles[1]) ? parseJson(expectedFiles[1]) : null;
scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs:69 | [example] addCheck("source-example-valid-json", Boolean(sourceExample), "source example json");
scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs:70 | [example] addCheck("source-example-has-real-adapters", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "remoteok") && sourceExample.sources.some((s) => s.adapter === "arbeitnow"), "remoteok + arbeitnow");
scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs:71 | [example] addCheck("source-example-has-playwright-adapter", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "playwrightPage"), "playwrightPage");
scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs:40 | [example] "data/personal-job-desk/sa-job-sources.local.example.json",
scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs:57 | [example] const sourceExample = exists(expectedFiles[1]) ? parseJson(expectedFiles[1]) : null;
scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs:68 | [example] addCheck("source-example-valid-json", Boolean(sourceExample), "valid json");
scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs:69 | [example] addCheck("source-example-sa-country", sourceExample?.schema === "kingsmen.personal-jobs-18.sa-sources.v1", sourceExample?.schema);
scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs:70 | [example] addCheck("source-example-dpsa", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "dpsaLanding"), "dpsaLanding");
scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs:71 | [example] addCheck("source-example-public-careers", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "publicCareersPage"), "publicCareersPage");
scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs:72 | [example] addCheck("source-example-search-landings", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "searchLanding"), "searchLanding");
scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs:40 | [example] "data/personal-job-desk/source-scout-queue.local.example.json",
scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs:57 | [example] const queueExample = exists(expectedFiles[1]) ? parseJson(expectedFiles[1]) : null;
scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs:69 | [example] addCheck("queue-example-valid-json", Boolean(queueExample), "valid queue example json");
scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs:70 | [example] addCheck("queue-example-schema", queueExample?.schema === "kingsmen.personal-jobs-19.source-scout-queue.v1", queueExample?.schema);
scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs:71 | [example] addCheck("queue-example-safety", queueExample?.safety?.noAutoApply === true && queueExample?.safety?.noCaptchaBypass === true, "queue safety");
scripts/proof/prove-personal-jobs-20b-opportunity-quality-gate.mjs:119 | [demo] module: "PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
scripts/proof/prove-personal-jobs-20b-opportunity-quality-gate.mjs:76 | [example] sourceUrl: "https://example.co.za/careers/job/cashier-johannesburg-123",
scripts/proof/prove-rls-security-boundary.mjs:110 | [static] proofLevel: 'source_static_boundary',
scripts/proof/prove-secrets-wiring-boundary.mjs:82 | [placeholder] check('env_example_empty_placeholders_only', assignedRealValues.length === 0, assignedRealValues.join(', '));
scripts/proof/prove-secrets-wiring-boundary.mjs:28 | [example] function isAllowedEnvExampleValue(rawValue) {
scripts/proof/prove-secrets-wiring-boundary.mjs:38 | [example] '.env.example',
scripts/proof/prove-secrets-wiring-boundary.mjs:69 | [example] if (fs.existsSync(full('.env.example'))) {
scripts/proof/prove-secrets-wiring-boundary.mjs:70 | [example] const env = read('.env.example');
scripts/proof/prove-secrets-wiring-boundary.mjs:72 | [example] check(`env_example_contains:${name}`, env.includes(`${name}=`), name);
scripts/proof/prove-secrets-wiring-boundary.mjs:80 | [example] return !isAllowedEnvExampleValue(line.slice(index + 1));
scripts/proof/prove-secrets-wiring-boundary.mjs:82 | [example] check('env_example_empty_placeholders_only', assignedRealValues.length === 0, assignedRealValues.join(', '));
scripts/proof/prove-secrets-wiring-boundary.mjs:87 | [example] for (const token of ['.env', '.env.*', '!.env.example', '*.dump', '*.backup']) {
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:26 | [placeholder] "placeholder",
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:40 | [fake] "fake",
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:41 | [fake] "fake_value"
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:48 | [fake] if ($normalized.StartsWith("fake_")) { return $false }
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:38 | [dummy] "dummy",
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:39 | [dummy] "dummy_value",
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:47 | [dummy] if ($normalized.StartsWith("dummy_")) { return $false }
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:24 | [TODO] "todo",
scripts/staging/Invoke-KingsmenCommunicationsProviderStagingProof.ps1:49 | [example] if ($normalized.Contains("example.com")) { return $false }
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:14 | [placeholder] function Test-PlaceholderValue {
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:25 | [placeholder] "placeholder",
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:64 | [placeholder] $accessKeyReady = -not (Test-PlaceholderValue $storageAccessKey)
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:65 | [placeholder] $secretKeyReady = -not (Test-PlaceholderValue $storageSecretKey)
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:66 | [placeholder] $bucketReady = -not (Test-PlaceholderValue $storageBucket)
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:69 | [placeholder] New-Check -Name "storage_access_key_present" -Passed $accessKeyReady -Detail $(if ($accessKeyReady) { "present_redacted" } else { "missing_or_placeholder" })
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:70 | [placeholder] New-Check -Name "storage_secret_key_present" -Passed $secretKeyReady -Detail $(if ($secretKeyReady) { "present_redacted" } else { "missing_or_placeholder" })
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:71 | [placeholder] New-Check -Name "storage_bucket_present" -Passed $bucketReady -Detail $(if ($bucketReady) { "present_redacted" } else { "missing_or_placeholder" })
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:37 | [fake] "fake",
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:38 | [fake] "fake_value"
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:45 | [fake] if ($lower -like "fake_*") { return $true }
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:35 | [dummy] "dummy",
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:36 | [dummy] "dummy_value",
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:44 | [dummy] if ($lower -like "dummy_*") { return $true }
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:23 | [TODO] "todo",
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:46 | [example] if ($lower -like "*.example.com*") { return $true }
scripts/staging/Invoke-KingsmenDocumentVaultStorageStagingProof.ps1:47 | [example] if ($lower -like "example-*") { return $true }
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:10 | [placeholder] function Test-KingsmenPlaceholder {
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:15 | [placeholder] $bad = @("...", "changeme", "change_me", "todo", "tbd", "placeholder", "your_value_here", "replace_me", "real", "real_value", "real_secret", "real_key", "real_token", "dummy", "dummy_value", "fake", "fake_value")
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:69 | [placeholder] $normalizedProvider = if (Test-KingsmenPlaceholder $provider) { "" } else { $provider.Trim().ToLowerInvariant() }
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:71 | [placeholder] Add-Check -Name "ai_provider_configured" -Passed (-not (Test-KingsmenPlaceholder $provider)) -Detail $(if (Test-KingsmenPlaceholder $provider) { "missing_or_placeholder" } else { "present_redacted" })
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:72 | [placeholder] Add-Check -Name "ai_model_configured" -Passed (-not (Test-KingsmenPlaceholder $model)) -Detail $(if (Test-KingsmenPlaceholder $model) { "missing_or_placeholder" } else { "present_redacted" })
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:78 | [placeholder] $keyReady = -not (Test-KingsmenPlaceholder $openAiKey)
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:80 | [placeholder] $keyReady = -not (Test-KingsmenPlaceholder $providerKey)
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:15 | [fake] $bad = @("...", "changeme", "change_me", "todo", "tbd", "placeholder", "your_value_here", "replace_me", "real", "real_value", "real_secret", "real_key", "real_token", "dummy", "dummy_value", "fake", "fake_value")
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:21 | [fake] if ($normalized.StartsWith("fake_")) { return $true }
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:134 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:15 | [dummy] $bad = @("...", "changeme", "change_me", "todo", "tbd", "placeholder", "your_value_here", "replace_me", "real", "real_value", "real_secret", "real_key", "real_token", "dummy", "dummy_value", "fake", "fake_value")
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:20 | [dummy] if ($normalized.StartsWith("dummy_")) { return $true }
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:15 | [TODO] $bad = @("...", "changeme", "change_me", "todo", "tbd", "placeholder", "your_value_here", "replace_me", "real", "real_value", "real_secret", "real_key", "real_token", "dummy", "dummy_value", "fake", "fake_value")
scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1:22 | [example] if ($normalized.Contains("example.com")) { return $true }
scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1:13 | [placeholder] if ($Value -match "[<>{}]|placeholder|todo|changeme|your-") { return $false }
scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1:111 | [placeholder] [ordered]@{ name = "airtable_base_configured_redacted"; passed = $baseConfigured; detail = $(if ($baseConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1:112 | [placeholder] [ordered]@{ name = "airtable_token_present_redacted"; passed = $tokenConfigured; detail = $(if ($tokenConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1:113 | [placeholder] [ordered]@{ name = "airtable_mirror_table_configured_redacted"; passed = $tableConfigured; detail = $(if ($tableConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1:133 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1:13 | [TODO] if ($Value -match "[<>{}]|placeholder|todo|changeme|your-") { return $false }
scripts/staging/Invoke-KingsmenJarvisCommandRuntimeProof.ps1:51 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1:15 | [placeholder] return -not ($Value -match '[<>{}]|placeholder|todo|changeme|your-')
scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1:96 | [placeholder] [ordered]@{ name = "smtp_host_configured_redacted"; passed = $smtpHostConfigured; detail = if ($smtpHostConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1:97 | [placeholder] [ordered]@{ name = "smtp_user_configured_redacted"; passed = $smtpUserConfigured; detail = if ($smtpUserConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1:98 | [placeholder] [ordered]@{ name = "smtp_password_present_redacted"; passed = $smtpPasswordConfigured; detail = if ($smtpPasswordConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1:99 | [placeholder] [ordered]@{ name = "email_sender_configured_redacted"; passed = $senderConfigured; detail = if ($senderConfigured) { "present_redacted" } else { "missing_or_placeholder" } },
scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1:120 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1:15 | [TODO] return -not ($Value -match '[<>{}]|placeholder|todo|changeme|your-')
scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1:13 | [placeholder] if ($Value -match "[<>{}]|placeholder|todo|changeme|your-") { return $false }
scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1:105 | [placeholder] [ordered]@{ name = "github_repository_configured_redacted"; passed = $repoConfigured; detail = $(if ($repoConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1:106 | [placeholder] [ordered]@{ name = "github_token_present_redacted"; passed = $tokenConfigured; detail = $(if ($tokenConfigured) { "present_redacted" } else { "missing_or_placeholder" }) },
scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1:125 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1:13 | [TODO] if ($Value -match "[<>{}]|placeholder|todo|changeme|your-") { return $false }
scripts/staging/Invoke-KingsmenJarvisN8nThinRelayBoundaryProof.ps1:38 | [placeholder] foreach ($token in @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")) {
scripts/staging/Invoke-KingsmenJarvisN8nThinRelayBoundaryProof.ps1:120 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisN8nThinRelayBoundaryProof.ps1:38 | [dummy] foreach ($token in @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")) {
scripts/staging/Invoke-KingsmenJarvisN8nThinRelayBoundaryProof.ps1:38 | [TODO] foreach ($token in @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")) {
scripts/staging/Invoke-KingsmenJarvisN8nThinRelayBoundaryProof.ps1:38 | [example] foreach ($token in @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")) {
scripts/staging/Invoke-KingsmenJarvisOpenClawOperatorPolicyBoundaryProof.ps1:119 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:12 | [placeholder] function Test-PlaceholderValue {
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:16 | [placeholder] $badExact = @("todo", "tbd", "placeholder", "changeme", "change_me", "replace_me", "your_value_here", "real", "real_value", "dummy", "fake")
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:29 | [placeholder] if (-not (Test-PlaceholderValue $value)) { return $true }
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:37 | [placeholder] if (Test-PlaceholderValue $value) { return $false }
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:16 | [fake] $badExact = @("todo", "tbd", "placeholder", "changeme", "change_me", "replace_me", "your_value_here", "real", "real_value", "dummy", "fake")
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:18 | [fake] $badFragments = @("your_", "your-", "replace_", "real_", "dummy", "fake", "example.com")
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:151 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:16 | [dummy] $badExact = @("todo", "tbd", "placeholder", "changeme", "change_me", "replace_me", "your_value_here", "real", "real_value", "dummy", "fake")
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:18 | [dummy] $badFragments = @("your_", "your-", "replace_", "real_", "dummy", "fake", "example.com")
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:16 | [TODO] $badExact = @("todo", "tbd", "placeholder", "changeme", "change_me", "replace_me", "your_value_here", "real", "real_value", "dummy", "fake")
scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1:18 | [example] $badFragments = @("your_", "your-", "replace_", "real_", "dummy", "fake", "example.com")
scripts/staging/Invoke-KingsmenJarvisPlaywrightScoutMapFallbackBoundaryProof.ps1:15 | [placeholder] $bad = @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")
scripts/staging/Invoke-KingsmenJarvisPlaywrightScoutMapFallbackBoundaryProof.ps1:124 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisPlaywrightScoutMapFallbackBoundaryProof.ps1:15 | [dummy] $bad = @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")
scripts/staging/Invoke-KingsmenJarvisPlaywrightScoutMapFallbackBoundaryProof.ps1:15 | [TODO] $bad = @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")
scripts/staging/Invoke-KingsmenJarvisPlaywrightScoutMapFallbackBoundaryProof.ps1:15 | [example] $bad = @("placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here")
scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1:13 | [placeholder] return ($Value -notmatch "[<>{}]|placeholder|todo|changeme|your-")
scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1:119 | [placeholder] Add-Check -Checks $checks -Name "whatsapp_business_account_configured_redacted" -Passed $whatsappBusinessAccountReady -Detail $(if ($whatsappBusinessAccountReady) { "present_redacted" } else { "missing_or_placeholder" })
scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1:120 | [placeholder] Add-Check -Checks $checks -Name "whatsapp_phone_number_configured_redacted" -Passed $whatsappPhoneReady -Detail $(if ($whatsappPhoneReady) { "present_redacted" } else { "missing_or_placeholder" })
scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1:122 | [placeholder] Add-Check -Checks $checks -Name "sms_provider_configured_redacted" -Passed $smsProviderReady -Detail $(if ($smsProviderReady) { "present_redacted" } else { "missing_or_placeholder" })
scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1:151 | [fake] noFakeData = $true
scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1:13 | [TODO] return ($Value -notmatch "[<>{}]|placeholder|todo|changeme|your-")
scripts/staging/Invoke-KingsmenObservabilityIncidentStagingProof.ps1:325 | [sample] $checks = Add-Check $checks "structured_log_correlation_id" $true "correlation_id_present_redacted_sample"
scripts/staging/Invoke-KingsmenObservabilityIncidentStagingProof.ps1:337 | [sample] structuredLogSampleCaptured = $true
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:28 | [placeholder] function Test-PlaceholderValue {
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:36 | [placeholder] "placeholder",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:83 | [placeholder] return -not (Test-PlaceholderValue $value)
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:89 | [placeholder] if (Test-PlaceholderValue $value) { return $false }
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:94 | [placeholder] if (Test-PlaceholderValue $uri.Host) { return $false }
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:95 | [placeholder] if (Test-PlaceholderValue $uri.AbsolutePath) { return $false }
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:50 | [fake] "fake",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:51 | [fake] "fake_value",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:67 | [fake] "fake",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:48 | [dummy] "dummy",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:49 | [dummy] "dummy_value",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:66 | [dummy] "dummy",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:34 | [TODO] "todo",
scripts/staging/Invoke-KingsmenPayFastProviderSandboxStagingProof.ps1:68 | [example] "example.com"
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:28 | [placeholder] function Test-PlaceholderValue {
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:41 | [placeholder] $trimmed -match 'placeholder'
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:122 | [placeholder] if (Test-PlaceholderValue -Value $env:KINGSMEN_DATABASE_URL) { return [ordered]@{ attempted = $true; passed = $false; reason = "PLACEHOLDER_DATABASE_URL_CONFIGURED" } }
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:160 | [placeholder] if (Test-PlaceholderValue -Value $env:KINGSMEN_DATABASE_URL) { return [ordered]@{ attempted = $true; passed = $false; reason = "PLACEHOLDER_DATABASE_URL_CONFIGURED"; checks = @(@{ name = "rls_probe"; passed = $false; detail = "PLACEHOLDER_DATABASE_URL_CONFIGURED" }) } }
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:253 | [placeholder] if ($RunWebProbe -and $BackendBaseUrl -and -not (Test-PlaceholderValue -Value $BackendBaseUrl)) {
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:262 | [placeholder] $webChecks = @(@{ name = "web_probe"; passed = $false; detail = "RUN_WEB_PROBE_OR_BACKEND_BASE_URL_NOT_SET_OR_PLACEHOLDER" })
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:40 | [example] $trimmed -match 'example' -or
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:178 | [example] VALUES ('KINGS-RLS-A', 'redacted-a@example.invalid', 'RLS Probe Candidate A', 'NEW')
scripts/staging/Invoke-KingsmenStagingRuntimeEvidencePack.ps1:182 | [example] VALUES ('KINGS-RLS-B', 'redacted-b@example.invalid', 'RLS Probe Candidate B', 'NEW')
scripts/testing/Test-KingsmenCreator.ps1:69 | [static] $checks.Add((New-Check -Name ("creator:contains:{0}" -f $token) -Passed ($content.Contains($token)) -Detail "static token check"))
scripts/validators/Validate-N01.ps1:10 | [example] ".env.n01.example",
scripts/validators/Validate-N07.ps1:30 | [example] "runtime\airtable\airtable-runtime.example.json",
scripts/validators/Validate-N07.ps1:61 | [example] Require-Contains "runtime\airtable\airtable-runtime.example.json" "AIRTABLE_API_KEY" "N07 runtime example missing AIRTABLE_API_KEY reference."
scripts/validators/Validate-N10.ps1:58 | [fake] Require-Contains "db\seeds\n10_finance_payfast_seed.sql" "Never invent fake" "Seed must lock CV truth rule."
scripts/validators/Validate-N10.ps1:23 | [example] "runtime\payfast\payfast-runtime.example.json",
scripts/validators/Validate-N10.ps1:59 | [example] Require-Contains "runtime\payfast\payfast-runtime.example.json" "PAYFAST_MERCHANT_ID" "Runtime example missing merchant ID."
scripts/validators/Validate-N10.ps1:60 | [example] Require-Contains "runtime\payfast\payfast-runtime.example.json" "Never commit real PayFast credentials" "Runtime example must block secrets."
scripts/validators/Validate-N11.ps1:48 | [fake] Require-Contains "manifests\n11\ai-decision-matching-engine.json" "No fake guarantees" "Manifest must block fake guarantees."
scripts/validators/Validate-N11.ps1:23 | [example] "runtime\ai\ai-decision-runtime.example.json",
scripts/validators/Validate-N11.ps1:65 | [example] Require-Contains "runtime\ai\ai-decision-runtime.example.json" "recommendation_only" "Runtime must be recommendation-only."
scripts/validators/Validate-N11.ps1:66 | [example] Require-Contains "runtime\ai\ai-decision-runtime.example.json" "No model provider secrets are committed" "Runtime must block secrets."
scripts/validators/Validate-N12.ps1:23 | [example] "runtime\governance\governance-runtime.example.json",
scripts/validators/Validate-N12.ps1:67 | [example] Require-Contains "runtime\governance\governance-runtime.example.json" "No secrets are committed" "Runtime must block committed secrets."
scripts/validators/Validate-N13.ps1:51 | [sample] Require-Contains "db\migrations\0011_n13_observability_reports_incidents.sql" "metric_samples" "Migration missing metric samples."
scripts/validators/Validate-N13.ps1:23 | [example] "runtime\observability\observability-runtime.example.json",
scripts/validators/Validate-N13.ps1:66 | [example] Require-Contains "runtime\observability\observability-runtime.example.json" "No secrets are committed" "Runtime must block committed secrets."
scripts/validators/Validate-N14.ps1:13 | [example] "runtime\integrations\integrations-runtime.example.json",
scripts/validators/Validate-N14.ps1:48 | [example] Require-Contains "runtime\integrations\integrations-runtime.example.json" "Never commit secret values" "Runtime example must block secrets."
scripts/validators/Validate-N15.ps1:35 | [fake] Require-Contains "manifests\n15\opportunity-engine-source-intelligence.json" "No fake deadlines" "Manifest must block fake deadlines."
scripts/validators/Validate-N15.ps1:36 | [fake] Require-Contains "manifests\n15\opportunity-engine-source-intelligence.json" "No fake links" "Manifest must block fake links."
scripts/validators/Validate-N15.ps1:37 | [fake] Require-Contains "manifests\n15\opportunity-engine-source-intelligence.json" "No fake programme availability" "Manifest must block fake availability."
scripts/validators/Validate-N15.ps1:58 | [fake] Require-Contains "runtime\opportunity\opportunity-runtime.example.json" "noFakeDeadlines" "Runtime missing no fake deadline rule."
scripts/validators/Validate-N15.ps1:60 | [fake] Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "NO_FAKE_DEADLINES" "Opportunity engine must block fake deadlines."
scripts/validators/Validate-N15.ps1:61 | [fake] Require-Contains "apps\api\src\opportunity\opportunity-engine.ts" "NO_FAKE_LINKS_SOURCE_URL_REQUIRED" "Opportunity engine must require source URL."
scripts/validators/Validate-N15.ps1:71 | [fake] Require-Contains "reports\n15\N15_OPPORTUNITY_ENGINE_SOURCE_INTELLIGENCE_REPORT.md" "No fake deadlines" "Report must state no fake deadlines."
scripts/validators/Validate-N15.ps1:23 | [example] "runtime\opportunity\opportunity-runtime.example.json",
scripts/validators/Validate-N15.ps1:58 | [example] Require-Contains "runtime\opportunity\opportunity-runtime.example.json" "noFakeDeadlines" "Runtime missing no fake deadline rule."
scripts/validators/Validate-N16.ps1:23 | [example] "runtime\orchestrator\orchestrator-runtime.example.json",
scripts/validators/Validate-N16.ps1:65 | [example] Require-Contains "runtime\orchestrator\orchestrator-runtime.example.json" "backendControlsState" "Runtime missing backend control flag."
scripts/validators/Validate-N16.ps1:66 | [example] Require-Contains "runtime\orchestrator\orchestrator-runtime.example.json" "n8nWorkersAreThin" "Runtime missing n8n thin flag."
scripts/validators/Validate-N17.ps1:23 | [example] "runtime\founder-ops\founder-command-runtime.example.json",
scripts/validators/Validate-N17.ps1:72 | [example] Require-Contains "runtime\founder-ops\founder-command-runtime.example.json" "notSecondBackend" "Runtime must mark founder control not second backend."
scripts/validators/Validate-N17.ps1:73 | [example] Require-Contains "runtime\founder-ops\founder-command-runtime.example.json" "commandsRouteThrough" "Runtime missing command route doctrine."
scripts/validators/Validate-N18.ps1:23 | [example] "runtime\public-website\public-website-runtime.example.json",
scripts/validators/Validate-N18.ps1:79 | [example] Require-Contains "runtime\public-website\public-website-runtime.example.json" "private route command house" "Runtime must state route command house."
scripts/validators/Validate-N18.ps1:80 | [example] Require-Contains "runtime\public-website\public-website-runtime.example.json" "notCheapApplicationHelp" "Runtime must block cheap service positioning."
scripts/validators/Validate-N18.ps1:81 | [example] Require-Contains "runtime\public-website\public-website-runtime.example.json" "managedApplications" "Runtime must include managed application count."
scripts/validators/Validate-N18.ps1:82 | [example] Require-Contains "runtime\public-website\public-website-runtime.example.json" "requiresConsent" "Runtime must require consent."
scripts/validators/Validate-N19.ps1:55 | [fake] Require-Contains "manifests\n19\candidate-mobile-public-portal.json" "NO_FAKE_STATUS" "Manifest must lock no fake status."
scripts/validators/Validate-N19.ps1:65 | [fake] Require-Contains "apps\api\src\candidate-mobile\mobile-policy.ts" "NO_FAKE_STATUS" "Policy must enforce no fake status."
scripts/validators/Validate-N19.ps1:82 | [fake] "NO_FAKE_STATUS",
scripts/validators/Validate-N19.ps1:30 | [example] "runtime\candidate-mobile\candidate-mobile-runtime.example.json",
scripts/validators/Validate-N20.ps1:71 | [fake] Require-Contains "apps\web\src\final-assembly\ProductionReadinessDashboard.tsx" "does not pretend the platform is live" "UI must not fake live readiness."
scripts/validators/Validate-N20.ps1:102 | [fake] "NO_FAKE_STATUS",
scripts/validators/Validate-N20.ps1:103 | [fake] "NO_FAKE_DEADLINES",
scripts/validators/Validate-N20.ps1:104 | [fake] "NO_FAKE_ACCEPTANCE_CLAIMS",
scripts/validators/Validate-N20.ps1:105 | [fake] "NO_FAKE_PAYMENT_SUCCESS",
scripts/validators/Validate-N20.ps1:106 | [fake] "NO_FAKE_REFUND_DECISION",
scripts/validators/Validate-N20.ps1:107 | [fake] "NO_FAKE_AI_GOVERNANCE",
scripts/validators/Validate-N20.ps1:30 | [example] "runtime\release\kingsmen-production-readiness.example.json",
scripts/validators/validate-apply-now-v2.mjs:15 | [fake] "fake jobs included"
scripts/validators/validate-apply-now.mjs:53 | [fake] name: "no_fake_submission_claim",
scripts/validators/validate-founder-proof-centre-page-wiring.mjs:57 | [static] check("web-public-page-path", exists("apps/web/public/founder/proof-centre/index.html"), "static public page");
scripts/validators/validate-founder-proof-centre-page-wiring.mjs:58 | [static] check("web-public-adapter-path", exists("apps/web/public/founder/proof-centre/adapter.json"), "static public adapter");
scripts/validators/validate-founder-proof-centre-page-wiring.mjs:60 | [static] check("page-model-local-only", pageModel?.runtimeScope === "local_static_founder_page_wiring_only", pageModel?.runtimeScope ?? "missing");
scripts/validators/validate-founder-proof-centre-page-wiring.mjs:108 | [static] oracle_lite_impact: "none_local_static_web_page_only",
scripts/validators/validate-founder-proof-centre-page-wiring.mjs:109 | [static] control_plane_impact: "Founder can view BATCH 24 proof cards through a tiny static web page once the local web app is running.",
scripts/validators/validate-founder-proof-centre-runtime-reachability.mjs:112 | [static] control_plane_impact: "Founder Proof Centre static page is proven reachable through the local web runtime.",
scripts/validators/validate-free-destiny-map-backend-runtime-boundary.mjs:59 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
scripts/validators/validate-free-destiny-map-browser-style-submit.mjs:59 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
scripts/validators/validate-free-destiny-map-controlled-web-api-integration.mjs:61 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
scripts/validators/validate-free-destiny-map-controlled-web-api-integration.mjs:72 | [demo] ["apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts", ["export async function POST", "runtime = \"nodejs\"", "next-api-demo-intakes.jsonl", "productionReady: false", "officialApplicationSubmitted: false", "paymentInstructionSent: false", "documentUploadAccepted: false", "emailSent: false"]],
scripts/validators/validate-free-destiny-map-local-http-exercise.mjs:45 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
scripts/validators/validate-free-destiny-map-local-route-exercise.mjs:45 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
scripts/validators/validate-free-destiny-map-local-route-exercise.mjs:56 | [demo] ["scripts/proof/prove-free-destiny-map-local-route-exercise.mjs", ["LOCAL_ROUTE_EXERCISE_PROVEN", "demo-payload-has-consent", "local-jsonl-proof-write", "storesProductionData: false"]],
scripts/validators/validate-free-destiny-map-local-web-http-exercise.mjs:45 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
scripts/validators/validate-free-destiny-map-next-backend-bridge.mjs:61 | [demo] if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
scripts/validators/validate-jarvis-live-pass-08.mjs:6 | [static] ['packages/jarvis-core/src/jarvis-founder-console-static-html.ts', 'jarvisCreateFounderConsoleStaticHtml'],
scripts/validators/validate-jarvis-live-pass-09.mjs:17 | [static] file: 'packages/jarvis-core/src/jarvis-console-static-smoke-page.ts',
scripts/validators/validate-jarvis-live-pass-09.mjs:18 | [static] tokens: ['JarvisConsoleStaticSmokePage', 'jarvisCreateConsoleStaticSmokePage', 'readOnly: true'],
scripts/validators/validate-jarvis-live-pass-09.mjs:22 | [static] tokens: ['jarvisCreateFounderConsoleStaticHtml', 'jarvisCreateValidationReportFixture'],
scripts/validators/validate-jarvis-perfect-rebuild-number-ledger.mjs:78 | [fake] assert(ledger.forbiddenBehaviors.some((rule) => rule.includes('runtime proof')), 'Forbidden behaviors must block fake runtime proof claims.');
scripts/validators/validate-kingsmen-launch-readiness-evidence-aware.mjs:35 | [sample] const sampleLength = Math.min(buffer.length, 80);
scripts/validators/validate-kingsmen-launch-readiness-evidence-aware.mjs:38 | [sample] for (let index = 0; index < sampleLength; index += 1) {
scripts/validators/validate-kingsmen-launch-readiness.mjs:117 | [placeholder] checkFile('scripts/proof/prove-secrets-wiring-boundary.mjs', ['SECRETS_WIRING_SOURCE_PROOF_PASSED', 'env_example_empty_placeholders_only', 'credential_has_no_value', 'runtimeSecretHealthProofPending: true']),
scripts/validators/validate-kingsmen-launch-readiness.mjs:67 | [example] checkFile('.gitignore', ['.env', '.env.*', '!.env.example', '.local/backups', 'backups/', '*.dump', '*.backup']),
scripts/validators/validate-kingsmen-launch-readiness.mjs:68 | [example] checkFile('.env.example', ['DATABASE_URL=', 'REDIS_URL=', 'SMTP_PASSWORD=', 'PAYMENT_PROVIDER_SECRET=', 'STORAGE_ACCESS_KEY=']),
scripts/validators/validate-kingsmen-launch-readiness.mjs:117 | [example] checkFile('scripts/proof/prove-secrets-wiring-boundary.mjs', ['SECRETS_WIRING_SOURCE_PROOF_PASSED', 'env_example_empty_placeholders_only', 'credential_has_no_value', 'runtimeSecretHealthProofPending: true']),
scripts/validators/validate-n01-readiness.mjs:190 | [hardcoded] const locks = ["oracleLiteFirst", "postgresqlTruth", "airtableMirrorOnly", "emailPrimary", "whatsappUrgentOnly", "smsBackupOnly", "playwrightScoutOnly", "noHardcodedSecrets"];
scripts/validators/validate-n09-3.mjs:88 | [hardcoded] { name: "hardcodedPasswordAssignment", pattern: new RegExp(["pass", "word"].join("") + "\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") },
scripts/validators/validate-n09-3.mjs:89 | [hardcoded] { name: "hardcodedTokenAssignment", pattern: new RegExp(["tok", "en"].join("") + "\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") },
scripts/validators/validate-n09-3.mjs:90 | [hardcoded] { name: "hardcodedApiKeyAssignment", pattern: new RegExp("api[_-]?key\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") },
scripts/validators/validate-n09-3.mjs:91 | [hardcoded] { name: "hardcodedSecretAssignment", pattern: new RegExp(["sec", "ret"].join("") + "\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") }
scripts/validators/validate-openclaw-safety.mjs:95 | [TODO] { name: "todoMarker", pattern: /\bTODO\b/i },
scripts/validators/validate-oracle-action-packet.mjs:83 | [TODO] { name: "todoMarker", pattern: /\bTODO\b/i },
scripts/validators/validate-oracle-bootstrap.mjs:89 | [TODO] { name: "todoMarker", pattern: /\bTODO\b/i },
scripts/validators/validate-oracle-bootstrap.mjs:142 | [hardcoded] addCheck(checks, "provider-registry:noHardcodedSecrets", registry.doctrine?.noHardcodedSecrets === true, String(registry.doctrine?.noHardcodedSecrets), file);
scripts/validators/validate-oracle-first-login-checklist.mjs:65 | [TODO] addCheck(checks, `safe:${file}:no-todo`, !/\bTODO\b/i.test(content), "scanned", file);
scripts/validators/validate-oracle-prerequisites.mjs:125 | [TODO] { name: "todoMarker", pattern: /\bTODO\b/i },
scripts/validators/validate-oracle-prerequisites.mjs:124 | [hardcoded] { name: "hardcodedSecretValue", pattern: /(password|token|api_key|secret)\s*[:=]\s*["'][^"'\s]{8,}["']/i },
scripts/validators/validate-oracle-prerequisites.mjs:240 | [hardcoded] addCheck(checks, "provider-registry:noHardcodedSecrets", registry.doctrine?.noHardcodedSecrets === true, String(registry.doctrine?.noHardcodedSecrets), file);
scripts/validators/validate-oracle-runtime-install-plan.mjs:68 | [TODO] addCheck(checks, `safe:${file}:no-todo`, !/\bTODO\b/i.test(content), "scanned", file);
scripts/validators/validate-oracle-vm-bootstrap-plan.mjs:63 | [TODO] { name: "todoMarker", pattern: /\bTODO\b/i },
scripts/validators/validate-oracle-workspace.mjs:80 | [TODO] { name: "todoMarker", pattern: /\bTODO\b/i },
scripts/validators/validate-personal-jobs-17-real-job-discovery-agent.mjs:17 | [example] "data/personal-job-desk/job-search-sources.local.example.json",
scripts/validators/validate-personal-jobs-18-sa-source-expansion.mjs:17 | [example] "data/personal-job-desk/sa-job-sources.local.example.json",
scripts/validators/validate-personal-jobs-19-playwright-source-scout.mjs:17 | [example] "data/personal-job-desk/source-scout-queue.local.example.json",
scripts/validators/validate-personal-jobs-20b-opportunity-quality-gate.mjs:48 | [demo] module: "PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
scripts/validators/validate-provider-health.mjs:138 | [TODO] { name: "todoMarker", pattern: /\bTODO\b/i },
scripts/validators/validate-provider-health.mjs:219 | [hardcoded] "noHardcodedSecrets",
scripts/validators/validate-secrets-wiring-proof.mjs:86 | [placeholder] 'env_example_empty_placeholders_only',
scripts/validators/validate-secrets-wiring-proof.mjs:30 | [example] '.env.example',
scripts/validators/validate-secrets-wiring-proof.mjs:56 | [example] '.env.example': [
scripts/validators/validate-secrets-wiring-proof.mjs:68 | [example] '!.env.example',
scripts/validators/validate-secrets-wiring-proof.mjs:86 | [example] 'env_example_empty_placeholders_only',