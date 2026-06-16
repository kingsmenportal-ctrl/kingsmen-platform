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

const repoRoot = process.env.KINGSMEN_REPO_ROOT || "C:/Kingsmen/kingsmen-platform";
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
