"use client";

import { useCallback, useEffect, useState } from "react";

type FinanceEntry = {
  entryId: string;
  type: "FEE" | "PAYMENT" | "REFUND" | "ADJUSTMENT";
  direction: "IN" | "OUT";
  status: "RECORDED" | "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED";
  amountCents: number;
  currency?: string;
  description: string;
  reference?: string;
  occurredOn?: string;
  createdAt?: string;
};
type Workspace = { financeLedger?: FinanceEntry[]; error?: string };
const packages = [
  ["Foundational Accord", "R169.99"],
  ["Collegiate Ordinance", "R299.99"],
  ["Chancellor's Writ", "R399.99"],
  ["Regency Mandate", "R469.99"],
  ["Artisan Charter", "R149.99"],
  ["Guildmaster's Charter", "R199.99"],
  ["CV Revamp", "R49.99"]
] as const;

function money(entry: FinanceEntry) {
  const amount = Number(entry.amountCents);
  if (!Number.isFinite(amount) || amount < 0) return "Amount unavailable";
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: entry.currency || "ZAR" }).format(amount / 100);
}
function dateLabel(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}
function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function statusStyle(status: string) {
  if (status === "CONFIRMED") return { background: "#d8f2e6", color: "#176345" };
  if (status === "FAILED" || status === "CANCELLED") return { background: "#fee2e2", color: "#9f2d25" };
  if (status === "PENDING") return { background: "#fef3c7", color: "#92400e" };
  return { background: "#eaf0f6", color: "#35536c" };
}

export default function CandidateFinancePage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({})) as Workspace;
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Please sign in to view your private finance records." : (data.error || "Finance records could not be loaded."));
      if (!Array.isArray(data.financeLedger)) throw new Error("The finance ledger returned an unexpected response.");
      setEntries(data.financeLedger);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Finance records could not be loaded.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const confirmedPayments = entries.filter((entry) => entry.type === "PAYMENT" && entry.status === "CONFIRMED" && entry.direction === "IN").reduce((sum, entry) => sum + (Number(entry.amountCents) || 0), 0);
  const pending = entries.filter((entry) => entry.status === "PENDING").length;
  const refunds = entries.filter((entry) => entry.type === "REFUND");
  const panel = { border: "1px solid #dbe3ec", borderRadius: 16, padding: 20, background: "#fff" };

  return <main style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 20px 64px", color: "#172033" }}>
    <a href="/candidate/dashboard" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none", fontSize: 14 }}>← Candidate dashboard</a>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 14, margin: "22px 0 26px" }}>
      <div><p style={{ color: "#53657a", fontSize: 12, fontWeight: 800, letterSpacing: 1.8, margin: "0 0 8px" }}>ACCOUNT TRANSPARENCY</p><h1 style={{ fontSize: "clamp(30px, 5vw, 42px)", margin: "0 0 10px" }}>Finance & service orders</h1><p style={{ color: "#53657a", lineHeight: 1.7, maxWidth: 720, margin: 0 }}>Review the recorded finance ledger, listed service packages and any recorded refund entries.</p></div>
      <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 13px", background: "#fff", fontWeight: 800, cursor: "pointer" }}>{refreshing ? "Refreshing…" : "Refresh ledger"}</button>
    </header>

    {error && <div role="alert" style={{ background: "#fff1f0", border: "1px solid #fecaca", color: "#8a1c13", borderRadius: 12, padding: 14, marginBottom: 18 }}>{error}<button type="button" onClick={() => void load(true)} style={{ marginLeft: 10, color: "inherit", background: "transparent", border: 0, textDecoration: "underline", cursor: "pointer" }}>Try again</button></div>}

    <section aria-label="Finance summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 22 }}>
      <div style={panel}><p style={{ color: "#64748b", fontSize: 13, margin: "0 0 7px" }}>Confirmed incoming payments</p><strong style={{ fontSize: 25 }}>{loading ? "—" : new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(confirmedPayments / 100)}</strong><p style={{ color: "#64748b", fontSize: 11, margin: "7px 0 0" }}>Only entries already marked confirmed.</p></div>
      <div style={panel}><p style={{ color: "#64748b", fontSize: 13, margin: "0 0 7px" }}>Pending entries</p><strong style={{ fontSize: 25 }}>{loading ? "—" : pending}</strong><p style={{ color: "#64748b", fontSize: 11, margin: "7px 0 0" }}>Awaiting authorised review or reconciliation.</p></div>
      <div style={panel}><p style={{ color: "#64748b", fontSize: 13, margin: "0 0 7px" }}>Refund records</p><strong style={{ fontSize: 25 }}>{loading ? "—" : refunds.length}</strong><p style={{ color: "#64748b", fontSize: 11, margin: "7px 0 0" }}>A record is not proof of refund completion.</p></div>
    </section>

    <section aria-label="Finance ledger" style={{ ...panel, marginBottom: 22 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 21 }}>Your finance ledger</h2><p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>This list comes from your saved candidate workspace. It is not a bank statement or a payment processor receipt.</p>
      {loading ? <p role="status">Loading your private finance ledger…</p> : entries.length === 0 ? <div style={{ borderRadius: 12, padding: 24, background: "#f5f8fb", textAlign: "center" }}><strong>No finance entries recorded</strong><p style={{ color: "#64748b", fontSize: 14, margin: "7px 0 0" }}>There are no finance entries available in your workspace yet. Contact Kingsmen support if you expect to see a transaction here.</p></div> : <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 650, fontSize: 13 }}><thead><tr>{["Date", "Description", "Type", "Amount", "Status", "Reference"].map((heading) => <th key={heading} scope="col" style={{ textAlign: "left", padding: "10px 9px", borderBottom: "1px solid #dbe3ec", color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: .5 }}>{heading}</th>)}</tr></thead><tbody>{entries.slice().sort((a, b) => String(b.occurredOn || b.createdAt || "").localeCompare(String(a.occurredOn || a.createdAt || ""))).map((entry) => <tr key={entry.entryId}><td style={{ padding: "13px 9px", borderBottom: "1px solid #eef2f6", whiteSpace: "nowrap" }}>{dateLabel(entry.occurredOn || entry.createdAt)}</td><td style={{ padding: "13px 9px", borderBottom: "1px solid #eef2f6", minWidth: 170 }}>{entry.description || "Finance entry"}</td><td style={{ padding: "13px 9px", borderBottom: "1px solid #eef2f6" }}>{label(entry.type)}</td><td style={{ padding: "13px 9px", borderBottom: "1px solid #eef2f6", whiteSpace: "nowrap", fontWeight: 800 }}>{entry.direction === "OUT" ? "−" : ""}{money(entry)}</td><td style={{ padding: "13px 9px", borderBottom: "1px solid #eef2f6" }}><span style={{ display: "inline-block", borderRadius: 6, padding: "4px 7px", fontSize: 11, fontWeight: 800, ...statusStyle(entry.status) }}>{label(entry.status)}</span></td><td style={{ padding: "13px 9px", borderBottom: "1px solid #eef2f6", overflowWrap: "anywhere" }}>{entry.reference || "—"}</td></tr>)}</tbody></table></div>}
    </section>

    <section aria-label="Official package prices" style={{ ...panel, marginBottom: 22 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 21 }}>Service package guide</h2><p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px" }}>Published prices for reference. This list does not mean a package is active on your account or that a payment has been received.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))", gap: 10 }}>{packages.map(([name, price]) => <article key={name} style={{ border: "1px solid #e2e8f0", borderRadius: 11, padding: 14 }}><h3 style={{ margin: "0 0 8px", fontSize: 14 }}>{name}</h3><strong style={{ fontSize: 21 }}>{price}</strong></article>)}</div>
    </section>

    <section aria-label="Finance safeguards" style={{ borderRadius: 14, padding: 18, background: "#f1f5f9", color: "#53657a", fontSize: 13, lineHeight: 1.7 }}>
      <strong style={{ color: "#172033" }}>Payment and refund safeguards</strong>
      <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
        <li>Candidates cannot mark their own payments as confirmed.</li>
        <li>A payment return page is not proof of payment; confirmation requires an authorised webhook or manual finance review.</li>
        <li>Refund entries require finance review and do not imply that a refund has been approved or paid.</li>
        <li>If a record looks wrong, use the <a href="/candidate/support" style={{ color: "#1d5675", fontWeight: 800 }}>Support Centre</a> and include the transaction reference, if available.</li>
      </ul>
    </section>
  </main>;
}
