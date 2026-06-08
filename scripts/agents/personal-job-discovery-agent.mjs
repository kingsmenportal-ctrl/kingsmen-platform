import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const PROFILE_PATH = "data/personal-job-desk/personal-candidate.local.json";
const SOURCE_LOCAL_PATH = "data/personal-job-desk/job-search-sources.local.json";
const SOURCE_EXAMPLE_PATH = "data/personal-job-desk/job-search-sources.local.example.json";
const DISCOVERED_PATH = "data/personal-job-desk/discovered-jobs.local.json";
const RUNS_PATH = "data/personal-job-desk/job-discovery-runs.local.json";
const REPORT_PATH = "reports/personal-jobs/personal-jobs-17-job-discovery-agent-latest.json";

const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const dryRun = args.has("--dry-run");

function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(relativePath, data) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function ensureSources() {
  const local = path.join(root, SOURCE_LOCAL_PATH);
  const example = path.join(root, SOURCE_EXAMPLE_PATH);

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

function extractProfileSignals(profile) {
  const blob = text(profile);
  const profileWords = words(blob);

  const skillHints = [
    "admin", "retail", "cashier", "warehouse", "driver", "sales", "customer",
    "service", "cleaner", "security", "call", "centre", "data", "capturer",
    "assistant", "learnership", "internship", "general", "worker", "store",
    "clerk", "receptionist", "computer", "excel", "stock", "logistics"
  ];

  const skills = unique([
    ...(Array.isArray(profile?.skills) ? profile.skills.map(String) : []),
    ...(Array.isArray(profile?.targetSkills) ? profile.targetSkills.map(String) : []),
    ...skillHints.filter((hint) => profileWords.includes(hint))
  ]);

  const desiredRoles = unique([
    ...(Array.isArray(profile?.desiredRoles) ? profile.desiredRoles.map(String) : []),
    ...(Array.isArray(profile?.preferredRoles) ? profile.preferredRoles.map(String) : []),
    ...(Array.isArray(profile?.targetRoles) ? profile.targetRoles.map(String) : []),
    ...(profile?.desiredRole ? [String(profile.desiredRole)] : []),
    ...(profile?.preferredRole ? [String(profile.preferredRole)] : [])
  ]);

  const sectors = unique([
    ...(Array.isArray(profile?.sectors) ? profile.sectors.map(String) : []),
    ...(Array.isArray(profile?.preferredSectors) ? profile.preferredSectors.map(String) : []),
    ...(Array.isArray(profile?.targetSectors) ? profile.targetSectors.map(String) : [])
  ]);

  const locations = unique([
    profile?.location,
    profile?.city,
    profile?.province,
    ...(Array.isArray(profile?.locations) ? profile.locations : []),
    ...(Array.isArray(profile?.preferredLocations) ? profile.preferredLocations : [])
  ].map((item) => item ? String(item) : ""));

  const fallbackRoles = [
    "general worker",
    "retail assistant",
    "cashier",
    "warehouse assistant",
    "admin assistant",
    "customer service",
    "learnership",
    "internship"
  ];

  return {
    skills,
    desiredRoles: desiredRoles.length ? desiredRoles : fallbackRoles,
    sectors,
    locations,
    rawProfileWordCount: profileWords.length
  };
}

function buildSearchQueries(signals) {
  const roleTerms = signals.desiredRoles.slice(0, 12);
  const skillTerms = signals.skills.slice(0, 8);
  const sectorTerms = signals.sectors.slice(0, 6);

  const queries = [];

  for (const role of roleTerms) queries.push(role);

  for (const role of roleTerms.slice(0, 5)) {
    for (const skill of skillTerms.slice(0, 3)) {
      queries.push(`${role} ${skill}`);
    }
  }

  for (const sector of sectorTerms) queries.push(`${sector} jobs`);

  return unique(queries.map((query) => query.toLowerCase())).slice(0, 25);
}

function containsAny(haystack, needles) {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(String(needle).toLowerCase()));
}

function scoreLead(lead, signals) {
  const haystack = [
    lead.title,
    lead.company,
    lead.location,
    lead.description,
    lead.tags?.join(" ")
  ].join(" ").toLowerCase();

  let score = 20;

  for (const role of signals.desiredRoles) {
    if (haystack.includes(role.toLowerCase())) score += 18;
  }

  for (const skill of signals.skills) {
    if (haystack.includes(skill.toLowerCase())) score += 8;
  }

  for (const sector of signals.sectors) {
    if (haystack.includes(sector.toLowerCase())) score += 6;
  }

  for (const location of signals.locations) {
    if (location && haystack.includes(location.toLowerCase())) score += 10;
  }

  if (haystack.includes("remote")) score += 6;
  if (haystack.includes("junior") || haystack.includes("entry") || haystack.includes("learnership") || haystack.includes("internship")) score += 7;
  if (lead.sourceConfidence) score += Math.round(Number(lead.sourceConfidence) * 10);

  return Math.max(0, Math.min(100, score));
}

function normalizeLead(raw, source, signals) {
  const title = raw.title || raw.position || raw.name || raw.text || "Untitled opportunity";
  const company = raw.company || raw.company_name || raw.organization || raw.employer || "Unknown company";
  const location = raw.location || raw.candidate_required_location || raw.city || raw.region || "Not specified";
  const applyUrl = raw.url || raw.apply_url || raw.redirect_url || raw.hostedUrl || raw.absolute_url || raw.link || "";
  const description = raw.description || raw.content || raw.plaintext || raw.summary || "";

  const lead = {
    id: "",
    title: String(title).trim(),
    company: String(company).trim(),
    location: String(location).trim(),
    applyUrl: String(applyUrl).trim(),
    sourceId: source.id,
    sourceLabel: source.label,
    sourceAdapter: source.adapter,
    sourceConfidence: source.sourceConfidence ?? 0.5,
    discoveredAt: new Date().toISOString(),
    description: String(description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 12) : [],
    status: "DISCOVERED_PENDING_REVIEW",
    manualApprovalRequired: true,
    sendsApplications: false,
    contactsEmployers: false
  };

  lead.fitScore = scoreLead(lead, signals);
  lead.band =
    lead.fitScore >= 80 ? "CROWN_TARGET" :
    lead.fitScore >= 65 ? "STRONG_ROUTE" :
    lead.fitScore >= 45 ? "WATCHLIST" :
    "RESEARCH_FIRST";

  lead.id = [
    lead.title,
    lead.company,
    lead.location,
    lead.applyUrl
  ].join("|").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

  return lead;
}

function dedupeLeads(leads) {
  const seen = new Map();

  for (const lead of leads) {
    const key = lead.applyUrl
      ? `url:${lead.applyUrl.toLowerCase()}`
      : `text:${lead.title.toLowerCase()}|${lead.company.toLowerCase()}|${lead.location.toLowerCase()}`;

    const existing = seen.get(key);

    if (!existing || lead.fitScore > existing.fitScore) {
      seen.set(key, lead);
    }
  }

  return [...seen.values()].sort((a, b) => b.fitScore - a.fitScore);
}

async function fetchJson(url, timeoutMs = 16000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Kingsmen-Personal-Jobs-17-Discovery-Agent",
        "accept": "application/json,text/plain,*/*"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, timeoutMs = 16000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Kingsmen-Personal-Jobs-17-Discovery-Agent",
        "accept": "application/rss+xml,text/xml,text/html,text/plain,*/*"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function remoteOkAdapter(source, signals, queries) {
  const json = await fetchJson(source.endpoint);
  const rows = Array.isArray(json) ? json.filter((item) => item && typeof item === "object" && item.position) : [];
  const needles = unique([...queries, ...signals.skills, ...signals.desiredRoles]).slice(0, 50);

  return rows
    .filter((row) => containsAny(`${row.position} ${row.company} ${row.description} ${text(row.tags)}`, needles))
    .map((row) => normalizeLead({
      title: row.position,
      company: row.company,
      location: row.location || "Remote",
      apply_url: row.url,
      description: row.description,
      tags: row.tags
    }, source, signals));
}

async function arbeitnowAdapter(source, signals, queries) {
  const json = await fetchJson(source.endpoint);
  const rows = Array.isArray(json?.data) ? json.data : [];
  const needles = unique([...queries, ...signals.skills, ...signals.desiredRoles]).slice(0, 50);

  return rows
    .filter((row) => containsAny(`${row.title} ${row.company_name} ${row.location} ${row.description} ${text(row.tags)}`, needles))
    .map((row) => normalizeLead({
      title: row.title,
      company: row.company_name,
      location: row.location || "Not specified",
      apply_url: row.url,
      description: row.description,
      tags: row.tags
    }, source, signals));
}

async function greenhouseAdapter(source, signals, queries) {
  if (!source.boardToken || source.boardToken.includes("replace-with")) return [];

  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.boardToken)}/jobs?content=true`;
  const json = await fetchJson(url);
  const rows = Array.isArray(json?.jobs) ? json.jobs : [];
  const needles = unique([...queries, ...signals.skills, ...signals.desiredRoles]).slice(0, 50);

  return rows
    .filter((row) => containsAny(`${row.title} ${row.location?.name ?? ""} ${row.content ?? ""}`, needles))
    .map((row) => normalizeLead({
      title: row.title,
      company: source.company || source.label,
      location: row.location?.name || "Not specified",
      apply_url: row.absolute_url,
      description: row.content
    }, source, signals));
}

async function leverAdapter(source, signals, queries) {
  if (!source.companySlug || source.companySlug.includes("replace-with")) return [];

  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(source.companySlug)}?mode=json`;
  const rows = await fetchJson(url);
  const list = Array.isArray(rows) ? rows : [];
  const needles = unique([...queries, ...signals.skills, ...signals.desiredRoles]).slice(0, 50);

  return list
    .filter((row) => containsAny(`${row.text} ${row.categories?.location ?? ""} ${row.descriptionPlain ?? ""}`, needles))
    .map((row) => normalizeLead({
      title: row.text,
      company: source.company || source.label,
      location: row.categories?.location || "Not specified",
      apply_url: row.hostedUrl,
      description: row.descriptionPlain,
      tags: row.categories ? Object.values(row.categories) : []
    }, source, signals));
}

async function rssAdapter(source, signals, queries) {
  if (!source.url) return [];

  const xml = await fetchText(source.url);
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const needles = unique([...queries, ...signals.skills, ...signals.desiredRoles]).slice(0, 50);

  return items
    .map((item) => {
      const get = (tag) => {
        const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      };

      return {
        title: get("title"),
        company: source.label,
        location: source.location || "Not specified",
        apply_url: get("link"),
        description: get("description")
      };
    })
    .filter((row) => containsAny(`${row.title} ${row.description}`, needles))
    .map((row) => normalizeLead(row, source, signals));
}

async function runSource(source, signals, queries) {
  if (!source.enabled) {
    return {
      sourceId: source.id,
      sourceLabel: source.label,
      skipped: true,
      reason: "disabled",
      leads: []
    };
  }

  try {
    let leads = [];

    if (source.adapter === "remoteok") leads = await remoteOkAdapter(source, signals, queries);
    else if (source.adapter === "arbeitnow") leads = await arbeitnowAdapter(source, signals, queries);
    else if (source.adapter === "greenhouse") leads = await greenhouseAdapter(source, signals, queries);
    else if (source.adapter === "lever") leads = await leverAdapter(source, signals, queries);
    else if (source.adapter === "rss") leads = await rssAdapter(source, signals, queries);
    else if (source.adapter === "playwrightPage") {
      return {
        sourceId: source.id,
        sourceLabel: source.label,
        skipped: true,
        reason: "playwright scout uses scripts/agents/playwright-job-source-scout.mjs",
        leads: []
      };
    } else {
      return {
        sourceId: source.id,
        sourceLabel: source.label,
        skipped: true,
        reason: `unknown adapter ${source.adapter}`,
        leads: []
      };
    }

    return {
      sourceId: source.id,
      sourceLabel: source.label,
      skipped: false,
      reason: null,
      leads
    };
  } catch (error) {
    return {
      sourceId: source.id,
      sourceLabel: source.label,
      skipped: false,
      failed: true,
      reason: error instanceof Error ? error.message : String(error),
      leads: []
    };
  }
}

function toPj02Shape(lead) {
  return {
    source: "PERSONAL-JOBS-17",
    title: lead.title,
    company: lead.company,
    location: lead.location,
    sourceUrl: lead.applyUrl,
    applyUrl: lead.applyUrl,
    sourceName: lead.sourceLabel,
    sourceConfidence: lead.sourceConfidence,
    fitScore: lead.fitScore,
    band: lead.band,
    notes: lead.description,
    status: "DISCOVERED_PENDING_REVIEW",
    discoveredAt: lead.discoveredAt,
    manualApprovalRequired: true
  };
}

async function main() {
  ensureSources();

  const profile = readJson(PROFILE_PATH, {});
  const sourcesConfig = readJson(SOURCE_LOCAL_PATH, readJson(SOURCE_EXAMPLE_PATH, { sources: [] }));
  const previousRuns = readJson(RUNS_PATH, []);

  const signals = extractProfileSignals(profile);
  const queries = buildSearchQueries(signals);
  const activeSources = Array.isArray(sourcesConfig?.sources) ? sourcesConfig.sources : [];

  const sourceResults = [];

  if (!dryRun) {
    for (const source of activeSources) {
      sourceResults.push(await runSource(source, signals, queries));
    }
  }

  const allLeads = dedupeLeads(sourceResults.flatMap((result) => result.leads ?? []));
  const pj02CompatibleLeads = allLeads.map(toPj02Shape);

  const run = {
    schema: "kingsmen.personal-jobs-17.discovery-run.v1",
    status: dryRun ? "DRY_RUN_READY" : "COMPLETED",
    generatedAt: new Date().toISOString(),
    profilePath: PROFILE_PATH,
    usedOneProfile: true,
    sourceConfigPath: SOURCE_LOCAL_PATH,
    searchQueries: queries,
    signals,
    sourcesTried: sourceResults.map((result) => ({
      sourceId: result.sourceId,
      sourceLabel: result.sourceLabel,
      skipped: Boolean(result.skipped),
      failed: Boolean(result.failed),
      reason: result.reason,
      leadCount: result.leads?.length ?? 0
    })),
    discoveredCount: allLeads.length,
    pj02CompatibleCount: pj02CompatibleLeads.length,
    leads: allLeads,
    pj02CompatibleLeads,
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
    writeJson(DISCOVERED_PATH, {
      schema: "kingsmen.personal-jobs-17.discovered-jobs.v1",
      updatedAt: new Date().toISOString(),
      leads: allLeads,
      pj02CompatibleLeads
    });

    writeJson(RUNS_PATH, [...(Array.isArray(previousRuns) ? previousRuns : []), run].slice(-50));
  }

  writeJson(REPORT_PATH, run);

  if (jsonMode) {
    console.log(JSON.stringify(run, null, 2));
  } else {
    console.log(`PERSONAL-JOBS-17 ${run.status}`);
    console.log(`Queries: ${queries.length}`);
    console.log(`Discovered leads: ${allLeads.length}`);
    console.log(`Report: ${REPORT_PATH}`);
  }
}

main().catch((error) => {
  const failed = {
    schema: "kingsmen.personal-jobs-17.discovery-run.v1",
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

  writeJson(REPORT_PATH, failed);
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
});