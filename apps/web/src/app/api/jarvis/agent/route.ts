import { execFile } from "node:child_process";
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

async function runPowerShell(script: string, timeout = 45000) {
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
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await appendFile(EVIDENCE_FILE, JSON.stringify(entry) + "\\n", "utf8");
}

function cleanMessage(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function identifyTool(message: string) {
  const text = message.toLowerCase();

  if (text.includes("build")) return "RUN_WEB_BUILD";
  if (text.includes("validate") || text.includes("n20") || text.includes("system lock")) return "VALIDATE_N20";
  if (text.includes("database") || text.includes("db") || text.includes("postgres") || text.includes("table")) return "DATABASE_SCAN";
  if (text.includes("route") || text.includes("endpoint") || text.includes("api") || text.includes("probe")) return "ROUTE_PROBE";
  if (text.includes("git") || text.includes("commit") || text.includes("status")) return "GIT_STATUS";
  if (text.includes("create") || text.includes("write") || text.includes("make file") || text.includes("save")) return "CREATE_FILE";
  if (text.includes("help") || text.includes("what can you do")) return "HELP";
  return "SYSTEM_STATUS";
}

async function systemStatus(): Promise<ToolResult> {
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
  ].join("\\n");

  return {
    ok: pkg.ok && db.ok && route.ok && git.ok,
    tool: "SYSTEM_STATUS",
    reply: "I checked the live local system: Node, npm, PostgreSQL ledger, Jarvis route, and Git state.",
    stdout,
    stderr: [pkg.stderr, db.stderr, route.stderr, git.stderr].filter(Boolean).join("\\n"),
    evidencePath: EVIDENCE_FILE
  };
}

async function validateN20(): Promise<ToolResult> {
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
    stdout: lines.join("\\n"),
    stderr: "",
    evidencePath: EVIDENCE_FILE
  };
}

async function gitStatus(): Promise<ToolResult> {
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
  ].join("\\n");

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
    reply: "I can run system status, N20 validation, web build, database scan, route probe, git status, and create safe files inside reports/jarvis/created.",
    stdout: [
      "Try saying or typing:",
      "- system status",
      "- validate N20",
      "- run build",
      "- database scan",
      "- probe routes",
      "- git status",
      "- create a file saying ..."
    ].join("\\n"),
    stderr: "",
    evidencePath: EVIDENCE_FILE
  };
}

async function runTool(tool: string, message: string): Promise<ToolResult> {
  if (tool === "VALIDATE_N20") return validateN20();
  if (tool === "RUN_WEB_BUILD") return runWebBuild();
  if (tool === "DATABASE_SCAN") return databaseScan();
  if (tool === "ROUTE_PROBE") return routeProbe();
  if (tool === "GIT_STATUS") return gitStatus();
  if (tool === "CREATE_FILE") return createFile(message);
  if (tool === "HELP") return help();
  return systemStatus();
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "Real Jarvis Agent Runtime",
    tools: [
      "SYSTEM_STATUS",
      "VALIDATE_N20",
      "RUN_WEB_BUILD",
      "DATABASE_SCAN",
      "ROUTE_PROBE",
      "GIT_STATUS",
      "CREATE_FILE",
      "HELP"
    ],
    voice: "Handled in browser through SpeechRecognition and speechSynthesis."
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
