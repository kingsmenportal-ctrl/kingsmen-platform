"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type Row = Record<string, unknown> & { id: string };
type FinanceData = { items: Row[]; orders: Row[]; invoices: Row[]; payments: Row[]; refunds: Row[]; ledger: Row[] };
const packages = [["Foundational Accord", "R169.99"], ["Collegiate Ordinance", "R299.99"], ["Chancellor's Writ", "R399.99"], ["Regency Mandate", "R469.99"], ["Artisan Charter", "R149.99"], ["Guildmaster's Charter", "R199.99"], ["CV Revamp", "R49.99"]] as const;
const panel: React.CSSProperties = { marginTop: 24, padding: 16, border: "1px solid #39445e", borderRadius: 12 };
const money = (cents: unknown, currency: unknown) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: typeof currency === "string" && currency ? currency : "ZAR" }).format((Number(cents) || 0) / 100);
const str = (row: Row, key: string, fallback = "—") => typeof row[key] === "string" && row[key] ? String(row[key]) : fallback;

export default function CandidateFinancePage() {
  const [data, setData] = useState<FinanceData>({ items: [], orders: [], invoices: [], payments: [], refunds: [], ledger: [] });
  const [candidateRef, setCandidateRef] = useState("");
  const [message, setMessage] = useState("Loading your finance records…");
  useEffect(() => { void (async () => {
    const session = await getKingsmenSession();
    if (!session) { setMessage("Sign in to see finance records attached to your candidate account."); return; }
    const response = await fetch("/api/candidate/finance", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Finance records could not be loaded.");
    setData({ items: result.items || [], orders: result.orders || [], invoices: result.invoices || [], payments: result.payments || [], refunds: result.refunds || [], ledger: result.ledger || [] });
    setCandidateRef(result.candidateReference || ""); setMessage("");
  })().catch(e => setMessage(e instanceof Error ? e.message : "Finance records could not be loaded.")); }, []);

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/candidate/dashboard">← Candidate dashboard</Link></p><h1>Kingsmen Financial View</h1><p>Candidate finance reference: {candidateRef || "Unavailable"}. These are persisted records. This screen cannot initiate payments or mark an item paid.</p>{message && <p role="status">{message}</p>}
    <section style={panel}><h2>Orders ({data.orders.length})</h2>{data.orders.length ? <div style={stack}>{data.orders.map(row => <article key={row.id} style={card}><strong>{str(row,"plan_code","Service order")}</strong><p>{str(row,"order_ref")} · {str(row,"order_status")}</p><p>{money(row.amount_cents,row.currency)}</p><small>{str(row,"created_at")}</small></article>)}</div> : <p>No service orders are attached to this candidate yet.</p>}</section>
    <section style={panel}><h2>Invoices ({data.invoices.length})</h2>{data.invoices.length ? <div style={stack}>{data.invoices.map(row => <article key={row.id} style={card}><strong>{str(row,"invoice_ref")}</strong><p>Order {str(row,"order_ref")} · {str(row,"invoice_status")}</p><p>{money(row.amount_cents,row.currency)}</p><p>Issued {str(row,"issued_at")} · Due {str(row,"due_at")}</p>{row.paid_at && <p>Paid at {str(row,"paid_at")}</p>}</article>)}</div> : <p>No invoices found.</p>}</section>
    <section style={panel}><h2>Payments ({data.payments.length})</h2>{data.payments.length ? <div style={stack}>{data.payments.map(row => <article key={row.id} style={card}><strong>{str(row,"payment_ref")}</strong><p>{str(row,"provider")} · {str(row,"payment_status")} · {row.verified === true ? "Verified" : "Not verified"}</p><p>Gross {money(row.amount_gross_cents,row.currency)} · Fee {money(row.amount_fee_cents,row.currency)} · Net {money(row.amount_net_cents,row.currency)}</p><small>{str(row,"created_at")}</small></article>)}</div> : <p>No payment records found.</p>}</section>
    <section style={panel}><h2>Refund requests ({data.refunds.length})</h2>{data.refunds.length ? <div style={stack}>{data.refunds.map(row => <article key={row.id} style={card}><strong>{str(row,"refund_ref")}</strong><p>{str(row,"refund_status")} · {money(row.amount_cents,row.currency)}</p><p>{str(row,"reason")}</p><small>{str(row,"created_at")}</small></article>)}</div> : <p>No refund requests found.</p>}</section>
    <section style={panel}><h2>Ledger entries ({data.ledger.length})</h2>{data.ledger.length ? <div style={stack}>{data.ledger.map(row => <article key={row.id} style={card}><strong>{str(row,"entry_type")} · {str(row,"ledger_ref")}</strong><p>{str(row,"description")}</p><p>Debit {money(row.debit_cents,row.currency)} · Credit {money(row.credit_cents,row.currency)}</p><small>{str(row,"created_at")} · Evidence {str(row,"evidence_ref")}</small></article>)}</div> : <p>No ledger entries found.</p>}</section>
    <section style={panel}><h2>Additional finance items ({data.items.length})</h2>{data.items.length ? <div style={stack}>{data.items.map(row => <article key={row.id} style={card}><strong>{str(row,"description")}</strong><p>{str(row,"item_ref")} · {str(row,"status")} · {money(row.amount_cents,row.currency)}</p></article>)}</div> : <p>No additional items found.</p>}</section>
    <section style={panel}><h2>Published service packages</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>{packages.map(([name, price]) => <article key={name} style={card}><h3>{name}</h3><p>{price}</p></article>)}</div></section>
    <section style={panel}><h2>Payment integrity</h2><p>Paid status requires a verified provider callback or authorised finance review. Browser return URLs cannot mark payments as paid. Refunds require finance review. Ledger entries are read-only in this candidate portal.</p></section>
  </main>;
}
const stack: React.CSSProperties = { display: "grid", gap: 10 };
const card: React.CSSProperties = { padding: 14, border: "1px solid #39445e", borderRadius: 10, overflowWrap: "anywhere" };
