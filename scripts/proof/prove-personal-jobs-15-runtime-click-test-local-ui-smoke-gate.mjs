import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const moduleName = "PERSONAL-JOBS-15 - Personal Job Desk Runtime Click Test / Local UI Smoke Gate";
const route = "/personal-job-desk/runtime-click-test";
const reportPath = "reports/personal-jobs/personal-jobs-15-runtime-click-test-local-ui-smoke-gate-proof.json";
const preflightPath = "reports/personal-jobs/pj15-local-powershell-preflight.json";

const expectedFiles = [
  "apps/web/src/app/personal-job-desk/runtime-click-test/page.tsx",
  "apps/web/src/app/personal-job-desk/runtime-click-test/RuntimeClickTestClient.tsx",
  "apps/web/src/app/personal-job-desk/navigation/NavigationHubClient.tsx",
  "docs/personal-jobs/personal-jobs-15-runtime-click-test-local-ui-smoke-gate.md",
  "manifests/personal-jobs/personal-jobs-15-runtime-click-test-local-ui-smoke-gate.json",
  "packages/contracts/src/personal-jobs-15-runtime-click-test-local-ui-smoke-gate.ts",
  "scripts/proof/prove-personal-jobs-15-runtime-click-test-local-ui-smoke-gate.mjs",
  "scripts/validators/validate-personal-jobs-15-runtime-click-test-local-ui-smoke-gate.mjs"
];

const runtimeTargets = [
  "/personal-job-desk",
  "/personal-job-desk/runtime-click-test"
];

const checks = [];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8").replace(/^\uFEFF/, "");
}

function addCheck(name, passed, detail) {
  checks.push({
    name,
    passed: Boolean(passed),
    detail: String(detail ?? "")
  });
}

function readPowerShellPreflight() {
  if (!exists(preflightPath)) return null;

  try {
    const preflight = JSON.parse(read(preflightPath));
    const results = Array.isArray(preflight.results) ? preflight.results : [];

    const requiredTargetsPassed = runtimeTargets.every((target) =>
      results.some((result) =>
        result.target === target &&
        result.passed === true &&
        Number(result.status) >= 200 &&
        Number(result.status) < 400 &&
        Number(result.bytes) > 1000
      )
    );

    if (preflight.passed === true && preflight.baseUrl && requiredTargetsPassed) {
      return {
        baseUrl: String(preflight.baseUrl).replace(/\/$/, ""),
        results: results.map((result) => ({
          target: result.target,
          ok: Boolean(result.ok),
          status: result.status,
          bytes: result.bytes,
          hasNotFoundText: Boolean(result.hasNotFoundText),
          passed: Boolean(result.passed),
          source: "powershell-status-preflight"
        }))
      };
    }

    return null;
  } catch {
    return null;
  }
}

function fetchWithNode(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;

    const request = client.get(
      parsed,
      {
        headers: {
          "cache-control": "no-cache",
          "user-agent": "Kingsmen-PJ15-Local-Smoke-Gate"
        }
      },
      (response) => {
        let bytes = 0;

        response.on("data", (chunk) => {
          bytes += Buffer.byteLength(chunk);
        });

        response.on("end", () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 400 && bytes > 1000,
            status: response.statusCode,
            bytes,
            hasNotFoundText: false
          });
        });
      }
    );

    request.setTimeout(30000, () => {
      request.destroy(new Error(`Timeout while probing ${url}`));
    });

    request.on("error", reject);
  });
}

async function findLocalBaseUrlWithNode() {
  const configured = process.env.KINGSMEN_WEB_BASE_URL;

  const candidates = [
    configured,
    "http://127.0.0.1:3002",
    "http://localhost:3002",
    ...Array.from({ length: 11 }, (_, index) => `http://127.0.0.1:${3000 + index}`),
    ...Array.from({ length: 11 }, (_, index) => `http://localhost:${3000 + index}`)
  ]
    .filter(Boolean)
    .map((value) => value.replace(/\/$/, ""));

  const uniqueCandidates = [...new Set(candidates)];

  for (const baseUrl of uniqueCandidates) {
    try {
      const result = await fetchWithNode(`${baseUrl}${route}`);
      if (result.ok) return baseUrl;
    } catch {
      // Try next local candidate.
    }
  }

  return null;
}

async function run() {
  fs.mkdirSync(absolute("reports/personal-jobs"), { recursive: true });

  for (const file of expectedFiles) {
    addCheck(`expected-file:${file}`, exists(file), file);
  }

  if (exists("apps/web/src/app/personal-job-desk/runtime-click-test/page.tsx")) {
    const page = read("apps/web/src/app/personal-job-desk/runtime-click-test/page.tsx");
    addCheck("page-route-marker", page.includes("runtime-click-test") || page.includes("RuntimeClickTestClient"), route);
  } else {
    addCheck("page-route-marker", false, "runtime click test page missing");
  }

  if (exists("apps/web/src/app/personal-job-desk/runtime-click-test/RuntimeClickTestClient.tsx")) {
    const client = read("apps/web/src/app/personal-job-desk/runtime-click-test/RuntimeClickTestClient.tsx");
    addCheck("client-runtime-click-test-marker", client.includes("runtime") || client.includes("click") || client.includes("smoke"), "runtime click smoke UI marker");
    addCheck("client-no-send-boundary", !/sendEmail|sendWhatsApp|Payfast|paymentIntent|service_role|SUPABASE_SERVICE_ROLE/i.test(client), "local UI only");
  } else {
    addCheck("client-runtime-click-test-marker", false, "runtime click test client missing");
    addCheck("client-no-send-boundary", false, "runtime click test client missing");
  }

  let localBaseUrl = null;
  let runtimeResults = [];

  const preflight = readPowerShellPreflight();

  if (preflight) {
    localBaseUrl = preflight.baseUrl;
    runtimeResults = preflight.results;

    addCheck("runtime-local-server-found", true, `${localBaseUrl} via powershell status preflight`);

    for (const target of runtimeTargets) {
      const result = runtimeResults.find((item) => item.target === target);
      addCheck(
        `runtime-route:${target}`,
        Boolean(result?.passed),
        result ? `${result.status} ${result.bytes} bytes via ${result.source}` : "missing preflight target"
      );
    }
  } else {
    localBaseUrl = await findLocalBaseUrlWithNode();
    addCheck("runtime-local-server-found", Boolean(localBaseUrl), localBaseUrl || "Start local Next.js server: cd apps/web && npm run dev");

    if (localBaseUrl) {
      for (const target of runtimeTargets) {
        try {
          const result = await fetchWithNode(`${localBaseUrl}${target}`);
          const passed = result.ok;
          runtimeResults.push({ target, ...result, passed, source: "node-http-status" });
          addCheck(`runtime-route:${target}`, passed, `${result.status} ${result.bytes} bytes via node-http-status`);
        } catch (error) {
          runtimeResults.push({ target, passed: false, error: error.message, source: "node-http-status" });
          addCheck(`runtime-route:${target}`, false, error.message);
        }
      }
    } else {
      for (const target of runtimeTargets) {
        addCheck(`runtime-route:${target}`, false, "local server not found");
      }
    }
  }

  const failed = checks.filter((check) => !check.passed);
  const passed = failed.length === 0;

  const report = {
    schema: "kingsmen.personal-jobs-15-proof.v1",
    module: moduleName,
    status: passed
      ? "PERSONAL_JOBS_15_RUNTIME_CLICK_TEST_LOCAL_UI_SMOKE_GATE_PROVEN"
      : "PERSONAL_JOBS_15_RUNTIME_CLICK_TEST_LOCAL_UI_SMOKE_GATE_FAILED",
    passed,
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    startsDocker: false,
    generated_at: new Date().toISOString(),
    route,
    localBaseUrl,
    runtimeTargetCount: runtimeTargets.length,
    runtimeTargets,
    runtimeResults,
    checks,
    failed,
    next_action: passed
      ? "Run validator and commit PERSONAL-JOBS-15 tracked files only."
      : "Repair failed runtime route(s) or start local dev server before committing."
  };

  fs.writeFileSync(absolute(reportPath), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  if (!passed) process.exit(1);
}

run().catch((error) => {
  const report = {
    schema: "kingsmen.personal-jobs-15-proof.v1",
    module: moduleName,
    status: "PERSONAL_JOBS_15_RUNTIME_CLICK_TEST_LOCAL_UI_SMOKE_GATE_FAILED",
    passed: false,
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    startsDocker: false,
    generated_at: new Date().toISOString(),
    route,
    localBaseUrl: null,
    runtimeTargetCount: runtimeTargets.length,
    runtimeTargets,
    runtimeResults: [],
    checks,
    failed: [{ name: "proof-runtime-error", passed: false, detail: error.message }],
    next_action: "Repair proof runtime error before committing."
  };

  fs.mkdirSync(absolute("reports/personal-jobs"), { recursive: true });
  fs.writeFileSync(absolute(reportPath), JSON.stringify(report, null, 2));
  console.error(error);
  process.exit(1);
});