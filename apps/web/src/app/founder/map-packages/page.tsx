"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type PackageRow = {
  id: string; map_ref: string; candidate_id: string; public_ref?: string; display_name?: string;
  route_name?: string; institution_or_provider?: string; application_id: string; reason_code: string;
  reason_summary: string; source_links: string[]; required_documents: string[]; status: string;
  review_evidence_urls: string[]; created_at: string; review_notes?: string | null;
};
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };

export default function FounderMapPackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [completionRef, setCompletionRef] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("Loading MAP review queue…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in with an authorised founder/operator account."); return; }
    const response = await fetch("/api/founder/map-packages", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "MAP queue unavailable.");
    setPackages(data.packages as PackageRow[]);
    setNotice("");
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "MAP queue unavailable.")); }, [load]);

  async function decide(row: PackageRow, decision: "APPROVE" | "REJECT" | "VERIFY_COMPLETION") {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in again before reviewing."); return; }
    const urls = (evidence[row.id] || "").split(/\r?\n/).map(v => v.trim()).filter(Boolean);
    const reason = (notes[row.id] || "").trim();
    if (reason.length < 8) { setNotice("Enter a review rationale of at least eight characters."); return; }
    if ((decision === "APPROVE" || decision === "VERIFY_COMPLETION") && urls.length === 0) { setNotice("Approval and completion verification require evidence URLs."); return; }
    if (decision === "VERIFY_COMPLETION" && (completionRef[row.id] || "").trim().length < 3) { setNotice("Completion verification requires a provider receipt or evidence reference."); return; }
    setBusy(row.id); setNotice("");
    try {
      const response = await fetch("/api/founder/map-packages", {
        method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ packageId: row.id, decision, evidenceUrls: urls, notes: reason, completionEvidenceRef: completionRef[row.id] || "" }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Review was not confirmed.");
      setNotice(`${row.map_ref}: ${data.package.status} — transaction and audit confirmed.`);
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Review failed."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/workspace" style={{ color: "#a5b4fc" }}>← Founder workspace</Link></p>
    <h1>Manual Application Package review</h1>
    <p>Approve only after checking the official source and independent evidence. Completion must be backed by verifiable provider evidence. Approval is not a provider submission.</p>
    {notice && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#172554" }}>{notice}</p>}
    {packages.length === 0 ? <p>No packages are waiting or in active manual handling.</p> : <div style={{ display: "grid", gap: 16 }}>{packages.map(row => <article key={row.id} style={{ padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><h2 style={{ margin: 0 }}>{row.map_ref}</h2><strong>{row.status}</strong></div>
      <p>Candidate: {row.display_name || "Candidate"} ({row.public_ref || row.candidate_id}) · {row.route_name || row.institution_or_provider || row.application_id}</p>
      <p>{row.reason_code} — {row.reason_summary}</p>
      <h4>Candidate-supplied official sources (verify independently)</h4><ul>{(row.source_links || []).map((url, i) => <li key={i}><a href={url} target="_blank" rel="noreferrer" style={{ color: "#a5b4fc", overflowWrap: "anywhere" }}>{url}</a></li>)}</ul>
      <h4>Document labels supplied</h4><ul>{(row.required_documents || []).map((d, i) => <li key={i}>{d}</li>)}</ul>
      {row.status === "DRAFT" && <>
        <label style={{ display: "block", marginBottom: 10 }}>Independent evidence URLs (one HTTPS URL per line)
          <textarea style={field} rows={3} value={evidence[row.id] || ""} onChange={e => setEvidence(s => ({ ...s, [row.id]: e.target.value }))} placeholder="https://official-provider.example/evidence" />
        </label>
        <label style={{ display: "block", marginBottom: 10 }}>Review rationale
          <textarea style={field} rows={2} value={notes[row.id] || ""} onChange={e => setNotes(s => ({ ...s, [row.id]: e.target.value }))} placeholder="Explain what was checked and why this package is safe to release." />
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button disabled={busy === row.id} onClick={() => void decide(row, "APPROVE")}>Approve and release to candidate</button>
          <button disabled={busy === row.id} onClick={() => void decide(row, "REJECT")}>Reject draft</button>
        </div>
      </>}
      {["DELIVERED", "IN_PROGRESS"].includes(row.status) && <>
        <label style={{ display: "block", marginBottom: 10 }}>Completion evidence URLs (one HTTPS URL per line)
          <textarea style={field} rows={2} value={evidence[row.id] || ""} onChange={e => setEvidence(s => ({ ...s, [row.id]: e.target.value }))} />
        </label>
        <label style={{ display: "block", marginBottom: 10 }}>Provider receipt / evidence reference
          <input style={field} value={completionRef[row.id] || ""} onChange={e => setCompletionRef(s => ({ ...s, [row.id]: e.target.value }))} />
        </label>
        <label style={{ display: "block", marginBottom: 10 }}>Verification rationale
          <textarea style={field} rows={2} value={notes[row.id] || ""} onChange={e => setNotes(s => ({ ...s, [row.id]: e.target.value }))} />
        </label>
        <button disabled={busy === row.id} onClick={() => void decide(row, "VERIFY_COMPLETION")}>Verify completion with evidence</button>
      </>}
      {row.review_notes && <p>Previous review: {row.review_notes}</p>}
      <small>Created {new Date(row.created_at).toLocaleString()}</small>
    </article>)}</div>}
  </main>;
}
