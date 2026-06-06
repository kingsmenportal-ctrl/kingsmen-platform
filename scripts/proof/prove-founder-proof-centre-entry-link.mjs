#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const sourcePage = "apps/web/src/app/founder/control-plane/page.tsx";
const targetPage = "apps/web/src/app/founder/proof-centre/page.tsx";
const targetRoute = "/founder/proof-centre/";
const proofPath = "reports/control-plane/founder-proof-centre-entry-link-proof.json";

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeJson(rel, value) {
  writeText(rel, `${JSON.stringify(value, null, 2)}\n`);
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

const batch26ProofPath = "reports/control-plane/founder-proof-centre-runtime-reachability-proof.json";
const batch26ValidationPath = "reports/validation/founder-proof-centre-runtime-reachability-latest.json";

check(`required-file:${sourcePage}`, exists(sourcePage), sourcePage);
check(`required-file:${targetPage}`, exists(targetPage), targetPage);
check(`required-file:${batch26ProofPath}`, exists(batch26ProofPath), batch26ProofPath);
check(`required-file:${batch26ValidationPath}`, exists(batch26ValidationPath), batch26ValidationPath);

const batch26Proof = exists(batch26ProofPath) ? readJson(batch26ProofPath) : null;
const batch26Validation = exists(batch26ValidationPath) ? readJson(batch26ValidationPath) : null;

check(
  "batch26b-runtime-reachable",
  batch26Proof?.status === "FOUNDER_PROOF_CENTRE_RUNTIME_REACHABLE_LOCAL" && batch26Proof?.passed === true,
  batch26Proof?.status ?? "missing"
);

check(
  "batch26b-validation-passed",
  batch26Validation?.status === "VALIDATED" && batch26Validation?.passed === true,
  batch26Validation?.status ?? "missing"
);

check(
  "batch26b-no-production-claim",
  batch26Proof?.productionReady === false && batch26Proof?.canClaimProduction === false,
  "BATCH 26B production false"
);

check(
  "batch26b-no-oracle-claim",
  batch26Proof?.deployedToOracle === false,
  "BATCH 26B oracle false"
);

let source = exists(sourcePage) ? readText(sourcePage) : "";

const alreadyLinked =
  source.includes('data-kingsmen-proof-centre-entry="true"') ||
  source.includes("data-kingsmen-proof-centre-entry='true'") ||
  source.includes('href="/founder/proof-centre/"') ||
  source.includes("href='/founder/proof-centre/'");

const entryBlock = `
        <a
          data-kingsmen-proof-centre-entry="true"
          href="/founder/proof-centre/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "18px",
            padding: "12px 16px",
            borderRadius: "999px",
            border: "1px solid rgba(214, 178, 94, 0.55)",
            background: "rgba(214, 178, 94, 0.12)",
            color: "#f8d77a",
            fontWeight: 900,
            textDecoration: "none"
          }}
        >
          Open Build Proof Centre
        </a>
`;

if (!alreadyLinked) {
  if (source.includes("</main>")) {
    source = source.replace("</main>", `${entryBlock}\n    </main>`);
  } else {
    check(
      "source-page-has-main-close-for-safe-insert",
      false,
      "Could not find </main> in apps/web/src/app/founder/control-plane/page.tsx. Refusing unsafe patch."
    );
  }

  writeText(sourcePage, source);
}

source = exists(sourcePage) ? readText(sourcePage) : "";

check("entry-link-present", source.includes('data-kingsmen-proof-centre-entry="true"'), "data marker");
check("entry-link-target-route", source.includes('href="/founder/proof-centre/"'), targetRoute);
check("entry-link-label", source.includes("Open Build Proof Centre"), "label");
check("target-page-exists", exists(targetPage), targetPage);
check("target-page-has-founder-control-plane", readText(targetPage).includes("Kingsmen Founder Control Plane"), "target title");
check("target-page-has-build-proof-centre", readText(targetPage).includes("Build Proof Centre"), "target proof centre text");
check("entry-link-no-production-claim", !source.includes("productionReady: true") && !source.includes("production ready"), "no production claim");
check("entry-link-no-oracle-claim", !source.includes("deployedToOracle: true") && !source.includes("Oracle deployed"), "no Oracle claim");

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`source-no-forbidden:${pattern}`, !source.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.founder-proof-centre-entry-link-proof.v1",
  module: "BATCH 27 - Founder Control Plane Proof Centre Entry Link",
  status: passed
    ? "FOUNDER_PROOF_CENTRE_ENTRY_LINK_PROVEN"
    : "FOUNDER_PROOF_CENTRE_ENTRY_LINK_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  runtimeScope: "local_founder_control_plane_link_only",
  sourcePage,
  targetRoute,
  targetPage,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 27."
    : "Repair Founder Control Plane entry link before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
