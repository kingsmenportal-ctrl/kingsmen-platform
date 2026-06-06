#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const sourcePage = "apps/web/src/app/kingsmen/page.tsx";
const targetPage = "apps/web/src/app/free-destiny-map/page.tsx";
const proofPath = "reports/candidate/candidate-public-free-destiny-map-entry-proof.json";

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

function writeJson(rel, value) {
  writeText(rel, JSON.stringify(value, null, 2) + "\n");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

check(`required-file:${sourcePage}`, exists(sourcePage), sourcePage);
check(`required-file:${targetPage}`, exists(targetPage), targetPage);

let source = exists(sourcePage) ? readText(sourcePage) : "";
const target = exists(targetPage) ? readText(targetPage) : "";

const alreadyLinked =
  source.includes('data-kingsmen-free-destiny-map-entry="true"') ||
  source.includes('href="/free-destiny-map/"') ||
  source.includes("href='/free-destiny-map/'");

const entryBlock = `
        <a
          data-kingsmen-free-destiny-map-entry="true"
          href="/free-destiny-map/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "18px",
            padding: "13px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(214, 178, 94, 0.62)",
            background: "linear-gradient(135deg, rgba(214,178,94,0.22), rgba(214,178,94,0.08))",
            color: "#f8d77a",
            fontWeight: 900,
            textDecoration: "none",
            boxShadow: "0 16px 48px rgba(0,0,0,0.24)"
          }}
        >
          Start Free Destiny Map
        </a>
`;

if (!alreadyLinked) {
  if (source.includes("</main>")) {
    source = source.replace("</main>", `${entryBlock}\n    </main>`);
    writeText(sourcePage, source);
  } else {
    check(
      "source-page-has-main-close-for-safe-insert",
      false,
      "Could not find </main>; refusing unsafe patch."
    );
  }
}

source = exists(sourcePage) ? readText(sourcePage) : "";

check("source-page-has-entry-marker", source.includes('data-kingsmen-free-destiny-map-entry="true"'), "entry marker");
check("source-page-links-to-free-destiny-map", source.includes('href="/free-destiny-map/"'), "/free-destiny-map/");
check("source-page-has-candidate-label", source.includes("Start Free Destiny Map"), "candidate CTA label");

check("target-page-exists", exists(targetPage), targetPage);
check(
  "target-page-is-free-destiny-map",
  /Free Destiny Map|Destiny Map|free-destiny-map/i.test(target),
  "target page must identify Free Destiny Map"
);

check(
  "candidate-entry-not-founder-only",
  !source.includes("/founder/proof-centre") || source.includes("/free-destiny-map/"),
  "candidate entry must not depend on founder proof centre"
);

check("no-production-ready-claim", !source.includes("productionReady: true") && !target.includes("productionReady: true"), "no production claim");
check("no-oracle-deployed-claim", !source.includes("deployedToOracle: true") && !target.includes("deployedToOracle: true"), "no Oracle claim");

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh",
  "WHATSAPP_TOKEN"
];

for (const pattern of forbiddenPatterns) {
  check(`source-no-forbidden:${pattern}`, !source.includes(pattern), pattern);
  check(`target-no-forbidden:${pattern}`, !target.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.candidate-public-free-destiny-map-entry-proof.v1",
  module: "BATCH 32 - Candidate Public Entry to Free Destiny Map",
  status: passed
    ? "CANDIDATE_PUBLIC_FREE_DESTINY_MAP_ENTRY_PROVEN"
    : "CANDIDATE_PUBLIC_FREE_DESTINY_MAP_ENTRY_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  touchesSecrets: false,
  touchesCandidateData: false,
  touchesPayments: false,
  touchesMessaging: false,
  generated_at: new Date().toISOString(),
  sourcePage,
  sourceRoute: "/kingsmen",
  targetPage,
  targetRoute: "/free-destiny-map/",
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 32."
    : "Repair candidate public Free Destiny Map entry before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);

