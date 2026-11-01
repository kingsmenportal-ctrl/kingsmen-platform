"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type HealthStatus = "GREEN" | "AMBER" | "RED" | "UNKNOWN";

type Snapshot = {
  snapshot_ref?: string;
  status?: HealthStatus;
  active_candidates?: number | null;
  active_candidate_cap?: number | null;
  pending_workflows?: number | null;
  failed_workflows?: number | null;
  document_backlog?: number | null;
  manual_fallback_backlog?: number | null;
  payment_pending_count?: number | null;
  source_review_backlog?: number | null;
  incident_open_count?: number | null;
  oracle_lite_pressure?: string | null;
  summary?: string | null;
  captured_at?: string | null;
};

type ServiceCheck = {
  check_ref?: string;
  service_name?: string;
  service_domain?: string;
  status?: string;
  latency_ms?: number | null;
  reason?: string | null;
  fix_path?: string | null;
  checked_at?: string | null;
};

type RuntimeResponse = {
  schema?: string;
  status?: HealthStatus;
  coverage?: string;
  productionReady?: boolean;
  latestSnapshot?: Snapshot | null;
  serviceChecks?: ServiceCheck[];
  sourceOfTruth?: string;
  snapshotRef?: string;
  capturedAt?: string;
  captureDurationMs?: number;
  aggregateMetrics?: Record<string, unknown>;
  dataErrors?: number;
  retryAfterSeconds?: number;
  note?: string;
};

type RuntimeError = Error & { status?: number; runtimeStatus?: string; retryAfterSeconds?: number };

function readFounderAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const token = (parsed as { access_token?: unknown }).access_token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

function statusTone(status: HealthStatus | undefined): string {
  switch (status) {
    case "GREEN": return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
    case "AMBER": return "border-amber-400/40 bg-amber-400/10 text-amber-100";
    case "RED": return "border-rose-400/40 bg-rose-400/10 text-rose-200";
    default: return "border-slate-500/50 bg-slate-700/30 text-slate-200";
  }
}

function describeFailure(error: unknown): string {
  const e = error as RuntimeError;
  if (e?.status === 401) return "Authentication failed. Sign in again before accessing founder observability.";
  if (e?.status === 403) return "The signed-in account does not have an active PLATFORM_ADMIN founder grant.";
  if (e?.status === 404) return "The N13 Edge Function is not deployed at the configured staging project. Runtime deployment is still pending.";
  if (e?.status === 429) {
    const seconds = Number.isFinite(e.retryAfterSeconds) ? e.retryAfterSeconds : null;
    return seconds ? "A capture was recorded recently. Try again in approximately " + seconds + " seconds." : "A capture was recorded recently. Wait for the rate limit to expire.";
  }
  if (e?.status && e.status >= 500) return "The observability runtime returned a server error. No production readiness claim is available.";
  return e instanceof Error ? e.message : "The N13 observability request failed.";
}

async function requestRuntime(method: "GET" | "POST"): Promise<RuntimeResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = readFounderAccessToken();
  if (!baseUrl || !anonKey) throw new Error("Supabase public runtime configuration is missing from this deployment.");
  if (!token) throw new Error("Sign in first. No authenticated Supabase session was found in this browser.");

  let endpoint: URL;
  try {
    endpoint = new URL(baseUrl);
  } catch {
    throw new Error("The configured Supabase URL is invalid.");
  }
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") {
    throw new Error("The Supabase runtime URL must use HTTPS.");
  }
  endpoint.pathname = endpoint.pathname.replace(/\/+$/, "") + "/functions/v1/n13-observability-runtime";

  const response = await fetch(endpoint.toString(), {
    method,
    headers: {
      apikey: anonKey,
      Authorization: "Bearer " + token,
      Accept: "application/json",
      ...(method === "POST" ? { "Content-Type": "application/json" } : {})
    },
    cache: "no-store",
    redirect: "error"
  });

  let body: RuntimeResponse & { status?: string; reason?: string; message?: string };
  try {
    body = await response.json() as typeof body;
  } catch {
    body = { status: "UNKNOWN", note: "The observability runtime returned a non-JSON response." };
  }

  if (!response.ok) {
    const error = new Error(body.message || body.reason || body.status || "N13 runtime request failed.") as RuntimeError;
    error.status = response.status;
    error.runtimeStatus = body.status;
    Object.assign(error, { retryAfterSeconds: body.retryAfterSeconds });
    throw error;
  }
  return body;
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Invalid timestamp" : parsed.toLocaleString();
}

function safeCount(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "Unavailable";
}

export function LiveObservabilityPanel() {
  const [runtime, setRuntime] = useState<RuntimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [confirmCapture, setConfirmCapture] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await requestRuntime("GET");
      setRuntime(response);
    } catch (e) {
      setRuntime(null);
      setError(describeFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const captureNow = useCallback(async () => {
    if (!confirmCapture) {
      setConfirmCapture(true);
      setNotice("Confirm the capture to write one aggregate health snapshot, service checks and metric samples.");
      return;
    }
    setCapturing(true);
    setError("");
    setNotice("");
    setConfirmCapture(false);
    try {
      await requestRuntime("POST");
      const latest = await requestRuntime("GET");
      setRuntime(latest);
      setNotice("Founder-authorised aggregate capture completed. Coverage remains " + (latest.coverage ?? "unknown") + ".");
    } catch (e) {
      setError(describeFailure(e));
    } finally {
      setCapturing(false);
    }
  }, [confirmCapture]);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  const snapshot = runtime?.latestSnapshot ?? null;
  const status = runtime?.status ?? snapshot?.status ?? "UNKNOWN";
  const metrics = useMemo(() => {
    if (!snapshot) return [];
    return [
      ["Active candidates", snapshot.active_candidates, "500 active-candidate ceiling"],
      ["Pending workflows", snapshot.pending_workflows, "Deferred or manual-required"],
      ["Failed workflows", snapshot.failed_workflows, "Failed workflow records"],
      ["Document backlog", snapshot.document_backlog, "Pending or in-review documents"],
      ["Manual fallback", snapshot.manual_fallback_backlog, "MAP / manual handoff work"],
      ["Pending payments", snapshot.payment_pending_count, "Settlement remains separately verified"],
      ["Source review", snapshot.source_review_backlog, "Official-source observations"],
      ["Open incidents", snapshot.incident_open_count, "Open, acknowledged or mitigating"]
    ] as Array<[string, number | null | undefined, string]>;
  }, [snapshot]);

  return (
    <section id="n13-live-observability" aria-labelledby="n13-observability-title" className="space-y-5 rounded-2xl border border-slate-700 bg-slate-950/80 p-5 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">N13 · Founder Observability</p>
          <h3 id="n13-observability-title" className="mt-2 text-xl font-black text-white">Live operations evidence</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Authenticated aggregate telemetry from Supabase. Candidate-level records and personal information are not displayed.
            The runtime does not infer health for unprobed external services.
          </p>
        </div>
        <div className={"rounded-lg border px-3 py-2 text-xs font-black tracking-widest " + statusTone(status)}>
          {status}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void loadLatest()} disabled={loading || capturing}
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-100 hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Loading…" : "Refresh latest snapshot"}
        </button>
        <button type="button" onClick={() => void captureNow()} disabled={loading || capturing}
          className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
          {capturing ? "Capturing…" : confirmCapture ? "Confirm aggregate capture" : "Capture telemetry"}
        </button>
        {confirmCapture && (
          <button type="button" onClick={() => { setConfirmCapture(false); setNotice(""); }}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200">
            Cancel
          </button>
        )}
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-slate-600 bg-slate-900 p-3 text-xs text-slate-200">{notice}</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coverage</p>
          <p className="mt-2 text-lg font-black">{runtime?.coverage ?? "UNKNOWN"}</p>
          <p className="mt-1 text-[11px] text-slate-400">Supabase auth and PostgreSQL only</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Production readiness</p>
          <p className="mt-2 text-lg font-black text-amber-200">{runtime?.productionReady === true ? "Reported by runtime" : "NOT VERIFIED"}</p>
          <p className="mt-1 text-[11px] text-slate-400">The N13 runtime deliberately returns false</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last capture</p>
          <p className="mt-2 text-sm font-bold">{formatTimestamp(snapshot?.captured_at)}</p>
          <p className="mt-1 text-[11px] text-slate-400">{snapshot?.snapshot_ref ?? "No snapshot reference"}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">External service coverage</p>
          <p className="mt-2 text-lg font-black text-amber-200">PARTIAL</p>
          <p className="mt-1 text-[11px] text-slate-400">No green status until required probes exist</p>
        </article>
      </div>

      {loading && !runtime && !error && <p className="text-sm text-slate-300">Loading the latest authenticated observability snapshot…</p>}
      {!loading && !snapshot && !error && (
        <p className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">No persisted N13 snapshot is available yet. Capture telemetry only after the Edge Function is deployed and founder authorisation succeeds.</p>
      )}

      {snapshot && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([label, value, description]) => (
              <article key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-black tabular-nums">{safeCount(value)}</p>
                <p className="mt-1 text-[11px] text-slate-400">{description}</p>
              </article>
            ))}
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Snapshot assessment</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{snapshot.summary ?? runtime?.note ?? "No assessment summary was returned."}</p>
          </div>
        </>
      )}

      {runtime?.serviceChecks && runtime.serviceChecks.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-700">
          <div className="border-b border-slate-700 bg-slate-900 px-4 py-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Persisted service checks</h4>
          </div>
          <div className="divide-y divide-slate-800">
            {runtime.serviceChecks.map((check, index) => (
              <article key={check.check_ref ?? index} className="grid gap-2 bg-slate-950 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <p className="text-sm font-bold">{check.service_name ?? "Unknown service"}</p>
                  <p className="mt-1 text-xs text-slate-400">{check.reason ?? "No reason recorded."}</p>
                  {check.fix_path && <p className="mt-1 text-xs text-slate-500">Next: {check.fix_path}</p>}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-black text-slate-200">{check.status ?? "UNKNOWN"}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{formatTimestamp(check.checked_at)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-5 text-slate-400">
        Source of truth: {runtime?.sourceOfTruth ?? "Supabase PostgreSQL"} · All reads are authenticated and uncached.
        Capture writes aggregate health snapshots, service checks and metric samples only; it does not change candidate,
        payment, provider or application records.
      </p>
    </section>
  );
}
