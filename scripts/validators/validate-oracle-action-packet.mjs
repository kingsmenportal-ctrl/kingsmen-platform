import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/oracle/oracle-action-packet-validation-report.json");

const requiredFiles = [
  "scripts/oracle/Write-OracleFounderActionPacket.ps1",
  "reports/oracle/oracle-founder-action-packet-report.json",
  "kingsmen/oracle/action-packets/oracle-founder-action-packet.json",
  "docs/oracle/oracle-founder-action-packet.md",
  "reports/oracle/oracle-prerequisites-validation-report.json",
  "reports/oracle/oracle-free-prerequisites-report.json",
  "reports/oracle/oracle-workspace-validation-report.json",
  "reports/openclaw/openclaw-safety-report.json",
  "kingsmen/oracle/cost-guard/oracle-cost-guard.json",
  "kingsmen/oracle/security/oracle-security-checklist.json",
  "config/environment/.env.template",
  "config/providers/provider-registry.json"
];

const requiredDirs = [
  "kingsmen/oracle/action-packets",
  "kingsmen/oracle/runtime-notes",
  "reports/oracle",
  "docs/oracle"
];

const requiredMarkdownPhrases = [
  "Kingsmen Oracle Free Founder Action Packet",
  "Production ready: false",
  "ORACLE.6 prerequisites validation",
  "No secrets in Git",
  "No paid resources without founder approval",
  "No production candidate traffic yet",
  "PostgreSQL and Redis must remain private",
  "OpenClaw is a governed helper only"
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

function checkPresence(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, existsFile(file), existsFile(file) ? "found" : "missing", file);
  }
  for (const dir of requiredDirs) {
    addCheck(checks, `directory:${dir}`, existsDir(dir), existsDir(dir) ? "found" : "missing", dir);
  }
}

function checkForbiddenText(checks) {
  const forbidden = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
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

function parseJsonFile(checks, file, label) {
  if (!existsFile(file)) return null;
  try {
    const json = readJson(file);
    addCheck(checks, `${label}:json`, true, "parsed", file);
    return json;
  } catch (error) {
    addCheck(checks, `${label}:json`, false, error instanceof Error ? error.message : "parse failed", file);
    return null;
  }
}

function checkReport(checks, file, label, expectedModule, expectedSubmodule) {
  const report = parseJsonFile(checks, file, label);
  if (!report) return null;
  addCheck(checks, `${label}:module`, report.module === expectedModule, String(report.module), file);
  addCheck(checks, `${label}:submodule`, report.submodule === expectedSubmodule, String(report.submodule), file);
  addCheck(checks, `${label}:passed`, report.passed === true, String(report.passed), file);
  addCheck(checks, `${label}:failedChecksZero`, Number(report.failedChecks) === 0, String(report.failedChecks), file);
  addCheck(checks, `${label}:productionReadyFalse`, report.productionReady === false, String(report.productionReady), file);
  return report;
}

function checkFounderActionPacketReport(checks) {
  const file = "reports/oracle/oracle-founder-action-packet-report.json";
  const report = checkReport(checks, file, "founder-action-report", "ORACLE", "ORACLE.7");
  if (!report) return;
  addCheck(checks, "founder-action-report:script", report.script === "scripts/oracle/Write-OracleFounderActionPacket.ps1", String(report.script ?? ""), file);
  addCheck(checks, "founder-action-report:nextTrackerRow", report.nextTrackerRow === "ORACLE.8 - scripts/validators/validate-oracle-action-packet.mjs", String(report.nextTrackerRow ?? ""), file);

  const created = Array.isArray(report.created) ? report.created : [];
  const createdPaths = new Set(created.map((item) => item.path));
  addCheck(checks, "founder-action-report:created-json", createdPaths.has("kingsmen/oracle/action-packets/oracle-founder-action-packet.json"), createdPaths.has("kingsmen/oracle/action-packets/oracle-founder-action-packet.json") ? "present" : "missing", file);
  addCheck(checks, "founder-action-report:created-md", createdPaths.has("docs/oracle/oracle-founder-action-packet.md"), createdPaths.has("docs/oracle/oracle-founder-action-packet.md") ? "present" : "missing", file);

  const proofSummary = report.proofSummary && typeof report.proofSummary === "object" ? report.proofSummary : null;
  if (proofSummary) {
    const keys = [
      "oracleFounderActionPacketPassed",
      "oraclePrerequisitesValidationPassed",
      "oraclePrerequisitesPassed",
      "oracleWorkspaceValidationPassed",
      "openClawSafetyPassed",
      "actionPacketJsonWritten",
      "actionPacketMarkdownWritten",
      "productionReadyFalseVerified",
      "noFailedChecks"
    ];
    for (const key of keys) {
      addCheck(checks, `founder-action-report:proofSummary:${key}`, proofSummary[key] === true, String(proofSummary[key]), file);
    }
  }
}

function checkActionPacketJson(checks) {
  const file = "kingsmen/oracle/action-packets/oracle-founder-action-packet.json";
  const packet = parseJsonFile(checks, file, "action-packet");
  if (!packet) return;

  addCheck(checks, "action-packet:module", packet.module === "ORACLE", String(packet.module), file);
  addCheck(checks, "action-packet:submodule", packet.submodule === "ORACLE.7", String(packet.submodule), file);
  addCheck(checks, "action-packet:status", packet.status === "written_pending_validation", String(packet.status), file);
  addCheck(checks, "action-packet:productionReadyFalse", packet.productionReady === false, String(packet.productionReady), file);
  addCheck(checks, "action-packet:purpose", typeof packet.purpose === "string" && packet.purpose.length > 40, String(packet.purpose ?? ""), file);

  const proof = packet.currentProof ?? {};
  const proofKeys = ["oraclePrerequisitesValidationPassed", "oraclePrerequisitesPassed", "oracleWorkspaceValidationPassed", "openClawSafetyPassed"];
  for (const key of proofKeys) {
    addCheck(checks, `action-packet:currentProof:${key}`, proof[key] === true, String(proof[key]), file);
  }
  addCheck(checks, "action-packet:currentProof:productionReadyFalse", proof.productionReady === false, String(proof.productionReady), file);
  addCheck(checks, "action-packet:currentProof:gitHeadHash", typeof proof.gitHeadHash === "string" && proof.gitHeadHash.length >= 7, String(proof.gitHeadHash ?? ""), file);

  addCheck(checks, "action-packet:founderActions", Array.isArray(packet.founderActions) && packet.founderActions.length >= 5, String(packet.founderActions?.length ?? 0), file);
  if (Array.isArray(packet.founderActions)) {
    for (const action of packet.founderActions) {
      addCheck(checks, `action-packet:founderAction:${action.order}:title`, typeof action.title === "string" && action.title.length > 3, String(action.title ?? ""), file);
      addCheck(checks, `action-packet:founderAction:${action.order}:proof`, typeof action.proofToCapture === "string" && action.proofToCapture.length > 10, String(action.proofToCapture ?? ""), file);
      addCheck(checks, `action-packet:founderAction:${action.order}:blocked`, typeof action.blocked === "string" && action.blocked.length > 10, String(action.blocked ?? ""), file);
    }
  }

  const commandPlan = packet.commandPlan ?? {};
  addCheck(checks, "action-packet:commandPlan:localNextValidation", commandPlan.localNextValidation === "node scripts/validators/validate-oracle-action-packet.mjs", String(commandPlan.localNextValidation ?? ""), file);
  addCheck(checks, "action-packet:commandPlan:approvalCommands", Array.isArray(commandPlan.laterCloudCommandsRequireFounderApproval) && commandPlan.laterCloudCommandsRequireFounderApproval.length >= 5, String(commandPlan.laterCloudCommandsRequireFounderApproval?.length ?? 0), file);
  addCheck(checks, "action-packet:commandPlan:safeNow", Array.isArray(commandPlan.safeNow) && commandPlan.safeNow.length >= 5, String(commandPlan.safeNow?.length ?? 0), file);

  const safety = packet.safetyBoundaries ?? {};
  const trueSafetyKeys = ["noCloudResourcesCreatedByThisScript", "noCredentialsStoredByThisScript", "noProductionDeployByThisScript", "noPaidResourceChangeByThisScript", "oracleLiteFirst", "dockerComposeFirst", "candidateSafetyWins"];
  for (const key of trueSafetyKeys) {
    addCheck(checks, `action-packet:safety:${key}`, safety[key] === true, String(safety[key]), file);
  }
  addCheck(checks, "action-packet:safety:productionReadyFalse", safety.productionReady === false, String(safety.productionReady), file);
  addCheck(checks, "action-packet:nextTrackerRow", packet.nextTrackerRow === "ORACLE.8 - scripts/validators/validate-oracle-action-packet.mjs", String(packet.nextTrackerRow ?? ""), file);
}

function checkActionPacketMarkdown(checks) {
  const file = "docs/oracle/oracle-founder-action-packet.md";
  if (!existsFile(file)) return;
  const content = read(file);
  for (const phrase of requiredMarkdownPhrases) {
    addCheck(checks, `action-packet-md:phrase:${phrase}`, content.includes(phrase), content.includes(phrase) ? "present" : "missing", file);
  }
}

function checkEnvTemplate(checks) {
  const file = "config/environment/.env.template";
  if (!existsFile(file)) return;
  const content = read(file);
  const required = [
    "KINGSMEN_PRODUCTION_READY=false",
    "KINGSMEN_DEFAULT_DEPLOY_TARGET=oracle_lite",
    "KINGSMEN_ORACLE_LITE_MODE=true",
    "KINGSMEN_ACTIVE_CANDIDATE_CAP=500",
    "KINGSMEN_LOW_CONCURRENCY_MODE=true"
  ];
  const forbidden = [
    "KINGSMEN_PRODUCTION_READY=true",
    "SECRETS_IN_GIT_ALLOWED=true",
    "SERVICE_ROLE_BROWSER_EXPOSURE_ALLOWED=true"
  ];
  for (const token of required) {
    addCheck(checks, `env:required:${token}`, content.includes(token), content.includes(token) ? "present" : "missing", file);
  }
  for (const token of forbidden) {
    addCheck(checks, `env:forbidden:${token}`, !content.includes(token), content.includes(token) ? "forbidden value present" : "not present", file);
  }
}

function buildChecksums() {
  return requiredFiles.filter(existsFile).map((file) => {
    const content = read(file);
    return { path: file, sha256: sha256(content), bytes: Buffer.byteLength(content, "utf8") };
  });
}

function main() {
  const checks = [];
  checkPresence(checks);
  checkForbiddenText(checks);
  checkReport(checks, "reports/oracle/oracle-prerequisites-validation-report.json", "oracle6-report", "ORACLE", "ORACLE.6");
  checkReport(checks, "reports/oracle/oracle-free-prerequisites-report.json", "oracle5-report", "ORACLE", "ORACLE.5");
  checkReport(checks, "reports/oracle/oracle-workspace-validation-report.json", "oracle4-report", "ORACLE", "ORACLE.4");
  checkReport(checks, "reports/openclaw/openclaw-safety-report.json", "openclaw-report", "OPENCLAW", "OPENCLAW.3");
  checkFounderActionPacketReport(checks);
  checkActionPacketJson(checks);
  checkActionPacketMarkdown(checks);
  checkEnvTemplate(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "ORACLE",
    submodule: "ORACLE.8",
    validator: "validate-oracle-action-packet.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    warningChecks: 0,
    checksums: buildChecksums(),
    failed,
    warnings: [],
    checks,
    nextTrackerRow: failed.length === 0
      ? "ORACLE.9 - scripts/oracle/Prepare-OracleVmBootstrapPlan.ps1"
      : "ORACLE.8 repair - fix hard failures in reports/oracle/oracle-action-packet-validation-report.json"
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
    module: "ORACLE",
    submodule: "ORACLE.8",
    validator: "validate-oracle-action-packet.mjs",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    warningChecks: 0,
    failed: [
      {
        name: "validator:unhandled-error",
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
        file: "scripts/validators/validate-oracle-action-packet.mjs"
      }
    ],
    nextTrackerRow: "ORACLE.8 repair - validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
