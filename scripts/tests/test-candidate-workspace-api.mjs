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

function send(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}
function rowsForCandidate(url, candidateId) {
  return url.searchParams.get("candidate_id") === `eq.${candidateId}`;
}

const mock = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${mockPort}`);
  const authorization = request.headers.authorization ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (url.pathname === "/auth/v1/user") {
    if (token !== "candidate-a" && token !== "candidate-b" && token !== "unlinked") return send(response, 401, { message: "Invalid JWT" });
    const id = token === "candidate-a" ? userA : token === "candidate-b" ? userB : userUnlinked;
    return send(response, 200, { id });
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
    const row = readiness.get(candidateId);
    return send(response, 200, row ? [row] : []);
  }
  if (table === "candidate_workspace_readiness" && request.method === "POST") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const item = JSON.parse(body);
    const previous = readiness.get(item.candidate_id);
    const saved = { ...item, revision: previous ? previous.revision + 1 : 1 };
    readiness.set(item.candidate_id, saved);
    return send(response, 201, [saved]);
  }
  if (table === "candidate_workspace_saved_opportunities" && request.method === "GET") {
    const candidateId = url.searchParams.get("candidate_id")?.replace(/^eq\./, "");
    return send(response, 200, opportunities.filter((item) => item.candidate_id === candidateId).map(({ candidate_id, ...item }) => item));
  }
  if (table === "candidate_workspace_saved_opportunities" && request.method === "POST") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const item = JSON.parse(body);
    let saved = opportunities.find((entry) => entry.candidate_id === item.candidate_id && entry.official_url === item.official_url);
    if (saved) Object.assign(saved, item);
    else {
      const suffix = String(nextId++).padStart(12, "0");
      saved = { ...item, id: `33333333-3333-4333-8333-${suffix}`, created_at: new Date().toISOString() };
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
    } catch { /* Wait for Next to bind its port. */ }
    await delay(500);
  }
  throw new Error("Timed out waiting for the Next.js server.");
}

async function api(method, token, body, query = "") {
  return fetch(`http://127.0.0.1:${appPort}/api/candidate/workspace${query}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

try {
  await new Promise((resolve, reject) => {
    mock.once("error", reject);
    mock.listen(mockPort, "127.0.0.1", resolve);
  });
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(appPort)], {
    cwd: "apps/web",
    env: {
      ...process.env,
      SUPABASE_URL: `http://127.0.0.1:${mockPort}`,
      SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  app.stdout.on("data", (chunk) => { logs += chunk.toString(); });
  app.stderr.on("data", (chunk) => { logs += chunk.toString(); });
  await waitForApp();

  assert.equal((await api("GET")).status, 401, "missing token must be denied");
  assert.equal((await api("GET", "invalid-token")).status, 401, "invalid token must be denied");
  assert.equal((await api("GET", "unlinked")).status, 403, "unlinked account must be denied");

  const initial = await api("GET", "candidate-a");
  assert.equal(initial.status, 200);
  assert.equal((await initial.json()).source, "truth_vault");

  const savedAResponse = await api("POST", "candidate-a", {
    candidate_id: candidateB,
    title: "Candidate A opportunity",
    organisation: "Test Org A",
    url: "https://example.org/a",
    pathway: "employment",
    closingDate: "2027-01-31"
  });
  assert.equal(savedAResponse.status, 201, "verified candidate should save an opportunity");
  const savedA = (await savedAResponse.json()).opportunity;
  assert.equal(opportunities.find((item) => item.id === savedA.id).candidate_id, candidateA, "browser-supplied candidate ID must be ignored");

  const patch = await api("PATCH", "candidate-a", { tasks: ["profile", "evidence"], pathway: "employment" });
  assert.equal(patch.status, 200, "verified candidate should save readiness");
  const reloadA = await api("GET", "candidate-a");
  const stateA = await reloadA.json();
  assert.deepEqual(stateA.readiness.tasks, ["profile", "evidence"], "readiness must survive a reload");
  assert.equal(stateA.readiness.pathway, "employment");
  assert.equal(stateA.opportunities.length, 1);

  const savedBResponse = await api("POST", "candidate-b", {
    title: "Candidate B opportunity",
    organisation: "Test Org B",
    url: "https://example.org/b",
    pathway: "tvet",
    closingDate: ""
  });
  assert.equal(savedBResponse.status, 201);
  const savedB = (await savedBResponse.json()).opportunity;

  assert.equal((await api("DELETE", "candidate-a", undefined, `?id=${encodeURIComponent(savedB.id)}`)).status, 404,
    "candidate A must not delete candidate B's saved opportunity");
  assert.equal((await api("GET", "candidate-b").then((response) => response.json())).opportunities.length, 1,
    "candidate B's saved opportunity must remain intact");
  assert.equal((await api("DELETE", "candidate-a", undefined, `?id=${encodeURIComponent(savedA.id)}`)).status, 200);
  assert.equal((await api("GET", "candidate-a").then((response) => response.json())).opportunities.length, 0);

  console.log("Candidate workspace API integration test PASSED: auth denial, verified identity resolution, readiness persistence/reload, saved-opportunity create/delete, spoofed owner rejection, and cross-candidate isolation.");
} catch (error) {
  console.error(error);
  if (logs) console.error("Next.js server logs:\n" + logs.slice(-8000));
  process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) app.kill("SIGTERM");
  await new Promise((resolve) => mock.close(resolve));
}
