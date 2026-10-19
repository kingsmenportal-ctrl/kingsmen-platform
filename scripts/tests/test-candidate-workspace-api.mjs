import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const mockPort = 3010;
const appPort = 3001;
const candidateA = "11111111-1111-4111-8111-111111111111";
const candidateB = "22222222-2222-4222-8222-222222222222";
const userA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const userUnlinked = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const readiness = new Map();
const opportunities = [];
let nextId = 3;
let app;
let logs = "";

function send(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

const mock = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${mockPort}`);
  const token = (request.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  if (url.pathname === "/auth/v1/user") {
    if (!["candidate-a", "candidate-b", "unlinked"].includes(token)) return send(response, 401, { message: "Invalid JWT" });
    return send(response, 200, { id: token === "candidate-a" ? userA : token === "candidate-b" ? userB : userUnlinked });
  }
  if (!url.pathname.startsWith("/rest/v1/") || token !== "test-service-key") return send(response, 401, { message: "Unexpected mock request" });
  const table = url.pathname.slice("/rest/v1/".length);
  if (table === "candidate_auth_identity_links" && request.method === "GET") {
    const id = url.searchParams.get("supabase_user_id")?.replace(/^eq\./, "");
    const candidateId = id === userA ? candidateA : id === userB ? candidateB : null;
    return send(response, 200, candidateId ? [{ candidate_id: candidateId, supabase_user_id: id }] : []);
  }
  if (table === "candidate_workspace_readiness" && request.method === "GET") {
    const candidateId = url.searchParams.get("candidate_id")?.replace(/^eq\./, "");
    return send(response, 200, readiness.has(candidateId) ? [readiness.get(candidateId)] : []);
  }
  if (table === "candidate_workspace_readiness" && request.method === "POST") {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    const previous = readiness.get(body.candidate_id);
    const saved = { ...body, revision: previous ? previous.revision + 1 : 1 };
    readiness.set(body.candidate_id, saved);
    return send(response, 201, [saved]);
  }
  if (table === "candidate_workspace_saved_opportunities" && request.method === "GET") {
    const candidateId = url.searchParams.get("candidate_id")?.replace(/^eq\./, "");
    return send(response, 200, opportunities.filter((item) => item.candidate_id === candidateId).map(({ candidate_id, ...item }) => item));
  }
  if (table === "candidate_workspace_saved_opportunities" && request.method === "POST") {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    let saved = opportunities.find((item) => item.candidate_id === body.candidate_id && item.official_url === body.official_url);
    if (saved) Object.assign(saved, body);
    else {
      saved = { ...body, id: `33333333-3333-4333-8333-${String(nextId++).padStart(12, "0")}`, created_at: new Date().toISOString() };
      opportunities.push(saved);
    }
    return send(response, 201, [saved]);
  }
  if (table === "candidate_workspace_saved_opportunities" && request.method === "DELETE") {
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    const candidateId = url.searchParams.get("candidate_id")?.replace(/^eq\./, "");
    const index = opportunities.findIndex((item) => item.id === id && item.candidate_id === candidateId);
    const deleted = index < 0 ? [] : [opportunities.splice(index, 1)[0]];
    return send(response, 200, deleted.map((item) => ({ id: item.id })));
  }
  return send(response, 404, { message: `Unhandled mock route ${request.method} ${url.pathname}` });
});

async function waitForApp() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`Next server exited early with code ${app.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}/api/candidate/workspace`);
      if (response.status === 401 || response.status === 503) return;
    } catch { /* Next has not bound the port yet. */ }
    await delay(500);
  }
  throw new Error("Timed out waiting for Next.js.");
}

async function api(method, token, body, query = "") {
  return fetch(`http://127.0.0.1:${appPort}/api/candidate/workspace${query}`, {
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

  assert.equal((await api("GET")).status, 401, "missing token denied");
  assert.equal((await api("GET", "invalid-token")).status, 401, "invalid token denied");
  assert.equal((await api("GET", "unlinked")).status, 403, "unlinked account denied");
  assert.equal((await api("GET", "candidate-a")).status, 200, "verified account can load workspace");

  const createA = await api("POST", "candidate-a", {
    candidate_id: candidateB, title: "Candidate A opportunity", organisation: "Test Org A",
    url: "https://example.org/a", pathway: "employment", closingDate: "2027-01-31"
  });
  assert.equal(createA.status, 201);
  const savedA = (await createA.json()).opportunity;
  assert.equal(opportunities.find((item) => item.id === savedA.id).candidate_id, candidateA, "browser cannot spoof candidate ownership");

  assert.equal((await api("PATCH", "candidate-a", { tasks: ["profile", "evidence"], pathway: "employment" })).status, 200);
  const reloaded = await (await api("GET", "candidate-a")).json();
  assert.deepEqual(reloaded.readiness.tasks, ["profile", "evidence"], "readiness survives reload");
  assert.equal(reloaded.readiness.pathway, "employment");
  assert.equal(reloaded.opportunities.length, 1);

  const createB = await api("POST", "candidate-b", {
    title: "Candidate B opportunity", organisation: "Test Org B",
    url: "https://example.org/b", pathway: "tvet", closingDate: ""
  });
  assert.equal(createB.status, 201);
  const savedB = (await createB.json()).opportunity;
  assert.equal((await api("DELETE", "candidate-a", undefined, `?id=${encodeURIComponent(savedB.id)}`)).status, 404,
    "candidate A cannot delete candidate B's record");
  assert.equal((await api("GET", "candidate-b").then((response) => response.json())).opportunities.length, 1);
  assert.equal((await api("DELETE", "candidate-a", undefined, `?id=${encodeURIComponent(savedA.id)}`)).status, 200);
  assert.equal((await api("GET", "candidate-a").then((response) => response.json())).opportunities.length, 0);

  console.log("Candidate workspace API integration PASSED: missing/invalid/unlinked auth, readiness save and reload, saved-opportunity create/delete, spoofed-owner rejection, and two-candidate isolation.");
} catch (error) {
  console.error(error);
  if (logs) console.error("Next.js server logs:\n" + logs.slice(-8000));
  process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) app.kill("SIGTERM");
  await new Promise((resolve) => mock.close(resolve));
}
