"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getCandidateSessionState } from "@/lib/candidate-session";

type FinanceOrder = { order_ref: string; plan_code: string; order_status: string; amount_cents: number; currency: string; created_at: string };
type FinancePayment = { payment_ref: string; order_ref: string; payment_status: string; amount_gross_cents: number; currency: string; verified: boolean; verified_at: string | null; created_at: string };
type FinanceRefund = { refund_ref: string; payment_ref: string | null; amount_cents: number; currency: string; refund_status: string; reason: string; created_at: string };
type FinanceSummary = { orders: FinanceOrder[]; payments: FinancePayment[]; refunds: FinanceRefund[]; invoices: Array<Record<string, unknown>> };
type RpcError = { message?: string; code?: string };

function money(cents: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(cents / 100);
}

export default function CandidateFinanceStatus() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refundPayment, setRefundPayment] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const callRpc = useCallback(async (name: string, args: Record<string, unknown>) => {
    const session = getCandidateSessionState();
    if (session.status !== "ready") throw new Error("Sign in with your verified candidate account to view finance records.");
    const response = await fetch(session.url + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: {
        apikey: session.anonKey,
        Authorization: "Bearer " + session.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(args),
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({})) as FinanceSummary & RpcError & Record<string, unknown>;
    if (!response.ok) throw new Error("Finance service rejected the request or is temporarily unavailable.");
    return payload;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await callRpc("get_candidate_finance_summary", {}) as unknown as FinanceSummary;
      setSummary(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Finance status could not be loaded.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [callRpc]);

  useEffect(() => { void reload(); }, [reload]);

  async function submitRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await callRpc("request_candidate_finance_refund", {
        p_payment_ref: refundPayment,
        p_amount_cents: Math.round(Number(refundAmount) * 100),
        p_reason: refundReason.trim()
      });
      setNotice("Refund request recorded for human finance review. No refund has been executed.");
      setRefundPayment("");
      setRefundAmount("");
      setRefundReason("");
      await reload();
      if (result.refund_executed === true) setNotice("Unexpected response: provider refund execution must remain human-approved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Refund request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  const verifiedPayments = (summary?.payments ?? []).filter(p => p.payment_status === "COMPLETE" && p.verified === true);
  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="candidate-finance-status">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Account-backed records</p>
          <h2 id="candidate-finance-status" className="mt-2 text-xl font-bold">Your orders and payments</h2>
        </div>
        <button type="button" onClick={() => void reload()} disabled={loading} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">Refresh status</button>
      </div>
      {loading ? <p className="mt-4 text-sm text-slate-600">Loading your finance records…</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p> : null}
      {!loading && !error && summary ? (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold">Orders</h3>
              {summary.orders.length ? <ul className="mt-3 space-y-3">{summary.orders.map(order => (
                <li key={order.order_ref} className="border-t border-slate-100 pt-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2"><strong>{order.plan_code.replaceAll("_", " ")}</strong><span className="font-bold">{money(order.amount_cents, order.currency)}</span></div>
                  <p className="mt-1 text-slate-600">Status: {order.order_status.replaceAll("_", " ")} · {new Date(order.created_at).toLocaleDateString("en-ZA")}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">Reference: {order.order_ref}</p>
                  {order.order_status !== "PAID" ? <p className="mt-1 text-xs text-amber-800">Entitlements are inactive until the backend verifies settlement.</p> : null}
                </li>
              ))}</ul> : <p className="mt-3 text-sm text-slate-600">No orders are recorded for this account.</p>}
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold">Payment evidence</h3>
              {summary.payments.length ? <ul className="mt-3 space-y-3">{summary.payments.map(payment => (
                <li key={payment.payment_ref} className="border-t border-slate-100 pt-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2"><strong>{money(payment.amount_gross_cents, payment.currency)}</strong><span>{payment.payment_status.replaceAll("_", " ")}</span></div>
                  <p className="mt-1 text-slate-600">{payment.verified ? "Server-verified settlement" : "Not verified"}{payment.verified_at ? " · " + new Date(payment.verified_at).toLocaleString("en-ZA") : ""}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">Reference: {payment.payment_ref}</p>
                </li>
              ))}</ul> : <p className="mt-3 text-sm text-slate-600">No payment has been recorded. Browser returns do not count as settlement.</p>}
            </article>
          </div>
          <article className="mt-4 rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold">Refund requests</h3>
            {summary.refunds.length ? <ul className="mt-3 space-y-2">{summary.refunds.map(refund => (
              <li key={refund.refund_ref} className="border-t border-slate-100 pt-2 text-sm">
                <strong>{money(refund.amount_cents, refund.currency)}</strong> · {refund.refund_status.replaceAll("_", " ")}
                <p className="text-slate-600">{refund.reason}</p>
                <p className="break-all text-xs text-slate-500">{refund.refund_ref}</p>
              </li>
            ))}</ul> : <p className="mt-2 text-sm text-slate-600">No refund requests recorded.</p>}
          </article>
          {verifiedPayments.length ? (
            <form onSubmit={submitRefund} className="mt-5 grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><h3 className="font-bold">Request a refund review</h3><p className="mt-1 text-sm text-slate-700">A request does not execute a refund. Finance staff must review it separately.</p></div>
              <label className="text-sm font-semibold">Verified payment
                <select required value={refundPayment} onChange={e => setRefundPayment(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2">
                  <option value="">Choose a payment</option>{verifiedPayments.map(payment => <option key={payment.payment_ref} value={payment.payment_ref}>{money(payment.amount_gross_cents, payment.currency)} · {payment.payment_ref}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Amount (ZAR)
                <input required type="number" min="0.01" step="0.01" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Reason
                <textarea required minLength={3} maxLength={1200} value={refundReason} onChange={e => setRefundReason(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" rows={3} />
              </label>
              <button type="submit" disabled={submitting} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit refund request"}</button>
            </form>
          ) : null}
        </>
      ) : null}
      {notice ? <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p> : null}
    </section>
  );
}
