import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const reportPath = path.join(root, "reports/n09/n09-3-validation-report.json");

const requiredFiles = [
  "packages/db/src/n09-action-packet-bridge-policy.ts",
  "scripts/validators/validate-n09-3.mjs",
  "manifests/modules/N09.3-communications-contracts.json"
];

const requiredTokens = {
  "packages/db/src/n09-action-packet-bridge-policy.ts": [
    "export function n09AssertBridgeSafe",
    "export function n09BuildActionPacketBridgePublic",
    "N09_BRIDGE_SOURCE_VERIFICATION_REQUIRED",
    "N09_BRIDGE_PROOF_REQUIRED",
    "N09_BRIDGE_CONSENT_REQUIRED",
    "N09_BRIDGE_SMS_BACKUP_ONLY",
    "N09_BRIDGE_CANDIDATE_CHANNEL_FORBIDDEN",
    "productionReady: false as const",
    "n09AssertChannelAllowed",
    "n09AssertProductionReadyFalse"
  ],
  "scripts/validators/validate-n09-3.mjs": [
    "validate-n09-3",
    "reports/n09/n09-3-validation-report.json",
    "sha256",
    "typescript"
  ],
  "manifests/modules/N09.3-communications-contracts.json": [
    "\"module\": \"N09\"",
    "\"submodule\": \"N09.3\"",
    "\"productionReady\": false",
    "\"packages/db/src/n09-action-packet-bridge-policy.ts\"",
    "\"scripts/validators/validate-n09-3.mjs\""
  ]
};

function relPath(filePath) {
  return path.join(root, filePath);
}

function exists(filePath) {
  return fs.existsSync(relPath(filePath));
}

function read(filePath) {
  return fs.readFileSync(relPath(filePath), "utf8");
}

function sha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function addCheck(checks, name, passed, detail, file = "") {
  checks.push({ name, passed, detail, file });
}

function checkRequiredFiles(checks) {
  for (const file of requiredFiles) {
    addCheck(checks, `exists:${file}`, exists(file), exists(file) ? "found" : "missing", file);
  }
}

function checkRequiredTokens(checks) {
  for (const [file, tokens] of Object.entries(requiredTokens)) {
    if (!exists(file)) continue;
    const content = read(file);
    for (const token of tokens) {
      addCheck(
        checks,
        `contains:${file}:${token}`,
        content.includes(token),
        content.includes(token) ? "found" : "missing",
        file
      );
    }
  }
}

function checkForbiddenContent(checks) {
  const forbidden = [
    { name: "productionReadyTrue", pattern: /productionReady\s*[:=]\s*true/i },
    { name: "productionReadyJsonTrue", pattern: /"productionReady"\s*:\s*true/i },
    { name: "productionReadySqlTrue", pattern: /production_ready\s*[:=]\s*true/i },
    { name: "todo", pattern: /\bTODO\b/i },
    { name: "fixme", pattern: /\bFIXME\b/i },
    { name: "hardcodedPasswordAssignment", pattern: new RegExp(["pass", "word"].join("") + "\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") },
    { name: "hardcodedTokenAssignment", pattern: new RegExp(["tok", "en"].join("") + "\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") },
    { name: "hardcodedApiKeyAssignment", pattern: new RegExp("api[_-]?key\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") },
    { name: "hardcodedSecretAssignment", pattern: new RegExp(["sec", "ret"].join("") + "\\s*[:=]\\s*['\\\"][^'\\\"]+", "i") }
  ];

  for (const file of requiredFiles) {
    if (!exists(file)) continue;
    const content = read(file);
    for (const item of forbidden) {
      const passed = !item.pattern.test(content);
      addCheck(
        checks,
        `forbidden:${file}:${item.name}`,
        passed,
        passed ? "not found" : "forbidden content found",
        file
      );
    }
  }
}

async function checkTypeScriptParse(checks) {
  const file = "packages/db/src/n09-action-packet-bridge-policy.ts";
  if (!exists(file)) return;

  let ts;
  try {
    ts = await import("typescript");
  } catch (error) {
    addCheck(
      checks,
      "typescript-parser-available",
      false,
      "typescript package is required for N09.3 validation",
      file
    );
    return;
  }

  const content = read(file);
  const result = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      strict: true,
      noEmitOnError: true
    },
    reportDiagnostics: true,
    fileName: file
  });

  const diagnostics = result.diagnostics ?? [];
  addCheck(
    checks,
    "typescript-parse:n09-action-packet-bridge-policy.ts",
    diagnostics.length === 0,
    diagnostics.length === 0
      ? "parsed"
      : diagnostics.map((d) => String(d.messageText)).join(" | "),
    file
  );
}

function checkManifest(checks) {
  const file = "manifests/modules/N09.3-communications-contracts.json";
  if (!exists(file)) return;

  try {
    const manifest = JSON.parse(read(file));
    addCheck(checks, "manifest:json-parse", true, "parsed", file);
    addCheck(checks, "manifest:module", manifest.module === "N09", String(manifest.module), file);
    addCheck(checks, "manifest:submodule", manifest.submodule === "N09.3", String(manifest.submodule), file);
    addCheck(checks, "manifest:productionReadyFalse", manifest.productionReady === false, String(manifest.productionReady), file);

    const manifestFiles = new Set((manifest.files ?? []).map((entry) => entry.path));
    for (const required of requiredFiles) {
      addCheck(
        checks,
        `manifest:includes:${required}`,
        manifestFiles.has(required),
        manifestFiles.has(required) ? "included" : "missing",
        file
      );
    }
  } catch (error) {
    addCheck(checks, "manifest:json-parse", false, error instanceof Error ? error.message : "parse failed", file);
  }
}

function buildChecksums() {
  return requiredFiles
    .filter((file) => exists(file))
    .map((file) => ({
      path: file,
      sha256: sha256(read(file)),
      bytes: Buffer.byteLength(read(file), "utf8")
    }));
}

async function main() {
  const checks = [];

  checkRequiredFiles(checks);
  checkRequiredTokens(checks);
  checkForbiddenContent(checks);
  checkManifest(checks);
  await checkTypeScriptParse(checks);

  const failed = checks.filter((check) => !check.passed);
  const report = {
    module: "N09",
    submodule: "N09.3",
    validator: "validate-n09-3",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: failed.length === 0,
    totalChecks: checks.length,
    failedChecks: failed.length,
    checksums: buildChecksums(),
    failed,
    checks,
    nextTrackerRow: failed.length === 0
      ? "CREATOR.1 — scripts/KINGSMEN_CREATOR.ps1"
      : "N09.3 repair — fix failed checks in reports/n09/n09-3-validation-report.json"
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

main().catch((error) => {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = {
    module: "N09",
    submodule: "N09.3",
    validator: "validate-n09-3",
    productionReady: false,
    generatedAt: new Date().toISOString(),
    passed: false,
    totalChecks: 1,
    failedChecks: 1,
    failed: [{
      name: "validator:unhandled-error",
      passed: false,
      detail: error instanceof Error ? error.message : String(error)
    }],
    nextTrackerRow: "N09.3 repair — validator crashed"
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
