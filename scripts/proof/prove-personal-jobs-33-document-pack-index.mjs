import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-33-document-pack-index-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/document-pack-index.local.json");
const inputPath = path.join(root, "data/personal-job-desk/public-snapshot.local.json");

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
  "scripts/agents/personal-job-document-pack-index.mjs",
  "apps/web/src/app/api/personal-jobs/document-pack-index/route.ts",
  "apps/web/src/app/personal-job-desk/document-pack-index/page.tsx",
  "apps/web/src/app/personal-job-desk/document-pack-index/DocumentPackIndexClient.tsx",
  "packages/contracts/src/personal-jobs-33-document-pack-index.ts",
  "docs/personal-jobs/personal-jobs-33-document-pack-index.md",
  "manifests/personal-jobs/personal-jobs-33-document-pack-index.json",
  "scripts/proof/prove-personal-jobs-33-document-pack-index.mjs",
  "scripts/validators/validate-personal-jobs-33-document-pack-index.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj32_input_exists", fs.existsSync(inputPath), "PJ32 public-snapshot.local.json must exist before PJ33.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-document-pack-index.mjs"], {
  cwd: root,
  encoding: "utf8",
  timeout: 90000,
  maxBuffer: 1024 * 1024 * 30
});

check("agent_exit_zero", run.status === 0, run.stderr || run.stdout);
check("output_written", fs.existsSync(outputPath), outputPath);

let input = null;
let output = null;

try { input = JSON.parse(fs.readFileSync(inputPath, "utf8")); } catch {}
try { output = JSON.parse(fs.readFileSync(outputPath, "utf8")); } catch {}

check("input_completed", input?.status === "COMPLETED", input?.status);
check("output_completed", output?.status === "COMPLETED", output?.status);
check("document_packs_created", Number(output?.documentPackCount ?? 0) > 0, output?.documentPackCount);
check("packs_match_pj32_snapshot", output?.documentPackCount === input?.snapshotItemCount, `${output?.documentPackCount} vs ${input?.snapshotItemCount}`);
check("export_index_created", Boolean(output?.exportIndex?.body), output?.exportIndex?.filename);

const packs = Array.isArray(output?.documentPacks) ? output.documentPacks : [];

const missingSections = packs.filter((pack) =>
  !pack.documentPackId ||
  !pack.snapshotItemId ||
  !pack.packId ||
  !pack.packStatus ||
  !pack.opportunity ||
  !Array.isArray(pack.documentSlots) ||
  !pack.evidenceAttachment ||
  !pack.readiness ||
  !Array.isArray(pack.candidateInstructions)
);

check("all_packs_have_required_sections", missingSections.length === 0, `${missingSections.length} packs missing required sections`);

const noRequiredDocs = packs.filter((pack) =>
  !Array.isArray(pack.documentSlots) ||
  pack.documentSlots.filter((slot) => slot.required).length < 2
);

check("required_cv_and_id_slots_exist", noRequiredDocs.length === 0, `${noRequiredDocs.length} packs without required base docs`);

const unsafe = packs.filter((pack) =>
  pack.safetyBoundary?.createsDocuments ||
  pack.safetyBoundary?.fabricatesDocuments ||
  pack.safetyBoundary?.exposesSensitiveProof ||
  pack.safetyBoundary?.sendsApplications ||
  pack.safetyBoundary?.sendsEmail ||
  pack.safetyBoundary?.sendsWhatsApp ||
  pack.safetyBoundary?.sendsSms ||
  pack.safetyBoundary?.contactsEmployers ||
  pack.safetyBoundary?.touchesPayments ||
  pack.safetyBoundary?.bypassesLoginOtpCaptcha
);

check("no_unsafe_pack_actions", unsafe.length === 0, `${unsafe.length} unsafe document packs`);

const invalidLanguage = packs.filter((pack) => {
  const text = JSON.stringify(pack).toLowerCase();
  return text.includes("create invalid") || text.includes("invalid qualification") || text.includes("invented reference");
});

check("no_invalid_document_language", invalidLanguage.length === 0, `${invalidLanguage.length} invalid-document-language packs`);

const badGlobal = output?.safetyBoundary?.createsDocuments ||
  output?.safetyBoundary?.fabricatesDocuments ||
  output?.safetyBoundary?.exposesSensitiveProof ||
  output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.sendsSms ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha;

check("global_safety_boundary_no_send_no_fabrication", !badGlobal, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-33-proof.v1",
  module: "PERSONAL-JOBS-33 - Candidate Document Pack Index / Application Evidence Attachment Map",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/public-snapshot.local.json",
  output: "data/personal-job-desk/document-pack-index.local.json",
  summary: output ? output.summary : null,
  boundaries: {
    createsDocuments: false,
    fabricatesDocuments: false,
    exposesSensitiveProof: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    sendsSms: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ33, then test /personal-job-desk/document-pack-index."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);