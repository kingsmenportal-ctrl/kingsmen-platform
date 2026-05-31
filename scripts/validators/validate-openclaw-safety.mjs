import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/openclaw/openclaw-safety-report.json");

const requiredFiles = [
  "kingsmen/openclaw/openclaw-operator-policy.json",
  "scripts/openclaw/Prepare-KingsmenOpenClaw.ps1",
  "reports/openclaw/openclaw-prepare-report.json",
  "kingsmen/openclaw/runtime-config.json",
  "kingsmen/openclaw/allowed-commands.json",
  "docs/openclaw/README.md"
];

const requiredDirectories = [
  "kingsmen/openclaw",
  "kingsmen/openclaw/workspace",
  "kingsmen/openclaw/masked-reports",
  "kingsmen/openclaw/inbox",
  "kingsmen/openclaw/outbox",
  "kingsmen/openclaw/drafts",
  "kingsmen/openclaw/source-scout",
  "kingsmen/openclaw/action-packets",
  "docs/openclaw",
  "reports/openclaw",
  "scripts/openclaw"
];

const requiredSafeCommands = [
  "git status --short",
  "git log --oneline -n 5",
  "node scripts/validators/validate-provider-health.mjs",
  "node scripts/validators/validate-n09-3.mjs",
  "powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/KINGSMEN_CREATOR.ps1 -Phase Doctor",
  "powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/phases/Invoke-KingsmenPhase.ps1 -Action Report"
];

const requiredRuntimeBooleans = [
  "productionReady:false",
  "openClawIsBusinessBrain:false",
  "backendGovernsRuntime:true",
  "postgresqlIsTruth:true",
  "powershellCreatorMaterializes:true",
  "validatorsProve:true",
  "githubPreservesHistory:true",
  "oracleLiteFirst:true",
  "candidateSafetyWins:true"
];

function abs(filePath) {
  return path.join(root, filePath);
}

function existsFile(filePath) {
  return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isFile();
}

function existsDir(filePath) {
  return fs.existsSync(abs(filePath)) && fs.statSync(abs(filePath)).isDirectory();
}

function read(filePath) {
  return fs.readFileSync(abs(filePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function sha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function addCheck(checks, name, passed, detail, file = "") {
  checks.push({ name, passed: Boolean(passed), detail: String(detail ?? ""), file });
}

function checkFilePresence(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, existsFile(file), existsFile(file) ? "found" : "missing", file);
  }
  for (const dir of requiredDirectories) {
    addCheck(checks, `directory:${dir}`, existsDir(dir), existsDir(dir) ? "found" : "missing", dir);
  }
}

function checkForbiddenText(checks) {
  const forbidden = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
    { name: "privateKeyMaterial", pattern: /BEGIN (RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY/i },
    { name: "todoMarker", pattern: /\bTODO\b/i },
    { name: "fixmeMarker", pattern: /\bFIXME\b/i }
  ];

  for (const file of requiredFiles.filter(existsFile)) {
    const content = read(file);
    for (const rule of forbidden) {
      const ok = !rule.pattern.test(content);
      addCheck(checks, `forbidden:${file}:${rule.name}`, ok, ok ? "not found" : "forbidden text found", file);
    }
  }
}

function checkPolicy(checks) {
  const file = "kingsmen/openclaw/openclaw-operator-policy.json";
  if (!existsFile(file)) return null;
  let policy;
  try {
    policy = readJson(file);
    addCheck(checks, "policy:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "policy:json", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "policy:module", policy.module === "OPENCLAW", String(policy.module), file);
  addCheck(checks, "policy:submodule", policy.submodule === "OPENCLAW.1", String(policy.submodule), file);
  addCheck(checks, "policy:productionReadyFalse", policy.productionReady === false, String(policy.productionReady), file);
  addCheck(checks, "policy:authorityHierarchy", Array.isArray(policy.authorityHierarchy) && policy.authorityHierarchy.length >= 7, String(policy.authorityHierarchy?.length ?? 0), file);

  const boundaries = policy.hardBoundaries ?? {};
  const boundaryFalseKeys = [
    "openClawReplacesChatGPT",
    "openClawReplacesPowerShellCreator",
    "openClawReplacesBackend",
    "openClawWritesProductionPostgres",
    "openClawReadsSecrets",
    "openClawHandlesPaymentKeys",
    "openClawAutoDeploysProduction",
    "openClawSendsRealCandidateMessagesWithoutApproval"
  ];
  for (const key of boundaryFalseKeys) {
    addCheck(checks, `policy:boundaryFalse:${key}`, boundaries[key] === false, String(boundaries[key]), file);
  }

  const allowed = policy.allowedAtBuildStage ?? {};
  const allowedTrueKeys = [
    "readReports",
    "summarizeValidatorFailures",
    "runSafeValidators",
    "readGitStatus",
    "draftPatches",
    "draftGitHubIssues",
    "monitorLocalOracleLiteHealth",
    "monitorDiskCpuRam",
    "scoutOfficialPublicSources",
    "draftFounderActionPackets",
    "draftStaffGuidance"
  ];
  for (const key of allowedTrueKeys) {
    addCheck(checks, `policy:allowedBuildStage:${key}`, allowed[key] === true, String(allowed[key]), file);
  }

  addCheck(checks, "policy:permissionLevels", Array.isArray(policy.permissionLevels) && policy.permissionLevels.length >= 7, String(policy.permissionLevels?.length ?? 0), file);
  addCheck(checks, "policy:agents", Array.isArray(policy.agents) && policy.agents.length >= 6, String(policy.agents?.length ?? 0), file);
  addCheck(checks, "policy:oracleFreeStrategy", Boolean(policy.oracleFreeStrategy), policy.oracleFreeStrategy ? "present" : "missing", file);
  addCheck(checks, "policy:nextTrackerRow", policy.nextTrackerRow === "OPENCLAW.2 - scripts/openclaw/Prepare-KingsmenOpenClaw.ps1", String(policy.nextTrackerRow ?? ""), file);

  return policy;
}

function checkRuntimeConfig(checks) {
  const file = "kingsmen/openclaw/runtime-config.json";
  if (!existsFile(file)) return null;
  let config;
  try {
    config = readJson(file);
    addCheck(checks, "runtime:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "runtime:json", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "runtime:module", config.module === "OPENCLAW", String(config.module), file);
  addCheck(checks, "runtime:submodule", config.submodule === "OPENCLAW.2", String(config.submodule), file);
  addCheck(checks, "runtime:defaultPermissionLevel", Number(config.defaultPermissionLevel) === 2, String(config.defaultPermissionLevel), file);
  addCheck(checks, "runtime:maxPermissionLevel", Number(config.maxPermissionLevelWithoutFounderApproval) === 3, String(config.maxPermissionLevelWithoutFounderApproval), file);

  for (const item of requiredRuntimeBooleans) {
    const [key, expectedRaw] = item.split(":");
    const expected = expectedRaw === "true";
    addCheck(checks, `runtime:boolean:${key}`, config[key] === expected, String(config[key]), file);
  }

  const workspace = config.workspace ?? {};
  const workspacePaths = ["root", "reports", "maskedReports", "drafts", "sourceScout", "actionPackets"];
  for (const key of workspacePaths) {
    addCheck(checks, `runtime:workspace:${key}`, typeof workspace[key] === "string" && workspace[key].length > 0, String(workspace[key] ?? ""), file);
  }

  addCheck(checks, "runtime:nextTrackerRow", config.nextTrackerRow === "OPENCLAW.3 - scripts/validators/validate-openclaw-safety.mjs", String(config.nextTrackerRow ?? ""), file);
  return config;
}

function checkAllowedCommands(checks) {
  const file = "kingsmen/openclaw/allowed-commands.json";
  if (!existsFile(file)) return null;
  let commands;
  try {
    commands = readJson(file);
    addCheck(checks, "commands:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "commands:json", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "commands:module", commands.module === "OPENCLAW", String(commands.module), file);
  addCheck(checks, "commands:submodule", commands.submodule === "OPENCLAW.2", String(commands.submodule), file);
  addCheck(checks, "commands:productionReadyFalse", commands.productionReady === false, String(commands.productionReady), file);
  addCheck(checks, "commands:allowedArray", Array.isArray(commands.allowed), String(commands.allowed?.length ?? 0), file);
  addCheck(checks, "commands:approvalArray", Array.isArray(commands.approvalRequired), String(commands.approvalRequired?.length ?? 0), file);

  const allowed = Array.isArray(commands.allowed) ? commands.allowed : [];
  for (const cmd of requiredSafeCommands) {
    addCheck(checks, `commands:allowed:${cmd}`, allowed.includes(cmd), allowed.includes(cmd) ? "present" : "missing", file);
  }

  const allowedText = allowed.join("\n").toLowerCase();
  const disallowedInAllowed = [" git commit", " git push", "docker compose up", "docker compose down"];
  for (const token of disallowedInAllowed) {
    const ok = !allowedText.includes(token.trim().toLowerCase());
    addCheck(checks, `commands:not-in-allowed:${token.trim()}`, ok, ok ? "not present" : "must require approval", file);
  }

  return commands;
}

function checkPrepareReport(checks) {
  const file = "reports/openclaw/openclaw-prepare-report.json";
  if (!existsFile(file)) return null;
  let report;
  try {
    report = readJson(file);
    addCheck(checks, "prepare-report:json", true, "parsed", file);
  } catch (error) {
    addCheck(checks, "prepare-report:json", false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }

  addCheck(checks, "prepare-report:module", report.module === "OPENCLAW", String(report.module), file);
  addCheck(checks, "prepare-report:submodule", report.submodule === "OPENCLAW.2", String(report.submodule), file);
  addCheck(checks, "prepare-report:passed", report.passed === true, String(report.passed), file);
  addCheck(checks, "prepare-report:productionReadyFalse", report.productionReady === false, String(report.productionReady), file);
  addCheck(checks, "prepare-report:failedChecksZero", Number(report.failedChecks) === 0, String(report.failedChecks), file);
  addCheck(checks, "prepare-report:nextTrackerRow", report.nextTrackerRow === "OPENCLAW.3 - scripts/validators/validate-openclaw-safety.mjs", String(report.nextTrackerRow ?? ""), file);
  return report;
}

function buildChecksums() {
  return requiredFiles.filter(existsFile).map((file) => {
    const content = read(file);
    return { path: file, sha256: sha256(content), bytes: Buffer.byteLength(content, "utf8") };
  });
}

function main() {
  const checks = [];
  checkFilePresence(checks);
  checkForbiddenText(checks);
  checkPolicy(checks);
  checkRuntimeConfig(checks);
  checkAllowedCommands(checks);
  checkPrepareReport(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "OPENCLAW",
    submodule: "OPENCLAW.3",
    validator: "validate-openclaw-safety.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    checksums: buildChecksums(),
    failed,
    checks,
    nextTrackerRow: failed.length === 0
      ? "ORACLE.1 - kingsmen/oracle/oracle-free-bootstrap-plan.json"
      : "OPENCLAW.3 repair - fix failed checks in reports/openclaw/openclaw-safety-report.json"
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

try {
  main();
} catch (error) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = {
    module: "OPENCLAW",
    submodule: "OPENCLAW.3",
    validator: "validate-openclaw-safety.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    failed: [
      {
        name: "validator:unhandled-error",
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
        file: "scripts/validators/validate-openclaw-safety.mjs"
      }
    ],
    nextTrackerRow: "OPENCLAW.3 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
