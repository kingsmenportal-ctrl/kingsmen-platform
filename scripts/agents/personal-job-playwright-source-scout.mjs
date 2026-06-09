import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const PROFILE_PATH = "data/personal-job-desk/personal-candidate.local.json";
const PJ18_SOURCES_LOCAL_PATH = "data/personal-job-desk/sa-job-sources.local.json";
const PJ18_SOURCES_EXAMPLE_PATH = "data/personal-job-desk/sa-job-sources.local.example.json";
const QUEUE_LOCAL_PATH = "data/personal-job-desk/source-scout-queue.local.json";
const QUEUE_EXAMPLE_PATH = "data/personal-job-desk/source-scout-queue.local.example.json";
const SCOUT_RESULTS_PATH = "data/personal-job-desk/playwright-source-scout-results.local.json";
const SOURCE_HEALTH_PATH = "data/personal-job-desk/sa-source-health.local.json";
const PJ18_DISCOVERED_PATH = "data/personal-job-desk/sa-discovered-jobs.local.json";
const PJ17_DISCOVERED_PATH = "data/personal-job-desk/discovered-jobs.local.json";
const LATEST_REPORT_PATH = "reports/personal-jobs/personal-jobs-19-source-scout-latest.json";

const HEALTH_STATUS = {
  HEALTHY_STATIC: "HEALTHY_STATIC",
  HEALTHY_JS_RENDERED: "HEALTHY_JS_RENDERED",
  NO_JOB_LINKS_FOUND: "NO_JOB_LINKS_FOUND",
  BLOCKED_BY_LOGIN: "BLOCKED_BY_LOGIN",
  BLOCKED_BY_CAPTCHA: "BLOCKED_BY_CAPTCHA",
  PORTAL_DOWN: "PORTAL_DOWN",
  TIMEOUT: "TIMEOUT",
  MANUAL_REVIEW_REQUIRED: "MANUAL_REVIEW_REQUIRED"
};

const args = process.argv.slice(2);
const argSet = new Set(args);
const jsonMode = argSet.has("--json");
const dryRun = argSet.has("--dry-run");
const noNetwork = argSet.has("--no-network");
const headed = argSet.has("--headed");

function getArg(name, fallback = null) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

const limitArg = Number(getArg("--limit", "8"));
const sourceFilter = getArg("--source", null);
const maxTargets = Number.isFinite(limitArg) && limitArg > 0 ? Math.min(limitArg, 25) : 8;

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

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
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
    roles: roles.slice(0, 20),
    skills: skills.slice(0, 24),
    locations: locations.slice(0, 10)
  };
}

function buildQueries(signals) {
  const queries = [];

  for (const role of signals.roles.slice(0, 10)) {
    queries.push(role);
    queries.push(`${role} South Africa`);
  }

  for (const location of signals.locations.slice(0, 4)) {
    if (location.toLowerCase() !== "south africa") {
      for (const role of signals.roles.slice(0, 4)) {
        queries.push(`${role} ${location}`);
      }
    }
  }

  return unique(queries.map((item) => item.toLowerCase())).slice(0, 30);
}

function ensureQueueExample() {
  const local = absolute(QUEUE_LOCAL_PATH);
  const example = absolute(QUEUE_EXAMPLE_PATH);

  if (!fs.existsSync(local) && fs.existsSync(example)) {
    fs.copyFileSync(example, local);
  }
}

function urlFromTemplate(template, query) {
  const encoded = encodeURIComponent(query).replace(/%20/g, "+");
  return String(template ?? "").replace("{query}", encoded);
}

function buildTargetsFromSources(config, queries) {
  const sources = Array.isArray(config?.sources) ? config.sources : [];
  const targets = [];

  for (const source of sources) {
    if (source.enabled === false) continue;

    if (source.url) {
      targets.push({
        id: source.id,
        label: source.label,
        url: source.url,
        company: source.company || source.label,
        group: source.group,
        adapter: source.adapter,
        sourceConfidence: source.sourceConfidence ?? 0.55
      });
    }

    if (source.urlTemplate) {
      for (const query of queries.slice(0, 5)) {
        targets.push({
          id: `${source.id}-${slug(query)}`,
          label: `${source.label}: ${query}`,
          url: urlFromTemplate(source.urlTemplate, query),
          company: source.label,
          group: source.group,
          adapter: source.adapter,
          sourceConfidence: source.sourceConfidence ?? 0.55,
          generatedQuery: query
        });
      }
    }
  }

  return targets;
}

function buildQueue(profile, signals) {
  const queries = buildQueries(signals);
  const localQueue = readJson(QUEUE_LOCAL_PATH, null);

  if (Array.isArray(localQueue?.targets) && localQueue.targets.length > 0) {
    return localQueue.targets
      .filter((target) => target.enabled !== false)
      .map((target) => ({
        ...target,
        generatedQuery: target.generatedQuery || null
      }));
  }

  const saSourceConfig = readJson(PJ18_SOURCES_LOCAL_PATH, readJson(PJ18_SOURCES_EXAMPLE_PATH, { sources: [] }));
  return buildTargetsFromSources(saSourceConfig, queries);
}

function isJobLike(label, href) {
  const blob = `${label} ${href}`.toLowerCase();
  return /job|jobs|career|careers|vacanc|learnership|internship|graduate|trainee|apply|position|recruit|opportunit|post|cashier|assistant|worker|clerk|store|retail|warehouse|admin|driver|consultant|agent/.test(blob);
}

function detectBlockers(bodyText, url) {
  const blob = `${bodyText} ${url}`.toLowerCase();

  if (/captcha|recaptcha|verify you are human|cloudflare|security check/.test(blob)) {
    return HEALTH_STATUS.BLOCKED_BY_CAPTCHA;
  }

  if (/sign in|log in|login required|create an account|authentication required/.test(blob)) {
    return HEALTH_STATUS.BLOCKED_BY_LOGIN;
  }

  return null;
}

function scoreLead(lead, signals) {
  const haystack = [
    lead.title,
    lead.company,
    lead.location,
    lead.notes,
    lead.sourceName,
    lead.sourceGroup
  ].join(" ").toLowerCase();

  let score = 30;

  for (const role of signals.roles) {
    if (haystack.includes(role.toLowerCase())) score += 10;
  }

  for (const skill of signals.skills) {
    if (haystack.includes(skill.toLowerCase())) score += 6;
  }

  for (const location of signals.locations) {
    if (location && haystack.includes(location.toLowerCase())) score += 7;
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

function normalizeLead(input, target, signals) {
  const title = cleanText(input.title || input.label || "Opportunity found by source scout");
  const company = cleanText(target.company || input.company || target.label || "Unknown employer");
  const location = cleanText(input.location || target.location || "South Africa");
  const applyUrl = cleanText(input.href || input.applyUrl || target.url);

  const lead = {
    id: "",
    source: "PERSONAL-JOBS-19",
    title,
    company,
    location,
    sourceUrl: applyUrl,
    applyUrl,
    sourceName: target.label,
    sourceId: target.id,
    sourceGroup: target.group,
    sourceConfidence: target.sourceConfidence ?? 0.55,
    fitScore: 0,
    band: "RESEARCH_FIRST",
    notes: cleanText(input.notes || `Found through Playwright source scout on ${target.label}. Human review required before applying.`).slice(0, 1800),
    status: "PLAYWRIGHT_SCOUT_PENDING_REVIEW",
    discoveredAt: new Date().toISOString(),
    manualApprovalRequired: true,
    sendsApplications: false,
    contactsEmployers: false,
    countryFocus: "South Africa"
  };

  lead.fitScore = scoreLead(lead, signals);
  lead.band = band(lead.fitScore);
  lead.id = slug([target.id, lead.title, lead.company, lead.location, lead.applyUrl].join("|"));

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

function toPj02Shape(lead) {
  return {
    source: "PERSONAL-JOBS-19",
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
    status: "PLAYWRIGHT_SCOUT_PENDING_REVIEW",
    discoveredAt: lead.discoveredAt,
    manualApprovalRequired: true,
    countryFocus: "South Africa"
  };
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const help = [
      "Playwright is not installed or not resolvable from this repo.",
      "Run: npm install --save-dev playwright",
      "Then run: npx playwright install chromium"
    ].join(" ");
    throw new Error(`${help} Original error: ${message}`);
  }
}

async function scoutTarget(browser, target, signals) {
  const startedAt = new Date().toISOString();
  const health = {
    sourceId: target.id,
    sourceLabel: target.label,
    url: target.url,
    company: target.company || target.label,
    group: target.group || "UNKNOWN",
    status: HEALTH_STATUS.MANUAL_REVIEW_REQUIRED,
    statusReason: "",
    httpLikeStatus: null,
    title: "",
    visibleTextLength: 0,
    extractedLinkCount: 0,
    jobLikeLinkCount: 0,
    leadCount: 0,
    startedAt,
    finishedAt: null
  };

  let context;

  try {
    context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "Kingsmen-PJ19-Playwright-Source-Scout/1.0"
    });

    await context.route("**/*", async (route) => {
      const type = route.request().resourceType();
      if (["image", "font", "media"].includes(type)) {
        await route.abort().catch(() => {});
        return;
      }
      await route.continue().catch(() => {});
    });

    const page = await context.newPage();

    const response = await page.goto(target.url, {
      waitUntil: "domcontentloaded",
      timeout: 35000
    });

    health.httpLikeStatus = response?.status?.() ?? null;

    await page.waitForTimeout(3000);

    health.title = await page.title().catch(() => "");
    const bodyText = await page.locator("body").innerText({ timeout: 8000 }).catch(() => "");
    health.visibleTextLength = bodyText.length;

    const blocker = detectBlockers(bodyText, target.url);
    if (blocker) {
      health.status = blocker;
      health.statusReason = blocker === HEALTH_STATUS.BLOCKED_BY_CAPTCHA
        ? "Page appears to require CAPTCHA or human verification."
        : "Page appears to require login/sign-in before useful job links are visible.";
      return { health, leads: [] };
    }

    const links = await page.$$eval("a[href]", (nodes) => {
      return nodes.map((node) => ({
        href: node.href,
        label: (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim(),
        aria: node.getAttribute("aria-label") || "",
        title: node.getAttribute("title") || ""
      }));
    }).catch(() => []);

    health.extractedLinkCount = links.length;

    const jobLinks = links
      .map((link) => ({
        href: link.href,
        label: cleanText(link.label || link.aria || link.title || link.href)
      }))
      .filter((link) => link.href && link.label && isJobLike(link.label, link.href))
      .slice(0, 50);

    health.jobLikeLinkCount = jobLinks.length;

    const leads = jobLinks.map((link) =>
      normalizeLead({
        title: link.label,
        href: link.href,
        notes: `Visible opportunity link extracted with Playwright from ${target.label}. Human review required before applying.`
      }, target, signals)
    );

    health.leadCount = leads.length;

    if (leads.length > 0) {
      health.status = HEALTH_STATUS.HEALTHY_JS_RENDERED;
      health.statusReason = "Playwright rendered the page and extracted job-like visible links.";
    } else if (health.visibleTextLength > 500) {
      health.status = HEALTH_STATUS.NO_JOB_LINKS_FOUND;
      health.statusReason = "Page rendered, but no clear job-like links were extracted.";
    } else {
      health.status = HEALTH_STATUS.MANUAL_REVIEW_REQUIRED;
      health.statusReason = "Page rendered with too little usable text. Manual review or custom adapter may be required.";
    }

    return { health, leads };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    health.status = /timeout/i.test(message) ? HEALTH_STATUS.TIMEOUT : HEALTH_STATUS.PORTAL_DOWN;
    health.statusReason = message.slice(0, 500);
    return { health, leads: [] };
  } finally {
    health.finishedAt = new Date().toISOString();
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

async function main() {
  ensureQueueExample();

  const profile = readJson(PROFILE_PATH, {});
  const signals = buildProfileSignals(profile);
  const queries = buildQueries(signals);

  let queue = buildQueue(profile, signals)
    .filter((target) => target.enabled !== false)
    .filter((target) => target.url)
    .filter((target) => sourceFilter ? target.id === sourceFilter : true)
    .slice(0, maxTargets);

  const previousPj17 = readJson(PJ17_DISCOVERED_PATH, { pj02CompatibleLeads: [] });
  const previousPj18 = readJson(PJ18_DISCOVERED_PATH, { pj02CompatibleLeads: [], combinedPj02CompatibleLeads: [] });

  if (dryRun || noNetwork) {
    const run = {
      schema: "kingsmen.personal-jobs-19.source-scout-run.v1",
      status: dryRun ? "DRY_RUN_READY" : "NETWORK_DISABLED",
      generatedAt: new Date().toISOString(),
      usedOneProfile: true,
      countryFocus: "South Africa",
      queueCount: queue.length,
      queries,
      queuePreview: queue.map((target) => ({
        id: target.id,
        label: target.label,
        url: target.url,
        company: target.company,
        group: target.group
      })),
      healthStatuses: Object.values(HEALTH_STATUS),
      boundaries: {
        maxConcurrency: 1,
        sendsApplications: false,
        sendsEmail: false,
        sendsWhatsApp: false,
        touchesPayments: false,
        contactsEmployers: false,
        bypassesLoginOrCaptcha: false,
        requiresHumanApprovalBeforeApply: true
      }
    };

    writeJson(LATEST_REPORT_PATH, run);
    if (jsonMode) console.log(JSON.stringify(run, null, 2));
    else console.log(`PERSONAL-JOBS-19 ${run.status}: ${queue.length} targets ready`);
    return;
  }

  const { chromium } = await importPlaywright();

  const browser = await chromium.launch({
    headless: !headed
  });

  const health = [];
  const allLeads = [];

  try {
    for (const target of queue) {
      const result = await scoutTarget(browser, target, signals);
      health.push(result.health);
      allLeads.push(...result.leads);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  const leads = dedupeLeads(allLeads);
  const pj02CompatibleLeads = leads.map(toPj02Shape);

  const combinedPj02CompatibleLeads = dedupeLeads([
    ...(Array.isArray(previousPj17?.pj02CompatibleLeads) ? previousPj17.pj02CompatibleLeads : []),
    ...(Array.isArray(previousPj18?.combinedPj02CompatibleLeads) ? previousPj18.combinedPj02CompatibleLeads : []),
    ...(Array.isArray(previousPj18?.pj02CompatibleLeads) ? previousPj18.pj02CompatibleLeads : []),
    ...pj02CompatibleLeads
  ]);

  const run = {
    schema: "kingsmen.personal-jobs-19.source-scout-run.v1",
    status: "COMPLETED",
    generatedAt: new Date().toISOString(),
    usedOneProfile: true,
    countryFocus: "South Africa",
    queueCount: queue.length,
    sourceHealthCount: health.length,
    discoveredCount: leads.length,
    pj02CompatibleCount: pj02CompatibleLeads.length,
    combinedPj02CompatibleCount: combinedPj02CompatibleLeads.length,
    healthStatuses: Object.values(HEALTH_STATUS),
    queries,
    sourceHealth: health,
    leads,
    pj02CompatibleLeads,
    combinedPj02CompatibleLeads,
    boundaries: {
      maxConcurrency: 1,
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      touchesPayments: false,
      contactsEmployers: false,
      bypassesLoginOrCaptcha: false,
      requiresHumanApprovalBeforeApply: true
    }
  };

  writeJson(SCOUT_RESULTS_PATH, {
    schema: "kingsmen.personal-jobs-19.playwright-source-scout-results.v1",
    updatedAt: new Date().toISOString(),
    leads,
    pj02CompatibleLeads,
    combinedPj02CompatibleLeads
  });

  writeJson(SOURCE_HEALTH_PATH, {
    schema: "kingsmen.personal-jobs-19.sa-source-health.v1",
    updatedAt: new Date().toISOString(),
    sourceHealth: health
  });

  writeJson(LATEST_REPORT_PATH, run);

  if (jsonMode) console.log(JSON.stringify(run, null, 2));
  else {
    console.log("PERSONAL-JOBS-19 COMPLETED");
    console.log(`Targets scouted: ${queue.length}`);
    console.log(`Leads found: ${leads.length}`);
    console.log(`Health report: ${SOURCE_HEALTH_PATH}`);
  }
}

main().catch((error) => {
  const failed = {
    schema: "kingsmen.personal-jobs-19.source-scout-run.v1",
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