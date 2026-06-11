import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const ROOT = "C:\\Kingsmen\\kingsmen-platform";
const ENV_FILE = "C:\\Kingsmen\\KINGSMEN_LOCAL_DATABASE_ENV.ps1";
const PSQL = "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe";

const commands = [
  { id: "SYSTEM_VALIDATE_N20", title: "Validate N20 system lock", description: "Runs the Kingsmen N20 validator and returns live output.", category: "System", risk: "SAFE_READ" },
  { id: "DB_LEDGER_CHECK", title: "Check migration ledger", description: "Reads PostgreSQL migration ledger and applied migration names.", category: "Database", risk: "SAFE_READ" },
  { id: "QUEUE_HEALTH_CHECK", title: "Check queue health", description: "Scans PostgreSQL for queue, workflow, heartbeat, and DLQ surfaces.", category: "Operations", risk: "SAFE_READ" },
  { id: "INCIDENT_REVIEW", title: "Review incidents", description: "Scans incident, error, observability, and report surfaces.", category: "Operations", risk: "SAFE_READ" },
  { id: "MANUAL_FALLBACK_REVIEW", title: "Manual fallback review", description: "Scans manual fallback, MAP, and Phoenix lane surfaces.", category: "Operations", risk: "SAFE_READ" },
  { id: "FOUNDER_OVERRIDE_REVIEW", title: "Founder override review", description: "Reviews governance, policy, override, and approval surfaces without executing overrides.", category: "Governance", risk: "SAFE_READ" },
  { id: "PUBLIC_ROUTE_HOUSE_CHECK", title: "Public route house check", description: "Checks public route house and final assembly browser surfaces.", category: "Web", risk: "SAFE_READ" },
  { id: "CANDIDATE_PORTAL_CHECK", title: "Candidate portal check", description: "Checks the candidate portal browser surface.", category: "Web", risk: "SAFE_READ" },
  { id: "OPENCLAW_GRIP_CHECK", title: "OpenClaw grip check", description: "Runs route, database, and Git grip checks as one operator action.", category: "OpenClaw", risk: "SAFE_READ" }
];

async function ps(script: string, timeout = 12000) {
  try {
    const { stdout, stderr } = await execFileAsync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
      cwd: ROOT,
      timeout,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    });
    return { ok: true, stdout: String(stdout ?? "").trim(), stderr: String(stderr ?? "").trim() };
  } catch (error) {
    const err = error as { stdout?: unknown; stderr?: unknown; message?: string };
    return { ok: false, stdout: String(err.stdout ?? "").trim(), stderr: String(err.stderr ?? err.message ?? "Command failed.").trim() };
  }
}

async function urlCard(key: string, title: string, url: string, state: string) {
  const result = await ps(`$ProgressPreference='SilentlyContinue'; $r=Invoke-WebRequest -Uri '${url}' -UseBasicParsing -TimeoutSec 8; "HTTP $($r.StatusCode)"`);
  return {
    key,
    title,
    state: result.ok ? state : "DOWN",
    detail: result.ok ? `${url} responded with ${result.stdout}.` : result.stderr || result.stdout || `${url} did not respond.`,
    ok: result.ok
  };
}

async function dbCard() {
  const result = await ps(`. '${ENV_FILE}'; & '${PSQL}' -d $env:DATABASE_URL -t -A -c "select count(*) from public.kingsmen_schema_migrations;"`);
  const count = Number(result.stdout);
  return {
    key: "db-ledger",
    title: "Database Foundation",
    state: result.ok && count >= 18 ? "CONFIRMED" : "REVIEW",
    detail: result.ok ? `PostgreSQL is connected. Migration ledger count: ${Number.isFinite(count) ? count : result.stdout}.` : result.stderr || result.stdout || "Database check failed.",
    ok: result.ok && count >= 18
  };
}

async function tableCard() {
  const result = await ps(`. '${ENV_FILE}'; & '${PSQL}' -d $env:DATABASE_URL -t -A -c "select count(*) from information_schema.tables where table_schema='public';"`);
  return {
    key: "truth-surface",
    title: "Truth Surface",
    state: result.ok ? "READY" : "REVIEW",
    detail: result.ok ? `Public PostgreSQL tables visible: ${result.stdout}.` : result.stderr || result.stdout || "Could not inspect schema.",
    ok: result.ok
  };
}

export async function GET() {
  const [db, tables, jarvis, founder, command, candidate, finalAssembly] = await Promise.all([
    dbCard(),
    tableCard(),
    urlCard("jarvis-route", "Jarvis HUD Surface", "http://127.0.0.1:3000/jarvis", "ONLINE"),
    urlCard("founder-route", "Founder Command Alias", "http://127.0.0.1:3000/founder-command", "VISIBLE"),
    urlCard("command-route", "Command Alias", "http://127.0.0.1:3000/command", "VISIBLE"),
    urlCard("candidate-route", "Candidate Portal", "http://127.0.0.1:3000/candidate", "READY"),
    urlCard("final-route", "Final Assembly", "http://127.0.0.1:3000/final-assembly", "READY")
  ]);

  const cards = [
    db,
    tables,
    jarvis,
    founder,
    command,
    candidate,
    finalAssembly,
    {
      key: "api-command",
      title: "Jarvis API Command Runner",
      state: "READY",
      detail: "Whitelisted SAFE_READ commands are wired through /api/jarvis/command.",
      ok: true
    },
    {
      key: "policy-boundary",
      title: "Policy Boundary",
      state: "LOCKED",
      detail: "Jarvis will not perform risky actions until backend command bus, policy checks, and evidence approval are wired.",
      ok: true
    }
  ];

  return NextResponse.json({
    ok: cards.every((card) => card.ok),
    generatedAt: new Date().toISOString(),
    cards,
    commands,
    doctrine: [
      "Jarvis is the founder/operator surface, not the backend authority.",
      "Backend state machine remains authority for candidate journeys.",
      "Every command result must show evidence.",
      "Risky actions require policy gates and founder approval.",
      "OpenClaw is operator grip: route, database, repo, incident, and fallback review."
    ]
  });
}
