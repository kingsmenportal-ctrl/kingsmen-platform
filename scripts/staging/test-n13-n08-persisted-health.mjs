import assert from "node:assert/strict";

const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!baseUrl || !serviceKey) {
  console.error("BLOCKED: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the isolated staging runner.");
  process.exit(2);
}
const functionUrl = `${baseUrl}/functions/v1/n08-founder-control-plane-health`;
const runRef = `n13_n08_drill_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
const refs = {
  incident: `${runRef}_incident`,
  service: `${runRef}_service`,
  snapshot: `${runRef}_snapshot`,
};

async function rest(table, method, query, body) {
  const response = await fetch(`${baseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const safeText = (await response.text()).slice(0, 300);
    throw new Error(`STAGING_FIXTURE_${method}_FAILED table=${table} status=${response.status} detail=${safeText}`);
  }
}
async function cleanup() {
  const filters = [
    ["incident_events", `incident_ref=eq.${encodeURIComponent(refs.incident)}`],
    ["service_health_checks", `check_ref=eq.${encodeURIComponent(refs.service)}`],
    ["system_health_snapshots", `snapshot_ref=eq.${encodeURIComponent(refs.snapshot)}`],
  ];
  const errors = [];
  for (const [table, query] of filters) {
    try { await rest(table, "DELETE", query); } catch (error) { errors.push(`${table}:${String(error).slice(0, 160)}`); }
  }
  if (errors.length) throw new Error(`CLEANUP_FAILED ${errors.join("; ")}`);
}
async function readStatus(expected) {
  const response = await fetch(functionUrl, {
    method: "GET",
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
  });
  const body = await response.json().catch(() => ({}));
  assert.equal(response.status, 200, `health endpoint HTTP ${response.status}`);
  assert.equal(body.persistedHealth?.status, expected,
    `expected persisted health ${expected}, got ${body.persistedHealth?.status ?? "missing"}`);
  assert.equal(body.productionReady, false, "health probe must never mark production ready");
  return body;
}
async function setService(status) {
  await rest("service_health_checks", "POST", "on_conflict=check_ref", [{
    check_ref: refs.service,
    service_name: "ISOLATED_N13_HEALTH_DRILL",
    service_domain: "UNKNOWN",
    status,
    latency_ms: 1,
    error_rate: status === "UP" ? 0 : 1,
    reason: "Synthetic isolated N13/N08 transition test; no candidate data.",
    fix_path: "Remove isolated fixture after verification.",
    evidence_refs: [runRef],
    checked_at: new Date().toISOString(),
  }]);
}
async function setSnapshot(status, incidentCount) {
  await rest("system_health_snapshots", "POST", "on_conflict=snapshot_ref", [{
    snapshot_ref: refs.snapshot,
    status,
    active_candidates: 0,
    active_candidate_cap: 500,
    pending_workflows: 0,
    failed_workflows: 0,
    document_backlog: 0,
    manual_fallback_backlog: 0,
    payment_pending_count: 0,
    source_review_backlog: 0,
    incident_open_count: incidentCount,
    oracle_lite_pressure: "LOW",
    summary: "Synthetic isolated N13/N08 health drill; no candidate data.",
    evidence_refs: [runRef],
    captured_at: new Date().toISOString(),
  }]);
}
async function setIncident(severity, status = "OPEN") {
  await rest("incident_events", "POST", "on_conflict=incident_ref", [{
    incident_ref: refs.incident,
    title: "Synthetic isolated N13/N08 health drill",
    severity,
    status,
    incident_domain: "SYSTEM",
    cause: "CONTROLLED_TEST_FAILURE",
    reason: "Synthetic isolated N13/N08 health drill; no candidate data.",
    fix_path: "Automatically deleted by the staging runner.",
    evidence_refs: [runRef],
    opened_at: new Date().toISOString(),
  }]);
}
try {
  // Fail closed if the fixture namespace collides with pre-existing data.
  await cleanup();
  await setService("UP");
  await setSnapshot("GREEN", 0);
  let body = await readStatus("GREEN");
  console.log(JSON.stringify({ test: "fresh healthy sources", passed: true, status: body.persistedHealth.status, runRef }));

  await setIncident("SEV2");
  await setSnapshot("AMBER", 1);
  body = await readStatus("AMBER");
  console.log(JSON.stringify({ test: "open SEV2 incident", passed: true, status: body.persistedHealth.status, runRef }));

  await setIncident("SEV1");
  await setSnapshot("RED", 1);
  body = await readStatus("RED");
  console.log(JSON.stringify({ test: "open SEV1 incident", passed: true, status: body.persistedHealth.status, runRef }));

  await rest("incident_events", "DELETE", `incident_ref=eq.${encodeURIComponent(refs.incident)}`);
  await setService("DOWN");
  await setSnapshot("RED", 0);
  body = await readStatus("RED");
  console.log(JSON.stringify({ test: "down service", passed: true, status: body.persistedHealth.status, runRef }));
} finally {
  await cleanup();
  console.log(JSON.stringify({ cleanup: "passed", runRef, candidateDataUsed: false }));
}
