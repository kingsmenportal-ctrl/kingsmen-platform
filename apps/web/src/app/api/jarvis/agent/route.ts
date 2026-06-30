import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ToolResult = {
  ok: boolean;
  tool: string;
  reply: string;
  stdout: string;
  stderr: string;
  evidencePath: string;
};

const evidencePath = "netlify-live-jarvis-agent:web-safe-evidence-boundary";

function cleanMessage(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function doctrineResult(tool: string, reply: string, stdout: string, ok = true): ToolResult {
  return {
    ok,
    tool,
    reply,
    stdout,
    stderr: ok ? "" : "Local Commander runtime unavailable on Netlify live surface.",
    evidencePath
  };
}

function identifyTool(message: string) {
  const text = message.toLowerCase();

  if (text.includes("kingsmen")) return "KINGSMEN_DOCTRINE";
  if (text.includes("who are you") || text.includes("what are you") || text.includes("tell about jarvis") || text.includes("tell me about jarvis") || text.includes("jarvis")) return "JARVIS_IDENTITY";
  if (text.includes("connected") || text.includes("connection") || text.includes("operate like")) return "CONNECTION_STATUS";
  if (text.includes("priority brief") || text.includes("next 6 hours") || text.includes("brief")) return "PRIORITY_BRIEF";
  if (text.includes("execution plan") || text.includes("break this objective") || text.includes("plan")) return "EXECUTION_PLAN";
  if (text.includes("deploy") || text.includes("live") || text.includes("netlify")) return "DEPLOYMENT_STATUS";
  if (text.includes("help") || text.includes("what can you do")) return "HELP";
  if (text.includes("build") || text.includes("validate") || text.includes("database") || text.includes("postgres") || text.includes("git") || text.includes("powershell") || text.includes("create file") || text.includes("route probe")) return "LOCAL_COMMAND_BOUNDARY";
  return "COMMAND_BRIEF";
}

function kingsmenDoctrine(): ToolResult {
  return doctrineResult(
    "KINGSMEN_DOCTRINE",
    "Kingsmen is the Commander platform: a South African admissions, funding, opportunity, skills, employment, operations, and proof system. It is not a film franchise answer. It is the command house we are building.",
    [
      "KINGSMEN DOCTRINE",
      "- National South African admissions, funding, opportunity, skills, and employment platform.",
      "- Not CAO-only. CAO, NSFAS, universities, TVETs, SETA/QCTO, bursaries, employers, and manual fallback routes remain in scope.",
      "- Email is the primary tracked channel. WhatsApp is urgent-only. SMS is backup.",
      "- Playwright is probe/scout only. CAPTCHA, OTP, portal blocks, selector failures, and capacity limits must move to Manual Application Package fallback.",
      "- PostgreSQL is truth. Airtable is mirror only. n8n is thin wrapper only. Secrets stay vaulted.",
      "- Starting operational cap is 500 active candidates; caps limit volume, not capability.",
      "- No production claim is valid without evidence."
    ].join("\n")
  );
}

function jarvisIdentity(): ToolResult {
  return doctrineResult(
    "JARVIS_IDENTITY",
    "Jarvis is the Commander-only command assistant for Kingsmen. I speak in disciplined command tone, route work through safe tools, and separate proven runtime from unproven claims.",
    [
      "JARVIS IDENTITY",
      "- Commander-only interface inside Kingsmen Command.",
      "- Purpose: inspect, plan, validate, repair, and operate Kingsmen work with evidence.",
      "- Live Netlify mode: answers doctrine and runs web-safe command logic.",
      "- Local Commander mode: required for Windows PowerShell, Git, PostgreSQL, file creation, and deployment proof.",
      "- I must not claim Gmail, Calendar, Supabase, Airtable, PayFast, Neon, Google Drive, or local repo control unless that adapter and credential are actually connected in the current runtime.",
      "- I must say what is proven, what is not proven, and what the next command is."
    ].join("\n")
  );
}

function connectionStatus(): ToolResult {
  return doctrineResult(
    "CONNECTION_STATUS",
    "Not everything is automatically connected in the deployed Jarvis surface. The live web interface and the local Commander runtime are separate proof zones.",
    [
      "CONNECTION STATUS",
      "- Live Netlify surface: web UI, doctrine responses, route access, safe command interface.",
      "- Local Commander runtime: Windows PowerShell, repo files, Git operations, validators, local PostgreSQL, local evidence logs.",
      "- External providers require explicit OAuth/API credentials, adapters, policy gates, and evidence logging before Jarvis can operate them.",
      "- If a tool is not connected, Jarvis must not pretend to use it.",
      "- Correct operating rule: Intent Router -> Command Registry -> Policy Gate -> Tool Router -> Evidence Ledger."
    ].join("\n")
  );
}

function priorityBrief(): ToolResult {
  return doctrineResult(
    "PRIORITY_BRIEF",
    "Priority brief prepared from the current Kingsmen/Jarvis build state.",
    [
      "PRIORITY BRIEF — NEXT 6 HOURS",
      "1. Confirm live /api/jarvis/agent returns Kingsmen doctrine with HTTP 200.",
      "2. Confirm /jarvis and /command surfaces open on the production URL.",
      "3. Keep provider tools separated until each adapter has credentials, policy gates, and evidence logging.",
      "4. Build provider registry next: GitHub, Netlify, Google Drive, Airtable, Neon Postgres, and B12 boundaries.",
      "5. Do not claim external tool control inside Jarvis until each live adapter is proven.",
      "6. Preserve production deploy logs and smoke-test output as proof."
    ].join("\n")
  );
}

function executionPlan(): ToolResult {
  return doctrineResult(
    "EXECUTION_PLAN",
    "Execution plan generated with proof boundaries.",
    [
      "EXECUTION PLAN",
      "1. Redeploy the Netlify-safe Jarvis agent route.",
      "2. Smoke test: TELL ME ABOUT KINGSMEN.",
      "3. Smoke test: IS EVERYTHING CONNECTED IN JARVIS.",
      "4. Verify no 404 and no 502 from /api/jarvis/agent.",
      "5. Add provider adapter registry with explicit boundaries.",
      "6. Connect providers one by one with evidence: GitHub, Netlify, Drive, Airtable, Neon, B12.",
      "7. Only after proof, promote provider actions into Jarvis command buttons."
    ].join("\n")
  );
}

function deploymentStatus(): ToolResult {
  return doctrineResult(
    "DEPLOYMENT_STATUS",
    "Deployment proof must come from the Netlify production deploy output, function bundling, and live URL smoke tests.",
    [
      "DEPLOYMENT STATUS RULE",
      "- Site proof: Netlify production deploy live URL.",
      "- API proof: /api/jarvis/agent must return HTTP 200 JSON.",
      "- Doctrine proof: Kingsmen prompt must route to KINGSMEN_DOCTRINE.",
      "- Runtime proof: local tools remain local until secured server-side adapters exist.",
      "- External tool proof: valid only after provider credentials and adapters are connected."
    ].join("\n")
  );
}

function localCommandBoundary(): ToolResult {
  return doctrineResult(
    "LOCAL_COMMAND_BOUNDARY",
    "This command requires the local Commander Windows runtime. The deployed Netlify surface will not fake PowerShell, Git, PostgreSQL, or filesystem execution.",
    [
      "LOCAL COMMAND BOUNDARY",
      "- Netlify live mode is web-safe.",
      "- Local repo commands must run from C:\\Kingsmen\\kingsmen-platform.",
      "- PostgreSQL, file writes, Git, PowerShell, and deploy proof require Commander local runtime or a secured server-side adapter.",
      "- Jarvis refuses false execution claims."
    ].join("\n"),
    false
  );
}

function help(): ToolResult {
  return doctrineResult(
    "HELP",
    "I can answer Kingsmen/Jarvis doctrine in live web mode. Local repo, Git, PowerShell, PostgreSQL, and deployment commands require the Commander local runtime.",
    [
      "TRY SAYING:",
      "- TELL ME ABOUT KINGSMEN",
      "- TELL ABOUT JARVIS",
      "- IS EVERYTHING CONNECTED IN JARVIS",
      "- PRIORITY BRIEF",
      "- EXECUTION PLAN",
      "- DEPLOYMENT STATUS"
    ].join("\n")
  );
}

function commandBrief(message: string): ToolResult {
  return doctrineResult(
    "COMMAND_BRIEF",
    "Command received. I will answer inside Kingsmen doctrine, separate proven runtime from unproven claims, and give the next executable step.",
    [
      "COMMAND RECEIVED",
      `Input: ${message || "No command supplied."}`,
      "Operating standard:",
      "- Commander tone.",
      "- Evidence before claims.",
      "- No generic public identity drift.",
      "- No fake tool connection.",
      "- Next action must be executable."
    ].join("\n")
  );
}

function runTool(tool: string, message: string): ToolResult {
  if (tool === "KINGSMEN_DOCTRINE") return kingsmenDoctrine();
  if (tool === "JARVIS_IDENTITY") return jarvisIdentity();
  if (tool === "CONNECTION_STATUS") return connectionStatus();
  if (tool === "PRIORITY_BRIEF") return priorityBrief();
  if (tool === "EXECUTION_PLAN") return executionPlan();
  if (tool === "DEPLOYMENT_STATUS") return deploymentStatus();
  if (tool === "LOCAL_COMMAND_BOUNDARY") return localCommandBoundary();
  if (tool === "HELP") return help();
  return commandBrief(message);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "Kingsmen Jarvis Agent Runtime",
    mode: "netlify_live_web_safe_surface",
    tools: [
      "KINGSMEN_DOCTRINE",
      "JARVIS_IDENTITY",
      "CONNECTION_STATUS",
      "PRIORITY_BRIEF",
      "EXECUTION_PLAN",
      "DEPLOYMENT_STATUS",
      "LOCAL_COMMAND_BOUNDARY",
      "HELP"
    ],
    boundary: "Local Windows tools are only available in the Commander local runtime or future secured provider adapters."
  });
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = await request.json().catch(() => ({}));
  const message = cleanMessage(body.message);
  const selectedTool = cleanMessage(body.tool) || identifyTool(message);
  const result = runTool(selectedTool, message);
  const finishedAt = new Date();

  return NextResponse.json(
    {
      ...result,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      selectedTool,
      message
    },
    { status: 200 }
  );
}
