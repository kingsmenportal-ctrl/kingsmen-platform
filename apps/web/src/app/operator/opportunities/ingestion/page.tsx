"use client";

import { useEffect, useState } from "react";

type RunResult = {
  status: string;
  run_ref?: string;
  sources_checked?: number;
  sources_succeeded?: number;
  observations_created?: number;
  observations_updated?: number;
  published_opportunities_created?: number;
  results?: { authority_ref: string; status: string; links_found?: number; created?: number; updated?: number; reason?: string }[];
  reason?: string;
};

type RunHistoryItem = {
  run_ref: string;
  status: "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | string;
  sources_checked: number;
  sources_succeeded: number;
  observations_created: number;
  observations_updated: number;
  observations_skipped: number;
  started_at: string;
  finished_at: string | null;
};

function getAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}

function getApiConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("N15 is not configured for this web deployment.");
  return {
    endpoint: `${url.replace(/\/$/, "")}/functions/v1/n15-source-ingestion`,
    anonKey
  };
}

async function fetchRunHistory(token: string): Promise<RunHistoryItem[]> {
  const { endpoint, anonKey } = getApiConfig();
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (body.reason === "ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED") {
      throw new Error("This account does not have an active authorised reviewer role. Run history remains restricted.");
    }
    throw new Error(body.reason || body.status || `Run history unavailable (${response.status})`);
  }
  return Array.isArray(body.runs) ? body.runs as RunHistoryItem[] : [];
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg"
  }).format(date);
}

function statusClasses(status: string) {
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-800";
  if (status === "PARTIAL") return "bg-amber-50 text-amber-800";
  if (status === "FAILED") return "bg-rose-50 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

export default function N15IngestionOperatorPage() {
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadInitialHistory() {
      const token = getAccessToken();
      if (!token) {
        setHistoryError("Sign in with an authorised Kingsmen reviewer account to view run history.");
        return;
      }
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const records = await fetchRunHistory(token);
        if (active) setHistory(records);
      } catch (e) {
        if (active) setHistoryError(e instanceof Error ? e.message : "Run history could not be loaded.");
      } finally {
        if (active) setHistoryLoading(false);
      }
    }
    void loadInitialHistory();
    return () => { active = false; };
  }, []);

  async function refreshHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Sign in with an authorised Kingsmen reviewer account first.");
      setHistory(await fetchRunHistory(token));
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Run history could not be loaded.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function runIngestion() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { endpoint, anonKey } = getApiConfig();
      const token = getAccessToken();
      if (!token) throw new Error("Sign in with an authorised Kingsmen reviewer account first.");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { apikey: anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store"
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body.reason === "ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED") {
          throw new Error("No active authorised platform reviewer was found for this account. Ask an authorised administrator to grant a permitted reviewer role; the ingestion endpoint remains fail-closed.");
        }
        throw new Error(body.reason || body.status || `Ingestion failed (${response.status})`);
      }
      setResult(body);
      try {
        setHistory(await fetchRunHistory(token));
        setHistoryError("");
      } catch (historyFailure) {
        setHistoryError(historyFailure instanceof Error ? historyFailure.message : "The run completed, but history could not be refreshed.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingestion could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kingsmen · N15 Operations</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Official source ingestion</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Run a bounded scan of active registered HTTPS authority pages. Discovered links are saved as review-required observations only; this action never publishes an open opportunity or verifies deadlines, eligibility, accreditation or outcomes.
        </p>
        <button onClick={runIngestion} disabled={busy} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Scanning registered sources…" : "Run source ingestion"}
        </button>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">{error}</section>}

      {result && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Run status", result.status],
              ["Sources checked", String(result.sources_checked ?? 0)],
              ["Sources successful", String(result.sources_succeeded ?? 0)],
              ["New observations", String(result.observations_created ?? 0)]
            ].map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></article>)}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">Source-by-source results</h2>
            <p className="mt-1 text-sm text-slate-600">Run reference: {result.run_ref ?? "not returned"} · Candidate-facing opportunities published: {result.published_opportunities_created ?? 0}</p>
            <div className="mt-4 divide-y divide-slate-100">
              {(result.results ?? []).map(item => <article key={item.authority_ref} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-900">{item.authority_ref}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{item.status}</span></div>
                <p className="mt-1 text-sm text-slate-600">{item.links_found ?? 0} link candidate(s) · {item.created ?? 0} new · {item.updated ?? 0} refreshed{item.reason ? ` · ${item.reason}` : ""}</p>
              </article>)}
            </div>
          </section>
        </>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="n15-run-history-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="n15-run-history-heading" className="text-lg font-bold text-slate-950">Recent ingestion runs</h2>
            <p className="mt-1 text-sm text-slate-600">Read-only ledger · latest 50 runs · South African time</p>
          </div>
          <button type="button" onClick={refreshHistory} disabled={historyLoading} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">
            {historyLoading ? "Refreshing…" : "Refresh history"}
          </button>
        </div>
        {historyError && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{historyError}</p>}
        {historyLoading && <p className="mt-4 text-sm text-slate-600" role="status">Loading run history…</p>}
        {!historyLoading && !historyError && history.length === 0 && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No ingestion runs have been recorded yet.</p>}
        {history.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-3">Run reference</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-3 py-3">Sources</th>
                  <th scope="col" className="px-3 py-3">Observations</th>
                  <th scope="col" className="px-3 py-3">Started</th>
                  <th scope="col" className="px-3 py-3">Finished</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(run => (
                  <tr key={run.run_ref}>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{run.run_ref}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(run.status)}`}>{run.status}</span></td>
                    <td className="px-3 py-3 tabular-nums">{run.sources_succeeded}/{run.sources_checked}</td>
                    <td className="px-3 py-3 tabular-nums">{run.observations_created} new · {run.observations_updated} refreshed · {run.observations_skipped} skipped</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(run.started_at)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(run.finished_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        This operation requires a valid session and an active platform reviewer role. The run-history endpoint exposes aggregate run metadata only and never returns raw summary JSON, candidate data, private document paths or source evidence locators. Refreshing history is read-only; source ingestion requires a separate explicit action. Discovered records still require human verification before candidate matching.
      </aside>
    </main>
  );
}
