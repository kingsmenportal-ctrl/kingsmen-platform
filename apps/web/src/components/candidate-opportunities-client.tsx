"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession } from "../lib/supabase-browser-auth";

type Opportunity = Record<string, unknown> & { id: string; title?: string; programme_name?: string; description?: string; eligibility?: string; eligibility_summary?: string; province?: string | null; application_url?: string | null; source_url?: string | null; official_source_url?: string | null; closes_at?: string | null; updated_at?: string; provider?: Record<string, unknown>; organisation?: Record<string, unknown> };
type Payload = { ok: boolean; error?: string; listings?: Opportunity[]; routes?: Opportunity[]; savedListingIds?: string[]; savedRouteIds?: string[]; message?: string };

export default function CandidateOpportunitiesClient({ savedOnly = false }: { savedOnly?: boolean }) {
  const [listings, setListings] = useState<Opportunity[]>([]);
  const [routes, setRoutes] = useState<Opportunity[]>([]);
  const [savedListings, setSavedListings] = useState<string[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("ALL");
  const [notice, setNotice] = useState("Loading verified opportunities…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in to discover opportunities and save them to your candidate account."); return; }
    const response = await fetch("/api/candidate/opportunities", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json() as Payload;
    if (!response.ok || !data.ok) throw new Error(data.error || "Opportunities could not be loaded.");
    setListings(data.listings || []); setRoutes(data.routes || []);
    setSavedListings(data.savedListingIds || []); setSavedRoutes(data.savedRouteIds || []);
    setNotice(data.message || "");
  }, []);

  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Opportunities could not be loaded.")); }, [load]);

  async function trackApplication(kind: "listing" | "route", sourceId: string) {
    setBusy(`track:${kind}:${sourceId}`); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to track an application.");
      const response = await fetch("/api/candidate/applications", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ kind, sourceId }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Application could not be tracked.");
      setNotice(data.message || "Opportunity added to your application tracker.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Application could not be tracked."); }
    finally { setBusy(""); }
  }

  async function save(kind: "listing" | "route", id: string, currentlySaved: boolean) {
    setBusy(`${kind}:${id}`); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to manage saved opportunities.");
      const response = await fetch("/api/candidate/opportunities", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ kind, id, action: currentlySaved ? "unsave" : "save" }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Saved opportunity could not be updated.");
      await load();
      setNotice(currentlySaved ? "Removed from your saved opportunities." : "Saved to your candidate account.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Saved opportunity could not be updated."); }
    finally { setBusy(""); }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleListings = listings.filter(row => (!savedOnly || savedListings.includes(row.id)) && (province === "ALL" || row.province === province) && (!normalizedSearch || [row.title,row.description,row.eligibility,row.location_text,(row.organisation as Record<string,unknown> | undefined)?.display_name].some(value => String(value || "").toLowerCase().includes(normalizedSearch))));
  const visibleRoutes = routes.filter(row => (!savedOnly || savedRoutes.includes(row.id)) && (province === "ALL" || row.province === province) && (!normalizedSearch || [row.programme_name,row.route_type,row.qualification_type,row.eligibility_summary,(row.provider as Record<string,unknown> | undefined)?.provider_name].some(value => String(value || "").toLowerCase().includes(normalizedSearch))));
  const provinces = [...new Set([...listings, ...routes].map(row => String(row.province || "")).filter(Boolean))].sort();
  function card(row: Opportunity, kind: "listing" | "route") {
    const isRoute = kind === "route";
    const saved = (isRoute ? savedRoutes : savedListings).includes(row.id);
    const title = String(isRoute ? row.programme_name || "Verified route" : row.title || "Verified opportunity");
    const source = String(isRoute ? row.source_url || (row.provider as Record<string,unknown> | undefined)?.base_url || "" : row.application_url || row.official_source_url || "");
    const org = String(isRoute ? (row.provider as Record<string,unknown> | undefined)?.provider_name || "" : (row.organisation as Record<string,unknown> | undefined)?.display_name || "");
    return <article key={`${kind}:${row.id}`} style={{ padding: 16, border: "1px solid #39445e", borderRadius: 12, display: "grid", gap: 8, background: "#0b1222" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><span style={{ fontSize: 12, letterSpacing: 1, color: "#a5b4fc" }}>{isRoute ? String(row.route_type || "ROUTE") : String(row.listing_type || "OPPORTUNITY")}</span><span style={{ fontSize: 12, color: "#a7f3d0" }}>Verified source</span></div>
      <h3 style={{ margin: 0 }}>{title}</h3>{org && <p style={{ margin: 0 }}>{org}</p>}
      <p style={{ margin: 0, color: "#cbd5e1" }}>{String(isRoute ? row.eligibility_summary || row.qualification_type || "" : row.description || row.eligibility || "")}</p>
      <p style={{ margin: 0, color: "#b8c0d9" }}>{[row.province, row.location_text, row.closes_at ? `Closes ${new Date(String(row.closes_at)).toLocaleDateString()}` : ""].filter(Boolean).join(" · ")}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button disabled={busy === `${kind}:${row.id}`} onClick={() => void save(kind,row.id,saved)} style={{ padding: "9px 12px", borderRadius: 8 }}>{busy === `${kind}:${row.id}` ? "Saving…" : saved ? "Remove saved" : "Save opportunity"}</button><button disabled={busy === `track:${kind}:${row.id}`} onClick={() => void trackApplication(kind,row.id)} style={{ padding: "9px 12px", borderRadius: 8 }}>{busy === `track:${kind}:${row.id}` ? "Adding…" : "Track application"}</button>
        {source.startsWith("https://") && <a href={source} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 12px", borderRadius: 8, color: "#c7d2fe" }}>Official source ↗</a>}
      </div>
    </article>;
  }

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/candidate/dashboard" style={{ color: "#a5b4fc" }}>← Candidate dashboard</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><h1>{savedOnly ? "Saved opportunities" : "Discover opportunities"}</h1><nav style={{ display: "flex", gap: 12 }}><Link href="/candidate/discover">Discover</Link><Link href="/candidate/saved-opportunities">Saved</Link><Link href="/candidate/applications">Application tracker</Link></nav></div>
    <p>Only current verified route providers and published listings from verified organisations are shown. An external application link is a handoff, not proof of submission or acceptance.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, margin: "18px 0" }}><input aria-label="Search opportunities" placeholder="Search provider, title or eligibility" value={search} onChange={e => setSearch(e.target.value)} style={fieldStyle}/><select aria-label="Filter province" value={province} onChange={e => setProvince(e.target.value)} style={fieldStyle}><option value="ALL">All provinces</option>{provinces.map(p => <option key={p} value={p}>{p}</option>)}</select><button type="button" onClick={() => void load().catch(e => setNotice(e instanceof Error ? e.message : "Refresh failed."))}>Refresh verified records</button></div>
    {notice && <p role="status" style={{ padding: 12, background: "#172554", borderRadius: 8 }}>{notice}</p>}
    <section><h2>Partner opportunities</h2>{visibleListings.length ? <div style={{ display: "grid", gap: 12 }}>{visibleListings.map(row => card(row,"listing"))}</div> : <p>No matching published opportunities in the connected source records.</p>}</section>
    <section style={{ marginTop: 28 }}><h2>Verified routes and programmes</h2>{visibleRoutes.length ? <div style={{ display: "grid", gap: 12 }}>{visibleRoutes.map(row => card(row,"route"))}</div> : <p>No matching verified routes in the connected source records.</p>}</section>
    {savedOnly && visibleListings.length + visibleRoutes.length === 0 && <p>Your saved list is empty or no saved item currently meets the public verification rules.</p>}
  </main>;
}
const fieldStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
