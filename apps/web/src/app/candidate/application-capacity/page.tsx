"use client";

import { getCandidateAccessToken } from "../../../lib/candidate-session";
import { useCallback, useEffect, useMemo, useState } from "react";

type Reservation = {
  reservation_id: string;
  application_id: string;
  usage_type: "PRIORITY_APPLICATION" | "MANAGED_ROUTE";
  order_ref: string;
  reserved_at: string;
  expires_at: string;
  status: "RESERVED";
};
type Capacity = {
  has_active_plan: boolean;
  plan_code: string | null;
  order_ref: string | null;
  verified_payment_ref: string | null;
  verified_at: string | null;
  expires_at: string | null;
  priority_application_limit: number;
  priority_application_used: number;
  priority_application_remaining: number;
  managed_route_limit: number;
  managed_route_used: number;
  managed_route_remaining: number;
  accommodation_support_available: boolean;
  accommodation_route_count: number;
  cv_revamp_owned: boolean;
  cv_revamp_bonus_applied: number;
  catalogue_access: string;
  reservations: Reservation[];
};
type ParentApplication = {
  id: string;
  application_ref: string;
  pathway_type: string;
  status: string;
  readiness_status: string;
  created_at: string;
  updated_at: string;
};
type ApiResponse = {
  ready?: boolean;
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  has_active_plan?: boolean;
  plan_code?: string | null;
  order_ref?: string | null;
  verified_payment_ref?: string | null;
  verified_at?: string | null;
  expires_at?: string | null;
  priority_application_limit?: number;
  priority_application_used?: number;
  priority_application_remaining?: number;
  managed_route_limit?: number;
  managed_route_used?: number;
  managed_route_remaining?: number;
  accommodation_support_available?: boolean;
  accommodation_route_count?: number;
  cv_revamp_owned?: boolean;
  cv_revamp_bonus_applied?: number;
  reservations?: Reservation[];
  parentApplications?: ParentApplication[];
};
const PLAN_NAMES: Record<string, string> = {
  ARTISAN_CHARTER_R149_99: "Artisan Charter",
  FOUNDATIONAL_ACCORD_R169_99: "Foundational Accord",
  GUILDMASTERS_CHARTER_R199_99: "Guildmasters Charter",
  COLLEGIATE_ORDINANCE_R299_99: "Collegiate Ordinance",
  CHANCELLORS_WRIT_R399_99: "Chancellor's Writ",
  REGENCY_MANDATE_R469_99: "Regency Mandate"
};
const PATHWAY_NAMES: Record<string, string> = {
  HIGHER_EDUCATION: "Higher education",
  TVET: "TVET",
  SETA_LEARNERSHIP: "SETA programmes & learnerships",
  INTERNSHIP: "Internships",
  APPRENTICESHIP: "Apprenticeships",
  EMPLOYMENT: "Employment"
};
const editableStatuses = new Set(["DRAFT", "READINESS_BLOCKED", "READY_FOR_REVIEW", "READY_TO_SUBMIT"]);

function apiError(body: ApiResponse) {
  return [body.code, body.error ?? body.message].filter(Boolean).join(": ") || "The capacity request could not be completed.";
}
function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}
function Meter({ label, used, limit, remaining }: { label: string; used: number; limit: number; remaining: number }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return <article className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-bold">{label}</h3>
      <span className="text-sm text-cyan-300 tabular-nums">{used} / {limit}</span>
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={Math.max(limit, 1)} aria-valuenow={Math.min(used, limit)} aria-label={label}>
      <div className="h-full rounded-full bg-cyan-300" style={{ width: percent + "%" }} />
    </div>
    <p className="mt-3 text-sm text-slate-300">{remaining} remaining in this service period</p>
  </article>;
}

export default function CandidateApplicationCapacityPage() {
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [applications, setApplications] = useState<ParentApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = useCallback(async (url: string, method: "GET" | "POST" = "GET", payload?: Record<string, unknown>) => {
    const token = getCandidateAccessToken();
    if (!token) throw new Error("AUTHENTICATION_REQUIRED: Sign in to view or reserve application capacity.");
    const response = await fetch(url, {
      method,
      headers: { Authorization: "Bearer " + token, ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
      ...(method === "POST" ? { body: JSON.stringify(payload ?? {}) } : {}),
      cache: "no-store"
    });
    const body = await response.json() as ApiResponse;
    if (!response.ok || body.ready !== true || (method === "POST" && body.ok !== true)) throw new Error(apiError(body));
    return body;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [capacityBody, applicationBody] = await Promise.all([
        request("/api/candidate/application-capacity"),
        request("/api/candidate/applications")
      ]);
      setCapacity(capacityBody as Capacity);
      const parentRows = Array.isArray(applicationBody.parentApplications) ? applicationBody.parentApplications : [];
      const editable = parentRows.filter(app => editableStatuses.has(app.status));
      setApplications(editable);
      setSelectedApplication(current => editable.some(app => app.id === current) ? current : editable[0]?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load application capacity.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const reservations = capacity?.reservations ?? [];
  const selected = useMemo(() => applications.find(app => app.id === selectedApplication) ?? null, [applications, selectedApplication]);

  async function reserve(usageType: "PRIORITY_APPLICATION" | "MANAGED_ROUTE") {
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const body = await request("/api/candidate/application-capacity", "POST", {
        action: "reserve",
        application_id: selected.id,
        usage_type: usageType,
        idempotency_key: "capacity-" + crypto.randomUUID()
      });
      setNotice(body.message ?? "Capacity reserved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reserve capacity.");
    } finally {
      setBusy(false);
    }
  }

  async function release(reservation: Reservation) {
    setBusy(true); setError(""); setNotice("");
    try {
      const body = await request("/api/candidate/application-capacity", "POST", {
        action: "release",
        reservation_id: reservation.reservation_id,
        reason: "Candidate released unused application capacity."
      });
      setNotice(body.message ?? "Capacity released.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not release capacity.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal · Application Engine</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Application plan capacity</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          One candidate profile and one application workbench cover all six pathways. A package affects priority applications and managed-route capacity; it does not restrict catalogue access or prevent you preparing an ordinary application draft.
        </p>
        <nav className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
          <a href="/candidate/applications" className="rounded-xl border border-slate-700 px-4 py-2">My applications</a>
          <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-2">All six pathways</a>
          <button type="button" disabled={loading || busy} onClick={() => void load()} className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh capacity"}</button>
        </nav>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-700 bg-amber-950/50 p-4 text-sm leading-6 text-amber-100">
        {error}{error.includes("AUTHENTICATION_REQUIRED") && <p className="mt-2"><a className="underline text-cyan-300" href="/candidate/login">Sign in / create account</a></p>}
      </section>}
      {notice && <section role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-100">{notice}</section>}

      {loading ? <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">Loading verified plan and application capacity…</section>
      : capacity && <>
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Verified entitlement</p>
              <h2 className="mt-2 text-2xl font-bold">{capacity.has_active_plan ? (PLAN_NAMES[capacity.plan_code ?? ""] ?? capacity.plan_code) : "No active paid application plan"}</h2>
              <p className="mt-2 text-sm text-slate-400">{capacity.has_active_plan ? "Verified payment: " + formatDate(capacity.verified_at) + " · Service ends: " + formatDate(capacity.expires_at) : "Priority and managed capacity require a verified, active paid plan. Ordinary discovery and draft preparation remain available."}</p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{capacity.has_active_plan ? "Payment verified" : "Catalogue access retained"}</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Meter label="Priority applications" used={capacity.priority_application_used ?? 0} limit={capacity.priority_application_limit ?? 0} remaining={capacity.priority_application_remaining ?? 0} />
            <Meter label="Managed routes" used={capacity.managed_route_used ?? 0} limit={capacity.managed_route_limit ?? 0} remaining={capacity.managed_route_remaining ?? 0} />
          </div>
          {capacity.cv_revamp_bonus_applied > 0 && <p className="mt-4 text-sm text-cyan-200">Includes {capacity.cv_revamp_bonus_applied} additional managed-route slots because prior CV Revamp ownership was independently verified.</p>}
          <div className="mt-5 rounded-2xl border border-slate-800 p-4 text-sm text-slate-300">
            <p><strong>Accommodation support:</strong> {capacity.accommodation_support_available ? "Available under this paid plan" : "Not included in the active entitlement"}</p>
            <p className="mt-1"><strong>Included accommodation routes:</strong> {capacity.accommodation_route_count}</p>
            <p className="mt-1"><strong>Discovery access:</strong> Higher education · TVET · SETA programmes & learnerships · Internships · Apprenticeships · Employment</p>
            <p className="mt-2 text-xs text-slate-500">Capacity is calculated from normalized order-time limits and a matching PAID order plus COMPLETE, verified ZAR payment. The legacy JSON entitlement snapshot is not used.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-bold">Reserve capacity for an application</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Select an existing editable parent application. A priority reservation uses one priority application slot; a managed-route reservation allocates one managed-service slot. Reservations do not submit anything to a provider.</p>
          {applications.length === 0 ? <div className="mt-5 rounded-2xl border border-slate-800 p-4 text-sm text-slate-300">
            No editable parent applications were returned. Save a currently verified opportunity and prepare its Kingsmen parent application first.
            <a href="/candidate/opportunity-matches" className="mt-3 inline-flex rounded-xl border border-slate-700 px-4 py-2 text-cyan-300">Find verified opportunities</a>
          </div> : <>
            <label className="mt-5 block text-sm font-semibold" htmlFor="capacity-application">Application</label>
            <select id="capacity-application" value={selectedApplication} onChange={e => setSelectedApplication(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white">
              {applications.map(app => <option key={app.id} value={app.id}>{app.application_ref} · {PATHWAY_NAMES[app.pathway_type] ?? app.pathway_type} · {app.status}</option>)}
            </select>
            {selected && <p className="mt-2 text-xs text-slate-400">Readiness: {selected.readiness_status.replaceAll("_", " ")}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled={busy || !capacity.has_active_plan || (capacity.priority_application_remaining ?? 0) < 1 || !selected} onClick={() => void reserve("PRIORITY_APPLICATION")} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Reserve priority application</button>
              <button type="button" disabled={busy || !capacity.has_active_plan || (capacity.managed_route_remaining ?? 0) < 1 || !selected} onClick={() => void reserve("MANAGED_ROUTE")} className="rounded-xl border border-cyan-700 px-4 py-3 text-sm font-semibold text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">Reserve managed route</button>
            </div>
            {!capacity.has_active_plan && <p className="mt-3 text-xs text-slate-400">You can still prepare and save applications without a priority or managed reservation.</p>}
          </>}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-bold">Active reservations</h2>
          {reservations.length === 0 ? <p className="mt-3 text-sm text-slate-400">No active priority or managed-route reservations.</p> : <div className="mt-4 space-y-3">
            {reservations.map(reservation => {
              const app = applications.find(item => item.id === reservation.application_id);
              return <article key={reservation.reservation_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{reservation.usage_type === "PRIORITY_APPLICATION" ? "Priority application" : "Managed route"}</p>
                  <p className="mt-1 text-xs text-slate-400">{app?.application_ref ?? "Application reference"} · Reserved {formatDate(reservation.reserved_at)} · Expires {formatDate(reservation.expires_at)}</p>
                </div>
                <button type="button" disabled={busy || !app || !editableStatuses.has(app.status)} onClick={() => void release(reservation)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-40">Release unused capacity</button>
              </article>;
            })}
          </div>}
        </section>
      </>}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="font-bold">Application and provider evidence</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Kingsmen capacity reservations are internal planning/priority allocations. Candidate-reported submission, provider-confirmed receipt and provider decision remain separate events. No reservation creates an application on an external institution or employer portal, and no outcome is guaranteed.</p>
      </section>
    </div>
  </main>;
}
