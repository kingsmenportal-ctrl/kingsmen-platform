"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type AppRow = { id: string; route_type?: string; route_name?: string; institution_or_provider?: string; portal_health?: string; map_fallback_required?: boolean; last_evidence_ref?: string | null; current_state?: string };
type PackageRow = {
  id: string; map_ref: string; application_id: string; reason_code: string; reason_summary: string;
  source_links: string[]; required_documents: string[]; manual_steps: string[]; review_evidence_urls: string[];
  status: string; review_notes?: string | null; reviewed_at?: string | null; delivered_at?: string | null;
  delivery_confirmed_at?: string | null; completion_evidence_ref?: string | null; created_at: string; updated_at: string;
};
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
const reasons = ["OTP_REQUIRED", "CAPTCHA_BLOCKED", "PORTAL_DOWN", "MANUAL_ONLY", "SOURCE_REVIEW_REQUIRED", "OTHER"];

export default function CandidateMapPackagesPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [reasonCode, setReasonCode] = useState("MANUAL_ONLY");
  const [reasonSummary, setReasonSummary] = useState("");
  const [sourceLinks, setSourceLinks] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState("");
  const [notice, setNotice] = useState("Loading Manual Application Packages…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in to manage packages linked to your verified candidate identity."); return; }
    const response = await fetch("/api/candidate/map-packages", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Packages could not be loaded.");
    const nextApps = (data.applications || []) as AppRow[];
    setApps(nextApps);
    setPackages((data.packages || []) as PackageRow[]);
    setApplicationId(current => current || nextApps[0]?.id || "");
    setNotice("");
  }, []);

  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Packages could not be loaded.")); }, [load]);

  async function mutate(method: "POST" | "PATCH", body: Record<string, unknown>, key: string) {
    const session = await getKingsmenSession();
    if (!session) throw new Error("Sign in again before changing a package.");
    const response = await fetch("/api/candidate/map-packages", {
      method, headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
      body: JSON.stringify(body), cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "The package action was not confirmed.");
    setNotice(data.message || key);
    await load();
  }

  async function create() {
    setBusy("create"); setNotice("");
    try {
      const sources = sourceLinks.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      const documents = requiredDocuments.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      await mutate("POST", { applicationId, reasonCode, reasonSummary, sourceLinks: sources, requiredDocuments: documents }, "Draft package saved.");
      setReasonSummary(""); setSourceLinks(""); setRequiredDocuments("");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not create the draft."); }
    finally { setBusy(""); }
  }

  async function action(id: string, actionName: "CONFIRM_DELIVERY" | "START") {
    setBusy(id); setNotice("");
    try { await mutate("PATCH", { packageId: id, action: actionName }, actionName === "START" ? "Package marked in progress." : "Portal delivery receipt confirmed."); }
    catch (e) { setNotice(e instanceof Error ? e.message : "Package action failed."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/candidate/applications" style={{ color: "#a5b4fc" }}>← Application tracker</Link></p>
    <h1>Manual Application Packages (MAP)</h1>
    <p>Use MAP when OTP, CAPTCHA, an unavailable portal, manual-only requirements, or uncertain source evidence make automation unsafe. A saved draft is not a provider submission.</p>
    {notice && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#172554" }}>{notice}</p>}
    <section style={{ padding: 18, border: "1px solid #39445e", borderRadius: 12, marginBottom: 24 }}>
      <h2>Create a draft package</h2>
      {apps.length === 0 ? <p>No application record currently flags MAP fallback. Use the application tracker and contact support if a portal needs manual handling.</p> : <>
        <label style={{ display: "block", marginBottom: 12 }}>Application
          <select style={field} value={applicationId} onChange={e => setApplicationId(e.target.value)}>{apps.map(a => <option key={a.id} value={a.id}>{a.route_name || a.route_type || "Application"} — {a.institution_or_provider || a.id} ({a.portal_health || "review"})</option>)}</select>
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>Fallback reason
          <select style={field} value={reasonCode} onChange={e => setReasonCode(e.target.value)}>{reasons.map(r => <option key={r}>{r}</option>)}</select>
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>What blocked safe automation?
          <textarea style={field} rows={3} maxLength={2000} value={reasonSummary} onChange={e => setReasonSummary(e.target.value)} placeholder="Describe the portal state and what you observed." />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>Official source URLs (one HTTPS URL per line; reviewed before approval)
          <textarea style={field} rows={3} value={sourceLinks} onChange={e => setSourceLinks(e.target.value)} placeholder="https://official-provider.example/apply" />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>Required document labels (one per line; include only requirements you have confirmed)
          <textarea style={field} rows={3} value={requiredDocuments} onChange={e => setRequiredDocuments(e.target.value)} placeholder="Identity document (only if officially required)" />
        </label>
        <button disabled={busy === "create" || !applicationId} onClick={() => void create()} style={{ padding: "10px 16px" }}>{busy === "create" ? "Saving draft…" : "Save draft for authorised review"}</button>
      </>}
      <p><small>New packages start as DRAFT. A founder/operator must review independent source evidence before the package becomes available as READY. No provider submission or receipt is implied.</small></p>
    </section>
    <section>
      <h2>My packages</h2>
      {packages.length === 0 ? <p>No saved packages yet.</p> : <div style={{ display: "grid", gap: 14 }}>{packages.map(p => <article key={p.id} style={{ padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>{p.map_ref}</h3><strong>{p.status}</strong></div>
        <p>{p.reason_code.replaceAll("_", " ")} — {p.reason_summary}</p>
        <h4>Source links</h4><ul>{(p.source_links || []).map((url, i) => <li key={i}><a href={url} target="_blank" rel="noreferrer" style={{ color: "#a5b4fc", overflowWrap: "anywhere" }}>{url}</a></li>)}</ul>
        <h4>Document checklist</h4>{(p.required_documents || []).length ? <ul>{p.required_documents.map((d, i) => <li key={i}>{d}</li>)}</ul> : <p>No specific document requirements have been recorded.</p>}
        <h4>Manual steps</h4><ol>{(p.manual_steps || []).map((s, i) => <li key={i}>{s}</li>)}</ol>
        {p.review_notes && <p>Reviewer notes: {p.review_notes}</p>}
        {p.review_evidence_urls?.length > 0 && <p>Review evidence: {p.review_evidence_urls.map((url, i) => <span key={url}>{i > 0 ? " · " : ""}<a href={url} target="_blank" rel="noreferrer" style={{ color: "#a5b4fc" }}>Evidence {i + 1}</a></span>)}</p>}
        {p.status === "READY" && <button disabled={busy === p.id} onClick={() => void action(p.id, "CONFIRM_DELIVERY")} style={{ padding: "9px 12px" }}>Confirm I received this package in the portal</button>}
        {p.status === "DELIVERED" && <button disabled={busy === p.id} onClick={() => void action(p.id, "START")} style={{ padding: "9px 12px" }}>Mark manual work in progress</button>}
        {p.status === "COMPLETED" && <p>Completion verified by an authorised operator. Evidence reference: {p.completion_evidence_ref}</p>}
        {p.status === "DRAFT" && <p>Waiting for authorised review. This draft is not yet approved or delivered.</p>}
        {p.status === "REJECTED" && <p>Not approved. Review the operator notes and contact support before acting.</p>}
        {p.status === "DELIVERED" && p.delivery_confirmed_at && <p>Portal receipt confirmed: {new Date(p.delivery_confirmed_at).toLocaleString()}</p>}
        <small>Created {new Date(p.created_at).toLocaleString()} · Updated {new Date(p.updated_at).toLocaleString()}</small>
      </article>)}</div>}
    </section>
  </main>;
}
