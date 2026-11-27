import fs from "node:fs";

const failures = [];
const read = (path) => {
  if (!fs.existsSync(path)) {
    failures.push(`Missing required N06 security file: ${path}`);
    return "";
  }
  return fs.readFileSync(path, "utf8");
};

const authPath = "apps/web/src/lib/n06-candidate-session-auth.ts";
const auth = read(authPath);
for (const [label, pattern] of [
  ["Bearer token is required", /Bearer\s+\S+/],
  ["session validated against Supabase Auth", /\/auth\/v1\/user/],
  ["redirects are rejected", /redirect:\s*"error"/],
  ["cache is disabled", /cache:\s*"no-store"/],
  ["service role is not used", /service_role|SUPABASE_SERVICE_ROLE_KEY/],
  ["adapter-missing state is explicit", /N06_WORKBENCH_ADAPTER_REQUIRED/],
  ["adapter-missing response is unavailable, not successful", /status:\s*503/],
  ["auth identity UUID is validated", /UUID\.test\(user\.id\)/]
]) {
  if (!pattern.test(auth)) failures.push(`${label}: missing from ${authPath}`);
}

const routes = [
  "apps/web/src/app/api/candidate/workbench/readiness/route.ts",
  "apps/web/src/app/api/candidate/workbench/choice-optimizer/route.ts",
  "apps/web/src/app/api/candidate/workbench/cao-optimizer/route.ts"
];
for (const path of routes) {
  const source = read(path);
  if (!source.includes("verifyN06CandidateSession(request)")) failures.push(`${path}: request authentication missing`);
  if (!source.includes("if (!session.ok) return session.response")) failures.push(`${path}: auth failure is not returned`);
  if (!source.includes("return n06WorkbenchAdapterRequired()")) failures.push(`${path}: missing fail-closed adapter gate`);
  if (/candidateId:\s*body\.candidateId|routeId:\s*body\.routeId|parentApplicationId:\s*body\.parentApplicationId/.test(source)) {
    failures.push(`${path}: echoes untrusted caller-supplied identity/route IDs`);
  }
  if (/ok:\s*true|safeToProceed:\s*true|productionReady:\s*true/.test(source)) {
    failures.push(`${path}: reports a fabricated successful or production-ready result`);
  }
}

const confidence = read("packages/backend/src/n06/source-confidence-route-policy.ts");
if (!confidence.includes("VERIFIED_CONFIDENCE") || !confidence.includes("requires source URL")) {
  failures.push("Official route instructions must require verified source confidence and a source URL");
}
const safety = read("packages/backend/src/n06/route-instruction-safety-policy.ts");
if (!safety.includes("no-guarantee language")) failures.push("Route instruction safety must enforce no-guarantee language");
const cao = read("packages/backend/src/n06/cao-choice-optimizer.ts");
if (!cao.includes("countsAsOneKingsmenApplication: true") || !cao.includes("countsAsSeparateKingsmenApplication: false")) {
  failures.push("CAO child choices must remain under one Kingsmen parent application");
}

const result = { schema: "kingsmen.n06-workbench-security-contract.v1", passed: failures.length === 0, productionReady: false, failures };
if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
