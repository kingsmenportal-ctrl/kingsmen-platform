"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../../lib/supabase-browser-auth";

type Organisation = { id: string; display_name: string; organisation_type: string; official_website: string | null; contact_email: string; province: string | null; verification_status: string; created_at: string };
type Listing = { id: string; organisation_id: string; listing_type: string; title: string; description: string; official_source_url: string; application_url: string | null; province: string | null; status: string; created_at: string; review_notes: string };
type Queue = { ok: boolean; error?: string; organisations: Organisation[]; listings: Listing[] };
type Draft = { evidence: string; notes: string };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };

export default function FounderMarketplaceReviewPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notice, setNotice] = useState("Loading founder review queue…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in with an authorised founder/operator account to view review queues."); return; }
    const response = await fetch("/api/founder/marketplace-queue", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json() as Queue;
    if (!response.ok || !data.ok) throw new Error(data.error || "Review queue could not be loaded.");
    setOrganisations(data.organisations || []); setListings(data.listings || []);
    setDrafts(current => {
      const next = { ...current };
      for (const row of data.organisations || []) next[`ORGANISATION:${row.id}`] ||= { evidence: "", notes: "" };
      for (const row of data.listings || []) next[`LISTING:${row.id}`] ||= { evidence: "", notes: "" };
      return next;
    });
    setNotice("");
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Review queue could not be loaded.")); }, [load]);

  function setDraft(key: string, patch: Partial<Draft>) { setDrafts(current => ({ ...current, [key]: { evidence: "", notes: "", ...current[key], ...patch } })); }
  async function decide(kind: "ORGANISATION" | "LISTING", id: string, decision: string) {
    const key = `${kind}:${id}`;
    const draft = drafts[key] || { evidence: "", notes: "" };
    const evidenceUrls = draft.evidence.split(/[\n,]/).map(v => v.trim()).filter(Boolean);
    if (["VERIFIED","PUBLISHED"].includes(decision) && !evidenceUrls.length) { setNotice("Enter at least one HTTPS evidence URL before verifying or publishing."); return; }
    setBusy(key); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to review marketplace records.");
      const response = await fetch("/api/founder/marketplace-queue", { method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ entityKind: kind, entityId: id, decision, evidenceUrls, notes: draft.notes }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Review action failed.");
      setNotice(data.message || "Review action completed."); await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Review action failed."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1150, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/workspace">← Operations workspace</Link> · <Link href="/founder/control-plane">Control plane</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><h1>Marketplace review queue</h1><button onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }}>Sign out</button></div>
    <p>Review organisation claims and submitted listings. Verification/publication requires HTTPS evidence; the database transaction writes the state change and audit event together. Candidate and partner accounts cannot call the reviewer function successfully.</p>
    {notice && <p role="status" style={{ background: "#172554", padding: 12, borderRadius: 8 }}>{notice}</p>}
    <section><h2>Organisations awaiting verification ({organisations.length})</h2>{organisations.length === 0 && !notice && <p>No pending organisation records are visible to this reviewer account.</p>}<div style={{ display: "grid", gap: 12 }}>{organisations.map(org => { const key = `ORGANISATION:${org.id}`; const draft = drafts[key] || { evidence: "", notes: "" }; return <article key={org.id} style={card}><div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><h3 style={{ margin: 0 }}>{org.display_name}</h3><b>{org.verification_status}</b></div><p>{org.organisation_type} · {org.contact_email} · {org.province || "Province not supplied"}</p><p>{org.official_website || "No official website supplied"}</p><small>Submitted {new Date(org.created_at).toLocaleString()} · Reference {org.id}</small><label style={label}>Evidence URLs (one per line)<textarea rows={2} style={field} value={draft.evidence} onChange={e => setDraft(key,{evidence:e.target.value})} /></label><label style={label}>Reviewer notes<textarea rows={2} maxLength={2000} style={field} value={draft.notes} onChange={e => setDraft(key,{notes:e.target.value})} /></label><div style={actions}><button disabled={busy===key} onClick={() => void decide("ORGANISATION",org.id,"VERIFIED")}>Verify with evidence</button><button disabled={busy===key} onClick={() => void decide("ORGANISATION",org.id,"REJECTED")}>Reject</button><button disabled={busy===key} onClick={() => void decide("ORGANISATION",org.id,"SUSPENDED")}>Suspend</button></div></article>; })}</div></section>
    <section style={{ marginTop: 28 }}><h2>Listings awaiting review ({listings.length})</h2>{listings.length === 0 && !notice && <p>No pending listing records are visible to this reviewer account.</p>}<div style={{ display: "grid", gap: 12 }}>{listings.map(listing => { const key = `LISTING:${listing.id}`; const draft = drafts[key] || { evidence: "", notes: "" }; return <article key={listing.id} style={card}><div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><h3 style={{ margin: 0 }}>{listing.title}</h3><b>{listing.status}</b></div><p>{listing.listing_type} · {listing.province || "Province not supplied"} · Organisation {listing.organisation_id}</p><p>{listing.description}</p><p><a href={listing.official_source_url} target="_blank" rel="noopener noreferrer">Open official source ↗</a>{listing.application_url && <> · <a href={listing.application_url} target="_blank" rel="noopener noreferrer">Application destination ↗</a></>}</p><small>Submitted {new Date(listing.created_at).toLocaleString()} · Reference {listing.id}</small><label style={label}>Evidence URLs (one per line)<textarea rows={2} style={field} value={draft.evidence} onChange={e => setDraft(key,{evidence:e.target.value})} /></label><label style={label}>Reviewer notes<textarea rows={2} maxLength={2000} style={field} value={draft.notes} onChange={e => setDraft(key,{notes:e.target.value})} /></label><div style={actions}><button disabled={busy===key} onClick={() => void decide("LISTING",listing.id,"PUBLISHED")}>Verify and publish</button><button disabled={busy===key} onClick={() => void decide("LISTING",listing.id,"REJECTED")}>Reject</button><button disabled={busy===key} onClick={() => void decide("LISTING",listing.id,"CLOSED")}>Close</button></div></article>; })}</div></section>
    <p style={{ marginTop: 24 }}>If the reviewer function migration is not deployed, actions fail closed. Never mark a listing published without independent source evidence and a verified organisation.</p>
  </main>;
}
const card: React.CSSProperties = { padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" };
const label: React.CSSProperties = { display: "grid", gap: 6, marginTop: 10 };
const actions: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 };
