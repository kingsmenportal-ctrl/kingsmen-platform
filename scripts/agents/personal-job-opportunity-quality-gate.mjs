import fs from "node:fs";
import path from "node:path";

const INPUT = "data/personal-job-desk/opportunity-command-queue.local.json";
const OUTPUT = "data/personal-job-desk/opportunity-quality-gate.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-20b-opportunity-quality-gate-latest.json";

const STATES = {
  READY_FOR_APPLY_PACK: "READY_FOR_APPLY_PACK",
  REVIEWABLE_SOURCE_PAGE: "REVIEWABLE_SOURCE_PAGE",
  GOV_SOURCE_DOCUMENT: "GOV_SOURCE_DOCUMENT",
  MANUAL_SOURCE_REVIEW: "MANUAL_SOURCE_REVIEW",
  LOW_PRIORITY_REJECT_CANDIDATE: "LOW_PRIORITY_REJECT_CANDIDATE",
  EXPIRED_OR_DEAD_LEAD: "EXPIRED_OR_DEAD_LEAD"
};

function abs(p) {
  return path.join(process.cwd(), p);
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

function low(v) {
  return s(v).toLowerCase();
}

function host(url) {
  try {
    return new URL(s(url)).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function pathq(url) {
  try {
    const u = new URL(s(url));
    return `${u.pathname}${u.search}`.toLowerCase();
  } catch {
    return low(url);
  }
}

function any(blob, terms) {
  const b = low(blob);
  return terms.some((term) => b.includes(term));
}

function normalize(raw) {
  const sourceUrl = s(raw.sourceUrl || raw.applyUrl || raw.url || raw.link || raw.href);
  return {
    ...raw,
    title: s(raw.title || raw.jobTitle || raw.name || raw.role || "Untitled lead"),
    company: s(raw.company || raw.employer || raw.organization || raw.sourceName || "Unknown company"),
    location: s(raw.location || raw.city || raw.province || raw.region || "Unknown location"),
    sourceUrl,
    applyUrl: s(raw.applyUrl || sourceUrl),
    notes: s(raw.notes || raw.description || raw.snippet || raw.summary || raw.body),
    sourceModule: s(raw.sourceModule || raw.source || "UNKNOWN"),
    sourceName: s(raw.sourceName || raw.sourceLabel || raw.company || "Unknown source"),
    sourceHealth: raw.sourceHealth ?? null,
    originalReadinessState: s(raw.readinessState || raw.status || raw.state)
  };
}

const SA = [
  "south africa", "gauteng", "johannesburg", "pretoria", "durban", "kwazulu", "kzn",
  "cape town", "western cape", "eastern cape", "free state", "limpopo", "mpumalanga",
  "north west", "northern cape", "bloemfontein", "polokwane", "mbombela", "nelspruit",
  "rustenburg", "pietermaritzburg", "kimberley", "centurion", "midrand", "sandton"
];

const FOREIGN = [
  "germany", "berlin", "munich", "stuttgart", "hamburg", "nuremberg", "frankfurt",
  "united kingdom", "london", "usa", "united states", "canada", "india", "australia",
  "new zealand", "ireland", "netherlands", "dubai"
];

function isSearchLanding(lead) {
  const blob = `${lead.title} ${lead.company} ${lead.sourceName} ${lead.sourceUrl} ${lead.notes}`;
  const h = host(lead.sourceUrl);
  const pq = pathq(lead.sourceUrl);

  if (low(lead.title).includes("search landing")) return true;
  if (low(lead.company).includes("search landing")) return true;
  if (low(lead.sourceName).includes("search landing")) return true;

  if (
    h.includes("pnet.co.za") ||
    h.includes("careers24.com") ||
    h.includes("indeed.com") ||
    h.includes("za.indeed.com") ||
    h.includes("careerjet.co.za") ||
    h.includes("adzuna.co.za") ||
    h.includes("jobmail.co.za")
  ) {
    if (
      pq.includes("q=") ||
      pq.includes("keyword=") ||
      pq.includes("query=") ||
      pq.includes("/jobs/") && pq.includes("in-south-africa") ||
      pq.includes("/jobs/lc-") ||
      pq.includes("/jobs?")
    ) return true;
  }

  return any(blob, [
    "search results",
    "find jobs",
    "browse jobs",
    "latest jobs",
    "jobs in south africa",
    "job search"
  ]);
}

function isGovDoc(lead) {
  const blob = `${lead.title} ${lead.company} ${lead.sourceName} ${lead.sourceUrl} ${lead.notes}`;
  const h = host(lead.sourceUrl);
  const u = low(lead.sourceUrl);

  if (h.includes("dpsa.gov.za")) return true;
  if (h.endsWith("gov.za") && any(blob, ["z83", "circular", "application form", "public service vacancy"])) return true;
  if (/\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i.test(u) && any(blob, ["z83", "circular", "application form", "public service"])) return true;

  return any(blob, [
    "dpsa vacancy circular",
    "public service vacancy circular",
    "z83 application",
    "z83 form",
    "application form",
    "year programme 2025",
    "year programme 2026"
  ]);
}

function isManualBlocked(lead) {
  const blob = `${lead.title} ${lead.company} ${lead.sourceName} ${lead.sourceUrl} ${lead.notes} ${lead.sourceHealth}`;
  const u = low(lead.sourceUrl);

  if (u.includes("/login") || u.includes("/register") || u.includes("signin") || u.includes("sign-in")) return true;
  if (["BLOCKED_BY_LOGIN", "BLOCKED_BY_CAPTCHA", "PORTAL_DOWN", "TIMEOUT"].includes(s(lead.sourceHealth))) return true;

  return any(blob, [
    "captcha",
    "verify you are human",
    "access denied",
    "login required",
    "sign in to view",
    "please login",
    "otp",
    "authentication required"
  ]);
}

function isForeignLowFit(lead) {
  const blob = `${lead.title} ${lead.location} ${lead.company} ${lead.sourceName} ${lead.sourceUrl} ${lead.notes}`;
  const h = host(lead.sourceUrl);
  const hasSA = any(blob, SA) || h.endsWith(".za") || lead.sourceModule === "PERSONAL-JOBS-18" || lead.sourceModule === "PERSONAL-JOBS-19";
  const hasForeign = any(blob, FOREIGN) || h.includes("arbeitnow.com");
  return hasForeign && !hasSA;
}

function isGenericTitle(title) {
  const t = low(title).replace(/[-–—|:]/g, " ").replace(/\s+/g, " ").trim();
  if (!t || t.length < 7) return true;
  return [
    "jobs",
    "vacancies",
    "cashier",
    "cashier jobs",
    "retail assistant",
    "retail assistant jobs",
    "general worker",
    "general worker jobs",
    "driver jobs",
    "cleaner jobs",
    "learnerships",
    "internships"
  ].includes(t);
}

function detailSignals(lead) {
  const blob = low(`${lead.title} ${lead.company} ${lead.location} ${lead.notes}`);
  return [
    "requirements",
    "responsibilities",
    "duties",
    "closing date",
    "apply",
    "apply now",
    "salary",
    "permanent",
    "contract",
    "full time",
    "part time",
    "grade",
    "matric",
    "experience",
    "qualification",
    "minimum",
    "benefits"
  ].filter((x) => blob.includes(x));
}

function isSpecificVacancy(lead) {
  const pq = pathq(lead.sourceUrl);
  const specificUrl =
    pq.includes("/job/") ||
    pq.includes("/jobs/view/") ||
    pq.includes("/jobs/detail/") ||
    pq.includes("/vacancy/") ||
    pq.includes("/careers/job/") ||
    pq.includes("/position/") ||
    pq.includes("/requisition/") ||
    pq.includes("/posting/");

  const hasCompany = s(lead.company).length > 1 && !low(lead.company).includes("search landing");
  const hasDetails = detailSignals(lead).length >= 1;
  const titleSpecific = !isGenericTitle(lead.title);

  return (specificUrl || hasCompany) && titleSpecific && hasDetails;
}

function score(lead) {
  let points = 0;
  const reasons = [];

  if (any(`${lead.location} ${lead.sourceUrl} ${lead.notes}`, SA) || host(lead.sourceUrl).endsWith(".za")) {
    points += 15;
    reasons.push("south_africa_signal");
  }

  if (!isGenericTitle(lead.title)) {
    points += 20;
    reasons.push("specific_title");
  }

  if (s(lead.company).length > 1 && !low(lead.company).includes("search landing")) {
    points += 15;
    reasons.push("company_present");
  }

  const details = detailSignals(lead);
  if (details.length >= 2) {
    points += 25;
    reasons.push(`job_detail_signals:${details.slice(0, 4).join(",")}`);
  } else if (details.length === 1) {
    points += 10;
    reasons.push(`weak_job_detail_signal:${details[0]}`);
  }

  if (lead.applyUrl || lead.sourceUrl) {
    points += 10;
    reasons.push("url_present");
  }

  if (isSearchLanding(lead)) {
    points -= 70;
    reasons.push("demote_search_landing");
  }

  if (isGovDoc(lead)) {
    points -= 70;
    reasons.push("demote_gov_source_document");
  }

  if (isManualBlocked(lead)) {
    points -= 70;
    reasons.push("manual_blocked_or_login_wall");
  }

  if (isForeignLowFit(lead)) {
    points -= 60;
    reasons.push("foreign_low_fit");
  }

  return {
    qualityScore: Math.max(0, Math.min(100, points)),
    reasons
  };
}

export function classify(raw, index = 0) {
  const lead = normalize(raw);
  const quality = score(lead);

  let state = STATES.REVIEWABLE_SOURCE_PAGE;
  let gateType = "INSUFFICIENT_SPECIFICITY";
  let action = "Review or enrich before apply-pack generation.";

  if (!lead.sourceUrl) {
    state = STATES.MANUAL_SOURCE_REVIEW;
    gateType = "MISSING_URL";
    action = "Manual review required because no source URL exists.";
  } else if (isManualBlocked(lead)) {
    state = STATES.MANUAL_SOURCE_REVIEW;
    gateType = "BLOCKED_OR_LOGIN_WALL";
    action = "Manual review only. Do not bypass login, OTP, CAPTCHA, or portal controls.";
  } else if (isGovDoc(lead)) {
    state = STATES.GOV_SOURCE_DOCUMENT;
    gateType = "GOV_SOURCE_DOCUMENT";
    action = "Use as source evidence only. Extract specific vacancies before apply-pack generation.";
  } else if (isForeignLowFit(lead)) {
    state = STATES.LOW_PRIORITY_REJECT_CANDIDATE;
    gateType = "FOREIGN_LOW_FIT";
    action = "Reject for the current South African job campaign unless explicitly requested.";
  } else if (isSearchLanding(lead)) {
    state = STATES.REVIEWABLE_SOURCE_PAGE;
    gateType = "SEARCH_LANDING_PAGE";
    action = "Keep as source route only. Extract child vacancy pages before apply-pack generation.";
  } else if (quality.qualityScore >= 55 && isSpecificVacancy(lead)) {
    state = STATES.READY_FOR_APPLY_PACK;
    gateType = "SPECIFIC_VACANCY";
    action = "Eligible for apply-pack preparation only. Still no auto-apply.";
  }

  return {
    ...lead,
    state,
    readinessState: state,
    selectedForApplyPack: false,
    manualApprovalRequired: true,
    sendsApplications: false,
    contactsEmployers: false,
    pj20b: {
      module: "PERSONAL-JOBS-20B",
      inputIndex: index,
      gateType,
      qualityScore: quality.qualityScore,
      reasons: quality.reasons,
      action,
      previousState: lead.originalReadinessState || null,
      safety: {
        autoApply: false,
        emailSending: false,
        whatsappSending: false,
        employerContact: false,
        paymentTouching: false,
        loginCaptchaBypass: false,
        productionClaim: false
      }
    }
  };
}

function extractLeads(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.queue)) return payload.queue;
  if (Array.isArray(payload.leads)) return payload.leads;
  if (Array.isArray(payload.applyPackCandidates)) return payload.applyPackCandidates;
  throw new Error("PJ20B could not find queue/leads/applyPackCandidates in PJ20 output.");
}

function counts(leads) {
  const out = {};
  for (const lead of leads) out[lead.state] = (out[lead.state] || 0) + 1;
  return out;
}

function gateCounts(leads) {
  const out = {};
  for (const lead of leads) {
    const k = lead.pj20b?.gateType || "UNKNOWN";
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export function runGate() {
  if (!fs.existsSync(abs(INPUT))) {
    throw new Error(`Missing PJ20 input: ${INPUT}. Run PJ20 first.`);
  }

  const input = readJson(INPUT);
  const sourceLeads = extractLeads(input);
  const leads = sourceLeads.map((lead, index) => classify(lead, index));

  const stateCounts = counts(leads);
  const gateTypeCounts = gateCounts(leads);
  const ready = leads.filter((lead) => lead.state === STATES.READY_FOR_APPLY_PACK);

  const output = {
    schema: "kingsmen.personal-jobs-20b.quality-gate.v1",
    module: "PERSONAL-JOBS-20B",
    status: "COMPLETED",
    generatedAt: new Date().toISOString(),
    inputPath: INPUT,
    total: leads.length,
    readyForApplyPackCount: ready.length,
    blockedFromApplyPackCount: leads.length - ready.length,
    stateCounts,
    gateTypeCounts,
    leads,
    readyForApplyPack: ready,
    reviewableSourcePages: leads.filter((lead) => lead.state === STATES.REVIEWABLE_SOURCE_PAGE),
    governmentSourceDocuments: leads.filter((lead) => lead.state === STATES.GOV_SOURCE_DOCUMENT),
    manualSourceReview: leads.filter((lead) => lead.state === STATES.MANUAL_SOURCE_REVIEW),
    lowPriorityRejects: leads.filter((lead) => lead.state === STATES.LOW_PRIORITY_REJECT_CANDIDATE),
    safetyBoundary: {
      autoApply: false,
      emailSending: false,
      whatsappSending: false,
      employerContact: false,
      paymentTouching: false,
      loginCaptchaBypass: false,
      productionClaim: false
    },
    handoff: {
      applyPackBuilderMustRead: OUTPUT,
      applyPackAllowedOnlyWhen: "lead.state === READY_FOR_APPLY_PACK"
    }
  };

  writeJson(OUTPUT, output);

  const latest = {
    schema: "kingsmen.personal-jobs-20b.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    total: output.total,
    readyForApplyPackCount: output.readyForApplyPackCount,
    blockedFromApplyPackCount: output.blockedFromApplyPackCount,
    stateCounts,
    gateTypeCounts,
    safetyBoundary: output.safetyBoundary,
    handoff: output.handoff
  };

  writeJson(LATEST, latest);

  return output;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const output = runGate();
  console.log(JSON.stringify({
    status: output.status,
    total: output.total,
    readyForApplyPackCount: output.readyForApplyPackCount,
    blockedFromApplyPackCount: output.blockedFromApplyPackCount,
    stateCounts: output.stateCounts,
    gateTypeCounts: output.gateTypeCounts
  }, null, 2));
}