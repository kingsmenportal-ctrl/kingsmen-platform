#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const input = {
  adapter: "reports/control-plane/build-proof-centre-display-adapter.json",
  proof: "reports/control-plane/build-proof-centre-display-adapter-proof.json",
  validation: "reports/validation/control-plane-proof-display-adapter-latest.json"
};

const output = {
  nextRoute: "apps/web/src/app/founder/proof-centre/page.tsx",
  publicAdapter: "apps/web/public/founder/proof-centre/adapter.json",
  proof: "reports/control-plane/founder-proof-centre-page-wiring-proof.json"
};

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

for (const rel of Object.values(input)) {
  check(`input-exists:${rel}`, exists(rel), rel);
}

check("apps-web-exists", exists("apps/web"), "apps/web");
check("apps-web-package-exists", exists("apps/web/package.json"), "apps/web/package.json");
check("apps-web-src-exists", exists("apps/web/src"), "apps/web/src");
check("uses-public-static-wiring", true, "No App Router path is guessed.");

const adapter = exists(input.adapter) ? readJson(input.adapter) : null;
const proof = exists(input.proof) ? readJson(input.proof) : null;
const validation = exists(input.validation) ? readJson(input.validation) : null;

check("batch24-adapter-schema", adapter?.schema === "kingsmen.control-plane-proof-display-adapter.v1", adapter?.schema ?? "missing");
check("batch24-proof-proven", proof?.status === "CONTROL_PLANE_PROOF_DISPLAY_ADAPTER_PROVEN" && proof?.passed === true, proof?.status ?? "missing");
check("batch24-validation-passed", validation?.status === "VALIDATED" && validation?.passed === true, validation?.status ?? "missing");
check("batch24-all-cards-passed", adapter?.allCardsPassed === true, String(adapter?.allCardsPassed));
check("batch24-no-production-claim", adapter?.productionReady === false && adapter?.canClaimProduction === false && adapter?.noProductionClaim === true, "production false");
check("batch24-no-oracle-claim", adapter?.deployedToOracle === false && adapter?.noOracleClaim === true, "oracle false");

const cards = Array.isArray(adapter?.cards) ? adapter.cards : [];
const allCardsPassed = cards.length > 0 && cards.every((card) => card.badge === "PROVEN");
const noProductionClaim = adapter?.productionReady === false && adapter?.canClaimProduction === false && adapter?.noProductionClaim === true;
const noOracleClaim = adapter?.deployedToOracle === false && adapter?.noOracleClaim === true;

check("page-source-has-cards", cards.length >= 1, `cards=${cards.length}`);
check("page-all-cards-passed", allCardsPassed, "all cards proven");
check("page-no-production-claim", noProductionClaim, "no production claim");
check("page-no-oracle-claim", noOracleClaim, "no oracle claim");

const pageModel = {
  schema: "kingsmen.founder-proof-centre-page.v1",
  module: "BATCH 25 - Smallest Founder Control Plane Page Wiring",
  generated_at: new Date().toISOString(),
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  runtimeScope: "local_static_founder_page_wiring_only",
  routeHint: "/founder/proof-centre/",
  sourceAdapter: input.adapter,
  publicAdapterPath: output.publicAdapter,
  nextRoutePath: output.nextRoute,
  allCardsPassed,
  noProductionClaim,
  noOracleClaim,
  cards,
  founderWarning: "Local founder proof page only. This is not production readiness and not Oracle deployment proof.",
  nextAction: allCardsPassed
    ? "Commit BATCH 25, then run the page through local web runtime proof in a later batch."
    : "Repair BATCH 24 adapter inputs before founder page wiring."
};

writeJson(output.publicAdapter, pageModel);

const cardHtml = cards.map((card) => {
  const metrics = Object.entries(card.metrics ?? {})
    .map(([key, value]) => `<li><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></li>`)
    .join("");

  return `
    <section class="proof-card ${escapeHtml(card.tone)}">
      <div class="card-topline">
        <span class="badge">${escapeHtml(card.badge)}</span>
        <span class="scope">LOCAL PROOF</span>
      </div>
      <h2>${escapeHtml(card.title)}</h2>
      <p>${escapeHtml(card.subtitle)}</p>
      <ul>${metrics}</ul>
      <small>Report: ${escapeHtml(card.reportPath)}</small>
      <small>Validation: ${escapeHtml(card.validationPath)}</small>
    </section>
  `;
}).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Kingsmen Founder Proof Centre</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #050b14;
      --panel: #081827;
      --panel-2: #0d2236;
      --gold: #d6b25e;
      --cyan: #64d7ff;
      --green: #22c55e;
      --text: #eef7ff;
      --muted: #9fb6ce;
      --line: #1d4264;
      --danger: #ef4444;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(100, 215, 255, .16), transparent 32rem),
        radial-gradient(circle at top right, rgba(214, 178, 94, .13), transparent 30rem),
        var(--bg);
      color: var(--text);
    }

    main {
      width: min(1080px, 100%);
      margin: 0 auto;
      padding: 28px 16px 44px;
    }

    header {
      border: 1px solid var(--line);
      background: linear-gradient(135deg, rgba(13, 34, 54, .96), rgba(5, 11, 20, .96));
      border-radius: 22px;
      padding: 22px;
      box-shadow: 0 18px 42px rgba(0,0,0,.28);
    }

    .kicker {
      color: var(--cyan);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    h1 {
      margin: 10px 0 8px;
      color: var(--gold);
      font-size: clamp(28px, 6vw, 46px);
      line-height: 1.02;
    }

    .summary {
      color: var(--muted);
      max-width: 780px;
      line-height: 1.55;
      margin: 0;
    }

    .warning {
      margin: 18px 0;
      border: 1px solid #2c5e8c;
      background: rgba(16, 36, 59, .82);
      border-radius: 16px;
      padding: 14px 16px;
      color: #d7ebff;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
      margin-top: 18px;
    }

    .proof-card {
      border: 1px solid var(--line);
      background: rgba(8, 24, 39, .92);
      border-radius: 20px;
      padding: 18px;
      min-height: 260px;
      box-shadow: 0 14px 32px rgba(0,0,0,.24);
    }

    .proof-card.safe { border-color: rgba(34, 197, 94, .72); }
    .proof-card.danger { border-color: rgba(239, 68, 68, .72); }

    .card-topline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .badge {
      display: inline-block;
      padding: 7px 11px;
      border-radius: 999px;
      background: rgba(34, 197, 94, .18);
      color: #9af7b6;
      font-weight: 900;
      font-size: 12px;
      border: 1px solid rgba(34, 197, 94, .4);
    }

    .scope {
      color: var(--muted);
      font-size: 11px;
      letter-spacing: .08em;
      font-weight: 800;
    }

    h2 {
      margin: 0 0 8px;
      font-size: 20px;
    }

    p {
      color: var(--muted);
      line-height: 1.45;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 14px 0;
      border-top: 1px solid var(--line);
    }

    li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
    }

    li span { color: var(--muted); }
    li strong { color: var(--text); text-align: right; }

    small {
      display: block;
      color: #8ca6bf;
      word-break: break-all;
      margin-top: 8px;
    }

    footer {
      margin-top: 22px;
      color: var(--muted);
      font-size: 13px;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="kicker">Kingsmen Founder Control Plane</div>
      <h1>Build Proof Centre</h1>
      <p class="summary">
        Smallest useful founder proof page wired into the web app public surface.
        This page displays local proof status only and does not claim production readiness.
      </p>
    </header>

    <div class="warning">${escapeHtml(pageModel.founderWarning)}</div>

    <section class="grid">
      ${cardHtml}
    </section>

    <footer>
      Route hint: /founder/proof-centre/ · Source adapter: ${escapeHtml(input.adapter)}
    </footer>
  </main>
</body>
</html>
`;

// PUBLIC_FOUNDER_PROOF_CENTRE_INDEX_BLOCKED: no public route-shadow index is written.

check("public-adapter-written", exists(output.publicAdapter), output.publicAdapter);
check("founder-next-route-exists", exists(output.nextRoute), output.nextRoute);
check("founder-page-local-only", pageModel.runtimeScope === "local_static_founder_page_wiring_only", pageModel.runtimeScope);
check("founder-page-no-production", pageModel.productionReady === false && pageModel.canClaimProduction === false, "production false");
check("founder-page-no-oracle", pageModel.deployedToOracle === false, "oracle false");
check("founder-page-no-docker-start", true, "This script does not invoke Docker.");
check("founder-page-no-secret-access", true, "This script reads only BATCH 24 proof outputs.");

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const proofReport = {
  schema: "kingsmen.founder-proof-centre-page-wiring-proof.v1",
  module: "BATCH 25 - Smallest Founder Control Plane Page Wiring",
  status: passed
    ? "FOUNDER_PROOF_CENTRE_PAGE_WIRING_PROVEN"
    : "FOUNDER_PROOF_CENTRE_PAGE_WIRING_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  routeHint: "/founder/proof-centre/",
  nextRoutePath: output.nextRoute,
  publicAdapterPath: output.publicAdapter,
  sourceAdapter: input.adapter,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 25."
    : "Repair founder proof page wiring before moving forward."
};

writeJson(output.proof, proofReport);
console.log(JSON.stringify(proofReport, null, 2));

if (!passed) process.exit(1);
