"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../../lib/supabase-browser-auth";

type Row = Record<string, unknown> & { id: string };
type FinanceQueue = { ok: boolean; error?: string; rejectedItns: Row[]; refundExceptions: Row[]; staleOrders: Row[]; failedOrders: Row[]; invoiceExceptions: Row[]; paymentMismatches: Row[]; generatedAt?: string };
type Draft = { notes: string; evidenceUrl: string };
const panel: React.CSSProperties = { marginTop: 18, padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" };
const card: React.CSSProperties = { padding: 12, border: "1px solid #39445e", borderRadius: 8, overflowWrap: "anywhere" };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
const str = (row: Row, key: string) => row[key] == null || row[key] === "" ? "—" : String(row[key]);
const money = (cents: unknown, currency: unknown) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: typeof currency === "string" ? currency : "ZAR" }).format((Number(cents) || 0) / 100);

export default function FounderFinancePage() {
  const [queue, setQueue] = useState<FinanceQueue>({ ok: true, rejectedItns: [], refundExceptions: [], staleOrders: [], failedOrders: [], invoiceExceptions: [], paymentMismatches: [] });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notice, setNotice] = useState("Loading finance exceptions…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in with an authorised founder/operator account to view finance exceptions."); return; }
    const response = await fetch("/api/founder/finance", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json() as FinanceQueue;
    if (!response.ok || !data.ok) throw new Error(data.error || "Finance exceptions could not be loaded.");
    setQueue(data);
    setDrafts(current => {
      const next = { ...current };
      for (const refund of data.refundExceptions || []) next[String(refund.id)] ||= { notes: "", evidenceUrl: "" };
      return next;
    });
    setNotice("");
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Finance exceptions could not be loaded.")); }, [load]);

  function patch(id: string, change: Partial<Draft>) { setDrafts(current => ({ ...current, [id]: { notes: "", evidenceUrl: "", ...current[id], ...change } })); }

  async function reviewRefund(refund: Row, decision: "APPROVE" | "REJECT") {
    const draft = drafts[String(refund.id)] || { notes: "", evidenceUrl: "" };
    if (decision === "APPROVE" && (draft.notes.trim().length < 8 || !draft.evidenceUrl.trim())) {
      setNotice("Refund approval requires a documented rationale and HTTPS evidence URL.");
      return;
    }
    setBusy(String(refund.id)); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to review refunds.");
      const response = await fetch("/api/founder/finance", { method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ refundRequestId: refund.id, decision, notes: draft.notes, evidenceUrl: draft.evidenceUrl }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Refund review failed.");
      setNotice(data.message || "Refund decision saved and audited. Approval is not payment execution.");
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Refund review failed."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1150, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/workspace">← Operations workspace</Link> · <Link href="/founder/marketplace-review">Marketplace review</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}><h1>Finance exceptions and reconciliation</h1><button onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }}>Sign out</button></div>
    <p>Read-only exception queues include rejected ITNs, stale pending orders, invoice exceptions, and verified-payment mismatches. Refund approval is audited separately from actual refund execution. Candidate pages cannot settle payments.</p>
    {notice && <p role="status" style={{ padding: 12, background: "#172554", borderRadius: 8 }}>{notice}</p>}
    {queue.generatedAt && <small>Queue snapshot {new Date(queue.generatedAt).toLocaleString()}</small>}
    <section style={panel}><h2>Rejected / unaccepted PayFast ITNs ({queue.rejectedItns.length})</h2>{queue.rejectedItns.length === 0 && !notice && <p>No rejected ITN records in the current queue.</p>}<div style={grid}>{queue.rejectedItns.map(row => <article key={row.id} style={card}><strong>{str(row,"itn_ref")} · {str(row,"payment_status")}</strong><p>Merchant ref: {str(row,"merchant_reference")}</p><p>Signature {String(row.signature_valid)} · IP {String(row.ip_valid)} · Amount {String(row.amount_valid)}</p><p>Gross: {str(row,"amount_gross")} · Provider ID: {str(row,"provider_payment_id")}</p><p>{str(row,"rejection_reason")}</p><small>{str(row,"received_at")}</small></article>)}</div></section>
    <section style={panel}><h2>Refund review queue ({queue.refundExceptions.length})</h2>{queue.refundExceptions.length === 0 && !notice && <p>No refund exceptions in the current queue.</p>}<div style={grid}>{queue.refundExceptions.map(refund => { const draft = drafts[String(refund.id)] || { notes: "", evidenceUrl: "" }; return <article key={refund.id} style={card}><strong>{str(refund,"refund_ref")} · {str(refund,"refund_status")}</strong><p>{money(refund.amount_cents,refund.currency)} · Candidate {str(refund,"candidate_ref")}</p><p>Payment {str(refund,"payment_ref")} · Order {str(refund,"order_ref")}</p><p>Reason: {str(refund,"reason")}</p><small>Requested {str(refund,"created_at")}</small><label style={label}>HTTPS evidence URL<input style={field} value={draft.evidenceUrl} onChange={e => patch(String(refund.id),{evidenceUrl:e.target.value})} placeholder="https://..." /></label><label style={label}>Review rationale<textarea style={field} rows={2} maxLength={2000} value={draft.notes} onChange={e => patch(String(refund.id),{notes:e.target.value})} /></label><div style={actions}><button disabled={busy===String(refund.id)} onClick={() => void reviewRefund(refund,"APPROVE")}>Approve refund request</button><button disabled={busy===String(refund.id)} onClick={() => void reviewRefund(refund,"REJECT")}>Reject request</button></div><small>Approval does not issue the refund. Execution requires a separate verified finance action.</small></article>; })}</div></section>
    <section style={panel}><h2>Stale pending orders ({queue.staleOrders.length})</h2>{queue.staleOrders.length ? <div style={grid}>{queue.staleOrders.map(row => <article key={row.id} style={card}><strong>{str(row,"order_ref")}</strong><p>{str(row,"plan_code")} · {money(row.amount_cents,row.currency)} · {str(row,"order_status")}</p><p>Candidate {str(row,"candidate_ref")}</p><small>Created {str(row,"created_at")}</small></article>)}</div> : <p>No stale pending orders in the current queue.</p>}</section>
    <section style={panel}><h2>Verified failed/cancelled orders ({queue.failedOrders.length})</h2>{queue.failedOrders.length ? <div style={grid}>{queue.failedOrders.map(row => <article key={row.id} style={card}><strong>{str(row,"order_ref")} · {str(row,"order_status")}</strong><p>{str(row,"plan_code")} · {money(row.amount_cents,row.currency)}</p><p>Candidate {str(row,"candidate_ref")}</p><small>Updated {str(row,"updated_at")}</small></article>)}</div> : <p>No failed or cancelled orders in the last 30 days.</p>}</section>
    <section style={panel}><h2>Invoice exceptions ({queue.invoiceExceptions.length})</h2>{queue.invoiceExceptions.length ? <div style={grid}>{queue.invoiceExceptions.map(row => <article key={row.id} style={card}><strong>{str(row,"invoice_ref")}</strong><p>{str(row,"invoice_status")} · {money(row.amount_cents,row.currency)}</p><p>Order {str(row,"order_ref")} · Candidate {str(row,"candidate_ref")}</p><p>Issued {str(row,"issued_at")} · Due {str(row,"due_at")}</p></article>)}</div> : <p>No invoice exceptions in the current queue.</p>}</section>
    <section style={panel}><h2>Verified-payment mismatches ({queue.paymentMismatches.length})</h2>{queue.paymentMismatches.length ? <div style={grid}>{queue.paymentMismatches.map(row => <article key={row.id} style={card}><strong>{str(row,"payment_ref")}</strong><p>{money(row.amount_gross_cents,row.currency)} · {str(row,"payment_status")}</p><p>Order status {str(row,"order_status")} · Invoice status {str(row,"invoice_status")}</p><p>Merchant reference {str(row,"merchant_reference")}</p></article>)}</div> : <p>No verified-payment/order/invoice mismatches in the current queue.</p>}</section>
  </main>;
}
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 };
const label: React.CSSProperties = { display: "grid", gap: 6, marginTop: 10 };
const actions: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" };
