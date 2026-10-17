"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../../lib/supabase-browser-auth";

type ProfileData = { candidate: Record<string, unknown>; profile: Record<string, unknown> | null; changeRequests: Array<Record<string, unknown>> };
const fields = [
  { key: "display_name", label: "Full name", source: "candidate" },
  { key: "phone", label: "Phone number", source: "candidate" },
  { key: "city", label: "City", source: "profile" },
  { key: "province", label: "Province", source: "profile" },
  { key: "highest_grade", label: "Highest grade / qualification", source: "profile" }
] as const;
const fieldStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };

export default function CandidateProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [field, setField] = useState("phone");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const session = await getKingsmenSession();
    if (!session) { setError("Sign in first to access your private candidate profile."); setLoading(false); return; }
    const response = await fetch("/api/candidate/profile", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "Profile could not be loaded.");
    setData(result as ProfileData);
  }

  useEffect(() => { load().catch(e => setError(e instanceof Error ? e.message : "Profile could not be loaded.")).finally(() => setLoading(false)); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Your session expired. Sign in again.");
      const response = await fetch("/api/candidate/profile", { method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ field, value, reason }), cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Correction request failed.");
      setMessage(result.message || "Correction request saved.");
      setValue(""); setReason(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Correction request failed."); }
    finally { setBusy(false); }
  }

  const currentValue = (key: string, source: "candidate" | "profile") => {
    const raw = source === "candidate" ? data?.candidate[key] : data?.profile?.[key];
    return typeof raw === "string" && raw ? raw : "Not supplied";
  };

  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/candidate/dashboard" style={{ color: "#a5b4fc" }}>← Candidate dashboard</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><h1>My profile</h1><button onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }} style={{ padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#111a2e", color: "#fff" }}>Sign out</button></div>
    <p style={{ color: "#b8c0d9" }}>Your profile is read from persisted candidate records. Corrections are submitted as review requests; they do not silently overwrite trusted data.</p>
    {loading && <p>Loading your saved profile…</p>}
    {error && <p role="alert" style={{ background: "#451a1a", padding: 12, borderRadius: 8 }}>{error}</p>}
    {message && <p role="status" style={{ background: "#172554", padding: 12, borderRadius: 8 }}>{message}</p>}
    {data && <>
      <section style={panel}><h2>Saved details</h2><p>Email: {String(data.candidate.email || "Not supplied")}</p><p>Candidate reference: {String(data.candidate.public_ref || "Not supplied")}</p><p>Journey state: {String(data.candidate.current_state || "Unknown")}</p><p>Profile review: {String(data.profile?.profile_confidence || "Not yet assessed")}</p>
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>{fields.map(item => <div key={item.key} style={{ background: "#111a2e", padding: 12, borderRadius: 8 }}><dt style={{ color: "#b8c0d9" }}>{item.label}</dt><dd style={{ margin: "6px 0 0", overflowWrap: "anywhere" }}>{currentValue(item.key, item.source)}</dd></div>)}</dl></section>
      <section style={panel}><h2>Request a correction</h2><form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 620 }}><label>Field to correct<select value={field} onChange={e => setField(e.target.value)} style={fieldStyle}>{fields.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label>Requested value<input required maxLength={500} value={value} onChange={e => setValue(e.target.value)} style={fieldStyle} /></label><label>Reason for correction<textarea required minLength={8} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} rows={3} style={fieldStyle} /></label><button disabled={busy} style={{ padding: 12, border: 0, borderRadius: 8, background: "#a5b4fc", fontWeight: 800 }}>{busy ? "Submitting…" : "Submit correction for review"}</button></form></section>
      <section style={panel}><h2>Correction history</h2>{data.changeRequests.length === 0 ? <p>No correction requests yet.</p> : <div style={{ display: "grid", gap: 10 }}>{data.changeRequests.map(row => <article key={String(row.id)} style={{ border: "1px solid #39445e", padding: 12, borderRadius: 8 }}><strong>{String(row.field_name)}</strong> · {String(row.status)}<p style={{ margin: "6px 0" }}>Requested: {String(row.requested_value)}</p><p style={{ color: "#b8c0d9", margin: "6px 0" }}>{String(row.reason)}</p><small>{String(row.requested_at)}</small></article>)}</div>}</section>
    </>}
  </main>;
}

const panel: React.CSSProperties = { marginTop: 18, padding: 18, border: "1px solid #303b53", borderRadius: 12, background: "#0b1222" };
