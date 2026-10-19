"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../../lib/supabase-browser-auth";

type LinkRequest = { id: string; verifiedEmail: string; candidateReference: string | null; status: string; requestedAt: string; correlationId: string };
type Candidate = { id: string; public_ref: string; display_name: string; email: string; current_state: string; is_active: boolean };
type Draft = { candidateId: string; evidence: string; notes: string };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
const panel: React.CSSProperties = { marginTop: 18, padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" };

export default function FounderIdentityLinkQueuePage() {
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notice, setNotice] = useState("Loading candidate identity requests…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in with an authorised founder/operator account to review identity requests."); return; }
    const response = await fetch("/api/founder/identity-link-queue", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Identity review queue could not be loaded.");
    const nextRequests = (data.requests || []) as LinkRequest[];
    const nextCandidates = (data.candidates || []) as Candidate[];
    setRequests(nextRequests); setCandidates(nextCandidates);
    setDrafts(current => {
      const next = { ...current };
      for (const item of nextRequests) {
        const suggested = nextCandidates.find(c => c.public_ref === item.candidateReference)?.id || "";
        next[item.id] ||= { candidateId: suggested, evidence: "", notes: "" };
      }
      return next;
    });
    setNotice("");
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Identity review queue could not be loaded.")); }, [load]);

  function patch(id: string, change: Partial<Draft>) { setDrafts(current => ({ ...current, [id]: { candidateId: "", evidence: "", notes: "", ...current[id], ...change } })); }

  async function decide(item: LinkRequest, decision: "APPROVE" | "REJECT") {
    const draft = drafts[item.id] || { candidateId: "", evidence: "", notes: "" };
    const evidenceUrls = draft.evidence.split(String.fromCharCode(10)).flatMap(v => v.split(",")).map(v => v.trim()).filter(Boolean);
    if (decision === "APPROVE" && (!draft.candidateId || evidenceUrls.length === 0)) {
      setNotice("Choose the candidate record and provide independent HTTPS evidence before approving. A reference hint is not proof of identity.");
      return;
    }
    setBusy(item.id); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to review identity requests.");
      const response = await fetch("/api/founder/identity-link-queue", { method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ requestId: item.id, decision, candidateId: draft.candidateId || null, evidenceUrls, notes: draft.notes }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Identity review action failed.");
      setNotice(data.message || "Identity review completed."); await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Identity review action failed."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/workspace">← Operations workspace</Link> · <Link href="/founder/marketplace-review">Marketplace review</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><h1>Candidate identity-link review</h1><button onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }}>Sign out</button></div>
    <p>Identity requests are not automatic links. Select the actual candidate record only after independent identity checks, provide evidence URLs, and approve or reject. The database transaction binds Auth identity, activates the account, and records the audit event together.</p>
    {notice && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#172554" }}>{notice}</p>}
    {requests.length === 0 && !notice && <p>No pending identity-link requests are visible to this reviewer.</p>}
    <section style={{ display: "grid", gap: 14 }}>{requests.map(item => { const draft = drafts[item.id] || { candidateId: "", evidence: "", notes: "" }; return <article key={item.id} style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>Request {item.id}</h2><b>{item.status}</b></div>
      <p>Confirmed email: {item.verifiedEmail}</p><p>Candidate reference supplied: {item.candidateReference || "None"} (hint only, not identity proof)</p><small>Requested {new Date(item.requestedAt).toLocaleString()} · Correlation {item.correlationId}</small>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}><label>Candidate record<select style={field} value={draft.candidateId} onChange={e => patch(item.id,{candidateId:e.target.value})}><option value="">Select after identity review</option>{candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.public_ref} · {candidate.display_name} · {candidate.current_state}</option>)}</select></label>
      <label>Independent evidence URLs (HTTPS, one per line)<textarea rows={3} style={field} value={draft.evidence} onChange={e => patch(item.id,{evidence:e.target.value})} placeholder="Evidence must support this specific identity decision" /></label>
      <label>Decision notes<textarea rows={2} maxLength={2000} style={field} value={draft.notes} onChange={e => patch(item.id,{notes:e.target.value})} /></label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button disabled={busy===item.id} onClick={() => void decide(item,"APPROVE")}>Approve verified link</button><button disabled={busy===item.id} onClick={() => void decide(item,"REJECT")}>Reject request</button></div>
    </div></article>; })}</section>
    <p style={{ marginTop: 24 }}>Never approve by matching email alone. The reference, account metadata, or a successful sign-in is not independent identity proof. If evidence is ambiguous, reject or leave the request pending for manual investigation.</p>
  </main>;
}
