# KINGSMEN JARVIS STEP 02B - BUILDER API COMMAND BRIDGE
# Connects Jarvis typed commands to Builder Core.
# Flow in cockpit:
#   Jarvis, create Kingsmen module N21 ...
#   approve KJB-yyyyMMdd-HHmmss
# No visual CSS changes.

$ErrorActionPreference = "Stop"

function EnsureDir([string]$Path) {
  if (!(Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function WriteNoBom([string]$Path, [string]$Text) {
  EnsureDir (Split-Path -Parent $Path)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8NoBom)
  Write-Host ("WROTE: " + $Path) -ForegroundColor Green
}

function Sha256File([string]$Path) {
  if (!(Test-Path $Path)) { return $null }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 02B - BUILDER API COMMAND BRIDGE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Connects typed Jarvis commands to Builder Core. No visual CSS changes." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupRoot = Join-Path $Repo ("backups\jarvis-step-02b-builder-api-command-bridge-before-" + $Stamp)

$RelFiles = @(
  "apps\web\src\lib\jarvis\builderCore.ts",
  "apps\web\src\app\api\jarvis\builder\route.ts",
  "apps\web\src\app\api\jarvis\command\route.ts",
  "tools\jarvis\JARVIS_BUILDER_API_SMOKE_TEST.ps1",
  "docs\jarvis\JARVIS_BUILDER_API_COMMAND_BRIDGE.md",
  "manifests\jarvis\jarvis-builder-api-command-bridge-lock.json"
)

foreach ($rel in $RelFiles) {
  $src = Join-Path $Repo $rel
  if (Test-Path $src) {
    $dest = Join-Path $BackupRoot $rel
    EnsureDir (Split-Path -Parent $dest)
    Copy-Item $src $dest -Force
    Write-Host ("BACKED UP: " + $rel) -ForegroundColor DarkCyan
  }
}

$BuilderCoreTs = @'
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

export type BuilderPlanFile = {
  path: string;
  action: "create_or_replace";
  purpose: string;
  content: string;
};

export type BuilderPlan = {
  plan_id: string;
  created_at: string;
  status: string;
  command: string;
  module_id: string;
  title: string;
  slug: string;
  approval_phrase: string;
  proposed_files: BuilderPlanFile[];
  validation: {
    run_typecheck_if_available: boolean;
    run_lint_if_available: boolean;
    run_build_if_available: boolean;
  };
  git: {
    commit_after_validation: boolean;
    commit_message: string;
    staged_paths_only: boolean;
  };
  proof_path?: string;
};

const repoRoot = process.env.KINGSMEN_REPO_ROOT || path.resolve(process.cwd(), "../..");
const planDir = path.join(repoRoot, "reports", "jarvis", "builder", "plans");
const proofDir = path.join(repoRoot, "reports", "jarvis", "builder", "proofs");
const moduleProofDir = path.join(repoRoot, "reports", "jarvis", "builder", "module-proofs");
const backupDir = path.join(repoRoot, "backups", "jarvis-builder-api-bridge");
const ledgerPath = path.join(repoRoot, "docs", "jarvis", "JARVIS_BUILD_STEP_LEDGER.md");

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeText(filePath: string, text: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, "utf8");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

function planId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `KJB-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function cleanSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "module";
}

function assertSafeRelativePath(relativePath: string): void {
  if (!relativePath || relativePath.trim().length === 0) throw new Error("Empty path blocked.");
  if (/^[a-zA-Z]:/.test(relativePath)) throw new Error(`Absolute path blocked: ${relativePath}`);
  if (relativePath.startsWith("/") || relativePath.startsWith("\\")) throw new Error(`Root path blocked: ${relativePath}`);
  if (relativePath.includes("..")) throw new Error(`Parent traversal blocked: ${relativePath}`);

  const normalized = relativePath.replaceAll("/", "\\");
  const allowed = [
    "docs\\kingsmen\\modules\\",
    "manifests\\kingsmen\\modules\\",
    "reports\\jarvis\\builder\\module-proofs\\",
  ];

  if (!allowed.some((prefix) => normalized.toLowerCase().startsWith(prefix.toLowerCase()))) {
    throw new Error(`Path outside Builder Core allowed boundary blocked: ${relativePath}`);
  }
}

function moduleDoc(moduleId: string, title: string, command: string): string {
  return [
    `# ${moduleId} - ${title}`,
    "",
    "Status: BUILDER_DRAFT",
    "Created by: Kingsmen Jarvis Builder API Command Bridge",
    `Created at: ${nowIso()}`,
    "",
    "## Commander Command",
    "",
    command,
    "",
    "## Purpose",
    "",
    "This is a controlled Builder Core output created through the Jarvis command route. It proves that Jarvis can receive a typed Commander command, create a plan, wait for approval, write safe files, validate, create proof, and attempt a Git commit.",
    "",
    "## Kingsmen Doctrine Boundary",
    "",
    "- Jarvis is Commander-only.",
    "- No candidate-facing exposure.",
    "- No silent write.",
    "- Backend and PostgreSQL remain the authority for operational state.",
    "- Airtable remains a mirror only.",
    "- n8n remains a thin worker only.",
    "- Every build action must leave proof.",
    "",
    "## Next Gate",
    "",
    "Production code may only be added after a new approved plan lists exact files, rollback path, validation, and proof output.",
    "",
  ].join("\r\n");
}

function moduleManifest(moduleId: string, title: string, slug: string, id: string, command: string): string {
  return JSON.stringify(
    {
      module_id: moduleId,
      title,
      slug,
      status: "BUILDER_DRAFT",
      created_by: "Kingsmen Jarvis Builder API Command Bridge",
      plan_id: id,
      original_command: command,
      commander_only: true,
      safety: {
        requires_plan: true,
        requires_approval: true,
        requires_validation: true,
        requires_proof: true,
        commit_after_validation: true,
        public_candidate_access: "blocked",
      },
      doctrine: [
        "Commander-only Jarvis",
        "Backend state authority",
        "PostgreSQL truth",
        "Airtable mirror only",
        "n8n thin worker only",
        "No silent automation",
      ],
    },
    null,
    2
  );
}

function proofSeed(moduleId: string, title: string, id: string): string {
  return JSON.stringify(
    {
      module_id: moduleId,
      title,
      plan_id: id,
      proof_status: "seed_created_before_validation",
      created_at: nowIso(),
    },
    null,
    2
  );
}

function parseModuleCommand(command: string): { moduleId: string; title: string } {
  const match = command.match(/\bN\d{2}[A-Z0-9.\-]*\b/i);
  if (!match) {
    throw new Error("Builder Core needs a module ID like N21, N04.8, or N20 before it writes anything.");
  }

  const moduleId = match[0].toUpperCase();
  let title = command.slice((match.index || 0) + match[0].length).trim().replace(/^[-:\s]+/, "");
  if (!title) title = "Kingsmen Module Draft";
  if (title.length > 90) title = title.slice(0, 90).trim();
  return { moduleId, title };
}

export function createBuilderPlan(command: string): BuilderPlan {
  ensureDir(planDir);
  ensureDir(proofDir);
  ensureDir(moduleProofDir);

  const { moduleId, title } = parseModuleCommand(command);
  const id = planId();
  const slug = cleanSlug(`${moduleId}-${title}`);

  const files: BuilderPlanFile[] = [
    {
      path: `docs/kingsmen/modules/${slug}.md`,
      action: "create_or_replace",
      purpose: "Human-readable Kingsmen module draft and doctrine gate.",
      content: moduleDoc(moduleId, title, command),
    },
    {
      path: `manifests/kingsmen/modules/${slug}.json`,
      action: "create_or_replace",
      purpose: "Machine-readable module manifest for Control Plane/Jarvis indexing.",
      content: moduleManifest(moduleId, title, slug, id, command),
    },
    {
      path: `reports/jarvis/builder/module-proofs/${slug}-proof-seed.json`,
      action: "create_or_replace",
      purpose: "Proof seed showing this module was generated through Builder Core approval.",
      content: proofSeed(moduleId, title, id),
    },
  ];

  for (const file of files) assertSafeRelativePath(file.path);

  const plan: BuilderPlan = {
    plan_id: id,
    created_at: nowIso(),
    status: "PLANNED_NOT_WRITTEN",
    command,
    module_id: moduleId,
    title,
    slug,
    approval_phrase: `approve ${id}`,
    proposed_files: files,
    validation: {
      run_typecheck_if_available: true,
      run_lint_if_available: true,
      run_build_if_available: true,
    },
    git: {
      commit_after_validation: true,
      commit_message: `jarvis-builder: ${moduleId} ${title}`,
      staged_paths_only: true,
    },
  };

  writeText(path.join(planDir, `${id}.json`), JSON.stringify(plan, null, 2));
  return plan;
}

function runCommand(command: string, cwd: string): { command: string; cwd: string; exit_code: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("cmd.exe", ["/c", command], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 180000,
      maxBuffer: 1024 * 1024 * 8,
    });

    return { command, cwd, exit_code: 0, stdout, stderr: "" };
  } catch (error: any) {
    return {
      command,
      cwd,
      exit_code: typeof error.status === "number" ? error.status : 1,
      stdout: error.stdout ? String(error.stdout) : "",
      stderr: error.stderr ? String(error.stderr) : error.message || "Command failed",
    };
  }
}

function availableWebScripts(): Record<string, string> {
  const pkgPath = path.join(repoRoot, "apps", "web", "package.json");
  if (!fs.existsSync(pkgPath)) return {};
  const pkg = readJson<{ scripts?: Record<string, string> }>(pkgPath);
  return pkg.scripts || {};
}

function validateWebApp(): any[] {
  const webDir = path.join(repoRoot, "apps", "web");
  if (!fs.existsSync(webDir)) return [{ name: "web-app", skipped: true, reason: "apps/web missing" }];

  const scripts = availableWebScripts();
  const run: string[] = [];
  if (scripts.typecheck) run.push("typecheck");
  if (scripts.lint) run.push("lint");
  if (scripts.build) run.push("build");

  if (run.length === 0) return [{ name: "npm-scripts", skipped: true, reason: "no typecheck/lint/build script found" }];

  const results = [];
  for (const script of run) {
    const result = runCommand(`npm run ${script}`, webDir);
    results.push(result);
    if (result.exit_code !== 0) break;
  }
  return results;
}

export function listBuilderPlans(): any[] {
  ensureDir(planDir);
  return fs
    .readdirSync(planDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const full = path.join(planDir, name);
      try {
        const plan = readJson<BuilderPlan>(full);
        return {
          plan_id: plan.plan_id,
          status: plan.status,
          module_id: plan.module_id,
          title: plan.title,
          created_at: plan.created_at,
          approval_phrase: plan.approval_phrase,
          proof_path: plan.proof_path || null,
        };
      } catch {
        return { plan_id: name.replace(".json", ""), status: "UNREADABLE" };
      }
    })
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 12);
}

export function approveBuilderPlan(id: string): any {
  const planPath = path.join(planDir, `${id}.json`);
  if (!fs.existsSync(planPath)) throw new Error(`Plan not found: ${id}`);

  const plan = readJson<BuilderPlan>(planPath);
  if (plan.status !== "PLANNED_NOT_WRITTEN") {
    throw new Error(`Plan is not waiting for approval. Current status: ${plan.status}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(backupDir, `${id}-${stamp}`);
  ensureDir(backupRoot);

  const changedFiles: string[] = [];
  const backups: any[] = [];

  for (const file of plan.proposed_files) {
    assertSafeRelativePath(file.path);
    const target = path.join(repoRoot, file.path);

    if (fs.existsSync(target)) {
      const backupTarget = path.join(backupRoot, file.path);
      ensureDir(path.dirname(backupTarget));
      fs.copyFileSync(target, backupTarget);
      backups.push({ path: file.path, backup: backupTarget });
    }

    writeText(target, file.content);
    changedFiles.push(file.path);
  }

  const validationResults = validateWebApp();
  const validationPassed = validationResults.every((result: any) => result.skipped || result.exit_code === 0);

  const gitResults: any[] = [];
  let gitCommitOk = false;

  if (validationPassed) {
    for (const rel of changedFiles) {
      gitResults.push(runCommand(`git add -- "${rel}"`, repoRoot));
    }

    const commitMessage = plan.git.commit_message.replaceAll('"', "'");
    const commit = runCommand(`git commit -m "${commitMessage}"`, repoRoot);
    gitResults.push(commit);
    gitCommitOk = commit.exit_code === 0;
  }

  const finalStatus = validationPassed && gitCommitOk
    ? "BUILT_VALIDATED_COMMITTED"
    : validationPassed
      ? "BUILT_VALIDATED_COMMIT_FAILED"
      : "BUILT_VALIDATION_FAILED_NO_COMMIT";

  const proof = {
    proof_id: `PROOF-${id}`,
    plan_id: id,
    completed_at: nowIso(),
    command: plan.command,
    module_id: plan.module_id,
    title: plan.title,
    changed_files: changedFiles,
    backups,
    validation_passed: validationPassed,
    validation_results: validationResults,
    git_commit_attempted: validationPassed,
    git_commit_ok: gitCommitOk,
    git_results: gitResults,
    final_status: finalStatus,
  };

  ensureDir(proofDir);
  const proofPath = path.join(proofDir, `${id}-proof.json`);
  writeText(proofPath, JSON.stringify(proof, null, 2));

  plan.status = finalStatus;
  plan.proof_path = proofPath;
  writeText(planPath, JSON.stringify(plan, null, 2));

  ensureDir(path.dirname(ledgerPath));
  fs.appendFileSync(
    ledgerPath,
    [
      "",
      `## Builder API Execution - ${id}`,
      "",
      `Status: ${finalStatus}`,
      `Module: ${plan.module_id} - ${plan.title}`,
      `Proof: ${proofPath}`,
      "",
    ].join("\r\n"),
    "utf8"
  );

  return proof;
}

export function getBuilderPlan(id: string): BuilderPlan {
  const planPath = path.join(planDir, `${id}.json`);
  if (!fs.existsSync(planPath)) throw new Error(`Plan not found: ${id}`);
  return readJson<BuilderPlan>(planPath);
}

'@

$BuilderRouteTs = @'
import { NextRequest, NextResponse } from "next/server";
import { approveBuilderPlan, createBuilderPlan, getBuilderPlan, listBuilderPlans } from "../../../../lib/jarvis/builderCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      plans: listBuilderPlans(),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Builder status failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();

    if (action === "plan") {
      const command = String(body.command || body.text || "").trim();
      if (!command) return NextResponse.json({ ok: false, error: "Missing builder command." }, { status: 400 });
      const plan = createBuilderPlan(command);
      return NextResponse.json({
        ok: true,
        action: "plan",
        plan: {
          plan_id: plan.plan_id,
          status: plan.status,
          module_id: plan.module_id,
          title: plan.title,
          approval_phrase: plan.approval_phrase,
          proposed_files: plan.proposed_files.map((file) => ({
            path: file.path,
            action: file.action,
            purpose: file.purpose,
            preview: file.content.slice(0, 700),
          })),
        },
      });
    }

    if (action === "approve") {
      const planId = String(body.plan_id || "").trim();
      if (!/^KJB-\d{8}-\d{6}$/.test(planId)) {
        return NextResponse.json({ ok: false, error: "Invalid or missing plan_id." }, { status: 400 });
      }
      const proof = approveBuilderPlan(planId);
      return NextResponse.json({ ok: true, action: "approve", proof });
    }

    if (action === "read") {
      const planId = String(body.plan_id || "").trim();
      const plan = getBuilderPlan(planId);
      return NextResponse.json({ ok: true, action: "read", plan });
    }

    return NextResponse.json({ ok: true, action: "status", plans: listBuilderPlans() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Builder API failed" }, { status: 500 });
  }
}

'@

$CommandRouteTs = @'
import { NextRequest, NextResponse } from "next/server";
import { approveBuilderPlan, createBuilderPlan, listBuilderPlans } from "../../../../lib/jarvis/builderCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WAKE_GREETING =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.";

function extractText(body: any): string {
  return String(body?.command || body?.text || body?.message || body?.prompt || "").trim();
}

function isBuilderPlanCommand(text: string): boolean {
  return /\b(create|build|plan|draft|generate)\b/i.test(text) && /\bN\d{2}[A-Z0-9.\-]*\b/i.test(text);
}

function formatPlanReply(plan: any): string {
  const files = plan.proposed_files
    .map((file: any) => `- ${file.path}`)
    .join("\n");

  return [
    "Builder plan created, Commander.",
    "",
    `Plan ID: ${plan.plan_id}`,
    `Module: ${plan.module_id}`,
    `Title: ${plan.title}`,
    "",
    "No files have been written yet.",
    "",
    "Proposed files:",
    files,
    "",
    "Approval command:",
    plan.approval_phrase,
  ].join("\n");
}

function formatStatusReply(plans: any[]): string {
  if (!plans.length) return "Builder Core has no plans yet, Commander.";

  return [
    "Recent Builder Core plans, Commander:",
    "",
    ...plans.slice(0, 8).map((plan) => `${plan.plan_id} | ${plan.status} | ${plan.module_id} | ${plan.title}`),
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = extractText(body);
  const lower = text.toLowerCase();

  try {
    if (!text || lower === "jarvis" || lower === "wake jarvis") {
      return NextResponse.json({
        ok: true,
        mode: "wake",
        reply: WAKE_GREETING,
      });
    }

    const approval = text.match(/^approve\s+(KJB-\d{8}-\d{6})$/i);
    if (approval) {
      const proof = approveBuilderPlan(approval[1].toUpperCase());
      return NextResponse.json({
        ok: true,
        mode: "builder-approve",
        reply: [
          "Builder plan approved and executed, Commander.",
          "",
          `Final status: ${proof.final_status}`,
          `Validation passed: ${proof.validation_passed ? "YES" : "NO"}`,
          `Git commit: ${proof.git_commit_ok ? "YES" : "NO"}`,
          `Proof: ${proof.plan_id}-proof.json`,
        ].join("\n"),
        proof,
      });
    }

    if (/builder\s+status|build\s+status|plans/i.test(text)) {
      const plans = listBuilderPlans();
      return NextResponse.json({
        ok: true,
        mode: "builder-status",
        reply: formatStatusReply(plans),
        plans,
      });
    }

    if (isBuilderPlanCommand(text)) {
      const plan = createBuilderPlan(text);
      return NextResponse.json({
        ok: true,
        mode: "builder-plan",
        reply: formatPlanReply(plan),
        plan: {
          plan_id: plan.plan_id,
          status: plan.status,
          module_id: plan.module_id,
          title: plan.title,
          approval_phrase: plan.approval_phrase,
          proposed_files: plan.proposed_files.map((file) => ({
            path: file.path,
            action: file.action,
            purpose: file.purpose,
          })),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "commander-reply",
      reply: `Standing by, Commander. I heard: ${text}`,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      mode: "builder-error",
      reply: `Commander, Builder Core blocked this command: ${error?.message || "unknown error"}`,
      error: error?.message || "unknown error",
    }, { status: 500 });
  }
}

'@

$SmokeTest = @'
# KINGSMEN JARVIS BUILDER API SMOKE TEST
# Creates a plan only. It does not approve or write files.

$ErrorActionPreference = "Stop"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS BUILDER API SMOKE TEST" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This creates a plan only. No approval. No file write." -ForegroundColor Yellow
Write-Host ""

$StatusUrl = "http://127.0.0.1:3000/api/jarvis/status"
$BuilderUrl = "http://127.0.0.1:3000/api/jarvis/builder"
$CommandUrl = "http://127.0.0.1:3000/api/jarvis/command"

try {
  Invoke-RestMethod -Method Get -Uri $StatusUrl -TimeoutSec 5 | Out-Null
  Write-Host "Jarvis API: ONLINE" -ForegroundColor Green
} catch {
  Write-Host "Jarvis API is not online. Start it first:" -ForegroundColor Red
  Write-Host "C:\Kingsmen\START_JARVIS_NOW.cmd" -ForegroundColor White
  exit 1
}

$body = @{
  action = "plan"
  command = "Jarvis, create Kingsmen module N21 Builder API Smoke Test"
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod -Method Post -Uri $BuilderUrl -ContentType "application/json" -Body $body -TimeoutSec 20

Write-Host ""
Write-Host "PLAN CREATED:" -ForegroundColor Green
Write-Host ("Plan ID: " + $result.plan.plan_id) -ForegroundColor Cyan
Write-Host ("Module:  " + $result.plan.module_id) -ForegroundColor Cyan
Write-Host ("Title:   " + $result.plan.title) -ForegroundColor Cyan
Write-Host ""
Write-Host "Approval phrase if Commander chooses to execute:" -ForegroundColor Yellow
Write-Host $result.plan.approval_phrase -ForegroundColor White
Write-Host ""
Write-Host "No files were written by this smoke test." -ForegroundColor Green

'@

$BuilderCorePath = Join-Path $Repo "apps\web\src\lib\jarvis\builderCore.ts"
$BuilderRoutePath = Join-Path $Repo "apps\web\src\app\api\jarvis\builder\route.ts"
$CommandRoutePath = Join-Path $Repo "apps\web\src\app\api\jarvis\command\route.ts"
$SmokePath = Join-Path $Repo "tools\jarvis\JARVIS_BUILDER_API_SMOKE_TEST.ps1"
$DocPath = Join-Path $Repo "docs\jarvis\JARVIS_BUILDER_API_COMMAND_BRIDGE.md"
$LockPath = Join-Path $Repo "manifests\jarvis\jarvis-builder-api-command-bridge-lock.json"
$ProofPath = Join-Path $Repo "reports\jarvis\steps\STEP_02B_BUILDER_API_COMMAND_BRIDGE_PROOF.json"
$ReportPath = Join-Path $Repo "reports\jarvis\steps\STEP_02B_BUILDER_API_COMMAND_BRIDGE_REPORT.md"
$LedgerPath = Join-Path $Repo "docs\jarvis\JARVIS_BUILD_STEP_LEDGER.md"

WriteNoBom $BuilderCorePath $BuilderCoreTs
WriteNoBom $BuilderRoutePath $BuilderRouteTs
WriteNoBom $CommandRoutePath $CommandRouteTs
WriteNoBom $SmokePath $SmokeTest

$Now = (Get-Date).ToUniversalTime().ToString("o")

$Doc = @"
# Kingsmen Jarvis Builder API Command Bridge

Status: INSTALLED

This bridge connects the Jarvis typed command route to Builder Core.

## Commander cockpit flow

1. Commander types a build command in Jarvis:

   Jarvis, create Kingsmen module N21 Founder Command Digest

2. Jarvis creates a plan only.

3. No files are written until Commander types:

   approve KJB-yyyyMMdd-HHmmss

4. After approval, Jarvis writes only the planned safe files, runs validation, creates proof, and attempts a staged Git commit.

## API routes

- POST /api/jarvis/command
- GET /api/jarvis/builder
- POST /api/jarvis/builder

## Safe write boundary

- docs/kingsmen/modules/
- manifests/kingsmen/modules/
- reports/jarvis/builder/module-proofs/

## Blocked

- silent writes
- arbitrary filesystem writes
- public/candidate exposure
- visual CSS edits
- commit after validation failure

## Smoke test

C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd
"@
WriteNoBom $DocPath $Doc

$Lock = [ordered]@{
  lock_name = "jarvis-builder-api-command-bridge"
  status = "LOCKED"
  locked_at = $Now
  commander_only = $true
  cockpit_commands = @(
    "Jarvis, create Kingsmen module N21 Founder Command Digest",
    "approve KJB-yyyyMMdd-HHmmss",
    "builder status"
  )
  api_routes = @(
    "/api/jarvis/command",
    "/api/jarvis/builder"
  )
  allowed_write_boundaries = @(
    "docs\kingsmen\modules\",
    "manifests\kingsmen\modules\",
    "reports\jarvis\builder\module-proofs\"
  )
  visual_css_changed = $false
}
WriteNoBom $LockPath ($Lock | ConvertTo-Json -Depth 30)

$CmdPath = "C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd"
$CmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS BUILDER API SMOKE TEST",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\JARVIS_BUILDER_API_SMOKE_TEST.ps1"""
)
[System.IO.File]::WriteAllLines($CmdPath, $CmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $CmdPath) -ForegroundColor Green

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $Repo "tools\jarvis\KINGSMEN_JARVIS_STEP_02B_BUILDER_API_COMMAND_BRIDGE.ps1") -Force
}

$StepCmdPath = "C:\Kingsmen\JARVIS_STEP_02B_BUILDER_API_COMMAND_BRIDGE.cmd"
$StepCmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS STEP 02B BUILDER API COMMAND BRIDGE",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_02B_BUILDER_API_COMMAND_BRIDGE.ps1"""
)
[System.IO.File]::WriteAllLines($StepCmdPath, $StepCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $StepCmdPath) -ForegroundColor Green

$Proof = [ordered]@{
  step = "STEP_02B_BUILDER_API_COMMAND_BRIDGE"
  status = "COMPLETE"
  created_at = $Now
  visual_css_changed = $false
  safety_backup = $BackupRoot
  changed_files = @(
    [ordered]@{ path = "apps\web\src\lib\jarvis\builderCore.ts"; sha256 = (Sha256File $BuilderCorePath) },
    [ordered]@{ path = "apps\web\src\app\api\jarvis\builder\route.ts"; sha256 = (Sha256File $BuilderRoutePath) },
    [ordered]@{ path = "apps\web\src\app\api\jarvis\command\route.ts"; sha256 = (Sha256File $CommandRoutePath) },
    [ordered]@{ path = "tools\jarvis\JARVIS_BUILDER_API_SMOKE_TEST.ps1"; sha256 = (Sha256File $SmokePath) },
    [ordered]@{ path = "docs\jarvis\JARVIS_BUILDER_API_COMMAND_BRIDGE.md"; sha256 = (Sha256File $DocPath) },
    [ordered]@{ path = "manifests\jarvis\jarvis-builder-api-command-bridge-lock.json"; sha256 = (Sha256File $LockPath) },
    [ordered]@{ path = "C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd"; sha256 = (Sha256File $CmdPath) }
  )
  cockpit_test_commands = @(
    "Jarvis, create Kingsmen module N21 Builder API Smoke Test",
    "builder status",
    "approve KJB-yyyyMMdd-HHmmss"
  )
}
WriteNoBom $ProofPath ($Proof | ConvertTo-Json -Depth 50)

$Report = @(
  "# STEP 02B - Builder API Command Bridge",
  "",
  "Status: COMPLETE",
  "",
  "Installed typed Jarvis command route for Builder Core.",
  "",
  "No visual CSS changed.",
  "",
  "Commander commands:",
  "- Jarvis, create Kingsmen module N21 Builder API Smoke Test",
  "- builder status",
  "- approve KJB-yyyyMMdd-HHmmss",
  "",
  "Smoke test:",
  "- C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd",
  "",
  "Proof:",
  "- $ProofPath",
  ""
)
WriteNoBom $ReportPath (($Report -join "`r`n") + "`r`n")

Add-Content -Path $LedgerPath -Value @(
  "",
  "## STEP 02B - Builder API Command Bridge",
  "",
  "Status: COMPLETE at $Now",
  "",
  "Connected Jarvis typed command route to Builder Core.",
  "",
  "No visual CSS changed.",
  "",
  "Proof: $ProofPath",
  ""
) -Encoding UTF8

Write-Host ""
Write-Host "STEP 02B COMPLETE." -ForegroundColor Green
Write-Host "Restart the Next server, then test from Jarvis cockpit." -ForegroundColor Yellow
Write-Host ""
Write-Host "Cockpit test command:" -ForegroundColor Yellow
Write-Host "Jarvis, create Kingsmen module N21 Builder API Smoke Test" -ForegroundColor White
Write-Host ""
Write-Host "Or run smoke test:" -ForegroundColor Yellow
Write-Host "C:\Kingsmen\JARVIS_BUILDER_API_SMOKE_TEST.cmd" -ForegroundColor White
