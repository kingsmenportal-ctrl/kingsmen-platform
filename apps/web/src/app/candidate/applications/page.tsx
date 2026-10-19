"use client";

import { useCallback, useEffect, useState } from "react";
import { candidateWorkspaceRequest } from "@/lib/candidate-workspace-client";

type Opportunity = { id: string; title: string; organisation: string; url: string; pathway: string; closingDate?: string };
type Tracker = { id: string; saved_opportunity_id: string; status: string; candidate_note: string; evidence_reference: string; updated_at: string };
type Event = { id: string; tracker_id: string; previous_status: string | null; new_status: string; candidate_note: string; evidence_reference: string; changed_at: string };
const labels: Record<string, string> = {
  SAVED: "Saved", PREPARING: "Preparing", READY_TO_APPLY: "Ready to apply",
  SUBMITTED_CANDIDATE_REPORTED: "Submission reported by candidate",
  RESPONSE_RECEIVED: "Response received", INTERVIEW: "Interview",
  OFFER_RECEIVED: "Offer received", REJECTED: "Rejected", CLOSED: "Closed"
};
const statusOptions = Object.entries(labels);

export default function CandidateApplicationsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Loading your application tracker…");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [workspace, tracking] = await Promise.all([
        candidateWorkspaceRequest<{ opportunities: Opportunity[] }>("GET"),
        candidateWorkspaceRequest<{ applications: Tracker[]; events: Event[] }>("GET", undefined, "/api/candidate/applications")
      ]);
      setOpportunities(workspace.opportunities ?? []);
      setTrackers(tracking.applications ?? []);
      setEvents(tracking.events ?? []);
      setStatus(Object.fromEntries((tracking.applications ?? []).map((item) => [item.id, item.status])));
      setNotes(Object.fromEntries((tracking.applications ?? []).map((item) => [item.id, item.candidate_note ?? ""])));
      setEvidence(Object.fromEntries((tracking.applications ?? []).map((item) => [item.id, item.evidence_reference ?? ""])));
      setMessage("Loaded from your authenticated Kingsmen account and Truth Vault.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sign in with a verified candidate account to use the tracker."); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function action(method: "POST" | "PATCH" | "DELETE", body?: unknown, query = "") {
    setBusy(true);
    try {
      await candidateWorkspaceRequest(method, body, `/api/candidate/applications${query}`);
      await load();
      setMessage("Saved to Truth Vault.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your change."); }
    finally { setBusy(false); }
  }

  const titleFor = (id: string) => opportunities.find((item) => item.id === id);
  const tracked = new Set(trackers.map((item) => item.saved_opportunity_id));
  const eventsByTracker = new Map<string, Event[]>();
  for (const event of events) eventsByTracker.set(event.tracker_id, [...(eventsByTracker.get(event.tracker_id) ?? []), event]);

  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(1rem,4vw,2.5rem)", color: "#172033" }}>
    <header style={{ padding: "1.5rem", borderRadius: 16, background: "#10233f", color: "#fff" }}>
      <p style={{ marginTop: 0, letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".78rem" }}>Kingsmen · Candidate workspace</p>
      <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.5rem)" }}>Application tracker</h1>
      <p style={{ maxWidth: 720, lineHeight: 1.6 }}>Track preparation, next steps and responses for opportunities you have saved. Statuses are your own records; Kingsmen does not claim an institution received or accepted an application.</p>
    </header>
    <p role="status" aria-live="polite">{message}</p>
    <section style={{ marginTop: "1.25rem" }}>
      <h2>Saved opportunities to track</h2>
      {opportunities.length === 0 ? <p>There are no saved opportunities in your account yet. Save an opportunity in your workspace first.</p> : <div style={{ display: "grid", gap: ".8rem" }}>
        {opportunities.map((item) => <article key={item.id} style={{ border: "1px solid #d9e1ec", borderRadius: 12, padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{item.title}</h3><p>{item.organisation} · {item.pathway}{item.closingDate ? ` · Closes ${item.closingDate}` : ""}</p>
          <a href={item.url} target="_blank" rel="noreferrer">Open official opportunity source</a>
          <div style={{ marginTop: ".75rem" }}>{tracked.has(item.id) ? <strong>Already tracked</strong> : <button disabled={busy} onClick={() => void action("POST", { savedOpportunityId: item.id })}>Start tracking</button>}</div>
        </article>)}
      </div>}
    </section>
    <section style={{ marginTop: "1.75rem" }}>
      <h2>Your tracked applications ({trackers.length})</h2>
      {trackers.length === 0 ? <p>Start tracking one of your saved opportunities to build your application timeline.</p> : <div style={{ display: "grid", gap: "1rem" }}>
        {trackers.map((item) => { const opportunity = titleFor(item.saved_opportunity_id); return <article key={item.id} style={{ border: "1px solid #d9e1ec", borderRadius: 14, padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{opportunity?.title ?? "Saved opportunity"}</h3><p>{opportunity?.organisation ?? "Organisation"} · Updated {new Date(item.updated_at).toLocaleDateString()}</p>
          <label style={{ display: "grid", gap: ".35rem", marginBottom: ".75rem" }}>Status
            <select value={status[item.id] ?? item.status} onChange={(event) => setStatus((current) => ({ ...current, [item.id]: event.target.value }))}>
              {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: ".35rem", marginBottom: ".75rem" }}>Notes (optional)
            <textarea maxLength={1200} value={notes[item.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} rows={3} />
          </label>
          <label style={{ display: "grid", gap: ".35rem", marginBottom: ".75rem" }}>Confirmation / evidence reference {status[item.id] === "SUBMITTED_CANDIDATE_REPORTED" ? "(required)" : "(optional)"}
            <input maxLength={500} value={evidence[item.id] ?? ""} onChange={(event) => setEvidence((current) => ({ ...current, [item.id]: event.target.value }))} />
          </label>
          <button disabled={busy} onClick={() => void action("PATCH", { id: item.id, status: status[item.id] ?? item.status, candidateNote: notes[item.id] ?? "", evidenceReference: evidence[item.id] ?? "" })}>Save tracker update</button>
          <button disabled={busy} style={{ marginLeft: ".5rem" }} onClick={() => void action("DELETE", undefined, `?id=${encodeURIComponent(item.id)}`)}>Remove tracker</button>
          <details style={{ marginTop: ".8rem" }}><summary>Change history ({(eventsByTracker.get(item.id) ?? []).length})</summary>
            <ol>{(eventsByTracker.get(item.id) ?? []).map((event) => <li key={event.id}>{new Date(event.changed_at).toLocaleString()}: {event.previous_status ? `${labels[event.previous_status] ?? event.previous_status} → ` : ""}{labels[event.new_status] ?? event.new_status}{event.evidence_reference ? ` · Evidence: ${event.evidence_reference}` : ""}</li>)}</ol>
          </details>
        </article>; })}
      </div>}
    </section>
    <aside style={{ marginTop: "1.5rem", padding: "1rem", background: "#fff8e8", borderLeft: "4px solid #b7791f" }}>
      <strong>Important:</strong> “Submission reported by candidate” means you recorded it and supplied a reference. It is not an independent confirmation from the institution. Check official channels and keep your confirmation.
    </aside>
  </main>;
}
