import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const PROFILE_PATH = "data/personal-job-desk/personal-candidate.local.json";
const PJ17_PATH = "data/personal-job-desk/discovered-jobs.local.json";
const PJ18_PATH = "data/personal-job-desk/sa-discovered-jobs.local.json";
const PJ19_PATH = "data/personal-job-desk/playwright-source-scout-results.local.json";
const PJ19_HEALTH_PATH = "data/personal-job-desk/sa-source-health.local.json";
const QUEUE_PATH = "data/personal-job-desk/opportunity-command-queue.local.json";
const LATEST_REPORT_PATH = "reports/personal-jobs/personal-jobs-20-opportunity-command-queue-latest.json";

const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const dryRun = args.has("--dry-run");

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(relativePath, value) {
  const target = absolute(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function text(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value === "object") return Object.values(value).map(text).join(" ");
  return String(value);
}

function clean(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function words(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function buildProfileSignals(profile) {
  const profileWords = words(profile);

  const fallbackRoles = [
    "general worker",
    "retail assistant",
    "cashier",
    "packer",
    "stock controller",
    "warehouse assistant",
    "admin assistant",
    "data capturer",
    "customer service",
    "call centre",
    "driver assistant",
    "learnership",
    "internship"
  ];

  const roles = unique([
    ...(Array.isArray(profile?.desiredRoles) ? profile.desiredRoles.map(String) : []),
    ...(Array.isArray(profile?.preferredRoles) ? profile.preferredRoles.map(String) : []),
    ...(Array.isArray(profile?.targetRoles) ? profile.targetRoles.map(String) : []),
    profile?.desiredRole ? String(profile.desiredRole) : "",
    profile?.preferredRole ? String(profile.preferredRole) : "",
    ...fallbackRoles
  ]);

  const skillHints = [
    "admin",
    "retail",
    "cashier",
    "warehouse",
    "driver",
    "sales",
    "customer",
    "service",
    "cleaner",
    "security",
    "call",
    "centre",
    "data",
    "capturer",
    "assistant",
    "learnership",
    "internship",
    "general",
    "worker",
    "store",
    "clerk",
    "receptionist",
    "computer",
    "excel",
    "stock",
    "logistics",
    "merchandiser"
  ];

  const skills = unique([
    ...(Array.isArray(profile?.skills) ? profile.skills.map(String) : []),
    ...(Array.isArray(profile?.targetSkills) ? profile.targetSkills.map(String) : []),
    ...skillHints.filter((hint) => profileWords.includes(hint))
  ]);

  const locations = unique([
    profile?.location,
    profile?.city,
    profile?.province,
    ...(Array.isArray(profile?.locations) ? profile.locations : []),
    ...(Array.isArray(profile?.preferredLocations) ? profile.preferredLocations : []),
    "South Africa"
  ].map((item) => item ? String(item) : ""));

  return {
    roles: roles.slice(0, 24),
    skills: skills.slice(0, 28),
    locations: locations.slice(0, 12)
  };
}

function collectLeads() {
  const pj17 = readJson(PJ17_PATH, { leads: [], pj02CompatibleLeads: [] });
  const pj18 = readJson(PJ18_PATH, { leads: [], pj02CompatibleLeads: [], combinedPj02CompatibleLeads: [] });
  const pj19 = readJson(PJ19_PATH, { leads: [], pj02CompatibleLeads: [], combinedPj02CompatibleLeads: [] });

  const sourceSets = [
    {
      sourceModule: "PERSONAL-JOBS-17",
      leads: [
        ...(Array.isArray(pj17?.leads) ? pj17.leads : []),
        ...(Array.isArray(pj17?.pj02CompatibleLeads) ? pj17.pj02CompatibleLeads : [])
      ]
    },
    {
      sourceModule: "PERSONAL-JOBS-18",
      leads: [
        ...(Array.isArray(pj18?.leads) ? pj18.leads : []),
        ...(Array.isArray(pj18?.pj02CompatibleLeads) ? pj18.pj02CompatibleLeads : [])
      ]
    },
    {
      sourceModule: "PERSONAL-JOBS-19",
      leads: [
        ...(Array.isArray(pj19?.leads) ? pj19.leads : []),
        ...(Array.isArray(pj19?.pj02CompatibleLeads) ? pj19.pj02CompatibleLeads : [])
      ]
    }
  ];

  return sourceSets.flatMap((set) =>
    set.leads.map((lead) => ({
      ...lead,
      sourceModule: lead.source || set.sourceModule
    }))
  );
}

function sourceHealthMap() {
  const health = readJson(PJ19_HEALTH_PATH, { sourceHealth: [] });
  const map = new Map();

  for (const item of Array.isArray(health?.sourceHealth) ? health.sourceHealth : []) {
    if (item.sourceId) map.set(String(item.sourceId), item);
    if (item.sourceLabel) map.set(String(item.sourceLabel), item);
  }

  return map;
}

function normalizeLead(lead) {
  const sourceUrl = clean(lead.sourceUrl || lead.applyUrl || lead.url || "");
  const title = clean(lead.title || lead.position || "Untitled opportunity");
  const company = clean(lead.company || lead.companyName || lead.sourceName || "Unknown employer");
  const location = clean(lead.location || "Not specified");
  const notes = clean(lead.notes || lead.description || "");
  const sourceName = clean(lead.sourceName || lead.sourceLabel || lead.sourceModule || "Unknown source");
  const sourceId = clean(lead.sourceId || lead.sourceName || lead.sourceLabel || lead.sourceModule || "");

  return {
    originalId: clean(lead.id || ""),
    title,
    company,
    location,
    sourceUrl,
    applyUrl: clean(lead.applyUrl || sourceUrl),
    sourceName,
    sourceId,
    sourceModule: clean(lead.sourceModule || lead.source || "UNKNOWN"),
    sourceGroup: clean(lead.sourceGroup || ""),
    sourceConfidence: Number(lead.sourceConfidence ?? 0.5),
    originalFitScore: Number(lead.fitScore ?? 0),
    originalBand: clean(lead.band || ""),
    notes,
    discoveredAt: clean(lead.discoveredAt || ""),
    status: clean(lead.status || "")
  };
}

function isSouthAfricanLead(lead) {
  const blob = [
    lead.location,
    lead.company,
    lead.sourceName,
    lead.sourceGroup,
    lead.sourceModule,
    lead.notes,
    lead.sourceUrl
  ].join(" ").toLowerCase();

  if (lead.sourceModule === "PERSONAL-JOBS-18" || lead.sourceModule === "PERSONAL-JOBS-19") return true;

  return /south africa|gauteng|kwazulu|kzn|western cape|eastern cape|limpopo|mpumalanga|free state|north west|northern cape|benoni|johannesburg|pretoria|durban|cape town|polokwane|nelspruit|bloemfontein|shoprite|checkers|dis-chem|dischem|clicks|pick n pay|boxer|dpsa/.test(blob);
}

function isForeignLowValue(lead) {
  const blob = `${lead.location} ${lead.sourceUrl} ${lead.notes}`.toLowerCase();

  const foreignSignal = /germany|berlin|munich|stuttgart|hamburg|united states|usa|canada|brazil|mexico|são paulo|sao paulo|india|bhiwadi|cologne|nuremberg|frankfurt|london|portland|dallas|phoenix|chicago|california|texas|new york/.test(blob);
  const remote = /remote|work from home|wfh/.test(blob);

  return foreignSignal && !isSouthAfricanLead(lead) && !remote;
}

function hasApplySource(lead) {
  return Boolean(lead.sourceUrl || lead.applyUrl);
}

function hasBlocker(lead, healthLookup) {
  const keyCandidates = [lead.sourceId, lead.sourceName].filter(Boolean);
  const health = keyCandidates.map((key) => healthLookup.get(key)).find(Boolean);

  if (!health) return false;

  return ["BLOCKED_BY_LOGIN", "BLOCKED_BY_CAPTCHA", "PORTAL_DOWN", "TIMEOUT"].includes(health.status);
}

function healthStatus(lead, healthLookup) {
  const keyCandidates = [lead.sourceId, lead.sourceName].filter(Boolean);
  const health = keyCandidates.map((key) => healthLookup.get(key)).find(Boolean);
  return health?.status || null;
}

function readinessScore(lead, signals, healthLookup) {
  const haystack = [
    lead.title,
    lead.company,
    lead.location,
    lead.notes,
    lead.sourceName,
    lead.sourceGroup
  ].join(" ").toLowerCase();

  let score = 20;

  if (Number.isFinite(lead.originalFitScore)) score += Math.round(lead.originalFitScore * 0.45);
  if (isSouthAfricanLead(lead)) score += 20;
  if (hasApplySource(lead)) score += 10;
  if (lead.sourceModule === "PERSONAL-JOBS-19") score += 8;
  if (lead.sourceModule === "PERSONAL-JOBS-18") score += 6;
  if (lead.sourceConfidence) score += Math.round(lead.sourceConfidence * 8);

  for (const role of signals.roles) {
    if (haystack.includes(role.toLowerCase())) score += 6;
  }

  for (const skill of signals.skills) {
    if (haystack.includes(skill.toLowerCase())) score += 3;
  }

  for (const location of signals.locations) {
    if (location && haystack.includes(location.toLowerCase())) score += 4;
  }

  if (/learnership|internship|graduate|trainee/.test(haystack)) score += 8;
  if (/retail|cashier|assistant|general worker|warehouse|admin|data capturer|customer service|call centre|driver/.test(haystack)) score += 7;

  if (isForeignLowValue(lead)) score -= 28;
  if (hasBlocker(lead, healthLookup)) score -= 20;
  if (!hasApplySource(lead)) score -= 16;

  return Math.max(0, Math.min(100, score));
}

function readinessState(lead, score, healthLookup) {
  const health = healthStatus(lead, healthLookup);

  if (health === "BLOCKED_BY_LOGIN" || health === "BLOCKED_BY_CAPTCHA" || health === "PORTAL_DOWN" || health === "TIMEOUT") {
    return "NEEDS_MANUAL_SOURCE_REVIEW";
  }

  if (!hasApplySource(lead)) {
    return "NEEDS_MANUAL_SOURCE_REVIEW";
  }

  if (isForeignLowValue(lead) && score < 60) {
    return "LOW_PRIORITY_REJECT_CANDIDATE";
  }

  if (score >= 72 && isSouthAfricanLead(lead)) {
    return "READY_FOR_APPLY_PACK";
  }

  if (score >= 58 && isSouthAfricanLead(lead)) {
    return "REVIEWABLE_SA_ROUTE";
  }

  if (score >= 45) {
    return "WATCHLIST";
  }

  return "LOW_PRIORITY_REJECT_CANDIDATE";
}

function priorityBand(score) {
  if (score >= 82) return "CROWN_FIRST";
  if (score >= 72) return "APPLY_PACK_READY";
  if (score >= 58) return "REVIEW_THIS_SESSION";
  if (score >= 45) return "WATCHLIST";
  return "LOW_PRIORITY";
}

function reasonsFor(lead, score, state, healthLookup) {
  const reasons = [];

  if (isSouthAfricanLead(lead)) reasons.push("South African/local source signal.");
  else reasons.push("Not confirmed as South African/local.");

  if (lead.sourceModule === "PERSONAL-JOBS-19") reasons.push("Found by Playwright browser scout.");
  if (lead.sourceModule === "PERSONAL-JOBS-18") reasons.push("Found by South African source runner.");
  if (lead.originalFitScore) reasons.push(`Original fit score ${lead.originalFitScore}.`);
  if (hasApplySource(lead)) reasons.push("Has reviewable source/apply URL.");
  else reasons.push("Missing source/apply URL.");

  const health = healthStatus(lead, healthLookup);
  if (health) reasons.push(`Source health: ${health}.`);
  if (isForeignLowValue(lead)) reasons.push("Foreign/non-local signal reduced priority.");
  if (state === "READY_FOR_APPLY_PACK") reasons.push("Ready for CV/motivation apply-pack preparation after human approval.");
  if (state === "NEEDS_MANUAL_SOURCE_REVIEW") reasons.push("Manual source review required before use.");

  reasons.push(`Readiness score ${score}/100.`);

  return reasons;
}

function nextActionFor(state) {
  if (state === "READY_FOR_APPLY_PACK") return "Select this opportunity and prepare an apply pack.";
  if (state === "REVIEWABLE_SA_ROUTE") return "Review source, confirm requirements, then move to apply pack if suitable.";
  if (state === "WATCHLIST") return "Keep in watchlist unless stronger opportunities are exhausted.";
  if (state === "NEEDS_MANUAL_SOURCE_REVIEW") return "Open source manually and verify whether the opportunity is real and accessible.";
  return "Do not spend time unless the candidate specifically wants this route.";
}

function toQueueItem(lead, signals, healthLookup) {
  const normalized = normalizeLead(lead);
  const score = readinessScore(normalized, signals, healthLookup);
  const state = readinessState(normalized, score, healthLookup);

  return {
    queueId: slug([
      normalized.sourceModule,
      normalized.title,
      normalized.company,
      normalized.location,
      normalized.sourceUrl
    ].join("|")),
    source: "PERSONAL-JOBS-20",
    sourceModule: normalized.sourceModule,
    title: normalized.title,
    company: normalized.company,
    location: normalized.location,
    sourceUrl: normalized.sourceUrl,
    applyUrl: normalized.applyUrl,
    sourceName: normalized.sourceName,
    sourceId: normalized.sourceId,
    sourceGroup: normalized.sourceGroup,
    sourceConfidence: normalized.sourceConfidence,
    originalFitScore: normalized.originalFitScore,
    readinessScore: score,
    readinessState: state,
    priorityBand: priorityBand(score),
    countryFocus: isSouthAfricanLead(normalized) ? "South Africa" : "Unconfirmed/International",
    sourceHealth: healthStatus(normalized, healthLookup),
    reasons: reasonsFor(normalized, score, state, healthLookup),
    nextAction: nextActionFor(state),
    manualApprovalRequired: true,
    selectedForApplyPack: false,
    sendsApplications: false,
    contactsEmployers: false,
    discoveredAt: normalized.discoveredAt,
    queuedAt: new Date().toISOString(),
    notes: normalized.notes.slice(0, 1400)
  };
}

function dedupeQueue(items) {
  const seen = new Map();

  for (const item of items) {
    const key = item.sourceUrl
      ? `url:${item.sourceUrl.toLowerCase()}`
      : `text:${item.title.toLowerCase()}|${item.company.toLowerCase()}|${item.location.toLowerCase()}`;

    const existing = seen.get(key);
    if (!existing || item.readinessScore > existing.readinessScore) seen.set(key, item);
  }

  return [...seen.values()].sort((a, b) => b.readinessScore - a.readinessScore);
}

function stateCounts(items) {
  const counts = {};
  for (const item of items) {
    counts[item.readinessState] = (counts[item.readinessState] || 0) + 1;
  }
  return counts;
}

function buildApplyPackCandidates(queue) {
  return queue
    .filter((item) => item.readinessState === "READY_FOR_APPLY_PACK" || item.readinessState === "REVIEWABLE_SA_ROUTE")
    .slice(0, 40)
    .map((item) => ({
      source: "PERSONAL-JOBS-20",
      queueId: item.queueId,
      title: item.title,
      company: item.company,
      location: item.location,
      sourceUrl: item.sourceUrl,
      applyUrl: item.applyUrl,
      readinessScore: item.readinessScore,
      readinessState: item.readinessState,
      priorityBand: item.priorityBand,
      reasons: item.reasons,
      nextAction: item.nextAction,
      manualApprovalRequired: true
    }));
}

async function main() {
  const profile = readJson(PROFILE_PATH, {});
  const signals = buildProfileSignals(profile);
  const healthLookup = sourceHealthMap();

  const rawLeads = collectLeads();
  const queue = dedupeQueue(rawLeads.map((lead) => toQueueItem(lead, signals, healthLookup)));
  const applyPackCandidates = buildApplyPackCandidates(queue);

  const result = {
    schema: "kingsmen.personal-jobs-20.opportunity-command-queue.v1",
    status: "COMPLETED",
    generatedAt: new Date().toISOString(),
    usedOneProfile: true,
    reads: {
      profile: PROFILE_PATH,
      pj17: PJ17_PATH,
      pj18: PJ18_PATH,
      pj19: PJ19_PATH,
      pj19Health: PJ19_HEALTH_PATH
    },
    rawLeadCount: rawLeads.length,
    queueCount: queue.length,
    applyPackCandidateCount: applyPackCandidates.length,
    stateCounts: stateCounts(queue),
    queue,
    applyPackCandidates,
    boundaries: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      touchesPayments: false,
      contactsEmployers: false,
      bypassesLoginOrCaptcha: false,
      requiresHumanApprovalBeforeApply: true
    }
  };

  if (!dryRun) {
    writeJson(QUEUE_PATH, result);
  }

  writeJson(LATEST_REPORT_PATH, {
    ...result,
    queue: queue.slice(0, 25),
    applyPackCandidates: applyPackCandidates.slice(0, 25)
  });

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("PERSONAL-JOBS-20 COMPLETED");
    console.log(`Raw leads: ${rawLeads.length}`);
    console.log(`Queue: ${queue.length}`);
    console.log(`Apply-pack candidates: ${applyPackCandidates.length}`);
  }
}

main().catch((error) => {
  const failed = {
    schema: "kingsmen.personal-jobs-20.opportunity-command-queue.v1",
    status: "FAILED",
    generatedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    boundaries: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      touchesPayments: false,
      contactsEmployers: false,
      bypassesLoginOrCaptcha: false
    }
  };

  writeJson(LATEST_REPORT_PATH, failed);
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
});