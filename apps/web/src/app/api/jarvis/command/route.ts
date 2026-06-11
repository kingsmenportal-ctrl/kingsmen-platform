import { execFile } from "node:child_process";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const ROOT = "C:\\Kingsmen\\kingsmen-platform";
const ENV_FILE = "C:\\Kingsmen\\KINGSMEN_LOCAL_DATABASE_ENV.ps1";
const PSQL = "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe";
const EVIDENCE_DIR = path.join(ROOT, "reports", "jarvis");
const EVIDENCE_FILE = path.join(EVIDENCE_DIR, "jarvis-command-evidence.jsonl");

type RunnerResult = { ok: boolean; stdout: string; stderr: string };

async function ps(script: string, timeout = 30000): Promise<RunnerResult> {
  try {
    const { stdout, stderr } = await execFileAsync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
      cwd: ROOT,
      timeout,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 2
    });
    return { ok: true, stdout: String(stdout ?? "").trim(), stderr: String(stderr ?? "").trim() };
  } catch (error) {
    const err = error as { stdout?: unknown; stderr?: unknown; message?: string };
    return { ok: false, stdout: String(err.stdout ?? "").trim(), stderr: String(err.stderr ?? err.message ?? "Command failed.").trim() };
  }
}

function db(sql: string, timeout = 30000) {
  const escaped = sql.replace(/'/g, "''");
  return ps(`. '${ENV_FILE}'; & '${PSQL}' -d $env:DATABASE_URL -P pager=off -c '${escaped}'`, timeout);
}

function url(urlValue: string) {
  return ps(`$ProgressPreference='SilentlyContinue'; $r=Invoke-WebRequest -Uri '${urlValue}' -UseBasicParsing -TimeoutSec 10; "HTTP $($r.StatusCode) $($r.StatusDescription)"`, 15000);
}

async function openClaw(): Promise<RunnerResult> {
  const jarvis = await url("http://127.0.0.1:3000/jarvis");
  const ledger = await db("select count(*) as applied_migrations from public.kingsmen_schema_migrations;", 15000);
  const git = await ps("git status --short", 15000);
  return {
    ok: jarvis.ok && ledger.ok && git.ok,
    stdout: [
      "OPENCLAW GRIP CHECK",
      "",
      "JARVIS ROUTE:",
      jarvis.stdout || jarvis.stderr,
      "",
      "DATABASE LEDGER:",
      ledger.stdout || ledger.stderr,
      "",
      "GIT STATE:",
      git.stdout || "working tree clean",
      "",
      "OPENCLAW RESULT:",
      "Route, database truth, and repository state inspected."
    ].join("\\n"),
    stderr: [jarvis.stderr, ledger.stderr, git.stderr].filter(Boolean).join("\\n")
  };
}

const registry = {
  SYSTEM_VALIDATE_N20: {
    title: "Validate N20 system lock",
    category: "System",
    risk: "SAFE_READ",
    run: () => ps("& '.\\KINGSMEN_CREATOR.ps1' -Phase N20 -Mode Validate", 45000)
  },
  DB_LEDGER_CHECK: {
    title: "Check migration ledger",
    category: "Database",
    risk: "SAFE_READ",
    run: () => db("select version(); select count(*) as applied_migrations from public.kingsmen_schema_migrations; select migration_name, applied_at from public.kingsmen_schema_migrations order by migration_name;")
  },
  QUEUE_HEALTH_CHECK: {
    title: "Check queue health",
    category: "Operations",
    risk: "SAFE_READ",
    run: () => db("select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%queue%' or table_name ilike '%workflow%' or table_name ilike '%heartbeat%' or table_name ilike '%dead%' or table_name ilike '%dlq%') order by table_name;")
  },
  INCIDENT_REVIEW: {
    title: "Review incidents",
    category: "Operations",
    risk: "SAFE_READ",
    run: () => db("select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%incident%' or table_name ilike '%error%' or table_name ilike '%observability%' or table_name ilike '%report%') order by table_name;")
  },
  MANUAL_FALLBACK_REVIEW: {
    title: "Manual fallback review",
    category: "Operations",
    risk: "SAFE_READ",
    run: () => db("select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%manual%' or table_name ilike '%fallback%' or table_name ilike '%map%' or table_name ilike '%phoenix%') order by table_name;")
  },
  FOUNDER_OVERRIDE_REVIEW: {
    title: "Founder override review",
    category: "Governance",
    risk: "SAFE_READ",
    run: () => db("select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%override%' or table_name ilike '%governance%' or table_name ilike '%policy%' or table_name ilike '%approval%') order by table_name;")
  },
  PUBLIC_ROUTE_HOUSE_CHECK: {
    title: "Public route house check",
    category: "Web",
    risk: "SAFE_READ",
    run: async () => {
      const home = await url("http://127.0.0.1:3000");
      const finalAssembly = await url("http://127.0.0.1:3000/final-assembly");
      return {
        ok: home.ok && finalAssembly.ok,
        stdout: ["PUBLIC ROUTE HOUSE CHECK", "", "/", home.stdout || home.stderr, "", "/final-assembly", finalAssembly.stdout || finalAssembly.stderr].join("\\n"),
        stderr: [home.stderr, finalAssembly.stderr].filter(Boolean).join("\\n")
      };
    }
  },
  CANDIDATE_PORTAL_CHECK: {
    title: "Candidate portal check",
    category: "Web",
    risk: "SAFE_READ",
    run: () => url("http://127.0.0.1:3000/candidate")
  },
  OPENCLAW_GRIP_CHECK: {
    title: "OpenClaw grip check",
    category: "OpenClaw",
    risk: "SAFE_READ",
    run: openClaw
  }
} as const;

async function evidence(entry: unknown) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await appendFile(EVIDENCE_FILE, JSON.stringify(entry) + "\\n", "utf8");
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = await request.json().catch(() => ({}));
  const raw = typeof body.commandId === "string" ? body.commandId : "";
  const commandId = raw.trim().replace(/\\s+/g, "_").replace(/-/g, "_").toUpperCase();
  const command = registry[commandId as keyof typeof registry];

  if (!command) {
    const blocked = {
      ok: false,
      commandId,
      title: "Blocked command",
      category: "Policy",
      risk: "BLOCKED",
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      stdout: "",
      stderr: "Jarvis blocked an unknown or unsafe command. Only whitelisted SAFE_READ commands are allowed in PJ38.",
      evidencePath: EVIDENCE_FILE,
      message: "Command blocked by Jarvis policy boundary."
    };
    await evidence(blocked);
    return NextResponse.json(blocked, { status: 400 });
  }

  const output = await command.run();
  const finishedAt = new Date();

  const result = {
    ok: output.ok,
    commandId,
    title: command.title,
    category: command.category,
    risk: command.risk,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    stdout: output.stdout,
    stderr: output.stderr,
    evidencePath: EVIDENCE_FILE,
    message: output.ok ? "Jarvis command completed and evidence was recorded." : "Jarvis command returned a failure result. Evidence was recorded."
  };

  await evidence(result);
  return NextResponse.json(result, { status: output.ok ? 200 : 500 });
}
