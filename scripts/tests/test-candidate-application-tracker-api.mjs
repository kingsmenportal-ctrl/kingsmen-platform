import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const mockPort = 3011;
const appPort = 3002;
const candidateA = "11111111-1111-4111-8111-111111111111";
const candidateB = "22222222-2222-4222-8222-222222222222";
const userA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const unlinked = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const opportunityA = "33333333-3333-4333-8333-333333333331";
const opportunityB = "33333333-3333-4333-8333-333333333332";
const saved = [
  { id: opportunityA, candidate_id: candidateA, title: "A opportunity", organisation: "Org A", official_url: "https://example.org/a", pathway: "employment", closing_date: null, created_at: new Date().toISOString() },
  { id: opportunityB, candidate_id: candidateB, title: "B opportunity", organisation: "Org B", official_url: "https://example.org/b", pathway: "tvet", closing_date: null, created_at: new Date().toISOString() }
];
const trackers = [];
const events = [];
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
function eqParam(url, key) { return (url.searchParams.get(key) ?? "").replace(/^eq\./, ""); }
function addEvent(item, previousStatus = null) {
  events.unshift({
    id: `eeeeeeee-eeee-4eee-8eee-${String(nextId++).padStart(12, "0")}`,
    tracker_id: item.id, candidate_id: item.candidate_id, previous_status: previousStatus,
    new_status: item.status, candidate_note: item.candidate_note,
    evidence_reference: item.evidence_reference, changed_at: new Date().toISOString()
  });
}

const mock = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${mockPort}`);
  const token = (request.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  if (url.pathname === "/auth/v1/user") {
    const ids = { "candidate-a": userA, "candidate-b": userB, unlinked };
    return ids[token] ? send(response, 200, { id: ids[token] }) : send(response, 401, { message: "Invalid JWT" });
  }
  if (!url.pathname.startsWith("/rest/v1/") || token !== "test-service-key") return send(response, 401, { message: "Unexpected mock request" });
  const table = url.pathname.slice("/rest/v1/".length);
  if (table === "candidate_auth_identity_links" && request.method === "GET") {
    const id = eqParam(url, "supabase_user_id");
    const candidate_id = id === userA ? candidateA : id === userB ? candidateB : null;
    return send(response, 200, candidate_id ? [{ candidate_id, supabase_user_id: id }] : []);
  }
  if (table === "candidate_workspace_saved_opportunities" && request.method === "GET") {
    const candidateId = eqParam(url, "candidate_id");
    const id = eqParam(url, "id");
    return send(response, 200, saved.filter((item) => item.candidate_id === candidateId && (!id || item.id === id)).map(({ id, ...rest }) => ({ id, ...rest })));
  }
  if (table === "candidate_application_tracker" && request.method === "GET") {
    const candidateId = eqParam(url, "candidate_id");
    return send(response, 200, trackers.filter((item) => item.candidate_id === candidateId));
  }
  if (table === "candidate_application_tracker_events" && request.method === "GET") {
    const candidateId = eqParam(url, "candidate_id");
    return send(response, 200, events.filter((item) => item.candidate_id === candidateId));
  }
  if (table === "candidate_application_tracker" && request.method === "POST") {
    const body = await bodyOf(request);
    const opportunity = saved.find((item) => item.id === body.saved_opportunity_id && item.candidate_id === body.candidate_id);
    if (!opportunity) return send(response, 409, { message: "saved opportunity owner mismatch" });
    let item = trackers.find((row) => row.candidate_id === body.candidate_id && row.saved_opportunity_id === body.saved_opportunity_id);
    if (!item) {
      item = {
        ...body, id: `dddddddd-dddd-4ddd-8ddd-${String(nextId++).padStart(12, "0")}`,
        candidate_note: "", evidence_reference: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      trackers.push(item);
      addEvent(item);
    }
    return send(response, 201, [item]);
  }
  if (table === "candidate_application_tracker" && request.method === "PATCH") {
    const id = eqParam(url, "id");
    const candidateId = eqParam(url, "candidate_id");
    const item = trackers.find((row) => row.id === id && row.candidate_id === candidateId);
    if (!item) return send(response, 200, []);
    const body = await bodyOf(request);
    const previousStatus = item.status;
    Object.assign(item, body);
    item.updated_at = new Date().toISOString();
    if (previousStatus !== item.status || body.candidate_note !== undefined || body.evidence_reference !== undefined) addEvent(item, previousStatus);
    return send(response, 200, [item]);
  }
  if (table === "candidate_application_tracker" && request.method === "DELETE") {
    const id = eqParam(url, "id");
    const candidateId = eqParam(url, "candidate_id");
    const index = trackers.findIndex((row) => row.id === id && row.candidate_id === candidateId);
    if (index < 0) return send(response, 200, []);
    const [removed] = trackers.splice(index, 1);
    for (let i = events.length - 1; i >= 0; i -= 1) if (events[i].tracker_id === removed.id) events.splice(i, 1);
    return send(response, 200, [{ id: removed.id }]);
  }
  return send(response, 404, { message: `Unhandled mock route ${request.method} ${url.pathname}` });
});

async function waitForApp() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`Next server exited early with code ${app.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}/api/candidate/applications`);
      if (response.status === 401 || response.status === 503) return;
    } catch { /* Wait for Next.js to bind. */ }
    await delay(500);
  }
  throw new Error("Timed out waiting for Next.js.");
}
async function api(method, token, body, query = "") {
  return fetch(`http://127.0.0.1:${appPort}/api/candidate/applications${query}`, {
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

  assert.equal((await api("GET")).status, 401, "missing session denied");
  assert.equal((await api("GET", "invalid")).status, 401, "invalid session denied");
  assert.equal((await api("GET", "unlinked")).status, 403, "unlinked account denied");
  assert.equal((await api("GET", "candidate-a")).status, 200, "verified candidate can load tracker");

  const crossOwner = await api("POST", "candidate-a", { savedOpportunityId: opportunityB });
  assert.equal(crossOwner.status, 404, "candidate cannot track another candidate's saved opportunity");
  const create = await api("POST", "candidate-a", { savedOpportunityId: opportunityA });
  assert.equal(create.status, 201, "candidate can start tracking own saved opportunity");
  const tracker = (await create.json()).application;
  assert.equal(tracker.candidate_id, candidateA, "server derives candidate ownership");
  assert.equal(trackers.length, 1);

  const missingEvidence = await api("PATCH", "candidate-a", {
    id: tracker.id, status: "SUBMITTED_CANDIDATE_REPORTED", candidateNote: "Applied",
    evidenceReference: ""
  });
  assert.equal(missingEvidence.status, 400, "reported submission requires evidence");
  const update = await api("PATCH", "candidate-a", {
    id: tracker.id, status: "SUBMITTED_CANDIDATE_REPORTED", candidateNote: "Applied through official portal",
    evidenceReference: "confirmation-123"
  });
  assert.equal(update.status, 200, "candidate can record evidenced submission claim");
  const result = await update.json();
  assert.equal(result.application.status, "SUBMITTED_CANDIDATE_REPORTED");
  assert.equal(events.at(-1)?.new_status === "SUBMITTED_CANDIDATE_REPORTED" || events[0]?.new_status === "SUBMITTED_CANDIDATE_REPORTED", true,
    "status changes create an audit event");

  const candidateBRead = await api("GET", "candidate-b");
  assert.equal((await candidateBRead.json()).applications.length, 0, "candidate B cannot see candidate A tracker");
  assert.equal((await api("PATCH", "candidate-b", {
    id: tracker.id, status: "CLOSED", candidateNote: "", evidenceReference: ""
  })).status, 404, "candidate B cannot update candidate A tracker");

  const history = await (await api("GET", "candidate-a")).json();
  assert.ok(history.events.length >= 2, "candidate can read audit history");
  assert.equal((await api("DELETE", "candidate-a", undefined, `?id=${encodeURIComponent(tracker.id)}`)).status, 200);
  assert.equal(trackers.length, 0, "candidate can remove own tracker");
  assert.equal(events.some((event) => event.tracker_id === tracker.id), false, "removing tracker removes its retained notes/history");

  console.log("Candidate application tracker API integration PASSED: session gates, reviewed identity binding, cross-candidate isolation, saved-opportunity ownership, evidence-gated submission claims, audit history, and deletion cleanup.");
} catch (error) {
  console.error(error);
  if (logs) console.error("Next.js server logs:\n" + logs.slice(-8000));
  process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) app.kill("SIGTERM");
  await new Promise((resolve) => mock.close(resolve));
}
