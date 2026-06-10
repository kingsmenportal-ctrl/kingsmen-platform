import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = "data/personal-job-desk/scouted-opportunities.local.json";

function abs(p) {
  return path.join(ROOT, p);
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(abs(p)), { recursive: true });
  fs.writeFileSync(abs(p), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(abs(p), "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function searchUrls({ query, location, category }) {
  const q = encodeURIComponent(query || "entry level jobs learnership internship");
  const l = encodeURIComponent(location || "Johannesburg");

  return [
    {
      source: "Indeed",
      category,
      url: `https://za.indeed.com/jobs?q=${q}&l=${l}`
    },
    {
      source: "Careers24",
      category,
      url: `https://www.careers24.com/jobs/lc-${l}/?q=${q}`
    },
    {
      source: "PNet",
      category,
      url: `https://www.pnet.co.za/jobs/${q}/in-${l}`
    },
    {
      source: "Google Jobs Search",
      category,
      url: `https://www.google.com/search?q=${q}+${l}+South+Africa+apply`
    },
    {
      source: "SA Youth",
      category,
      url: "https://sayouth.mobi/"
    },
    {
      source: "ESSA",
      category,
      url: "https://essa.labour.gov.za/EssaOnline/WebBeans/"
    },
    {
      source: "NYDA",
      category,
      url: "https://www.nyda.gov.za/"
    }
  ];
}

async function tryExtractWithPlaywright(sourceDef) {
  let playwright;

  try {
    playwright = await import("playwright");
  } catch {
    return {
      source: sourceDef.source,
      status: "PLAYWRIGHT_NOT_INSTALLED",
      leads: [],
      openUrl: sourceDef.url,
      note: "Playwright package is not installed."
    };
  }

  let browser;

  try {
    browser = await playwright.chromium.launch({
      headless: true,
      timeout: 30000
    });

    const page = await browser.newPage({
      viewport: { width: 1366, height: 900 }
    });

    await page.goto(sourceDef.url, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });

    await page.waitForTimeout(2500);

    const extracted = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a"));
      const cards = [];

      for (const a of anchors) {
        const text = (a.textContent || "").replace(/\s+/g, " ").trim();
        const href = a.href || "";

        if (!text || text.length < 8 || text.length > 140) continue;
        if (!href || href.startsWith("javascript:")) continue;

        const lower = `${text} ${href}`.toLowerCase();

        const looksOpportunity =
          lower.includes("job") ||
          lower.includes("career") ||
          lower.includes("learnership") ||
          lower.includes("intern") ||
          lower.includes("vacancy") ||
          lower.includes("apply") ||
          lower.includes("bursary") ||
          lower.includes("funding") ||
          lower.includes("programme") ||
          lower.includes("opportunity");

        if (!looksOpportunity) continue;

        cards.push({
          title: text,
          href
        });

        if (cards.length >= 20) break;
      }

      return {
        title: document.title || "",
        cards
      };
    });

    const leads = extracted.cards.map((card) => ({
      leadId: id("lead"),
      source: sourceDef.source,
      category: sourceDef.category,
      title: clean(card.title),
      organisation: sourceDef.source,
      location: "",
      sourceUrl: card.href,
      applicationMethod: "PORTAL",
      confidence: "SCOUTED_PUBLIC_LINK",
      scoutStatus: "FOUND_PUBLIC_LINK",
      imported: false,
      createdAt: new Date().toISOString()
    }));

    return {
      source: sourceDef.source,
      status: leads.length ? "SCOUTED" : "NO_PUBLIC_CARDS_FOUND",
      pageTitle: extracted.title,
      leads,
      openUrl: sourceDef.url,
      note: leads.length
        ? `Found ${leads.length} public links. Review before import.`
        : "No safe public opportunity cards found. Open source manually."
    };
  } catch (error) {
    return {
      source: sourceDef.source,
      status: "NEEDS_MANUAL_OPEN",
      leads: [],
      openUrl: sourceDef.url,
      note: error instanceof Error ? error.message : "Scout failed."
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

export async function runScout(options = {}) {
  const query = clean(options.query) || "entry level general worker admin learnership internship";
  const location = clean(options.location) || "Johannesburg";
  const category = clean(options.category) || "JOB";

  const sources = searchUrls({ query, location, category });
  const sourceResults = [];

  for (const source of sources) {
    sourceResults.push(await tryExtractWithPlaywright(source));
  }

  const leads = sourceResults.flatMap((result) => result.leads || []);

  const output = {
    schema: "kingsmen.personal-jobs-35.opportunity-scout.v1",
    module: "PERSONAL-JOBS-35",
    status: "COMPLETED",
    generatedAt: new Date().toISOString(),
    query,
    location,
    category,
    leadCount: leads.length,
    sourceResults,
    leads,
    safetyBoundary: {
      autoApplies: false,
      bypassesLogin: false,
      bypassesOtp: false,
      bypassesCaptcha: false,
      contactsEmployers: false,
      inventsJobs: false,
      requiresCandidateReview: true
    },
    nextAction: leads.length
      ? "Open /personal-job-desk/opportunity-scout, review leads, then import selected real opportunities."
      : "Open sources manually from the scout screen; login/blocked pages cannot be scraped safely."
  };

  writeJson(OUT, output);
  return output;
}

if (process.argv[1] && process.argv[1].endsWith("personal-job-opportunity-scout.mjs")) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [k, ...rest] = arg.replace(/^--/, "").split("=");
      return [k, rest.join("=")];
    })
  );

  runScout(args)
    .then((result) => {
      console.log(JSON.stringify({
        status: result.status,
        query: result.query,
        location: result.location,
        category: result.category,
        leadCount: result.leadCount,
        nextAction: result.nextAction
      }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}