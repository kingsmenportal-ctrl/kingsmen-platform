"use client";

import { useState } from "react";

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

function getAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}

export default function N15IngestionOperatorPage() {
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function runIngestion() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const token = getAccessToken();
      if (!url || !anonKey) throw new Error("N15 is not configured for this web deployment.");
      if (!token) throw new Error("Sign in with an authorised Kingsmen reviewer account first.");
      const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/n15-source-ingestion`, {
        method: "POST",
        headers: { apikey: anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok) {
        if (body.reason === "ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED") {
          throw new Error("No active authorised platform reviewer was found for this account. Ask an authorised administrator to grant a permitted reviewer role; the ingestion endpoint remains fail-closed.");
        }
        throw new Error(body.reason || body.status || `Ingestion failed (${response.status})`);
      }
      setResult(body);
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

      <aside className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        This operation requires a valid session and an active platform reviewer role. If your account has not been authorised, the request is rejected. Source ingestion and opportunity verification are separate operations; all discovered records require human review before candidate matching.
      </aside>
    </main>
  );
}
