import fs from "node:fs";

const checks = [
  {
    layer: "MASTER-INDEX-01",
    expected: [
      "docs/master/KINGSMEN_MASTER_LAYER_INDEX.md",
      "manifests/master/kingsmen-master-layer-index.json",
      "manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json",
      "scripts/proof/prove-master-layer-index-and-provider-gates.mjs",
      "reports/master/master-layer-index-proof-latest.json"
    ]
  },
  {
    layer: "N00",
    expected: [
      "docs/constitution/KINGSMEN_CONSTITUTION.md",
      "manifests/constitution/n00-constitution-doctrine-lock.json",
      "packages/contracts/src/constitution-contract.ts",
      "packages/backend/src/constitution/constitution-loader.ts",
      "scripts/proof/prove-n00-constitution-doctrine-lock.mjs",
      "scripts/validators/validate-n00-constitution-doctrine-lock.mjs",
      "reports/constitution/n00-constitution-proof-latest.json",
      "reports/validation/n00-constitution-validation-latest.json"
    ]
  },
  {
    layer: "N01",
    expected: [
      "reports/validation/n01-readiness-report.json",
      "scripts/validators/validate-n01-readiness.mjs"
    ]
  },
  {
    layer: "N09.3",
    expected: [
      "manifests/modules/N09.3-communications-contracts.json",
      "scripts/validators/validate-n09-3.mjs",
      "reports/n09/n09-3-validation-report.json"
    ]
  },
  {
    layer: "ORACLE-RUNTIME-BATCHES",
    expected: [
      "manifests/runtime/batch21c-github-actions-docker-runtime-proof.json",
      "manifests/runtime/batch22-oracle-lite-handoff-prep.json",
      "manifests/runtime/docker-oracle-lite-controlled-runtime-proof.json",
      "reports/runtime/docker-oracle-lite-controlled-runtime-proof.json",
      "scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs",
      "scripts/validators/validate-docker-oracle-lite-controlled-runtime.mjs"
    ]
  },
  {
    layer: "FREE-DESTINY-MAP-RUNTIME",
    expected: [
      "manifests/runtime/free-destiny-map-real-web-readiness-gate.json",
      "reports/runtime/free-destiny-map-real-web-readiness-proof.json",
      "scripts/proof/prove-free-destiny-map-real-web-readiness.mjs",
      "scripts/validators/validate-free-destiny-map-real-web-readiness.mjs"
    ]
  }
];

const rows = checks.map((check) => {
  const present = check.expected.filter((path) => fs.existsSync(path));
  const missing = check.expected.filter((path) => !fs.existsSync(path));
  return {
    layer: check.layer,
    expectedCount: check.expected.length,
    presentCount: present.length,
    missingCount: missing.length,
    status:
      missing.length === 0
        ? "validated_or_present_pending_report_review"
        : present.length === 0
          ? "missing"
          : "partial",
    present,
    missing
  };
});

const earliestMissing = rows.find((row) => row.missingCount > 0)?.layer ?? null;

const report = {
  schema: "kingsmen.gap-matrix.repo-reality.v1",
  module: "GAP-MATRIX-01 - Repo Gap Matrix from MASTER-INDEX-01 against actual files",
  passed: true,
  productionReady: false,
  gitRealityOnly: true,
  earliestMissingOrPartialLayer: earliestMissing,
  rows,
  nextAction: earliestMissing === "N00"
    ? "Build N00 - Constitution / Doctrine Lock."
    : "Review earliest missing or partial layer and materialize it before continuing.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/gap-matrix", { recursive: true });
fs.writeFileSync("reports/gap-matrix/gap-matrix-01-repo-reality-latest.json", JSON.stringify(report, null, 2));

fs.mkdirSync("docs/gap-matrix", { recursive: true });
fs.writeFileSync(
  "docs/gap-matrix/GAP_MATRIX_01_REPO_REALITY.md",
  [
    "# GAP-MATRIX-01 — Repo Reality Matrix",
    "",
    "This matrix compares MASTER-INDEX-01 expectations against actual repo files.",
    "",
    `Earliest missing/partial layer: ${earliestMissing ?? "none"}`,
    "",
    ...rows.map((row) => `## ${row.layer}\nStatus: ${row.status}\nPresent: ${row.presentCount}/${row.expectedCount}\nMissing:\n${row.missing.map((m) => `- ${m}`).join("\n") || "- none"}\n`)
  ].join("\n")
);

console.log(JSON.stringify(report, null, 2));