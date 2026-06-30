const providers = [
  ["openai", "OpenAI Platform", "AI Brain", "needs OPENAI_API_KEY", ["reason", "summarise", "draft", "classify", "plan"]],
  ["github", "GitHub", "Repo Control", "adapter-gated", ["inspect repo", "commit evidence", "open PR", "issues"]],
  ["netlify", "Netlify", "Deployment", "cli-proven / adapter-gated", ["deploy", "logs", "verify", "env"]],
  ["neon", "Neon Postgres", "Database", "needs DATABASE_URL", ["query", "migrate", "health", "branch"]],
  ["supabase", "Supabase", "Database/Auth/Storage", "adapter-gated", ["query", "auth", "storage", "edge functions"]],
  ["airtable", "Airtable", "Ops Mirror", "adapter-gated", ["sync", "read base", "update mirror", "dashboard"]],
  ["drive", "Google Drive", "Documents", "oauth-gated", ["search files", "read docs", "export proof"]],
  ["gmail", "Gmail", "Email Nervous System", "oauth-gated", ["triage", "draft", "send approved", "read thread"]],
  ["calendar", "Google Calendar", "Schedule", "oauth-gated", ["agenda", "events", "free time", "prep"]],
  ["canva", "Canva", "Visual Design", "connector-gated", ["design", "brand", "present", "export"]],
  ["voice", "AI Voice Generator", "Voice Output", "connector-gated", ["voiceover", "Jarvis speech"]],
  ["wisebase", "AI Wisebase", "Knowledge Base", "connector-gated", ["ground answers", "search memory"]],
  ["catalyst", "Catalyst by Zoho", "Serverless", "adapter-gated", ["functions", "data store"]],
  ["lovable", "Lovable", "App Builder", "connector-gated", ["prototype", "generate UI"]],
  ["namecheap", "Namecheap", "Domain", "connector-gated", ["domain search", "pricing"]],
  ["norton", "Norton", "Security", "connector-gated", ["scam check", "risk warning"]],
  ["replit", "Replit", "Runtime/Prototype", "connector-gated", ["run sandbox", "agent build"]],
  ["vivin", "Vivin", "Visual Companion", "connector-gated", ["expression layer"]],
  ["softonic", "Softonic", "Software Discovery", "connector-gated", ["software search"]],
  ["b12", "B12 Website Generator", "Website Builder", "connector-gated", ["site draft", "landing page"]]
].map(([id, name, kind, status, actions]) => ({ id, name, kind, status, actions }));

const workModules = Array.from({ length: 21 }, (_, i) => {
  const code = `N${String(i).padStart(2, "0")}`;
  const names = [
    "Constitution", "Foundation", "Backend Kernel", "Truth Vault", "Candidate Core",
    "Document Vault", "Route Universe", "Airtable Sync", "Control Plane", "Notifications",
    "Finance", "AI Decision Engine", "Governance", "Observability", "Integrations",
    "Opportunity Engine", "Execution Orchestrator", "Founder Plane", "Public Website",
    "Mobile PWA", "Final Integration"
  ];
  return { code, name: names[i], status: "LIVE MAP", gate: i < 6 ? "core" : i < 14 ? "operations" : "scale" };
});

function lines(items) {
  return items.join("\n");
}

function response(tool, reply, stdout, extra = {}) {
  return {
    ok: true,
    tool,
    reply,
    stdout,
    stderr: "",
    evidencePath: "netlify-function:jarvis-agent",
    providers,
    workModules,
    ...extra
  };
}

function makeResponse(message) {
  const text = String(message || "").toLowerCase();

  if (text.includes("openclaw")) {
    return response("OPENCLAW_GATEWAY", "OpenClaw Gateway selected. Command Registry, Policy Gate, Tool Router, and Evidence Ledger are the operating boundary.", lines([
      "OPENCLAW GATEWAY",
      "- Command Registry: classifies requests.",
      "- Policy Gate: blocks unsafe or unproven actions.",
      "- Tool Router: sends approved commands to local/provider adapters.",
      "- Evidence Ledger: records proof before claims.",
      "- Status: live surface; external execution remains adapter-gated."
    ]));
  }

  if (text.includes("playwright")) {
    return response("PLAYWRIGHT_SCOUT", "Playwright Scout selected. It is a probe/scout, not a bypass engine.", lines([
      "PLAYWRIGHT SCOUT",
      "- Purpose: inspect public routes, forms, selectors, and accessibility.",
      "- CAPTCHA/OTP/portal blocked/selector failure: create Manual Application Package.",
      "- No credential bypass. No hidden portal abuse.",
      "- MAP fallback remains the safety net."
    ]));
  }

  if (text.includes("oracle")) {
    return response("ORACLE_LITE_RUNTIME", "Oracle Lite Runtime selected. Local Commander runtime boundary is active.", lines([
      "ORACLE LITE RUNTIME",
      "- Local Windows Commander machine controls PowerShell, Git, PostgreSQL, Docker, validators, and deploy proof.",
      "- Netlify live surface is web-safe.",
      "- Local commands require secured adapter or local execution."
    ]));
  }

  if (text.includes("n00") || text.includes("n20") || text.includes("work map") || text.includes("module")) {
    return response("KINGSMEN_WORK_MAP", "Kingsmen Work Map selected. N00 to N20 are visible and not minimized.", workModules.map(m => `- ${m.code}: ${m.name} | ${m.status} | ${m.gate}`).join("\n"));
  }

  if (text.includes("candidate")) {
    return response("CANDIDATE_OPERATIONS", "Candidate Operations selected: intake, documents, workbench, finance, communications, support, and outcomes.", lines([
      "CANDIDATE OPERATIONS",
      "- Intake and profile review.",
      "- Document vault and verification.",
      "- Application workbench.",
      "- Finance/payment visibility.",
      "- Email-primary communications.",
      "- Support, tribunal intake, and outcomes loop."
    ]));
  }

  if (text.includes("route") || text.includes("cao") || text.includes("nsfas") || text.includes("tvet") || text.includes("seta")) {
    return response("ROUTE_UNIVERSE", "Route Universe selected. Kingsmen is national scope, not CAO-only.", lines([
      "ROUTE UNIVERSE",
      "- CAO routing and change-of-mind support.",
      "- NSFAS readiness, documents, and appeals boundary.",
      "- Universities, TVETs, SETA/QCTO, bursaries, employers.",
      "- Route confidence, source verification, and manual submission fallback.",
      "- Phoenix / MAP fallback where portals block automation."
    ]));
  }

  if (text.includes("provider") || text.includes("connected") || text.includes("gmail") || text.includes("drive") || text.includes("airtable") || text.includes("neon") || text.includes("supabase") || text.includes("canva")) {
    return response("PROVIDER_MATRIX", "Provider Matrix selected. Providers are combined into Jarvis, but actions remain credential/policy/evidence gated.", providers.map(p => `- ${p.name}: ${p.status} | ${p.kind} | ${p.actions.join(", ")}`).join("\n"));
  }

  if (text.includes("evidence") || text.includes("proof") || text.includes("deploy") || text.includes("validation")) {
    return response("EVIDENCE_PROOF_CENTRE", "Evidence & Proof Centre selected. Production claims require deploy logs, validation, incidents, and route-safety proof.", lines([
      "EVIDENCE & PROOF CENTRE",
      "- Live page HTTP 200.",
      "- API HTTP 200.",
      "- KINGSMEN_DOCTRINE verified.",
      "- Deploy logs and proof JSON must be preserved.",
      "- Incidents and route safety remain visible."
    ]));
  }

  if (text.includes("founder") || text.includes("priority") || text.includes("approval") || text.includes("risk")) {
    return response("FOUNDER_COMMAND_PLANE", "Founder Command Plane selected. Actions, risk, approvals, and priority queue are founder-controlled.", lines([
      "FOUNDER COMMAND PLANE",
      "- Mission brief.",
      "- System health.",
      "- Risk digest.",
      "- Route scan.",
      "- Deep search.",
      "- Approvals remain founder-only."
    ]));
  }

  if (text.includes("kingsmen")) {
    return response("KINGSMEN_DOCTRINE", "Kingsmen is the Commander platform: a South African admissions, funding, opportunity, skills, employment, operations, and proof system. It is not a film/franchise answer.", lines([
      "KINGSMEN DOCTRINE",
      "- National SA admissions, funding, opportunity, skills, and employment platform.",
      "- Not CAO-only.",
      "- Email primary. WhatsApp urgent-only. SMS backup.",
      "- PostgreSQL truth. Airtable mirror only.",
      "- Playwright scout only; MAP fallback on blocks.",
      "- Starting cap: 500 active candidates; cap limits volume, not capability.",
      "- Evidence before claims."
    ]));
  }

  if (text.includes("jarvis") || text.includes("brain") || text.includes("think")) {
    return response("COMMAND_BRAIN", "Jarvis Command Brain selected. Jarvis is an operating assistant, not a definition box.", lines([
      "COMMAND BRAIN",
      "- Strategize, inspect, repair, decide, and brief.",
      "- OpenAI-ready reasoning core.",
      "- Context engine, memory rules, policy gates, and evidence-first output.",
      "- Local/provider actions require approved adapters."
    ]));
  }

  return response("COMMAND_RECEIVED", "Command received by live Jarvis OS. Select a module or type OpenClaw, Playwright, Oracle Lite, N00-N20, Candidate Ops, Route Universe, Provider Matrix, Evidence, or Founder Command.", "Jarvis OS is live. This command is routed to the command console.");
}

exports.handler = async function(event) {
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  const startedAt = new Date();
  const result = makeResponse(body.message);
  const finishedAt = new Date();

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    },
    body: JSON.stringify({
      ...result,
      selectedTool: result.tool,
      message: body.message || "",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime()
    })
  };
};