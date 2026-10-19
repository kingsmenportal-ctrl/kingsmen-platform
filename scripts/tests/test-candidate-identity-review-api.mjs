import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const mockPort = 3011;
const appPort = 3002;
const candidateUser = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const reviewerUser = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const unprivilegedUser = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const candidateId = "11111111-1111-4111-8111-111111111111";
const requests = new Map();
const identityLinks = new Map();
const audit = [];
let nextId = 1;
let app;
let logs = "";

function send(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function bodyOf(request) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const mock = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${mockPort}`);
  const token = (request.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  if (url.pathname === "/auth/v1/user") {
    const users = { "candidate-token": candidateUser, "reviewer-token": reviewerUser, "unprivileged-token": unprivilegedUser };
    if (!users[token]) return send(response, 401, { message: "Invalid JWT" });
    return send(response, 200, { id: users[token] });
  }
  if (!url.pathname.startsWith("/rest/v1/") || token !== "test-service-key") {
    return send(response, 401, { message: "Unexpected mock request" });
  }

  const resource = url.pathname.slice("/rest/v1/".length);
  if (resource === "platform_reviewers" && request.method === "GET") {
    const id = url.searchParams.get("auth_user_id")?.replace(/^eq\./, "");
    return send(response, 200, id === reviewerUser ? [{ id: "reviewer-row" }] : []);
  }
  if (resource === "candidate_identity_review_requests" && request.method === "POST") {
    const body = await bodyOf(request);
    if ([...requests.values()].some((item) => item.supabase_user_id === body.supabase_user_id && ["PENDING", "NEEDS_INFORMATION"].includes(item.request_status))) {
      return send(response, 409, { message: "duplicate key candidate_identity_review_one_open_request_per_user" });
    }
    const item = {
      id: `99999999-9999-4999-8999-${String(nextId++).padStart(12, "0")}`,
      ...body, candidate_response: "", reviewer_note: null, reviewed_by: null, reviewed_at: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    requests.set(item.id, item);
    return send(response, 201, [item]);
  }
  if (resource === "candidate_identity_review_requests" && request.method === "GET") {
    const owner = url.searchParams.get("supabase_user_id")?.replace(/^eq\./, "");
    const openOnly = url.searchParams.has("or");
    const rows = [...requests.values()].filter((item) =>
      owner ? item.supabase_user_id === owner : (!openOnly || ["PENDING", "NEEDS_INFORMATION"].includes(item.request_status))
    ).sort((a, b) => a.created_at.localeCompare(b.created_at));
    return send(response, 200, rows.map(({ supabase_user_id, ...item }) => item));
  }
  if (resource === "rpc/respond_candidate_identity_review" && request.method === "POST") {
    const body = await bodyOf(request);
    const item = requests.get(body.p_request_id);
    if (!item || item.supabase_user_id !== body.p_candidate_auth_user_id) return send(response, 404, { message: "not found P0002" });
    if (item.request_status !== "NEEDS_INFORMATION") return send(response, 409, { message: "not awaiting candidate information 55000" });
    item.candidate_response = body.p_message;
    item.request_status = "PENDING";
    item.reviewer_note = null;
    item.updated_at = new Date().toISOString();
    audit.push({ action: "CANDIDATE_RESPONSE", request_id: item.id, actor: body.p_candidate_auth_user_id });
    return send(response, 200, { request_id: item.id, status: item.request_status });
  }
  if (resource === "rpc/decide_candidate_identity_review" && request.method === "POST") {
    const body = await bodyOf(request);
    if (body.p_reviewer_auth_user_id !== reviewerUser) return send(response, 403, { message: "not authorised 42501" });
    const item = requests.get(body.p_request_id);
    if (!item) return send(response, 404, { message: "not found P0002" });
    if (!["PENDING", "NEEDS_INFORMATION"].includes(item.request_status)) return send(response, 409, { message: "no longer open 55000" });
    let linkedCandidate = null;
    if (body.p_decision === "APPROVED") {
      if (body.p_candidate_reference !== "CAND-001") return send(response, 404, { message: "candidate reference not found P0002" });
      if ([...identityLinks.values()].some((link) => link.candidate_id === candidateId && link.supabase_user_id !== item.supabase_user_id)) {
        return send(response, 409, { message: "already linked 23505" });
      }
      const link = { candidate_id: candidateId, supabase_user_id: item.supabase_user_id, link_status: "VERIFIED", verified_at: new Date().toISOString() };
      identityLinks.set(item.supabase_user_id, link);
      linkedCandidate = candidateId;
      item.request_status = "APPROVED";
      item.reviewed_by = reviewerUser;
      item.reviewed_at = new Date().toISOString();
    } else if (body.p_decision === "REJECTED") {
      item.request_status = "REJECTED";
      item.reviewed_by = reviewerUser;
      item.reviewed_at = new Date().toISOString();
    } else {
      item.request_status = "NEEDS_INFORMATION";
      item.reviewed_by = null;
      item.reviewed_at = null;
    }
    item.reviewer_note = body.p_note;
    item.updated_at = new Date().toISOString();
    audit.push({ action: body.p_decision, request_id: item.id, actor: reviewerUser });
    return send(response, 200, { request_id: item.id, status: item.request_status, candidate_id: linkedCandidate });
  }
  if (resource === "candidate_auth_identity_links" && request.method === "GET") {
    const id = url.searchParams.get("supabase_user_id")?.replace(/^eq\./, "");
    const link = identityLinks.get(id);
    return send(response, 200, link ? [link] : []);
  }
  if (resource === "candidate_workspace_readiness" && request.method === "GET") return send(response, 200, []);
  if (resource === "candidate_workspace_saved_opportunities" && request.method === "GET") return send(response, 200, []);
  return send(response, 404, { message: `Unhandled mock route ${request.method} ${url.pathname}` });
});

async function waitForApp() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`Next server exited early with code ${app.exitCode}: ${logs}`);
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}/api/candidate/identity-review`);
      if ([401, 503].includes(response.status)) return;
    } catch { /* Next has not bound the port yet. */ }
    await delay(500);
  }
  throw new Error("Timed out waiting for Next.js.");
}

async function api(path, method, token, body) {
  return fetch(`http://127.0.0.1:${appPort}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

try {
  await new Promise((resolve, reject) => { mock.once("error", reject); mock.listen(mockPort, "127.0.0.1", resolve); });
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(appPort)], {
    cwd: "apps/web",
    env: { ...process.env, SUPABASE_URL: `http://127.0.0.1:${mockPort}`, SUPABASE_ANON_KEY: "test-anon-key", SUPABASE_SERVICE_ROLE_KEY: "test-service-key" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  app.stdout.on("data", (chunk) => { logs += chunk.toString(); });
  app.stderr.on("data", (chunk) => { logs += chunk.toString(); });
  await waitForApp();

  assert.equal((await api("/api/candidate/identity-review", "GET")).status, 401, "candidate endpoint denies missing session");
  assert.equal((await api("/api/candidate/identity-review", "GET", "bad-token")).status, 401, "candidate endpoint denies invalid session");
  assert.equal((await api("/api/reviewer/identity-review", "GET", "candidate-token")).status, 403, "candidate cannot access reviewer queue");
  assert.equal((await api("/api/reviewer/identity-review", "GET", "unprivileged-token")).status, 403, "unprivileged account cannot access reviewer queue");

  const submitted = await api("/api/candidate/identity-review", "POST", "candidate-token", {
    candidateReference: "CAND-001", claimantName: "Test Candidate", message: "Please review my existing candidate record."
  });
  assert.equal(submitted.status, 201, "authenticated candidate can submit a review request");
  const request = (await submitted.json()).request;
  assert.equal(request.supabase_user_id, undefined, "candidate API does not expose internal owner id");

  assert.equal((await api("/api/candidate/identity-review", "POST", "candidate-token", {
    candidateReference: "CAND-001", claimantName: "Test Candidate", message: "Duplicate request should fail."
  })).status, 409, "one open request per candidate account");

  const ownRequests = await (await api("/api/candidate/identity-review", "GET", "candidate-token")).json();
  assert.equal(ownRequests.requests.length, 1, "candidate can see own request");
  assert.equal((await api("/api/reviewer/identity-review", "GET", "reviewer-token")).status, 200, "authorised reviewer can load queue");

  assert.equal((await api("/api/reviewer/identity-review", "PATCH", "reviewer-token", {
    requestId: request.id, decision: "NEEDS_INFORMATION", note: "Please confirm the exact candidate reference."
  })).status, 200, "reviewer can request more information");

  assert.equal((await api("/api/candidate/identity-review", "PATCH", "candidate-token", {
    requestId: request.id, message: "The exact reference is CAND-001."
  })).status, 200, "candidate can answer follow-up request");
  assert.equal(requests.get(request.id).request_status, "PENDING", "candidate response returns request to queue");

  assert.equal((await api("/api/reviewer/identity-review", "PATCH", "reviewer-token", {
    requestId: request.id, decision: "APPROVED", candidateReference: "CAND-001", note: "Matched authoritative active candidate record."
  })).status, 200, "reviewer can approve exact candidate record");

  const linkedWorkspace = await api("/api/candidate/workspace", "GET", "candidate-token");
  assert.equal(linkedWorkspace.status, 200, "approved verified identity unlocks authenticated candidate workspace");
  assert.equal((await linkedWorkspace.json()).source, "truth_vault", "workspace is loaded from Truth Vault");
  assert.equal(identityLinks.get(candidateUser).candidate_id, candidateId, "approval creates verified link to exact candidate");
  assert.deepEqual(audit.map((item) => item.action), ["NEEDS_INFORMATION", "CANDIDATE_RESPONSE", "APPROVED"], "each transition records an audit event");

  assert.equal((await api("/api/reviewer/identity-review", "PATCH", "reviewer-token", {
    requestId: request.id, decision: "REJECTED", note: "Second decision must be denied."
  })).status, 409, "closed request cannot be decided twice");

  console.log("Candidate identity review API integration: 15 assertions passed");
} catch (error) {
  console.error(error);
  console.error(logs.slice(-12000));
  process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) app.kill("SIGTERM");
  await new Promise((resolve) => mock.close(resolve));
}
