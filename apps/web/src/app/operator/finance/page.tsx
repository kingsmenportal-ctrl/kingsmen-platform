"use client";

import { useEffect, useState } from "react";
import { getCandidateSessionState } from "@/lib/candidate-session";

type Payment = { payment_ref: string; order_ref: string; provider: string; amount_gross_cents: number; amount_fee_cents: number; amount_net_cents: number; currency: string; payment_status: string; verified: boolean; verified_at: string | null; created_at: string };
type Refund = { refund_ref: string; payment_ref: string | null; order_ref: string | null; amount_cents: number; currency: string; refund_status: string; reason: string; created_at: string; reviewed_at: string | null };
type Notification = { notification_ref: string; template_key: string | null; channel: string; status: string; created_at: string; sent_at: string | null; failed_at: string | null };
type FinancePayload = { ok: boolean; code?: string; authorization?: string; livePaymentsEnabled?: boolean; liveMessagingEnabled?: boolean; dataWindow?: string; payments?: Payment[]; refunds?: Refund[]; notifications?: Notification[]; refundMutationEnabled?: boolean; refundMutationBlocker?: string };
function money(cents: number, currency: string) { return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(cents / 100); }

export default function OperatorFinancePage() {
  const [data, setData] = useState<FinancePayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true); setError("");
    try {
      const session = getCandidateSessionState();
      if (session.status !== "ready") throw new Error("Sign in with an authorized finance reviewer account.");
      const response = await fetch("/api/founder/finance", { headers: { Authorization: "Bearer " + session.token }, cache: "no-store" });
      const payload = await response.json() as FinancePayload;
      if (!response.ok || payload.ok !== true) throw new Error(payload.code === "ACTIVE_FINANCE_REVIEWER_REQUIRED" ? "This account does not have an active FINANCE_REVIEWER or PLATFORM_ADMIN role." : payload.code ?? "Finance queues could not be loaded.");
      setData(payload);
    } catch (caught) { setData(null); setError(caught instanceof Error ? caught.message : "Finance queues could not be loaded."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">N10 · Finance and PayFast</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Finance operations</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Read-only reconciliation for active finance reviewers and platform administrators. Payment truth comes from server-side records, never browser return URLs.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="min-h-11 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Refreshing…" : "Refresh finance queues"}</button></header>
    <div className="mt-6 grid gap-3 md:grid-cols-2"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold">Sandbox / live-send gate</p><p className="mt-1 text-sm leading-6">Live payments and live messaging are deliberately disabled. This panel cannot enable either service.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="font-bold">Reconciliation scope</p><p className="mt-1 text-sm leading-6">{data?.dataWindow ?? "Latest 100 records per queue when an authorized finance role is present."}</p></div></div>
    {error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p> : null}
    {data ? <>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Payments</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="p-3">Payment</th><th className="p-3">Order</th><th className="p-3">Gross</th><th className="p-3">Fee / net</th><th className="p-3">Provider</th><th className="p-3">Status</th><th className="p-3">Verified</th></tr></thead><tbody>{(data.payments ?? []).map(p => <tr key={p.payment_ref} className="border-b border-slate-100"><td className="p-3 font-mono text-xs">{p.payment_ref}</td><td className="p-3 font-mono text-xs">{p.order_ref}</td><td className="p-3">{money(p.amount_gross_cents,p.currency)}</td><td className="p-3">{money(p.amount_fee_cents,p.currency)} / {money(p.amount_net_cents,p.currency)}</td><td className="p-3">{p.provider}</td><td className="p-3">{p.payment_status}</td><td className="p-3">{p.verified ? "Yes" : "No"}</td></tr>)}</tbody></table>{!data.payments?.length ? <p className="p-4 text-sm text-slate-500">No payment records in the current window.</p> : null}</div></section>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Refund requests</h2><p className="mt-2 text-sm leading-6 text-amber-800">{data.refundMutationBlocker}</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="p-3">Refund</th><th className="p-3">Order</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Reason</th></tr></thead><tbody>{(data.refunds ?? []).map(r => <tr key={r.refund_ref} className="border-b border-slate-100"><td className="p-3 font-mono text-xs">{r.refund_ref}</td><td className="p-3 font-mono text-xs">{r.order_ref ?? "—"}</td><td className="p-3">{money(r.amount_cents,r.currency)}</td><td className="p-3">{r.refund_status}</td><td className="p-3">{r.reason}</td></tr>)}</tbody></table>{!data.refunds?.length ? <p className="p-4 text-sm text-slate-500">No refund records in the current window.</p> : null}</div><p className="mt-3 text-xs text-slate-500">Approval/rejection actions remain disabled until refund/order models and their audited RPC are reconciled.</p></section>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold">Notification outbox</h2><p className="mt-1 text-sm text-slate-600">Queued, simulated, sent and failed are distinct states. A queued event is not proof of delivery.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="p-3">Notification</th><th className="p-3">Template</th><th className="p-3">Channel</th><th className="p-3">State</th><th className="p-3">Created</th></tr></thead><tbody>{(data.notifications ?? []).map(n => <tr key={n.notification_ref} className="border-b border-slate-100"><td className="p-3 font-mono text-xs">{n.notification_ref}</td><td className="p-3">{n.template_key ?? "—"}</td><td className="p-3">{n.channel}</td><td className="p-3">{n.status}</td><td className="p-3">{new Date(n.created_at).toLocaleString()}</td></tr>)}</tbody></table>{!data.notifications?.length ? <p className="p-4 text-sm text-slate-500">No notification records in the current window.</p> : null}</div></section>
    </> : null}
  </div></main>;
}
