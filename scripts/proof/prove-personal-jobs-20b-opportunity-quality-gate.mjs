import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { classify } from "../agents/personal-job-opportunity-quality-gate.mjs";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-20b-opportunity-quality-gate-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/opportunity-quality-gate.local.json");

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

function writeProof(proof) {
  fs.mkdirSync(path.dirname(proofPath), { recursive: true });
  fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
}

const checks = [];

function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail: String(detail ?? "") });
}

const files = [
  "scripts/agents/personal-job-opportunity-quality-gate.mjs",
  "apps/web/src/app/api/personal-jobs/opportunity-quality-gate/build/route.ts",
  "apps/web/src/app/personal-job-desk/opportunity-quality-gate/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunity-quality-gate/OpportunityQualityGateClient.tsx",
  "packages/contracts/src/personal-jobs-20b-opportunity-quality-gate.ts",
  "docs/personal-jobs/personal-jobs-20b-opportunity-quality-gate.md",
  "manifests/personal-jobs/personal-jobs-20b-opportunity-quality-gate.json",
  "scripts/proof/prove-personal-jobs-20b-opportunity-quality-gate.mjs",
  "scripts/validators/validate-personal-jobs-20b-opportunity-quality-gate.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);

const cases = [
  {
    name: "pnet_search_landing",
    lead: { title: "PNet Search Landing: retail assistant", sourceUrl: "https://www.pnet.co.za/jobs/retail+assistant/in-south-africa", notes: "Search results" },
    expected: "REVIEWABLE_SOURCE_PAGE"
  },
  {
    name: "careers24_search_landing",
    lead: { title: "Careers24 Search Landing: cashier", sourceUrl: "https://www.careers24.com/jobs/lc-south-africa/?q=cashier", notes: "Search results" },
    expected: "REVIEWABLE_SOURCE_PAGE"
  },
  {
    name: "indeed_search_landing",
    lead: { title: "Indeed South Africa Search Landing: general worker", sourceUrl: "https://za.indeed.com/jobs?q=general+worker&l=South+Africa", notes: "Find jobs" },
    expected: "REVIEWABLE_SOURCE_PAGE"
  },
  {
    name: "dpsa_z83",
    lead: { title: "DPSA Z83 Application Form", sourceUrl: "https://www.dpsa.gov.za/dpsa2g/documents/forms/employ.pdf", notes: "Application form" },
    expected: "GOV_SOURCE_DOCUMENT"
  },
  {
    name: "login_wall",
    lead: { title: "Store Login", sourceUrl: "https://apply.shoprite.jobs/login", notes: "login" },
    expected: "MANUAL_SOURCE_REVIEW"
  },
  {
    name: "foreign_low_fit",
    lead: { title: "Cashier", location: "Berlin, Germany", sourceUrl: "https://www.arbeitnow.com/jobs/abc", notes: "Germany" },
    expected: "LOW_PRIORITY_REJECT_CANDIDATE"
  },
  {
    name: "specific_sa_vacancy",
    lead: {
      title: "Cashier - Shoprite Johannesburg",
      company: "Shoprite",
      location: "Johannesburg, Gauteng, South Africa",
      sourceUrl: "https://example.co.za/careers/job/cashier-johannesburg-123",
      notes: "Responsibilities include customer service. Requirements Grade 12. Apply now."
    },
    expected: "READY_FOR_APPLY_PACK"
  }
];

for (const t of cases) {
  const actual = classify(t.lead).state;
  check(`case:${t.name}`, actual === t.expected, `expected ${t.expected}, got ${actual}`);
}

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-opportunity-quality-gate.mjs"], {
  cwd: root,
  encoding: "utf8",
  timeout: 90000,
  maxBuffer: 1024 * 1024 * 20
});

check("agent_exit_zero", run.status === 0, run.stderr || run.stdout);
check("output_written", fs.existsSync(outputPath), outputPath);

let output = null;
try {
  output = JSON.parse(fs.readFileSync(outputPath, "utf8"));
} catch {}

check("output_completed", output?.status === "COMPLETED", output?.status);
check("output_has_leads", Number(output?.total ?? 0) > 0, output?.total);

const invalidReady = Array.isArray(output?.readyForApplyPack)
  ? output.readyForApplyPack.filter((lead) => {
      const blob = `${lead.title} ${lead.company} ${lead.sourceName} ${lead.sourceUrl} ${lead.notes}`.toLowerCase();
      return blob.includes("search landing") || blob.includes("z83") || blob.includes("application form") || blob.includes("/login") || blob.includes("/register") || blob.includes("captcha");
    })
  : [];

check("no_invalid_ready_for_apply_pack", invalidReady.length === 0, `${invalidReady.length} invalid ready leads`);

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-20b-proof.v1",
  module: "PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  output: "data/personal-job-desk/opportunity-quality-gate.local.json",
  summary: output ? {
    total: output.total,
    readyForApplyPackCount: output.readyForApplyPackCount,
    blockedFromApplyPackCount: output.blockedFromApplyPackCount,
    stateCounts: output.stateCounts,
    gateTypeCounts: output.gateTypeCounts
  } : null,
  boundaries: {
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOrCaptcha: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ20B, then test /personal-job-desk/opportunity-quality-gate."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);