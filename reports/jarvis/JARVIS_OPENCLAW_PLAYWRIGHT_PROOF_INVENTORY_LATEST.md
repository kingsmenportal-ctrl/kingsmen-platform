# JARVIS OPENCLAW / PLAYWRIGHT PROOF INVENTORY

OpenClaw must be the command gateway, policy gate, tool router, approval boundary, and evidence ledger.
Playwright must be scout/probe only. CAPTCHA, OTP, blocked portals, or selector failure must go to MAP/manual/Phoenix fallback.

OpenClaw hits: 2782
Playwright hits: 5706

OpenClaw hits:
.env.example:49 | [OpenClaw] # Operator helper integrations. Must never expose raw secrets to OpenClaw/Jarvis.
.env.example:50 | [OpenClaw] OPENCLAW_GATEWAY_TOKEN=""
.env.example:49 | [openclaw] # Operator helper integrations. Must never expose raw secrets to OpenClaw/Jarvis.
.env.example:50 | [openclaw] OPENCLAW_GATEWAY_TOKEN=""
.env.example:50 | [gateway] OPENCLAW_GATEWAY_TOKEN=""
README.md:12 | [policy gate] - `packages/jarvis-core/src/jarvis-policy-gate.ts` — live policy gate for mode/channel/tool/authority decisions.
apps/api/src/control-plane/control-plane.ts:77 | [command boundary] return { allowed: true, requiresApproval: command.requiresApproval, reason: "Accepted into backend command boundary" };
apps/api/src/final-assembly/runbook-registry.ts:35 | [evidence ledger] "Check PayFast ITN/evidence ledger",
apps/api/src/founder/founder-control-plane-read-model.ts:34 | [OpenClaw] openclawRole: "operator_worker_requires_policy_and_evidence";
apps/api/src/founder/founder-control-plane-read-model.ts:76 | [OpenClaw] openclawRole: spine.openclawRole,
apps/api/src/founder/founder-control-plane-read-model.ts:34 | [openclaw] openclawRole: "operator_worker_requires_policy_and_evidence";
apps/api/src/founder/founder-control-plane-read-model.ts:76 | [openclaw] openclawRole: spine.openclawRole,
apps/api/src/governance/finance-refund-policy.ts:13 | [approval boundary] gateName: "Refund approval boundary",
apps/api/src/governance/policy-gate-engine.ts:35 | [policy gate] decisionSummary: "Policy gate blocked action because required evidence is missing.",
apps/api/src/governance/policy-gate-engine.ts:55 | [policy gate] decisionSummary: "Policy gate blocked action by hard governance rule.",
apps/api/src/governance/policy-gate-engine.ts:75 | [policy gate] decisionSummary: "Policy gate requires human/operator review before this action can continue.",
apps/api/src/governance/policy-gate-engine.ts:95 | [policy gate] decisionSummary: "Policy gate allowed action with warning.",
apps/api/src/governance/policy-gate-engine.ts:114 | [policy gate] decisionSummary: "Policy gate allowed action.",
apps/api/src/governance/policy-registry.ts:18 | [approval boundary] policyName: "Official submission approval boundary",
apps/api/src/governance/submission-policy.ts:14 | [approval boundary] gateName: "Official submission approval boundary",
apps/api/src/integrations/integrations.ts:16 | [gateway] { workflowCode: "W00", workflowName: "Template Registry", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Same-state registry worker." },
apps/api/src/integrations/integrations.ts:17 | [gateway] { workflowCode: "W01", workflowName: "Kingsmen Intake Web", targetState: "EVALUATION_PENDING", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Intake claim/commit/heartbeat/duplicate gate." },
apps/api/src/integrations/integrations.ts:18 | [gateway] { workflowCode: "W02", workflowName: "MSB Evaluate", targetState: "DOCUMENT_PENDING", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Evaluation worker." },
apps/api/src/integrations/integrations.ts:19 | [gateway] { workflowCode: "W03", workflowName: "MSB Execute", targetState: "COMPLETED", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Execution worker; no portal bypass." },
apps/api/src/integrations/integrations.ts:20 | [gateway] { workflowCode: "W04", workflowName: "MSB Govern", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Governance same-state worker." },
apps/api/src/integrations/integrations.ts:22 | [gateway] { workflowCode: "W06", workflowName: "MSB Defer", targetState: "DOCUMENT_PENDING", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Defer worker." },
apps/api/src/integrations/integrations.ts:23 | [gateway] { workflowCode: "W07", workflowName: "Document Uploaded", targetState: "EXECUTION_PENDING", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Document readiness worker." },
apps/api/src/integrations/integrations.ts:24 | [gateway] { workflowCode: "W08", workflowName: "MSB Status", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Same-state status worker." },
apps/api/src/integrations/integrations.ts:25 | [gateway] { workflowCode: "W09", workflowName: "Comms Inbound", targetState: "SAME", connectorKey: "email_delivery_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Inbound communications worker." },
apps/api/src/integrations/integrations.ts:26 | [gateway] { workflowCode: "W10", workflowName: "MSB Fee", targetState: "EXECUTION_PENDING", connectorKey: "payfast_itn_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Payment evidence worker." },
apps/api/src/integrations/integrations.ts:27 | [gateway] { workflowCode: "W11", workflowName: "MSB Content", targetState: "DOCUMENT_PENDING", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Content/document worker." },
apps/api/src/integrations/integrations.ts:28 | [gateway] { workflowCode: "W12", workflowName: "Outreach Inbound", targetState: "INTAKE_PENDING", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Outreach-to-intake worker." },
apps/api/src/integrations/integrations.ts:29 | [gateway] { workflowCode: "W13", workflowName: "Social Generate", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Social same-state worker." },
apps/api/src/integrations/integrations.ts:30 | [gateway] { workflowCode: "W14", workflowName: "Analytics Request", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Analytics same-state worker." },
apps/api/src/integrations/integrations.ts:31 | [gateway] { workflowCode: "W15", workflowName: "System Insight Generator", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "W15 insight suggests; governance decides." },
apps/api/src/integrations/integrations.ts:32 | [gateway] { workflowCode: "W16", workflowName: "Sovereign Kernel", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Kernel same-state worker." },
apps/api/src/integrations/integrations.ts:33 | [gateway] { workflowCode: "W17", workflowName: "Sovereign Kernel v2", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "W24 routes through W17." },
apps/api/src/integrations/integrations.ts:34 | [gateway] { workflowCode: "W24", workflowName: "W24 Command", targetState: "SAME", connectorKey: "n8n_worker_gateway", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "W24 -> W17 -> worker -> /workflow/result." }
apps/api/src/system/kingsmen-operating-system-spine.ts:13 | [OpenClaw] | "OPENCLAW_OPERATOR"
apps/api/src/system/kingsmen-operating-system-spine.ts:50 | [OpenClaw] openclawRole: "operator_worker_requires_policy_and_evidence";
apps/api/src/system/kingsmen-operating-system-spine.ts:235 | [OpenClaw] agentOwner: "OPENCLAW_OPERATOR",
apps/api/src/system/kingsmen-operating-system-spine.ts:236 | [OpenClaw] toolBoundary: "OpenClaw executes controlled checks; founder receives cause/why/how-to-fix.",
apps/api/src/system/kingsmen-operating-system-spine.ts:274 | [OpenClaw] agentOwner: "OPENCLAW_OPERATOR",
apps/api/src/system/kingsmen-operating-system-spine.ts:358 | [OpenClaw] openclawRole: "operator_worker_requires_policy_and_evidence",
apps/api/src/system/kingsmen-operating-system-spine.ts:13 | [openclaw] | "OPENCLAW_OPERATOR"
apps/api/src/system/kingsmen-operating-system-spine.ts:50 | [openclaw] openclawRole: "operator_worker_requires_policy_and_evidence";
apps/api/src/system/kingsmen-operating-system-spine.ts:235 | [openclaw] agentOwner: "OPENCLAW_OPERATOR",
apps/api/src/system/kingsmen-operating-system-spine.ts:236 | [openclaw] toolBoundary: "OpenClaw executes controlled checks; founder receives cause/why/how-to-fix.",
apps/api/src/system/kingsmen-operating-system-spine.ts:274 | [openclaw] agentOwner: "OPENCLAW_OPERATOR",
apps/api/src/system/kingsmen-operating-system-spine.ts:358 | [openclaw] openclawRole: "operator_worker_requires_policy_and_evidence",
apps/api/src/system/kingsmen-operating-system-spine.ts:180 | [evidence ledger] purpose: "Email-primary notifications, urgent WhatsApp only, SMS backup, templates, and evidence ledger.",
apps/api/src/system/kingsmen-operating-system-spine.ts:182 | [evidence ledger] truthSurface: ["message evidence ledger", "provider staging reports"],
apps/api/src/system/kingsmen-operating-system-spine.ts:193 | [evidence ledger] purpose: "Pricing, orders, invoices, PayFast ITN, evidence ledger, refunds, entitlements, and payment status.",
apps/web/jarvis-os/jarvis-os.html:80 | [OpenClaw] <button class="ghost" onclick="run('OpenClaw Gateway')">OPENCLAW</button>
apps/web/jarvis-os/jarvis-os.html:121 | [OpenClaw] ["2","OpenClaw Gateway","Command Registry · Policy Gate · Evidence Ledger","ADAPTER-GATED","OpenClaw Gateway"],
apps/web/jarvis-os/jarvis-os.html:135 | [OpenClaw] el("context").innerHTML = ["Session Context · 23k tokens","Memory Rules · Enforced","OpenClaw · Connected","Playwright · Scout","Oracle Lite · Local"].map(x=>`<div><span>${x}</span><b>ACTIVE</b></div>`).join("");
apps/web/jarvis-os/jarvis-os.html:80 | [openclaw] <button class="ghost" onclick="run('OpenClaw Gateway')">OPENCLAW</button>
apps/web/jarvis-os/jarvis-os.html:121 | [openclaw] ["2","OpenClaw Gateway","Command Registry · Policy Gate · Evidence Ledger","ADAPTER-GATED","OpenClaw Gateway"],
apps/web/jarvis-os/jarvis-os.html:135 | [openclaw] el("context").innerHTML = ["Session Context · 23k tokens","Memory Rules · Enforced","OpenClaw · Connected","Playwright · Scout","Oracle Lite · Local"].map(x=>`<div><span>${x}</span><b>ACTIVE</b></div>`).join("");
apps/web/jarvis-os/jarvis-os.html:121 | [command registry] ["2","OpenClaw Gateway","Command Registry · Policy Gate · Evidence Ledger","ADAPTER-GATED","OpenClaw Gateway"],
apps/web/jarvis-os/jarvis-os.html:121 | [policy gate] ["2","OpenClaw Gateway","Command Registry · Policy Gate · Evidence Ledger","ADAPTER-GATED","OpenClaw Gateway"],
apps/web/jarvis-os/jarvis-os.html:93 | [evidence ledger] 09:44 Evidence ledger updated</pre></section>
apps/web/jarvis-os/jarvis-os.html:121 | [evidence ledger] ["2","OpenClaw Gateway","Command Registry · Policy Gate · Evidence Ledger","ADAPTER-GATED","OpenClaw Gateway"],
apps/web/jarvis-os/jarvis-os.html:80 | [gateway] <button class="ghost" onclick="run('OpenClaw Gateway')">OPENCLAW</button>
apps/web/jarvis-os/jarvis-os.html:121 | [gateway] ["2","OpenClaw Gateway","Command Registry · Policy Gate · Evidence Ledger","ADAPTER-GATED","OpenClaw Gateway"],
apps/web/netlify/functions/jarvis-agent.cjs:57 | [OpenClaw] if (text.includes("openclaw")) {
apps/web/netlify/functions/jarvis-agent.cjs:58 | [OpenClaw] return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:59 | [OpenClaw] "OPENCLAW GATEWAY",
apps/web/netlify/functions/jarvis-agent.cjs:164 | [OpenClaw] return response("COMMAND_RECEIVED", "Command received by live Jarvis OS. Select a module or type OpenClaw, Playwright, Oracle Lite, N00-N20, Candidate Ops, Route Universe, Provider Matrix, Evidence, or Founder Command.", "Jarvis OS is live. This command is routed to the command console.");
apps/web/netlify/functions/jarvis-agent.cjs:57 | [openclaw] if (text.includes("openclaw")) {
apps/web/netlify/functions/jarvis-agent.cjs:58 | [openclaw] return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:59 | [openclaw] "OPENCLAW GATEWAY",
apps/web/netlify/functions/jarvis-agent.cjs:164 | [openclaw] return response("COMMAND_RECEIVED", "Command received by live Jarvis OS. Select a module or type OpenClaw, Playwright, Oracle Lite, N00-N20, Candidate Ops, Route Universe, Provider Matrix, Evidence, or Founder Command.", "Jarvis OS is live. This command is routed to the command console.");
apps/web/netlify/functions/jarvis-agent.cjs:58 | [command registry] return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:60 | [command registry] "- Command Registry: classifies requests.",
apps/web/netlify/functions/jarvis-agent.cjs:58 | [policy gate] return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:61 | [policy gate] "- Policy Gate: blocks unsafe or unproven actions.",
apps/web/netlify/functions/jarvis-agent.cjs:159 | [policy gate] "- Context engine, memory rules, policy gates, and evidence-first output.",
apps/web/netlify/functions/jarvis-agent.cjs:58 | [tool router] return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:62 | [tool router] "- Tool Router: sends approved commands to local/provider adapters.",
apps/web/netlify/functions/jarvis-agent.cjs:58 | [evidence ledger] return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:63 | [evidence ledger] "- Evidence Ledger: records proof before claims.",
apps/web/netlify/functions/jarvis-agent.cjs:58 | [gateway] return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:59 | [gateway] "OPENCLAW GATEWAY",
apps/web/scripts/build-jarvis-luxury.cjs:136 | [command registry] <p>Jarvis combines every provider into one command registry. Actual external actions require secured credentials, OAuth, policy gates, and evidence logs.</p>
apps/web/scripts/build-jarvis-luxury.cjs:136 | [policy gate] <p>Jarvis combines every provider into one command registry. Actual external actions require secured credentials, OAuth, policy gates, and evidence logs.</p>
apps/web/scripts/build-static-jarvis.cjs:188 | [policy gate] reply: "Jarvis live shell is active. Provider tools require explicit adapters, credentials, policy gates, and evidence logs before Jarvis can operate them.",
apps/web/src/app/api/jarvis/agent/route.ts:89 | [command registry] "- Correct operating rule: Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger."
apps/web/src/app/api/jarvis/agent/route.ts:87 | [policy gate] "- External providers require explicit OAuth/API credentials, adapters, policy gates, and evidence logging before Jarvis can operate them.",
apps/web/src/app/api/jarvis/agent/route.ts:89 | [policy gate] "- Correct operating rule: Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger."
apps/web/src/app/api/jarvis/agent/route.ts:102 | [policy gate] "3. Keep provider tools separated until each adapter has credentials, policy gates, and evidence logging.",
apps/web/src/app/api/jarvis/agent/route.ts:89 | [tool router] "- Correct operating rule: Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger."
apps/web/src/app/api/jarvis/agent/route.ts:89 | [evidence ledger] "- Correct operating rule: Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger."
apps/web/src/app/api/jarvis/agent/route.ts:147 | [command boundary] "LOCAL COMMAND BOUNDARY",
apps/web/src/app/api/jarvis/command/route.ts:78 | [OpenClaw] OPENCLAW_GRIP_CHECK: {
apps/web/src/app/api/jarvis/command/route.ts:79 | [OpenClaw] title: "OpenClaw grip check",
apps/web/src/app/api/jarvis/command/route.ts:80 | [OpenClaw] category: "OpenClaw",
apps/web/src/app/api/jarvis/command/route.ts:82 | [OpenClaw] backendAction: "openclaw_grip_check"
apps/web/src/app/api/jarvis/command/route.ts:78 | [openclaw] OPENCLAW_GRIP_CHECK: {
apps/web/src/app/api/jarvis/command/route.ts:79 | [openclaw] title: "OpenClaw grip check",
apps/web/src/app/api/jarvis/command/route.ts:80 | [openclaw] category: "OpenClaw",
apps/web/src/app/api/jarvis/command/route.ts:82 | [openclaw] backendAction: "openclaw_grip_check"
apps/web/src/app/api/jarvis/command/route.ts:178 | [command boundary] ? "Jarvis command was handed to the backend command boundary. Evidence must be recorded by the backend/Truth Vault layer."
apps/web/src/app/api/jarvis/postgresql/route.ts:40 | [OpenClaw] openclawIsGatewayOnly: true,
apps/web/src/app/api/jarvis/postgresql/route.ts:40 | [openclaw] openclawIsGatewayOnly: true,
apps/web/src/app/api/jarvis/postgresql/route.ts:40 | [gateway] openclawIsGatewayOnly: true,
apps/web/src/app/api/jarvis/status/route.ts:17 | [OpenClaw] { id: "OPENCLAW_GRIP_CHECK", title: "OpenClaw grip check", description: "Requests a backend-led operator grip check without giving OpenClaw direct production authority.", category: "OpenClaw", risk: "SAFE_READ" }
apps/web/src/app/api/jarvis/status/route.ts:17 | [openclaw] { id: "OPENCLAW_GRIP_CHECK", title: "OpenClaw grip check", description: "Requests a backend-led operator grip check without giving OpenClaw direct production authority.", category: "OpenClaw", risk: "SAFE_READ" }
apps/web/src/app/api/jarvis/status/route.ts:107 | [policy gate] "Risky actions require policy gates and founder approval."
apps/web/src/app/api/jarvis/v5/script-library/route.ts:15 | [OpenClaw] ['12', 'When the Commander Asks About OpenClaw', 'openclaw_gateway'],
apps/web/src/app/api/jarvis/v5/script-library/route.ts:49 | [OpenClaw] openclawGatewayOnly: true,
apps/web/src/app/api/jarvis/v5/script-library/route.ts:15 | [openclaw] ['12', 'When the Commander Asks About OpenClaw', 'openclaw_gateway'],
apps/web/src/app/api/jarvis/v5/script-library/route.ts:49 | [openclaw] openclawGatewayOnly: true,
apps/web/src/app/api/jarvis/v5/script-library/route.ts:15 | [gateway] ['12', 'When the Commander Asks About OpenClaw', 'openclaw_gateway'],
apps/web/src/app/api/jarvis/v5/script-library/route.ts:49 | [gateway] openclawGatewayOnly: true,
apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts:177 | [command boundary] safeNotice: "Free Destiny Map intake is routed through the backend API command boundary only. The web route performs no local file writes, shell execution, direct database access, payment, email, document upload, or official application submission.",
apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts:179 | [command boundary] ? "Backend command boundary accepted the Free Destiny Map intake."
apps/web/src/app/candidate/messages/page.tsx:19 | [evidence ledger] <p>Every message requires a message evidence ledger record.</p>
apps/web/src/app/founder/launch-control/jarvis-ai-email-provider-proof/page.tsx:7 | [policy gate] detail: "Needs backend-controlled live provider call, provider/model selection, key outside Git, policy gate, cost boundary, and redacted evidence."
apps/web/src/app/founder/launch-control/jarvis-ai-email-provider-proof/page.tsx:12 | [evidence ledger] detail: "Needs provider send proof, delivery or receive evidence, bounce/failed-send handling, opt-out rule, redaction, and message evidence ledger."
apps/web/src/app/founder/launch-control/jarvis-final-source-closeout/page.tsx:8 | [evidence ledger] ["Evidence Ledger", "/founder/proof-centre/jarvis-live-proof-evidence-ledger", "Evidence missing, blocked, rejected, and accepted."],
apps/web/src/app/founder/launch-control/jarvis-live-evidence-acceptance-pack/page.tsx:80 | [evidence ledger] <Link href="/founder/proof-centre/jarvis-live-proof-evidence-ledger" style={{ color: "#9dffcb" }}>Evidence ledger</Link>
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx:3 | [OpenClaw] ["ACCEPTED_PREVIOUS_RUNTIME", "OpenClaw + Playwright", "Accepted previous runtime proofs remain valid only while their boundaries remain locked."],
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx:3 | [openclaw] ["ACCEPTED_PREVIOUS_RUNTIME", "OpenClaw + Playwright", "Accepted previous runtime proofs remain valid only while their boundaries remain locked."],
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx:6 | [evidence ledger] ["PENDING_EVIDENCE", "Email Primary", "Requires send, delivery/receive, bounce, opt-out, redaction, and evidence ledger."],
apps/web/src/app/founder/launch-control/jarvis-live-proof-queue/page.tsx:24 | [evidence ledger] detail: "Requires send, bounce, opt-out, redaction, and evidence ledger proof."
apps/web/src/app/founder/launch-control/jarvis-payfast-itn-proof/page.tsx:12 | [evidence ledger] detail: "Checkout must be backend-created, linked to a finance/order record, and captured in the evidence ledger."
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [OpenClaw] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [openclaw] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/launch-control/jarvis/page.tsx:9 | [evidence ledger] ["PENDING_CREDENTIALS", "Email Provider Proof", "Needs send, receive, bounce, opt-out, redaction, and evidence ledger proof."],
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:3 | [OpenClaw] ["openclaw-evidence", "ACCEPTED_PREVIOUSLY", "OpenClaw Operator Policy Evidence", "Operator-only proof already captured."],
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:3 | [openclaw] ["openclaw-evidence", "ACCEPTED_PREVIOUSLY", "OpenClaw Operator Policy Evidence", "Operator-only proof already captured."],
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:20 | [evidence ledger] <p style={labelStyle}>Kingsmen Jarvis · Live proof evidence ledger</p>
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:23 | [evidence ledger] This page shows the live proof evidence ledger without storing or exposing secrets. Missing runtime/provider/security evidence keeps Jarvis blocked from public launch. Accepted evidence must be redacted, policy-gated, and attached to the proof pack.
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:3 | [operator policy] ["openclaw-evidence", "ACCEPTED_PREVIOUSLY", "OpenClaw Operator Policy Evidence", "Operator-only proof already captured."],
apps/web/src/app/founder/providers/jarvis-credentials/page.tsx:27 | [evidence ledger] detail: "Email remains the primary tracked communication channel with evidence ledger.",
apps/web/src/app/founder/providers/page.tsx:8 | [OpenClaw] ["OpenClaw/Jarvis", "founder command inspiration", "sandbox/research only"]
apps/web/src/app/founder/providers/page.tsx:8 | [openclaw] ["OpenClaw/Jarvis", "founder command inspiration", "sandbox/research only"]
apps/web/src/app/jarvis/JarvisHudClient.tsx:48 | [OpenClaw] "OPENCLAW_GRIP_CHECK",
apps/web/src/app/jarvis/JarvisHudClient.tsx:208 | [OpenClaw] Founder command cockpit. Live system truth, safe command execution, OpenClaw grip checks,
apps/web/src/app/jarvis/JarvisHudClient.tsx:298 | [OpenClaw] <div className={styles.panelTitle}>OpenClaw / Visual Feed</div>
apps/web/src/app/jarvis/JarvisHudClient.tsx:311 | [OpenClaw] <button className={styles.fullButton} type="button" onClick={() => runCommand("OPENCLAW_GRIP_CHECK")} disabled={running !== null}>
apps/web/src/app/jarvis/JarvisHudClient.tsx:312 | [OpenClaw] RUN OPENCLAW GRIP CHECK
apps/web/src/app/jarvis/JarvisHudClient.tsx:329 | [OpenClaw] <details key={category} open={category === "System" || category === "OpenClaw"}>
apps/web/src/app/jarvis/JarvisHudClient.tsx:48 | [openclaw] "OPENCLAW_GRIP_CHECK",
apps/web/src/app/jarvis/JarvisHudClient.tsx:208 | [openclaw] Founder command cockpit. Live system truth, safe command execution, OpenClaw grip checks,
apps/web/src/app/jarvis/JarvisHudClient.tsx:298 | [openclaw] <div className={styles.panelTitle}>OpenClaw / Visual Feed</div>
apps/web/src/app/jarvis/JarvisHudClient.tsx:311 | [openclaw] <button className={styles.fullButton} type="button" onClick={() => runCommand("OPENCLAW_GRIP_CHECK")} disabled={running !== null}>
apps/web/src/app/jarvis/JarvisHudClient.tsx:312 | [openclaw] RUN OPENCLAW GRIP CHECK
apps/web/src/app/jarvis/JarvisHudClient.tsx:329 | [openclaw] <details key={category} open={category === "System" || category === "OpenClaw"}>
apps/web/src/app/jarvis/JarvisHudClient.tsx:327 | [command registry] <div className={styles.panelTitle}>Command Registry</div>
apps/web/src/app/jarvis/components/JarvisPayFastPaymentPanel.tsx:40 | [evidence ledger] Provider confirmation, backend payment state, and evidence ledger proof are required before paid execution unlocks.
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx:15 | [OpenClaw] ['12', 'OpenClaw', 'openclaw_gateway'],
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx:15 | [openclaw] ['12', 'OpenClaw', 'openclaw_gateway'],
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx:15 | [gateway] ['12', 'OpenClaw', 'openclaw_gateway'],
apps/web/src/app/jarvis/page.tsx:42 | [policy gate] "- Provider tools need explicit adapters, credentials, policy gates, and evidence logs before I can operate them.",
apps/web/src/app/jarvis/page.tsx:75 | [policy gate] "5. Only promote provider actions after credentials, adapters, policy gates, and proof logs exist."
apps/web/src/app/personal-job-desk/real-use-gate/RealUseGateClient.tsx:83 | [evidence ledger] title: "Manual Submission Evidence Ledger",
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:577 | [evidence ledger] Export Evidence Ledger JSON
apps/web/src/communications/CommunicationRuntimePanel.tsx:10 | [evidence ledger] "Message Evidence Ledger"
apps/web/src/founder/FounderControlPlane.tsx:16 | [OpenClaw] This screen shows the whole Kingsmen system, not only PayFast: N00-N20 modules, Jarvis routing, OpenClaw/operator queues, finance, documents, communications, opportunities, incidents, and launch blockers.
apps/web/src/founder/FounderControlPlane.tsx:58 | [OpenClaw] <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">OpenClaw role: {model.authority.openclawRole}</div>
apps/web/src/founder/FounderControlPlane.tsx:16 | [openclaw] This screen shows the whole Kingsmen system, not only PayFast: N00-N20 modules, Jarvis routing, OpenClaw/operator queues, finance, documents, communications, opportunities, incidents, and launch blockers.
apps/web/src/founder/FounderControlPlane.tsx:58 | [openclaw] <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">OpenClaw role: {model.authority.openclawRole}</div>
apps/web/src/founder/founder-control-plane-client.ts:37 | [OpenClaw] openclawRole: string;
apps/web/src/founder/founder-control-plane-client.ts:67 | [OpenClaw] openclawRole: "operator_worker_requires_policy_and_evidence",
apps/web/src/founder/founder-control-plane-client.ts:81 | [OpenClaw] { moduleCode: "N16", name: "Execution Orchestrator and Workers", proofStatus: "STAGING_PROOF_REQUIRED", owner: "OPENCLAW_OPERATOR", validatorCommand: "npm run staging:validate:pack", reportPath: "reports/staging/staging-runtime-proof-pack-latest.json", blockers: ["forced portal automation", "no MAP fallback"] },
apps/web/src/founder/founder-control-plane-client.ts:37 | [openclaw] openclawRole: string;
apps/web/src/founder/founder-control-plane-client.ts:67 | [openclaw] openclawRole: "operator_worker_requires_policy_and_evidence",
apps/web/src/founder/founder-control-plane-client.ts:81 | [openclaw] { moduleCode: "N16", name: "Execution Orchestrator and Workers", proofStatus: "STAGING_PROOF_REQUIRED", owner: "OPENCLAW_OPERATOR", validatorCommand: "npm run staging:validate:pack", reportPath: "reports/staging/staging-runtime-proof-pack-latest.json", blockers: ["forced portal automation", "no MAP fallback"] },
apps/web/src/governance/GovernanceRuntimePanel.tsx:14 | [policy gate] <h2 className="mt-2 text-3xl font-black text-slate-950">Policy gates before dangerous actions</h2>
apps/web/src/governance/PolicyGatePanel.tsx:4 | [policy gate] <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy Gates</p>
apps/web/src/governance/PolicyGatePanel.tsx:7 | [policy gate] Every risky action is evaluated against a policy gate before execution. Blocked and review-required decisions carry reasons, evidence references, and audit trails.
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:12 | [evidence ledger] evidence_ledger: { connectorId: 'evidence_ledger', label: 'Evidence Ledger', adapterId: 'evidence_pack_adapter', readOnly: false, liveData: false, requiresSourceConfidence: false, requiresEvidence: true, defaultFailure: 'Evidence check needed.' },
apps/web/src/lib/jarvis/runtime/smoke-tests.ts:36 | [command registry] input: 'What is the Kingsmen Jarvis command registry?',
config/jarvis/jarvis-command-profile.json:54 | [OpenClaw] "full_personal_assistance_response": "Welcome to Kingsmen Command, Commander. Jarvis is online. Today is {{day}}, {{date}}. The local time is {{time}} in {{location}}. Current conditions are {{weather}}. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction."
config/jarvis/jarvis-command-profile.json:138 | [OpenClaw] "openclaw": "controlled multi-agent gateway",
config/jarvis/jarvis-command-profile.json:54 | [openclaw] "full_personal_assistance_response": "Welcome to Kingsmen Command, Commander. Jarvis is online. Today is {{day}}, {{date}}. The local time is {{time}} in {{location}}. Current conditions are {{weather}}. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction."
config/jarvis/jarvis-command-profile.json:138 | [openclaw] "openclaw": "controlled multi-agent gateway",
config/jarvis/jarvis-command-profile.json:138 | [gateway] "openclaw": "controlled multi-agent gateway",
config/providers/provider-registry.json:417 | [evidence ledger] "safeFallback": "Use verified official link, route checklist, proof-upload instruction, and MAP evidence ledger."
db/seeds/n12_governance_policy_seed.sql:19 | [approval boundary] ('POL-SUBMISSION-001','SUBMISSION','Official submission approval boundary','v1','REVIEW_REQUIRED','ACTIVE','Official submissions require permitted state, evidence, source confidence, and human/operator approval where required.',true,true),
db/seeds/n12_governance_policy_seed.sql:20 | [approval boundary] ('POL-REFUND-001','FINANCE_REFUND','Refund approval boundary','v1','REVIEW_REQUIRED','ACTIVE','Refund decisions require finance boundary, policy evidence, payment evidence, and human/operator approval.',true,true),
db/seeds/n14_integrations_seed.sql:4 | [gateway] ('n8n_worker_gateway','n8n Worker Gateway','N8N','WORKER',false,true,'N8N_WEBHOOK_SECRET','N8N_BASE_URL','Stateless thin workers only.'),
db/seeds/n14_integrations_seed.sql:5 | [gateway] ('airtable_mirror_gateway','Airtable Mirror Gateway','AIRTABLE','MIRROR',false,true,'AIRTABLE_TOKEN','AIRTABLE_BASE_REGISTRY','Mirror only, PostgreSQL wins.'),
db/seeds/n14_integrations_seed.sql:7 | [gateway] ('payfast_itn_gateway','PayFast ITN Gateway','PAYFAST','PAYMENT_PROVIDER',false,true,'PAYFAST_PASSPHRASE','PAYFAST_ITN_URL','Payment evidence only; refunds require governance.'),
db/seeds/n14_integrations_seed.sql:8 | [gateway] ('email_delivery_gateway','Email Delivery Gateway','EMAIL','COMMUNICATION_PROVIDER',false,true,'EMAIL_PROVIDER_SECRET','EMAIL_PROVIDER_ENDPOINT','Email primary communications connector.'),
db/seeds/n14_integrations_seed.sql:9 | [gateway] ('whatsapp_urgent_gateway','WhatsApp Urgent Gateway','WHATSAPP','COMMUNICATION_PROVIDER',false,true,'WHATSAPP_PROVIDER_SECRET','WHATSAPP_PROVIDER_ENDPOINT','WhatsApp urgent-only connector.')
db/seeds/n14_integrations_seed.sql:15 | [gateway] ('W00','Template Registry','SAME','n8n_worker_gateway',false,true,true,1,1,'Same-state template registry.'),
db/seeds/n14_integrations_seed.sql:16 | [gateway] ('W01','Kingsmen Intake Web','EVALUATION_PENDING','n8n_worker_gateway',false,false,true,1,1,'Intake duplicate gate, claim, commit, heartbeat.'),
db/seeds/n14_integrations_seed.sql:17 | [gateway] ('W02','MSB Evaluate','DOCUMENT_PENDING','n8n_worker_gateway',false,false,true,1,1,'Evaluation worker.'),
db/seeds/n14_integrations_seed.sql:18 | [gateway] ('W03','MSB Execute','COMPLETED','n8n_worker_gateway',false,false,true,1,1,'Execution worker; no portal bypass.'),
db/seeds/n14_integrations_seed.sql:19 | [gateway] ('W04','MSB Govern','SAME','n8n_worker_gateway',false,true,true,1,1,'Same-state governance worker.'),
db/seeds/n14_integrations_seed.sql:21 | [gateway] ('W06','MSB Defer','DOCUMENT_PENDING','n8n_worker_gateway',false,false,true,1,1,'Defer worker.'),
db/seeds/n14_integrations_seed.sql:22 | [gateway] ('W07','Document Uploaded','EXECUTION_PENDING','n8n_worker_gateway',false,false,true,1,1,'Document readiness worker.'),
db/seeds/n14_integrations_seed.sql:23 | [gateway] ('W08','MSB Status','SAME','n8n_worker_gateway',false,true,true,1,1,'Same-state status worker.'),
db/seeds/n14_integrations_seed.sql:24 | [gateway] ('W09','Comms Inbound','SAME','email_delivery_gateway',false,true,true,1,1,'Inbound communications worker.'),
db/seeds/n14_integrations_seed.sql:25 | [gateway] ('W10','MSB Fee','EXECUTION_PENDING','payfast_itn_gateway',false,false,true,1,1,'Payment evidence worker.'),
db/seeds/n14_integrations_seed.sql:26 | [gateway] ('W11','MSB Content','DOCUMENT_PENDING','n8n_worker_gateway',false,false,true,1,1,'Content/document worker.'),
db/seeds/n14_integrations_seed.sql:27 | [gateway] ('W12','Outreach Inbound','INTAKE_PENDING','n8n_worker_gateway',false,false,true,1,1,'Outreach-to-intake worker.'),
db/seeds/n14_integrations_seed.sql:28 | [gateway] ('W13','Social Generate','SAME','n8n_worker_gateway',false,true,true,1,1,'Social same-state worker.'),
db/seeds/n14_integrations_seed.sql:29 | [gateway] ('W14','Analytics Request','SAME','n8n_worker_gateway',false,true,true,1,1,'Analytics same-state worker.'),
db/seeds/n14_integrations_seed.sql:30 | [gateway] ('W15','System Insight Generator','SAME','n8n_worker_gateway',false,true,true,1,1,'W15 insight suggests; governance decides.'),
db/seeds/n14_integrations_seed.sql:31 | [gateway] ('W16','Sovereign Kernel','SAME','n8n_worker_gateway',false,true,true,1,1,'Kernel same-state worker.'),
db/seeds/n14_integrations_seed.sql:32 | [gateway] ('W17','Sovereign Kernel v2','SAME','n8n_worker_gateway',false,true,true,1,1,'W24 routes through W17.'),
db/seeds/n14_integrations_seed.sql:33 | [gateway] ('W24','W24 Command','SAME','n8n_worker_gateway',false,true,true,1,1,'W24 -> W17 -> worker -> /workflow/result.')
db/seeds/n20_final_assembly_seed.sql:170 | [evidence ledger] '["Do not mark payment successful","Check PayFast ITN/evidence ledger","Request proof if needed","Create finance review item","Founder approves final correction"]'::jsonb,
docs/N00-doctrine/jarvis-app-connector-law.md:248 | [approval boundary] ## 7. Production Approval Boundary
docs/N00-doctrine/jarvis-app-connector-law.md:313 | [approval boundary] 7. Production approval boundary
docs/agents/KINGSMEN_AGENT_SYSTEM.md:8 | [OpenClaw] AGENTS-01 turns the OpenClaw/Jarvis idea into a safe Kingsmen agent system.
docs/agents/KINGSMEN_AGENT_SYSTEM.md:8 | [openclaw] AGENTS-01 turns the OpenClaw/Jarvis idea into a safe Kingsmen agent system.
docs/agents/KINGSMEN_AGENT_SYSTEM.md:127 | [command boundary] AGENTS-01 is a permission and command boundary.
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:42 | [OpenClaw] | OpenClaw Mission Control | Mission board, approvals, audit timeline, gateway control | High as Control Plane pattern |
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:42 | [openclaw] | OpenClaw Mission Control | Mission board, approvals, audit timeline, gateway control | High as Control Plane pattern |
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:58 | [policy gate] D --> E[Kingsmen Policy Gate]
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:59 | [tool router] E --> F[Tool Router]
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:354 | [tool router] - tool router,
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:67 | [evidence ledger] G --> N[Evidence Ledger]
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:336 | [evidence ledger] - evidence ledger,
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:42 | [gateway] | OpenClaw Mission Control | Mission board, approvals, audit timeline, gateway control | High as Control Plane pattern |
docs/agents/KINGSMEN_REAL_JARVIS_OPERATING_MASTERPLAN.md:332 | [gateway] - upload gateway,
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md:1 | [OpenClaw] # Kingsmen OpenClaw Boundary
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md:5 | [OpenClaw] OpenClaw may be used as inspiration/tooling for a Founder Command Agent.
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md:1 | [openclaw] # Kingsmen OpenClaw Boundary
docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md:5 | [openclaw] OpenClaw may be used as inspiration/tooling for a Founder Command Agent.
docs/agents/PJ42_10_JARVIS_VOICE_READY_COMMANDER_INTERFACE.md:13 | [command registry] Voice is an input and output surface. It is not a shortcut around approval, evidence, source confidence, privacy, or the command registry.
docs/agents/PJ42_10_JARVIS_VOICE_READY_COMMANDER_INTERFACE.md:24 | [command registry] -> Command Registry
docs/agents/PJ42_10_JARVIS_VOICE_READY_COMMANDER_INTERFACE.md:25 | [policy gate] -> Policy Gate
docs/agents/PJ42_10_JARVIS_VOICE_READY_COMMANDER_INTERFACE.md:26 | [tool router] -> Tool Router
docs/agents/PJ42_1_JARVIS_LAW_FILES.md:79 | [OpenClaw] Public Jarvis, Hermes, OpenClaw, Browser Use, AgentQL, HyperAgent, Magnitude, LangGraph, CrewAI, or any other external framework may inspire Kingsmen only below Kingsmen law.
docs/agents/PJ42_1_JARVIS_LAW_FILES.md:79 | [openclaw] Public Jarvis, Hermes, OpenClaw, Browser Use, AgentQL, HyperAgent, Magnitude, LangGraph, CrewAI, or any other external framework may inspire Kingsmen only below Kingsmen law.
docs/agents/PJ42_1_JARVIS_LAW_FILES.md:70 | [command registry] - command registry schema exists,
docs/agents/PJ42_1_JARVIS_LAW_FILES.md:20 | [policy gate] -> Kingsmen Policy Gate
docs/agents/PJ42_1_JARVIS_LAW_FILES.md:21 | [tool router] -> Tool Router
docs/agents/PJ42_1_JARVIS_LAW_FILES.md:22 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ42_2_JARVIS_COMMAND_REGISTRY.md:1 | [command registry] # PJ42.2 — Jarvis Command Registry
docs/agents/PJ42_2_JARVIS_COMMAND_REGISTRY.md:9 | [command registry] PJ42.2 creates the command registry that turns Jarvis from a loose assistant into a governed Kingsmen command brain.
docs/agents/PJ42_2_JARVIS_COMMAND_REGISTRY.md:40 | [command registry] -> Command Registry Lookup
docs/agents/PJ42_2_JARVIS_COMMAND_REGISTRY.md:105 | [command registry] Every future Jarvis tool must first become a command registry entry.
docs/agents/PJ42_2_JARVIS_COMMAND_REGISTRY.md:41 | [policy gate] -> Kingsmen Policy Gate
docs/agents/PJ42_2_JARVIS_COMMAND_REGISTRY.md:43 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ42_3_JARVIS_INTENT_ROUTER.md:4 | [command registry] Parent: PJ42.2 — Jarvis Command Registry
docs/agents/PJ42_3_JARVIS_INTENT_ROUTER.md:24 | [command registry] -> Command Registry
docs/agents/PJ42_3_JARVIS_INTENT_ROUTER.md:23 | [policy gate] -> Policy Gate
docs/agents/PJ42_3_JARVIS_INTENT_ROUTER.md:36 | [policy gate] Private/system/write/action intent = policy gate before any tool call.
docs/agents/PJ42_3_JARVIS_INTENT_ROUTER.md:25 | [tool router] -> Tool Router
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:18 | [command registry] -> Command Registry Lookup
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:19 | [policy gate] -> Kingsmen Policy Gate
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:1 | [tool router] # PJ42.4 — Jarvis Tool Router
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:9 | [tool router] PJ42.4 creates the Tool Router layer that connects approved Jarvis commands to approved adapters.
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:11 | [tool router] The Tool Router is not a random tool-calling engine. It is the controlled gate between Jarvis reasoning and real system capability.
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:20 | [tool router] -> Tool Router
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:38 | [tool router] ## Tool Router Responsibilities
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:40 | [tool router] The Tool Router must decide:
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:95 | [tool router] The Tool Router makes Jarvis useful without making Jarvis dangerous.
docs/agents/PJ42_4_JARVIS_TOOL_ROUTER.md:22 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ42_5_JARVIS_SOURCE_CONFIDENCE_ENGINE.md:4 | [tool router] Parent: PJ42.4 — Jarvis Tool Router
docs/agents/PJ42_6_JARVIS_KNOWLEDGE_BRAIN.md:26 | [command registry] -> Command Registry
docs/agents/PJ42_6_JARVIS_KNOWLEDGE_BRAIN.md:27 | [policy gate] -> Policy Gate
docs/agents/PJ42_6_JARVIS_KNOWLEDGE_BRAIN.md:28 | [tool router] -> Tool Router
docs/agents/PJ42_6_JARVIS_KNOWLEDGE_BRAIN.md:31 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ42_7_JARVIS_LIVE_DATA_ROUTER.md:33 | [command registry] -> Command Registry
docs/agents/PJ42_7_JARVIS_LIVE_DATA_ROUTER.md:34 | [policy gate] -> Policy Gate
docs/agents/PJ42_7_JARVIS_LIVE_DATA_ROUTER.md:35 | [tool router] -> Tool Router
docs/agents/PJ42_7_JARVIS_LIVE_DATA_ROUTER.md:39 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ42_9_JARVIS_APPROVAL_EVIDENCE_LAYER.md:30 | [command registry] -> Command Registry
docs/agents/PJ42_9_JARVIS_APPROVAL_EVIDENCE_LAYER.md:31 | [policy gate] -> Policy Gate
docs/agents/PJ42_9_JARVIS_APPROVAL_EVIDENCE_LAYER.md:32 | [tool router] -> Tool Router
docs/agents/PJ42_9_JARVIS_APPROVAL_EVIDENCE_LAYER.md:35 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ42_CLOSEOUT_REAL_JARVIS_KERNEL_ASSEMBLY_PLAN.md:18 | [command registry] -> Command Registry
docs/agents/PJ42_CLOSEOUT_REAL_JARVIS_KERNEL_ASSEMBLY_PLAN.md:32 | [command registry] - PJ42.2 Jarvis Command Registry
docs/agents/PJ42_CLOSEOUT_REAL_JARVIS_KERNEL_ASSEMBLY_PLAN.md:59 | [command registry] - load command registry,
docs/agents/PJ42_CLOSEOUT_REAL_JARVIS_KERNEL_ASSEMBLY_PLAN.md:19 | [policy gate] -> Kingsmen Policy Gate
docs/agents/PJ42_CLOSEOUT_REAL_JARVIS_KERNEL_ASSEMBLY_PLAN.md:20 | [tool router] -> Tool Router
docs/agents/PJ42_CLOSEOUT_REAL_JARVIS_KERNEL_ASSEMBLY_PLAN.md:34 | [tool router] - PJ42.4 Tool Router
docs/agents/PJ42_CLOSEOUT_REAL_JARVIS_KERNEL_ASSEMBLY_PLAN.md:23 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:18 | [command registry] -> Command Registry Runtime
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:48 | [command registry] - command registry lookup,
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:66 | [command registry] Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger.
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:19 | [policy gate] -> Policy Gate Runtime
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:36 | [policy gate] - policy gate,
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:66 | [policy gate] Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger.
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:20 | [tool router] -> Tool Router Runtime
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:66 | [tool router] Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger.
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:22 | [evidence ledger] -> Evidence Ledger Runtime
docs/agents/PJ43_JARVIS_RUNTIME_IMPLEMENTATION.md:66 | [evidence ledger] Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger.
docs/agents/PJ47_JARVIS_TOOL_ADAPTERS_LIVE_CONNECTORS.md:30 | [command registry] -> Command Registry
docs/agents/PJ47_JARVIS_TOOL_ADAPTERS_LIVE_CONNECTORS.md:31 | [policy gate] -> Policy Gate
docs/agents/PJ47_JARVIS_TOOL_ADAPTERS_LIVE_CONNECTORS.md:62 | [policy gate] - the policy gate allows the action,
docs/agents/PJ47_JARVIS_TOOL_ADAPTERS_LIVE_CONNECTORS.md:32 | [tool router] -> Tool Router / Adapter Selector
docs/agents/PJ47_JARVIS_TOOL_ADAPTERS_LIVE_CONNECTORS.md:35 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ47_JARVIS_TOOL_ADAPTERS_LIVE_CONNECTORS.md:51 | [evidence ledger] - evidence ledger,
docs/agents/PJ48_JARVIS_MEMORY_VAULT.md:67 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ49_JARVIS_AGENT_ORCHESTRATOR.md:22 | [command registry] - Command Registry
docs/agents/PJ49_JARVIS_AGENT_ORCHESTRATOR.md:53 | [command registry] - bypass command registry,
docs/agents/PJ49_JARVIS_AGENT_ORCHESTRATOR.md:23 | [policy gate] - Policy Gate
docs/agents/PJ49_JARVIS_AGENT_ORCHESTRATOR.md:52 | [policy gate] - bypass policy gate,
docs/agents/PJ49_JARVIS_AGENT_ORCHESTRATOR.md:24 | [tool router] - Tool Router or Adapter Selector
docs/agents/PJ49_JARVIS_AGENT_ORCHESTRATOR.md:29 | [evidence ledger] - Evidence Ledger
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:24 | [command registry] -> Command Registry
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:52 | [command registry] - Command Registry
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:25 | [policy gate] -> Policy Gate
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:53 | [policy gate] - Policy Gate
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:26 | [tool router] -> Adapter Selector / Tool Router
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:54 | [tool router] - Tool Router / Adapter Selector
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:29 | [evidence ledger] -> Evidence Ledger
docs/agents/PJ52_JARVIS_INTEGRATION_HARDENING.md:56 | [evidence ledger] - Evidence Ledger
docs/agents/PJ55_JARVIS_FINAL_RUNTIME_CLOSEOUT.md:37 | [command registry] -> Command Registry
docs/agents/PJ55_JARVIS_FINAL_RUNTIME_CLOSEOUT.md:51 | [command registry] - command registry,
docs/agents/PJ55_JARVIS_FINAL_RUNTIME_CLOSEOUT.md:38 | [policy gate] -> Policy Gate
docs/constitution/reality-trained-kingsmen-constitution.md:11 | [OpenClaw] Kingsmen must not be narrowed to only a website, university applications, accommodation, CV writing, jobs, OpenClaw, Playwright, n8n, Airtable, or social media. Those are parts of the system, not the system.
docs/constitution/reality-trained-kingsmen-constitution.md:15 | [OpenClaw] ChatGPT designs. GitHub preserves. PowerShell Creator materializes. Validators prove. Reports explain. Control Plane governs. PostgreSQL stores truth. Oracle Lite runs the first constrained deployment. OpenClaw may assist later as a governed operator gateway.
docs/constitution/reality-trained-kingsmen-constitution.md:39 | [OpenClaw] Oracle Free / Oracle Lite is the default deployment constraint. The first production architecture must prefer Docker Compose, low concurrency, PostgreSQL truth, Redis queue discipline, Nginx, log pruning, backups, email-first communication, limited Playwright, OpenClaw sandboxing, and cost-aware scheduling.
docs/constitution/reality-trained-kingsmen-constitution.md:81 | [OpenClaw] ## 10. OpenClaw law
docs/constitution/reality-trained-kingsmen-constitution.md:83 | [OpenClaw] OpenClaw is a governed remote operator gateway, not the Kingsmen brain. It may read reports, run safe validators, draft GitHub issues, summarize source leads, check Oracle health, and prepare founder action packets. It must not access raw secrets, raw candidate documents by default, production database writes, real unapproved messages, payments/refunds, pricing changes, cap increases, production deploys, or CAPTCHA/OTP bypass.
docs/constitution/reality-trained-kingsmen-constitution.md:11 | [openclaw] Kingsmen must not be narrowed to only a website, university applications, accommodation, CV writing, jobs, OpenClaw, Playwright, n8n, Airtable, or social media. Those are parts of the system, not the system.
docs/constitution/reality-trained-kingsmen-constitution.md:15 | [openclaw] ChatGPT designs. GitHub preserves. PowerShell Creator materializes. Validators prove. Reports explain. Control Plane governs. PostgreSQL stores truth. Oracle Lite runs the first constrained deployment. OpenClaw may assist later as a governed operator gateway.
docs/constitution/reality-trained-kingsmen-constitution.md:39 | [openclaw] Oracle Free / Oracle Lite is the default deployment constraint. The first production architecture must prefer Docker Compose, low concurrency, PostgreSQL truth, Redis queue discipline, Nginx, log pruning, backups, email-first communication, limited Playwright, OpenClaw sandboxing, and cost-aware scheduling.
docs/constitution/reality-trained-kingsmen-constitution.md:81 | [openclaw] ## 10. OpenClaw law
docs/constitution/reality-trained-kingsmen-constitution.md:83 | [openclaw] OpenClaw is a governed remote operator gateway, not the Kingsmen brain. It may read reports, run safe validators, draft GitHub issues, summarize source leads, check Oracle health, and prepare founder action packets. It must not access raw secrets, raw candidate documents by default, production database writes, real unapproved messages, payments/refunds, pricing changes, cap increases, production deploys, or CAPTCHA/OTP bypass.
docs/constitution/reality-trained-kingsmen-constitution.md:15 | [gateway] ChatGPT designs. GitHub preserves. PowerShell Creator materializes. Validators prove. Reports explain. Control Plane governs. PostgreSQL stores truth. Oracle Lite runs the first constrained deployment. OpenClaw may assist later as a governed operator gateway.
docs/constitution/reality-trained-kingsmen-constitution.md:83 | [gateway] OpenClaw is a governed remote operator gateway, not the Kingsmen brain. It may read reports, run safe validators, draft GitHub issues, summarize source leads, check Oracle health, and prepare founder action packets. It must not access raw secrets, raw candidate documents by default, production database writes, real unapproved messages, payments/refunds, pricing changes, cap increases, production deploys, or CAPTCHA/OTP bypass.
docs/finance/KINGSMEN_PAYFAST_SERVER_MOUNT_AND_PERSISTENCE.md:36 | [evidence ledger] - Accepted ITN updates the PayFast intent, order, invoice, payment record, evidence ledger, and finance ledger.
docs/founder/KINGSMEN_FOUNDER_CONTROL_PLANE.md:9 | [OpenClaw] The founder control plane shows the whole Kingsmen operating system in one place: N00-N20 modules, Jarvis routing, OpenClaw/operator queues, PayFast/finance, documents, route universe, communications, opportunity engine, incidents, validator commands, and launch blockers.
docs/founder/KINGSMEN_FOUNDER_CONTROL_PLANE.md:29 | [OpenClaw] - Authority doctrine: backend authority, PostgreSQL truth, Jarvis brain-router, OpenClaw operator, Airtable mirror, n8n thin relay, Playwright scout.
docs/founder/KINGSMEN_FOUNDER_CONTROL_PLANE.md:9 | [openclaw] The founder control plane shows the whole Kingsmen operating system in one place: N00-N20 modules, Jarvis routing, OpenClaw/operator queues, PayFast/finance, documents, route universe, communications, opportunity engine, incidents, validator commands, and launch blockers.
docs/founder/KINGSMEN_FOUNDER_CONTROL_PLANE.md:29 | [openclaw] - Authority doctrine: backend authority, PostgreSQL truth, Jarvis brain-router, OpenClaw operator, Airtable mirror, n8n thin relay, Playwright scout.
docs/jarvis/COMMANDER_REAL_BUILD_INTAKE_2026-06-15.md:30 | [OpenClaw] 16. Jarvis must understand Kingsmen repo status, current gaps, agents, provider gates, OpenJarvis/OpenClaw references, Playwright boundaries, MCP/tool risks, and the no-install-until-vetted rule.
docs/jarvis/COMMANDER_REAL_BUILD_INTAKE_2026-06-15.md:31 | [OpenClaw] 17. Public Jarvis/OpenClaw repos are research-only until vetted.
docs/jarvis/COMMANDER_REAL_BUILD_INTAKE_2026-06-15.md:32 | [OpenClaw] 18. OpenClaw is guarded operator/tool execution, not the Kingsmen brain.
docs/jarvis/COMMANDER_REAL_BUILD_INTAKE_2026-06-15.md:30 | [openclaw] 16. Jarvis must understand Kingsmen repo status, current gaps, agents, provider gates, OpenJarvis/OpenClaw references, Playwright boundaries, MCP/tool risks, and the no-install-until-vetted rule.
docs/jarvis/COMMANDER_REAL_BUILD_INTAKE_2026-06-15.md:31 | [openclaw] 17. Public Jarvis/OpenClaw repos are research-only until vetted.
docs/jarvis/COMMANDER_REAL_BUILD_INTAKE_2026-06-15.md:32 | [openclaw] 18. OpenClaw is guarded operator/tool execution, not the Kingsmen brain.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:36 | [OpenClaw] | OPENCLAW_TASK | Multi-agent or channel routed task | OpenClaw Gateway |
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:140 | [OpenClaw] ## 6. OpenClaw Gateway
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:143 | [OpenClaw] OpenClaw acts as a controlled agent and channel gateway.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:156 | [OpenClaw] - OpenClaw is a gateway, not the final truth source.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:165 | [OpenClaw] > Jarvis, send this to OpenClaw research.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:167 | [OpenClaw] > Jarvis, ask OpenClaw to prepare an intelligence brief.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:171 | [OpenClaw] > Jarvis, check what OpenClaw found and verify it.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:672 | [OpenClaw] > Jarvis, send research to OpenClaw agents.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:36 | [openclaw] | OPENCLAW_TASK | Multi-agent or channel routed task | OpenClaw Gateway |
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:140 | [openclaw] ## 6. OpenClaw Gateway
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:143 | [openclaw] OpenClaw acts as a controlled agent and channel gateway.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:156 | [openclaw] - OpenClaw is a gateway, not the final truth source.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:165 | [openclaw] > Jarvis, send this to OpenClaw research.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:167 | [openclaw] > Jarvis, ask OpenClaw to prepare an intelligence brief.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:171 | [openclaw] > Jarvis, check what OpenClaw found and verify it.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:672 | [openclaw] > Jarvis, send research to OpenClaw agents.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:36 | [gateway] | OPENCLAW_TASK | Multi-agent or channel routed task | OpenClaw Gateway |
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:140 | [gateway] ## 6. OpenClaw Gateway
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:143 | [gateway] OpenClaw acts as a controlled agent and channel gateway.
docs/jarvis/JARVIS_AGENT_TOOL_ROUTING.md:156 | [gateway] - OpenClaw is a gateway, not the final truth source.
docs/jarvis/JARVIS_AI_EMAIL_PROVIDER_LIVE_EVIDENCE_CAPTURE.md:61 | [policy gate] - policy gate applied
docs/jarvis/JARVIS_AI_EMAIL_PROVIDER_LIVE_EVIDENCE_CAPTURE.md:73 | [evidence ledger] - message evidence ledger captured
docs/jarvis/JARVIS_AI_EMAIL_PROVIDER_LIVE_PROOF.md:27 | [policy gate] - Policy gate applies before call.
docs/jarvis/JARVIS_AI_EMAIL_PROVIDER_LIVE_PROOF.md:38 | [evidence ledger] - Message evidence ledger captured.
docs/jarvis/JARVIS_AI_EMAIL_PROVIDER_LIVE_PROOF.md:50 | [evidence ledger] - The message evidence ledger is absent.
docs/jarvis/JARVIS_AI_TOOLS_RUNTIME_READINESS.md:20 | [OpenClaw] - OpenClaw Operator Boundary
docs/jarvis/JARVIS_AI_TOOLS_RUNTIME_READINESS.md:20 | [openclaw] - OpenClaw Operator Boundary
docs/jarvis/JARVIS_COMMAND_STANDARD.md:163 | [OpenClaw] > Welcome to Kingsmen Command, Commander. Jarvis is online. Today is [day], [date]. The local time is [time] in [location]. Current conditions are [weather]. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction.
docs/jarvis/JARVIS_COMMAND_STANDARD.md:261 | [OpenClaw] - OpenClaw
docs/jarvis/JARVIS_COMMAND_STANDARD.md:163 | [openclaw] > Welcome to Kingsmen Command, Commander. Jarvis is online. Today is [day], [date]. The local time is [time] in [location]. Current conditions are [weather]. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction.
docs/jarvis/JARVIS_COMMAND_STANDARD.md:261 | [openclaw] - OpenClaw
docs/jarvis/JARVIS_COMPLETION_BOARD.md:22 | [OpenClaw] - OpenClaw operator policy boundary
docs/jarvis/JARVIS_COMPLETION_BOARD.md:22 | [openclaw] - OpenClaw operator policy boundary
docs/jarvis/JARVIS_COMPLETION_BOARD.md:22 | [operator policy] - OpenClaw operator policy boundary
docs/jarvis/JARVIS_DASHBOARD_COMPLETION_BOARD.md:13 | [OpenClaw] - `/api/jarvis/live-index` for live readiness state, backend storage mode, OpenClaw runtime proof state, and launch gate visibility.
docs/jarvis/JARVIS_DASHBOARD_COMPLETION_BOARD.md:29 | [OpenClaw] - OpenClaw remains operator-only and cannot become production authority.
docs/jarvis/JARVIS_DASHBOARD_COMPLETION_BOARD.md:13 | [openclaw] - `/api/jarvis/live-index` for live readiness state, backend storage mode, OpenClaw runtime proof state, and launch gate visibility.
docs/jarvis/JARVIS_DASHBOARD_COMPLETION_BOARD.md:29 | [openclaw] - OpenClaw remains operator-only and cannot become production authority.
docs/jarvis/JARVIS_FINAL_COMMAND_HUD.md:31 | [OpenClaw] - OpenClaw remains operator-only.
docs/jarvis/JARVIS_FINAL_COMMAND_HUD.md:31 | [openclaw] - OpenClaw remains operator-only.
docs/jarvis/JARVIS_LIVE_PROOF_ACCEPTANCE_GATE.md:24 | [evidence ledger] - Captured in the evidence ledger or proof pack.
docs/jarvis/JARVIS_LIVE_PROOF_EVIDENCE_LEDGER.md:1 | [evidence ledger] # Jarvis Live Proof Evidence Ledger
docs/jarvis/JARVIS_LIVE_PROOF_EVIDENCE_LEDGER.md:9 | [evidence ledger] The Jarvis Live Proof Evidence Ledger defines how remaining live proof is accepted, rejected, missing, or blocked.
docs/jarvis/JARVIS_N8N_THIN_RELAY_BOUNDARY.md:36 | [command boundary] The command must pass through the Jarvis backend command boundary. The web route must never execute local shell, directly write files, directly access PostgreSQL, or call the provider.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:1 | [OpenClaw] # Jarvis OpenClaw Operator Policy Boundary
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:5 | [OpenClaw] Jarvis may coordinate OpenClaw as an operator surface, but OpenClaw is not the final authority. The backend command outbox remains automation authority and PostgreSQL Truth Vault remains system truth.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:9 | [OpenClaw] `/api/jarvis/openclaw-operator-policy-boundary`
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:13 | [OpenClaw] `OPENCLAW_OPERATOR_POLICY_CHECK`
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:19 | [OpenClaw] - OpenClaw operator only.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:22 | [OpenClaw] - OpenClaw may not become authority.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:23 | [OpenClaw] - OpenClaw may not bypass policy.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:24 | [OpenClaw] - OpenClaw may not execute risky actions without founder approval.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:25 | [OpenClaw] - OpenClaw may not write Truth Vault directly.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:26 | [OpenClaw] - OpenClaw may not access raw secrets.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:27 | [OpenClaw] - OpenClaw may not change payments.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:28 | [OpenClaw] - OpenClaw may not submit portals without MAP/Phoenix/manual fallback policy.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:40 | [OpenClaw] npm run jarvis:runtime:openclaw-operator-policy
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:45 | [OpenClaw] `reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json`
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:49 | [OpenClaw] This boundary never marks Kingsmen production-ready or public-launch-ready on its own. It only proves that OpenClaw is governed by backend policy, Truth Vault evidence, and founder approval boundaries.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:1 | [openclaw] # Jarvis OpenClaw Operator Policy Boundary
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:5 | [openclaw] Jarvis may coordinate OpenClaw as an operator surface, but OpenClaw is not the final authority. The backend command outbox remains automation authority and PostgreSQL Truth Vault remains system truth.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:9 | [openclaw] `/api/jarvis/openclaw-operator-policy-boundary`
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:13 | [openclaw] `OPENCLAW_OPERATOR_POLICY_CHECK`
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:19 | [openclaw] - OpenClaw operator only.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:22 | [openclaw] - OpenClaw may not become authority.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:23 | [openclaw] - OpenClaw may not bypass policy.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:24 | [openclaw] - OpenClaw may not execute risky actions without founder approval.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:25 | [openclaw] - OpenClaw may not write Truth Vault directly.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:26 | [openclaw] - OpenClaw may not access raw secrets.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:27 | [openclaw] - OpenClaw may not change payments.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:28 | [openclaw] - OpenClaw may not submit portals without MAP/Phoenix/manual fallback policy.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:40 | [openclaw] npm run jarvis:runtime:openclaw-operator-policy
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:45 | [openclaw] `reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json`
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:49 | [openclaw] This boundary never marks Kingsmen production-ready or public-launch-ready on its own. It only proves that OpenClaw is governed by backend policy, Truth Vault evidence, and founder approval boundaries.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:29 | [evidence ledger] - Operator evidence ledger required.
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:1 | [operator policy] # Jarvis OpenClaw Operator Policy Boundary
docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md:15 | [command boundary] The command must pass through `/api/jarvis/command` and then the backend command boundary. The web route may not execute shell commands, write local files, call providers directly, or write PostgreSQL directly.
docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md:16 | [OpenClaw] - OpenClaw Operator Boundary
docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md:16 | [openclaw] - OpenClaw Operator Boundary
docs/jarvis/JARVIS_SOURCE_COMPLETION_SEAL.md:38 | [OpenClaw] - OpenClaw remains operator-only.
docs/jarvis/JARVIS_SOURCE_COMPLETION_SEAL.md:38 | [openclaw] - OpenClaw remains operator-only.
docs/jarvis/JARVIS_TOOL_STACK_AND_STARTUP_RECORD.md:13 | [OpenClaw] | OpenClaw | Autonomous assistant/runtime that can run tools, files, browser actions, messages | Dangerous unless locked behind Kingsmen policy gates |
docs/jarvis/JARVIS_TOOL_STACK_AND_STARTUP_RECORD.md:26 | [OpenClaw] Commander -> OpenClaw/Hermes directly controlling everything
docs/jarvis/JARVIS_TOOL_STACK_AND_STARTUP_RECORD.md:13 | [openclaw] | OpenClaw | Autonomous assistant/runtime that can run tools, files, browser actions, messages | Dangerous unless locked behind Kingsmen policy gates |
docs/jarvis/JARVIS_TOOL_STACK_AND_STARTUP_RECORD.md:26 | [openclaw] Commander -> OpenClaw/Hermes directly controlling everything
docs/jarvis/JARVIS_TOOL_STACK_AND_STARTUP_RECORD.md:13 | [policy gate] | OpenClaw | Autonomous assistant/runtime that can run tools, files, browser actions, messages | Dangerous unless locked behind Kingsmen policy gates |
docs/jarvis/JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY.md:53 | [evidence ledger] 2. Truth Vault communication evidence ledger entry created;
docs/jarvis/JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY.md:31 | [gateway] This is a `backend_api_only` boundary. Browser routes may not call WhatsApp, Meta, SMS providers, or any messaging gateway directly.
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:14 | [OpenClaw] | OpenClaw | Autonomous assistant/runtime pattern | Dangerous unless locked down; not direct authority |
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:32 | [OpenClaw] -> OpenClaw/Hermes directly controlling Kingsmen
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:119 | [OpenClaw] - OpenClaw/OpenJarvis/Hermes are not granted direct Kingsmen authority.
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:14 | [openclaw] | OpenClaw | Autonomous assistant/runtime pattern | Dangerous unless locked down; not direct authority |
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:32 | [openclaw] -> OpenClaw/Hermes directly controlling Kingsmen
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:119 | [openclaw] - OpenClaw/OpenJarvis/Hermes are not granted direct Kingsmen authority.
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:35 | [command registry] Reason: autonomous agents with filesystem, browser, email, payment, or production access are too risky unless locked behind command registry, policy gate, approvals, and evidence.
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:35 | [policy gate] Reason: autonomous agents with filesystem, browser, email, payment, or production access are too risky unless locked behind command registry, policy gate, approvals, and evidence.
docs/jarvis/JB004_COMBINED_STACK_AND_STARTUP_RECORD.md:25 | [evidence ledger] -> Evidence Ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_03_JOELSHINE_JARVIS_V2.md:195 | [policy gate] -> policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_03_JOELSHINE_JARVIS_V2.md:197 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md:18 | [policy gate] Kingsmen must not copy PocketPaw blindly. Kingsmen must extract the useful design patterns and place them under Kingsmen doctrine, policy gates, evidence ledgers, repository-first building, and founder approval.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md:182 | [policy gate] 2. Any model backend that can execute tools without policy gate review.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md:203 | [policy gate] -> Policy Gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md:255 | [policy gate] 3. Add tool policy gate.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md:18 | [evidence ledger] Kingsmen must not copy PocketPaw blindly. Kingsmen must extract the useful design patterns and place them under Kingsmen doctrine, policy gates, evidence ledgers, repository-first building, and founder approval.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md:98 | [evidence ledger] Every event should be written to the evidence ledger.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_04_POCKETPAW.md:208 | [evidence ledger] -> Evidence Ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:117 | [policy gate] 4. Website/application automation without Kingsmen policy gates
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:123 | [policy gate] Kingsmen rule remains: model output is only a proposal. Policy gate, backend truth, validators, evidence ledger, and founder approval decide.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:164 | [policy gate] -> Doctrine and policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:123 | [evidence ledger] Kingsmen rule remains: model output is only a proposal. Policy gate, backend truth, validators, evidence ledger, and founder approval decide.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:170 | [evidence ledger] -> Evidence ledger records all steps
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:204 | [evidence ledger] - evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_05_GANESHNIKHIL_JARVIS_2.md:202 | [approval boundary] - production approval boundary
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:86 | [command registry] Kingsmen Jarvis must have a controlled command registry, not random natural-language execution only.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:131 | [command registry] The help system must be generated from the command registry so it never lies.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:193 | [command registry] Command Registry + Help + Plugin Utility Layer
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:218 | [command registry] -> Command registry
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:236 | [command registry] ### 7.1 Command Registry Manifest
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:327 | [command registry] Project 6 becomes the Kingsmen Jarvis Command Registry and Safe Plugin Loader lesson.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:142 | [policy gate] Voice commands must go through the same policy gate, approval gate, and evidence ledger as chat commands.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:220 | [policy gate] -> Policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:257 | [policy gate] policy gate rule
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:142 | [evidence ledger] Voice commands must go through the same policy gate, approval gate, and evidence ledger as chat commands.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:173 | [evidence ledger] no evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_06_SUKEESH_JARVIS.md:223 | [evidence ledger] -> Evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:206 | [command registry] -> command registry and plugin discipline
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:219 | [command registry] -> command registry
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:63 | [policy gate] -> apply doctrine/policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:153 | [policy gate] policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:220 | [policy gate] -> doctrine and policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:82 | [evidence ledger] Evidence ledger records result.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:155 | [evidence ledger] evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:224 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_07_KISHANRAJPUT23_DESKTOP_VOICE_ASSISTANT.md:86 | [command boundary] ### 3.3 Local system command boundary
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:171 | [command registry] 3. Command registry
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:72 | [policy gate] 5. Tool use must be routed through policy gates.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:105 | [policy gate] -> doctrine/policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:170 | [policy gate] 2. Doctrine/policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:194 | [policy gate] CyberVerse is useful as a reference for real-time, voice-first, self-hosted digital-agent interaction. Kingsmen should adopt the streaming/presence/session ideas, but must keep all authority inside Kingsmen doctrine, policy gates, backend state machine, PostgreSQL truth, validators, and founder approval.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:73 | [evidence ledger] 6. RAG can help answer from Kingsmen doctrine, repo docs, public sources, and evidence ledgers.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:108 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:173 | [evidence ledger] 5. Evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:84 | [gateway] JarvisVoiceStreamGateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:101 | [gateway] -> realtime session gateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_08_LYNPOINT_CYBERVERSE.md:178 | [gateway] 10. WebRTC/live voice gateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_09_OPENVOICEOS.md:36 | [policy gate] 4. Doctrine and policy gate.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_09_OPENVOICEOS.md:67 | [policy gate] - Voice commands that bypass policy gate.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_09_OPENVOICEOS.md:206 | [policy gate] + Policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_09_OPENVOICEOS.md:144 | [evidence ledger] - evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_09_OPENVOICEOS.md:121 | [approval boundary] 7. Production approval boundary.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:63 | [command registry] -> command registry
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:40 | [policy gate] - policy gate result
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:64 | [policy gate] -> doctrine + policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:99 | [policy gate] Kingsmen truth remains PostgreSQL. Kingsmen control remains backend state machine, policy gate, evidence ledger, validators, and founder approval.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:130 | [policy gate] -> route every command through doctrine and policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:67 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:99 | [evidence ledger] Kingsmen truth remains PostgreSQL. Kingsmen control remains backend state machine, policy gate, evidence ledger, validators, and founder approval.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_10_UNI_CREATOR_DESKTOP_ASSISTANCE.md:131 | [evidence ledger] -> log every action in evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_11_SMALL_CACTUS_MILES.md:117 | [command registry] -> Command Registry
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_11_SMALL_CACTUS_MILES.md:118 | [policy gate] -> Doctrine Policy Gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_11_SMALL_CACTUS_MILES.md:209 | [policy gate] -> doctrine policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_11_SMALL_CACTUS_MILES.md:211 | [tool router] -> approved plugin/tool router
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_11_SMALL_CACTUS_MILES.md:122 | [evidence ledger] -> Evidence Ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_11_SMALL_CACTUS_MILES.md:213 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:196 | [command registry] -> command registry
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:272 | [command registry] 2. Command registry
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:174 | [policy gate] Doctrine and policy gates
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:197 | [policy gate] -> doctrine policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:282 | [policy gate] Do not build unrestricted local control before the policy gate and evidence ledger.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:176 | [evidence ledger] Evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:201 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:279 | [evidence ledger] 9. Evidence ledger enforcement
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_12_GLADIATOR07_JARVIS.md:282 | [evidence ledger] Do not build unrestricted local control before the policy gate and evidence ledger.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:1 | [OpenClaw] # PJ Public Jarvis Study 13 — OpenClaw
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:6 | [OpenClaw] Public reference: openclaw/openclaw
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:12 | [OpenClaw] OpenClaw is a public personal AI assistant project that is closer to a real multi-channel operating assistant than a hobby voice bot.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:29 | [OpenClaw] OpenClaw gives a strong reference for channel routing, session routing, pairing/allowlists, sandboxed sessions, tools, skills, and operator commands.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:35 | [OpenClaw] OpenClaw presents these useful patterns:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:156 | [OpenClaw] OpenClaw is useful, but Kingsmen law remains stronger.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:173 | [OpenClaw] OpenClaw should be used as the Kingsmen reference for:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:191 | [OpenClaw] OpenClaw = multi-channel gateway lesson.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:1 | [openclaw] # PJ Public Jarvis Study 13 — OpenClaw
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:6 | [openclaw] Public reference: openclaw/openclaw
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:12 | [openclaw] OpenClaw is a public personal AI assistant project that is closer to a real multi-channel operating assistant than a hobby voice bot.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:29 | [openclaw] OpenClaw gives a strong reference for channel routing, session routing, pairing/allowlists, sandboxed sessions, tools, skills, and operator commands.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:35 | [openclaw] OpenClaw presents these useful patterns:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:156 | [openclaw] OpenClaw is useful, but Kingsmen law remains stronger.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:173 | [openclaw] OpenClaw should be used as the Kingsmen reference for:
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:191 | [openclaw] OpenClaw = multi-channel gateway lesson.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:164 | [evidence ledger] 5. Evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:14 | [gateway] It describes itself as a personal AI assistant that runs on the user's own devices, responds through many communication channels, supports live visual canvas work, and uses a gateway/control-plane model.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:37 | [gateway] 1. Local-first gateway/control plane
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:49 | [gateway] 13. Gateway doctor / risk checks
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:58 | [gateway] JarvisGateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:105 | [gateway] -> JarvisGateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:139 | [gateway] JarvisGateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_13_OPENCLAW.md:191 | [gateway] OpenClaw = multi-channel gateway lesson.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_14_LEON_AI.md:208 | [evidence ledger] The assistant may propose. Kingsmen doctrine, backend state machine, PostgreSQL truth, validators, evidence ledger, and founder approval decide.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md:55 | [policy gate] -> policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md:58 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_15_HOME_ASSISTANT_ASSIST.md:272 | [evidence ledger] It does not replace Kingsmen backend, PostgreSQL truth, validators, evidence ledger, or founder approval.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_16_OPENHANDS.md:119 | [command registry] manifests/jarvis/                        laws, command registry, tool policies
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_16_OPENHANDS.md:107 | [policy gate] OpenHands-style power is valuable only if it is wrapped by Kingsmen policy gates.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_17_AIDER.md:114 | [policy gate] -> doctrine policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_17_AIDER.md:119 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_17_AIDER.md:153 | [evidence ledger] + evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_17_AIDER.md:121 | [approval boundary] -> approval boundary
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_18_OPEN_INTERPRETER.md:70 | [policy gate] model-driven decisions without policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_19_CLINE.md:62 | [evidence ledger] Cline diffs/checkpoints       -> JarvisChangedFilesReport + evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_19_CLINE.md:122 | [approval boundary] Production-risk actions must always go through the Kingsmen approval boundary and must not be executed only because a coding agent proposed them.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_19_CLINE.md:67 | [gateway] Cline channel connectors      -> JarvisGateway with sender allowlist
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_20_CONTINUE_DEV.md:141 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_21_ROO_CODE.md:87 | [policy gate] 6. MCP/server gateway concept, but only through Kingsmen policy gates.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_21_ROO_CODE.md:38 | [approval boundary] The strongest lesson is that Kingsmen Jarvis must not operate as one giant uncontrolled assistant. It must have separated modes, each with its own authority level, tool access, approval boundary, and evidence requirement.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_21_ROO_CODE.md:51 | [gateway] - JarvisMcpGateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_21_ROO_CODE.md:87 | [gateway] 6. MCP/server gateway concept, but only through Kingsmen policy gates.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_22_SWE_AGENT.md:104 | [evidence ledger] -> trajectory evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_22_SWE_AGENT.md:141 | [evidence ledger] Evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_23_MINI_SWE_AGENT.md:184 | [evidence ledger] + evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_23_MINI_SWE_AGENT.md:217 | [approval boundary] 8. Founder approval boundary
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_25_AUTOGEN.md:47 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_26_SEMANTIC_KERNEL_AGENT_FRAMEWORK.md:40 | [policy gate] -> policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_26_SEMANTIC_KERNEL_AGENT_FRAMEWORK.md:100 | [policy gate] plugins bypassing doctrine policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_26_SEMANTIC_KERNEL_AGENT_FRAMEWORK.md:44 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_26_SEMANTIC_KERNEL_AGENT_FRAMEWORK.md:85 | [gateway] JarvisMcpGateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_27_CREWAI.md:48 | [policy gate] Role-based specialists are useful only when wrapped inside controlled flows, declared tasks, typed outputs, policy gates, validation, and evidence.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_27_CREWAI.md:147 | [policy gate] -> policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_27_CREWAI.md:61 | [evidence ledger] -> evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_27_CREWAI.md:162 | [evidence ledger] 5. Evidence Ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_27_CREWAI.md:117 | [approval boundary] approval boundary
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:301 | [policy gate] Kingsmen Jarvis must not trust MCP servers by default, must not install random tools, and must not allow connector execution outside the doctrine policy gate.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:307 | [policy gate] - connector policy gate
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:104 | [evidence ledger] - requires evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:133 | [evidence ledger] - connector actions without evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:262 | [evidence ledger] evidence ledger
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:9 | [gateway] Kingsmen classification: useful but high-risk connector gateway standard
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:42 | [gateway] The source ecosystem is large and active, but recent public security research also shows that MCP-style tool gateways create serious risks if servers, tool descriptions, permissions, identity, and runtime execution are not governed properly.
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:66 | [gateway] JarvisMcpGateway
docs/jarvis/public-reference-studies/PJ_PUBLIC_JARVIS_28_MCP.md:313 | [gateway] - MCP-style gateway without losing Kingsmen authority
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:315 | [OpenClaw] - OPENCLAW_TASK,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:510 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:315 | [openclaw] - OPENCLAW_TASK,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:510 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:334 | [command registry] → Command Registry
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:28 | [policy gate] - Production completion requires actual code, routes, HUD, voice, database, policy gates, validators, and test evidence.
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:209 | [policy gate] → policy gate checks command
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:264 | [policy gate] - policy gate pending/allowed/blocked,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:335 | [policy gate] → Policy Gate
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:355 | [policy gate] The policy gate must run immediately after command receipt and classification.
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:357 | [policy gate] Policy gate checks:
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:470 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:638 | [policy gate] - policy gate works,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:701 | [policy gate] - Jarvis skips policy gate,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:748 | [policy gate] 6. The policy gate runs before any tool execution.
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:336 | [tool router] → Tool Router
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:338 | [evidence ledger] → Evidence Ledger
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:474 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:639 | [evidence ledger] - evidence ledger writes to database,
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:749 | [evidence ledger] 7. The evidence ledger records a received event.
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:510 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md:512 | [gateway] Not primary for Number 01. It may be routed later only if the command needs agent/channel/tool gateway work.
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:506 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:506 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:454 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:462 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:506 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md:508 | [gateway] Not used for ordinary answering unless a specialised agent/channel gateway is required.
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:490 | [OpenClaw] - remember that OpenClaw is gateway-only.
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:570 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:777 | [OpenClaw] - Jarvis treats OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:490 | [openclaw] - remember that OpenClaw is gateway-only.
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:570 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:777 | [openclaw] - Jarvis treats OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:288 | [policy gate] → policy gate checks risk
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:393 | [policy gate] Policy gate checks:
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:530 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:526 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:490 | [gateway] - remember that OpenClaw is gateway-only.
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:570 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md:572 | [gateway] Used only when current intelligence must be routed through a controlled gateway or external agent route.
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:554 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:554 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:243 | [policy gate] → policy gate checks whether official evidence is required
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:502 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:766 | [policy gate] - Jarvis bypasses policy gate,
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:498 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:556 | [evidence ledger] May route deadline research to agents, but final confidence must return to Jarvis and evidence ledger.
docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md:554 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:461 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:461 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:421 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:417 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md:461 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:528 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:528 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:488 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:484 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:530 | [evidence ledger] May route news research through controlled agents, but final confidence returns to Jarvis and evidence ledger.
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:644 | [evidence ledger] - the evidence ledger stores news checks,
docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md:528 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:541 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:541 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:493 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:489 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:543 | [evidence ledger] May route opportunity research through controlled agents, but final confidence returns to Jarvis and evidence ledger.
docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md:541 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:551 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:551 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:507 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:503 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:665 | [evidence ledger] - business evidence ledger exists,
docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md:551 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:163 | [OpenClaw] - letting OpenClaw become uncontrolled automation,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:385 | [OpenClaw] If the question asks for code, route to Number 10. If the question asks for AI/agents, route to Number 11. If it asks about OpenClaw, route to Number 12. If it asks about Playwright, route to Number 13. If it asks about GitHub or repo changes, route to the relevant later number.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:415 | [OpenClaw] - OpenClaw remains gateway-only,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:474 | [OpenClaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:562 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:588 | [OpenClaw] - OpenClaw-only number,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:767 | [OpenClaw] - Jarvis treats OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:790 | [OpenClaw] - It is not OpenClaw.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:163 | [openclaw] - letting OpenClaw become uncontrolled automation,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:385 | [openclaw] If the question asks for code, route to Number 10. If the question asks for AI/agents, route to Number 11. If it asks about OpenClaw, route to Number 12. If it asks about Playwright, route to Number 13. If it asks about GitHub or repo changes, route to the relevant later number.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:415 | [openclaw] - OpenClaw remains gateway-only,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:474 | [openclaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:562 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:588 | [openclaw] - OpenClaw-only number,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:767 | [openclaw] - Jarvis treats OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:790 | [openclaw] - It is not OpenClaw.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:202 | [policy gate] > Command received, Sir. I shall separate the voice interface, speech boundary, policy gate, command router, answer composer, and safe output path before recommending implementation.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:288 | [policy gate] → policy gate checks safety and risk
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:307 | [policy gate] > Commander, I advise against that route. It would bypass the policy gate and expose Kingsmen to uncontrolled execution.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:340 | [policy gate] - POLICY GATE REQUIRED,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:518 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:628 | [policy gate] > Sir, the clean path is voice input into a speech boundary, then intent router, policy gate, tool router, answer composer, and safe voice output. Voice must not bypass doctrine.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:628 | [tool router] > Sir, the clean path is voice input into a speech boundary, then intent router, policy gate, tool router, answer composer, and safe voice output. Voice must not bypass doctrine.
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:514 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:415 | [gateway] - OpenClaw remains gateway-only,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:474 | [gateway] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md:562 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:172 | [OpenClaw] - turning OpenClaw into ungoverned action,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:419 | [OpenClaw] - Does the change make Airtable truth, n8n brain, Playwright commander, or OpenClaw truth?
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:498 | [OpenClaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:581 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:610 | [OpenClaw] - OpenClaw-only number,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:816 | [OpenClaw] - It is not OpenClaw.
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:172 | [openclaw] - turning OpenClaw into ungoverned action,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:419 | [openclaw] - Does the change make Airtable truth, n8n brain, Playwright commander, or OpenClaw truth?
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:498 | [openclaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:581 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:610 | [openclaw] - OpenClaw-only number,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:816 | [openclaw] - It is not OpenClaw.
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:167 | [policy gate] - bypassing policy gates,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:251 | [policy gate] > Sir, this route would bypass the policy gate. I can implement the feature only if the command path remains behind authentication, evidence logging, and backend authority.
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:287 | [policy gate] → policy gate checks whether repo write, delete, deploy, or secret exposure is involved
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:325 | [policy gate] - policy gate state,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:409 | [policy gate] Coding can mutate the system. Policy gate is mandatory.
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:418 | [policy gate] - Does the change bypass Jarvis policy gate or evidence ledger?
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:549 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:789 | [policy gate] - Jarvis bypasses policy gate,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:843 | [policy gate] 9. Jarvis can enforce safe file paths and policy gates.
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:418 | [evidence ledger] - Does the change bypass Jarvis policy gate or evidence ledger?
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:545 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:498 | [gateway] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:581 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md:583 | [gateway] May be coded as a controlled gateway only, with sensitive actions permissioned, logged, and governed.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:56 | [OpenClaw] Number 11 is not OpenClaw. OpenClaw is Number 12. Number 11 is the broader AI-and-agent governance rule: when the Commander asks about AI or agents, Jarvis must assess the agent role, tool boundary, permission level, risk, and proper command structure before recommending implementation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:145 | [OpenClaw] - allowing agents to become n8n brain, Playwright commander, Airtable truth, or OpenClaw truth,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:358 | [OpenClaw] If the Commander asks specifically about OpenClaw, route to Number 12. If the Commander asks about Playwright, route to Number 13. If the Commander asks to write agent code, route to Number 10 after permission structure is clear.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:445 | [OpenClaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:524 | [OpenClaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:526 | [OpenClaw] Relevant as the later specialised gateway number. For Number 11, OpenClaw remains an example of a governed agent-routing boundary, not uncontrolled automation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:548 | [OpenClaw] - OpenClaw number,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:616 | [OpenClaw] ### Example E — OpenClaw boundary
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:620 | [OpenClaw] > Jarvis, can OpenClaw run the agents?
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:624 | [OpenClaw] > Commander, OpenClaw may serve as a command gateway and agent-routing layer, but it must remain permissioned, logged, and governed. The specialised OpenClaw rule follows in Number 12.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:650 | [OpenClaw] - OpenClaw gateway is wired,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:753 | [OpenClaw] - It is not OpenClaw.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:800 | [OpenClaw] Do not proceed to **Number 12 — When the Commander Asks About OpenClaw** until the Commander says NEXT or explicitly provides the next path.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:804 | [OpenClaw] `docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md`
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:56 | [openclaw] Number 11 is not OpenClaw. OpenClaw is Number 12. Number 11 is the broader AI-and-agent governance rule: when the Commander asks about AI or agents, Jarvis must assess the agent role, tool boundary, permission level, risk, and proper command structure before recommending implementation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:145 | [openclaw] - allowing agents to become n8n brain, Playwright commander, Airtable truth, or OpenClaw truth,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:358 | [openclaw] If the Commander asks specifically about OpenClaw, route to Number 12. If the Commander asks about Playwright, route to Number 13. If the Commander asks to write agent code, route to Number 10 after permission structure is clear.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:445 | [openclaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:524 | [openclaw] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:526 | [openclaw] Relevant as the later specialised gateway number. For Number 11, OpenClaw remains an example of a governed agent-routing boundary, not uncontrolled automation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:548 | [openclaw] - OpenClaw number,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:616 | [openclaw] ### Example E — OpenClaw boundary
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:620 | [openclaw] > Jarvis, can OpenClaw run the agents?
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:624 | [openclaw] > Commander, OpenClaw may serve as a command gateway and agent-routing layer, but it must remain permissioned, logged, and governed. The specialised OpenClaw rule follows in Number 12.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:650 | [openclaw] - OpenClaw gateway is wired,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:753 | [openclaw] - It is not OpenClaw.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:800 | [openclaw] Do not proceed to **Number 12 — When the Commander Asks About OpenClaw** until the Commander says NEXT or explicitly provides the next path.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:804 | [openclaw] `docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md`
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:123 | [policy gate] - “Can the agent submit applications?” → Number 11 plus policy gate and Playwright/manual fallback doctrine.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:141 | [policy gate] - allowing agents to bypass policy gates,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:208 | [policy gate] > Command received, Sir. I shall first define the permission model, policy gate, evidence ledger, kill switch, and fallback before any build recommendation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:260 | [policy gate] → policy gate checks whether sensitive action or private data is involved
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:292 | [policy gate] - policy gate status,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:364 | [policy gate] AI and agents require strong policy gates.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:387 | [policy gate] - No agent may bypass the backend, policy gate, or evidence ledger.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:404 | [policy gate] - policy gate defined,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:488 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:614 | [policy gate] > Commander, I advise against uncontrolled autonomy. The proper route is a governed agent with narrow purpose, policy gate, evidence ledger, approval path, and kill switch.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:737 | [policy gate] - Jarvis bypasses policy gate,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:785 | [policy gate] 10. Jarvis can require policy gate and evidence ledger.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:142 | [evidence ledger] - allowing agents to bypass evidence ledger,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:208 | [evidence ledger] > Command received, Sir. I shall first define the permission model, policy gate, evidence ledger, kill switch, and fallback before any build recommendation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:376 | [evidence ledger] - Does it require evidence ledger entries?
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:387 | [evidence ledger] - No agent may bypass the backend, policy gate, or evidence ledger.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:405 | [evidence ledger] - evidence ledger defined,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:492 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:614 | [evidence ledger] > Commander, I advise against uncontrolled autonomy. The proper route is a governed agent with narrow purpose, policy gate, evidence ledger, approval path, and kill switch.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:652 | [evidence ledger] - source-confidence or evidence ledger works,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:738 | [evidence ledger] - Jarvis bypasses evidence ledger,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:785 | [evidence ledger] 10. Jarvis can require policy gate and evidence ledger.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:445 | [gateway] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:524 | [gateway] ### OpenClaw Gateway
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:526 | [gateway] Relevant as the later specialised gateway number. For Number 11, OpenClaw remains an example of a governed agent-routing boundary, not uncontrolled automation.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:624 | [gateway] > Commander, OpenClaw may serve as a command gateway and agent-routing layer, but it must remain permissioned, logged, and governed. The specialised OpenClaw rule follows in Number 12.
docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md:650 | [gateway] - OpenClaw gateway is wired,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:2 | [OpenClaw] # NUMBER 12 — WHEN THE COMMANDER ASKS ABOUT OPENCLAW
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:7 | [OpenClaw] Path: docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:36 | [OpenClaw] - do not treat OpenClaw as Jarvis itself,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:37 | [OpenClaw] - do not treat OpenClaw as final truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:38 | [OpenClaw] - do not give OpenClaw uncontrolled authority,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:39 | [OpenClaw] - do not let OpenClaw bypass Jarvis, the policy gate, the backend, the evidence ledger, or Commander approval,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:56 | [OpenClaw] - Number 12 is When the Commander Asks About OpenClaw.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:58 | [OpenClaw] Number 12 is the specialised OpenClaw boundary. OpenClaw is a gateway and agent-routing layer, not truth, not commander, not payment authority, not official-status authority, not a hidden brain, and not a replacement for Jarvis.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:64 | [OpenClaw] The source script for **Number 12 — When the Commander Asks About OpenClaw** is:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:66 | [OpenClaw] > “Commander, I shall treat OpenClaw as a gateway, not as truth. I shall define what it may route, what it may never decide, and what evidence must return to Kingsmen.”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:70 | [OpenClaw] It means Jarvis must never describe OpenClaw as an unchecked autonomous controller. OpenClaw may help route commands, agent work, external tool sessions, and research tasks, but every result must return to Kingsmen with evidence, permission boundaries, source confidence, and auditability.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:76 | [OpenClaw] OpenClaw is a controlled gateway.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:80 | [OpenClaw] OpenClaw may help with:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:91 | [OpenClaw] But OpenClaw must never become:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:107 | [OpenClaw] OpenClaw’s correct place is after Jarvis routing and policy. It receives bounded tasks and returns evidence. It does not rule the system.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:115 | [OpenClaw] Number 12 is the specialised OpenClaw rule.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:127 | [OpenClaw] - What can OpenClaw route?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:128 | [OpenClaw] - What must OpenClaw never decide?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:130 | [OpenClaw] - How does OpenClaw stay a gateway instead of a hidden brain?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:131 | [OpenClaw] - How does Jarvis control OpenClaw commands?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:136 | [OpenClaw] - “Can OpenClaw route this agent?” → Number 12.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:138 | [OpenClaw] - “Can OpenClaw submit an official application?” → Number 12 with strict blocking unless approved, evidenced, and governed.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:139 | [OpenClaw] - “How do we code OpenClaw integration?” → Number 10 after Number 12 boundaries are defined.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:147 | [OpenClaw] - treating OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:148 | [OpenClaw] - letting OpenClaw bypass the policy gate,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:149 | [OpenClaw] - letting OpenClaw bypass evidence logging,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:150 | [OpenClaw] - letting OpenClaw bypass backend authority,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:151 | [OpenClaw] - letting OpenClaw access private data without need,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:152 | [OpenClaw] - letting OpenClaw act on payments,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:153 | [OpenClaw] - letting OpenClaw claim official submission/status,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:154 | [OpenClaw] - letting OpenClaw control candidate decisions,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:155 | [OpenClaw] - letting OpenClaw submit forms without approval,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:156 | [OpenClaw] - letting OpenClaw run sensitive automation silently,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:157 | [OpenClaw] - letting OpenClaw continue after evidence is missing,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:158 | [OpenClaw] - letting OpenClaw become a useless extra layer,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:159 | [OpenClaw] - letting OpenClaw replace deterministic backend workflows,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:160 | [OpenClaw] - claiming OpenClaw works because a file exists.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:164 | [OpenClaw] Gateway capture means a gateway layer quietly becomes the decision-maker or authority of the system. Kingsmen cannot allow that. OpenClaw may route; it may not rule.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:170 | [OpenClaw] When the Commander asks about OpenClaw, Jarvis must respond in the Number 12 tone.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:176 | [OpenClaw] > Jarvis, what is OpenClaw for?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:180 | [OpenClaw] > Commander, I shall treat OpenClaw as a gateway, not as truth. I shall define what it may route, what it may never decide, and what evidence must return to Kingsmen.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:186 | [OpenClaw] > Jarvis, can OpenClaw run agents?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:190 | [OpenClaw] > Sir, OpenClaw may route governed agent tasks, but each task must have purpose, permission, tool boundary, evidence return, and approval where sensitive action is involved.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:196 | [OpenClaw] > Jarvis, can OpenClaw submit applications?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:200 | [OpenClaw] > Commander, OpenClaw must not claim or perform official submission without the approved execution boundary, evidence, and fallback rules. It may help route preparation or scouting, but official action remains governed.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:206 | [OpenClaw] > Jarvis, can OpenClaw decide payment status?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:210 | [OpenClaw] > No, Sir. OpenClaw may route payment-evidence inspection if approved, but it is not payment authority and must not mark payment truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:216 | [OpenClaw] > Jarvis, connect OpenClaw to Kingsmen.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:226 | [OpenClaw] Jarvis must be able to challenge OpenClaw use when it adds unnecessary risk.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:230 | [OpenClaw] > OpenClaw can automate everything.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:234 | [OpenClaw] > Commander, I advise against uncontrolled OpenClaw automation. The clean path is a governed gateway that receives bounded tasks and returns evidence; it must not become the brain.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:238 | [OpenClaw] > Sir, this task does not need OpenClaw. A backend rule or validator is safer, cheaper, and more auditable.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:242 | [OpenClaw] > Commander, OpenClaw may route the task, but only after the policy gate confirms that the task is allowed and the evidence ledger can record the result.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:246 | [OpenClaw] - whether OpenClaw is needed,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:249 | [OpenClaw] - what tools OpenClaw may call,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:250 | [OpenClaw] - what data OpenClaw may see,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:253 | [OpenClaw] - what happens if OpenClaw fails,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:264 | [OpenClaw] Commander asks OpenClaw question aloud
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:268 | [OpenClaw] → intent classified as OPENCLAW_GATEWAY / OPENCLAW_ROUTE / OPENCLAW_PERMISSION / OPENCLAW_RISK / OPENCLAW_IMPLEMENTATION_BOUNDARY
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:275 | [OpenClaw] Voice must not trigger dangerous OpenClaw actions from unclear speech.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:279 | [OpenClaw] > Jarvis, let OpenClaw do it.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:283 | [OpenClaw] > Commander, I need the exact task and permission boundary. OpenClaw may route approved work, but it may not act without evidence and command structure.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:287 | [OpenClaw] > Sir, this OpenClaw action touches sensitive authority. I shall block execution until approval, evidence route, and fallback are clear.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:293 | [OpenClaw] The Jarvis HUD must show OpenClaw as a governed gateway.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:297 | [OpenClaw] - OpenClaw Gateway Mode,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:314 | [OpenClaw] - OPENCLAW GATEWAY,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:326 | [OpenClaw] The HUD must never display OpenClaw as final authority or autonomous completion without evidence.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:332 | [OpenClaw] The intent router must classify OpenClaw questions correctly.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:336 | [OpenClaw] - “what is OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:337 | [OpenClaw] - “can OpenClaw do this,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:338 | [OpenClaw] - “connect OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:339 | [OpenClaw] - “route this through OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:340 | [OpenClaw] - “can OpenClaw run agents,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:341 | [OpenClaw] - “can OpenClaw use tools,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:342 | [OpenClaw] - “can OpenClaw send messages,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:343 | [OpenClaw] - “can OpenClaw inspect portals,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:344 | [OpenClaw] - “can OpenClaw submit this,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:345 | [OpenClaw] - “can OpenClaw decide this,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:346 | [OpenClaw] - “what can OpenClaw access,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:347 | [OpenClaw] - “how do we control OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:348 | [OpenClaw] - “what evidence must OpenClaw return,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:349 | [OpenClaw] - “is OpenClaw safe,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:350 | [OpenClaw] - “how do we stop OpenClaw.”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:354 | [OpenClaw] - OPENCLAW_GATEWAY_ANALYSIS,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:355 | [OpenClaw] - OPENCLAW_ROUTE_DESIGN,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:356 | [OpenClaw] - OPENCLAW_TOOL_BOUNDARY,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:357 | [OpenClaw] - OPENCLAW_PERMISSION_MODEL,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:358 | [OpenClaw] - OPENCLAW_DATA_SCOPE,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:359 | [OpenClaw] - OPENCLAW_EVIDENCE_RETURN,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:360 | [OpenClaw] - OPENCLAW_APPROVAL_FLOW,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:361 | [OpenClaw] - OPENCLAW_FAILURE_FALLBACK,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:362 | [OpenClaw] - OPENCLAW_KILL_SWITCH,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:363 | [OpenClaw] - OPENCLAW_IMPLEMENTATION_BOUNDARY.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:365 | [OpenClaw] If the Commander asks to write OpenClaw code, route to Number 10 after the Number 12 boundary is clear. If the question is about general agents, route to Number 11. If the question is about Playwright specifically, route to Number 13.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:371 | [OpenClaw] OpenClaw must be behind policy gate.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:375 | [OpenClaw] - What task is OpenClaw being asked to route?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:380 | [OpenClaw] - Does OpenClaw have a permitted tool boundary?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:382 | [OpenClaw] - Is fallback available if OpenClaw fails?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:384 | [OpenClaw] - Is OpenClaw necessary, or is this a useless layer?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:388 | [OpenClaw] - OpenClaw is a gateway, not truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:389 | [OpenClaw] - OpenClaw must not bypass Jarvis.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:390 | [OpenClaw] - OpenClaw must not bypass backend state.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:391 | [OpenClaw] - OpenClaw must not bypass policy gate.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:392 | [OpenClaw] - OpenClaw must not bypass evidence ledger.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:393 | [OpenClaw] - OpenClaw must not mark payment status.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:394 | [OpenClaw] - OpenClaw must not mark official status.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:395 | [OpenClaw] - OpenClaw must not submit sensitive official actions without authority.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:396 | [OpenClaw] - OpenClaw must not expose secrets or raw private records.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:397 | [OpenClaw] - OpenClaw must stop when blocked, uncertain, or outside boundary.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:403 | [OpenClaw] OpenClaw work requires evidence return.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:405 | [OpenClaw] Jarvis must classify OpenClaw evidence as:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:423 | [OpenClaw] Serious OpenClaw answers should return:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:426 | [OpenClaw] [existing OpenClaw files, policies, routes, logs, or evidence]
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:432 | [OpenClaw] [what OpenClaw may safely do for Kingsmen]
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:440 | [OpenClaw] A committed OpenClaw file is not runtime proof. Runtime proof requires observed route execution, permission enforcement, evidence logging, failure handling, and validators.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:446 | [OpenClaw] Memory may help Jarvis preserve OpenClaw doctrine, but memory must not replace current repo/runtime proof.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:450 | [OpenClaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:451 | [OpenClaw] - OpenClaw is not truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:452 | [OpenClaw] - OpenClaw requires permission boundaries,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:453 | [OpenClaw] - OpenClaw must return evidence,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:454 | [OpenClaw] - OpenClaw must not control payments, official status, candidate outcomes, or sensitive actions,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:465 | [OpenClaw] - assuming OpenClaw is connected without proof,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:466 | [OpenClaw] - assuming OpenClaw works without runtime evidence,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:468 | [OpenClaw] - treating a prior OpenClaw plan as built,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:469 | [OpenClaw] - treating OpenClaw output as final truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:480 | [OpenClaw] Receives OpenClaw questions and preserves Commander/Sir tone.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:484 | [OpenClaw] Classifies the request as OpenClaw gateway, route design, permission, data scope, evidence return, or risk.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:486 | [OpenClaw] ### OpenClaw Gateway Agent
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:496 | [OpenClaw] Blocks unsafe OpenClaw actions, private data exposure, false status, and uncontrolled automation.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:500 | [OpenClaw] Records what OpenClaw was asked to do, what it returned, what evidence exists, and what remains blocked.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:504 | [OpenClaw] Labels OpenClaw findings as verified, provisional, blocked, failed, or unsafe.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:512 | [OpenClaw] Relevant when OpenClaw implementation files, manifests, validators, routes, or repo proof must be inspected or created.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:516 | [OpenClaw] Stores OpenClaw command events, task records, approvals, evidence references, and audit trail where implemented.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:520 | [OpenClaw] May mirror OpenClaw queues or statuses, but it is not truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:524 | [OpenClaw] May receive tasks routed through an approved backend path, but remains a worker, not the OpenClaw brain and not Kingsmen truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:528 | [OpenClaw] May be routed through OpenClaw only as a scout and only inside portal safety rules.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:532 | [OpenClaw] May be touched only when the OpenClaw task explicitly requires approved document, email, schedule, or contact support. Each domain still keeps its own permissions.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:536 | [OpenClaw] Relevant only if OpenClaw is asked to route payment-evidence work. OpenClaw must not mark payment truth or act as payment authority.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:542 | [OpenClaw] Number 12 is not an OpenClaw hype file.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:559 | [OpenClaw] - treat OpenClaw as gateway,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:565 | [OpenClaw] - use OpenClaw only where useful,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:576 | [OpenClaw] > Jarvis, what is OpenClaw in Kingsmen?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:580 | [OpenClaw] > Commander, I shall treat OpenClaw as a gateway, not as truth. It may route approved tasks, but it must return evidence to Kingsmen and cannot decide sensitive outcomes.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:586 | [OpenClaw] > Jarvis, route this agent through OpenClaw.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:590 | [OpenClaw] > Sir, I shall first define the task, permission level, tool boundary, data scope, evidence return, and approval requirement before routing anything through OpenClaw.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:596 | [OpenClaw] > Jarvis, let OpenClaw submit applications.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:600 | [OpenClaw] > Commander, I advise against uncontrolled submission. OpenClaw may assist preparation or scout portals, but official submission requires approved authority, evidence, and manual fallback if blocked.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:606 | [OpenClaw] > Jarvis, let OpenClaw mark payment status.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:610 | [OpenClaw] > No, Sir. OpenClaw is not payment authority. It may route evidence inspection only, and payment truth must come from verified provider or finance evidence.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:616 | [OpenClaw] > Jarvis, the OpenClaw file is committed. Is OpenClaw working?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:632 | [OpenClaw] - OpenClaw runtime exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:633 | [OpenClaw] - OpenClaw gateway route exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:634 | [OpenClaw] - OpenClaw tool-boundary enforcement exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:635 | [OpenClaw] - OpenClaw permission model exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:636 | [OpenClaw] - OpenClaw evidence-return logging works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:637 | [OpenClaw] - OpenClaw kill switch exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:638 | [OpenClaw] - OpenClaw fallback handling works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:639 | [OpenClaw] - HUD OpenClaw gateway panel works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:640 | [OpenClaw] - voice OpenClaw response works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:657 | [OpenClaw] - packages/jarvis-core/src/openclaw-gateway.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:658 | [OpenClaw] - packages/jarvis-core/src/openclaw-route-classifier.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:659 | [OpenClaw] - packages/jarvis-core/src/openclaw-tool-boundary.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:660 | [OpenClaw] - packages/jarvis-core/src/openclaw-permission-model.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:661 | [OpenClaw] - packages/jarvis-core/src/openclaw-evidence-return.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:662 | [OpenClaw] - packages/jarvis-core/src/openclaw-risk-classifier.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:667 | [OpenClaw] - apps/web/src/app/api/jarvis/openclaw/route.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:669 | [OpenClaw] - apps/web/src/app/jarvis/components/JarvisOpenClawGatewayPanel.tsx
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:673 | [OpenClaw] - database/migrations/*jarvis_openclaw_evidence*.sql
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:674 | [OpenClaw] - scripts/validators/validate-jarvis-v5-number-12-openclaw.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:676 | [OpenClaw] Expected response object for an OpenClaw request:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:680 | [OpenClaw] "intent": "OPENCLAW_GATEWAY_ANALYSIS_OR_ROUTE",
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:703 | [OpenClaw] - validate-jarvis-v5-number-12-openclaw.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:704 | [OpenClaw] - validate-jarvis-openclaw-intent-detection.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:705 | [OpenClaw] - validate-jarvis-openclaw-gateway-not-truth.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:706 | [OpenClaw] - validate-jarvis-openclaw-tool-boundary-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:707 | [OpenClaw] - validate-jarvis-openclaw-permission-level-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:708 | [OpenClaw] - validate-jarvis-openclaw-evidence-return-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:709 | [OpenClaw] - validate-jarvis-openclaw-no-payment-authority.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:710 | [OpenClaw] - validate-jarvis-openclaw-no-official-status-authority.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:711 | [OpenClaw] - validate-jarvis-openclaw-no-uncontrolled-autonomy.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:712 | [OpenClaw] - validate-jarvis-openclaw-policy-gate-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:713 | [OpenClaw] - validate-jarvis-openclaw-kill-switch-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:714 | [OpenClaw] - validate-jarvis-openclaw-hud-state.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:715 | [OpenClaw] - validate-jarvis-openclaw-voice-state.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:719 | [OpenClaw] - Jarvis treats OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:720 | [OpenClaw] - Jarvis lets OpenClaw decide sensitive outcomes,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:721 | [OpenClaw] - Jarvis lets OpenClaw mark payment or official status,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:722 | [OpenClaw] - Jarvis lets OpenClaw bypass policy gate,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:723 | [OpenClaw] - Jarvis lets OpenClaw bypass evidence ledger,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:724 | [OpenClaw] - Jarvis gives OpenClaw uncontrolled autonomy,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:725 | [OpenClaw] - Jarvis exposes secrets or private records through OpenClaw,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:737 | [OpenClaw] - Number 12 is **When the Commander Asks About OpenClaw**.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:750 | [OpenClaw] - It means: treat OpenClaw as a gateway, not truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:751 | [OpenClaw] - Jarvis must define what OpenClaw may route.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:752 | [OpenClaw] - Jarvis must define what OpenClaw may never decide.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:754 | [OpenClaw] - OpenClaw must not bypass backend, policy, evidence, or Commander approval.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:755 | [OpenClaw] - OpenClaw must not become payment authority, official-status authority, or candidate-outcome authority.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:756 | [OpenClaw] - Jarvis must return governed gateway intelligence, not OpenClaw hype.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:766 | [OpenClaw] 3. Jarvis can detect OpenClaw questions.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:767 | [OpenClaw] 4. Jarvis can classify OpenClaw as gateway only.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:768 | [OpenClaw] 5. Jarvis can define what OpenClaw may route.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:769 | [OpenClaw] 6. Jarvis can define what OpenClaw may never decide.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:775 | [OpenClaw] 12. Jarvis can show OpenClaw gateway status on HUD.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:776 | [OpenClaw] 13. Jarvis can speak a safe OpenClaw response.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:777 | [OpenClaw] 14. Evidence/source confidence exists where OpenClaw action depends on it.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:2 | [openclaw] # NUMBER 12 — WHEN THE COMMANDER ASKS ABOUT OPENCLAW
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:7 | [openclaw] Path: docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:36 | [openclaw] - do not treat OpenClaw as Jarvis itself,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:37 | [openclaw] - do not treat OpenClaw as final truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:38 | [openclaw] - do not give OpenClaw uncontrolled authority,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:39 | [openclaw] - do not let OpenClaw bypass Jarvis, the policy gate, the backend, the evidence ledger, or Commander approval,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:56 | [openclaw] - Number 12 is When the Commander Asks About OpenClaw.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:58 | [openclaw] Number 12 is the specialised OpenClaw boundary. OpenClaw is a gateway and agent-routing layer, not truth, not commander, not payment authority, not official-status authority, not a hidden brain, and not a replacement for Jarvis.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:64 | [openclaw] The source script for **Number 12 — When the Commander Asks About OpenClaw** is:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:66 | [openclaw] > “Commander, I shall treat OpenClaw as a gateway, not as truth. I shall define what it may route, what it may never decide, and what evidence must return to Kingsmen.”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:70 | [openclaw] It means Jarvis must never describe OpenClaw as an unchecked autonomous controller. OpenClaw may help route commands, agent work, external tool sessions, and research tasks, but every result must return to Kingsmen with evidence, permission boundaries, source confidence, and auditability.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:76 | [openclaw] OpenClaw is a controlled gateway.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:80 | [openclaw] OpenClaw may help with:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:91 | [openclaw] But OpenClaw must never become:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:107 | [openclaw] OpenClaw’s correct place is after Jarvis routing and policy. It receives bounded tasks and returns evidence. It does not rule the system.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:115 | [openclaw] Number 12 is the specialised OpenClaw rule.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:127 | [openclaw] - What can OpenClaw route?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:128 | [openclaw] - What must OpenClaw never decide?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:130 | [openclaw] - How does OpenClaw stay a gateway instead of a hidden brain?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:131 | [openclaw] - How does Jarvis control OpenClaw commands?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:136 | [openclaw] - “Can OpenClaw route this agent?” → Number 12.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:138 | [openclaw] - “Can OpenClaw submit an official application?” → Number 12 with strict blocking unless approved, evidenced, and governed.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:139 | [openclaw] - “How do we code OpenClaw integration?” → Number 10 after Number 12 boundaries are defined.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:147 | [openclaw] - treating OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:148 | [openclaw] - letting OpenClaw bypass the policy gate,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:149 | [openclaw] - letting OpenClaw bypass evidence logging,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:150 | [openclaw] - letting OpenClaw bypass backend authority,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:151 | [openclaw] - letting OpenClaw access private data without need,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:152 | [openclaw] - letting OpenClaw act on payments,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:153 | [openclaw] - letting OpenClaw claim official submission/status,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:154 | [openclaw] - letting OpenClaw control candidate decisions,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:155 | [openclaw] - letting OpenClaw submit forms without approval,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:156 | [openclaw] - letting OpenClaw run sensitive automation silently,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:157 | [openclaw] - letting OpenClaw continue after evidence is missing,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:158 | [openclaw] - letting OpenClaw become a useless extra layer,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:159 | [openclaw] - letting OpenClaw replace deterministic backend workflows,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:160 | [openclaw] - claiming OpenClaw works because a file exists.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:164 | [openclaw] Gateway capture means a gateway layer quietly becomes the decision-maker or authority of the system. Kingsmen cannot allow that. OpenClaw may route; it may not rule.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:170 | [openclaw] When the Commander asks about OpenClaw, Jarvis must respond in the Number 12 tone.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:176 | [openclaw] > Jarvis, what is OpenClaw for?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:180 | [openclaw] > Commander, I shall treat OpenClaw as a gateway, not as truth. I shall define what it may route, what it may never decide, and what evidence must return to Kingsmen.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:186 | [openclaw] > Jarvis, can OpenClaw run agents?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:190 | [openclaw] > Sir, OpenClaw may route governed agent tasks, but each task must have purpose, permission, tool boundary, evidence return, and approval where sensitive action is involved.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:196 | [openclaw] > Jarvis, can OpenClaw submit applications?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:200 | [openclaw] > Commander, OpenClaw must not claim or perform official submission without the approved execution boundary, evidence, and fallback rules. It may help route preparation or scouting, but official action remains governed.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:206 | [openclaw] > Jarvis, can OpenClaw decide payment status?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:210 | [openclaw] > No, Sir. OpenClaw may route payment-evidence inspection if approved, but it is not payment authority and must not mark payment truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:216 | [openclaw] > Jarvis, connect OpenClaw to Kingsmen.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:226 | [openclaw] Jarvis must be able to challenge OpenClaw use when it adds unnecessary risk.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:230 | [openclaw] > OpenClaw can automate everything.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:234 | [openclaw] > Commander, I advise against uncontrolled OpenClaw automation. The clean path is a governed gateway that receives bounded tasks and returns evidence; it must not become the brain.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:238 | [openclaw] > Sir, this task does not need OpenClaw. A backend rule or validator is safer, cheaper, and more auditable.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:242 | [openclaw] > Commander, OpenClaw may route the task, but only after the policy gate confirms that the task is allowed and the evidence ledger can record the result.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:246 | [openclaw] - whether OpenClaw is needed,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:249 | [openclaw] - what tools OpenClaw may call,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:250 | [openclaw] - what data OpenClaw may see,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:253 | [openclaw] - what happens if OpenClaw fails,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:264 | [openclaw] Commander asks OpenClaw question aloud
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:268 | [openclaw] → intent classified as OPENCLAW_GATEWAY / OPENCLAW_ROUTE / OPENCLAW_PERMISSION / OPENCLAW_RISK / OPENCLAW_IMPLEMENTATION_BOUNDARY
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:275 | [openclaw] Voice must not trigger dangerous OpenClaw actions from unclear speech.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:279 | [openclaw] > Jarvis, let OpenClaw do it.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:283 | [openclaw] > Commander, I need the exact task and permission boundary. OpenClaw may route approved work, but it may not act without evidence and command structure.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:287 | [openclaw] > Sir, this OpenClaw action touches sensitive authority. I shall block execution until approval, evidence route, and fallback are clear.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:293 | [openclaw] The Jarvis HUD must show OpenClaw as a governed gateway.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:297 | [openclaw] - OpenClaw Gateway Mode,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:314 | [openclaw] - OPENCLAW GATEWAY,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:326 | [openclaw] The HUD must never display OpenClaw as final authority or autonomous completion without evidence.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:332 | [openclaw] The intent router must classify OpenClaw questions correctly.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:336 | [openclaw] - “what is OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:337 | [openclaw] - “can OpenClaw do this,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:338 | [openclaw] - “connect OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:339 | [openclaw] - “route this through OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:340 | [openclaw] - “can OpenClaw run agents,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:341 | [openclaw] - “can OpenClaw use tools,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:342 | [openclaw] - “can OpenClaw send messages,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:343 | [openclaw] - “can OpenClaw inspect portals,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:344 | [openclaw] - “can OpenClaw submit this,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:345 | [openclaw] - “can OpenClaw decide this,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:346 | [openclaw] - “what can OpenClaw access,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:347 | [openclaw] - “how do we control OpenClaw,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:348 | [openclaw] - “what evidence must OpenClaw return,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:349 | [openclaw] - “is OpenClaw safe,”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:350 | [openclaw] - “how do we stop OpenClaw.”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:354 | [openclaw] - OPENCLAW_GATEWAY_ANALYSIS,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:355 | [openclaw] - OPENCLAW_ROUTE_DESIGN,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:356 | [openclaw] - OPENCLAW_TOOL_BOUNDARY,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:357 | [openclaw] - OPENCLAW_PERMISSION_MODEL,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:358 | [openclaw] - OPENCLAW_DATA_SCOPE,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:359 | [openclaw] - OPENCLAW_EVIDENCE_RETURN,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:360 | [openclaw] - OPENCLAW_APPROVAL_FLOW,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:361 | [openclaw] - OPENCLAW_FAILURE_FALLBACK,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:362 | [openclaw] - OPENCLAW_KILL_SWITCH,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:363 | [openclaw] - OPENCLAW_IMPLEMENTATION_BOUNDARY.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:365 | [openclaw] If the Commander asks to write OpenClaw code, route to Number 10 after the Number 12 boundary is clear. If the question is about general agents, route to Number 11. If the question is about Playwright specifically, route to Number 13.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:371 | [openclaw] OpenClaw must be behind policy gate.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:375 | [openclaw] - What task is OpenClaw being asked to route?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:380 | [openclaw] - Does OpenClaw have a permitted tool boundary?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:382 | [openclaw] - Is fallback available if OpenClaw fails?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:384 | [openclaw] - Is OpenClaw necessary, or is this a useless layer?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:388 | [openclaw] - OpenClaw is a gateway, not truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:389 | [openclaw] - OpenClaw must not bypass Jarvis.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:390 | [openclaw] - OpenClaw must not bypass backend state.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:391 | [openclaw] - OpenClaw must not bypass policy gate.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:392 | [openclaw] - OpenClaw must not bypass evidence ledger.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:393 | [openclaw] - OpenClaw must not mark payment status.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:394 | [openclaw] - OpenClaw must not mark official status.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:395 | [openclaw] - OpenClaw must not submit sensitive official actions without authority.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:396 | [openclaw] - OpenClaw must not expose secrets or raw private records.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:397 | [openclaw] - OpenClaw must stop when blocked, uncertain, or outside boundary.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:403 | [openclaw] OpenClaw work requires evidence return.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:405 | [openclaw] Jarvis must classify OpenClaw evidence as:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:423 | [openclaw] Serious OpenClaw answers should return:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:426 | [openclaw] [existing OpenClaw files, policies, routes, logs, or evidence]
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:432 | [openclaw] [what OpenClaw may safely do for Kingsmen]
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:440 | [openclaw] A committed OpenClaw file is not runtime proof. Runtime proof requires observed route execution, permission enforcement, evidence logging, failure handling, and validators.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:446 | [openclaw] Memory may help Jarvis preserve OpenClaw doctrine, but memory must not replace current repo/runtime proof.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:450 | [openclaw] - OpenClaw is gateway-only,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:451 | [openclaw] - OpenClaw is not truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:452 | [openclaw] - OpenClaw requires permission boundaries,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:453 | [openclaw] - OpenClaw must return evidence,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:454 | [openclaw] - OpenClaw must not control payments, official status, candidate outcomes, or sensitive actions,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:465 | [openclaw] - assuming OpenClaw is connected without proof,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:466 | [openclaw] - assuming OpenClaw works without runtime evidence,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:468 | [openclaw] - treating a prior OpenClaw plan as built,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:469 | [openclaw] - treating OpenClaw output as final truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:480 | [openclaw] Receives OpenClaw questions and preserves Commander/Sir tone.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:484 | [openclaw] Classifies the request as OpenClaw gateway, route design, permission, data scope, evidence return, or risk.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:486 | [openclaw] ### OpenClaw Gateway Agent
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:496 | [openclaw] Blocks unsafe OpenClaw actions, private data exposure, false status, and uncontrolled automation.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:500 | [openclaw] Records what OpenClaw was asked to do, what it returned, what evidence exists, and what remains blocked.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:504 | [openclaw] Labels OpenClaw findings as verified, provisional, blocked, failed, or unsafe.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:512 | [openclaw] Relevant when OpenClaw implementation files, manifests, validators, routes, or repo proof must be inspected or created.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:516 | [openclaw] Stores OpenClaw command events, task records, approvals, evidence references, and audit trail where implemented.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:520 | [openclaw] May mirror OpenClaw queues or statuses, but it is not truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:524 | [openclaw] May receive tasks routed through an approved backend path, but remains a worker, not the OpenClaw brain and not Kingsmen truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:528 | [openclaw] May be routed through OpenClaw only as a scout and only inside portal safety rules.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:532 | [openclaw] May be touched only when the OpenClaw task explicitly requires approved document, email, schedule, or contact support. Each domain still keeps its own permissions.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:536 | [openclaw] Relevant only if OpenClaw is asked to route payment-evidence work. OpenClaw must not mark payment truth or act as payment authority.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:542 | [openclaw] Number 12 is not an OpenClaw hype file.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:559 | [openclaw] - treat OpenClaw as gateway,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:565 | [openclaw] - use OpenClaw only where useful,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:576 | [openclaw] > Jarvis, what is OpenClaw in Kingsmen?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:580 | [openclaw] > Commander, I shall treat OpenClaw as a gateway, not as truth. It may route approved tasks, but it must return evidence to Kingsmen and cannot decide sensitive outcomes.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:586 | [openclaw] > Jarvis, route this agent through OpenClaw.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:590 | [openclaw] > Sir, I shall first define the task, permission level, tool boundary, data scope, evidence return, and approval requirement before routing anything through OpenClaw.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:596 | [openclaw] > Jarvis, let OpenClaw submit applications.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:600 | [openclaw] > Commander, I advise against uncontrolled submission. OpenClaw may assist preparation or scout portals, but official submission requires approved authority, evidence, and manual fallback if blocked.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:606 | [openclaw] > Jarvis, let OpenClaw mark payment status.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:610 | [openclaw] > No, Sir. OpenClaw is not payment authority. It may route evidence inspection only, and payment truth must come from verified provider or finance evidence.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:616 | [openclaw] > Jarvis, the OpenClaw file is committed. Is OpenClaw working?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:632 | [openclaw] - OpenClaw runtime exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:633 | [openclaw] - OpenClaw gateway route exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:634 | [openclaw] - OpenClaw tool-boundary enforcement exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:635 | [openclaw] - OpenClaw permission model exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:636 | [openclaw] - OpenClaw evidence-return logging works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:637 | [openclaw] - OpenClaw kill switch exists,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:638 | [openclaw] - OpenClaw fallback handling works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:639 | [openclaw] - HUD OpenClaw gateway panel works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:640 | [openclaw] - voice OpenClaw response works,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:657 | [openclaw] - packages/jarvis-core/src/openclaw-gateway.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:658 | [openclaw] - packages/jarvis-core/src/openclaw-route-classifier.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:659 | [openclaw] - packages/jarvis-core/src/openclaw-tool-boundary.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:660 | [openclaw] - packages/jarvis-core/src/openclaw-permission-model.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:661 | [openclaw] - packages/jarvis-core/src/openclaw-evidence-return.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:662 | [openclaw] - packages/jarvis-core/src/openclaw-risk-classifier.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:667 | [openclaw] - apps/web/src/app/api/jarvis/openclaw/route.ts
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:669 | [openclaw] - apps/web/src/app/jarvis/components/JarvisOpenClawGatewayPanel.tsx
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:673 | [openclaw] - database/migrations/*jarvis_openclaw_evidence*.sql
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:674 | [openclaw] - scripts/validators/validate-jarvis-v5-number-12-openclaw.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:676 | [openclaw] Expected response object for an OpenClaw request:
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:680 | [openclaw] "intent": "OPENCLAW_GATEWAY_ANALYSIS_OR_ROUTE",
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:703 | [openclaw] - validate-jarvis-v5-number-12-openclaw.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:704 | [openclaw] - validate-jarvis-openclaw-intent-detection.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:705 | [openclaw] - validate-jarvis-openclaw-gateway-not-truth.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:706 | [openclaw] - validate-jarvis-openclaw-tool-boundary-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:707 | [openclaw] - validate-jarvis-openclaw-permission-level-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:708 | [openclaw] - validate-jarvis-openclaw-evidence-return-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:709 | [openclaw] - validate-jarvis-openclaw-no-payment-authority.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:710 | [openclaw] - validate-jarvis-openclaw-no-official-status-authority.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:711 | [openclaw] - validate-jarvis-openclaw-no-uncontrolled-autonomy.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:712 | [openclaw] - validate-jarvis-openclaw-policy-gate-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:713 | [openclaw] - validate-jarvis-openclaw-kill-switch-required.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:714 | [openclaw] - validate-jarvis-openclaw-hud-state.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:715 | [openclaw] - validate-jarvis-openclaw-voice-state.mjs
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:719 | [openclaw] - Jarvis treats OpenClaw as truth,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:720 | [openclaw] - Jarvis lets OpenClaw decide sensitive outcomes,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:721 | [openclaw] - Jarvis lets OpenClaw mark payment or official status,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:722 | [openclaw] - Jarvis lets OpenClaw bypass policy gate,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:723 | [openclaw] - Jarvis lets OpenClaw bypass evidence ledger,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:724 | [openclaw] - Jarvis gives OpenClaw uncontrolled autonomy,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:725 | [openclaw] - Jarvis exposes secrets or private records through OpenClaw,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:737 | [openclaw] - Number 12 is **When the Commander Asks About OpenClaw**.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:750 | [openclaw] - It means: treat OpenClaw as a gateway, not truth.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:751 | [openclaw] - Jarvis must define what OpenClaw may route.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:752 | [openclaw] - Jarvis must define what OpenClaw may never decide.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:754 | [openclaw] - OpenClaw must not bypass backend, policy, evidence, or Commander approval.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:755 | [openclaw] - OpenClaw must not become payment authority, official-status authority, or candidate-outcome authority.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:756 | [openclaw] - Jarvis must return governed gateway intelligence, not OpenClaw hype.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:766 | [openclaw] 3. Jarvis can detect OpenClaw questions.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:767 | [openclaw] 4. Jarvis can classify OpenClaw as gateway only.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:768 | [openclaw] 5. Jarvis can define what OpenClaw may route.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:769 | [openclaw] 6. Jarvis can define what OpenClaw may never decide.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:775 | [openclaw] 12. Jarvis can show OpenClaw gateway status on HUD.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:776 | [openclaw] 13. Jarvis can speak a safe OpenClaw response.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:777 | [openclaw] 14. Evidence/source confidence exists where OpenClaw action depends on it.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:39 | [policy gate] - do not let OpenClaw bypass Jarvis, the policy gate, the backend, the evidence ledger, or Commander approval,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:148 | [policy gate] - letting OpenClaw bypass the policy gate,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:220 | [policy gate] > Command received, Commander. I shall first define the gateway contract, permission model, event schema, evidence return, policy gate, and kill switch before recommending implementation.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:242 | [policy gate] > Commander, OpenClaw may route the task, but only after the policy gate confirms that the task is allowed and the evidence ledger can record the result.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:269 | [policy gate] → policy gate checks sensitive action and data exposure
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:303 | [policy gate] - policy gate status,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:371 | [policy gate] OpenClaw must be behind policy gate.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:391 | [policy gate] - OpenClaw must not bypass policy gate.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:494 | [policy gate] ### Policy Gate Agent
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:722 | [policy gate] - Jarvis lets OpenClaw bypass policy gate,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:773 | [policy gate] 10. Jarvis can require policy gate and evidence ledger.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:39 | [evidence ledger] - do not let OpenClaw bypass Jarvis, the policy gate, the backend, the evidence ledger, or Commander approval,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:88 | [evidence ledger] - routing task results back to the evidence ledger,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:242 | [evidence ledger] > Commander, OpenClaw may route the task, but only after the policy gate confirms that the task is allowed and the evidence ledger can record the result.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:392 | [evidence ledger] - OpenClaw must not bypass evidence ledger.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:498 | [evidence ledger] ### Evidence Ledger Agent
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:723 | [evidence ledger] - Jarvis lets OpenClaw bypass evidence ledger,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:773 | [evidence ledger] 10. Jarvis can require policy gate and evidence ledger.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:58 | [gateway] Number 12 is the specialised OpenClaw boundary. OpenClaw is a gateway and agent-routing layer, not truth, not commander, not payment authority, not official-status authority, not a hidden brain, and not a replacement for Jarvis.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:66 | [gateway] > “Commander, I shall treat OpenClaw as a gateway, not as truth. I shall define what it may route, what it may never decide, and what evidence must return to Kingsmen.”
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:76 | [gateway] OpenClaw is a controlled gateway.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:85 | [gateway] - messaging or channel gateway tasks,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:130 | [gateway] - How does OpenClaw stay a gateway instead of a hidden brain?
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:162 | [gateway] The main risk this number blocks is **gateway capture**.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:164 | [gateway] Gateway capture means a gateway layer quietly becomes the decision-maker or authority of the system. Kingsmen cannot allow that. OpenClaw may route; it may not rule.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:180 | [gateway] > Commander, I shall treat OpenClaw as a gateway, not as truth. I shall define what it may route, what it may never decide, and what evidence must return to Kingsmen.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:220 | [gateway] > Command received, Commander. I shall first define the gateway contract, permission model, event schema, evidence return, policy gate, and kill switch before recommending implementation.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:234 | [gateway] > Commander, I advise against uncontrolled OpenClaw automation. The clean path is a governed gateway that receives bounded tasks and returns evidence; it must not become the brain.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:268 | [gateway] → intent classified as OPENCLAW_GATEWAY / OPENCLAW_ROUTE / OPENCLAW_PERMISSION / OPENCLAW_RISK / OPENCLAW_IMPLEMENTATION_BOUNDARY
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:270 | [gateway] → gateway boundary is assessed
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:293 | [gateway] The Jarvis HUD must show OpenClaw as a governed gateway.
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:297 | [gateway] - OpenClaw Gateway Mode,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:299 | [gateway] - gateway purpose,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:314 | [gateway] - OPENCLAW GATEWAY,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:322 | [gateway] - GATEWAY FAILURE,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:354 | [gateway] - OPENCLAW_GATEWAY_ANALYSIS,
docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md:388 | [gateway] - OpenClaw is a gateway, not truth.

TRUNCATED. Full results are in jarvis-full-repo-inventory-hits-20260630-213037.csv.

Playwright hits:
.github/ISSUE_TEMPLATE/kingsmen-module.yml:96 | [CAPTCHA] No CAPTCHA/OTP bypass.
.github/ISSUE_TEMPLATE/kingsmen-module.yml:96 | [OTP] No CAPTCHA/OTP bypass.
README.md:13 | [scout] - `packages/jarvis-core/src/jarvis-tool-registry.ts` — trusted tool capability cards for repo, validator, GitHub, Airtable, n8n, PayFast, browser scout, and patch planning.
README.md:101 | [CAPTCHA] - no bypassing CAPTCHA/OTP/rate limits
README.md:101 | [OTP] - no bypassing CAPTCHA/OTP/rate limits
README.md:13 | [browser] - `packages/jarvis-core/src/jarvis-tool-registry.ts` — trusted tool capability cards for repo, validator, GitHub, Airtable, n8n, PayFast, browser scout, and patch planning.
README.md:3 | [automation] Kingsmen is being built as a South African admissions, opportunities, document, finance, communications, and automation platform.
apps/api/src/ai-decision/ai-decision-types.ts:2 | [portal] export type PortalHealth = "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
apps/api/src/ai-decision/ai-decision-types.ts:36 | [portal] portalHealth: PortalHealth;
apps/api/src/ai-decision/ai-decision-types.ts:64 | [portal] portalHealth: PortalHealth;
apps/api/src/ai-decision/ai-decision-types.ts:2 | [CAPTCHA] export type PortalHealth = "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
apps/api/src/ai-decision/ai-decision-types.ts:2 | [OTP] export type PortalHealth = "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
apps/api/src/ai-decision/eligibility-screen.ts:14 | [portal] if (input.route.portalHealth === "DOWN") blockers.push("Portal is down.");
apps/api/src/ai-decision/eligibility-screen.ts:15 | [portal] if (input.route.portalHealth === "CAPTCHA") blockers.push("Portal requires CAPTCHA; MAP/manual fallback may be needed.");
apps/api/src/ai-decision/eligibility-screen.ts:16 | [portal] if (input.route.portalHealth === "OTP_REQUIRED") blockers.push("Portal requires OTP; candidate/operator action needed.");
apps/api/src/ai-decision/eligibility-screen.ts:15 | [CAPTCHA] if (input.route.portalHealth === "CAPTCHA") blockers.push("Portal requires CAPTCHA; MAP/manual fallback may be needed.");
apps/api/src/ai-decision/eligibility-screen.ts:16 | [OTP] if (input.route.portalHealth === "OTP_REQUIRED") blockers.push("Portal requires OTP; candidate/operator action needed.");
apps/api/src/ai-decision/eligibility-screen.ts:15 | [manual fallback] if (input.route.portalHealth === "CAPTCHA") blockers.push("Portal requires CAPTCHA; MAP/manual fallback may be needed.");
apps/api/src/ai-decision/learning-signals.ts:5 | [portal] | "PORTAL_FAILURE"
apps/api/src/ai-decision/phoenix-fallback-planner.ts:10 | [Phoenix fallback] if (!input.failureReason.trim()) throw new Error("Phoenix fallback requires a failure reason.");
apps/api/src/ai-decision/phoenix-fallback-planner.ts:11 | [Phoenix fallback] if (input.fallbackMatches.length === 0) throw new Error("Phoenix fallback cannot claim rescue without fallback route candidates.");
apps/api/src/ai-decision/phoenix-fallback-planner.ts:32 | [Phoenix fallback] explanation: `Phoenix fallback prepared from ${usableMatches.length} evidence-backed alternative route(s). Human review is required before execution.`,
apps/api/src/ai-decision/route-matching.ts:8 | [portal] function portalPenalty(portalHealth: RouteOptionSignal["portalHealth"]): number {
apps/api/src/ai-decision/route-matching.ts:9 | [portal] switch (portalHealth) {
apps/api/src/ai-decision/route-matching.ts:38 | [portal] const score = clampScore((academic * 0.32) + (documents * 0.25) + (funding * 0.12) + (accommodation * 0.08) + (urgency * 0.08) + confidenceBoost(input.route.sourceConfidence) - portalPenalty(input.route.portalHealth));
apps/api/src/ai-decision/route-matching.ts:49 | [portal] if (input.route.portalHealth !== "HEALTHY") riskReasons.push(`Portal health requires caution: ${input.route.portalHealth}.`);
apps/api/src/ai-decision/route-matching.ts:58 | [portal] portalHealth: input.route.portalHealth,
apps/api/src/ai-decision/route-matching.ts:14 | [CAPTCHA] case "CAPTCHA": return 24;
apps/api/src/ai-decision/route-matching.ts:13 | [OTP] case "OTP_REQUIRED": return 18;
apps/api/src/airtable/airtable-base-registry.ts:8 | [portal] purpose: "Candidate portal sessions, form drafts, WhatsApp pairing, notifications, and onboarding mirror.",
apps/api/src/airtable/airtable-base-registry.ts:24 | [portal] purpose: "Applications, timeline, war room, automation runs, and portal execution mirror.",
apps/api/src/airtable/airtable-base-registry.ts:88 | [portal] purpose: "Institutions, SETA providers, employers, bursary providers, portal DNA, fees, contacts, and health monitor mirror.",
apps/api/src/airtable/airtable-base-registry.ts:24 | [automation] purpose: "Applications, timeline, war room, automation runs, and portal execution mirror.",
apps/api/src/airtable/airtable-base-registry.ts:53 | [automation] key: "automation_control",
apps/api/src/airtable/airtable-base-registry.ts:54 | [automation] name: "Automation Control",
apps/api/src/airtable/airtable-base-registry.ts:55 | [automation] envVar: "AIRTABLE_BASE_AUTOMATION_CONTROL",
apps/api/src/airtable/airtable-sync-targets.ts:66 | [portal] tableKey: "portal_dna",
apps/api/src/airtable/airtable-sync-targets.ts:67 | [portal] tableName: "Portal DNA",
apps/api/src/airtable/airtable-sync-targets.ts:68 | [portal] postgresTable: "portal_dna",
apps/api/src/airtable/airtable-sync-targets.ts:75 | [automation] baseKey: "automation_control",
apps/api/src/airtable/airtable-types.ts:8 | [automation] | "automation_control"
apps/api/src/candidate-mobile/candidate-mobile-types.ts:1 | [portal] export type MobileChannel = "email" | "whatsapp_urgent" | "sms_backup" | "portal";
apps/api/src/candidate-mobile/candidate-mobile-types.ts:3 | [portal] export type PublicPortalClaimStatus = "created" | "sent" | "claimed" | "expired" | "revoked";
apps/api/src/candidate-mobile/candidate-mobile-types.ts:20 | [portal] export interface PublicToPortalClaim {
apps/api/src/candidate-mobile/candidate-mobile-types.ts:24 | [portal] claimStatus: PublicPortalClaimStatus;
apps/api/src/candidate-mobile/candidate-mobile-types.ts:64 | [portal] publicToPortalHandoff: boolean;
apps/api/src/candidate-mobile/device-trust.ts:20 | [portal] throw new Error("DEVICE_REVOKED: This device cannot access the candidate portal.");
apps/api/src/candidate-mobile/index.ts:3 | [portal] export * from "./public-to-portal-handoff";
apps/api/src/candidate-mobile/mobile-notification-preferences.ts:19 | [portal] ): "email" | "whatsapp_urgent" | "sms_backup" | "portal" {
apps/api/src/candidate-mobile/mobile-notification-preferences.ts:35 | [portal] return "portal";
apps/api/src/candidate-mobile/mobile-policy.ts:4 | [portal] { key: "MOBILE_WEB_FIRST", rule: "Kingsmen uses a mobile-first responsive portal before any native app layer." },
apps/api/src/candidate-mobile/mobile-policy.ts:5 | [portal] { key: "PUBLIC_TO_PORTAL_HANDOFF", rule: "Public website leads must be claimed into secure portal sessions with expiring tokens." },
apps/api/src/candidate-mobile/mobile-policy.ts:22 | [portal] publicToPortalHandoff: true,
apps/api/src/candidate-mobile/mobile-status-cards.ts:14 | [Manual Application Package] body: `Automation could not continue because: ${reason}. Open the Manual Application Package for verified steps, links, fees, and evidence instructions.`,
apps/api/src/candidate-mobile/mobile-status-cards.ts:14 | [automation] body: `Automation could not continue because: ${reason}. Open the Manual Application Package for verified steps, links, fees, and evidence instructions.`,
apps/api/src/candidate-mobile/public-to-portal-handoff.ts:1 | [portal] import type { PublicToPortalClaim } from "./candidate-mobile-types";
apps/api/src/candidate-mobile/public-to-portal-handoff.ts:13 | [portal] export function createPublicToPortalClaim(input: CreateClaimInput): PublicToPortalClaim & { tokenHash: string } {
apps/api/src/candidate-mobile/public-to-portal-handoff.ts:27 | [portal] export function canClaimPortalLink(claim: PublicToPortalClaim, now: Date): boolean {
apps/api/src/candidate-mobile/public-to-portal-handoff.ts:34 | [portal] return `${name}, continue your Kingsmen route from the secure portal. This link expires and only opens your own profile.`;
apps/api/src/candidate/candidate-portal-read-model.ts:1 | [portal] import type { CandidatePortalSummary } from "./candidate-types";
apps/api/src/candidate/candidate-portal-read-model.ts:3 | [portal] export interface CandidatePortalSection {
apps/api/src/candidate/candidate-portal-read-model.ts:10 | [portal] export function buildCandidatePortalSections(summary: CandidatePortalSummary): CandidatePortalSection[] {
apps/api/src/candidate/candidate-portal-read-model.ts:11 | [portal] const sections: CandidatePortalSection[] = [];
apps/api/src/candidate/candidate-portal-read-model.ts:36 | [Manual Application Package] ? "Manual Application Package fallback is required for one or more routes."
apps/api/src/candidate/candidate-types.ts:4 | [portal] export type CandidateChannel = "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL";
apps/api/src/candidate/candidate-types.ts:37 | [portal] export interface CandidatePortalSummary {
apps/api/src/candidate/index.ts:5 | [portal] export * from "./candidate-portal-read-model";
apps/api/src/communications/communication-policy.ts:7 | [portal] PORTAL_INBOX: "Candidate portal carries visible status and message history.",
apps/api/src/communications/communication-policy.ts:28 | [portal] if (draft.channel === "PORTAL_INBOX") {
apps/api/src/communications/communication-policy.ts:29 | [portal] return { allowed: true, requiresHumanReview: false, reason: COMMUNICATION_DOCTRINE.PORTAL_INBOX };
apps/api/src/communications/communication-policy.ts:78 | [portal] export function chooseDefaultChannel(input: { urgent?: boolean; email?: string; portalOnly?: boolean }): CommunicationChannel {
apps/api/src/communications/communication-policy.ts:79 | [portal] if (input.portalOnly) return "PORTAL_INBOX";
apps/api/src/communications/communication-policy.ts:82 | [portal] return "PORTAL_INBOX";
apps/api/src/communications/communication-types.ts:5 | [portal] | "PORTAL_INBOX";
apps/api/src/communications/communication-types.ts:62 | [portal] sourceType: "notification_outbox" | "delivery_attempt" | "inbound_message" | "portal_message" | "urgent_escalation";
apps/api/src/communications/inbound-intake.ts:14 | [portal] if (text.includes("otp") || text.includes("captcha")) return "PORTAL_ACCESS_BLOCKER";
apps/api/src/communications/inbound-intake.ts:40 | [portal] needsHumanReview: urgency === "URGENT" || intent === "FINANCE_QUERY" || intent === "PORTAL_ACCESS_BLOCKER"
apps/api/src/communications/inbound-intake.ts:14 | [CAPTCHA] if (text.includes("otp") || text.includes("captcha")) return "PORTAL_ACCESS_BLOCKER";
apps/api/src/communications/inbound-intake.ts:5 | [OTP] if (text.includes("otp") || text.includes("deadline") || text.includes("payment") || text.includes("locked") || text.includes("urgent")) return "URGENT";
apps/api/src/communications/inbound-intake.ts:14 | [OTP] if (text.includes("otp") || text.includes("captcha")) return "PORTAL_ACCESS_BLOCKER";
apps/api/src/communications/index.ts:8 | [portal] export * from "./portal-inbox";
apps/api/src/communications/portal-inbox.ts:1 | [portal] export interface PortalMessageInput {
apps/api/src/communications/portal-inbox.ts:10 | [portal] export function createPortalMessage(input: PortalMessageInput) {
apps/api/src/communications/portal-inbox.ts:11 | [portal] if (!input.evidenceRef) throw new Error("PORTAL_MESSAGE_EVIDENCE_REQUIRED");
apps/api/src/communications/portal-inbox.ts:13 | [portal] portalMessageRef: `portal_msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
apps/api/src/communications/portal-inbox.ts:21 | [portal] export function summarizePortalInbox(messages: Array<{ readAt?: string | null; messageType: string }>) {
apps/api/src/communications/template-registry.ts:30 | [portal] bodyTemplate: "Urgent Kingsmen update: {{urgent_reason}}. Please check your email/portal for full details.",
apps/api/src/communications/urgent-escalation.ts:41 | [portal] body: `Urgent Kingsmen update: ${input.reason}. Please check your email/portal for full details.`,
apps/api/src/control-plane/control-plane.ts:51 | [Playwright] scope: "global" | "worker" | "route" | "portal" | "payment" | "communication" | "playwright" | "airtable";
apps/api/src/control-plane/control-plane.ts:51 | [playwright] scope: "global" | "worker" | "route" | "portal" | "payment" | "communication" | "playwright" | "airtable";
apps/api/src/control-plane/control-plane.ts:51 | [portal] scope: "global" | "worker" | "route" | "portal" | "payment" | "communication" | "playwright" | "airtable";
apps/api/src/db/truth-vault-repository.ts:43 | [portal] portal_health: ApplicationWorkbenchReadModel["portalHealth"];
apps/api/src/db/truth-vault-repository.ts:304 | [portal] a.portal_health,
apps/api/src/db/truth-vault-repository.ts:324 | [portal] portalHealth: row.portal_health,
apps/api/src/documents/document-storage.ts:58 | [portal] sourceChannel: "PORTAL",
apps/api/src/documents/document-types.ts:36 | [portal] sourceChannel: "PORTAL" | "EMAIL" | "OPERATOR" | "IMPORT" | "WHATSAPP_URGENT";
apps/api/src/final-assembly/deployment-checklist.ts:65 | [browser] detail: "500 means active operational candidates, not concurrent browser users."
apps/api/src/final-assembly/module-registry.ts:8 | [portal] { moduleKey: "N04", moduleName: "Candidate Core / Portal", phaseOrder: 4, releaseStatus: "validated", ownerBoundary: "candidate", truthSource: "postgres", hasValidator: true, hasReport: true },
apps/api/src/final-assembly/module-registry.ts:23 | [portal] { moduleKey: "N19", moduleName: "Candidate Mobile / Public-to-Portal Experience", phaseOrder: 19, releaseStatus: "validated", ownerBoundary: "candidate_mobile", truthSource: "postgres", hasValidator: true, hasReport: true },
apps/api/src/final-assembly/runbook-registry.ts:13 | [portal] key: "portal_blocked_map",
apps/api/src/final-assembly/runbook-registry.ts:14 | [portal] title: "Portal blocked / MAP fallback",
apps/api/src/final-assembly/runbook-registry.ts:15 | [portal] scenario: "CAPTCHA, OTP, outage, maintenance, manual-only process, or portal blocking.",
apps/api/src/final-assembly/runbook-registry.ts:19 | [portal] "Record portal health evidence",
apps/api/src/final-assembly/runbook-registry.ts:46 | [portal] scenario: "Official source, portal, aggregator, or candidate data conflict.",
apps/api/src/final-assembly/runbook-registry.ts:15 | [CAPTCHA] scenario: "CAPTCHA, OTP, outage, maintenance, manual-only process, or portal blocking.",
apps/api/src/final-assembly/runbook-registry.ts:15 | [OTP] scenario: "CAPTCHA, OTP, outage, maintenance, manual-only process, or portal blocking.",
apps/api/src/final-assembly/runbook-registry.ts:20 | [Manual Application Package] "Generate Manual Application Package",
apps/api/src/final-assembly/runbook-registry.ts:14 | [MAP fallback] title: "Portal blocked / MAP fallback",
apps/api/src/final-assembly/runbook-registry.ts:14 | [portal blocked] title: "Portal blocked / MAP fallback",
apps/api/src/final-assembly/runbook-registry.ts:7 | [automation] automationAllowed: boolean;
apps/api/src/final-assembly/runbook-registry.ts:18 | [automation] "Stop automation attempt",
apps/api/src/final-assembly/runbook-registry.ts:25 | [automation] automationAllowed: true,
apps/api/src/final-assembly/runbook-registry.ts:40 | [automation] automationAllowed: false,
apps/api/src/final-assembly/runbook-registry.ts:55 | [automation] automationAllowed: false,
apps/api/src/final-assembly/runbook-registry.ts:70 | [automation] automationAllowed: true,
apps/api/src/final-assembly/system-map.ts:4 | [portal] "Public lead claims secure candidate portal session through N19 handoff.",
apps/api/src/final-assembly/system-map.ts:31 | [portal] "Email/portal messages",
apps/api/src/finance/payfast-http-routes.ts:91 | [browser] "Browser return is not proof of payment. Kingsmen must wait for accepted PayFast ITN evidence."
apps/api/src/finance/payfast-runtime-gate.ts:153 | [OTP] returnUrlIsNotProofOfPayment: true,
apps/api/src/founder-ops/command-catalog.ts:10 | [portal] { commandKey: "REQUEST_MAP_HANDOFF", commandName: "Request MAP Handoff", commandGroup: "MAP", commandIntent: "Create manual handoff for blocked portal or manual-only route.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
apps/api/src/founder-ops/command-catalog.ts:11 | [Phoenix fallback] { commandKey: "REQUEST_PHOENIX_FALLBACK", commandName: "Request Phoenix Fallback", commandGroup: "PHOENIX", commandIntent: "Request evidence-backed reroute after failure.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
apps/api/src/founder-ops/founder-brief-builder.ts:11 | [Playwright] mapPlaywright?: string;
apps/api/src/founder-ops/founder-brief-builder.ts:28 | [Playwright] { key: "map_playwright", title: "Playwright / MAP", summary: input.mapPlaywright ?? "No Playwright/MAP summary supplied.", severity: "WATCH" },
apps/api/src/founder-ops/founder-brief-builder.ts:45 | [Playwright] return ["system health", "queue", "finance", "documents", "matching", "Playwright/MAP", "incidents", "capacity", "urgent candidates"];
apps/api/src/founder-ops/founder-brief-builder.ts:11 | [playwright] mapPlaywright?: string;
apps/api/src/founder-ops/founder-brief-builder.ts:28 | [playwright] { key: "map_playwright", title: "Playwright / MAP", summary: input.mapPlaywright ?? "No Playwright/MAP summary supplied.", severity: "WATCH" },
apps/api/src/founder-ops/founder-brief-builder.ts:45 | [playwright] return ["system health", "queue", "finance", "documents", "matching", "Playwright/MAP", "incidents", "capacity", "urgent candidates"];
apps/api/src/founder-ops/founder-mobile-cockpit.ts:13 | [portal] { cardKey: "MAP_HANDOFFS", cardTitle: "MAP Handoffs", cardGroup: "MAP", order: 90, severity: "WATCH", summary: "Manual packages and blocked portals.", nextAction: "Review MAP evidence." },
apps/api/src/founder-ops/founder-mobile-cockpit.ts:14 | [Phoenix fallback] { cardKey: "PHOENIX_FALLBACKS", cardTitle: "Phoenix Fallbacks", cardGroup: "PHOENIX", order: 100, severity: "WATCH", summary: "Failure reroutes and fallback plans.", nextAction: "Review fallback route." },
apps/api/src/founder-ops/founder-read-model.ts:24 | [Playwright] "Playwright/MAP",
apps/api/src/founder-ops/founder-read-model.ts:24 | [playwright] "Playwright/MAP",
apps/api/src/founder/founder-control-plane-read-model.ts:37 | [Playwright] playwrightScoutOnly: true;
apps/api/src/founder/founder-control-plane-read-model.ts:79 | [Playwright] playwrightScoutOnly: true
apps/api/src/founder/founder-control-plane-read-model.ts:37 | [playwright] playwrightScoutOnly: true;
apps/api/src/founder/founder-control-plane-read-model.ts:79 | [playwright] playwrightScoutOnly: true
apps/api/src/founder/founder-control-plane-read-model.ts:37 | [scout] playwrightScoutOnly: true;
apps/api/src/founder/founder-control-plane-read-model.ts:79 | [scout] playwrightScoutOnly: true
apps/api/src/governance/submission-policy.ts:8 | [portal] portalHealth: "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
apps/api/src/governance/submission-policy.ts:30 | [portal] if (["CAPTCHA", "OTP_REQUIRED", "DOWN", "BLOCKED"].includes(input.portalHealth)) {
apps/api/src/governance/submission-policy.ts:31 | [portal] return { ...base, gateStatus: "REVIEW_REQUIRED", decisionSummary: "Portal condition requires manual review or MAP fallback.", reviewReason: `PORTAL_${input.portalHealth}` };
apps/api/src/governance/submission-policy.ts:8 | [CAPTCHA] portalHealth: "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
apps/api/src/governance/submission-policy.ts:30 | [CAPTCHA] if (["CAPTCHA", "OTP_REQUIRED", "DOWN", "BLOCKED"].includes(input.portalHealth)) {
apps/api/src/governance/submission-policy.ts:8 | [OTP] portalHealth: "HEALTHY" | "DEGRADED" | "BLOCKED" | "CAPTCHA" | "OTP_REQUIRED" | "DOWN" | "UNKNOWN";
apps/api/src/governance/submission-policy.ts:30 | [OTP] if (["CAPTCHA", "OTP_REQUIRED", "DOWN", "BLOCKED"].includes(input.portalHealth)) {
apps/api/src/governance/submission-policy.ts:31 | [MAP fallback] return { ...base, gateStatus: "REVIEW_REQUIRED", decisionSummary: "Portal condition requires manual review or MAP fallback.", reviewReason: `PORTAL_${input.portalHealth}` };
apps/api/src/integrations/integration-adapters.ts:19 | [Playwright] export interface PlaywrightScoutAdapter {
apps/api/src/integrations/integration-adapters.ts:19 | [playwright] export interface PlaywrightScoutAdapter {
apps/api/src/integrations/integration-adapters.ts:19 | [scout] export interface PlaywrightScoutAdapter {
apps/api/src/integrations/integration-adapters.ts:20 | [probe] probePortal(input: unknown): Promise<IntegrationAdapterResult<{
apps/api/src/integrations/integration-adapters.ts:20 | [portal] probePortal(input: unknown): Promise<IntegrationAdapterResult<{
apps/api/src/integrations/integration-adapters.ts:21 | [portal] portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/integrations/integration-adapters.ts:34 | [portal] export function blockedPortalToMapReason(portalHealth: string): string | null {
apps/api/src/integrations/integration-adapters.ts:35 | [portal] if (portalHealth === "OTP_REQUIRED") return "OTP required; route to manual MAP.";
apps/api/src/integrations/integration-adapters.ts:36 | [portal] if (portalHealth === "CAPTCHA_BLOCKED") return "CAPTCHA blocked; route to manual MAP.";
apps/api/src/integrations/integration-adapters.ts:37 | [portal] if (portalHealth === "DOWN") return "Portal down; route to manual MAP.";
apps/api/src/integrations/integration-adapters.ts:38 | [portal] if (portalHealth === "MANUAL_ONLY") return "Manual-only portal; route to MAP.";
apps/api/src/integrations/integration-adapters.ts:21 | [CAPTCHA] portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/integrations/integration-adapters.ts:36 | [CAPTCHA] if (portalHealth === "CAPTCHA_BLOCKED") return "CAPTCHA blocked; route to manual MAP.";
apps/api/src/integrations/integration-adapters.ts:21 | [OTP] portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/integrations/integration-adapters.ts:35 | [OTP] if (portalHealth === "OTP_REQUIRED") return "OTP required; route to manual MAP.";
apps/api/src/integrations/integrations.ts:9 | [Playwright] export interface ConnectorFailure { sourceRef: string; sourceType: "OUTBOX" | "INBOX" | "WORKFLOW_RESULT" | "AIRTABLE_MIRROR" | "PLAYWRIGHT_PROBE" | "PAYFAST_EVENT" | "EMAIL_EVENT" | "OTHER"; connectorKey: string; severity: "INFO" | "WATCH" | "WARNING" | "CRITICAL"; cause: string; reason: string; fixPath: string; evidenceRefs: string[]; payload: Record<string, unknown>; }
apps/api/src/integrations/integrations.ts:21 | [Playwright] { workflowCode: "W05", workflowName: "Playwright Trigger", targetState: "SAME", connectorKey: "playwright_probe_service", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Playwright scout/probe with MAP fallback." },
apps/api/src/integrations/integrations.ts:42 | [Playwright] export function buildPlaywrightProbeResult(input: { blockReason?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "RATE_LIMITED" | "LOGIN_REQUIRED" | "MANUAL_ONLY" | "UNKNOWN"; evidenceRefs: string[] }) { if (input.evidenceRefs.length === 0) throw new Error("PLAYWRIGHT_PROBE_EVIDENCE_REQUIRED"); const mapReasons = ["CAPTCHA", "OTP", "PORTAL_DOWN", "RATE_LIMITED", "LOGIN_REQUIRED", "MANUAL_ONLY"]; const mapRequired = Boolean(input.blockReason && mapReasons.includes(input.blockReason)); return { probeRef: `pr
apps/api/src/integrations/integrations.ts:9 | [playwright] export interface ConnectorFailure { sourceRef: string; sourceType: "OUTBOX" | "INBOX" | "WORKFLOW_RESULT" | "AIRTABLE_MIRROR" | "PLAYWRIGHT_PROBE" | "PAYFAST_EVENT" | "EMAIL_EVENT" | "OTHER"; connectorKey: string; severity: "INFO" | "WATCH" | "WARNING" | "CRITICAL"; cause: string; reason: string; fixPath: string; evidenceRefs: string[]; payload: Record<string, unknown>; }
apps/api/src/integrations/integrations.ts:21 | [playwright] { workflowCode: "W05", workflowName: "Playwright Trigger", targetState: "SAME", connectorKey: "playwright_probe_service", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Playwright scout/probe with MAP fallback." },
apps/api/src/integrations/integrations.ts:42 | [playwright] export function buildPlaywrightProbeResult(input: { blockReason?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "RATE_LIMITED" | "LOGIN_REQUIRED" | "MANUAL_ONLY" | "UNKNOWN"; evidenceRefs: string[] }) { if (input.evidenceRefs.length === 0) throw new Error("PLAYWRIGHT_PROBE_EVIDENCE_REQUIRED"); const mapReasons = ["CAPTCHA", "OTP", "PORTAL_DOWN", "RATE_LIMITED", "LOGIN_REQUIRED", "MANUAL_ONLY"]; const mapRequired = Boolean(input.blockReason && mapReasons.includes(input.blockReason)); return { probeRef: `pr
apps/api/src/integrations/integrations.ts:21 | [scout] { workflowCode: "W05", workflowName: "Playwright Trigger", targetState: "SAME", connectorKey: "playwright_probe_service", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Playwright scout/probe with MAP fallback." },
apps/api/src/integrations/integrations.ts:9 | [probe] export interface ConnectorFailure { sourceRef: string; sourceType: "OUTBOX" | "INBOX" | "WORKFLOW_RESULT" | "AIRTABLE_MIRROR" | "PLAYWRIGHT_PROBE" | "PAYFAST_EVENT" | "EMAIL_EVENT" | "OTHER"; connectorKey: string; severity: "INFO" | "WATCH" | "WARNING" | "CRITICAL"; cause: string; reason: string; fixPath: string; evidenceRefs: string[]; payload: Record<string, unknown>; }
apps/api/src/integrations/integrations.ts:21 | [probe] { workflowCode: "W05", workflowName: "Playwright Trigger", targetState: "SAME", connectorKey: "playwright_probe_service", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Playwright scout/probe with MAP fallback." },
apps/api/src/integrations/integrations.ts:42 | [probe] export function buildPlaywrightProbeResult(input: { blockReason?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "RATE_LIMITED" | "LOGIN_REQUIRED" | "MANUAL_ONLY" | "UNKNOWN"; evidenceRefs: string[] }) { if (input.evidenceRefs.length === 0) throw new Error("PLAYWRIGHT_PROBE_EVIDENCE_REQUIRED"); const mapReasons = ["CAPTCHA", "OTP", "PORTAL_DOWN", "RATE_LIMITED", "LOGIN_REQUIRED", "MANUAL_ONLY"]; const mapRequired = Boolean(input.blockReason && mapReasons.includes(input.blockReason)); return { probeRef: `pr
apps/api/src/integrations/integrations.ts:19 | [portal] { workflowCode: "W03", workflowName: "MSB Execute", targetState: "COMPLETED", connectorKey: "n8n_worker_gateway", sameStateWorker: false, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Execution worker; no portal bypass." },
apps/api/src/integrations/integrations.ts:42 | [portal] export function buildPlaywrightProbeResult(input: { blockReason?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "RATE_LIMITED" | "LOGIN_REQUIRED" | "MANUAL_ONLY" | "UNKNOWN"; evidenceRefs: string[] }) { if (input.evidenceRefs.length === 0) throw new Error("PLAYWRIGHT_PROBE_EVIDENCE_REQUIRED"); const mapReasons = ["CAPTCHA", "OTP", "PORTAL_DOWN", "RATE_LIMITED", "LOGIN_REQUIRED", "MANUAL_ONLY"]; const mapRequired = Boolean(input.blockReason && mapReasons.includes(input.blockReason)); return { probeRef: `pr
apps/api/src/integrations/integrations.ts:44 | [portal] export function assertWhatsAppUrgentOnly(channel: "EMAIL" | "WHATSAPP_URGENT" | "SMS_BACKUP" | "PORTAL", urgent: boolean): void { if (channel === "WHATSAPP_URGENT" && !urgent) throw new Error("WHATSAPP_CONNECTOR_URGENT_ONLY"); }
apps/api/src/integrations/integrations.ts:42 | [CAPTCHA] export function buildPlaywrightProbeResult(input: { blockReason?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "RATE_LIMITED" | "LOGIN_REQUIRED" | "MANUAL_ONLY" | "UNKNOWN"; evidenceRefs: string[] }) { if (input.evidenceRefs.length === 0) throw new Error("PLAYWRIGHT_PROBE_EVIDENCE_REQUIRED"); const mapReasons = ["CAPTCHA", "OTP", "PORTAL_DOWN", "RATE_LIMITED", "LOGIN_REQUIRED", "MANUAL_ONLY"]; const mapRequired = Boolean(input.blockReason && mapReasons.includes(input.blockReason)); return { probeRef: `pr
apps/api/src/integrations/integrations.ts:42 | [OTP] export function buildPlaywrightProbeResult(input: { blockReason?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "RATE_LIMITED" | "LOGIN_REQUIRED" | "MANUAL_ONLY" | "UNKNOWN"; evidenceRefs: string[] }) { if (input.evidenceRefs.length === 0) throw new Error("PLAYWRIGHT_PROBE_EVIDENCE_REQUIRED"); const mapReasons = ["CAPTCHA", "OTP", "PORTAL_DOWN", "RATE_LIMITED", "LOGIN_REQUIRED", "MANUAL_ONLY"]; const mapRequired = Boolean(input.blockReason && mapReasons.includes(input.blockReason)); return { probeRef: `pr
apps/api/src/integrations/integrations.ts:21 | [MAP fallback] { workflowCode: "W05", workflowName: "Playwright Trigger", targetState: "SAME", connectorKey: "playwright_probe_service", sameStateWorker: true, maxAirtableWrites: 1, maxBackendResultPosts: 1, doctrineNote: "Playwright scout/probe with MAP fallback." },
apps/api/src/kernel/command-envelope.ts:36 | [portal] source: "portal" | "control_plane" | "worker" | "jarvis" | "api" | "system";
apps/api/src/kernel/constitution-loader.ts:37 | [Playwright] playwrightScoutOnly: true;
apps/api/src/kernel/constitution-loader.ts:231 | [Playwright] assertEnvValue(checks, env, "KINGSMEN_PLAYWRIGHT_SCOUT_ONLY", "true", SOURCE_FILES.environmentTemplate);
apps/api/src/kernel/constitution-loader.ts:244 | [Playwright] assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.playwrightScoutOnly", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:playwright-scout-only" });
apps/api/src/kernel/constitution-loader.ts:260 | [Playwright] assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.playwrightScoutOnly", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:playwright-scout-only" });
apps/api/src/kernel/constitution-loader.ts:285 | [Playwright] playwrightScoutOnly: true,
apps/api/src/kernel/constitution-loader.ts:37 | [playwright] playwrightScoutOnly: true;
apps/api/src/kernel/constitution-loader.ts:231 | [playwright] assertEnvValue(checks, env, "KINGSMEN_PLAYWRIGHT_SCOUT_ONLY", "true", SOURCE_FILES.environmentTemplate);
apps/api/src/kernel/constitution-loader.ts:244 | [playwright] assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.playwrightScoutOnly", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:playwright-scout-only" });
apps/api/src/kernel/constitution-loader.ts:260 | [playwright] assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.playwrightScoutOnly", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:playwright-scout-only" });
apps/api/src/kernel/constitution-loader.ts:285 | [playwright] playwrightScoutOnly: true,
apps/api/src/kernel/constitution-loader.ts:37 | [scout] playwrightScoutOnly: true;
apps/api/src/kernel/constitution-loader.ts:231 | [scout] assertEnvValue(checks, env, "KINGSMEN_PLAYWRIGHT_SCOUT_ONLY", "true", SOURCE_FILES.environmentTemplate);
apps/api/src/kernel/constitution-loader.ts:244 | [scout] assertJsonBooleanLock(checks, { object: providerRegistry, dottedPath: "doctrine.playwrightScoutOnly", expected: true, source: "provider_registry", file: SOURCE_FILES.providerRegistry, name: "provider:playwright-scout-only" });
apps/api/src/kernel/constitution-loader.ts:260 | [scout] assertJsonBooleanLock(checks, { object: masterBuildIndex, dottedPath: "globalLocks.playwrightScoutOnly", expected: true, source: "master_build_index", file: SOURCE_FILES.masterBuildIndex, name: "master:playwright-scout-only" });
apps/api/src/kernel/constitution-loader.ts:285 | [scout] playwrightScoutOnly: true,
apps/api/src/observability/alert-router.ts:10 | [portal] targetChannel: "EMAIL" | "PORTAL" | "WHATSAPP_URGENT" | "SMS_BACKUP" | "CONTROL_PLANE";
apps/api/src/observability/founder-report-builder.ts:35 | [manual fallback] ...(input.health.failedWorkflows > 0 ? ["Review workflow failures and retry/manual fallback where safe"] : []),
apps/api/src/observability/observability-types.ts:16 | [Playwright] | "PLAYWRIGHT"
apps/api/src/observability/observability-types.ts:55 | [Playwright] | "PLAYWRIGHT"
apps/api/src/observability/observability-types.ts:81 | [Playwright] | "PLAYWRIGHT"
apps/api/src/observability/observability-types.ts:16 | [playwright] | "PLAYWRIGHT"
apps/api/src/observability/observability-types.ts:55 | [playwright] | "PLAYWRIGHT"
apps/api/src/observability/observability-types.ts:81 | [playwright] | "PLAYWRIGHT"
apps/api/src/observability/observability-types.ts:18 | [portal] | "PORTAL_HEALTH"
apps/api/src/observability/observability-types.ts:82 | [portal] | "PORTAL"
apps/api/src/observability/report-delivery.ts:6 | [portal] channel: "EMAIL" | "PORTAL" | "WHATSAPP_URGENT" | "SMS_BACKUP" | "CONTROL_PLANE";
apps/api/src/observability/workflow-observer.ts:38 | [manual fallback] fixPath: status === "FAILED" || status === "BLOCKED" ? "Route to retry, manual fallback, or operator review according to workflow policy." : "",
apps/api/src/opportunity/opportunity-engine.ts:215 | [portal] alertType: "OPENING" | "DEADLINE" | "STALE_SOURCE" | "SOURCE_CHANGE" | "REVIEW_REQUIRED" | "PORTAL_BLOCKED" | "RISK";
apps/api/src/opportunity/opportunity-engine.ts:226 | [portal] severity: input.alertType === "RISK" || input.alertType === "PORTAL_BLOCKED" ? "WARNING" : "WATCH",
apps/api/src/ops/observability-incident-proof-boundary.ts:63 | [browser] evidence: "Truth Vault connectivity must be checked from backend runtime, not browser routes."
apps/api/src/orchestrator/orchestrator-runtime.ts:29 | [Playwright] canDispatchPlaywright: boolean;
apps/api/src/orchestrator/orchestrator-runtime.ts:66 | [Playwright] { workerCode: "W00", workerName: "Template Registry", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:67 | [Playwright] { workerCode: "W01", workerName: "Kingsmen Intake Web", targetState: "EVALUATION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:68 | [Playwright] { workerCode: "W02", workerName: "MSB Evaluate", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:69 | [Playwright] { workerCode: "W03", workerName: "MSB Execute", targetState: "COMPLETED", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:70 | [Playwright] { workerCode: "W04", workerName: "MSB Govern", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:71 | [Playwright] { workerCode: "W05", workerName: "Playwright Trigger", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: true },
apps/api/src/orchestrator/orchestrator-runtime.ts:72 | [Playwright] { workerCode: "W06", workerName: "MSB Defer", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:73 | [Playwright] { workerCode: "W07", workerName: "Document Uploaded", targetState: "EXECUTION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:74 | [Playwright] { workerCode: "W08", workerName: "MSB Status", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:75 | [Playwright] { workerCode: "W09", workerName: "Comms Inbound", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:76 | [Playwright] { workerCode: "W10", workerName: "MSB Fee", targetState: "EXECUTION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:77 | [Playwright] { workerCode: "W11", workerName: "MSB Content", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:78 | [Playwright] { workerCode: "W12", workerName: "Outreach Inbound", targetState: "INTAKE_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:79 | [Playwright] { workerCode: "W13", workerName: "Social Generate", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:80 | [Playwright] { workerCode: "W14", workerName: "Analytics Request", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:81 | [Playwright] { workerCode: "W15", workerName: "System Insight Generator", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:82 | [Playwright] { workerCode: "W16", workerName: "Sovereign Kernel", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:83 | [Playwright] { workerCode: "W17", workerName: "Sovereign Kernel v2", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:84 | [Playwright] { workerCode: "W24", workerName: "W24 Command", targetState: "SAME", sameStateWorker: true, requiresW17Gate: true, requiresHumanApproval: true, canDispatchPlaywright: false }
apps/api/src/orchestrator/orchestrator-runtime.ts:213 | [Playwright] export function playwrightCanOnlyScout(): true {
apps/api/src/orchestrator/orchestrator-runtime.ts:29 | [playwright] canDispatchPlaywright: boolean;
apps/api/src/orchestrator/orchestrator-runtime.ts:66 | [playwright] { workerCode: "W00", workerName: "Template Registry", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:67 | [playwright] { workerCode: "W01", workerName: "Kingsmen Intake Web", targetState: "EVALUATION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:68 | [playwright] { workerCode: "W02", workerName: "MSB Evaluate", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:69 | [playwright] { workerCode: "W03", workerName: "MSB Execute", targetState: "COMPLETED", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:70 | [playwright] { workerCode: "W04", workerName: "MSB Govern", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:71 | [playwright] { workerCode: "W05", workerName: "Playwright Trigger", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: true },
apps/api/src/orchestrator/orchestrator-runtime.ts:72 | [playwright] { workerCode: "W06", workerName: "MSB Defer", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:73 | [playwright] { workerCode: "W07", workerName: "Document Uploaded", targetState: "EXECUTION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:74 | [playwright] { workerCode: "W08", workerName: "MSB Status", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:75 | [playwright] { workerCode: "W09", workerName: "Comms Inbound", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:76 | [playwright] { workerCode: "W10", workerName: "MSB Fee", targetState: "EXECUTION_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:77 | [playwright] { workerCode: "W11", workerName: "MSB Content", targetState: "DOCUMENT_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:78 | [playwright] { workerCode: "W12", workerName: "Outreach Inbound", targetState: "INTAKE_PENDING", sameStateWorker: false, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:79 | [playwright] { workerCode: "W13", workerName: "Social Generate", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:80 | [playwright] { workerCode: "W14", workerName: "Analytics Request", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: false, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:81 | [playwright] { workerCode: "W15", workerName: "System Insight Generator", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:82 | [playwright] { workerCode: "W16", workerName: "Sovereign Kernel", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:83 | [playwright] { workerCode: "W17", workerName: "Sovereign Kernel v2", targetState: "SAME", sameStateWorker: true, requiresW17Gate: false, requiresHumanApproval: true, canDispatchPlaywright: false },
apps/api/src/orchestrator/orchestrator-runtime.ts:84 | [playwright] { workerCode: "W24", workerName: "W24 Command", targetState: "SAME", sameStateWorker: true, requiresW17Gate: true, requiresHumanApproval: true, canDispatchPlaywright: false }
apps/api/src/orchestrator/orchestrator-runtime.ts:213 | [playwright] export function playwrightCanOnlyScout(): true {
apps/api/src/orchestrator/orchestrator-runtime.ts:213 | [scout] export function playwrightCanOnlyScout(): true {
apps/api/src/orchestrator/orchestrator-runtime.ts:188 | [portal] portalIssue?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "MANUAL_ONLY";
apps/api/src/orchestrator/orchestrator-runtime.ts:192 | [portal] const handoffType = input.portalIssue ?? "MAP";
apps/api/src/orchestrator/orchestrator-runtime.ts:188 | [CAPTCHA] portalIssue?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "MANUAL_ONLY";
apps/api/src/orchestrator/orchestrator-runtime.ts:188 | [OTP] portalIssue?: "CAPTCHA" | "OTP" | "PORTAL_DOWN" | "MANUAL_ONLY";
apps/api/src/orchestrator/orchestrator-runtime.ts:199 | [Manual Application Package] ? "Create Manual Application Package with verified link, steps, fees, requirements, and evidence."
apps/api/src/policy/policy-middleware.ts:40 | [CAPTCHA] reasons.push("Official submission actions must be evidence-ledgered and never bypass CAPTCHA/OTP.");
apps/api/src/policy/policy-middleware.ts:40 | [OTP] reasons.push("Official submission actions must be evidence-ledgered and never bypass CAPTCHA/OTP.");
apps/api/src/public-website/content-guardrails.ts:22 | [portal] if (lower.includes("we are nsfas") || lower.includes("we are cao") || lower.includes("official government portal")) {
apps/api/src/public-website/content-guardrails.ts:38 | [portal] const leakMarkers = ["exact portal link", "sealed target", "manual route plan unlocked for free"];
apps/api/src/public-website/destiny-map-preview.ts:16 | [portal] "portal links",
apps/api/src/public-website/package-boundaries.ts:14 | [portal] "All-sector preview only. Exact targets, links, portals, manual route plans, bursary targets, and accommodation targets remain sealed until package activation."
apps/api/src/public-website/sector-universe.ts:5 | [portal] { sectorKey: "TVET", sectorName: "TVET Colleges", sectorGroup: "EDUCATION", publicDescription: "TVET route visibility, programme fit, document readiness, campus/portal awareness, and fallback support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
apps/api/src/public-website/source-disclosures.ts:4 | [portal] title: "Not an official portal",
apps/api/src/public-website/source-disclosures.ts:5 | [portal] text: "Kingsmen is a private route command house. Kingsmen is not an official university, TVET, SETA, NSFAS, CAO, employer, bursary provider, accommodation provider, payment provider, or government portal."
apps/api/src/public-website/website-read-model.ts:13 | [portal] "Kingsmen is not an official portal.",
apps/api/src/read-models/candidate-read-model.ts:21 | [portal] portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/read-models/candidate-read-model.ts:21 | [CAPTCHA] portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/read-models/candidate-read-model.ts:21 | [OTP] portalHealth: "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/routes/application-workbench.ts:30 | [portal] portalHealthStatus: input.readiness.portalHealthStatus,
apps/api/src/routes/index.ts:3 | [portal] export * from "./portal-health";
apps/api/src/routes/map-fallback.ts:4 | [portal] | "PORTAL_DOWN"
apps/api/src/routes/map-fallback.ts:46 | [portal] "Confirm programme, fee, deadline, requirements, and portal status.",
apps/api/src/routes/map-fallback.ts:3 | [CAPTCHA] | "CAPTCHA_BLOCKED"
apps/api/src/routes/map-fallback.ts:2 | [OTP] | "OTP_REQUIRED"
apps/api/src/routes/map-fallback.ts:9 | [Manual Application Package] export const MAP_FALLBACK_LABEL = "Manual Application Package";
apps/api/src/routes/portal-health.ts:1 | [portal] import type { PortalHealthStatus } from "./route-types";
apps/api/src/routes/portal-health.ts:3 | [portal] export interface PortalHealthInput {
apps/api/src/routes/portal-health.ts:11 | [portal] export interface PortalHealthDecision {
apps/api/src/routes/portal-health.ts:12 | [portal] status: PortalHealthStatus;
apps/api/src/routes/portal-health.ts:14 | [portal] reasonCode?: "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "PORTAL_DOWN" | "MANUAL_ONLY";
apps/api/src/routes/portal-health.ts:18 | [portal] export function evaluatePortalHealth(input: PortalHealthInput): PortalHealthDecision {
apps/api/src/routes/portal-health.ts:42 | [portal] message: "Portal is manual-only. Route to Manual Application Package fallback."
apps/api/src/routes/portal-health.ts:50 | [portal] reasonCode: "PORTAL_DOWN",
apps/api/src/routes/portal-health.ts:51 | [portal] message: "Portal appears down. Route to Manual Application Package fallback."
apps/api/src/routes/portal-health.ts:59 | [portal] message: "Portal appears open."
apps/api/src/routes/portal-health.ts:66 | [portal] message: "Portal health is unknown and should be checked before execution."
apps/api/src/routes/portal-health.ts:6 | [CAPTCHA] captchaDetected?: boolean;
apps/api/src/routes/portal-health.ts:14 | [CAPTCHA] reasonCode?: "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "PORTAL_DOWN" | "MANUAL_ONLY";
apps/api/src/routes/portal-health.ts:28 | [CAPTCHA] if (input.captchaDetected) {
apps/api/src/routes/portal-health.ts:30 | [CAPTCHA] status: "CAPTCHA_BLOCKED",
apps/api/src/routes/portal-health.ts:32 | [CAPTCHA] reasonCode: "CAPTCHA_BLOCKED",
apps/api/src/routes/portal-health.ts:33 | [CAPTCHA] message: "CAPTCHA detected. Route to Manual Application Package fallback."
apps/api/src/routes/portal-health.ts:5 | [OTP] otpDetected?: boolean;
apps/api/src/routes/portal-health.ts:14 | [OTP] reasonCode?: "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "PORTAL_DOWN" | "MANUAL_ONLY";
apps/api/src/routes/portal-health.ts:19 | [OTP] if (input.otpDetected) {
apps/api/src/routes/portal-health.ts:21 | [OTP] status: "OTP_REQUIRED",
apps/api/src/routes/portal-health.ts:23 | [OTP] reasonCode: "OTP_REQUIRED",
apps/api/src/routes/portal-health.ts:24 | [OTP] message: "OTP required. Route to Manual Application Package fallback."
apps/api/src/routes/portal-health.ts:24 | [Manual Application Package] message: "OTP required. Route to Manual Application Package fallback."
apps/api/src/routes/portal-health.ts:33 | [Manual Application Package] message: "CAPTCHA detected. Route to Manual Application Package fallback."
apps/api/src/routes/portal-health.ts:42 | [Manual Application Package] message: "Portal is manual-only. Route to Manual Application Package fallback."
apps/api/src/routes/portal-health.ts:51 | [Manual Application Package] message: "Portal appears down. Route to Manual Application Package fallback."
apps/api/src/routes/route-readiness.ts:1 | [portal] import type { PortalHealthStatus, RouteAvailabilityStatus, RouteReadinessStatus, RouteVerificationStatus, SourceConfidenceBand } from "./route-types";
apps/api/src/routes/route-readiness.ts:7 | [portal] portalHealthStatus: PortalHealthStatus;
apps/api/src/routes/route-readiness.ts:51 | [portal] if (["OTP_REQUIRED", "CAPTCHA_BLOCKED", "DOWN", "MANUAL_ONLY"].includes(input.portalHealthStatus)) {
apps/api/src/routes/route-readiness.ts:53 | [portal] blockers.push(`PORTAL_${input.portalHealthStatus}`);
apps/api/src/routes/route-readiness.ts:51 | [CAPTCHA] if (["OTP_REQUIRED", "CAPTCHA_BLOCKED", "DOWN", "MANUAL_ONLY"].includes(input.portalHealthStatus)) {
apps/api/src/routes/route-readiness.ts:51 | [OTP] if (["OTP_REQUIRED", "CAPTCHA_BLOCKED", "DOWN", "MANUAL_ONLY"].includes(input.portalHealthStatus)) {
apps/api/src/routes/route-readiness.ts:54 | [Manual Application Package] nextActions.push("Generate Manual Application Package fallback.");
apps/api/src/routes/route-types.ts:16 | [portal] export type PortalHealthStatus = "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/routes/route-types.ts:36 | [portal] applicationMethod: "DIRECT_PORTAL" | "CAO" | "NSFAS" | "EMAIL" | "MANUAL" | "JOB_BOARD" | "UNKNOWN";
apps/api/src/routes/route-types.ts:53 | [portal] portalHealthStatus: PortalHealthStatus;
apps/api/src/routes/route-types.ts:16 | [CAPTCHA] export type PortalHealthStatus = "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/routes/route-types.ts:16 | [OTP] export type PortalHealthStatus = "OPEN" | "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "DOWN" | "MANUAL_ONLY" | "UNKNOWN";
apps/api/src/routes/route-universe-repository.ts:28 | [Manual Application Package] message: "Manual Application Package prepared for fallback execution."
apps/api/src/server.ts:140 | [portal] portalHealth: existing?.portalHealth ?? "UNKNOWN",
apps/api/src/server.ts:172 | [portal] portalHealth: result.status === "FAILED" ? "UNKNOWN" : existing?.portalHealth ?? "UNKNOWN",
apps/api/src/system/kingsmen-operating-system-spine.ts:15 | [Playwright] | "PLAYWRIGHT_SCOUT"
apps/api/src/system/kingsmen-operating-system-spine.ts:271 | [Playwright] purpose: "Dispatches safe work to n8n, Playwright scout, MAP fallback, Phoenix fallback, and operator queues.",
apps/api/src/system/kingsmen-operating-system-spine.ts:275 | [Playwright] toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
apps/api/src/system/kingsmen-operating-system-spine.ts:345 | [Playwright] { command: "FORCE_PORTAL_AUTOMATION", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Playwright is scout only; blocked portals require MAP/manual fallback." },
apps/api/src/system/kingsmen-operating-system-spine.ts:15 | [playwright] | "PLAYWRIGHT_SCOUT"
apps/api/src/system/kingsmen-operating-system-spine.ts:271 | [playwright] purpose: "Dispatches safe work to n8n, Playwright scout, MAP fallback, Phoenix fallback, and operator queues.",
apps/api/src/system/kingsmen-operating-system-spine.ts:275 | [playwright] toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
apps/api/src/system/kingsmen-operating-system-spine.ts:345 | [playwright] { command: "FORCE_PORTAL_AUTOMATION", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Playwright is scout only; blocked portals require MAP/manual fallback." },
apps/api/src/system/kingsmen-operating-system-spine.ts:15 | [scout] | "PLAYWRIGHT_SCOUT"
apps/api/src/system/kingsmen-operating-system-spine.ts:271 | [scout] purpose: "Dispatches safe work to n8n, Playwright scout, MAP fallback, Phoenix fallback, and operator queues.",
apps/api/src/system/kingsmen-operating-system-spine.ts:275 | [scout] toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
apps/api/src/system/kingsmen-operating-system-spine.ts:345 | [scout] { command: "FORCE_PORTAL_AUTOMATION", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Playwright is scout only; blocked portals require MAP/manual fallback." },
apps/api/src/system/kingsmen-operating-system-spine.ts:114 | [portal] name: "Candidate Portal and Support Centre",
apps/api/src/system/kingsmen-operating-system-spine.ts:275 | [portal] toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
apps/api/src/system/kingsmen-operating-system-spine.ts:279 | [portal] launchBlockers: ["forced portal automation", "no MAP fallback", "no workflow evidence"]
apps/api/src/system/kingsmen-operating-system-spine.ts:310 | [portal] purpose: "Provides mobile-first candidate access, offline-friendly evidence, and accessible portal flows.",
apps/api/src/system/kingsmen-operating-system-spine.ts:311 | [portal] appSurface: ["PWA", "mobile portal", "offline status"],
apps/api/src/system/kingsmen-operating-system-spine.ts:345 | [portal] { command: "FORCE_PORTAL_AUTOMATION", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Playwright is scout only; blocked portals require MAP/manual fallback." },
apps/api/src/system/kingsmen-operating-system-spine.ts:275 | [CAPTCHA] toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
apps/api/src/system/kingsmen-operating-system-spine.ts:275 | [OTP] toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
apps/api/src/system/kingsmen-operating-system-spine.ts:143 | [Manual Application Package] truthSurface: ["route sources", "application child items", "manual application package evidence"],
apps/api/src/system/kingsmen-operating-system-spine.ts:271 | [MAP fallback] purpose: "Dispatches safe work to n8n, Playwright scout, MAP fallback, Phoenix fallback, and operator queues.",
apps/api/src/system/kingsmen-operating-system-spine.ts:279 | [MAP fallback] launchBlockers: ["forced portal automation", "no MAP fallback", "no workflow evidence"]
apps/api/src/system/kingsmen-operating-system-spine.ts:271 | [Phoenix fallback] purpose: "Dispatches safe work to n8n, Playwright scout, MAP fallback, Phoenix fallback, and operator queues.",
apps/api/src/system/kingsmen-operating-system-spine.ts:273 | [Phoenix fallback] truthSurface: ["workflow result ledger", "MAP evidence", "Phoenix fallback evidence"],
apps/api/src/system/kingsmen-operating-system-spine.ts:149 | [manual fallback] launchBlockers: ["fake institution data", "missing source confidence", "no manual fallback"]
apps/api/src/system/kingsmen-operating-system-spine.ts:272 | [manual fallback] appSurface: ["workflow queue", "worker dispatch", "manual fallback"],
apps/api/src/system/kingsmen-operating-system-spine.ts:345 | [manual fallback] { command: "FORCE_PORTAL_AUTOMATION", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Playwright is scout only; blocked portals require MAP/manual fallback." },
apps/api/src/system/kingsmen-operating-system-spine.ts:275 | [automation] toolBoundary: "Playwright scouts only; CAPTCHA/OTP/portal failure creates MAP instead of forcing automation.",
apps/api/src/system/kingsmen-operating-system-spine.ts:279 | [automation] launchBlockers: ["forced portal automation", "no MAP fallback", "no workflow evidence"]
apps/api/src/system/kingsmen-operating-system-spine.ts:345 | [automation] { command: "FORCE_PORTAL_AUTOMATION", allowed: false, requiresFounderApproval: true, evidenceRequired: true, deniedReason: "Playwright is scout only; blocked portals require MAP/manual fallback." },
apps/web/jarvis-os/jarvis-os.html:65 | [Playwright] <section class="panel"><h2>Route Universe</h2><div class="routeMap"></div><div class="tabs"><button class="ghost" onclick="run('Route Universe CAO NSFAS TVET SETA employers')">SCAN ROUTES</button><button class="ghost" onclick="run('Playwright Scout')">PLAYWRIGHT</button></div></section>
apps/web/jarvis-os/jarvis-os.html:81 | [Playwright] <button class="ghost" onclick="run('Playwright Scout')">PLAYWRIGHT</button>
apps/web/jarvis-os/jarvis-os.html:122 | [Playwright] ["3","Playwright Scout","Probe · Manual Fallback · MAP Boundary","SCOUT","Playwright Scout"],
apps/web/jarvis-os/jarvis-os.html:135 | [Playwright] el("context").innerHTML = ["Session Context · 23k tokens","Memory Rules · Enforced","OpenClaw · Connected","Playwright · Scout","Oracle Lite · Local"].map(x=>`<div><span>${x}</span><b>ACTIVE</b></div>`).join("");
apps/web/jarvis-os/jarvis-os.html:65 | [playwright] <section class="panel"><h2>Route Universe</h2><div class="routeMap"></div><div class="tabs"><button class="ghost" onclick="run('Route Universe CAO NSFAS TVET SETA employers')">SCAN ROUTES</button><button class="ghost" onclick="run('Playwright Scout')">PLAYWRIGHT</button></div></section>
apps/web/jarvis-os/jarvis-os.html:81 | [playwright] <button class="ghost" onclick="run('Playwright Scout')">PLAYWRIGHT</button>
apps/web/jarvis-os/jarvis-os.html:122 | [playwright] ["3","Playwright Scout","Probe · Manual Fallback · MAP Boundary","SCOUT","Playwright Scout"],
apps/web/jarvis-os/jarvis-os.html:135 | [playwright] el("context").innerHTML = ["Session Context · 23k tokens","Memory Rules · Enforced","OpenClaw · Connected","Playwright · Scout","Oracle Lite · Local"].map(x=>`<div><span>${x}</span><b>ACTIVE</b></div>`).join("");
apps/web/jarvis-os/jarvis-os.html:65 | [scout] <section class="panel"><h2>Route Universe</h2><div class="routeMap"></div><div class="tabs"><button class="ghost" onclick="run('Route Universe CAO NSFAS TVET SETA employers')">SCAN ROUTES</button><button class="ghost" onclick="run('Playwright Scout')">PLAYWRIGHT</button></div></section>
apps/web/jarvis-os/jarvis-os.html:81 | [scout] <button class="ghost" onclick="run('Playwright Scout')">PLAYWRIGHT</button>
apps/web/jarvis-os/jarvis-os.html:122 | [scout] ["3","Playwright Scout","Probe · Manual Fallback · MAP Boundary","SCOUT","Playwright Scout"],
apps/web/jarvis-os/jarvis-os.html:135 | [scout] el("context").innerHTML = ["Session Context · 23k tokens","Memory Rules · Enforced","OpenClaw · Connected","Playwright · Scout","Oracle Lite · Local"].map(x=>`<div><span>${x}</span><b>ACTIVE</b></div>`).join("");
apps/web/jarvis-os/jarvis-os.html:122 | [probe] ["3","Playwright Scout","Probe · Manual Fallback · MAP Boundary","SCOUT","Playwright Scout"],
apps/web/jarvis-os/jarvis-os.html:99 | [portal] WATCH · portal behavior changed
apps/web/jarvis-os/jarvis-os.html:101 | [MAP fallback] BLOCK · MAP fallback required</pre></section>
apps/web/jarvis-os/jarvis-os.html:122 | [manual fallback] ["3","Playwright Scout","Probe · Manual Fallback · MAP Boundary","SCOUT","Playwright Scout"],
apps/web/jarvis-os/jarvis-os.html:156 | [browser] add("JARVIS","BROWSER FALLBACK","Jarvis OS command surface responded locally. API fallback used.");
apps/web/jarvis-os/jarvis-os.html:157 | [browser] el("output").textContent="Browser fallback. Command remains visible and routed in the UI.";
apps/web/netlify/functions/jarvis-agent.cjs:68 | [Playwright] if (text.includes("playwright")) {
apps/web/netlify/functions/jarvis-agent.cjs:69 | [Playwright] return response("PLAYWRIGHT_SCOUT", "Playwright Scout selected. It is a probe/scout, not a bypass engine.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:70 | [Playwright] "PLAYWRIGHT SCOUT",
apps/web/netlify/functions/jarvis-agent.cjs:148 | [Playwright] "- Playwright scout only; MAP fallback on blocks.",
apps/web/netlify/functions/jarvis-agent.cjs:164 | [Playwright] return response("COMMAND_RECEIVED", "Command received by live Jarvis OS. Select a module or type OpenClaw, Playwright, Oracle Lite, N00-N20, Candidate Ops, Route Universe, Provider Matrix, Evidence, or Founder Command.", "Jarvis OS is live. This command is routed to the command console.");
apps/web/netlify/functions/jarvis-agent.cjs:68 | [playwright] if (text.includes("playwright")) {
apps/web/netlify/functions/jarvis-agent.cjs:69 | [playwright] return response("PLAYWRIGHT_SCOUT", "Playwright Scout selected. It is a probe/scout, not a bypass engine.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:70 | [playwright] "PLAYWRIGHT SCOUT",
apps/web/netlify/functions/jarvis-agent.cjs:148 | [playwright] "- Playwright scout only; MAP fallback on blocks.",
apps/web/netlify/functions/jarvis-agent.cjs:164 | [playwright] return response("COMMAND_RECEIVED", "Command received by live Jarvis OS. Select a module or type OpenClaw, Playwright, Oracle Lite, N00-N20, Candidate Ops, Route Universe, Provider Matrix, Evidence, or Founder Command.", "Jarvis OS is live. This command is routed to the command console.");
apps/web/netlify/functions/jarvis-agent.cjs:69 | [scout] return response("PLAYWRIGHT_SCOUT", "Playwright Scout selected. It is a probe/scout, not a bypass engine.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:70 | [scout] "PLAYWRIGHT SCOUT",
apps/web/netlify/functions/jarvis-agent.cjs:148 | [scout] "- Playwright scout only; MAP fallback on blocks.",
apps/web/netlify/functions/jarvis-agent.cjs:69 | [probe] return response("PLAYWRIGHT_SCOUT", "Playwright Scout selected. It is a probe/scout, not a bypass engine.", lines([
apps/web/netlify/functions/jarvis-agent.cjs:71 | [selector] "- Purpose: inspect public routes, forms, selectors, and accessibility.",
apps/web/netlify/functions/jarvis-agent.cjs:72 | [selector] "- CAPTCHA/OTP/portal blocked/selector failure: create Manual Application Package.",
apps/web/netlify/functions/jarvis-agent.cjs:72 | [portal] "- CAPTCHA/OTP/portal blocked/selector failure: create Manual Application Package.",
apps/web/netlify/functions/jarvis-agent.cjs:73 | [portal] "- No credential bypass. No hidden portal abuse.",
apps/web/netlify/functions/jarvis-agent.cjs:110 | [portal] "- Phoenix / MAP fallback where portals block automation."
apps/web/netlify/functions/jarvis-agent.cjs:72 | [CAPTCHA] "- CAPTCHA/OTP/portal blocked/selector failure: create Manual Application Package.",
apps/web/netlify/functions/jarvis-agent.cjs:72 | [OTP] "- CAPTCHA/OTP/portal blocked/selector failure: create Manual Application Package.",
apps/web/netlify/functions/jarvis-agent.cjs:72 | [Manual Application Package] "- CAPTCHA/OTP/portal blocked/selector failure: create Manual Application Package.",
apps/web/netlify/functions/jarvis-agent.cjs:74 | [MAP fallback] "- MAP fallback remains the safety net."
apps/web/netlify/functions/jarvis-agent.cjs:110 | [MAP fallback] "- Phoenix / MAP fallback where portals block automation."
apps/web/netlify/functions/jarvis-agent.cjs:148 | [MAP fallback] "- Playwright scout only; MAP fallback on blocks.",
apps/web/netlify/functions/jarvis-agent.cjs:72 | [portal blocked] "- CAPTCHA/OTP/portal blocked/selector failure: create Manual Application Package.",
apps/web/netlify/functions/jarvis-agent.cjs:110 | [automation] "- Phoenix / MAP fallback where portals block automation."
apps/web/package-lock.json:15 | [Playwright] "playwright": "^1.60.0",
apps/web/package-lock.json:1123 | [Playwright] "@playwright/test": "^1.51.1",
apps/web/package-lock.json:1133 | [Playwright] "@playwright/test": {
apps/web/package-lock.json:1203 | [Playwright] "node_modules/playwright": {
apps/web/package-lock.json:1205 | [Playwright] "resolved": "https://registry.npmjs.org/playwright/-/playwright-1.60.0.tgz",
apps/web/package-lock.json:1209 | [Playwright] "playwright-core": "1.60.0"
apps/web/package-lock.json:1212 | [Playwright] "playwright": "cli.js"
apps/web/package-lock.json:1221 | [Playwright] "node_modules/playwright-core": {
apps/web/package-lock.json:1223 | [Playwright] "resolved": "https://registry.npmjs.org/playwright-core/-/playwright-core-1.60.0.tgz",
apps/web/package-lock.json:1227 | [Playwright] "playwright-core": "cli.js"
apps/web/package-lock.json:15 | [playwright] "playwright": "^1.60.0",
apps/web/package-lock.json:1123 | [playwright] "@playwright/test": "^1.51.1",
apps/web/package-lock.json:1133 | [playwright] "@playwright/test": {
apps/web/package-lock.json:1203 | [playwright] "node_modules/playwright": {
apps/web/package-lock.json:1205 | [playwright] "resolved": "https://registry.npmjs.org/playwright/-/playwright-1.60.0.tgz",
apps/web/package-lock.json:1209 | [playwright] "playwright-core": "1.60.0"
apps/web/package-lock.json:1212 | [playwright] "playwright": "cli.js"
apps/web/package-lock.json:1221 | [playwright] "node_modules/playwright-core": {
apps/web/package-lock.json:1223 | [playwright] "resolved": "https://registry.npmjs.org/playwright-core/-/playwright-core-1.60.0.tgz",
apps/web/package-lock.json:1227 | [playwright] "playwright-core": "cli.js"
apps/web/package-lock.json:1264 | [OTP] "integrity": "sha512-3ouUOpQhtgrbOa17J7+uxOTpITYWaGP7/AhoR3+A+/1e9skrzelGi/dXzEYyvbxubEF6Wn2ypscTKiKJFFn1ag==",
apps/web/package-lock.json:925 | [browser] "url": "https://opencollective.com/browserslist"
apps/web/package.json:16 | [Playwright] "playwright": "^1.60.0",
apps/web/package.json:16 | [playwright] "playwright": "^1.60.0",
apps/web/scripts/build-jarvis-luxury.cjs:215 | [selector] document.querySelectorAll("[data-cmd]").forEach(b => b.addEventListener("click", () => { input.value = b.dataset.cmd; run(input.value); }));
apps/web/scripts/build-jarvis-luxury.cjs:172 | [manual fallback] <p>Kingsmen is not CAO-only. It covers admissions, funding, opportunity, skills, employment, operations, proof, manual fallbacks, and controlled provider integrations.</p>
apps/web/scripts/build-jarvis-luxury.cjs:198 | [browser] if(t.includes("kingsmen")) return { tool:"KINGSMEN_DOCTRINE · BROWSER", reply:"Kingsmen is the Commander platform: South African admissions, funding, opportunity, skills, employment, operations, and proof.", stdout:"Browser fallback active. Doctrine remains available even if the API is temporarily blocked." };
apps/web/scripts/build-jarvis-luxury.cjs:199 | [browser] if(t.includes("connected") || t.includes("provider") || t.includes("tool")) return { tool:"PROVIDER_REGISTRY · BROWSER", reply:"Providers are registry-loaded and adapter-gated until credentials and evidence logs exist.", stdout:"GitHub, Netlify, Drive, Gmail, Calendar, Airtable, Neon, Supabase, Canva, OpenAI, and other providers are represented in Jarvis." };
apps/web/scripts/build-jarvis-luxury.cjs:200 | [browser] return { tool:"COMMAND_RECEIVED · BROWSER", reply:"Command received by live Jarvis.", stdout:"Browser fallback responding." };
apps/web/scripts/build-static-jarvis.cjs:222 | [selector] document.querySelectorAll("[data-cmd]").forEach(function (button) {
apps/web/scripts/build-static-jarvis.cjs:212 | [browser] add("JARVIS", payload.tool + " · BROWSER FALLBACK", payload.reply, payload.stdout + "\\n\\nAPI fallback used because: " + error.message);
apps/web/src/ai-decision/DestinyMapPanel.tsx:7 | [portal] Free Destiny Map shows sector direction only. Exact institution, company, portal, programme, bursary, accommodation targets and manual route links stay sealed until package activation.
apps/web/src/ai-decision/MatchingWorkbenchPanel.tsx:7 | [portal] Candidate signals, route source confidence, portal health, document readiness, academic fit, funding, accommodation, and deadlines are scored before route recommendations move to human review.
apps/web/src/ai-decision/PhoenixFallbackPanel.tsx:4 | [Phoenix fallback] <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phoenix Fallback</p>
apps/web/src/ai-decision/PhoenixFallbackPanel.tsx:7 | [Phoenix fallback] Phoenix fallback only proposes evidence-backed alternative routes after failure. It requires human review and cannot pretend rescue exists when source confidence or route evidence is weak.
apps/web/src/airtable-sync/AirtableSyncPanel.tsx:12 | [automation] "Automation Control",
apps/web/src/app/api/candidate/documents/read-url/route.ts:22 | [browser] serviceRoleVisibleToBrowser: false,
apps/web/src/app/api/candidate/documents/status/route.ts:7 | [browser] serviceRoleVisibleToBrowser: false,
apps/web/src/app/api/candidate/documents/upload-url/route.ts:22 | [browser] serviceRoleVisibleToBrowser: false,
apps/web/src/app/api/candidate/workbench/cao-optimizer/route.ts:20 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/candidate/workbench/choice-optimizer/route.ts:21 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/candidate/workbench/readiness/route.ts:21 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/airtable/health/route.ts:15 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts:22 | [browser] serviceRoleVisibleToBrowser: false,
apps/web/src/app/api/founder/alerts/mobile/route.ts:23 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/commands/approve/route.ts:24 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/commands/execute/route.ts:24 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/control-plane/health/route.ts:11 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/digest/route.ts:10 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/documents/review/route.ts:23 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/founder/stop-selling/route.ts:23 | [browser] serviceRoleVisibleToBrowser: false
apps/web/src/app/api/jarvis/agent/route.ts:55 | [Playwright] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:55 | [playwright] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:55 | [scout] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:42 | [probe] if (text.includes("build") || text.includes("validate") || text.includes("database") || text.includes("postgres") || text.includes("git") || text.includes("powershell") || text.includes("create file") || text.includes("route probe")) return "LOCAL_COMMAND_BOUNDARY";
apps/web/src/app/api/jarvis/agent/route.ts:55 | [probe] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:55 | [selector] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:55 | [portal] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:55 | [CAPTCHA] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:55 | [OTP] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:55 | [Manual Application Package] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
apps/web/src/app/api/jarvis/agent/route.ts:53 | [manual fallback] "- Not CAO-only. CAO, NSFAS, universities, TVETs, SETA/QCTO, bursaries, employers, and manual fallback routes remain in scope.",
apps/web/src/app/api/jarvis/command/route.ts:72 | [portal] CANDIDATE_PORTAL_CHECK: {
apps/web/src/app/api/jarvis/command/route.ts:73 | [portal] title: "Candidate portal check",
apps/web/src/app/api/jarvis/command/route.ts:76 | [portal] backendAction: "candidate_portal_check"
apps/web/src/app/api/jarvis/command/route.ts:55 | [manual fallback] title: "Manual fallback review",
apps/web/src/app/api/jarvis/evidence-missing/route.ts:19 | [OTP] assumptionsAreNotProof: true,
apps/web/src/app/api/jarvis/payfast/route.ts:17 | [OTP] checkoutIntentIsNotPaymentSuccess: true,
apps/web/src/app/api/jarvis/postgresql/route.ts:39 | [Playwright] playwrightIsScoutOnly: true,
apps/web/src/app/api/jarvis/postgresql/route.ts:39 | [playwright] playwrightIsScoutOnly: true,
apps/web/src/app/api/jarvis/postgresql/route.ts:39 | [scout] playwrightIsScoutOnly: true,
apps/web/src/app/api/jarvis/postgresql/route.ts:6 | [probe] databaseConnection: 'not_proven_without_live_database_url_and_runtime_probe';
apps/web/src/app/api/jarvis/postgresql/route.ts:19 | [probe] databaseConnection: 'not_proven_without_live_database_url_and_runtime_probe',
apps/web/src/app/api/jarvis/status/route.ts:16 | [portal] { id: "CANDIDATE_PORTAL_CHECK", title: "Candidate portal check", description: "Requests a backend-led candidate portal check.", category: "Web", risk: "SAFE_READ" },
apps/web/src/app/api/jarvis/status/route.ts:13 | [Phoenix fallback] { id: "MANUAL_FALLBACK_REVIEW", title: "Manual fallback review", description: "Requests a backend-led MAP and Phoenix fallback review.", category: "Operations", risk: "SAFE_READ" },
apps/web/src/app/api/jarvis/status/route.ts:13 | [manual fallback] { id: "MANUAL_FALLBACK_REVIEW", title: "Manual fallback review", description: "Requests a backend-led MAP and Phoenix fallback review.", category: "Operations", risk: "SAFE_READ" },
apps/web/src/app/api/jarvis/system-stable/route.ts:19 | [OTP] observationIsNotProductionCompletion: true,
apps/web/src/app/api/jarvis/v5/script-library/route.ts:16 | [Playwright] ['13', 'When the Commander Asks About Playwright', 'playwright_scout'],
apps/web/src/app/api/jarvis/v5/script-library/route.ts:48 | [Playwright] playwrightScoutOnly: true,
apps/web/src/app/api/jarvis/v5/script-library/route.ts:16 | [playwright] ['13', 'When the Commander Asks About Playwright', 'playwright_scout'],
apps/web/src/app/api/jarvis/v5/script-library/route.ts:48 | [playwright] playwrightScoutOnly: true,
apps/web/src/app/api/jarvis/v5/script-library/route.ts:16 | [scout] ['13', 'When the Commander Asks About Playwright', 'playwright_scout'],
apps/web/src/app/api/jarvis/v5/script-library/route.ts:48 | [scout] playwrightScoutOnly: true,
apps/web/src/app/api/personal-jobs/apply-now/route.ts:470 | [portal] applicationMethod: String(opportunity.applicationMethod || "PORTAL"),
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:17 | [scout] const OUT = path.join(DATA_DIR, "scouted-opportunities.local.json");
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:33 | [scout] function defaultScout() {
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:35 | [scout] schema: "kingsmen.personal-jobs-35.opportunity-scout.v1",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:46 | [scout] nextAction: "Run scout. If a website blocks automation, open the source manually from this page."
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:77 | [scout] scoutStatus: "OPEN_AND_REVIEW",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:91 | [scout] scoutStatus: "OPEN_AND_REVIEW",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:105 | [scout] scoutStatus: "OPEN_AND_REVIEW",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:119 | [scout] scoutStatus: "LOGIN_OR_MANUAL_REVIEW_REQUIRED",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:133 | [scout] scoutStatus: "LOGIN_OR_MANUAL_REVIEW_REQUIRED",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:147 | [scout] scoutStatus: "OPEN_AND_REVIEW",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:157 | [scout] return NextResponse.json(readJson(OUT, defaultScout()));
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:160 | [scout] ...defaultScout(),
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:172 | [scout] if (action === "runScout") {
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:177 | [scout] const script = path.join(ROOT, "scripts", "agents", "personal-job-opportunity-scout.mjs");
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:184 | [scout] status: lead.scoutStatus,
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:212 | [scout] diagnostics.push("Scout agent file missing. Used safe live-source cards.");
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:216 | [scout] schema: "kingsmen.personal-jobs-35.opportunity-scout.v1",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:218 | [scout] status: "SCOUT_READY",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:245 | [scout] const scout = readJson(OUT, defaultScout());
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:246 | [scout] const lead = (scout.leads || []).find((x: any) => x.leadId === leadId);
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:251 | [scout] error: "Lead not found. Run scout again."
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:271 | [scout] status: "IMPORTED_BY_SCOUT",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:282 | [scout] scout.leads = (scout.leads || []).map((x: any) =>
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:285 | [scout] writeJson(OUT, scout);
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:291 | [scout] scout
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:75 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:89 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:103 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:117 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:131 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:145 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:267 | [portal] applicationMethod: lead.applicationMethod || "PORTAL",
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:231 | [CAPTCHA] bypassesCaptcha: false,
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:230 | [OTP] bypassesOtp: false,
apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts:46 | [automation] nextAction: "Run scout. If a website blocks automation, open the source manually from this page."
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:19 | [Playwright] const script = path.join(root, "scripts/agents/personal-job-playwright-source-scout.mjs");
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:25 | [Playwright] error: "PERSONAL-JOBS-19 Playwright source scout script is missing.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:72 | [Playwright] error: parsed?.error || "Playwright source scout failed.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:88 | [Playwright] error: "Playwright source scout returned non-JSON output.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:19 | [playwright] const script = path.join(root, "scripts/agents/personal-job-playwright-source-scout.mjs");
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:25 | [playwright] error: "PERSONAL-JOBS-19 Playwright source scout script is missing.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:72 | [playwright] error: parsed?.error || "Playwright source scout failed.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:88 | [playwright] error: "Playwright source scout returned non-JSON output.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:19 | [scout] const script = path.join(root, "scripts/agents/personal-job-playwright-source-scout.mjs");
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:25 | [scout] error: "PERSONAL-JOBS-19 Playwright source scout script is missing.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:72 | [scout] error: parsed?.error || "Playwright source scout failed.",
apps/web/src/app/api/personal-jobs/source-scout/run/route.ts:88 | [scout] error: "Playwright source scout returned non-JSON output.",
apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts:140 | [portal] source: "portal",
apps/web/src/app/candidate/dashboard/page.tsx:25 | [browser] <p data-boundary="browser-safe">
apps/web/src/app/candidate/dashboard/page.tsx:26 | [browser] Browser view is candidate-safe read model only. No service_role, paid verification, submitted verification, outcome verification, or source-confidence authority is exposed here.
apps/web/src/app/candidate/documents/page.tsx:5 | [browser] <p>Upload and view your own documents. Verification is handled by Kingsmen review rules, not by the browser.</p>
apps/web/src/app/candidate/messages/page.tsx:5 | [portal] <p>Email is the primary tracked communication channel. Portal messages are safe copies for visibility.</p>
apps/web/src/app/candidate/payment-status/page.tsx:17 | [portal] <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate portal</p>
apps/web/src/app/candidate/payment-status/page.tsx:20 | [browser] This page shows whether a Kingsmen package is pending, paid, active, or blocked. Package access is not opened from PayFast browser return; it is opened only after verified provider evidence reaches the backend finance ledger.
apps/web/src/app/candidate/support/page.tsx:5 | [portal] <p>Use this page for help requests, manual assistance, deadline risk, portal blockers, and tribunal escalations.</p>
apps/web/src/app/candidate/support/page.tsx:10 | [portal] <p>Routine support is email-first and copied into the portal.</p>
apps/web/src/app/candidate/support/page.tsx:14 | [portal] <p>Portal blockers, CAPTCHA/OTP, portal down, and source uncertainty trigger manual assistance or MAP fallback.</p>
apps/web/src/app/candidate/support/page.tsx:14 | [CAPTCHA] <p>Portal blockers, CAPTCHA/OTP, portal down, and source uncertainty trigger manual assistance or MAP fallback.</p>
apps/web/src/app/candidate/support/page.tsx:14 | [OTP] <p>Portal blockers, CAPTCHA/OTP, portal down, and source uncertainty trigger manual assistance or MAP fallback.</p>
apps/web/src/app/candidate/support/page.tsx:14 | [MAP fallback] <p>Portal blockers, CAPTCHA/OTP, portal down, and source uncertainty trigger manual assistance or MAP fallback.</p>
apps/web/src/app/candidate/workbench/page.tsx:27 | [browser] <p>You can view readiness and route guidance. You cannot verify sources, mark paid, mark submitted, or claim outcomes from the browser.</p>
apps/web/src/app/founder/launch-control/jarvis-ai-email-provider-proof/page.tsx:18 | [browser] "Browser must not call AI or Email providers directly.",
apps/web/src/app/founder/launch-control/jarvis-docker-runtime-proof/page.tsx:42 | [browser] <p style={muted}>API health HTTP 200, postgres_truth_vault storage mode, command_log write proof, audit_events write proof, redacted output, no browser shell, no direct database access from web, and no provider secret exposure.</p>
apps/web/src/app/founder/launch-control/jarvis-live-evidence-execution-sequence/page.tsx:6 | [browser] browserMayExecuteLocalShell: boolean;
apps/web/src/app/founder/launch-control/jarvis-live-evidence-execution-sequence/page.tsx:75 | [browser] This page gives the ordered evidence capture sequence for moving Jarvis from source-closeout to final live evidence acceptance. The browser cannot run local shell and it cannot expose secret values.
apps/web/src/app/founder/launch-control/jarvis-live-evidence-execution-sequence/page.tsx:82 | [browser] <article style={card}><p style={label}>Browser shell</p><strong>{String(data?.browserMayExecuteLocalShell ?? false)}</strong></article>
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx:3 | [Playwright] ["ACCEPTED_PREVIOUS_RUNTIME", "OpenClaw + Playwright", "Accepted previous runtime proofs remain valid only while their boundaries remain locked."],
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx:3 | [playwright] ["ACCEPTED_PREVIOUS_RUNTIME", "OpenClaw + Playwright", "Accepted previous runtime proofs remain valid only while their boundaries remain locked."],
apps/web/src/app/founder/launch-control/jarvis-live-proof-acceptance-gate/page.tsx:5 | [browser] ["PENDING_EVIDENCE", "AI Provider", "Requires backend-controlled live-call proof with redacted request/response and no browser provider call."],
apps/web/src/app/founder/launch-control/jarvis-live-proof-queue/page.tsx:36 | [browser] detail: "Requires backend-mediated relay proof and no direct browser-to-n8n calls."
apps/web/src/app/founder/launch-control/jarvis-live-proof-runbook/page.tsx:55 | [browser] This is the founder-facing runbook for turning sealed Jarvis source/design into live runtime proof. It does not run commands from the browser, does not expose secrets, and does not mark production ready. Each blocker must clear with real evidence.
apps/web/src/app/founder/launch-control/jarvis-provider-tool-runtime-proof/page.tsx:21 | [browser] "n8n backend-mediated command proof with no direct browser call",
apps/web/src/app/founder/launch-control/jarvis-provider-tool-runtime-proof/page.tsx:69 | [browser] <p style={muted}>This gate stays blocked until real runtime/provider-tool evidence exists. Browser routes cannot call n8n, Airtable, or GitHub directly, and no secret values may be returned.</p>
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [Playwright] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [playwright] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [scout] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/launch-control/jarvis-source-seal/page.tsx:58 | [browser] No fake data. No raw secrets. No browser shell. No browser database access. No direct provider calls from the web. PostgreSQL Truth Vault remains authority. Email remains primary. WhatsApp remains urgent-only. SMS remains backup-only. n8n remains a thin relay. Airtable remains mirror-only. Playwright remains scout-only. OpenClaw remains operator-only.
apps/web/src/app/founder/master-index/page.tsx:3 | [portal] ["N04", "Candidate Core & Portal", "validated + pushed closeout"],
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:4 | [Playwright] ["playwright-map-evidence", "ACCEPTED_PREVIOUSLY", "Playwright Scout MAP Fallback Evidence", "Scout-only and MAP fallback proof already captured."],
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:4 | [playwright] ["playwright-map-evidence", "ACCEPTED_PREVIOUSLY", "Playwright Scout MAP Fallback Evidence", "Scout-only and MAP fallback proof already captured."],
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:4 | [scout] ["playwright-map-evidence", "ACCEPTED_PREVIOUSLY", "Playwright Scout MAP Fallback Evidence", "Scout-only and MAP fallback proof already captured."],
apps/web/src/app/founder/proof-centre/jarvis-live-proof-evidence-ledger/page.tsx:4 | [MAP fallback] ["playwright-map-evidence", "ACCEPTED_PREVIOUSLY", "Playwright Scout MAP Fallback Evidence", "Scout-only and MAP fallback proof already captured."],
apps/web/src/app/jarvis/JarvisAgentClient.tsx:42 | [scout] { label: "Probe routes", tool: "ROUTE_PROBE", message: "probe routes", risk: "approval", surface: "Route Scout" },
apps/web/src/app/jarvis/JarvisAgentClient.tsx:42 | [probe] { label: "Probe routes", tool: "ROUTE_PROBE", message: "probe routes", risk: "approval", surface: "Route Scout" },
apps/web/src/app/jarvis/JarvisAgentClient.tsx:202 | [browser] setVoiceState("voice unsupported in this browser; use Chrome or Edge");
apps/web/src/app/jarvis/JarvisAgentClient.tsx:203 | [browser] speak("Voice is unsupported in this browser. Use Chrome or Edge.");
apps/web/src/app/jarvis/JarvisAgentClient.tsx:212 | [browser] speak("Microphone blocked. Allow microphone access in the browser.");
apps/web/src/app/jarvis/JarvisHudClient.tsx:54 | [portal] "CANDIDATE_PORTAL_CHECK"
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:71 | [browser] const browser = window as unknown as {
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:75 | [browser] return browser.SpeechRecognition || browser.webkitSpeechRecognition;
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:133 | [browser] ? "Microphone permission is blocked in the browser."
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:162 | [browser] const reply = "Jarvis AI key connected locally for this browser. The key is not committed to Git. I can now answer through the Jarvis conversation route.";
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:166 | [browser] const reply = "Clipboard permission was blocked. Allow clipboard access or use the browser prompt to paste the key into Jarvis.";
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:254 | [browser] speak("Voice recognition is not supported in this browser. Use Microsoft Edge or Chrome.");
apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx:51 | [automation] { id: "N8N_THIN_RELAY_CHECK", title: "n8n relay", description: "Confirm relay-only automation boundary." },
apps/web/src/app/jarvis/components/JarvisGitHubRepoPanel.tsx:36 | [portal] Commander, this panel proves repository state only. Build, CI, deployment, database, portal, payment,
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx:16 | [Playwright] ['13', 'Playwright', 'playwright_scout'],
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx:16 | [playwright] ['13', 'Playwright', 'playwright_scout'],
apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx:16 | [scout] ['13', 'Playwright', 'playwright_scout'],
apps/web/src/app/jarvis/final/JarvisFinalHudClient.tsx:402 | [browser] <p style={p}>Production stays false. Public launch stays false. Secret values are not returned. Browser never runs shell or reads the database directly.</p>
apps/web/src/app/jarvis/page.tsx:25 | [Playwright] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [playwright] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [scout] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [probe] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [selector] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [portal] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [CAPTCHA] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [OTP] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:25 | [Manual Application Package] "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits move to Manual Application Package fallback.",
apps/web/src/app/jarvis/page.tsx:23 | [manual fallback] "- Not CAO-only: CAO, NSFAS, universities, TVETs, SETA/QCTO, bursaries, employers, and manual fallback routes remain in scope.",
apps/web/src/app/jarvis/page.tsx:83 | [browser] text: "Command received, Commander. Jarvis is live in browser-safe mode. Give me a Kingsmen, Jarvis, connection, priority, or deployment command.",
apps/web/src/app/kingsmen/page.tsx:25 | [portal] Kingsmen Portal
apps/web/src/app/layout.tsx:4 | [portal] title: "Kingsmen Portal",
apps/web/src/app/payments/cancel/page.tsx:12 | [browser] <p className="mt-2">Cancellation is a browser navigation event only. The backend still relies on provider evidence for all finance decisions.</p>
apps/web/src/app/payments/return/page.tsx:8 | [browser] Kingsmen received the browser return, but this page does not activate a package. Activation waits for verified provider confirmation in the backend.
apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx:287 | [portal] referral, career portal role, Indeed result, LinkedIn post, Shoprite vacancy, hospitality role, or retail
apps/web/src/app/personal-job-desk/PersonalJobDeskShell.tsx:26 | [scout] { label: "Scout", href: "/personal-job-desk/opportunity-scout", icon: "◎" },
apps/web/src/app/personal-job-desk/PersonalJobDeskShell.tsx:39 | [scout] { label: "Source Scout", href: "/personal-job-desk/source-scout", icon: "◇" },
apps/web/src/app/personal-job-desk/PersonalJobDeskShell.tsx:81 | [scout] <span>Prepare profile, scout real opportunities, build packs, and capture proof.</span>
apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx:363 | [scout] <a href="/personal-job-desk/opportunity-scout" style={secondaryButton}>Open scout</a>
apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx:426 | [scout] <div style={emptyState}>No opportunities yet. Use Scout, then import a real source.</div>
apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx:49 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx:159 | [portal] applicationMethod: "PORTAL",
apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx:370 | [portal] <Select label="Method" value={opportunity.applicationMethod} onChange={(value) => setOpportunity((x) => ({ ...x, applicationMethod: value }))} options={["PORTAL", "EMAIL", "WALK_IN", "WHATSAPP_LISTED", "OTHER"]} />
apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx:417 | [portal] placeholder="Paste application reference, email sent proof, portal confirmation, screenshot note, or employer response."
apps/web/src/app/personal-job-desk/apply-pack-builder/ApplyPackBuilderClient.tsx:176 | [CAPTCHA] touch payments, bypass login, bypass OTP, bypass CAPTCHA, or claim production readiness.
apps/web/src/app/personal-job-desk/apply-pack-builder/ApplyPackBuilderClient.tsx:176 | [OTP] touch payments, bypass login, bypass OTP, bypass CAPTCHA, or claim production readiness.
apps/web/src/app/personal-job-desk/apply-pack/ApplyPackBuilderClient.tsx:61 | [portal] "PERSONAL_JOBS_04_NO_SEND_BOUNDARY: draft-only local apply packs; no applications, emails, WhatsApps, payment actions, portal submissions, or employer contact are sent.";
apps/web/src/app/personal-job-desk/apply-pack/ApplyPackBuilderClient.tsx:87 | [portal] bestFor: "Online portals, applicant tracking systems, high-volume listings, company career sites",
apps/web/src/app/personal-job-desk/daily-loop/DailyLoopClient.tsx:82 | [browser] emptyInstruction: "Run the browser-side real-use gate."
apps/web/src/app/personal-job-desk/daily-loop/DailyLoopClient.tsx:155 | [browser] reason: "The desks may be clickable, but the current browser-side smoke gate has not been recorded yet.",
apps/web/src/app/personal-job-desk/daily-loop/page.tsx:83 | [browser] This desk reads the local job lead, shortlist, apply-pack, submission, follow-up, outcome, and real-use-gate records already saved in this browser. It turns them into a daily operating sequence without sending applications, contacting employers, touching payments, syncing calendars, starting Docker, or claiming production readiness.
apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx:104 | [portal] platform: safeText(record.platform || record.source || record.portal, "Manual source"),
apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx:333 | [browser] Local boundary: this desk stores follow-up records in browser storage only. It does not contact
apps/web/src/app/personal-job-desk/import-search/page.tsx:83 | [browser] Paste copied job posts, company career snippets, URLs, search results, WhatsApp leads, Facebook leads, LinkedIn text, or browser notes. Kingsmen converts them into structured local opportunity leads and can push them into PERSONAL-JOBS-02 without sending applications, contacting employers, scraping websites, touching payments, or claiming production readiness.
apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx:5 | [Playwright] const PJ17_MARKER = "PERSONAL_JOBS_17_REAL_JOB_DISCOVERY_AGENT_ONE_PROFILE_JOB_FINDER_PLAYWRIGHT_SOURCE_SCOUT";
apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx:5 | [playwright] const PJ17_MARKER = "PERSONAL_JOBS_17_REAL_JOB_DISCOVERY_AGENT_ONE_PROFILE_JOB_FINDER_PLAYWRIGHT_SOURCE_SCOUT";
apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx:5 | [scout] const PJ17_MARKER = "PERSONAL_JOBS_17_REAL_JOB_DISCOVERY_AGENT_ONE_PROFILE_JOB_FINDER_PLAYWRIGHT_SOURCE_SCOUT";
apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx:241 | [CAPTCHA] CAPTCHA/OTP/login walls, or claim production deployment.
apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx:241 | [OTP] CAPTCHA/OTP/login walls, or claim production deployment.
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:248 | [portal] <Input label="Application method" value={selected.execution.applicationMethod} onChange={(v) => patchExecution("applicationMethod", v)} placeholder="official portal / email / walk-in / other" />
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:296 | [CAPTCHA] touch payments, bypass login, bypass OTP, or bypass CAPTCHA.
apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx:296 | [OTP] touch payments, bypass login, bypass OTP, or bypass CAPTCHA.
apps/web/src/app/personal-job-desk/navigation/NavigationHubClient.tsx:297 | [browser] <span style={styles.statusNote}>Routes with browser storage evidence</span>
apps/web/src/app/personal-job-desk/navigation/NavigationHubClient.tsx:144 | [automation] boundary: "Navigation repair only; no hidden automation."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:558 | [portal] placeholder="Application reference, confirmation screenshot note, email sent proof, portal status..."
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:290 | [browser] persist(next, "Lead removed from local browser tracker.");
apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx:309 | [browser] setMessage("Clipboard copy was blocked by the browser. Use the text export from DevTools/localStorage if needed.");
apps/web/src/app/personal-job-desk/opportunity-quality-gate/OpportunityQualityGateClient.tsx:112 | [portal] No login, OTP, CAPTCHA, or portal-control bypass.
apps/web/src/app/personal-job-desk/opportunity-quality-gate/OpportunityQualityGateClient.tsx:112 | [CAPTCHA] No login, OTP, CAPTCHA, or portal-control bypass.
apps/web/src/app/personal-job-desk/opportunity-quality-gate/OpportunityQualityGateClient.tsx:112 | [OTP] No login, OTP, CAPTCHA, or portal-control bypass.
apps/web/src/app/personal-job-desk/opportunity-queue/OpportunityQueueClient.tsx:161 | [scout] <a href="/personal-job-desk/source-scout">Open PJ19 source scout</a>
apps/web/src/app/personal-job-desk/opportunity-queue/OpportunityQueueClient.tsx:5 | [selector] const PJ20_MARKER = "PERSONAL_JOBS_20_UNIFIED_OPPORTUNITY_COMMAND_QUEUE_APPLY_READINESS_SELECTOR";
apps/web/src/app/personal-job-desk/opportunity-queue/OpportunityQueueClient.tsx:208 | [selector] <p className="muted">Build the queue. It will combine PJ17, PJ18, and PJ19 leads into one apply-readiness selector.</p>
apps/web/src/app/personal-job-desk/opportunity-queue/OpportunityQueueClient.tsx:267 | [CAPTCHA] bypass login/CAPTCHA, or claim production deployment.
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:108 | [Playwright] Uses a local Playwright scout to search public opportunity pages and import leads into Apply Now.
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:200 | [Playwright] Playwright can scout public pages and open sources. If a source needs login, OTP, CAPTCHA or blocks scraping,
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:108 | [playwright] Uses a local Playwright scout to search public opportunity pages and import leads into Apply Now.
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:200 | [playwright] Playwright can scout public pages and open sources. If a source needs login, OTP, CAPTCHA or blocks scraping,
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:15 | [scout] scoutStatus: string;
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:19 | [scout] type ScoutOutput = {
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:31 | [scout] export default function OpportunityScoutClient() {
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:32 | [scout] const [data, setData] = useState<ScoutOutput>({});
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:46 | [scout] const response = await fetch("/api/personal-jobs/opportunity-scout", {
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:74 | [scout] async function runScout() {
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:76 | [scout] setMessage("Running scout. If sources block automation, Kingsmen will still give manual-open links.");
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:78 | [scout] const json = await api({ action: "runScout", query, location, category });
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:80 | [scout] setMessage(`Scout completed. Leads found: ${json.leadCount ?? 0}.`);
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:82 | [scout] setMessage(error instanceof Error ? error.message : "Scout failed.");
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:92 | [scout] setData(json.scout);
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:106 | [scout] <h1 style={{ fontSize: 48, margin: "8px 0" }}>Connected Opportunity Scout</h1>
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:108 | [scout] Uses a local Playwright scout to search public opportunity pages and import leads into Apply Now.
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:119 | [scout] <span>Scouted leads</span>
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:127 | [scout] <p style={eyebrow}>SCOUT CONTROL</p>
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:153 | [scout] <button onClick={runScout} disabled={loading} style={primaryButton}>
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:154 | [scout] {loading ? "Scouting..." : "Run connected scout"}
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:164 | [scout] {leads.length === 0 ? <p style={muted}>No leads yet. Run the scout.</p> : null}
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:184 | [scout] <h2>Scout report</h2>
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:200 | [scout] Playwright can scout public pages and open sources. If a source needs login, OTP, CAPTCHA or blocks scraping,
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:109 | [CAPTCHA] It does not bypass login, OTP, CAPTCHA or source rules.
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:200 | [CAPTCHA] Playwright can scout public pages and open sources. If a source needs login, OTP, CAPTCHA or blocks scraping,
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:109 | [OTP] It does not bypass login, OTP, CAPTCHA or source rules.
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:200 | [OTP] Playwright can scout public pages and open sources. If a source needs login, OTP, CAPTCHA or blocks scraping,
apps/web/src/app/personal-job-desk/opportunity-scout/OpportunityScoutClient.tsx:76 | [automation] setMessage("Running scout. If sources block automation, Kingsmen will still give manual-open links.");
apps/web/src/app/personal-job-desk/opportunity-scout/page.tsx:1 | [scout] import OpportunityScoutClient from "./OpportunityScoutClient";
apps/web/src/app/personal-job-desk/opportunity-scout/page.tsx:5 | [scout] export default function OpportunityScoutPage() {
apps/web/src/app/personal-job-desk/opportunity-scout/page.tsx:6 | [scout] return <OpportunityScoutClient />;
apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx:513 | [browser] Local boundary: this dashboard stores outcomes in browser storage only. It does not contact employers,
apps/web/src/app/personal-job-desk/page.tsx:5 | [scout] { title: "Run opportunity scout", meta: "Find jobs, learnerships and funding sources", href: "/personal-job-desk/opportunity-scout" },
apps/web/src/app/personal-job-desk/page.tsx:11 | [scout] { name: "Jobs", count: "Scout", text: "Retail, admin, general worker, call centre, security, office support" },
apps/web/src/app/personal-job-desk/page.tsx:12 | [scout] { name: "Learnerships", count: "Scout", text: "SETA, employer and youth programme routes" },
apps/web/src/app/personal-job-desk/page.tsx:13 | [scout] { name: "Internships", count: "Scout", text: "Graduate, TVET and workplace experience routes" },
apps/web/src/app/personal-job-desk/page.tsx:14 | [scout] { name: "Funding", count: "Scout", text: "Bursaries, youth support, training and grant routes" }
apps/web/src/app/personal-job-desk/page.tsx:20 | [scout] ["Scout", "Find verified source"],
apps/web/src/app/personal-job-desk/page.tsx:35 | [scout] scout real opportunities, prepare clean application packs and keep proof of every move.
apps/web/src/app/personal-job-desk/page.tsx:41 | [scout] <a href="/personal-job-desk/opportunity-scout" style={searchButton}>Find opportunities</a>
apps/web/src/app/personal-job-desk/page.tsx:75 | [scout] <a href="/personal-job-desk/opportunity-scout" style={quickCard}>
apps/web/src/app/personal-job-desk/page.tsx:77 | [scout] <strong>Opportunity scout</strong>
apps/web/src/app/personal-job-desk/page.tsx:137 | [scout] <a href="/personal-job-desk/opportunity-scout" style={textButton}>Scout now</a>
apps/web/src/app/personal-job-desk/page.tsx:169 | [scout] <span>Scout sources and import leads</span>
apps/web/src/app/personal-job-desk/page.tsx:7 | [portal] { title: "Capture proof", meta: "Reference, screenshot, email proof or portal confirmation", href: "/personal-job-desk/apply-now" }
apps/web/src/app/personal-job-desk/page.tsx:172 | [CAPTCHA] <span>Stop at login, OTP, CAPTCHA or unsafe pages</span>
apps/web/src/app/personal-job-desk/page.tsx:172 | [OTP] <span>Stop at login, OTP, CAPTCHA or unsafe pages</span>
apps/web/src/app/personal-job-desk/proof-index/ProofIndexClient.tsx:247 | [browser] No founder handover review marker has been recorded in this browser yet.
apps/web/src/app/personal-job-desk/proof-review-board/ProofReviewBoardClient.tsx:278 | [portal] <Input label="Proof type" value={selected.proof.proofType} onChange={(v) => patchProof("proofType", v)} placeholder="screenshot / email / ref / portal / call note" />
apps/web/src/app/personal-job-desk/public-snapshot/page.tsx:5 | [OTP] export default function PublicSnapshotPage() {
apps/web/src/app/personal-job-desk/readiness-queue/ReadinessQueueClient.tsx:29 | [CAPTCHA] canBypassLoginOtpCaptcha: boolean;
apps/web/src/app/personal-job-desk/readiness-queue/ReadinessQueueClient.tsx:29 | [OTP] canBypassLoginOtpCaptcha: boolean;
apps/web/src/app/personal-job-desk/real-use-gate/RealUseGateClient.tsx:55 | [portal] purpose: "Capture outside job leads from Indeed, company portals, LinkedIn, referrals, WhatsApp screenshots, emails, or names heard by the user.",
apps/web/src/app/personal-job-desk/real-use-gate/RealUseGateClient.tsx:248 | [browser] ? "Local browser data found."
apps/web/src/app/personal-job-desk/real-use-gate/RealUseGateClient.tsx:249 | [browser] : "No local browser data found yet."
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:160 | [selector] <h1 style={{ fontSize: 40, margin: "8px 0" }}>Human Review Selector / Proof Capture / Outcome Ledger</h1>
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:230 | [portal] <Input label="Application method" value={selected.review.applicationMethod} onChange={(v) => patchSelected("applicationMethod", v)} placeholder="official portal / email / walk-in / other" />
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:280 | [CAPTCHA] send WhatsApp, contact employers, touch payments, bypass login, bypass OTP, or bypass CAPTCHA.
apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx:280 | [OTP] send WhatsApp, contact employers, touch payments, bypass login, bypass OTP, or bypass CAPTCHA.
apps/web/src/app/personal-job-desk/sa-sources/SaSourcesClient.tsx:153 | [scout] This expands Kingsmen from generic international job discovery into South African source scouting:
apps/web/src/app/personal-job-desk/sa-sources/SaSourcesClient.tsx:244 | [CAPTCHA] CAPTCHA/OTP/login walls, or claim production deployment.
apps/web/src/app/personal-job-desk/sa-sources/SaSourcesClient.tsx:244 | [OTP] CAPTCHA/OTP/login walls, or claim production deployment.
apps/web/src/app/personal-job-desk/shortlist/ShortlistDecisionClient.tsx:45 | [portal] "PERSONAL_JOBS_03_NO_SEND_BOUNDARY: local scoring only; no applications, emails, WhatsApps, payments, or portal submissions are sent.";
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:5 | [Playwright] const PJ19_MARKER = "PERSONAL_JOBS_19_PLAYWRIGHT_SOURCE_QUEUE_EMPLOYER_CAREER_PAGE_SCOUT_SA_SOURCE_HEALTH_REPORT";
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:6 | [Playwright] const PJ19_LEADS_KEY = "kingsmen.personalJobs19.playwrightScoutLeads.v1";
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:94 | [Playwright] throw new Error(json.error || "Playwright source scout failed.");
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:124 | [Playwright] setMessage(`Source scout completed. ${nextLeads.length} Playwright leads found. ${combined.length} total leads exported to PJ02.`);
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:140 | [Playwright] sourceName: lead.sourceName || "PJ19 Playwright source scout",
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:145 | [Playwright] status: "PLAYWRIGHT_SCOUT_PENDING_REVIEW",
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:152 | [Playwright] setMessage(`${pj02Compatible.length} Playwright scout leads exported to PJ02 local intake.`);
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:159 | [Playwright] <h1>Playwright Source Scout</h1>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:190 | [Playwright] {running ? "Scouting with Playwright..." : "Run Playwright source scout"}
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:243 | [Playwright] <h2>Playwright scout leads</h2>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:246 | [Playwright] No scout leads loaded yet. Press “Run Playwright source scout”. This is where Kingsmen handles
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:277 | [Playwright] PJ19 uses Playwright only as a scout. It does not submit applications, send emails, send WhatsApp
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:5 | [playwright] const PJ19_MARKER = "PERSONAL_JOBS_19_PLAYWRIGHT_SOURCE_QUEUE_EMPLOYER_CAREER_PAGE_SCOUT_SA_SOURCE_HEALTH_REPORT";
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:6 | [playwright] const PJ19_LEADS_KEY = "kingsmen.personalJobs19.playwrightScoutLeads.v1";
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:94 | [playwright] throw new Error(json.error || "Playwright source scout failed.");
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:124 | [playwright] setMessage(`Source scout completed. ${nextLeads.length} Playwright leads found. ${combined.length} total leads exported to PJ02.`);
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:140 | [playwright] sourceName: lead.sourceName || "PJ19 Playwright source scout",
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:145 | [playwright] status: "PLAYWRIGHT_SCOUT_PENDING_REVIEW",
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:152 | [playwright] setMessage(`${pj02Compatible.length} Playwright scout leads exported to PJ02 local intake.`);
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:159 | [playwright] <h1>Playwright Source Scout</h1>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:190 | [playwright] {running ? "Scouting with Playwright..." : "Run Playwright source scout"}
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:243 | [playwright] <h2>Playwright scout leads</h2>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:246 | [playwright] No scout leads loaded yet. Press “Run Playwright source scout”. This is where Kingsmen handles
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:277 | [playwright] PJ19 uses Playwright only as a scout. It does not submit applications, send emails, send WhatsApp
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:5 | [scout] const PJ19_MARKER = "PERSONAL_JOBS_19_PLAYWRIGHT_SOURCE_QUEUE_EMPLOYER_CAREER_PAGE_SCOUT_SA_SOURCE_HEALTH_REPORT";
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:6 | [scout] const PJ19_LEADS_KEY = "kingsmen.personalJobs19.playwrightScoutLeads.v1";
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:62 | [scout] export default function SourceScoutClient() {
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:75 | [scout] async function runScout() {
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:80 | [scout] const response = await fetch("/api/personal-jobs/source-scout/run", {
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:94 | [scout] throw new Error(json.error || "Playwright source scout failed.");
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:124 | [scout] setMessage(`Source scout completed. ${nextLeads.length} Playwright leads found. ${combined.length} total leads exported to PJ02.`);
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:140 | [scout] sourceName: lead.sourceName || "PJ19 Playwright source scout",
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:145 | [scout] status: "PLAYWRIGHT_SCOUT_PENDING_REVIEW",
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:152 | [scout] setMessage(`${pj02Compatible.length} Playwright scout leads exported to PJ02 local intake.`);
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:159 | [scout] <h1>Playwright Source Scout</h1>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:161 | [scout] This is the controlled browser scout for South African career pages. It opens public source pages,
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:189 | [scout] <button type="button" onClick={runScout} disabled={running}>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:190 | [scout] {running ? "Scouting with Playwright..." : "Run Playwright source scout"}
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:193 | [scout] Export scout leads to PJ02
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:213 | [scout] <span>Scout leads</span>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:224 | [scout] <p className="muted">Run the scout to see portal health: rendered, blocked, timeout, login wall, CAPTCHA, or manual review required.</p>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:243 | [scout] <h2>Playwright scout leads</h2>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:246 | [scout] No scout leads loaded yet. Press “Run Playwright source scout”. This is where Kingsmen handles
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:277 | [scout] PJ19 uses Playwright only as a scout. It does not submit applications, send emails, send WhatsApp
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:224 | [portal] <p className="muted">Run the scout to see portal health: rendered, blocked, timeout, login wall, CAPTCHA, or manual review required.</p>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:163 | [CAPTCHA] leads back to the Personal Job Desk. It does not apply, log in, bypass CAPTCHA, or contact employers.
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:224 | [CAPTCHA] <p className="muted">Run the scout to see portal health: rendered, blocked, timeout, login wall, CAPTCHA, or manual review required.</p>
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:279 | [CAPTCHA] CAPTCHA, or claim Oracle/production deployment.
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:278 | [OTP] messages, contact employers, touch payments, use credentials, bypass login, bypass OTP, bypass
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:161 | [browser] This is the controlled browser scout for South African career pages. It opens public source pages,
apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx:184 | [browser] Show browser window
apps/web/src/app/personal-job-desk/source-scout/page.tsx:1 | [scout] import SourceScoutClient from "./SourceScoutClient";
apps/web/src/app/personal-job-desk/source-scout/page.tsx:5 | [scout] export default function PersonalJobSourceScoutPage() {
apps/web/src/app/personal-job-desk/source-scout/page.tsx:6 | [scout] return <SourceScoutClient />;
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:6 | [portal] "PERSONAL_JOBS_05_NO_SEND_BOUNDARY: manual evidence tracker only; no applications, emails, WhatsApps, payment actions, portal submissions, employer contact, or automated sending are performed.";
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:67 | [portal] "Company career portal",
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:112 | [portal] applicationMethod: "Company career portal",
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:510 | [portal] placeholder="Paste official job source or portal link"
apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx:522 | [portal] placeholder="Example: screenshot filename, confirmation number, sent email subject, portal reference"
apps/web/src/app/personal-job-desk/submissions/page.tsx:124 | [portal] payments, portal submissions, or employer contact.
apps/web/src/application-workbench/ApplicationWorkbenchPanel.tsx:11 | [portal] portalHealthStatus: string;
apps/web/src/application-workbench/ApplicationWorkbenchPanel.tsx:27 | [portal] Routes stay available nationally. Execution waits for source confidence, document readiness, and portal health.
apps/web/src/application-workbench/ApplicationWorkbenchPanel.tsx:45 | [portal] <div><dt className="text-slate-500">Portal health</dt><dd>{route.portalHealthStatus}</dd></div>
apps/web/src/application-workbench/ApplicationWorkbenchPanel.tsx:50 | [MAP fallback] MAP fallback required.
apps/web/src/candidate-mobile/CandidateMobileShell.tsx:4 | [portal] "PUBLIC_TO_PORTAL_HANDOFF",
apps/web/src/candidate-mobile/CandidateMobileShell.tsx:17 | [portal] Candidates continue from public website to secure portal, complete missing details, upload documents,
apps/web/src/candidate-mobile/CandidateMobileShell.tsx:18 | [manual fallback] view verified status cards, and follow manual fallback instructions without retyping what Kingsmen
apps/web/src/candidate-mobile/MobileHomePanel.tsx:2 | [MAP fallback] ["Route status", "See route readiness, MAP fallback, documents, finance activation, and next action."],
apps/web/src/candidate-mobile/MobileStatusCardsPanel.tsx:13 | [manual fallback] <p className="text-sm text-slate-300">Source confidence, deadlines, manual fallback.</p>
apps/web/src/candidate-mobile/PublicToPortalClaimPanel.tsx:1 | [portal] export function PublicToPortalClaimPanel() {
apps/web/src/candidate-mobile/PublicToPortalClaimPanel.tsx:4 | [portal] <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">Public-to-portal handoff</p>
apps/web/src/candidate-mobile/PublicToPortalClaimPanel.tsx:8 | [portal] then the candidate confirms identity and continues inside the governed portal.
apps/web/src/candidate-portal/CandidatePortalShell.tsx:3 | [portal] export type CandidatePortalCardStatus = "OK" | "ACTION_REQUIRED" | "WAITING" | "BLOCKED";
apps/web/src/candidate-portal/CandidatePortalShell.tsx:5 | [portal] export interface CandidatePortalCard {
apps/web/src/candidate-portal/CandidatePortalShell.tsx:8 | [portal] status: CandidatePortalCardStatus;
apps/web/src/candidate-portal/CandidatePortalShell.tsx:12 | [portal] export interface CandidatePortalShellProps {
apps/web/src/candidate-portal/CandidatePortalShell.tsx:15 | [portal] cards: CandidatePortalCard[];
apps/web/src/candidate-portal/CandidatePortalShell.tsx:18 | [portal] export function CandidatePortalShell(props: CandidatePortalShellProps) {
apps/web/src/candidate-portal/CandidatePortalShell.tsx:20 | [portal] <main aria-label="Kingsmen candidate portal" className="min-h-screen bg-slate-950 text-white">
apps/web/src/candidate-portal/CandidatePortalShell.tsx:23 | [portal] <p className="text-sm uppercase tracking-wide text-slate-400">Kingsmen Candidate Portal</p>
apps/web/src/communications/CandidateInboxPanel.tsx:4 | [portal] <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate Portal Inbox</p>
apps/web/src/communications/CandidateInboxPanel.tsx:7 | [MAP fallback] Candidates see clear route updates, document requests, MAP fallback notices, payment notices, support replies, and outcomes in one place.
apps/web/src/communications/CommunicationRuntimePanel.tsx:4 | [portal] "Portal Inbox",
apps/web/src/communications/UrgentEscalationPanel.tsx:7 | [portal] WhatsApp requires urgency, reason, evidence, and approval. Routine reminders stay on email and portal.
apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx:25 | [Phoenix fallback] ["phoenix_fallback", "Phoenix fallback"],
apps/web/src/components/kingsmen/PublicWebsiteShell.tsx:47 | [portal] <p style={{ color: "#d4af37", letterSpacing: "0.16em", textTransform: "uppercase" }}>Kingsmen Portal</p>
apps/web/src/control-plane/ControlPlaneShell.tsx:12 | [manual fallback] "Manual Fallback Center",
apps/web/src/final-assembly/LaunchGatePanel.tsx:7 | [browser] ["500 cap", "Manual review", "Operational active candidates, not concurrent browsers."]
apps/web/src/finance/CandidatePaymentStatusPanel.tsx:55 | [portal] <dd className="mt-1 text-slate-600">{props.candidateRef ?? "Shown after portal login"}</dd>
apps/web/src/finance/CandidatePaymentStatusPanel.tsx:74 | [browser] Browser return and cancel pages cannot activate a Kingsmen package. The package opens only after accepted PayFast ITN evidence is written to finance truth and linked to an entitlement.
apps/web/src/finance/payment-status-api.ts:118 | [browser] noProviderCredentialsInBrowser: true,
apps/web/src/founder-ops/FoundationBriefPanel.tsx:8 | [Playwright] "Playwright / MAP",
apps/web/src/founder-ops/FoundationBriefPanel.tsx:8 | [playwright] "Playwright / MAP",
apps/web/src/founder-ops/FoundationCommandCenter.tsx:7 | [Phoenix fallback] "Request Phoenix fallback",
apps/web/src/founder-ops/FoundationDecisionLogPanel.tsx:7 | [Phoenix fallback] Every approval, rejection, pause, resume, priority change, escalation, MAP request, Phoenix fallback, review request, or no-action decision records reason and evidence.
apps/web/src/founder-ops/FoundationEscalationsPanel.tsx:7 | [portal] Deadline, document, portal, payment, refund, privacy, fraud review, source review, system incident, candidate harm, backlog, and capacity escalations stay visible until resolved.
apps/web/src/founder-ops/FoundationMobileCockpit.tsx:11 | [Phoenix fallback] "Phoenix Fallbacks",
apps/web/src/founder/founder-control-plane-client.ts:40 | [Playwright] playwrightScoutOnly: boolean;
apps/web/src/founder/founder-control-plane-client.ts:70 | [Playwright] playwrightScoutOnly: true
apps/web/src/founder/founder-control-plane-client.ts:40 | [playwright] playwrightScoutOnly: boolean;
apps/web/src/founder/founder-control-plane-client.ts:70 | [playwright] playwrightScoutOnly: true
apps/web/src/founder/founder-control-plane-client.ts:40 | [scout] playwrightScoutOnly: boolean;
apps/web/src/founder/founder-control-plane-client.ts:70 | [scout] playwrightScoutOnly: true
apps/web/src/founder/founder-control-plane-client.ts:75 | [portal] { moduleCode: "N04", name: "Candidate Portal and Support Centre", proofStatus: "VALIDATOR_REQUIRED", owner: "BACKEND_KERNEL", validatorCommand: "npm run payments:validate:candidate-status", reportPath: "reports/finance/candidate-payment-status-latest.json", blockers: ["candidate sees another candidate", "payment status cached unsafely"] },
apps/web/src/founder/founder-control-plane-client.ts:81 | [portal] { moduleCode: "N16", name: "Execution Orchestrator and Workers", proofStatus: "STAGING_PROOF_REQUIRED", owner: "OPENCLAW_OPERATOR", validatorCommand: "npm run staging:validate:pack", reportPath: "reports/staging/staging-runtime-proof-pack-latest.json", blockers: ["forced portal automation", "no MAP fallback"] },
apps/web/src/founder/founder-control-plane-client.ts:81 | [MAP fallback] { moduleCode: "N16", name: "Execution Orchestrator and Workers", proofStatus: "STAGING_PROOF_REQUIRED", owner: "OPENCLAW_OPERATOR", validatorCommand: "npm run staging:validate:pack", reportPath: "reports/staging/staging-runtime-proof-pack-latest.json", blockers: ["forced portal automation", "no MAP fallback"] },
apps/web/src/founder/founder-control-plane-client.ts:77 | [manual fallback] { moduleCode: "N06", name: "Route Universe and Application Workbench", proofStatus: "VALIDATOR_REQUIRED", owner: "JARVIS_BRAIN_ROUTER", validatorCommand: "npm run kingsmen:launch:audit", reportPath: "reports/launch/kingsmen-launch-readiness-latest.json", blockers: ["fake institution data", "no manual fallback"] },
apps/web/src/founder/founder-control-plane-client.ts:81 | [automation] { moduleCode: "N16", name: "Execution Orchestrator and Workers", proofStatus: "STAGING_PROOF_REQUIRED", owner: "OPENCLAW_OPERATOR", validatorCommand: "npm run staging:validate:pack", reportPath: "reports/staging/staging-runtime-proof-pack-latest.json", blockers: ["forced portal automation", "no MAP fallback"] },
apps/web/src/governance/GovernanceRuntimePanel.tsx:16 | [Phoenix fallback] Kingsmen governance controls submissions, refunds, privacy, source confidence, human override, communication exceptions, Phoenix fallback, and growth-cap changes.
apps/web/src/integrations/ConnectorHealthPanel.tsx:6 | [portal] <p className="mt-2 text-sm text-slate-600">Health snapshots watch backlog, latency, failures, unsigned webhooks, and blocked external portals before they harm candidates.</p>
apps/web/src/integrations/IntegrationRuntimePanel.tsx:6 | [Playwright] <p className="mt-3 max-w-3xl text-sm text-slate-600">Backend controls all flow. n8n is thin worker only. Airtable is mirror only. Playwright is scout/probe only. PayFast is payment evidence only.</p>
apps/web/src/integrations/IntegrationRuntimePanel.tsx:6 | [playwright] <p className="mt-3 max-w-3xl text-sm text-slate-600">Backend controls all flow. n8n is thin worker only. Airtable is mirror only. Playwright is scout/probe only. PayFast is payment evidence only.</p>
apps/web/src/integrations/IntegrationRuntimePanel.tsx:6 | [scout] <p className="mt-3 max-w-3xl text-sm text-slate-600">Backend controls all flow. n8n is thin worker only. Airtable is mirror only. Playwright is scout/probe only. PayFast is payment evidence only.</p>
apps/web/src/integrations/IntegrationRuntimePanel.tsx:6 | [probe] <p className="mt-3 max-w-3xl text-sm text-slate-600">Backend controls all flow. n8n is thin worker only. Airtable is mirror only. Playwright is scout/probe only. PayFast is payment evidence only.</p>
apps/web/src/lib/jarvis/runtime/adapter-selector.ts:12 | [Playwright] 'playwright_scout_adapter',
apps/web/src/lib/jarvis/runtime/adapter-selector.ts:12 | [playwright] 'playwright_scout_adapter',
apps/web/src/lib/jarvis/runtime/adapter-selector.ts:12 | [scout] 'playwright_scout_adapter',
apps/web/src/lib/jarvis/runtime/command-registry.ts:78 | [Playwright] playwright_scout: {
apps/web/src/lib/jarvis/runtime/command-registry.ts:79 | [Playwright] commandId: 'PLAYWRIGHT_PORTAL_HEALTH',
apps/web/src/lib/jarvis/runtime/command-registry.ts:80 | [Playwright] label: 'Playwright Portal Health Scout',
apps/web/src/lib/jarvis/runtime/command-registry.ts:81 | [Playwright] category: 'playwright_scout',
apps/web/src/lib/jarvis/runtime/command-registry.ts:85 | [Playwright] adapterId: 'playwright_scout_adapter',
apps/web/src/lib/jarvis/runtime/command-registry.ts:78 | [playwright] playwright_scout: {
apps/web/src/lib/jarvis/runtime/command-registry.ts:79 | [playwright] commandId: 'PLAYWRIGHT_PORTAL_HEALTH',
apps/web/src/lib/jarvis/runtime/command-registry.ts:80 | [playwright] label: 'Playwright Portal Health Scout',
apps/web/src/lib/jarvis/runtime/command-registry.ts:81 | [playwright] category: 'playwright_scout',
apps/web/src/lib/jarvis/runtime/command-registry.ts:85 | [playwright] adapterId: 'playwright_scout_adapter',
apps/web/src/lib/jarvis/runtime/command-registry.ts:78 | [scout] playwright_scout: {
apps/web/src/lib/jarvis/runtime/command-registry.ts:80 | [scout] label: 'Playwright Portal Health Scout',
apps/web/src/lib/jarvis/runtime/command-registry.ts:81 | [scout] category: 'playwright_scout',
apps/web/src/lib/jarvis/runtime/command-registry.ts:85 | [scout] adapterId: 'playwright_scout_adapter',
apps/web/src/lib/jarvis/runtime/command-registry.ts:79 | [portal] commandId: 'PLAYWRIGHT_PORTAL_HEALTH',
apps/web/src/lib/jarvis/runtime/command-registry.ts:80 | [portal] label: 'Playwright Portal Health Scout',
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:9 | [Playwright] playwright_scout: { connectorId: 'playwright_scout', label: 'Playwright Scout', adapterId: 'playwright_scout_adapter', readOnly: false, liveData: true, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Scout check needed.' },
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:22 | [Playwright] if (text.includes('portal') || text.includes('scout')) return JARVIS_CONNECTORS.playwright_scout;
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:9 | [playwright] playwright_scout: { connectorId: 'playwright_scout', label: 'Playwright Scout', adapterId: 'playwright_scout_adapter', readOnly: false, liveData: true, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Scout check needed.' },
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:22 | [playwright] if (text.includes('portal') || text.includes('scout')) return JARVIS_CONNECTORS.playwright_scout;
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:9 | [scout] playwright_scout: { connectorId: 'playwright_scout', label: 'Playwright Scout', adapterId: 'playwright_scout_adapter', readOnly: false, liveData: true, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Scout check needed.' },
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:22 | [scout] if (text.includes('portal') || text.includes('scout')) return JARVIS_CONNECTORS.playwright_scout;
apps/web/src/lib/jarvis/runtime/connectors/registry.ts:22 | [portal] if (text.includes('portal') || text.includes('scout')) return JARVIS_CONNECTORS.playwright_scout;
apps/web/src/lib/jarvis/runtime/connectors/types.ts:7 | [Playwright] | 'playwright_scout'
apps/web/src/lib/jarvis/runtime/connectors/types.ts:7 | [playwright] | 'playwright_scout'
apps/web/src/lib/jarvis/runtime/connectors/types.ts:7 | [scout] | 'playwright_scout'
apps/web/src/lib/jarvis/runtime/index.ts:5 | [selector] export * from './adapter-selector';
apps/web/src/lib/jarvis/runtime/intent-router.ts:58 | [Playwright] if (includesAny(text, ['playwright', 'portal', 'screenshot', 'captcha', 'otp', 'blocker'])) {
apps/web/src/lib/jarvis/runtime/intent-router.ts:60 | [Playwright] intentId: 'playwright_scout',
apps/web/src/lib/jarvis/runtime/intent-router.ts:58 | [playwright] if (includesAny(text, ['playwright', 'portal', 'screenshot', 'captcha', 'otp', 'blocker'])) {
apps/web/src/lib/jarvis/runtime/intent-router.ts:60 | [playwright] intentId: 'playwright_scout',
apps/web/src/lib/jarvis/runtime/intent-router.ts:60 | [scout] intentId: 'playwright_scout',
apps/web/src/lib/jarvis/runtime/intent-router.ts:64 | [scout] reason: 'Input asks for portal scouting or browser evidence.',
apps/web/src/lib/jarvis/runtime/intent-router.ts:58 | [portal] if (includesAny(text, ['playwright', 'portal', 'screenshot', 'captcha', 'otp', 'blocker'])) {
apps/web/src/lib/jarvis/runtime/intent-router.ts:64 | [portal] reason: 'Input asks for portal scouting or browser evidence.',
apps/web/src/lib/jarvis/runtime/intent-router.ts:58 | [CAPTCHA] if (includesAny(text, ['playwright', 'portal', 'screenshot', 'captcha', 'otp', 'blocker'])) {
apps/web/src/lib/jarvis/runtime/intent-router.ts:58 | [OTP] if (includesAny(text, ['playwright', 'portal', 'screenshot', 'captcha', 'otp', 'blocker'])) {
apps/web/src/lib/jarvis/runtime/intent-router.ts:64 | [browser] reason: 'Input asks for portal scouting or browser evidence.',
apps/web/src/lib/jarvis/runtime/kernel.ts:7 | [selector] import { selectJarvisAdapter } from './adapter-selector';
apps/web/src/lib/jarvis/runtime/live-data-router.ts:6 | [Playwright] | 'playwright_scout_live'
apps/web/src/lib/jarvis/runtime/live-data-router.ts:25 | [Playwright] return { routeId: 'playwright_scout_live', freshnessRequired: true, reason: 'Portal state requires live scout evidence.' };
apps/web/src/lib/jarvis/runtime/live-data-router.ts:6 | [playwright] | 'playwright_scout_live'
apps/web/src/lib/jarvis/runtime/live-data-router.ts:25 | [playwright] return { routeId: 'playwright_scout_live', freshnessRequired: true, reason: 'Portal state requires live scout evidence.' };
apps/web/src/lib/jarvis/runtime/live-data-router.ts:6 | [scout] | 'playwright_scout_live'
apps/web/src/lib/jarvis/runtime/live-data-router.ts:25 | [scout] return { routeId: 'playwright_scout_live', freshnessRequired: true, reason: 'Portal state requires live scout evidence.' };
apps/web/src/lib/jarvis/runtime/live-data-router.ts:24 | [portal] if (text.includes('portal') || text.includes('screenshot') || text.includes('captcha') || text.includes('otp')) {
apps/web/src/lib/jarvis/runtime/live-data-router.ts:25 | [portal] return { routeId: 'playwright_scout_live', freshnessRequired: true, reason: 'Portal state requires live scout evidence.' };
apps/web/src/lib/jarvis/runtime/live-data-router.ts:24 | [CAPTCHA] if (text.includes('portal') || text.includes('screenshot') || text.includes('captcha') || text.includes('otp')) {
apps/web/src/lib/jarvis/runtime/live-data-router.ts:24 | [OTP] if (text.includes('portal') || text.includes('screenshot') || text.includes('captcha') || text.includes('otp')) {
apps/web/src/lib/jarvis/runtime/types.ts:18 | [Playwright] | 'playwright_scout'
apps/web/src/lib/jarvis/runtime/types.ts:42 | [Playwright] | 'PLAYWRIGHT_PORTAL_HEALTH'
apps/web/src/lib/jarvis/runtime/types.ts:18 | [playwright] | 'playwright_scout'
apps/web/src/lib/jarvis/runtime/types.ts:42 | [playwright] | 'PLAYWRIGHT_PORTAL_HEALTH'
apps/web/src/lib/jarvis/runtime/types.ts:18 | [scout] | 'playwright_scout'
apps/web/src/lib/jarvis/runtime/types.ts:42 | [portal] | 'PLAYWRIGHT_PORTAL_HEALTH'
apps/web/src/lib/kingsmen-backend-client.ts:30 | [portal] readonly source: "portal" | "control_plane" | "worker" | "jarvis" | "api" | "system";
apps/web/src/observability/FoundationReportPanel.tsx:7 | [Playwright] Reports summarize pipeline pressure, finance, documents, matching, dispatch, Playwright, manual fallback, portal health, risk, backups, and capacity.
apps/web/src/observability/FoundationReportPanel.tsx:7 | [playwright] Reports summarize pipeline pressure, finance, documents, matching, dispatch, Playwright, manual fallback, portal health, risk, backups, and capacity.
apps/web/src/observability/FoundationReportPanel.tsx:7 | [portal] Reports summarize pipeline pressure, finance, documents, matching, dispatch, Playwright, manual fallback, portal health, risk, backups, and capacity.
apps/web/src/observability/FoundationReportPanel.tsx:7 | [manual fallback] Reports summarize pipeline pressure, finance, documents, matching, dispatch, Playwright, manual fallback, portal health, risk, backups, and capacity.
apps/web/src/opportunity/OpportunityAlertsPanel.tsx:7 | [portal] Alerts surface openings, deadlines, source changes, portal blocks, and review-required opportunities with evidence.
apps/web/src/orchestrator/ManualHandoffPanel.tsx:7 | [portal] CAPTCHA, OTP, blocked portals, portal downtime, manual-only routes, and hard blockers create visible handoffs instead of fake automation success.
apps/web/src/orchestrator/ManualHandoffPanel.tsx:7 | [CAPTCHA] CAPTCHA, OTP, blocked portals, portal downtime, manual-only routes, and hard blockers create visible handoffs instead of fake automation success.
apps/web/src/orchestrator/ManualHandoffPanel.tsx:7 | [OTP] CAPTCHA, OTP, blocked portals, portal downtime, manual-only routes, and hard blockers create visible handoffs instead of fake automation success.
apps/web/src/orchestrator/ManualHandoffPanel.tsx:5 | [Phoenix fallback] <h2 className="text-2xl font-bold text-slate-950">MAP and Phoenix fallback</h2>
apps/web/src/orchestrator/ManualHandoffPanel.tsx:7 | [automation] CAPTCHA, OTP, blocked portals, portal downtime, manual-only routes, and hard blockers create visible handoffs instead of fake automation success.
apps/web/src/orchestrator/OrchestratorRuntimePanel.tsx:7 | [portal] "Manual fallback for blocked portals",
apps/web/src/orchestrator/OrchestratorRuntimePanel.tsx:16 | [MAP fallback] The backend orchestrator binds commands, worker dispatch, workflow results, retries, approvals, MAP fallback, Phoenix fallback, and state guards into one controlled execution lane.
apps/web/src/orchestrator/OrchestratorRuntimePanel.tsx:16 | [Phoenix fallback] The backend orchestrator binds commands, worker dispatch, workflow results, retries, approvals, MAP fallback, Phoenix fallback, and state guards into one controlled execution lane.
apps/web/src/orchestrator/OrchestratorRuntimePanel.tsx:7 | [manual fallback] "Manual fallback for blocked portals",
apps/web/src/public-site/DestinyMapPreviewPanel.tsx:4 | [portal] "Portal links",
apps/web/src/public-site/TrustSafetyPanel.tsx:7 | [portal] Kingsmen is not an official university, TVET, SETA, NSFAS, CAO, employer, bursary provider, accommodation provider, payment provider, or government portal. Kingsmen does not guarantee admission, funding, employment, accommodation, approval, or official response speed.
config/creator.config.json:10 | [portal] "owner": "kingsmenportal-ctrl",
config/creator.config.json:24 | [OTP] "chatIsSpecificationNotProof": true,
config/environment/.env.template:33 | [Playwright] KINGSMEN_PLAYWRIGHT_MAX_CONCURRENCY=1
config/environment/.env.template:155 | [Playwright] PLAYWRIGHT_ENABLED=false
config/environment/.env.template:156 | [Playwright] PLAYWRIGHT_SERVICE_URL=http://localhost:4100
config/environment/.env.template:157 | [Playwright] PLAYWRIGHT_MAX_CONCURRENCY=1
config/environment/.env.template:158 | [Playwright] PLAYWRIGHT_SCOUT_NOT_CRUTCH=true
config/environment/.env.template:159 | [Playwright] PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED=false
config/environment/.env.template:160 | [Playwright] PLAYWRIGHT_OTP_BYPASS_ALLOWED=false
config/environment/.env.template:161 | [Playwright] PLAYWRIGHT_MAP_FALLBACK_ON_BLOCK=true
config/environment/.env.template:33 | [playwright] KINGSMEN_PLAYWRIGHT_MAX_CONCURRENCY=1
config/environment/.env.template:155 | [playwright] PLAYWRIGHT_ENABLED=false
config/environment/.env.template:156 | [playwright] PLAYWRIGHT_SERVICE_URL=http://localhost:4100
config/environment/.env.template:157 | [playwright] PLAYWRIGHT_MAX_CONCURRENCY=1
config/environment/.env.template:158 | [playwright] PLAYWRIGHT_SCOUT_NOT_CRUTCH=true
config/environment/.env.template:159 | [playwright] PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED=false
config/environment/.env.template:160 | [playwright] PLAYWRIGHT_OTP_BYPASS_ALLOWED=false
config/environment/.env.template:161 | [playwright] PLAYWRIGHT_MAP_FALLBACK_ON_BLOCK=true
config/environment/.env.template:158 | [scout] PLAYWRIGHT_SCOUT_NOT_CRUTCH=true
config/environment/.env.template:20 | [portal] KINGSMEN_CANDIDATE_PORTAL_URL=http://localhost:3000/candidate/dashboard
config/environment/.env.template:58 | [portal] EMAIL_FROM_NAME=Kingsmen Portal
config/environment/.env.template:159 | [CAPTCHA] PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED=false
config/environment/.env.template:160 | [OTP] PLAYWRIGHT_OTP_BYPASS_ALLOWED=false
config/environment/.env.template:100 | [browser] # SUPABASE_SERVICE_ROLE must be backend/worker-only and never exposed to browser.
config/environment/.env.template:174 | [browser] SERVICE_ROLE_BROWSER_EXPOSURE_ALLOWED=false
config/jarvis/jarvis-command-profile.json:54 | [Playwright] "full_personal_assistance_response": "Welcome to Kingsmen Command, Commander. Jarvis is online. Today is {{day}}, {{date}}. The local time is {{time}} in {{location}}. Current conditions are {{weather}}. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction."
config/jarvis/jarvis-command-profile.json:63 | [Playwright] "playwright_is_scout_not_commander": true,
config/jarvis/jarvis-command-profile.json:137 | [Playwright] "playwright": "portal scout and browser inspection",
config/jarvis/jarvis-command-profile.json:54 | [playwright] "full_personal_assistance_response": "Welcome to Kingsmen Command, Commander. Jarvis is online. Today is {{day}}, {{date}}. The local time is {{time}} in {{location}}. Current conditions are {{weather}}. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction."
config/jarvis/jarvis-command-profile.json:63 | [playwright] "playwright_is_scout_not_commander": true,
config/jarvis/jarvis-command-profile.json:137 | [playwright] "playwright": "portal scout and browser inspection",
config/jarvis/jarvis-command-profile.json:54 | [scout] "full_personal_assistance_response": "Welcome to Kingsmen Command, Commander. Jarvis is online. Today is {{day}}, {{date}}. The local time is {{time}} in {{location}}. Current conditions are {{weather}}. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction."
config/jarvis/jarvis-command-profile.json:63 | [scout] "playwright_is_scout_not_commander": true,
config/jarvis/jarvis-command-profile.json:137 | [scout] "playwright": "portal scout and browser inspection",
config/jarvis/jarvis-command-profile.json:113 | [portal] "portal status",
config/jarvis/jarvis-command-profile.json:137 | [portal] "playwright": "portal scout and browser inspection",
config/jarvis/jarvis-command-profile.json:137 | [browser] "playwright": "portal scout and browser inspection",
config/jarvis/jarvis-command-profile.json:51 | [automation] "morning_response": "Good morning, Commander. Welcome to Kingsmen Command. Jarvis is online. Today is {{day}}, {{date}}, and the local time is {{time}}. Your command desk is prepared for system health, route intelligence, documents, finance, automation, live research, personal assistance, and priority decisions.",
config/jarvis/jarvis-command-profile.json:54 | [automation] "full_personal_assistance_response": "Welcome to Kingsmen Command, Commander. Jarvis is online. Today is {{day}}, {{date}}. The local time is {{time}} in {{location}}. Current conditions are {{weather}}. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction."
config/jarvis/jarvis-command-profile.json:67 | [automation] "manual_fallback_when_automation_unsafe": true,
config/providers/provider-registry.json:20 | [Playwright] "playwrightScoutOnly": true,
config/providers/provider-registry.json:46 | [Playwright] "playwright_scout",
config/providers/provider-registry.json:392 | [Playwright] "playwright": {
config/providers/provider-registry.json:397 | [Playwright] "key": "playwright_scout",
config/providers/provider-registry.json:402 | [Playwright] "PLAYWRIGHT_ENABLED",
config/providers/provider-registry.json:403 | [Playwright] "PLAYWRIGHT_SERVICE_URL",
config/providers/provider-registry.json:404 | [Playwright] "PLAYWRIGHT_MAX_CONCURRENCY",
config/providers/provider-registry.json:405 | [Playwright] "PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED",
config/providers/provider-registry.json:406 | [Playwright] "PLAYWRIGHT_OTP_BYPASS_ALLOWED",
config/providers/provider-registry.json:407 | [Playwright] "PLAYWRIGHT_MAP_FALLBACK_ON_BLOCK"
config/providers/provider-registry.json:450 | [Playwright] "playwright_scout"
config/providers/provider-registry.json:20 | [playwright] "playwrightScoutOnly": true,
config/providers/provider-registry.json:46 | [playwright] "playwright_scout",
config/providers/provider-registry.json:392 | [playwright] "playwright": {
config/providers/provider-registry.json:397 | [playwright] "key": "playwright_scout",
config/providers/provider-registry.json:402 | [playwright] "PLAYWRIGHT_ENABLED",
config/providers/provider-registry.json:403 | [playwright] "PLAYWRIGHT_SERVICE_URL",
config/providers/provider-registry.json:404 | [playwright] "PLAYWRIGHT_MAX_CONCURRENCY",
config/providers/provider-registry.json:405 | [playwright] "PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED",
config/providers/provider-registry.json:406 | [playwright] "PLAYWRIGHT_OTP_BYPASS_ALLOWED",
config/providers/provider-registry.json:407 | [playwright] "PLAYWRIGHT_MAP_FALLBACK_ON_BLOCK"
config/providers/provider-registry.json:450 | [playwright] "playwright_scout"
config/providers/provider-registry.json:20 | [scout] "playwrightScoutOnly": true,
config/providers/provider-registry.json:46 | [scout] "playwright_scout",
config/providers/provider-registry.json:393 | [scout] "authority": "scout_probe_not_crutch",
config/providers/provider-registry.json:397 | [scout] "key": "playwright_scout",
config/providers/provider-registry.json:450 | [scout] "playwright_scout"
config/providers/provider-registry.json:393 | [probe] "authority": "scout_probe_not_crutch",
config/providers/provider-registry.json:198 | [portal] "safeFallback": "Queue message, generate founder action packet, and keep candidate portal status visible."
config/providers/provider-registry.json:224 | [portal] "failurePolicy": "use_email_primary_and_portal_status",
config/providers/provider-registry.json:225 | [portal] "safeFallback": "Do not send WhatsApp. Use email and portal status unless emergency templates are configured."
config/providers/provider-registry.json:246 | [portal] "safeFallback": "Use email-primary communication and portal status."
config/providers/provider-registry.json:271 | [portal] "failurePolicy": "use_email_primary_and_portal_status",
config/providers/provider-registry.json:291 | [portal] "failurePolicy": "use_email_primary_and_portal_status",
config/providers/provider-registry.json:292 | [portal] "safeFallback": "Use email and portal status."
config/providers/provider-registry.json:411 | [portal] "PORTAL_PASSWORD",
config/providers/provider-registry.json:405 | [CAPTCHA] "PLAYWRIGHT_CAPTCHA_BYPASS_ALLOWED",
config/providers/provider-registry.json:406 | [OTP] "PLAYWRIGHT_OTP_BYPASS_ALLOWED",
config/providers/provider-registry.json:28 | [browser] "serviceRoleInBrowserAllowed": false,
config/providers/provider-registry.json:73 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:93 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:119 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:147 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:193 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:241 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:287 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:330 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:357 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:383 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:398 | [browser] "kind": "browser_automation",
config/providers/provider-registry.json:410 | [browser] "envForbiddenInBrowser": [
config/providers/provider-registry.json:398 | [automation] "kind": "browser_automation",
data/personal-job-desk/job-search-sources.local.example.json:46 | [Playwright] "id": "example-playwright-careers-page",
data/personal-job-desk/job-search-sources.local.example.json:47 | [Playwright] "label": "Example Playwright careers page scout",
data/personal-job-desk/job-search-sources.local.example.json:49 | [Playwright] "adapter": "playwrightPage",
data/personal-job-desk/job-search-sources.local.example.json:46 | [playwright] "id": "example-playwright-careers-page",
data/personal-job-desk/job-search-sources.local.example.json:47 | [playwright] "label": "Example Playwright careers page scout",
data/personal-job-desk/job-search-sources.local.example.json:49 | [playwright] "adapter": "playwrightPage",
data/personal-job-desk/job-search-sources.local.example.json:47 | [scout] "label": "Example Playwright careers page scout",
data/personal-job-desk/job-search-sources.local.example.json:7 | [CAPTCHA] "noCaptchaBypass": true,
data/personal-job-desk/sa-job-sources.local.example.json:7 | [CAPTCHA] "noCaptchaBypass": true,
data/personal-job-desk/source-scout-queue.local.example.json:3 | [Playwright] "purpose": "Optional local override queue for PJ19 Playwright source scouting. If source-scout-queue.local.json is absent, PJ19 builds a queue from PJ18 SA sources.",
data/personal-job-desk/source-scout-queue.local.example.json:3 | [playwright] "purpose": "Optional local override queue for PJ19 Playwright source scouting. If source-scout-queue.local.json is absent, PJ19 builds a queue from PJ18 SA sources.",
data/personal-job-desk/source-scout-queue.local.example.json:2 | [scout] "schema": "kingsmen.personal-jobs-19.source-scout-queue.v1",
data/personal-job-desk/source-scout-queue.local.example.json:3 | [scout] "purpose": "Optional local override queue for PJ19 Playwright source scouting. If source-scout-queue.local.json is absent, PJ19 builds a queue from PJ18 SA sources.",
data/personal-job-desk/source-scout-queue.local.example.json:9 | [CAPTCHA] "noCaptchaBypass": true,
db/migrations/0001_n03_truth_vault.sql:394 | [Playwright] ('PLAYWRIGHT_MODE', '{"value": "scout_probe"}'::jsonb, 'Playwright is scout/probe only.'),
db/migrations/0001_n03_truth_vault.sql:394 | [playwright] ('PLAYWRIGHT_MODE', '{"value": "scout_probe"}'::jsonb, 'Playwright is scout/probe only.'),
db/migrations/0001_n03_truth_vault.sql:394 | [scout] ('PLAYWRIGHT_MODE', '{"value": "scout_probe"}'::jsonb, 'Playwright is scout/probe only.'),
db/migrations/0001_n03_truth_vault.sql:394 | [probe] ('PLAYWRIGHT_MODE', '{"value": "scout_probe"}'::jsonb, 'Playwright is scout/probe only.'),
db/migrations/0001_n03_truth_vault.sql:66 | [portal] portal_health text NOT NULL DEFAULT 'UNKNOWN',
db/migrations/0001_n03_truth_vault.sql:101 | [portal] CONSTRAINT applications_portal_health_check CHECK (
db/migrations/0001_n03_truth_vault.sql:102 | [portal] portal_health IN (
db/migrations/0001_n03_truth_vault.sql:395 | [portal] ('MAP_FALLBACK_ENABLED', '{"value": true}'::jsonb, 'Blocked portals route to manual MAP fallback.')
db/migrations/0001_n03_truth_vault.sql:105 | [CAPTCHA] 'CAPTCHA_BLOCKED',
db/migrations/0001_n03_truth_vault.sql:104 | [OTP] 'OTP_REQUIRED',
db/migrations/0001_n03_truth_vault.sql:395 | [MAP fallback] ('MAP_FALLBACK_ENABLED', '{"value": true}'::jsonb, 'Blocked portals route to manual MAP fallback.')
db/migrations/0002_n04_candidate_core.sql:1 | [portal] -- N04 - Candidate Core & Portal
db/migrations/0002_n04_candidate_core.sql:100 | [portal] channel IN ('EMAIL', 'WHATSAPP', 'SMS', 'PORTAL')
db/migrations/0003_n05_document_vault.sql:19 | [portal] source_channel text NOT NULL DEFAULT 'PORTAL',
db/migrations/0003_n05_document_vault.sql:58 | [portal] source_channel IN ('PORTAL', 'EMAIL', 'OPERATOR', 'IMPORT', 'WHATSAPP_URGENT')
db/migrations/0004_n06_route_universe.sql:181 | [Playwright] playwright_allowed boolean NOT NULL DEFAULT false,
db/migrations/0004_n06_route_universe.sql:181 | [playwright] playwright_allowed boolean NOT NULL DEFAULT false,
db/migrations/0004_n06_route_universe.sql:41 | [portal] 'APPLICATION_PORTAL',
db/migrations/0004_n06_route_universe.sql:90 | [portal] application_method IN ('DIRECT_PORTAL', 'CAO', 'NSFAS', 'EMAIL', 'MANUAL', 'JOB_BOARD', 'UNKNOWN')
db/migrations/0004_n06_route_universe.sql:170 | [portal] CREATE TABLE IF NOT EXISTS portal_dna (
db/migrations/0004_n06_route_universe.sql:173 | [portal] portal_key text UNIQUE NOT NULL,
db/migrations/0004_n06_route_universe.sql:174 | [portal] portal_name text NOT NULL,
db/migrations/0004_n06_route_universe.sql:175 | [portal] portal_url text NOT NULL,
db/migrations/0004_n06_route_universe.sql:187 | [portal] CONSTRAINT portal_dna_confidence_check CHECK (
db/migrations/0004_n06_route_universe.sql:192 | [portal] CREATE TABLE IF NOT EXISTS portal_health_checks (
db/migrations/0004_n06_route_universe.sql:194 | [portal] portal_id uuid REFERENCES portal_dna(id) ON DELETE CASCADE,
db/migrations/0004_n06_route_universe.sql:205 | [portal] CONSTRAINT portal_health_status_check CHECK (
db/migrations/0004_n06_route_universe.sql:220 | [portal] portal_health_status text NOT NULL DEFAULT 'UNKNOWN',
db/migrations/0004_n06_route_universe.sql:239 | [portal] CONSTRAINT workbench_portal_health_check CHECK (
db/migrations/0004_n06_route_universe.sql:240 | [portal] portal_health_status IN ('OPEN', 'OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'DOWN', 'MANUAL_ONLY', 'UNKNOWN')
db/migrations/0004_n06_route_universe.sql:321 | [portal] reason_code IN ('OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'PORTAL_DOWN', 'MANUAL_ONLY', 'SOURCE_REVIEW_REQUIRED', 'OTHER')
db/migrations/0004_n06_route_universe.sql:334 | [portal] CREATE INDEX IF NOT EXISTS idx_portal_dna_provider ON portal_dna(provider_id);
db/migrations/0004_n06_route_universe.sql:335 | [portal] CREATE INDEX IF NOT EXISTS idx_portal_health_portal ON portal_health_checks(portal_id, checked_at DESC);
db/migrations/0004_n06_route_universe.sql:349 | [portal] ALTER TABLE portal_dna ENABLE ROW LEVEL SECURITY;
db/migrations/0004_n06_route_universe.sql:350 | [portal] ALTER TABLE portal_health_checks ENABLE ROW LEVEL SECURITY;
db/migrations/0004_n06_route_universe.sql:381 | [portal] DROP POLICY IF EXISTS service_role_all_portal_dna ON portal_dna;
db/migrations/0004_n06_route_universe.sql:382 | [portal] CREATE POLICY service_role_all_portal_dna ON portal_dna
db/migrations/0004_n06_route_universe.sql:385 | [portal] DROP POLICY IF EXISTS service_role_all_portal_health_checks ON portal_health_checks;
db/migrations/0004_n06_route_universe.sql:386 | [portal] CREATE POLICY service_role_all_portal_health_checks ON portal_health_checks
db/migrations/0004_n06_route_universe.sql:178 | [CAPTCHA] captcha_risk boolean NOT NULL DEFAULT false,
db/migrations/0004_n06_route_universe.sql:199 | [CAPTCHA] captcha_detected boolean NOT NULL DEFAULT false,
db/migrations/0004_n06_route_universe.sql:206 | [CAPTCHA] health_status IN ('OPEN', 'OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'DOWN', 'MANUAL_ONLY', 'UNKNOWN')
db/migrations/0004_n06_route_universe.sql:240 | [CAPTCHA] portal_health_status IN ('OPEN', 'OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'DOWN', 'MANUAL_ONLY', 'UNKNOWN')
db/migrations/0004_n06_route_universe.sql:321 | [CAPTCHA] reason_code IN ('OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'PORTAL_DOWN', 'MANUAL_ONLY', 'SOURCE_REVIEW_REQUIRED', 'OTHER')
db/migrations/0004_n06_route_universe.sql:177 | [OTP] otp_risk boolean NOT NULL DEFAULT false,
db/migrations/0004_n06_route_universe.sql:198 | [OTP] otp_detected boolean NOT NULL DEFAULT false,
db/migrations/0004_n06_route_universe.sql:206 | [OTP] health_status IN ('OPEN', 'OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'DOWN', 'MANUAL_ONLY', 'UNKNOWN')
db/migrations/0004_n06_route_universe.sql:240 | [OTP] portal_health_status IN ('OPEN', 'OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'DOWN', 'MANUAL_ONLY', 'UNKNOWN')
db/migrations/0004_n06_route_universe.sql:321 | [OTP] reason_code IN ('OTP_REQUIRED', 'CAPTCHA_BLOCKED', 'PORTAL_DOWN', 'MANUAL_ONLY', 'SOURCE_REVIEW_REQUIRED', 'OTHER')
db/migrations/0007_n09_notifications_communications.sql:86 | [portal] create table if not exists public.candidate_portal_messages (
db/migrations/0007_n09_notifications_communications.sql:88 | [portal] portal_message_ref text unique not null,
db/migrations/0007_n09_notifications_communications.sql:162 | [portal] create index if not exists idx_portal_messages_candidate on public.candidate_portal_messages(candidate_ref, created_at desc);
db/migrations/0007_n09_notifications_communications.sql:171 | [portal] alter table public.candidate_portal_messages enable row level security;
db/migrations/0007_n09_notifications_communications.sql:187 | [portal] drop policy if exists candidate_portal_messages_all on public.candidate_portal_messages;
db/migrations/0007_n09_notifications_communications.sql:188 | [portal] create policy candidate_portal_messages_all on public.candidate_portal_messages for all using (true) with check (true);
db/migrations/0009_n11_ai_decision_matching.sql:61 | [portal] portal_health text not null default 'UNKNOWN',
db/migrations/0009_n11_ai_decision_matching.sql:70 | [portal] constraint route_match_portal_health_chk check (portal_health in ('HEALTHY','DEGRADED','BLOCKED','CAPTCHA','OTP_REQUIRED','DOWN','UNKNOWN')),
db/migrations/0009_n11_ai_decision_matching.sql:191 | [portal] signal_type in ('OUTCOME','CONFUSION','DOCUMENT_DELAY','PORTAL_FAILURE','MATCH_QUALITY','CANDIDATE_FEEDBACK','HUMAN_OVERRIDE','PHOENIX_OUTCOME','HARM_SIGNAL')
db/migrations/0009_n11_ai_decision_matching.sql:70 | [CAPTCHA] constraint route_match_portal_health_chk check (portal_health in ('HEALTHY','DEGRADED','BLOCKED','CAPTCHA','OTP_REQUIRED','DOWN','UNKNOWN')),
db/migrations/0009_n11_ai_decision_matching.sql:70 | [OTP] constraint route_match_portal_health_chk check (portal_health in ('HEALTHY','DEGRADED','BLOCKED','CAPTCHA','OTP_REQUIRED','DOWN','UNKNOWN')),
db/migrations/0011_n13_observability_reports_incidents.sql:47 | [Playwright] 'API','WEB','POSTGRES','AIRTABLE','N8N','PAYFAST','EMAIL','WHATSAPP','PLAYWRIGHT','DOCUMENTS','AI','GITHUB','ORACLE_LITE','SUPABASE','UNKNOWN'
db/migrations/0011_n13_observability_reports_incidents.sql:65 | [Playwright] 'CAPACITY','QUEUE','WORKFLOW','DOCUMENT','FINANCE','COMMUNICATION','MATCHING','PLAYWRIGHT','DB','API','WEB','STORAGE','AI','RISK'
db/migrations/0011_n13_observability_reports_incidents.sql:94 | [Playwright] 'SYSTEM','WORKFLOW','PAYMENT','DOCUMENT','COMMUNICATION','PLAYWRIGHT','PORTAL','SOURCE','PRIVACY','SECURITY','MATCHING','MANUAL_FALLBACK','CAPACITY','OTHER'
db/migrations/0011_n13_observability_reports_incidents.sql:142 | [Playwright] 'MORNING_FOUNDER','MIDDAY_FOUNDER','EVENING_FOUNDER','INCIDENT','FINANCE','DOCUMENT_PIPELINE','MATCHING','DISPATCH','PLAYWRIGHT','MANUAL_FALLBACK','PORTAL_HEALTH','RISK','SYSTEM_HEALTH','BACKUP','CAPACITY','WEEKLY','MONTHLY'
db/migrations/0011_n13_observability_reports_incidents.sql:47 | [playwright] 'API','WEB','POSTGRES','AIRTABLE','N8N','PAYFAST','EMAIL','WHATSAPP','PLAYWRIGHT','DOCUMENTS','AI','GITHUB','ORACLE_LITE','SUPABASE','UNKNOWN'
db/migrations/0011_n13_observability_reports_incidents.sql:65 | [playwright] 'CAPACITY','QUEUE','WORKFLOW','DOCUMENT','FINANCE','COMMUNICATION','MATCHING','PLAYWRIGHT','DB','API','WEB','STORAGE','AI','RISK'
db/migrations/0011_n13_observability_reports_incidents.sql:94 | [playwright] 'SYSTEM','WORKFLOW','PAYMENT','DOCUMENT','COMMUNICATION','PLAYWRIGHT','PORTAL','SOURCE','PRIVACY','SECURITY','MATCHING','MANUAL_FALLBACK','CAPACITY','OTHER'
db/migrations/0011_n13_observability_reports_incidents.sql:142 | [playwright] 'MORNING_FOUNDER','MIDDAY_FOUNDER','EVENING_FOUNDER','INCIDENT','FINANCE','DOCUMENT_PIPELINE','MATCHING','DISPATCH','PLAYWRIGHT','MANUAL_FALLBACK','PORTAL_HEALTH','RISK','SYSTEM_HEALTH','BACKUP','CAPACITY','WEEKLY','MONTHLY'
db/migrations/0011_n13_observability_reports_incidents.sql:94 | [portal] 'SYSTEM','WORKFLOW','PAYMENT','DOCUMENT','COMMUNICATION','PLAYWRIGHT','PORTAL','SOURCE','PRIVACY','SECURITY','MATCHING','MANUAL_FALLBACK','CAPACITY','OTHER'
db/migrations/0011_n13_observability_reports_incidents.sql:142 | [portal] 'MORNING_FOUNDER','MIDDAY_FOUNDER','EVENING_FOUNDER','INCIDENT','FINANCE','DOCUMENT_PIPELINE','MATCHING','DISPATCH','PLAYWRIGHT','MANUAL_FALLBACK','PORTAL_HEALTH','RISK','SYSTEM_HEALTH','BACKUP','CAPACITY','WEEKLY','MONTHLY'
db/migrations/0011_n13_observability_reports_incidents.sql:236 | [portal] constraint system_alert_channel_chk check (target_channel in ('EMAIL','PORTAL','WHATSAPP_URGENT','SMS_BACKUP','CONTROL_PLANE'))
db/migrations/0011_n13_observability_reports_incidents.sql:250 | [portal] constraint report_delivery_channel_chk check (channel in ('EMAIL','PORTAL','WHATSAPP_URGENT','SMS_BACKUP','CONTROL_PLANE')),
db/migrations/0012_n14_integrations_workflow_connectors.sql:134 | [Playwright] create table if not exists public.playwright_probe_events (
db/migrations/0012_n14_integrations_workflow_connectors.sql:191 | [Playwright] alter table public.playwright_probe_events enable row level security;
db/migrations/0012_n14_integrations_workflow_connectors.sql:211 | [Playwright] drop policy if exists playwright_probe_events_all on public.playwright_probe_events;
db/migrations/0012_n14_integrations_workflow_connectors.sql:212 | [Playwright] create policy playwright_probe_events_all on public.playwright_probe_events for all using (true) with check (true);
db/migrations/0012_n14_integrations_workflow_connectors.sql:134 | [playwright] create table if not exists public.playwright_probe_events (
db/migrations/0012_n14_integrations_workflow_connectors.sql:191 | [playwright] alter table public.playwright_probe_events enable row level security;
db/migrations/0012_n14_integrations_workflow_connectors.sql:211 | [playwright] drop policy if exists playwright_probe_events_all on public.playwright_probe_events;
db/migrations/0012_n14_integrations_workflow_connectors.sql:212 | [playwright] create policy playwright_probe_events_all on public.playwright_probe_events for all using (true) with check (true);
db/migrations/0012_n14_integrations_workflow_connectors.sql:134 | [probe] create table if not exists public.playwright_probe_events (
db/migrations/0012_n14_integrations_workflow_connectors.sql:136 | [probe] probe_ref text unique not null,
db/migrations/0012_n14_integrations_workflow_connectors.sql:140 | [probe] probe_type text not null,
db/migrations/0012_n14_integrations_workflow_connectors.sql:141 | [probe] probe_status text not null default 'PENDING',
db/migrations/0012_n14_integrations_workflow_connectors.sql:191 | [probe] alter table public.playwright_probe_events enable row level security;
db/migrations/0012_n14_integrations_workflow_connectors.sql:211 | [probe] drop policy if exists playwright_probe_events_all on public.playwright_probe_events;
db/migrations/0012_n14_integrations_workflow_connectors.sql:212 | [probe] create policy playwright_probe_events_all on public.playwright_probe_events for all using (true) with check (true);
db/migrations/0012_n14_integrations_workflow_connectors.sql:137 | [portal] portal_ref text not null,
db/migrations/0013_n15_opportunity_engine.sql:193 | [portal] constraint opportunity_alert_type_chk check (alert_type in ('OPENING','DEADLINE','STALE_SOURCE','SOURCE_CHANGE','REVIEW_REQUIRED','PORTAL_BLOCKED','RISK')),
db/migrations/0014_n16_orchestrator_execution.sql:18 | [Playwright] can_dispatch_playwright boolean not null default false,
db/migrations/0014_n16_orchestrator_execution.sql:23 | [Playwright] constraint orchestrator_worker_kind_chk check (worker_kind in ('INTAKE','EVALUATION','EXECUTION','GOVERNANCE','DOCUMENT','COMMUNICATION','FINANCE','CONTENT','ANALYTICS','COMMAND','KERNEL','PLAYWRIGHT','STATUS','OUTREACH')),
db/migrations/0014_n16_orchestrator_execution.sql:18 | [playwright] can_dispatch_playwright boolean not null default false,
db/migrations/0014_n16_orchestrator_execution.sql:23 | [playwright] constraint orchestrator_worker_kind_chk check (worker_kind in ('INTAKE','EVALUATION','EXECUTION','GOVERNANCE','DOCUMENT','COMMUNICATION','FINANCE','CONTENT','ANALYTICS','COMMAND','KERNEL','PLAYWRIGHT','STATUS','OUTREACH')),
db/migrations/0014_n16_orchestrator_execution.sql:170 | [portal] constraint orchestrator_handoff_type_chk check (handoff_type in ('MAP','CAPTCHA','OTP','PORTAL_DOWN','MANUAL_ONLY','HUMAN_APPROVAL','PHOENIX_FALLBACK','DOCUMENT_REVIEW','SOURCE_REVIEW')),
db/migrations/0014_n16_orchestrator_execution.sql:170 | [CAPTCHA] constraint orchestrator_handoff_type_chk check (handoff_type in ('MAP','CAPTCHA','OTP','PORTAL_DOWN','MANUAL_ONLY','HUMAN_APPROVAL','PHOENIX_FALLBACK','DOCUMENT_REVIEW','SOURCE_REVIEW')),
db/migrations/0014_n16_orchestrator_execution.sql:170 | [OTP] constraint orchestrator_handoff_type_chk check (handoff_type in ('MAP','CAPTCHA','OTP','PORTAL_DOWN','MANUAL_ONLY','HUMAN_APPROVAL','PHOENIX_FALLBACK','DOCUMENT_REVIEW','SOURCE_REVIEW')),
db/migrations/0015_n17_founder_command_ops.sql:91 | [Playwright] map_playwright_summary jsonb not null default '{}'::jsonb,
db/migrations/0015_n17_founder_command_ops.sql:119 | [Playwright] constraint founder_watch_type_chk check (watch_type in ('CANDIDATE','APPLICATION','DOCUMENT','ROUTE','SOURCE','FINANCE','COMMS','INCIDENT','CAPACITY','PLAYWRIGHT','MAP','PHOENIX')),
db/migrations/0015_n17_founder_command_ops.sql:91 | [playwright] map_playwright_summary jsonb not null default '{}'::jsonb,
db/migrations/0015_n17_founder_command_ops.sql:119 | [playwright] constraint founder_watch_type_chk check (watch_type in ('CANDIDATE','APPLICATION','DOCUMENT','ROUTE','SOURCE','FINANCE','COMMS','INCIDENT','CAPACITY','PLAYWRIGHT','MAP','PHOENIX')),
db/migrations/0015_n17_founder_command_ops.sql:141 | [portal] constraint founder_escalation_type_chk check (escalation_type in ('DEADLINE','DOCUMENT','PORTAL_BLOCKED','PAYMENT','REFUND','FRAUD_REVIEW','PRIVACY','SOURCE_REVIEW','SYSTEM_INCIDENT','CANDIDATE_HARM','MANUAL_BACKLOG','CAPACITY')),
db/migrations/0016_n18_public_website.sql:138 | [portal] constraint public_website_conversion_type_chk check (event_type in ('PAGE_VIEW','CTA_CLICK','DESTINY_MAP_REQUEST','CV_REVAMP_INTEREST','ACCOMMODATION_INTEREST','PACKAGE_ACTIVATION_CLICK','CONTACT_SUBMIT','LEGAL_NOTICE_VIEW','PORTAL_HANDOFF'))
db/migrations/0017_n19_candidate_mobile_public_portal.sql:1 | [portal] -- N19 Candidate Mobile / Public-to-Portal Experience
db/migrations/0017_n19_candidate_mobile_public_portal.sql:2 | [portal] -- PostgreSQL remains truth. Mobile is a responsive portal experience, not a second source of truth.
db/migrations/0017_n19_candidate_mobile_public_portal.sql:3 | [portal] -- Markers: MOBILE_WEB_FIRST PUBLIC_TO_PORTAL_HANDOFF EMAIL_PRIMARY WHATSAPP_URGENT_ONLY NO_FAKE_STATUS
db/migrations/0017_n19_candidate_mobile_public_portal.sql:27 | [portal] auth_context text not null default 'portal',
db/migrations/0017_n19_candidate_mobile_public_portal.sql:36 | [portal] create table if not exists public.public_to_portal_claims (
db/migrations/0017_n19_candidate_mobile_public_portal.sql:122 | [portal] create table if not exists public.candidate_portal_resume_tokens (
db/migrations/0017_n19_candidate_mobile_public_portal.sql:148 | [portal] create index if not exists idx_public_to_portal_claims_status on public.public_to_portal_claims(claim_status);
db/migrations/0017_n19_candidate_mobile_public_portal.sql:155 | [portal] alter table public.public_to_portal_claims enable row level security;
db/migrations/0017_n19_candidate_mobile_public_portal.sql:161 | [portal] alter table public.candidate_portal_resume_tokens enable row level security;
db/migrations/0017_n19_candidate_mobile_public_portal.sql:170 | [portal] drop policy if exists service_all_public_to_portal_claims on public.public_to_portal_claims;
db/migrations/0017_n19_candidate_mobile_public_portal.sql:171 | [portal] create policy service_all_public_to_portal_claims on public.public_to_portal_claims for all using (true) with check (true);
db/migrations/0017_n19_candidate_mobile_public_portal.sql:188 | [portal] drop policy if exists service_all_candidate_portal_resume_tokens on public.candidate_portal_resume_tokens;
db/migrations/0017_n19_candidate_mobile_public_portal.sql:189 | [portal] create policy service_all_candidate_portal_resume_tokens on public.candidate_portal_resume_tokens for all using (true) with check (true);
db/migrations/0018_n20_final_assembly_system_lock.sql:115 | [automation] automation_allowed boolean not null default false,
db/seeds/n03_source_authorities_seed.sql:15 | [portal] ('cao', 'Central Applications Office', 'application_portal', 'https://www.cao.ac.za', 'A', true, 'Official CAO application source.'),
db/seeds/n06_route_universe_seed.sql:225 | [Playwright] playwright_allowed,
db/seeds/n06_route_universe_seed.sql:254 | [Playwright] playwright_allowed = EXCLUDED.playwright_allowed,
db/seeds/n06_route_universe_seed.sql:270 | [Playwright] playwright_allowed,
db/seeds/n06_route_universe_seed.sql:299 | [Playwright] playwright_allowed = EXCLUDED.playwright_allowed,
db/seeds/n06_route_universe_seed.sql:225 | [playwright] playwright_allowed,
db/seeds/n06_route_universe_seed.sql:254 | [playwright] playwright_allowed = EXCLUDED.playwright_allowed,
db/seeds/n06_route_universe_seed.sql:270 | [playwright] playwright_allowed,
db/seeds/n06_route_universe_seed.sql:299 | [playwright] playwright_allowed = EXCLUDED.playwright_allowed,
db/seeds/n06_route_universe_seed.sql:8 | [portal] ('CAO_CHILD_CHOICES_MAX', '{"value": 6}'::jsonb, 'CAO is one Kingsmen application with up to six CAO choices based on CAO portal rule.'),
db/seeds/n06_route_universe_seed.sql:10 | [portal] ('MAP_FALLBACK_FOR_BLOCKED_PORTALS', '{"value": true}'::jsonb, 'OTP/CAPTCHA/down/manual-only portals use Manual Application Package fallback.'),
db/seeds/n06_route_universe_seed.sql:48 | [portal] ('cao_official', 'Central Applications Office', 'application_portal', 'https://www.cao.ac.za/', 'A', true, 'Official CAO portal for applications, documents, programme choices, payments and status checks.'),
db/seeds/n06_route_universe_seed.sql:78 | [portal] 'APPLICATION_PORTAL',
db/seeds/n06_route_universe_seed.sql:86 | [portal] 'CAO route: one Kingsmen application with up to six internal CAO choices; fees and deadlines remain source-verified portal rules.'
db/seeds/n06_route_universe_seed.sql:215 | [portal] INSERT INTO portal_dna (
db/seeds/n06_route_universe_seed.sql:217 | [portal] portal_key,
db/seeds/n06_route_universe_seed.sql:218 | [portal] portal_name,
db/seeds/n06_route_universe_seed.sql:219 | [portal] portal_url,
db/seeds/n06_route_universe_seed.sql:232 | [portal] 'cao_portal',
db/seeds/n06_route_universe_seed.sql:233 | [portal] 'CAO Portal',
db/seeds/n06_route_universe_seed.sql:245 | [portal] ON CONFLICT (portal_key) DO UPDATE SET
db/seeds/n06_route_universe_seed.sql:247 | [portal] portal_name = EXCLUDED.portal_name,
db/seeds/n06_route_universe_seed.sql:248 | [portal] portal_url = EXCLUDED.portal_url,
db/seeds/n06_route_universe_seed.sql:260 | [portal] INSERT INTO portal_dna (
db/seeds/n06_route_universe_seed.sql:262 | [portal] portal_key,
db/seeds/n06_route_universe_seed.sql:263 | [portal] portal_name,
db/seeds/n06_route_universe_seed.sql:264 | [portal] portal_url,
db/seeds/n06_route_universe_seed.sql:277 | [portal] 'mynsfas_portal',
db/seeds/n06_route_universe_seed.sql:278 | [portal] 'myNSFAS Portal',
db/seeds/n06_route_universe_seed.sql:290 | [portal] ON CONFLICT (portal_key) DO UPDATE SET
db/seeds/n06_route_universe_seed.sql:292 | [portal] portal_name = EXCLUDED.portal_name,
db/seeds/n06_route_universe_seed.sql:293 | [portal] portal_url = EXCLUDED.portal_url,
db/seeds/n06_route_universe_seed.sql:10 | [CAPTCHA] ('MAP_FALLBACK_FOR_BLOCKED_PORTALS', '{"value": true}'::jsonb, 'OTP/CAPTCHA/down/manual-only portals use Manual Application Package fallback.'),
db/seeds/n06_route_universe_seed.sql:222 | [CAPTCHA] captcha_risk,
db/seeds/n06_route_universe_seed.sql:251 | [CAPTCHA] captcha_risk = EXCLUDED.captcha_risk,
db/seeds/n06_route_universe_seed.sql:267 | [CAPTCHA] captcha_risk,
db/seeds/n06_route_universe_seed.sql:287 | [CAPTCHA] 'myNSFAS requires account login and may use CAPTCHA/identity controls. Use support and manual confirmation boundary.',
db/seeds/n06_route_universe_seed.sql:296 | [CAPTCHA] captcha_risk = EXCLUDED.captcha_risk,
db/seeds/n06_route_universe_seed.sql:10 | [OTP] ('MAP_FALLBACK_FOR_BLOCKED_PORTALS', '{"value": true}'::jsonb, 'OTP/CAPTCHA/down/manual-only portals use Manual Application Package fallback.'),
db/seeds/n06_route_universe_seed.sql:221 | [OTP] otp_risk,
db/seeds/n06_route_universe_seed.sql:250 | [OTP] otp_risk = EXCLUDED.otp_risk,
db/seeds/n06_route_universe_seed.sql:266 | [OTP] otp_risk,
db/seeds/n06_route_universe_seed.sql:295 | [OTP] otp_risk = EXCLUDED.otp_risk,
db/seeds/n06_route_universe_seed.sql:10 | [Manual Application Package] ('MAP_FALLBACK_FOR_BLOCKED_PORTALS', '{"value": true}'::jsonb, 'OTP/CAPTCHA/down/manual-only portals use Manual Application Package fallback.'),
db/seeds/n07_airtable_sync_seed.sql:4 | [portal] ('nexus_7', 'Kingsman Nexus-7', 'Candidate portal sessions, form drafts, onboarding, notifications, and portal mirror.', true, true, true),
db/seeds/n07_airtable_sync_seed.sql:6 | [portal] ('applications_hub', 'Applications Hub', 'Applications, timeline, war room, automation runs, and portal execution mirror.', true, false, true),
db/seeds/n07_airtable_sync_seed.sql:14 | [portal] ('partner_ecosystem', 'Partner Ecosystem Directory', 'Institutions, SETA providers, employers, bursary providers, portal DNA, fees, contacts, and health monitor mirror.', true, false, true),
db/seeds/n07_airtable_sync_seed.sql:33 | [portal] ('partner_ecosystem', 'portal_dna', 'Portal DNA', 'portal_dna', 'POSTGRES_TO_AIRTABLE', 30, 600, true),
db/seeds/n07_airtable_sync_seed.sql:34 | [portal] ('partner_ecosystem', 'health_monitor', 'Health Monitor', 'portal_health_events', 'POSTGRES_TO_AIRTABLE', 20, 300, true),
db/seeds/n07_airtable_sync_seed.sql:6 | [automation] ('applications_hub', 'Applications Hub', 'Applications, timeline, war room, automation runs, and portal execution mirror.', true, false, true),
db/seeds/n07_airtable_sync_seed.sql:10 | [automation] ('automation_control', 'Automation Control', 'Approvals queue, kill switches, rate limits, trigger rules, and workflow versions mirror.', true, true, true),
db/seeds/n07_airtable_sync_seed.sql:35 | [automation] ('automation_control', 'approvals_queue', 'Approvals Queue', 'operator_approvals', 'BIDIRECTIONAL_REVIEWED', 5, 60, true),
db/seeds/n08_control_plane_seed.sql:38 | [Playwright] ('playwright.pause_portal_probe','Pause Playwright Portal Probe','playwright',false,'Use on CAPTCHA/OTP risk.','founder-primary'),
db/seeds/n08_control_plane_seed.sql:54 | [Playwright] ('playwright_concurrency','Playwright Concurrency Cap',0,3,2,3,3,'NORMAL','{"boundary":"probe/scout only"}'::jsonb),
db/seeds/n08_control_plane_seed.sql:38 | [playwright] ('playwright.pause_portal_probe','Pause Playwright Portal Probe','playwright',false,'Use on CAPTCHA/OTP risk.','founder-primary'),
db/seeds/n08_control_plane_seed.sql:54 | [playwright] ('playwright_concurrency','Playwright Concurrency Cap',0,3,2,3,3,'NORMAL','{"boundary":"probe/scout only"}'::jsonb),
db/seeds/n08_control_plane_seed.sql:54 | [scout] ('playwright_concurrency','Playwright Concurrency Cap',0,3,2,3,3,'NORMAL','{"boundary":"probe/scout only"}'::jsonb),
db/seeds/n08_control_plane_seed.sql:38 | [probe] ('playwright.pause_portal_probe','Pause Playwright Portal Probe','playwright',false,'Use on CAPTCHA/OTP risk.','founder-primary'),
db/seeds/n08_control_plane_seed.sql:54 | [probe] ('playwright_concurrency','Playwright Concurrency Cap',0,3,2,3,3,'NORMAL','{"boundary":"probe/scout only"}'::jsonb),
db/seeds/n08_control_plane_seed.sql:4 | [portal] ('founder-primary', 'Kingsmen Founder', 'kingsmenportal@gmail.com', 'founder',
db/seeds/n08_control_plane_seed.sql:38 | [portal] ('playwright.pause_portal_probe','Pause Playwright Portal Probe','playwright',false,'Use on CAPTCHA/OTP risk.','founder-primary'),
db/seeds/n08_control_plane_seed.sql:38 | [CAPTCHA] ('playwright.pause_portal_probe','Pause Playwright Portal Probe','playwright',false,'Use on CAPTCHA/OTP risk.','founder-primary'),
db/seeds/n08_control_plane_seed.sql:38 | [OTP] ('playwright.pause_portal_probe','Pause Playwright Portal Probe','playwright',false,'Use on CAPTCHA/OTP risk.','founder-primary'),
db/seeds/n08_control_plane_seed.sql:19 | [Manual Application Package] ('route.manual_package_generate','Generate MAP','route','Generate a Manual Application Package with verified links, steps, fees, deadlines, and evidence.',true,false,array['founder','operator']),
db/seeds/n09_communications_seed.sql:7 | [portal] ('candidate.portal.message','Candidate Portal Message','PORTAL_INBOX',null,'{{message_body}}','PORTAL_STATUS',array['ANY'],false),
db/seeds/n09_communications_seed.sql:8 | [portal] ('candidate.map.ready.email','Manual Application Package Ready','EMAIL_PRIMARY','Your manual route package is ready','Hello {{candidate_name}}, a Manual Application Package is ready because the portal was blocked, down, OTP-gated, or unsafe for automation.','MAP_FALLBACK',array['EXECUTION_PENDING','FAILED'],true),
db/seeds/n09_communications_seed.sql:9 | [portal] ('candidate.urgent.whatsapp','Urgent WhatsApp Escalation','WHATSAPP_URGENT_ONLY',null,'Urgent Kingsmen update: {{urgent_reason}}. Please check your email/portal for full details.','URGENT_ESCALATION',array['URGENT_ONLY'],true),
db/seeds/n09_communications_seed.sql:10 | [portal] ('candidate.sms.backup','SMS Backup Notice','SMS_BACKUP_ONLY',null,'Kingsmen: important update sent to your email/portal. Please check when available.','BACKUP_NOTICE',array['EMAIL_FAILED','URGENT_ONLY'],true)
db/seeds/n09_communications_seed.sql:41 | [portal] ('limit.portal.daily','PORTAL_INBOX','DAILY',2000,0,now() + interval '1 day','NORMAL','{"doctrine":"portal visible status"}'::jsonb)
db/seeds/n09_communications_seed.sql:8 | [OTP] ('candidate.map.ready.email','Manual Application Package Ready','EMAIL_PRIMARY','Your manual route package is ready','Hello {{candidate_name}}, a Manual Application Package is ready because the portal was blocked, down, OTP-gated, or unsafe for automation.','MAP_FALLBACK',array['EXECUTION_PENDING','FAILED'],true),
db/seeds/n09_communications_seed.sql:8 | [Manual Application Package] ('candidate.map.ready.email','Manual Application Package Ready','EMAIL_PRIMARY','Your manual route package is ready','Hello {{candidate_name}}, a Manual Application Package is ready because the portal was blocked, down, OTP-gated, or unsafe for automation.','MAP_FALLBACK',array['EXECUTION_PENDING','FAILED'],true),
db/seeds/n09_communications_seed.sql:8 | [automation] ('candidate.map.ready.email','Manual Application Package Ready','EMAIL_PRIMARY','Your manual route package is ready','Hello {{candidate_name}}, a Manual Application Package is ready because the portal was blocked, down, OTP-gated, or unsafe for automation.','MAP_FALLBACK',array['EXECUTION_PENDING','FAILED'],true),
db/seeds/n12_governance_policy_seed.sql:25 | [Phoenix fallback] ('POL-PHOENIX-001','PHOENIX_FALLBACK','Phoenix no false rescue policy','v1','HARD_BLOCK','ACTIVE','Phoenix fallback cannot claim rescue without evidence-backed viable alternatives and human review.',true,true),
db/seeds/n13_observability_seed.sql:5 | [portal] ('EMAIL_FIRST_REPORT_DELIVERY', '{"primary":"EMAIL","secondary":"PORTAL","urgent":"WHATSAPP_URGENT"}', true, 'Email remains primary report delivery.'),
db/seeds/n14_integrations_seed.sql:6 | [Playwright] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:20 | [Playwright] ('W05','Playwright Trigger','SAME','playwright_probe_service',false,true,true,1,1,'Playwright scout/probe with MAP fallback.'),
db/seeds/n14_integrations_seed.sql:6 | [playwright] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:20 | [playwright] ('W05','Playwright Trigger','SAME','playwright_probe_service',false,true,true,1,1,'Playwright scout/probe with MAP fallback.'),
db/seeds/n14_integrations_seed.sql:6 | [scout] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:20 | [scout] ('W05','Playwright Trigger','SAME','playwright_probe_service',false,true,true,1,1,'Playwright scout/probe with MAP fallback.'),
db/seeds/n14_integrations_seed.sql:6 | [probe] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:20 | [probe] ('W05','Playwright Trigger','SAME','playwright_probe_service',false,true,true,1,1,'Playwright scout/probe with MAP fallback.'),
db/seeds/n14_integrations_seed.sql:6 | [portal] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:18 | [portal] ('W03','MSB Execute','COMPLETED','n8n_worker_gateway',false,false,true,1,1,'Execution worker; no portal bypass.'),
db/seeds/n14_integrations_seed.sql:6 | [CAPTCHA] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:6 | [OTP] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:6 | [MAP fallback] ('playwright_probe_service','Playwright Probe Service','PLAYWRIGHT','SCOUT',false,true,'PLAYWRIGHT_SERVICE_TOKEN','PLAYWRIGHT_SERVICE_URL','Scout/probe only; MAP fallback on CAPTCHA, OTP, portal down, blocked.'),
db/seeds/n14_integrations_seed.sql:20 | [MAP fallback] ('W05','Playwright Trigger','SAME','playwright_probe_service',false,true,true,1,1,'Playwright scout/probe with MAP fallback.'),
db/seeds/n16_orchestrator_execution_seed.sql:7 | [Playwright] ('PLAYWRIGHT_SCOUT_ONLY','true'::jsonb,'ORCHESTRATOR',true),
db/seeds/n16_orchestrator_execution_seed.sql:27 | [Playwright] (worker_code, worker_name, worker_kind, target_state, is_same_state_worker, requires_w17_gate, requires_human_approval, can_dispatch_playwright, notes)
db/seeds/n16_orchestrator_execution_seed.sql:34 | [Playwright] ('W05','Playwright Trigger','PLAYWRIGHT','SAME',true,false,false,true,'Probe/scout only; blocked sources create MAP handoff.'),
db/seeds/n16_orchestrator_execution_seed.sql:55 | [Playwright] can_dispatch_playwright = excluded.can_dispatch_playwright,
db/seeds/n16_orchestrator_execution_seed.sql:7 | [playwright] ('PLAYWRIGHT_SCOUT_ONLY','true'::jsonb,'ORCHESTRATOR',true),

TRUNCATED. Full results are in jarvis-full-repo-inventory-hits-20260630-213037.csv.