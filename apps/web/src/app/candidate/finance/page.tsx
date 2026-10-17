"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type FinanceItem = { id: string; item_type: string; item_ref: string; description: string; amount_cents: number; currency: string; status: string; provider?: string | null; created_at: string };
const packages = [["Foundational Accord", "R169.99"], ["Collegiate Ordinance", "R299.99"], ["Chancellor's Writ", "R399.99"], ["Regency Mandate", "R469.99"], ["Artisan Charter", "R149.99"], ["Guildmaster's Charter", "R199.99"], ["CV Revamp", "R49.99"]] as const;

export default function CandidateFinancePage() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [message, setMessage] = useState("Loading your finance records…");
  useEffect(() => { void (async () => {
    const session = await getKingsmenSession();
    if (!session) { setMessage("Sign in to see finance records attached to your candidate account."); return; }
    const response = await fetch("/api/candidate/finance", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Finance records could not be loaded.");
    setItems(data.items || []); setMessage("");
  })().catch(e => setMessage(e instanceof Error ? e.message : "Finance records could not be loaded.")); }, []);
  const money = (cents: number, currency: string) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: currency || "ZAR" }).format((Number(cents) || 0) / 100);
  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}><p><Link href="/candidate/dashboard">← Candidate dashboard</Link></p><h1>Kingsmen Financial View</h1><p>Saved finance entries are read from your candidate record. This screen cannot initiate a payment or mark an item paid.</p>{message && <p role="status">{message}</p>}<section><h2>My finance records</h2>{items.length === 0 && !message ? <p>No finance records are attached to this candidate yet.</p> : <div style={{ display: "grid", gap: 10 }}>{items.map(item => <article key={item.id} style={{ padding: 14, border: "1px solid #39445e", borderRadius: 10 }}><strong>{item.description}</strong><p>{item.item_type} · {item.item_ref}</p><p>{money(item.amount_cents, item.currency)} · <b>{item.status}</b></p><small>{new Date(item.created_at).toLocaleString()} {item.provider ? `· ${item.provider}` : ""}</small></article>)}</div>}</section><section style={{ marginTop: 28 }}><h2>Published service packages</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>{packages.map(([name, price]) => <article key={name} style={{ padding: 14, border: "1px solid #39445e", borderRadius: 10 }}><h3>{name}</h3><p>{price}</p></article>)}</div></section><section style={{ marginTop: 20 }}><h2>Payment and refund controls</h2><p>Paid status requires a verified provider callback or authorised finance review. Return URLs cannot mark payments as paid. Refunds require finance review.</p></section></main>;
}
