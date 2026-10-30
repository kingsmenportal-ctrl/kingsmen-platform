import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

const registeredStages = [500, 1000, 5000, 10000, 25000];
const stageCap = Number(__ENV.K6_STAGE_CAP || 500);
if (!registeredStages.includes(stageCap)) throw new Error("K6_STAGE_CAP_MUST_BE_REGISTERED");
const baseUrl = String(__ENV.K6_BASE_URL || "").replace(/\/+$/, "");
if (!baseUrl) throw new Error("K6_BASE_URL_REQUIRED");
const tokens = new SharedArray("candidate-fixture-tokens", function () {
  const value = JSON.parse(__ENV.K6_CANDIDATE_TOKENS || "[]");
  if (!Array.isArray(value) || value.some(token => typeof token !== "string" || !token.trim())) {
    throw new Error("K6_CANDIDATE_TOKENS_MUST_BE_JSON_ARRAY_OF_TOKENS");
  }
  return value;
});
const p95MaxMs = Number(__ENV.K6_P95_MAX_MS);
const maxErrorRate = Number(__ENV.K6_MAX_ERROR_RATE);
if (!Number.isFinite(p95MaxMs) || p95MaxMs <= 0) throw new Error("K6_P95_MAX_MS_REQUIRED");
if (!Number.isFinite(maxErrorRate) || maxErrorRate <= 0 || maxErrorRate >= 1) throw new Error("K6_MAX_ERROR_RATE_REQUIRED");

if (stageCap > 500) {
  const required = ["K6_PREVIOUS_STAGE_EVIDENCE_REF", "K6_FOUNDER_APPROVAL_REF", "K6_RISK_REVIEW_EVIDENCE_REF", "K6_BACKUP_RESTORE_EVIDENCE_REF", "K6_SECURITY_REVIEW_EVIDENCE_REF"];
  for (const name of required) if (!String(__ENV[name] || "").trim()) throw new Error(name + "_REQUIRED_BEFORE_GROWTH_STAGE");
}

export const options = {
  scenarios: {
    candidate_portal_read_only: {
      executor: "constant-vus",
      vus: stageCap,
      duration: __ENV.K6_DURATION || "5m"
    }
  },
  thresholds: {
    http_req_failed: ["rate<" + maxErrorRate],
    http_req_duration: ["p(95)<" + p95MaxMs],
    checks: ["rate>0.99"]
  }
};

function profileRequest(token) {
  return {
    method: "POST",
    url: baseUrl + "/api/candidate/profile",
    body: JSON.stringify({ action: "load" }),
    params: { headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, tags: { journey: "profile-read" } }
  };
}

export function setup() {
  if (tokens.length !== stageCap) throw new Error("EXPECTED_EXACTLY_" + stageCap + "_UNIQUE_CANDIDATE_TOKENS");
  if (new Set(tokens).size !== stageCap) throw new Error("CANDIDATE_TOKENS_MUST_BE_UNIQUE");
  const identities = new Set();
  const batchSize = 25;
  for (let offset = 0; offset < tokens.length; offset += batchSize) {
    const responses = http.batch(tokens.slice(offset, offset + batchSize).map(profileRequest));
    for (const response of responses) {
      let body = null;
      try { body = response.json(); } catch {}
      const valid = response.status === 200 && body && body.ok === true &&
        body.identityStatus === "VERIFIED" &&
        typeof body.candidateReference === "string" && body.candidateReference.length > 0;
      if (!valid) throw new Error("EVERY_FIXTURE_MUST_BE_A_VERIFIED_CANDIDATE_IDENTITY");
      identities.add(body.candidateReference);
    }
  }
  if (identities.size !== stageCap) throw new Error("EVERY_TOKEN_MUST_MAP_TO_A_DISTINCT_CANDIDATE");
  return { identityCount: identities.size };
}

export default function () {
  const token = tokens[__VU - 1];
  const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
  const profile = http.post(baseUrl + "/api/candidate/profile", JSON.stringify({ action: "load" }), { headers, tags: { journey: "profile-read" } });
  check(profile, {
    "profile read returns HTTP 200": response => response.status === 200,
    "profile identity remains verified": response => {
      try { const body = response.json(); return body && body.ok === true && body.identityStatus === "VERIFIED"; } catch { return false; }
    }
  });
  const applications = http.get(baseUrl + "/api/candidate/applications", { headers, tags: { journey: "application-tracker-read" } });
  check(applications, {
    "application tracker read returns HTTP 200": response => response.status === 200,
    "application tracker response is not cached": response => String(response.headers["Cache-Control"] || "").toLowerCase().includes("no-store")
  });
  sleep(1);
}
