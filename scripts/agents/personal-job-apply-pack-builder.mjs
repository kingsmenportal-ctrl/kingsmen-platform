import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/opportunity-quality-gate.local.json";
const PROFILE = "data/personal-job-desk/one-profile.local.json";
const OUTPUT = "data/personal-job-desk/application-packs.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-21-apply-pack-builder-latest.json";

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

function list(v) {
  if (Array.isArray(v)) return v.map(s).filter(Boolean);
  return s(v).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
}

function words(v) {
  return s(v)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((x) => x.length >= 3);
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function safeName(v) {
  return s(v).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "lead";
}

function extractReadyLeads(payload) {
  if (Array.isArray(payload?.readyForApplyPack)) return payload.readyForApplyPack;
  if (Array.isArray(payload?.leads)) {
    return payload.leads.filter((lead) => lead.state === "READY_FOR_APPLY_PACK" || lead.readinessState === "READY_FOR_APPLY_PACK");
  }
  throw new Error("PJ21 could not find PJ20B readyForApplyPack leads. Run PJ20B first.");
}

function readProfile() {
  if (!exists(PROFILE)) {
    return {
      profileStatus: "MISSING",
      fullName: "",
      email: "",
      phone: "",
      location: "",
      targetRoles: [],
      skills: [],
      education: "",
      experienceSummary: "",
      cvText: "",
      truthBoundary: "No candidate profile saved yet."
    };
  }

  const p = readJson(PROFILE);
  return {
    profileStatus: "SAVED",
    fullName: s(p.fullName),
    email: s(p.email),
    phone: s(p.phone),
    location: s(p.location),
    targetRoles: list(p.targetRoles),
    skills: list(p.skills),
    education: s(p.education),
    experienceSummary: s(p.experienceSummary),
    cvText: s(p.cvText),
    truthBoundary: "Use only saved candidate facts. Do not invent experience, qualifications, references, or certificates."
  };
}

function profileCompleteness(profile) {
  const checks = {
    hasName: Boolean(profile.fullName),
    hasContact: Boolean(profile.email || profile.phone),
    hasLocation: Boolean(profile.location),
    hasCareerDirection: profile.targetRoles.length > 0 || profile.skills.length > 0,
    hasSubstance: Boolean(profile.cvText || profile.experienceSummary || profile.education || profile.skills.length > 0)
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    checks,
    score,
    completeEnoughForDrafts: score >= 4,
    completeEnoughForFinalReview: checks.hasName && checks.hasContact && checks.hasCareerDirection && checks.hasSubstance
  };
}

function fitScore(profile, lead) {
  const leadText = `${lead.title} ${lead.company} ${lead.location} ${lead.notes}`.toLowerCase();
  const profileTerms = uniq([...profile.targetRoles, ...profile.skills].flatMap(words));
  const matches = profileTerms.filter((term) => leadText.includes(term));
  const base = Number(lead.pj20b?.qualityScore ?? 55);
  const boost = Math.min(25, matches.length * 5);
  return {
    score: Math.max(0, Math.min(100, base + boost)),
    matchedTerms: matches.slice(0, 10)
  };
}

function makeCvFocus(profile, lead, fit) {
  const skills = profile.skills.length ? profile.skills.slice(0, 8) : ["Add verified skills from your CV before sending."];
  const role = s(lead.title);

  return [
    `Target the CV headline toward: ${role}.`,
    `Keep experience truthful and align it to ${s(lead.company) || "the employer"} without inventing duties.`,
    `Highlight these verified skills where relevant: ${skills.join(", ")}.`,
    fit.matchedTerms.length
      ? `Matched profile signals found in the vacancy/source: ${fit.matchedTerms.join(", ")}.`
      : "No strong profile-to-vacancy skill match was detected yet; review the saved profile and CV text.",
    "Remove unrelated clutter, keep contact details visible, and keep the final CV ATS-readable."
  ];
}

function makeMotivation(profile, lead, completeness, fit) {
  const name = profile.fullName || "[Your full name]";
  const company = s(lead.company) || "the recruitment team";
  const title = s(lead.title) || "the advertised role";
  const location = s(lead.location) || "South Africa";
  const skills = profile.skills.length ? profile.skills.slice(0, 5).join(", ") : "[add your verified skills]";
  const experience = profile.experienceSummary || profile.education || "[add your truthful experience, education, or training background]";

  const warning = completeness.completeEnoughForFinalReview
    ? ""
    : "Important: this draft still needs your missing profile details before it can be treated as final.\n\n";

  return `${warning}Dear ${company} Recruitment Team,

I am writing to apply for the ${title} opportunity in ${location}. My name is ${name}, and I am interested in this role because it matches my current job search direction and the information available from the source listing.

My relevant background includes ${experience}. The skills I can truthfully present for this application include ${skills}. I am willing to follow the employer's official application process, provide the required documents, and attend interviews or assessments where required.

For this application, Kingsmen has flagged the opportunity as a specific vacancy with a quality score of ${fit.score}/100. I understand that this does not guarantee employment, selection, or interview placement. It only means the source looks specific enough to prepare an application pack for human review.

Kind regards,
${name}`;
}

function makeManualSteps(lead) {
  return [
    "Open the official source link and confirm the vacancy is still open.",
    "Confirm closing date, role title, location, requirements, and application method.",
    "Review the tailored CV focus points and motivation draft before sending anything.",
    "Attach only truthful and relevant documents requested by the employer.",
    "Submit only through the employer's official channel.",
    "Capture proof: screenshot, confirmation email, reference number, or sent-email copy.",
    "Update Kingsmen outcome ledger after submission, interview, rejection, offer, or no response."
  ];
}

function makePack(profile, completeness, lead, index) {
  const fit = fitScore(profile, lead);
  const packId = `pj21-${String(index + 1).padStart(4, "0")}-${safeName(lead.company)}-${safeName(lead.title)}`;

  const status = completeness.completeEnoughForFinalReview
    ? "READY_FOR_HUMAN_REVIEW"
    : "NEEDS_PROFILE_COMPLETION";

  return {
    packId,
    module: "PERSONAL-JOBS-21",
    status,
    candidateDataStatus: completeness.completeEnoughForFinalReview ? "PROFILE_READY" : "PROFILE_INCOMPLETE",
    lead: {
      title: s(lead.title),
      company: s(lead.company),
      location: s(lead.location),
      sourceUrl: s(lead.sourceUrl || lead.applyUrl),
      applyUrl: s(lead.applyUrl || lead.sourceUrl),
      pj20bGateType: s(lead.pj20b?.gateType),
      pj20bQualityScore: Number(lead.pj20b?.qualityScore ?? 0)
    },
    fit,
    cvFocus: makeCvFocus(profile, lead, fit),
    motivationDraft: makeMotivation(profile, lead, completeness, fit),
    manualApplySteps: makeManualSteps(lead),
    proofToCapture: [
      "Official source URL",
      "Vacancy title and company",
      "Closing date if visible",
      "Submitted application confirmation or sent email",
      "Reference number if issued",
      "Screenshot or PDF evidence"
    ],
    reviewWarnings: [
      "Do not send automatically.",
      "Do not invent experience, references, certificates, qualifications, salary history, or skills.",
      "Do not bypass login, OTP, CAPTCHA, or employer portal controls.",
      "Do not contact employer until candidate approves the final pack."
    ],
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOrCaptcha: false,
      productionClaim: false
    },
    createdAt: new Date().toISOString()
  };
}

export function runApplyPackBuilder() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ20B input: ${INPUT}. Run PJ20B first.`);
  }

  const input = readJson(INPUT);
  const readyLeads = extractReadyLeads(input);
  const profile = readProfile();
  const completeness = profileCompleteness(profile);

  const packs = readyLeads.map((lead, index) => makePack(profile, completeness, lead, index));

  const output = {
    schema: "kingsmen.personal-jobs-21.apply-pack-builder.v1",
    module: "PERSONAL-JOBS-21",
    status: "COMPLETED",
    generatedAt: new Date().toISOString(),
    inputPath: INPUT,
    profilePath: PROFILE,
    outputPath: OUTPUT,
    totalReadyLeadsFromPJ20B: readyLeads.length,
    applicationPackCount: packs.length,
    readyForHumanReviewCount: packs.filter((p) => p.status === "READY_FOR_HUMAN_REVIEW").length,
    needsProfileCompletionCount: packs.filter((p) => p.status === "NEEDS_PROFILE_COMPLETION").length,
    profileCompleteness: completeness,
    profile: {
      profileStatus: profile.profileStatus,
      fullName: profile.fullName,
      emailPresent: Boolean(profile.email),
      phonePresent: Boolean(profile.phone),
      location: profile.location,
      targetRoles: profile.targetRoles,
      skills: profile.skills,
      educationPresent: Boolean(profile.education),
      experienceSummaryPresent: Boolean(profile.experienceSummary),
      cvTextPresent: Boolean(profile.cvText)
    },
    packs,
    handoff: {
      nextModule: "PERSONAL-JOBS-22",
      nextPurpose: "Human review selector, proof capture, and outcome ledger handoff.",
      applyAllowedOnlyAfter: "candidate/founder approval of a specific pack"
    },
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOrCaptcha: false,
      productionClaim: false
    }
  };

  writeJson(OUTPUT, output);

  const latest = {
    schema: "kingsmen.personal-jobs-21.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    totalReadyLeadsFromPJ20B: output.totalReadyLeadsFromPJ20B,
    applicationPackCount: output.applicationPackCount,
    readyForHumanReviewCount: output.readyForHumanReviewCount,
    needsProfileCompletionCount: output.needsProfileCompletionCount,
    outputPath: OUTPUT,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/apply-pack-builder, save one profile, then rebuild packs."
  };

  writeJson(LATEST, latest);
  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runApplyPackBuilder();
  console.log(JSON.stringify({
    status: output.status,
    totalReadyLeadsFromPJ20B: output.totalReadyLeadsFromPJ20B,
    applicationPackCount: output.applicationPackCount,
    readyForHumanReviewCount: output.readyForHumanReviewCount,
    needsProfileCompletionCount: output.needsProfileCompletionCount
  }, null, 2));
}