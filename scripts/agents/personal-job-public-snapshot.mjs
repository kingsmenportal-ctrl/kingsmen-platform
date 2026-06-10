import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/status-timeline.local.json";
const OUTPUT = "data/personal-job-desk/public-snapshot.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-32-public-snapshot-latest.json";

export const SNAPSHOT_VISIBILITY = [
  "CANDIDATE_SAFE",
  "INTERNAL_ONLY_REDACTED",
  "NO_PROOF_AVAILABLE",
  "AUDIT_SUMMARY_ONLY"
];

function abs(p) {
  return path.join(process.cwd(), p);
}

function exists(p) {
  return fs.existsSync(abs(p));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(abs(p), "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(abs(p)), { recursive: true });
  fs.writeFileSync(abs(p), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function s(v) {
  return String(v ?? "").trim();
}

function b(v) {
  return Boolean(v);
}

function now() {
  return new Date().toISOString();
}

function visibilityFor(item) {
  if (item.evidence?.proofIsSensitive) return "INTERNAL_ONLY_REDACTED";
  if (item.evidenceLevel === "NO_EVIDENCE") return "NO_PROOF_AVAILABLE";
  if (item.evidenceLevel === "AUDIT_RECORDED") return "AUDIT_SUMMARY_ONLY";
  return "CANDIDATE_SAFE";
}

function safeEvidence(item) {
  const visibility = visibilityFor(item);

  return {
    visibility,
    evidenceLevel: s(item.evidenceLevel),
    proofAvailable: Boolean(item.evidence?.proofReference),
    proofType: item.evidence?.proofIsSensitive ? "redacted" : s(item.evidence?.proofType),
    proofReference: item.evidence?.proofIsSensitive ? "" : s(item.evidence?.proofReference),
    proofLocation: "",
    auditReference: s(item.evidence?.auditReference),
    auditRecordedAt: s(item.evidence?.auditRecordedAt),
    candidateVisible: Boolean(item.evidence?.proofVisibleToCandidate && !item.evidence?.proofIsSensitive),
    redactionReason: item.evidence?.proofIsSensitive
      ? "Proof is marked sensitive/internal and is not exposed in the candidate-safe snapshot."
      : ""
  };
}

function safeProgress(steps) {
  if (!Array.isArray(steps)) return [];
  return steps.map((step) => ({
    key: s(step.key),
    label: s(step.label),
    state: s(step.state),
    evidenceBacked: Boolean(step.evidenceBacked)
  }));
}

function makeSnapshotItem(item, index) {
  const evidence = safeEvidence(item);

  return {
    snapshotItemId: `pj32-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-32",
    timelineId: item.timelineId,
    advancementId: item.advancementId,
    packId: item.packId,
    publicStatus: s(item.timelineStatus),
    targetStatus: s(item.targetStatus),
    candidateSummary: s(item.candidateSummary),
    opportunity: {
      title: s(item.opportunity?.title),
      company: s(item.opportunity?.company),
      location: s(item.opportunity?.location)
    },
    progressSteps: safeProgress(item.progressSteps),
    evidence,
    candidateMessage: {
      approved: b(item.candidateMessage?.approved),
      sentManually: b(item.candidateMessage?.sentManually),
      message: b(item.candidateMessage?.approved) ? s(item.candidateMessage?.draft) : "",
      manualSendProofAvailable: Boolean(item.candidateMessage?.manualSendProof)
    },
    candidateSafeRules: [
      "This snapshot does not guarantee employment, interview, offer, or employer response.",
      "Sensitive proof is redacted.",
      "Only summary-level evidence is shown.",
      "No employer is contacted by this snapshot.",
      "No application is submitted by this snapshot."
    ],
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      autoMutatesApplicationTracker: false,
      autoMutatesProofBoard: false,
      exposesSensitiveProof: false,
      productionClaim: false,
      deployedToOracle: false
    },
    createdAt: now(),
    updatedAt: now()
  };
}

function makeReport(snapshotItems, summary) {
  const lines = [];
  lines.push("# Kingsmen Personal Job Desk Progress Snapshot");
  lines.push("");
  lines.push(`Generated: ${now()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total applications tracked: ${summary.totalItems}`);
  lines.push(`- Awaiting proof: ${summary.awaitingProof}`);
  lines.push(`- Awaiting approval: ${summary.awaitingApproval}`);
  lines.push(`- Ready for audit record: ${summary.readyForAuditRecord}`);
  lines.push(`- Audit recorded: ${summary.auditRecorded}`);
  lines.push(`- Proof-backed: ${summary.proofBacked}`);
  lines.push("");
  lines.push("## Applications");
  lines.push("");

  for (const item of snapshotItems.slice(0, 120)) {
    lines.push(`### ${item.opportunity.title || "Untitled opportunity"}`);
    lines.push("");
    lines.push(`- Company: ${item.opportunity.company || "Unknown company"}`);
    lines.push(`- Location: ${item.opportunity.location || "Unknown location"}`);
    lines.push(`- Status: ${item.publicStatus}`);
    lines.push(`- Target status: ${item.targetStatus}`);
    lines.push(`- Evidence: ${item.evidence.evidenceLevel}`);
    lines.push(`- Summary: ${item.candidateSummary}`);
    lines.push("");
  }

  lines.push("## Safety");
  lines.push("");
  lines.push("- This report is a candidate-safe snapshot.");
  lines.push("- It does not guarantee employment, interview, offer, funding, or response.");
  lines.push("- It does not submit applications or contact employers.");
  lines.push("- Sensitive proof remains redacted.");

  return lines.join("\n");
}

function summarize(items) {
  const byPublicStatus = {};
  const byEvidenceLevel = {};
  const byVisibility = {};

  for (const item of items) {
    byPublicStatus[item.publicStatus] = (byPublicStatus[item.publicStatus] || 0) + 1;
    byEvidenceLevel[item.evidence.evidenceLevel] = (byEvidenceLevel[item.evidence.evidenceLevel] || 0) + 1;
    byVisibility[item.evidence.visibility] = (byVisibility[item.evidence.visibility] || 0) + 1;
  }

  return {
    totalItems: items.length,
    awaitingProof: items.filter((x) => x.publicStatus === "AWAITING_PROOF").length,
    awaitingApproval: items.filter((x) => x.publicStatus === "AWAITING_APPROVAL").length,
    readyForAuditRecord: items.filter((x) => x.publicStatus === "READY_FOR_AUDIT_RECORD").length,
    auditRecorded: items.filter((x) => x.publicStatus === "AUDIT_RECORDED").length,
    rejected: items.filter((x) => x.publicStatus === "REJECTED").length,
    blocked: items.filter((x) => x.publicStatus === "BLOCKED").length,
    closed: items.filter((x) => x.publicStatus === "CLOSED").length,
    proofBacked: items.filter((x) => ["PROOF_BACKED", "CANDIDATE_VISIBLE_SUMMARY", "AUDIT_RECORDED"].includes(x.evidence.evidenceLevel)).length,
    candidateVisibleMessages: items.filter((x) => x.candidateMessage.approved).length,
    redactedProofItems: items.filter((x) => x.evidence.visibility === "INTERNAL_ONLY_REDACTED").length,
    byPublicStatus,
    byEvidenceLevel,
    byVisibility
  };
}

export function runPublicSnapshot() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ31 input: ${INPUT}. Run PJ31 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.timelineItems)) {
    throw new Error("PJ32 requires PJ31 completed status-timeline.local.json with timelineItems array.");
  }

  const snapshotItems = input.timelineItems.map((item, index) => makeSnapshotItem(item, index));
  const summary = summarize(snapshotItems);
  const exportReportMarkdown = makeReport(snapshotItems, summary);

  const output = {
    schema: "kingsmen.personal-jobs-32.public-snapshot.v1",
    module: "PERSONAL-JOBS-32",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj31TimelineItemCount: input.timelineItems.length,
    snapshotItemCount: snapshotItems.length,
    allowedSnapshotVisibility: SNAPSHOT_VISIBILITY,
    summary,
    snapshotItems,
    exportReport: {
      format: "markdown",
      filename: "kingsmen-personal-job-desk-progress-snapshot.md",
      body: exportReportMarkdown
    },
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      autoMutatesApplicationTracker: false,
      autoMutatesProofBoard: false,
      exposesSensitiveProof: false,
      productionClaim: false,
      deployedToOracle: false
    },
    handoff: {
      nextModule: "PERSONAL-JOBS-33",
      nextPurpose: "Candidate document pack index and application evidence attachment map.",
      onlyAfter: "PJ32 public snapshot is proven, validated, committed, and clean."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-32.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    snapshotItemCount: output.snapshotItemCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/public-snapshot and export the candidate-safe progress report."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runPublicSnapshot();
  console.log(JSON.stringify({
    status: output.status,
    pj31TimelineItemCount: output.pj31TimelineItemCount,
    snapshotItemCount: output.snapshotItemCount,
    summary: output.summary
  }, null, 2));
}