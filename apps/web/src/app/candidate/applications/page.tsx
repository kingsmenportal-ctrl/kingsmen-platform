"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type Tracker = { id: string; source_kind: string; route_programme_id: string | null; organisation_listing_id: string | null; status: string; candidate_submission_reference: string | null; candidate_submission_note: string; candidate_reported_submitted_at: string | null; created_at: string; updated_at: string };
type ExistingApplication = { id: string; route_type: string; route_name: string; institution_or_provider: string; current_state: string; source_confidence_band: string; portal_health: string; map_fallback_required: boolean; last_evidence_ref: string | null; created_at: string; updated_at: string };
type EditState = { status: string; reference: string; note: string };
const statuses = ["PLANNING","PREPARING","READY_FOR_EXTERNAL_PORTAL","EXTERNAL_PORTAL_OPENED","CANDIDATE_REPORTED_SUBMITTED"] as const;
const style: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };

export default function CandidateApplicationsPage() {
  const [tracker, setTracker] = useState<Tracker[]>([]);
  const [existing, setExisting] = useState<ExistingApplication[]>([]);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [notice, setNotice] = useState("Loading your application tracker…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in to see application records linked to your candidate account."); return; }
    const response = await fetch("/api/candidate/applications", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Application records could not be loaded.");
    const rows = (data.tracker || []) as Tracker[];
    setTracker(rows);
    setExisting((data.existingApplications || []) as ExistingApplication[]);
    setEdits(current => Object.fromEntries(rows.map(row => [row.id, current[row.id] || { status: row.status, reference: row.candidate_submission_reference || "", note: row.candidate_submission_note || "" }])));
    setNotice("");
  }, []);

  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Application tracker could not be loaded.")); }, [load]);

  function update(id: string, patch: Partial<EditState>) {
    setEdits(current => ({ ...current, [id]: { ...(current[id] || { status: "PLANNING", reference: "", note: "" }), ...patch } }));
  }

  async function save(id: string) {
    const edit = edits[id];
    if (!edit) return;
    if (edit.status === "CANDIDATE_REPORTED_SUBMITTED" && edit.reference.trim().length < 3) {
      setNotice("Add the provider confirmation or submission reference before reporting submission.");
      return;
    }
    setBusy(id); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to update your tracker.");
      const response = await fetch("/api/candidate/applications", {
        method: "PATCH",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ trackerId: id, status: edit.status, reference: edit.reference, note: edit.note }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Tracker update failed.");
      setNotice(data.message || "Application tracker updated.");
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Tracker update failed."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1050, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/candidate/dashboard" style={{ color: "#a5b4fc" }}>← Candidate dashboard</Link></p><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><h1>Application tracker</h1><nav style={{ display: "flex", gap: 12 }}><Link href="/candidate/discover">Discover opportunities</Link><Link href="/candidate/saved-opportunities">Saved opportunities</Link><Link href="/candidate/map-packages">Manual packages</Link></nav></div>
    <p>Track your preparation and external submission. A candidate-reported submission is not provider acknowledgement, acceptance, or a verified outcome.</p>
    {notice && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#172554" }}>{notice}</p>}
    <section><h2>My tracked opportunities</h2>{tracker.length === 0 && !notice && <p>No opportunities are in your tracker yet. Use Discover opportunities to add a verified listing or route.</p>}
      <div style={{ display: "grid", gap: 14 }}>{tracker.map(row => { const edit = edits[row.id] || { status: row.status, reference: row.candidate_submission_reference || "", note: row.candidate_submission_note || "" }; return <article key={row.id} style={{ padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><h3 style={{ margin: 0 }}>{row.source_kind === "PARTNER_LISTING" ? "Partner listing" : "Route programme"}</h3><strong>{row.status}</strong></div>
        <p style={{ overflowWrap: "anywhere" }}>Source reference: {row.organisation_listing_id || row.route_programme_id}</p>
        <div style={{ display: "grid", gap: 10 }}><label>My progress<select style={style} value={edit.status} onChange={e => update(row.id,{status:e.target.value})}>{statuses.map(s => <option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></label>
          {edit.status === "CANDIDATE_REPORTED_SUBMITTED" && <label>Submission reference (required)<input style={style} value={edit.reference} maxLength={200} onChange={e => update(row.id,{reference:e.target.value})} placeholder="Provider confirmation / reference" /></label>}
          <label>Notes<textarea style={style} rows={2} maxLength={2000} value={edit.note} onChange={e => update(row.id,{note:e.target.value})} /></label>
          <button disabled={busy === row.id} onClick={() => void save(row.id)} style={{ width: "fit-content", padding: "10px 14px" }}>{busy === row.id ? "Saving…" : "Save progress"}</button>
        </div>
        {row.candidate_reported_submitted_at && <p>Reported submitted: {new Date(row.candidate_reported_submitted_at).toLocaleString()} · Reference: {row.candidate_submission_reference}</p>}
        <small>Last updated {new Date(row.updated_at).toLocaleString()}</small>
      </article>; })}</div>
    </section>
    <section style={{ marginTop: 28 }}><h2>Existing application records</h2>{existing.length === 0 ? <p>No legacy application records were returned.</p> : <div style={{ display: "grid", gap: 10 }}>{existing.map(row => <article key={row.id} style={{ padding: 14, border: "1px solid #39445e", borderRadius: 10 }}><strong>{row.route_name || row.route_type}</strong><p>{row.institution_or_provider} · {row.current_state}</p><p>Evidence confidence: {row.source_confidence_band} · Portal health: {row.portal_health}</p>{(row.map_fallback_required || ["OTP_REQUIRED","CAPTCHA_BLOCKED","DOWN","MANUAL_ONLY"].includes(row.portal_health) || ["C","D"].includes(row.source_confidence_band)) && <section aria-label="Manual Application Package fallback" style={{ marginTop: 12, padding: 14, border: "1px solid #b7791f", borderRadius: 10, background: "#2a1c0b" }}><h4 style={{ marginTop: 0 }}>Manual Application Package (MAP) required</h4><p>Automated portal progression is blocked or not safe. This is a manual hand-off state, not a successful submission. Do not bypass OTP/CAPTCHA or claim that the provider received an application.</p><ol><li>Open the provider's official source independently and verify the current programme, deadline, fees, requirements, and submission channel.</li><li>Prepare the listed documents and ask an authorised operator for help if needed.</li><li>Submit through the official manual channel only when the candidate and operator are ready.</li><li>Record the provider receipt or other evidence before marking submission or outcome.</li></ol><p>Reason: {row.portal_health || "Manual review required"}{row.last_evidence_ref ? <> · Evidence reference: {row.last_evidence_ref}</> : " · No evidence reference is recorded yet."}</p><p>MAP creation or delivery is not implied by this indicator; contact support if no MAP package is available.</p><Link href="/candidate/messages">Contact support</Link></section>}<small>{new Date(row.updated_at).toLocaleString()}</small></article>)}</div>}</section>
    <p style={{ marginTop: 24 }}>Provider-confirmed status changes, acceptance/rejection decisions, and verified outcomes remain restricted to authorised evidence workflows.</p>
  </main>;
}
