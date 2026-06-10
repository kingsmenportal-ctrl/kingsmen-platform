import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/readiness-priority-queue.local.json";
const OUTPUT = "data/personal-job-desk/daily-worklist.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-28-daily-worklist-latest.json";

export const WORKLIST_STATUSES = [
  "QUEUED",
  "TODAY",
  "IN_PROGRESS",
  "WAITING_PROOF",
  "WAITING_CANDIDATE",
  "WAITING_FOUNDER",
  "DONE",
  "CLOSED"
];

export const WORK_SLOTS = [
  "MORNING_REVIEW",
  "MIDDAY_EXECUTION",
  "AFTERNOON_PROOF",
  "END_OF_DAY_DIGEST",
  "WAITING"
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readExisting() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByQueueId(existing) {
  const map = new Map();
  const items = Array.isArray(existing?.worklistItems) ? existing.worklistItems : [];
  for (const item of items) {
    if (item?.queueId) map.set(item.queueId, item);
  }
  return map;
}

function deriveWorklistStatus(queueItem, existing) {
  const saved = s(existing?.worklistStatus);
  if (WORKLIST_STATUSES.includes(saved) && saved !== "QUEUED") return saved;

  if (queueItem.queueStatus === "CLOSED") return "CLOSED";
  if (queueItem.queueStatus === "PROOF_CAPTURE_REQUIRED") return "WAITING_PROOF";
  if (queueItem.queueStatus === "CANDIDATE_RESPONSE_REQUIRED") return "WAITING_CANDIDATE";
  if (queueItem.priorityBand === "P0_URGENT" || queueItem.priorityBand === "P1_HIGH") return "TODAY";
  if (queueItem.queueStatus === "READY_FOR_MANUAL_SUBMISSION") return "TODAY";
  if (queueItem.queueStatus === "FOLLOW_UP_DUE") return "TODAY";
  if (queueItem.queueStatus === "OUTCOME_REVIEW_REQUIRED") return "TODAY";
  if (queueItem.queueStatus === "BLOCKED_REVIEW_REQUIRED") return "WAITING_FOUNDER";

  return "QUEUED";
}

function deriveSlot(queueItem, worklistStatus) {
  if (worklistStatus === "CLOSED" || worklistStatus === "DONE") return "WAITING";
  if (worklistStatus === "WAITING_FOUNDER") return "MORNING_REVIEW";
  if (worklistStatus === "WAITING_PROOF") return "AFTERNOON_PROOF";
  if (worklistStatus === "WAITING_CANDIDATE") return "END_OF_DAY_DIGEST";
  if (queueItem.queueStatus === "READY_FOR_MANUAL_SUBMISSION") return "MIDDAY_EXECUTION";
  if (queueItem.queueStatus === "FOLLOW_UP_DUE") return "AFTERNOON_PROOF";
  if (queueItem.queueStatus === "OUTCOME_REVIEW_REQUIRED") return "MORNING_REVIEW";
  return "MORNING_REVIEW";
}

function effort(queueItem) {
  if (queueItem.queueStatus === "READY_FOR_MANUAL_SUBMISSION") return 25;
  if (queueItem.queueStatus === "PROOF_CAPTURE_REQUIRED") return 15;
  if (queueItem.queueStatus === "FOLLOW_UP_DUE") return 10;
  if (queueItem.queueStatus === "OUTCOME_REVIEW_REQUIRED") return 12;
  if (queueItem.queueStatus === "CANDIDATE_RESPONSE_REQUIRED") return 8;
  if (queueItem.queueStatus === "BLOCKED_REVIEW_REQUIRED") return 6;
  return 5;
}

function founderAttention(queueItem) {
  if (queueItem.queueStatus === "BLOCKED_REVIEW_REQUIRED") return true;
  if (queueItem.priorityBand === "P0_URGENT") return true;
  if (queueItem.actionPacket?.blockedReason) return true;
  return false;
}

function makeItem(queueItem, existing, index) {
  const worklistStatus = deriveWorklistStatus(queueItem, existing);
  const slot = deriveSlot(queueItem, worklistStatus);

  return {
    worklistId: existing?.worklistId || `pj28-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-28",
    queueId: queueItem.queueId,
    workflowId: queueItem.workflowId,
    threadId: queueItem.threadId,
    trackerId: queueItem.trackerId,
    packId: queueItem.packId,
    workDate: existing?.workDate || todayKey(),
    workSlot: s(existing?.workSlot) || slot,
    worklistStatus,
    priorityBand: queueItem.priorityBand,
    priorityScore: queueItem.priorityScore,
    estimatedMinutes: effort(queueItem),
    assignedTo: s(existing?.assignedTo || queueItem.assignedTo),
    founderAttentionRequired: founderAttention(queueItem),
    candidateHarmRisk: queueItem.queueStatus === "FOLLOW_UP_DUE" || queueItem.queueStatus === "PROOF_CAPTURE_REQUIRED",
    context: queueItem.context || {},
    actionPacket: queueItem.actionPacket || {},
    readinessGate: queueItem.readinessGate || {},
    operatorProgress: {
      startedAt: s(existing?.operatorProgress?.startedAt),
      completedAt: s(existing?.operatorProgress?.completedAt),
      proofReference: s(existing?.operatorProgress?.proofReference),
      blockerNote: s(existing?.operatorProgress?.blockerNote),
      completionNote: s(existing?.operatorProgress?.completionNote)
    },
    founderDecision: {
      decision: s(existing?.founderDecision?.decision),
      decidedBy: s(existing?.founderDecision?.decidedBy),
      decidedAt: s(existing?.founderDecision?.decidedAt),
      decisionNote: s(existing?.founderDecision?.decisionNote)
    },
    safetyBoundary: {
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
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
}

function digest(items, inputSummary) {
  const active = items.filter((x) => !["DONE", "CLOSED"].includes(x.worklistStatus));
  const founderItems = active.filter((x) => x.founderAttentionRequired);
  const harmRisk = active.filter((x) => x.candidateHarmRisk);
  const todays = active.filter((x) => x.worklistStatus === "TODAY" || x.workSlot !== "WAITING");

  const actionPackets = active
    .slice()
    .sort((a, b) => b.priorityScore - a.priorityScore || a.worklistId.localeCompare(b.worklistId))
    .slice(0, 12)
    .map((item) => ({
      worklistId: item.worklistId,
      queueId: item.queueId,
      priorityBand: item.priorityBand,
      priorityScore: item.priorityScore,
      opportunity: item.context?.opportunity || {},
      actionTitle: item.actionPacket?.actionTitle || "Review",
      operatorAction: item.actionPacket?.operatorAction || "",
      requiredProof: item.actionPacket?.requiredProof || "",
      founderAttentionRequired: item.founderAttentionRequired,
      candidateHarmRisk: item.candidateHarmRisk
    }));

  return {
    digestId: `pj28-digest-${todayKey()}`,
    generatedAt: now(),
    inputQueueSummary: inputSummary || {},
    dailyLoad: {
      activeItems: active.length,
      todayItems: todays.length,
      founderAttentionItems: founderItems.length,
      candidateHarmRiskItems: harmRisk.length,
      estimatedMinutes: active.reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0)
    },
    founderSummary: {
      headline: founderItems.length > 0
        ? `${founderItems.length} items need founder/operator review before movement.`
        : "No founder-blocking item found.",
      blockers: founderItems.slice(0, 10).map((item) => ({
        worklistId: item.worklistId,
        queueStatus: item.context?.candidateStatus || item.worklistStatus,
        opportunity: item.context?.opportunity || {},
        blockedReason: item.actionPacket?.blockedReason || "Review required."
      }))
    },
    actionPackets,
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      productionClaim: false,
      deployedToOracle: false
    }
  };
}

function summarize(items) {
  const byWorklistStatus = {};
  const byWorkSlot = {};
  const byPriorityBand = {};

  for (const item of items) {
    byWorklistStatus[item.worklistStatus] = (byWorklistStatus[item.worklistStatus] || 0) + 1;
    byWorkSlot[item.workSlot] = (byWorkSlot[item.workSlot] || 0) + 1;
    byPriorityBand[item.priorityBand] = (byPriorityBand[item.priorityBand] || 0) + 1;
  }

  return {
    totalItems: items.length,
    today: items.filter((x) => x.worklistStatus === "TODAY").length,
    inProgress: items.filter((x) => x.worklistStatus === "IN_PROGRESS").length,
    waitingProof: items.filter((x) => x.worklistStatus === "WAITING_PROOF").length,
    waitingCandidate: items.filter((x) => x.worklistStatus === "WAITING_CANDIDATE").length,
    waitingFounder: items.filter((x) => x.worklistStatus === "WAITING_FOUNDER").length,
    done: items.filter((x) => x.worklistStatus === "DONE").length,
    closed: items.filter((x) => x.worklistStatus === "CLOSED").length,
    founderAttentionRequired: items.filter((x) => x.founderAttentionRequired).length,
    candidateHarmRisk: items.filter((x) => x.candidateHarmRisk).length,
    estimatedMinutes: items.filter((x) => !["DONE", "CLOSED"].includes(x.worklistStatus)).reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0),
    byWorklistStatus,
    byWorkSlot,
    byPriorityBand
  };
}

export function runDailyWorklist() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ27 input: ${INPUT}. Run PJ27 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.queueItems)) {
    throw new Error("PJ28 requires PJ27 completed readiness-priority-queue.local.json with queueItems array.");
  }

  const existing = readExisting();
  const existingMap = existingByQueueId(existing);

  const worklistItems = input.queueItems.map((item, index) => makeItem(item, existingMap.get(item.queueId), index));
  const summary = summarize(worklistItems);
  const founderDigest = digest(worklistItems, input.summary);

  const output = {
    schema: "kingsmen.personal-jobs-28.daily-worklist.v1",
    module: "PERSONAL-JOBS-28",
    status: "COMPLETED",
    generatedAt: now(),
    workDate: todayKey(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj27QueueItemCount: input.queueItems.length,
    worklistItemCount: worklistItems.length,
    allowedWorklistStatuses: WORKLIST_STATUSES,
    allowedWorkSlots: WORK_SLOTS,
    summary,
    founderDigest,
    worklistItems,
    safetyBoundary: {
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
      nextModule: "PERSONAL-JOBS-29",
      nextPurpose: "Proof review board and status advancement control.",
      onlyAfter: "PJ28 daily worklist is proven, validated, committed, and clean."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-28.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    worklistItemCount: output.worklistItemCount,
    summary,
    founderDigest: {
      digestId: founderDigest.digestId,
      dailyLoad: founderDigest.dailyLoad,
      headline: founderDigest.founderSummary.headline,
      actionPacketCount: founderDigest.actionPackets.length
    },
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/daily-worklist and process the founder/operator digest."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runDailyWorklist();
  console.log(JSON.stringify({
    status: output.status,
    pj27QueueItemCount: output.pj27QueueItemCount,
    worklistItemCount: output.worklistItemCount,
    summary: output.summary,
    founderDigest: {
      dailyLoad: output.founderDigest.dailyLoad,
      actionPacketCount: output.founderDigest.actionPackets.length
    }
  }, null, 2));
}