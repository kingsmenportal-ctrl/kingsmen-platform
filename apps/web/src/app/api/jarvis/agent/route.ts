import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const ROOT = "C:\\Kingsmen\\kingsmen-platform";
const ENV_FILE = "C:\\Kingsmen\\KINGSMEN_LOCAL_DATABASE_ENV.ps1";
const PSQL = "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe";
const BASE_URL = "http://127.0.0.1:3000";
const EVIDENCE_DIR = path.join(ROOT, "reports", "jarvis");
const EVIDENCE_FILE = path.join(EVIDENCE_DIR, "real-jarvis-agent-evidence.jsonl");
const CREATED_DIR = path.join(EVIDENCE_DIR, "created");

type ToolResult = {
  ok: boolean;
  tool: string;
  reply: string;
  stdout: string;
  stderr: string;
  evidencePath: string;
  createdPath?: string;
};

function isLocalCommanderRuntime() {
  return process.platform === "win32" && existsSync(ROOT);
}

function repoEvidencePath() {
  return isLocalCommanderRuntime() ? EVIDENCE_FILE : "web-safe-live-surface:no-local-windows-evidence-file";
}

async function runPowerShell(script: string, timeout = 45000) {
  if (!isLocalCommanderRuntime()) {
    return {
      ok: false,
      stdout: "",
      stderr: "Local Windows command runtime is not available on this deployed web surface. Use the Commander local runtime for repo, PowerShell, database, and deployment commands."
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      { cwd: ROOT, timeout, windowsHide: true, maxBuffer: 1024 * 1024 * 6 }
    );

    return {
      ok: true,
      stdout: String(stdout ?? "").trim(),
      stderr: String(stderr ?? "").trim()
    };
  } catch (error) {
    const err = error as { stdout?: unknown; stderr?: unknown; message?: string };
    return {
      ok: false,
      stdout: String(err.stdout ?? "").trim(),
      stderr: String(err.stderr ?? err.message ?? "Command failed.").trim()
    };
  }
}

function runSql(sql: string, timeout = 45000) {
  const escaped = sql.replace(/'/g, "''");
  return runPowerShell(`. '${ENV_FILE}'; & '${PSQL}' -d $env:DATABASE_URL -P pager=off -c '${escaped}'`, timeout);
}

async function evidence(entry: unknown) {
  if (!isLocalCommanderRuntime()) return;
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await appendFile(EVIDENCE_FILE, JSON.stringify(entry) + "\n", "utf8");
}

function cleanMessage(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function identifyTool(message: string) {
  const text = message.toLowerCase();

  if (text.includes("kingsmen")) return "KINGSMEN_DOCTRINE";
  if (text.includes("who are you") || text.includes("what are you") || text.includes("tell about jarvis") || text.includes("tell me about jarvis") || text.includes("jarvis")) return "JARVIS_IDENTITY";
  if (text.includes("connected") || text.includes("connection") || text.includes("operate like")) return "CONNECTION_STATUS";
  if (text.includes("priority brief") || text.includes("next 6 hours") || text.includes("brief")) return "PRIORITY_BRIEF";
  if (text.includes("execution plan") || text.includes("break this objective") || text.includes("plan")) return "EXECUTION_PLAN";
  if (text.includes("deploy") || text.includes("live") || text.includes("netlify")) return "DEPLOYMENT_STATUS";
  if (text.includes("build")) return "RUN_WEB_BUILD";
  if (text.includes("validate") || text.includes("n20") || text.includes("system lock")) return "VALIDATE_N20";
  if (text.includes("database") || text.includes("db") || text.includes("postgres") || text.includes("table")) return "DATABASE_SCAN";
  if (text.includes("route") || text.includes("endpoint") || text.includes("api") || text.includes("probe")) return "ROUTE_PROBE";
  if (text.includes("git") || text.includes("commit") || text.includes("status")) return "GIT_STATUS";
  if (text.includes("create") || text.includes("write") || text.includes("make file") || text.includes("save")) return "CREATE_FILE";
  if (text.includes("help") || text.includes("what can you do")) return "HELP";
  return "COMMAND_BRIEF";
}

function doctrineResult(tool: string, reply: string, stdout: string): ToolResult {
  return {
    ok: true,
    tool,
    reply,
    stdout,
    stderr: "",
    evidencePath: repoEvidencePath()
  };
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
    "Jarvis is the Commander-only command assistant for Kingsmen. I must speak with disciplined command tone, route work through safe tools, and avoid pretending that unconnected systems are connected.",
    [
      "JARVIS IDENTITY",
      "- Commander-only interface inside Kingsmen Command.",
      "- Purpose: help inspect, plan, validate, repair, and operate Kingsmen work with evidence.",
      "- Live web mode: can answer doctrine and operate the web-safe command surface.",
      "- Local Commander mode: required for Windows PowerShell, Git, PostgreSQL, file creation, and deployment proof.",
      "- I must not claim Gmail, Calendar, Supabase, Airtable, PayFast, or local repo control unless that tool/credential is actually connected in the current runtime.",
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
      "- External accounts require explicit OAuth/API credentials and runtime adapters before Jarvis can operate them.",
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
      "1. Finish production deploy proof: capture Netlify production URL and proof JSON.",
      "2. Verify live /jarvis and /command surfaces answer with Kingsmen doctrine, not generic public answers.",
      "3. Run final web build and Jarvis V5 validator after every patch.",
      "4. Preserve proof logs under reports/jarvis/live-deploy-*.",
      "5. Do not claim local tools are live on Netlify unless a safe server-side adapter exists.",
      "6. Next action: run the deploy proof command and inspect the production deploy log."
    ].join("\n")
  );
}

function executionPlan(): ToolResult {
  return doctrineResult(
    "EXECUTION_PLAN",
    "Execution plan generated with proof boundaries.",
    [
      "EXECUTION PLAN",
      "1. Confirm validator: npm run jarvis:validate:v5:01-to-38.",
      "2. Confirm build: npm --prefix apps/web run build.",
      "3. Confirm Netlify link: npx -y netlify status.",
      "4. Deploy: npx -y netlify deploy --build --prod.",
      "5. Capture proof: production URL, deploy log, proof JSON, timestamp, commit.",
      "6. Inspect live /jarvis and /command answers.",
      "7. If answers are generic, patch the Jarvis agent route and redeploy.",
      "8. Mark production as proven only when the live URL and command surface are reachable."
    ].join("\n")
  );
}

function deploymentStatus(): ToolResult {
  return doctrineResult(
    "DEPLOYMENT_STATUS",
    "Deployment proof must come from the Netlify production deploy output and live URL checks, not from repo material alone.",
    [
      "DEPLOYMENT STATUS RULE",
      "- Validator proof: local validator pass.",
      "- Build proof: Next build route table and exit code 0.",
      "- Netlify proof: production deploy log with live URL.",
      "- Runtime proof: live /jarvis and /command routes respond correctly.",
      "- External tool proof: only valid after each provider credential and adapter is connected."
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

function localToolUnavailable(tool: string): ToolResult {
  return {
    ok: false,
    tool,
    reply: "This command requires the local Commander Windows runtime. The deployed Netlify surface cannot execute local PowerShell, Git, PostgreSQL, or filesystem operations.",
    stdout: [
      "LOCAL TOOL BOUNDARY",
      `Requested tool: ${tool}`,
      "Run this command from C:\\Kingsmen\\kingsmen-platform on the Commander machine, or connect a secure server-side tool adapter.",
      "Jarvis will not pretend that an unavailable local tool was executed."
    ].join("\n"),
    stderr: "Local Commander runtime unavailable in this environment.",
    evidencePath: repoEvidencePath()
  };
}

async function systemStatus(): Promise<ToolResult> {
  if (!isLocalCommanderRuntime()) return localToolUnavailable("SYSTEM_STATUS");
  const git = await runPowerShell("git status --short", 20000);
  const pkg = await runPowerShell("node -v; npm -v", 20000);
  const db = await runSql("select count(*) as applied_migrations from public.kingsmen_schema_migrations;", 25000);
  const route = await runPowerShell(`$r=Invoke-WebRequest -Uri '${BASE_URL}/jarvis' -UseBasicParsing -TimeoutSec 8; "Jarvis HTTP $($r.StatusCode)"`, 15000);

  const stdout = [
    "REAL JARVIS SYSTEM STATUS",
    "",
    "NODE/NPM:",
    pkg.stdout || pkg.stderr,
    "",
    "DATABASE LEDGER:",
    db.stdout || db.stderr,
    "",
    "JARVIS ROUTE:",
    route.stdout || route.stderr,
    "",
    "GIT:",
    git.stdout || "working tree clean"
  ].join("\n");

  return {
    ok: pkg.ok && db.ok && route.ok && git.ok,
    tool: "SYSTEM_STATUS",
    reply: "I checked the live local system: Node, npm, PostgreSQL ledger, Jarvis route, and Git state.",
    stdout,
    stderr: [pkg.stderr, db.stderr, route.stderr, git.stderr].filter(Boolean).join("\n"),
    evidencePath: EVIDENCE_FILE
  };
}

async function validateN20(): Promise<ToolResult> {
  if (!isLocalCommanderRuntime()) return localToolUnavailable("VALIDATE_N20");
  const result = await runPowerShell("& '.\\KINGSMEN_CREATOR.ps1' -Phase N20 -Mode Validate", 70000);
  return {
    ok: result.ok,
    tool: "VALIDATE_N20",
    reply: result.ok ? "N20 validation completed." : "N20 validation failed. Review the output.",
    stdout: result.stdout,
    stderr: result.stderr,
    evidencePath: EVIDENCE_FILE
  };
}

async function runWebBuild(): Promise<ToolResult> {
  if (!isLocalCommanderRuntime()) return localToolUnavailable("RUN_WEB_BUILD");
  const result = await runPowerShell("Set-Location '.\\apps\\web'; npm run build", 120000);
  return {
    ok: result.ok,
    tool: "RUN_WEB_BUILD",
    reply: result.ok ? "Web build completed." : "Web build failed. Review the output.",
    stdout: result.stdout,
    stderr: result.stderr,
    evidencePath: EVIDENCE_FILE
  };
}

async function databaseScan(): Promise<ToolResult> {
  if (!isLocalCommanderRuntime()) return localToolUnavailable("DATABASE_SCAN");
  const result = await runSql(`
select 'migrations' as area, count(*)::text as value from public.kingsmen_schema_migrations
union all
select 'public_tables', count(*)::text from information_schema.tables where table_schema='public'
union all
select 'candidate_tables', count(*)::text from information_schema.tables where table_schema='public' and (table_name ilike '%candidate%' or table_name ilike '%application%' or table_name ilike '%profile%' or table_name ilike '%intake%')
union all
select 'document_tables', count(*)::text from information_schema.tables where table_schema='public' and (table_name ilike '%document%' or table_name ilike '%verification%' or table_name ilike '%fraud%' or table_name ilike '%storage%')
union all
select 'finance_tables', count(*)::text from information_schema.tables where table_schema='public' and (table_name ilike '%payment%' or table_name ilike '%invoice%' or table_name ilike '%payfast%' or table_name ilike '%refund%' or table_name ilike '%order%' or table_name ilike '%plan%')
union all
select 'queue_tables', count(*)::text from information_schema.tables where table_schema='public' and (table_name ilike '%queue%' or table_name ilike '%workflow%' or table_name ilike '%heartbeat%' or table_name ilike '%automation%' or table_name ilike '%dlq%');
`, 45000);

  return {
    ok: result.ok,
    tool: "DATABASE_SCAN",
    reply: "I scanned the real PostgreSQL truth vault and grouped Kingsmen table surfaces.",
    stdout: result.stdout,
    stderr: result.stderr,
    evidencePath: EVIDENCE_FILE
  };
}

async function routeProbe(): Promise<ToolResult> {
  if (!isLocalCommanderRuntime()) return localToolUnavailable("ROUTE_PROBE");
  const endpoints = [
    "/jarvis",
    "/api/jarvis/agent",
    "/api/jarvis/status",
    "/api/jarvis/command",
    "/api/health/kingsmen-kernel",
    "/api/founder/backend-readiness",
    "/api/founder/control-plane/health",
    "/api/founder/digest",
    "/api/founder/airtable/health",
    "/founder-command",
    "/command"
  ];

  const lines: string[] = [];

  for (const endpoint of endpoints) {
    const probe = await runPowerShell(`try { $r=Invoke-WebRequest -Uri '${BASE_URL}${endpoint}' -UseBasicParsing -TimeoutSec 8; '${endpoint} -> HTTP ' + $r.StatusCode } catch { '${endpoint} -> ERROR ' + $_.Exception.Message }`, 15000);
    lines.push(probe.stdout || probe.stderr);
  }

  return {
    ok: true,
    tool: "ROUTE_PROBE",
    reply: "I probed the real local Kingsmen web and API routes.",
    stdout: lines.join("\n"),
    stderr: "",
    evidencePath: EVIDENCE_FILE
  };
}

async function gitStatus(): Promise<ToolResult> {
  if (!isLocalCommanderRuntime()) return localToolUnavailable("GIT_STATUS");
  const result = await runPowerShell("git status --short; git log -1 --oneline", 25000);
  return {
    ok: result.ok,
    tool: "GIT_STATUS",
    reply: "I checked the repo status and latest commit.",
    stdout: result.stdout || "working tree clean",
    stderr: result.stderr,
    evidencePath: EVIDENCE_FILE
  };
}

async function createFile(message: string): Promise<ToolResult> {
  if (!isLocalCommanderRuntime()) return localToolUnavailable("CREATE_FILE");
  await mkdir(CREATED_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(CREATED_DIR, `jarvis-created-${stamp}.md`);
  const content = [
    "# Jarvis Created File",
    "",
    `Created: ${new Date().toISOString()}`,
    "Source: /api/jarvis/agent",
    "",
    "## Founder request",
    "",
    message || "Create a Jarvis evidence file.",
    "",
    "## Jarvis note",
    "",
    "This file was created by the local Jarvis agent runtime. It is saved inside reports/jarvis/created so it remains safe and reviewable."
  ].join("\n");

  await writeFile(filePath, content, "utf8");

  return {
    ok: true,
    tool: "CREATE_FILE",
    reply: "I created a real file in the Kingsmen repo under reports/jarvis/created.",
    stdout: content,
    stderr: "",
    evidencePath: EVIDENCE_FILE,
    createdPath: filePath
  };
}

async function help(): Promise<ToolResult> {
  return {
    ok: true,
    tool: "HELP",
    reply: "I can answer Kingsmen/Jarvis doctrine in live web mode. Local repo, Git, PowerShell, PostgreSQL, and deployment commands require the Commander local runtime.",
    stdout: [
      "Try saying or typing:",
      "- tell me about Kingsmen",
      "- tell about Jarvis",
      "- is everything connected?",
      "- priority brief",
      "- execution plan",
      "- deployment status",
      "- system status (local Commander runtime only)",
      "- run build (local Commander runtime only)",
      "- database scan (local Commander runtime only)",
      "- git status (local Commander runtime only)"
    ].join("\n"),
    stderr: "",
    evidencePath: repoEvidencePath()
  };
}

async function runTool(tool: string, message: string): Promise<ToolResult> {
  if (tool === "KINGSMEN_DOCTRINE") return kingsmenDoctrine();
  if (tool === "JARVIS_IDENTITY") return jarvisIdentity();
  if (tool === "CONNECTION_STATUS") return connectionStatus();
  if (tool === "PRIORITY_BRIEF") return priorityBrief();
  if (tool === "EXECUTION_PLAN") return executionPlan();
  if (tool === "DEPLOYMENT_STATUS") return deploymentStatus();
  if (tool === "COMMAND_BRIEF") return commandBrief(message);
  if (tool === "VALIDATE_N20") return validateN20();
  if (tool === "RUN_WEB_BUILD") return runWebBuild();
  if (tool === "DATABASE_SCAN") return databaseScan();
  if (tool === "ROUTE_PROBE") return routeProbe();
  if (tool === "GIT_STATUS") return gitStatus();
  if (tool === "CREATE_FILE") return createFile(message);
  if (tool === "HELP") return help();
  return commandBrief(message);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "Kingsmen Jarvis Agent Runtime",
    mode: isLocalCommanderRuntime() ? "local_commander_runtime" : "web_safe_live_surface",
    tools: [
      "KINGSMEN_DOCTRINE",
      "JARVIS_IDENTITY",
      "CONNECTION_STATUS",
      "PRIORITY_BRIEF",
      "EXECUTION_PLAN",
      "DEPLOYMENT_STATUS",
      "SYSTEM_STATUS",
      "VALIDATE_N20",
      "RUN_WEB_BUILD",
      "DATABASE_SCAN",
      "ROUTE_PROBE",
      "GIT_STATUS",
      "CREATE_FILE",
      "HELP"
    ],
    voice: "Handled in browser through SpeechRecognition and speechSynthesis.",
    boundary: "Local Windows tools are only available in the Commander local runtime."
  });
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = await request.json().catch(() => ({}));
  const message = cleanMessage(body.message);
  const selectedTool = cleanMessage(body.tool) || identifyTool(message);

  const result = await runTool(selectedTool, message);
  const finishedAt = new Date();

  const response = {
    ...result,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    selectedTool,
    message
  };

  await evidence(response);

  return NextResponse.json(response, { status: result.ok ? 200 : 500 });
}
