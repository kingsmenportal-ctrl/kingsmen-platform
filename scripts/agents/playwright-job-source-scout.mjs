import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const OUT = "reports/personal-jobs/personal-jobs-17-playwright-source-scout-latest.json";

function writeJson(relativePath, data) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const targetUrl = getArg("--url");

async function main() {
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    const result = {
      schema: "kingsmen.personal-jobs-17.playwright-scout.v1",
      status: "NO_URL",
      message: "Pass --url https://example.com/careers to scout an authorised careers page.",
      boundaries: {
        noLogin: true,
        noCaptchaBypass: true,
        noCredentialUse: true,
        noAggressiveScraping: true,
        noAutoApply: true
      }
    };

    writeJson(OUT, result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  let chromium;

  try {
    const playwright = await import("playwright");
    chromium = playwright.chromium;
  } catch {
    const result = {
      schema: "kingsmen.personal-jobs-17.playwright-scout.v1",
      status: "PLAYWRIGHT_NOT_INSTALLED",
      message: "Install Playwright locally only when you are ready to scout authorised pages.",
      targetUrl,
      boundaries: {
        noLogin: true,
        noCaptchaBypass: true,
        noCredentialUse: true,
        noAggressiveScraping: true,
        noAutoApply: true
      }
    };

    writeJson(OUT, result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      userAgent: "Kingsmen-Personal-Jobs-17-Playwright-Scout"
    });

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25000
    });

    const links = await page.evaluate(() => {
      return [...document.querySelectorAll("a")]
        .map((a) => ({
          text: (a.textContent || "").replace(/\s+/g, " ").trim(),
          href: a.href
        }))
        .filter((a) => a.href && a.text)
        .filter((a) => /job|career|vacancy|learnership|internship|apply|position|opening/i.test(`${a.text} ${a.href}`))
        .slice(0, 80);
    });

    const result = {
      schema: "kingsmen.personal-jobs-17.playwright-scout.v1",
      status: "SCOUTED",
      targetUrl,
      generatedAt: new Date().toISOString(),
      candidateLinks: links,
      boundaries: {
        noLogin: true,
        noCaptchaBypass: true,
        noCredentialUse: true,
        noAggressiveScraping: true,
        noAutoApply: true
      }
    };

    writeJson(OUT, result);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  const result = {
    schema: "kingsmen.personal-jobs-17.playwright-scout.v1",
    status: "FAILED",
    targetUrl,
    error: error instanceof Error ? error.message : String(error),
    boundaries: {
      noLogin: true,
      noCaptchaBypass: true,
      noCredentialUse: true,
      noAggressiveScraping: true,
      noAutoApply: true
    }
  };

  writeJson(OUT, result);
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
});