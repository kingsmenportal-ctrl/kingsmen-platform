"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../../lib/supabase-browser-auth";

type RequestRow = { id: string; candidate_id: string; public_ref: string; display_name: string; email: string; field_name: string; old_value: string | null; requested_value: string; reason: string; sensitivity: string; status: string; requested_at: string; source_evidence_ref: string | null };
const panel: React.CSSProperties = { padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };

export default function FounderProfileReviewPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [notice, setNotice] = useState("Loading profile correction queue…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in with an authorised founder/operator account to review profile corrections."); return; }
    const response = await fetch("/api/founder/profile-change-queue", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Profile correction queue could not be loaded.");
    setRequests(data.requests || []); setNotice("");
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Profile correction queue could not be loaded.")); }, [load]);

  async function decide(item: RequestRow, decision: "APPROVED" | "REJECTED") {
    const note = notes[item.id]?.trim() || "";
    if (note.length < 8) { setNotice("Enter a decision reason of at least eight characters."); return; }
    setBusy(item.id); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again before reviewing profile changes.");
      const response = await fetch("/api/founder/profile-change-queue", { method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ requestId: item.id, decision, notes: note }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Profile correction review failed.");
      setNotice(data.message || "Profile correction decision committed and audited."); await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Profile correction review failed."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/workspace">← Operations workspace</Link> · <Link href="/founder/identity-link-queue">Identity review</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}><h1>Candidate profile correction queue</h1><button onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }}>Sign out</button></div>
    <p>Approved corrections are applied atomically and audited. If the candidate's saved value changed after the request was submitted, approval fails closed so a stale request cannot overwrite newer data.</p>
    {notice && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#172554" }}>{notice}</p>}
    {requests.length === 0 && !notice && <p>No pending candidate profile correction requests.</p>}
    <section style={{ display: "grid", gap: 14 }}>{requests.map(item => <article key={item.id} style={panel}><div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}><h2 style={{ margin: 0 }}>{item.field_name} · {item.public_ref}</h2><b>{item.sensitivity}</b></div><p>{item.display_name} · {item.email}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}><div><small>Current value</small><p>{item.old_value || "Not supplied"}</p></div><div><small>Requested value</small><p>{item.requested_value}</p></div></div><p>Reason: {item.reason}</p><p>Evidence reference: {item.source_evidence_ref || "None supplied"}</p><small>Requested {new Date(item.requested_at).toLocaleString()} · Request {item.id}</small><label style={{ display: "grid", gap: 6, marginTop: 12 }}>Reviewer notes<textarea style={field} rows={2} maxLength={2000} value={notes[item.id] || ""} onChange={e => setNotes(current => ({ ...current, [item.id]: e.target.value }))} /></label><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}><button disabled={busy===item.id} onClick={() => void decide(item,"APPROVED")}>Approve and apply</button><button disabled={busy===item.id} onClick={() => void decide(item,"REJECTED")}>Reject request</button></div></article>)}</section>
  </main>;
}
