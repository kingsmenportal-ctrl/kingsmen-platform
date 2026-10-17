"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../lib/supabase-browser-auth";

type Organisation = { id: string; display_name: string; organisation_type: string; official_website: string | null; verification_status: string; province: string | null; created_at: string };
type Listing = { id: string; organisation_id: string; title: string; listing_type: string; description: string; status: string; official_source_url: string; application_url: string | null; application_method: string; province: string | null; location_text: string | null; eligibility: unknown; opens_at: string | null; closes_at: string | null; source_verified_at: string | null; created_at: string; reviewed_at: string | null; review_notes: string | null };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
const organisationTypes = ["EMPLOYER","RECRUITER","UNIVERSITY","TVET","PRIVATE_COLLEGE","TRAINING_PROVIDER","SETA","FUNDER","ACCOMMODATION_PROVIDER","COMMUNITY_PARTNER","OTHER"];
const listingTypes = ["JOB","INTERNSHIP","LEARNERSHIP","APPRENTICESHIP","BURSARY","FUNDING","UNIVERSITY_COURSE","TVET_COURSE","TRAINING","ACCOMMODATION","SERVICE"];
const listingMethods = ["EXTERNAL_PORTAL","EMAIL","INTERNAL_REVIEW","IN_PERSON","UNKNOWN"];

export default function PartnerPortalPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [organisationType, setOrganisationType] = useState("EMPLOYER");
  const [website, setWebsite] = useState("");
  const [province, setProvince] = useState("");
  const [organisationId, setOrganisationId] = useState("");
  const [editingListingId, setEditingListingId] = useState("");
  const [listingType, setListingType] = useState("JOB");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [applicationMethod, setApplicationMethod] = useState("EXTERNAL_PORTAL");
  const [eligibility, setEligibility] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [locationText, setLocationText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Sign in as a partner to load your organisation records.");
  const [error, setError] = useState("");

  async function call(path: string, method = "GET", body?: unknown) {
    const session = await getKingsmenSession();
    if (!session) throw new Error("Sign in to access partner operations.");
    const response = await fetch(path, { method, headers: { authorization: `Bearer ${session.access_token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Partner operation failed.");
    return data;
  }
  async function load() {
    const [orgData, listingData] = await Promise.all([call("/api/partner/organisations"), call("/api/partner/listings")]);
    const orgs = (orgData.organisations || []) as Organisation[];
    setOrganisations(orgs); setListings((listingData.listings || []) as Listing[]);
    setOrganisationId(current => current || orgs[0]?.id || "");
    setNotice(orgs.length ? "" : "No organisation record yet. Submit onboarding for verification.");
  }
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Partner records could not be loaded.")); }, []);

  async function submitOrganisation(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await call("/api/partner/organisations", "POST", { displayName, organisationType, website, province });
      setDisplayName(""); setWebsite(""); await load(); setNotice(result.message || "Organisation submitted for verification.");
    } catch (e) { setError(e instanceof Error ? e.message : "Organisation onboarding failed."); }
    finally { setBusy(false); }
  }
  async function submitListing(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await call("/api/partner/listings", "POST", { organisationId, listingType, title, description, officialSourceUrl: sourceUrl, applicationUrl, applicationMethod, province, locationText, eligibility, opensAt: opensAt ? new Date(opensAt).toISOString() : null, closesAt: closesAt ? new Date(closesAt).toISOString() : null });
      setNotice(result.message || "Listing submitted for review."); setTitle(""); setDescription(""); setSourceUrl(""); setApplicationUrl(""); setEligibility(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Listing submission failed."); }
    finally { setBusy(false); }
  }

  function editListing(listing: Listing) {
    setEditingListingId(listing.id); setOrganisationId(listing.organisation_id);
    setListingType(listing.listing_type); setTitle(listing.title); setDescription(listing.description);
    setSourceUrl(listing.official_source_url); setApplicationUrl(listing.application_url || "");
    setApplicationMethod(listing.application_method); setProvince(listing.province || "");
    setLocationText(listing.location_text || "");
    const eligibilityObject = listing.eligibility as { summary?: unknown } | null;
    setEligibility(typeof eligibilityObject?.summary === "string" ? eligibilityObject.summary : "");
    setOpensAt(toLocalInput(listing.opens_at)); setClosesAt(toLocalInput(listing.closes_at));
    setNotice("Editing a pending listing. Saving will keep it pending; it cannot self-publish.");
  }

  return <main style={{ maxWidth: 1080, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/">← Portal home</Link> · <Link href="/auth/login">Sign in</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}><h1>Partner operations</h1><button type="button" onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }}>Sign out</button></div>
    <p>Submit your organisation for verification, then create source-backed listings. Submissions remain private and pending until authorised review; this portal cannot publish or verify itself.</p>
    {notice && <p role="status" style={{ background: "#172554", padding: 12, borderRadius: 8 }}>{notice}</p>}
    {error && <p role="alert" style={{ background: "#451a1a", padding: 12, borderRadius: 8 }}>{error}</p>}
    <section style={panel}><h2>Organisation onboarding</h2><form onSubmit={submitOrganisation} style={grid}>
      <label>Organisation name<input required minLength={2} maxLength={180} style={field} value={displayName} onChange={e => setDisplayName(e.target.value)} /></label>
      <label>Organisation type<select style={field} value={organisationType} onChange={e => setOrganisationType(e.target.value)}>{organisationTypes.map(t => <option key={t}>{t}</option>)}</select></label>
      <label>Official website (HTTPS)<input type="url" style={field} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.org" /></label>
      <label>Province<input maxLength={100} style={field} value={province} onChange={e => setProvince(e.target.value)} /></label>
      <button disabled={busy} type="submit">{busy ? "Submitting…" : "Submit organisation for review"}</button>
    </form>
    <h3>My organisations</h3>{organisations.length ? <div style={{ display: "grid", gap: 8 }}>{organisations.map(org => <article key={org.id} style={card}><strong>{org.display_name}</strong><p>{org.organisation_type} · <b>{org.verification_status}</b></p><small>{org.official_website || "No website supplied"} · {org.province || "Province not supplied"}</small></article>)}</div> : <p>No organisations are linked to this sign-in yet.</p>}</section>
    <section style={panel}><h2>{editingListingId ? "Edit pending listing" : "Submit a listing"}</h2>{!organisations.length && <p>Submit an organisation above first. Listing creation is still constrained by database ownership policy.</p>}<form onSubmit={submitListing} style={grid}>
      <label>Organisation<select required disabled={!organisations.length} style={field} value={organisationId} onChange={e => setOrganisationId(e.target.value)}>{organisations.map(org => <option key={org.id} value={org.id}>{org.display_name} · {org.verification_status}</option>)}</select></label>
      <label>Listing type<select style={field} value={listingType} onChange={e => setListingType(e.target.value)}>{listingTypes.map(t => <option key={t}>{t}</option>)}</select></label>
      <label>Title<input required minLength={3} maxLength={220} style={field} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label>Province<input maxLength={100} style={field} value={province} onChange={e => setProvince(e.target.value)} /></label>
      <label>Location<input maxLength={300} style={field} value={locationText} onChange={e => setLocationText(e.target.value)} /></label>
      <label>Official source URL (HTTPS)<input required type="url" style={field} value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://official-source.example" /></label>
      <label>Application URL (HTTPS, if applicable)<input type="url" style={field} value={applicationUrl} onChange={e => setApplicationUrl(e.target.value)} /></label>
      <label>Application method<select style={field} value={applicationMethod} onChange={e => setApplicationMethod(e.target.value)}>{listingMethods.map(m => <option key={m}>{m}</option>)}</select></label>
      <label>Opens at<input type="datetime-local" style={field} value={opensAt} onChange={e => setOpensAt(e.target.value)} /></label>
      <label>Closes at<input type="datetime-local" style={field} value={closesAt} onChange={e => setClosesAt(e.target.value)} /></label>
      <label style={{ gridColumn: "1 / -1" }}>Description<textarea required minLength={10} maxLength={12000} rows={4} style={field} value={description} onChange={e => setDescription(e.target.value)} /></label>
      <label style={{ gridColumn: "1 / -1" }}>Eligibility summary<textarea maxLength={4000} rows={2} style={field} value={eligibility} onChange={e => setEligibility(e.target.value)} /></label>
      <button disabled={busy || !organisations.length} type="submit">{busy ? "Saving…" : editingListingId ? "Save pending listing" : "Submit listing for review"}</button>{editingListingId && <button type="button" disabled={busy} onClick={() => setEditingListingId("")}>Cancel edit</button>}
    </form></section>
    <section style={panel}><h2>My submitted listings</h2>{listings.length ? <div style={{ display: "grid", gap: 10 }}>{listings.map(listing => <article key={listing.id} style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{listing.title}</strong><b>{listing.status}</b></div><p>{listing.listing_type} · Submitted {new Date(listing.created_at).toLocaleString()}</p><p>Source: <a href={listing.official_source_url} target="_blank" rel="noopener noreferrer">{listing.official_source_url}</a></p>{listing.review_notes && <p>Review note: {listing.review_notes}</p>}{["DRAFT","PENDING_REVIEW"].includes(listing.status) && !listing.source_verified_at && <button type="button" onClick={() => editListing(listing)}>Edit pending listing</button>}</article>)}</div> : <p>No listing submissions yet.</p>}</section>
  </main>;
}
const panel: React.CSSProperties = { marginTop: 20, padding: 18, border: "1px solid #303b53", borderRadius: 12, background: "#0b1222" };
const card: React.CSSProperties = { padding: 12, border: "1px solid #39445e", borderRadius: 8 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12, alignItems: "end" };

function toLocalInput(value: string | null) { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
