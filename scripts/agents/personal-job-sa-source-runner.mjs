import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const PROFILE_PATH = "data/personal-job-desk/personal-candidate.local.json";
const SA_SOURCE_LOCAL_PATH = "data/personal-job-desk/sa-job-sources.local.json";
const SA_SOURCE_EXAMPLE_PATH = "data/personal-job-desk/sa-job-sources.local.example.json";
const SA_DISCOVERED_PATH = "data/personal-job-desk/sa-discovered-jobs.local.json";
const SA_RUNS_PATH = "data/personal-job-desk/sa-source-runs.local.json";
const PJ17_DISCOVERED_PATH = "data/personal-job-desk/discovered-jobs.local.json";
const PJ18_LATEST_REPORT = "reports/personal-jobs/personal-jobs-18-sa-source-runner-latest.json";

const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const dryRun = args.has("--dry-run");
const networkOff = args.has("--no-network");

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

function ensureSaSources() {
  const local = absolute(SA_SOURCE_LOCAL_PATH);
  const example = absolute(SA_SOURCE_EXAMPLE_PATH);

  if (!fs.existsSync(local) && fs.existsSync(example)) {
    fs.copyFileSync(example, local);
  }
}

function text(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value === "object") return Object.values(value).map(text).join(" ");
  return String(value);
}

function cleanHtml(value) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}

function buildProfileSignals(profile) {
  const blob = text(profile);
  const profileWords = words(blob);

  const defaultSaRoles = [
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

  const roles = unique([
    ...(Array.isArray(profile?.desiredRoles) ? profile.desiredRoles.map(String) : []),
    ...(Array.isArray(profile?.preferredRoles) ? profile.preferredRoles.map(String) : []),
    ...(Array.isArray(profile?.targetRoles) ? profile.targetRoles.map(String) : []),
    ...(profile?.desiredRole ? [String(profile.desiredRole)] : []),
    ...(profile?.preferredRole ? [String(profile.preferredRole)] : []),
    ...defaultSaRoles
  ]);

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

  const sectors = unique([
    ...(Array.isArray(profile?.sectors) ? profile.sectors.map(String) : []),
    ...(Array.isArray(profile?.preferredSectors) ? profile.preferredSectors.map(String) : []),
    "retail",
    "admin",
    "logistics",
    "learnership",
    "public service"
  ]);

  return {
    roles: roles.slice(0, 20),
    skills: skills.slice(0, 20),
    locations: locations.slice(0, 10),
    sectors: sectors.slice(0, 12),
    profileWordCount: profileWords.length
  };
}

function buildSaQueries(signals) {
  const queries = [];

  for (const role of signals.roles.slice(0, 12)) {
    queries.push(role);
    queries.push(`${role} South Africa`);
  }

  for (const location of signals.locations.slice(0, 4)) {
    if (location.toLowerCase() !== "south africa") {
      for (const role of signals.roles.slice(0, 5)) {
        queries.push(`${role} ${location}`);
      }
    }
  }

  for (const sector of signals.sectors.slice(0, 8)) {
    queries.push(`${sector} jobs South Africa`);
  }

  return unique(queries.map((item) => item.toLowerCase())).slice(0, 35);
}

function scoreSaLead(lead, signals) {
  const haystack = [
    lead.title,
    lead.company,
    lead.location,
    lead.notes,
    lead.sourceGroup,
    lead.sourceLabel
  ].join(" ").toLowerCase();

  let score = 25;

  for (const role of signals.roles) {
    if (haystack.includes(role.toLowerCase())) score += 12;
  }

  for (const skill of signals.skills) {
    if (haystack.includes(skill.toLowerCase())) score += 7;
  }

  for (const location of signals.locations) {
    if (location && haystack.includes(location.toLowerCase())) score += 8;
  }

  if (haystack.includes("south africa")) score += 10;
  if (haystack.includes("learnership")) score += 10;
  if (haystack.includes("internship")) score += 8;
  if (haystack.includes("retail")) score += 6;
  if (haystack.includes("cashier") || haystack.includes("general worker") || haystack.includes("assistant")) score += 8;

  score += Math.round(Number(lead.sourceConfidence ?? 0.5) * 10);

  return Math.max(0, Math.min(100, score));
}

function band(score) {
  if (score >= 80) return "CROWN_TARGET";
  if (score >= 65) return "STRONG_ROUTE";
  if (score >= 45) return "WATCHLIST";
  return "RESEARCH_FIRST";
}

function normalizeLead(input, source, signals) {
  const title = String(input.title || "South African opportunity source").trim();
  const company = String(input.company || source.company || source.label || "Unknown employer").trim();
  const location = String(input.location || source.defaultLocation || "South Africa").trim();
  const applyUrl = String(input.applyUrl || input.sourceUrl || source.url || "").trim();
  const notes = cleanHtml(input.notes || input.description || input.text || "");

  const lead = {
    id: "",
    source: "PERSONAL-JOBS-18",
    title,
    company,
    location,
    sourceUrl: applyUrl,
    applyUrl,
    sourceName: source.label,
    sourceLabel: source.label,
    sourceId: source.id,
    sourceGroup: source.group,
    sourceAdapter: source.adapter,
    sourceConfidence: source.sourceConfidence ?? 0.55,
    fitScore: 0,
    band: "RESEARCH_FIRST",
    notes: notes.slice(0, 1600),
    status: "SA_DISCOVERED_PENDING_REVIEW",
    discoveredAt: new Date().toISOString(),
    manualApprovalRequired: true,
    sendsApplications: false,
    contactsEmployers: false,
    countryFocus: "South Africa"
  };

  lead.fitScore = scoreSaLead(lead, signals);
  lead.band = band(lead.fitScore);
  lead.id = slug([lead.sourceId, lead.title, lead.company, lead.location, lead.applyUrl].join("|"));

  return lead;
}

function dedupeLeads(leads) {
  const seen = new Map();

  for (const lead of leads) {
    const key = lead.applyUrl
      ? `url:${lead.applyUrl.toLowerCase()}`
      : `text:${lead.title.toLowerCase()}|${lead.company.toLowerCase()}|${lead.location.toLowerCase()}`;

    const existing = seen.get(key);
    if (!existing || lead.fitScore > existing.fitScore) seen.set(key, lead);
  }

  return [...seen.values()].sort((a, b) => b.fitScore - a.fitScore);
}

async function fetchText(url, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
        "user-agent": "Kingsmen-Personal-Jobs-18-SA-Source-Runner"
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function absolutizeUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html))) {
    const href = absolutizeUrl(baseUrl, match[1]);
    const label = cleanHtml(match[2]);

    if (!href || !label) continue;

    links.push({
      href,
      label
    });
  }

  return links;
}

function isJobLikeLink(link) {
  const blob = `${link.href} ${link.label}`.toLowerCase();

  return /job|jobs|career|careers|vacanc|learnership|internship|graduate|trainee|apply|position|recruit|opportunit|post/.test(blob);
}

async function publicCareersPageAdapter(source, signals) {
  const html = await fetchText(source.url);
  const links = extractLinks(html, source.url).filter(isJobLikeLink).slice(0, 40);

  if (links.length === 0) {
    return [
      normalizeLead({
        title: `${source.label} - careers page requires manual review`,
        company: source.company || source.label,
        location: source.defaultLocation || "South Africa",
        applyUrl: source.url,
        notes: "Kingsmen reached the public careers page but did not extract clear job links from static HTML. This may be a JavaScript-rendered careers portal. Use Playwright scout or manual review."
      }, source, signals)
    ];
  }

  return links.map((link) =>
    normalizeLead({
      title: link.label,
      company: source.company || source.label,
      location: source.defaultLocation || "South Africa",
      applyUrl: link.href,
      notes: `Extracted from ${source.label} public careers page. Human review required before applying.`
    }, source, signals)
  );
}

async function dpsaLandingAdapter(source, signals) {
  const html = await fetchText(source.url);
  const links = extractLinks(html, source.url)
    .filter((link) => /circular|vacanc|pdf|public service|psvc/i.test(`${link.href} ${link.label}`))
    .slice(0, 30);

  if (links.length === 0) {
    return [
      normalizeLead({
        title: "DPSA vacancy circular page - manual review required",
        company: "Department of Public Service and Administration",
        location: "South Africa",
        applyUrl: source.url,
        notes: "Kingsmen reached the DPSA public vacancy circular landing page but did not extract circular links from static HTML. Manual review required."
      }, source, signals)
    ];
  }

  return links.map((link) =>
    normalizeLead({
      title: link.label.includes("Circular") ? link.label : `DPSA Vacancy Circular - ${link.label}`,
      company: "Department of Public Service and Administration",
      location: "South Africa",
      applyUrl: link.href,
      notes: "Public sector vacancy circular source. Candidate must review department requirements and closing date before applying."
    }, source, signals)
  );
}

async function searchLandingAdapter(source, signals, queries) {
  return queries.slice(0, 10).map((query) => {
    const encoded = encodeURIComponent(query).replace(/%20/g, "+");
    const url = String(source.urlTemplate).replace("{query}", encoded);

    return normalizeLead({
      title: `${source.label}: ${query}`,
      company: source.label,
      location: source.defaultLocation || "South Africa",
      applyUrl: url,
      notes: "Search landing generated from one candidate profile. This is a reviewable search route, not an auto-submitted application."
    }, source, signals);
  });
}

async function runSource(source, signals, queries) {
  if (!source.enabled) {
    return {
      sourceId: source.id,
      sourceLabel: source.label,
      skipped: true,
      failed: false,
      reason: "disabled",
      leadCount: 0,
      leads: []
    };
  }

  if (dryRun || networkOff) {
    return {
      sourceId: source.id,
      sourceLabel: source.label,
      skipped: true,
      failed: false,
      reason: dryRun ? "dry-run" : "network disabled",
      leadCount: 0,
      leads: []
    };
  }

  try {
    let leads = [];

    if (source.adapter === "publicCareersPage") {
      leads = await publicCareersPageAdapter(source, signals);
    } else if (source.adapter === "dpsaLanding") {
      leads = await dpsaLandingAdapter(source, signals);
    } else if (source.adapter === "searchLanding") {
      leads = await searchLandingAdapter(source, signals, queries);
    } else {
      return {
        sourceId: source.id,
        sourceLabel: source.label,
        skipped: true,
        failed: false,
        reason: `unknown adapter ${source.adapter}`,
        leadCount: 0,
        leads: []
      };
    }

    return {
      sourceId: source.id,
      sourceLabel: source.label,
      skipped: false,
      failed: false,
      reason: null,
      leadCount: leads.length,
      leads
    };
  } catch (error) {
    return {
      sourceId: source.id,
      sourceLabel: source.label,
      skipped: false,
      failed: true,
      reason: error instanceof Error ? error.message : String(error),
      leadCount: 0,
      leads: []
    };
  }
}

function toPj02Shape(lead) {
  return {
    source: "PERSONAL-JOBS-18",
    title: lead.title,
    company: lead.company,
    location: lead.location,
    sourceUrl: lead.sourceUrl,
    applyUrl: lead.applyUrl,
    sourceName: lead.sourceName,
    sourceConfidence: lead.sourceConfidence,
    fitScore: lead.fitScore,
    band: lead.band,
    notes: lead.notes,
    status: "SA_DISCOVERED_PENDING_REVIEW",
    discoveredAt: lead.discoveredAt,
    manualApprovalRequired: true,
    countryFocus: "South Africa"
  };
}

async function main() {
  ensureSaSources();

  const profile = readJson(PROFILE_PATH, {});
  const config = readJson(SA_SOURCE_LOCAL_PATH, readJson(SA_SOURCE_EXAMPLE_PATH, { sources: [] }));
  const previousRuns = readJson(SA_RUNS_PATH, []);
  const previousPj17 = readJson(PJ17_DISCOVERED_PATH, { leads: [], pj02CompatibleLeads: [] });

  const signals = buildProfileSignals(profile);
  const queries = buildSaQueries(signals);
  const sources = Array.isArray(config?.sources) ? config.sources : [];

  const sourceResults = [];

  for (const source of sources) {
    sourceResults.push(await runSource(source, signals, queries));
  }

  const leads = dedupeLeads(sourceResults.flatMap((result) => result.leads || []));
  const pj02CompatibleLeads = leads.map(toPj02Shape);

  const combinedPj02 = dedupeLeads([
    ...(Array.isArray(previousPj17?.pj02CompatibleLeads) ? previousPj17.pj02CompatibleLeads : []),
    ...pj02CompatibleLeads
  ]);

  const run = {
    schema: "kingsmen.personal-jobs-18.sa-source-run.v1",
    status: dryRun ? "DRY_RUN_READY" : "COMPLETED",
    generatedAt: new Date().toISOString(),
    profilePath: PROFILE_PATH,
    saSourceConfigPath: SA_SOURCE_LOCAL_PATH,
    usedOneProfile: true,
    countryFocus: "South Africa",
    searchQueries: queries,
    signals,
    sourcesTried: sourceResults.map((result) => ({
      sourceId: result.sourceId,
      sourceLabel: result.sourceLabel,
      skipped: result.skipped,
      failed: result.failed,
      reason: result.reason,
      leadCount: result.leadCount
    })),
    discoveredCount: leads.length,
    pj02CompatibleCount: pj02CompatibleLeads.length,
    combinedPj02CompatibleCount: combinedPj02.length,
    leads,
    pj02CompatibleLeads,
    combinedPj02CompatibleLeads: combinedPj02,
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
    writeJson(SA_DISCOVERED_PATH, {
      schema: "kingsmen.personal-jobs-18.sa-discovered-jobs.v1",
      updatedAt: new Date().toISOString(),
      leads,
      pj02CompatibleLeads,
      combinedPj02CompatibleLeads: combinedPj02
    });

    writeJson(SA_RUNS_PATH, [...(Array.isArray(previousRuns) ? previousRuns : []), run].slice(-50));
  }

  writeJson(PJ18_LATEST_REPORT, run);

  if (jsonMode) {
    console.log(JSON.stringify(run, null, 2));
  } else {
    console.log(`PERSONAL-JOBS-18 ${run.status}`);
    console.log(`SA leads: ${leads.length}`);
    console.log(`Sources: ${sources.length}`);
    console.log(`Report: ${PJ18_LATEST_REPORT}`);
  }
}

main().catch((error) => {
  const failed = {
    schema: "kingsmen.personal-jobs-18.sa-source-run.v1",
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

  writeJson(PJ18_LATEST_REPORT, failed);
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
});