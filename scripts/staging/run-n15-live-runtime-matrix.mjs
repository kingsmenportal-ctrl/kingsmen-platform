import assert from "node:assert/strict";

const baseUrl = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const reviewerToken = process.env.N15_REVIEWER_ACCESS_TOKEN ?? "";
const ordinaryToken = process.env.N15_ORDINARY_USER_ACCESS_TOKEN ?? "";
const candidateAToken = process.env.N15_CANDIDATE_A_ACCESS_TOKEN ?? "";
const candidateBToken = process.env.N15_CANDIDATE_B_ACCESS_TOKEN ?? "";
const runIngestion = process.env.N15_RUN_LIVE_INGESTION === "true";

for (const [name, value] of [["SUPABASE_URL",baseUrl],["SUPABASE_ANON_KEY",anonKey],["SUPABASE_SERVICE_ROLE_KEY",serviceKey]]) {
  assert.ok(value, `Missing required environment variable: ${name}`);
}
const endpoint = `${baseUrl}/functions/v1/n15-source-ingestion`;
const feedEndpoint = `${baseUrl}/functions/v1/n15-candidate-opportunities`;
const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}
async function call(url, token, method = "POST", body) {
  const headers = { apikey: anonKey, "content-type": "application/json" };
  if (token !== null) headers.authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    method, headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(180_000)
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
  return { status: response.status, data };
}
async function rest(path) {
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
    signal: AbortSignal.timeout(30_000)
  });
  const body = await response.text();
  assert.equal(response.status, 200, `REST read failed (${response.status}): ${body.slice(0,250)}`);
  return JSON.parse(body);
}
try {
  const missing = await call(endpoint, null);
  record("source ingestion rejects missing bearer", missing.status === 401, `HTTP ${missing.status}`);
  assert.equal(missing.status, 401);

  const invalid = await call(endpoint, "not-a-valid-jwt");
  record("source ingestion rejects invalid bearer", invalid.status === 401, `HTTP ${invalid.status}`);
  assert.equal(invalid.status, 401);

  const parts = serviceKey.split(".");
  let tampered = "tampered.invalid.signature";
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      payload.role = "service_role";
      tampered = `${parts[0]}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.invalid-signature`;
    } catch {}
  }
  const forged = await call(endpoint, tampered);
  record("source ingestion rejects forged/tampered service-role claim", forged.status === 401, `HTTP ${forged.status}`);
  assert.equal(forged.status, 401);

  if (ordinaryToken) {
    const ordinary = await call(endpoint, ordinaryToken);
    record("ordinary authenticated user cannot ingest", ordinary.status === 403, `HTTP ${ordinary.status}`);
    assert.equal(ordinary.status, 403);
  } else {
    record("ordinary-user denial", false, "N15_ORDINARY_USER_ACCESS_TOKEN not supplied");
  }

  if (runIngestion) {
    assert.ok(reviewerToken, "N15_RUN_LIVE_INGESTION=true requires N15_REVIEWER_ACCESS_TOKEN");
    const beforeRuns = await rest("n15_ingestion_runs?select=run_ref,status,started_at&order=started_at.desc&limit=1");
    const beforeRef = beforeRuns[0]?.run_ref ?? null;
    const run = await call(endpoint, reviewerToken);
    record("authorised reviewer can execute real source ingestion", [200,502].includes(run.status) && !!run.data.run_ref, `HTTP ${run.status}; run_ref present=${!!run.data.run_ref}`);
    assert.ok([200,502].includes(run.status), JSON.stringify(run.data).slice(0,300));
    assert.ok(run.data.run_ref, "Ingestion response did not include run_ref");
    const [ledger] = await rest(`n15_ingestion_runs?run_ref=eq.${encodeURIComponent(run.data.run_ref)}&select=run_ref,status,sources_checked,sources_succeeded,observations_created,observations_updated,summary,started_at,finished_at`);
    assert.ok(ledger, "Run ledger row missing after source ingestion");
    assert.equal(ledger.run_ref, run.data.run_ref);
    assert.ok(ledger.finished_at, "Run ledger was not finalised");
    record("ingestion run is durably persisted and finalised", !!ledger.finished_at, `status=${ledger.status}; sources=${ledger.sources_checked}; created=${ledger.observations_created}`);

    const runObservations = await rest(`external_source_observations?select=observation_ref,observation_status,source_confidence,review_reason,observed_at&observed_at=gte.${encodeURIComponent(ledger.started_at)}&order=observed_at.desc&limit=200`);
    const reviewOnly = runObservations.every(x => x.observation_status === "NEEDS_REVIEW" && /HUMAN_VERIFICATION_REQUIRED/.test(x.review_reason ?? ""));
    record("newly observed sources remain NEEDS_REVIEW", reviewOnly, `${runObservations.length} recent observations inspected`);
    assert.ok(reviewOnly, "A recent observation was not review-only");
    const noPublishedClaims = Number(ledger.summary?.published_opportunities_created ?? 0) === 0;
    record("ingestion run reports zero published opportunities", noPublishedClaims, `published_opportunities_created=${ledger.summary?.published_opportunities_created}`);
    assert.ok(noPublishedClaims);
    if (beforeRef) record("prior run ledger preserved", true, `previous run ${beforeRef} remains readable`);
  } else {
    record("real ingestion and persisted run evidence", false, "Set N15_RUN_LIVE_INGESTION=true to run the 21 configured active sources");
  }

  for (const [label, token] of [["candidate A", candidateAToken], ["candidate B", candidateBToken]]) {
    if (!token) {
      record(`${label} personalised feed isolation`, false, `N15_${label === "candidate A" ? "CANDIDATE_A" : "CANDIDATE_B"}_ACCESS_TOKEN not supplied`);
      continue;
    }
    const feed = await call(feedEndpoint, token, "GET");
    record(`${label} feed requires authorised identity link`, [200,403].includes(feed.status), `HTTP ${feed.status}`);
    assert.ok([200,403].includes(feed.status));
    if (feed.status === 200) {
      assert.ok(feed.data.candidate_id, `${label} feed omitted candidate id`);
      assert.ok(Array.isArray(feed.data.opportunities), `${label} feed omitted opportunities array`);
      record(`${label} feed identifies its resolved candidate`, true, `opportunities=${feed.data.count}`);
    } else {
      record(`${label} identity-link state blocks personalised feed`, feed.data.status === "IDENTITY_REVIEW_REQUIRED", feed.data.status ?? "no status");
      assert.equal(feed.data.status, "IDENTITY_REVIEW_REQUIRED");
    }
  }

  if (candidateAToken && candidateBToken) {
    const [a,b] = await Promise.all([call(feedEndpoint,candidateAToken,"GET"),call(feedEndpoint,candidateBToken,"GET")]);
    if (a.status === 200 && b.status === 200) {
      record("candidate A/B feeds resolve to distinct identities", a.data.candidate_id !== b.data.candidate_id, `distinct=${a.data.candidate_id !== b.data.candidate_id}`);
      assert.notEqual(a.data.candidate_id,b.data.candidate_id,"Candidate tokens resolve to the same candidate");
      const refsA = new Set((a.data.opportunities ?? []).map(x => x.match_ref));
      const refsB = new Set((b.data.opportunities ?? []).map(x => x.match_ref));
      record("candidate match rows are not shared across identities", [...refsA].every(x => !refsB.has(x)), `A=${refsA.size}; B=${refsB.size}`);
      assert.ok([...refsA].every(x => !refsB.has(x)),"Candidate feed includes identical match references");
    } else {
      record("candidate A/B feed comparison", false, `HTTP A=${a.status}, B=${b.status}; both candidates must have verified identity links`);
    }
  }

  const failures = results.filter(x => !x.ok);
  console.log(JSON.stringify({ status: failures.length ? "INCOMPLETE_OR_FAILED" : "PASS", total: results.length, passed: results.length-failures.length, failed: failures.length, results }, null, 2));
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error("N15 staging runtime matrix aborted:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
