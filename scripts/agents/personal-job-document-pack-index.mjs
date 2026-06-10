import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/public-snapshot.local.json";
const OUTPUT = "data/personal-job-desk/document-pack-index.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-33-document-pack-index-latest.json";

export const PACK_STATUSES = [
  "NEEDS_CANDIDATE_DOCUMENTS",
  "EVIDENCE_ONLY",
  "PACK_READY_FOR_REVIEW",
  "READY_FOR_MANUAL_EXPORT",
  "BLOCKED_NO_EVIDENCE",
  "CLOSED"
];

export const DOCUMENT_TYPES = [
  "CV",
  "ID_COPY",
  "QUALIFICATION_PROOF",
  "COVER_LETTER",
  "REFERENCE_DETAILS",
  "DRIVER_LICENSE",
  "BACKGROUND_CHECK_CONSENT",
  "APPLICATION_EVIDENCE",
  "OTHER"
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

function normalizeText(...parts) {
  return parts.map((p) => s(p).toLowerCase()).join(" ");
}

function roleSignals(item) {
  const text = normalizeText(item.opportunity?.title, item.opportunity?.company, item.opportunity?.location);
  return {
    guardLike: /guard|security|prison|correctional|protection|officer/.test(text),
    drivingLikely: /driver|delivery|code\s?\d|driving|vehicle/.test(text),
    adminLikely: /admin|clerk|reception|office|data/.test(text)
  };
}

function baseDocumentSlots(item) {
  const signals = roleSignals(item);
  const slots = [
    {
      documentType: "CV",
      label: "Truthful CV",
      required: true,
      candidateProvided: false,
      verified: false,
      source: "candidate upload required",
      safeNote: "Do not add invalid experience, invalid references, invalid qualifications, or false reasons for leaving work."
    },
    {
      documentType: "ID_COPY",
      label: "ID copy or identity document",
      required: true,
      candidateProvided: false,
      verified: false,
      source: "candidate upload required",
      safeNote: "Use only the candidate's real identity document."
    },
    {
      documentType: "QUALIFICATION_PROOF",
      label: "Qualification or school certificate proof",
      required: false,
      candidateProvided: false,
      verified: false,
      source: "candidate upload required if the opportunity asks for it",
      safeNote: "Only attach real qualifications already held by the candidate."
    },
    {
      documentType: "COVER_LETTER",
      label: "Role-specific cover letter",
      required: false,
      candidateProvided: false,
      verified: false,
      source: "can be drafted truthfully from candidate-provided facts",
      safeNote: "The cover letter must not invent work history, skills, certificates, or criminal/background status."
    },
    {
      documentType: "REFERENCE_DETAILS",
      label: "Reference details",
      required: false,
      candidateProvided: false,
      verified: false,
      source: "candidate must provide real references if available",
      safeNote: "Do not invent reference names, numbers, titles, or employer details."
    }
  ];

  if (signals.guardLike) {
    slots.push({
      documentType: "BACKGROUND_CHECK_CONSENT",
      label: "Background/check consent readiness",
      required: false,
      candidateProvided: false,
      verified: false,
      source: "candidate/employer process may require truthful consent or screening later",
      safeNote: "Do not claim clearance, no criminal record, firearm competency, PSIRA, or security certification unless proof exists."
    });
  }

  if (signals.drivingLikely) {
    slots.push({
      documentType: "DRIVER_LICENSE",
      label: "Driver's licence proof",
      required: false,
      candidateProvided: false,
      verified: false,
      source: "candidate upload required only if the role asks for driving",
      safeNote: "Only attach a valid real licence if the candidate has one."
    });
  }

  return slots;
}

function evidenceAttachment(item) {
  return {
    attachmentType: "APPLICATION_EVIDENCE",
    label: "Application evidence summary",
    evidenceAvailable: b(item.evidence?.proofAvailable),
    evidenceLevel: s(item.evidence?.evidenceLevel),
    visibility: s(item.evidence?.visibility),
    proofReference: s(item.evidence?.proofReference),
    proofType: s(item.evidence?.proofType),
    auditReference: s(item.evidence?.auditReference),
    redacted: s(item.evidence?.visibility) === "INTERNAL_ONLY_REDACTED",
    attachableNow: b(item.evidence?.proofAvailable) && s(item.evidence?.visibility) !== "INTERNAL_ONLY_REDACTED",
    safeNote: "Evidence is attached only as a safe summary; sensitive proof locations remain hidden."
  };
}

function derivePackStatus(item, slots, evidence) {
  if (item.publicStatus === "CLOSED") return "CLOSED";
  const requiredMissing = slots.filter((slot) => slot.required && !slot.candidateProvided).length;

  if (requiredMissing > 0 && !evidence.evidenceAvailable) return "NEEDS_CANDIDATE_DOCUMENTS";
  if (requiredMissing > 0 && evidence.evidenceAvailable) return "EVIDENCE_ONLY";
  if (requiredMissing === 0 && evidence.evidenceAvailable) return "PACK_READY_FOR_REVIEW";
  if (requiredMissing === 0 && !evidence.evidenceAvailable) return "READY_FOR_MANUAL_EXPORT";
  return "BLOCKED_NO_EVIDENCE";
}

function makePack(item, index) {
  const documentSlots = baseDocumentSlots(item);
  const evidence = evidenceAttachment(item);
  const packStatus = derivePackStatus(item, documentSlots, evidence);

  return {
    documentPackId: `pj33-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-33",
    snapshotItemId: item.snapshotItemId,
    timelineId: item.timelineId,
    advancementId: item.advancementId,
    packId: item.packId,
    packStatus,
    publicStatus: s(item.publicStatus),
    targetStatus: s(item.targetStatus),
    opportunity: item.opportunity || {},
    candidateSummary: s(item.candidateSummary),
    documentSlots,
    evidenceAttachment: evidence,
    readiness: {
      requiredDocumentCount: documentSlots.filter((slot) => slot.required).length,
      requiredMissingCount: documentSlots.filter((slot) => slot.required && !slot.candidateProvided).length,
      optionalDocumentCount: documentSlots.filter((slot) => !slot.required).length,
      verifiedDocumentCount: documentSlots.filter((slot) => slot.verified).length,
      evidenceAvailable: evidence.evidenceAvailable,
      canExportPackNow: packStatus === "PACK_READY_FOR_REVIEW" || packStatus === "READY_FOR_MANUAL_EXPORT"
    },
    candidateInstructions: [
      "Upload only real documents.",
      "Do not invent qualifications, references, employer history, licences, certificates, or clearance.",
      "If a role needs special screening, Kingsmen must wait for real proof or the employer's official process.",
      "Application evidence is attached only when proof exists and is safe to show."
    ],
    safetyBoundary: {
      createsDocuments: false,
      fabricatesDocuments: false,
      exposesSensitiveProof: false,
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      productionClaim: false,
      deployedToOracle: false
    },
    createdAt: now(),
    updatedAt: now()
  };
}

function makeExportIndex(packs, summary) {
  const lines = [];
  lines.push("# Kingsmen Personal Job Desk Document Pack Index");
  lines.push("");
  lines.push(`Generated: ${now()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total packs: ${summary.totalPacks}`);
  lines.push(`- Needs candidate documents: ${summary.needsCandidateDocuments}`);
  lines.push(`- Evidence only: ${summary.evidenceOnly}`);
  lines.push(`- Ready for review: ${summary.packReadyForReview}`);
  lines.push(`- Ready for manual export: ${summary.readyForManualExport}`);
  lines.push("");
  lines.push("## Pack Index");
  lines.push("");

  for (const pack of packs.slice(0, 120)) {
    lines.push(`### ${pack.opportunity?.title || "Untitled opportunity"}`);
    lines.push("");
    lines.push(`- Company: ${pack.opportunity?.company || "Unknown company"}`);
    lines.push(`- Pack status: ${pack.packStatus}`);
    lines.push(`- Required missing: ${pack.readiness.requiredMissingCount}`);
    lines.push(`- Evidence available: ${pack.readiness.evidenceAvailable ? "Yes" : "No"}`);
    lines.push(`- Can export now: ${pack.readiness.canExportPackNow ? "Yes" : "No"}`);
    lines.push("");
  }

  lines.push("## Safety");
  lines.push("");
  lines.push("- No invalid documents are created.");
  lines.push("- No sensitive proof is exposed.");
  lines.push("- No applications are submitted by this index.");
  lines.push("- No employer is contacted by this index.");

  return lines.join("\n");
}

function summarize(packs) {
  const byPackStatus = {};
  const byPublicStatus = {};

  for (const pack of packs) {
    byPackStatus[pack.packStatus] = (byPackStatus[pack.packStatus] || 0) + 1;
    byPublicStatus[pack.publicStatus] = (byPublicStatus[pack.publicStatus] || 0) + 1;
  }

  return {
    totalPacks: packs.length,
    needsCandidateDocuments: packs.filter((x) => x.packStatus === "NEEDS_CANDIDATE_DOCUMENTS").length,
    evidenceOnly: packs.filter((x) => x.packStatus === "EVIDENCE_ONLY").length,
    packReadyForReview: packs.filter((x) => x.packStatus === "PACK_READY_FOR_REVIEW").length,
    readyForManualExport: packs.filter((x) => x.packStatus === "READY_FOR_MANUAL_EXPORT").length,
    blockedNoEvidence: packs.filter((x) => x.packStatus === "BLOCKED_NO_EVIDENCE").length,
    closed: packs.filter((x) => x.packStatus === "CLOSED").length,
    totalRequiredMissing: packs.reduce((sum, pack) => sum + Number(pack.readiness?.requiredMissingCount || 0), 0),
    evidenceAvailable: packs.filter((x) => x.readiness?.evidenceAvailable).length,
    exportableNow: packs.filter((x) => x.readiness?.canExportPackNow).length,
    byPackStatus,
    byPublicStatus
  };
}

export function runDocumentPackIndex() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ32 input: ${INPUT}. Run PJ32 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.snapshotItems)) {
    throw new Error("PJ33 requires PJ32 completed public-snapshot.local.json with snapshotItems array.");
  }

  const documentPacks = input.snapshotItems.map((item, index) => makePack(item, index));
  const summary = summarize(documentPacks);
  const exportIndexMarkdown = makeExportIndex(documentPacks, summary);

  const output = {
    schema: "kingsmen.personal-jobs-33.document-pack-index.v1",
    module: "PERSONAL-JOBS-33",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj32SnapshotItemCount: input.snapshotItems.length,
    documentPackCount: documentPacks.length,
    allowedPackStatuses: PACK_STATUSES,
    allowedDocumentTypes: DOCUMENT_TYPES,
    summary,
    documentPacks,
    exportIndex: {
      format: "markdown",
      filename: "kingsmen-personal-job-document-pack-index.md",
      body: exportIndexMarkdown
    },
    safetyBoundary: {
      createsDocuments: false,
      fabricatesDocuments: false,
      exposesSensitiveProof: false,
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      productionClaim: false,
      deployedToOracle: false
    },
    handoff: {
      nextModule: "PERSONAL-JOBS-34",
      nextPurpose: "Manual application export bundle and operator checklist.",
      onlyAfter: "PJ33 document pack index is proven, validated, committed, and clean."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-33.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    documentPackCount: output.documentPackCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/document-pack-index and review document pack readiness."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runDocumentPackIndex();
  console.log(JSON.stringify({
    status: output.status,
    pj32SnapshotItemCount: output.pj32SnapshotItemCount,
    documentPackCount: output.documentPackCount,
    summary: output.summary
  }, null, 2));
}