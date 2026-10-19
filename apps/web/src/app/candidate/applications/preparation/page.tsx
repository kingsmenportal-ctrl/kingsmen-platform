"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { candidateWorkspaceRequest } from "@/lib/candidate-workspace-client";

type Tracker = { id: string; saved_opportunity_id: string; status: string; updated_at: string };
type Opportunity = { id: string; title: string; organisation: string; url: string };
type PrepItem = {
  id: string; tracker_id: string; item_type: "DOCUMENT" | "TASK"; title: string; candidate_note: string;
  official_source_url: string; evidence_reference: string; status: "NOT_STARTED" | "IN_PROGRESS" | "READY_CANDIDATE_REPORTED";
  required_by_candidate: boolean; due_date: string | null; created_at: string; updated_at: string;
};
type PrepEvent = { id: string; item_id: string; tracker_id: string; previous_status: string | null; new_status: string; item_title: string; evidence_reference: string; changed_at: string };
type Draft = { itemType: "DOCUMENT" | "TASK"; title: string; candidateNote: string; officialSourceUrl: string; evidenceReference: string; status: PrepItem["status"]; requiredByCandidate: boolean; dueDate: string };

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Not started", IN_PROGRESS: "In progress", READY_CANDIDATE_REPORTED: "Ready (candidate-reported)"
};
const emptyDraft = (): Draft => ({
  itemType: "DOCUMENT", title: "", candidateNote: "", officialSourceUrl: "", evidenceReference: "",
  status: "NOT_STARTED", requiredByCandidate: true, dueDate: ""
});

export default function ApplicationPreparationPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [items, setItems] = useState<PrepItem[]>([]);
  const [events, setEvents] = useState<PrepEvent[]>([]);
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [edits, setEdits] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState("Loading your application preparation…");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (trackerId?: string) => {
    try {
      const [workspace, tracking] = await Promise.all([
        candidateWorkspaceRequest<{ opportunities: Opportunity[] }>("GET"),
        candidateWorkspaceRequest<{ applications: Tracker[] }>("GET", undefined, "/api/candidate/applications"),
      ]);
      const apps = tracking.applications ?? [];
      setOpportunities(workspace.opportunities ?? []);
      setTrackers(apps);
      const wanted = trackerId || selected || apps[0]?.id || "";
      setSelected(wanted);
      if (wanted && !apps.some((item) => item.id === wanted)) {
        setItems([]); setEvents([]);
        setMessage("That application is not available in your verified candidate workspace.");
        return;
      }
      if (wanted) {
        const prep = await candidateWorkspaceRequest<{ items: PrepItem[]; events: PrepEvent[] }>(
          "GET", undefined, `/api/candidate/applications/preparation?trackerId=${encodeURIComponent(wanted)}`
        );
        setItems(prep.items ?? []);
        setEvents(prep.events ?? []);
        setEdits(Object.fromEntries((prep.items ?? []).map((item) => [item.id, toDraft(item)])));
      } else { setItems([]); setEvents([]); }
      setMessage("Checklist and evidence references are synced to your authenticated account and Truth Vault.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sign in with a verified candidate account to continue."); }
  }, [selected]);

  useEffect(() => { void load(); }, [load]);

  const selectedTracker = trackers.find((item) => item.id === selected);
  const opportunity = opportunities.find((item) => item.id === selectedTracker?.saved_opportunity_id);
  const byItem = useMemo(() => {
    const result = new Map<string, PrepEvent[]>();
    for (const event of events) result.set(event.item_id, [...(result.get(event.item_id) ?? []), event]);
    return result;
  }, [events]);

  async function act(method: "POST" | "PATCH" | "DELETE", body?: unknown, query = "") {
    setBusy(true);
    try {
      await candidateWorkspaceRequest(method, body, `/api/candidate/applications/preparation${query}`);
      await load(selected);
      setMessage("Checklist change saved to Truth Vault.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save checklist change."); }
    finally { setBusy(false); }
  }

  async function createItem() {
    if (!selected) return;
    await act("POST", { trackerId: selected, ...draft });
    setDraft(emptyDraft());
  }

  function toDraft(item: PrepItem): Draft {
    return {
      itemType: item.item_type, title: item.title, candidateNote: item.candidate_note ?? "",
      officialSourceUrl: item.official_source_url ?? "", evidenceReference: item.evidence_reference ?? "",
      status: item.status, requiredByCandidate: item.required_by_candidate, dueDate: item.due_date ?? ""
    };
  }

  function editField(id: string, key: keyof Draft, value: string | boolean) {
    setEdits((current) => ({ ...current, [id]: { ...(current[id] ?? emptyDraft()), [key]: value } }));
  }

  const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: ".6rem", borderRadius: 8, border: "1px solid #bdc9d8" };
  const panelStyle = { border: "1px solid #d9e1ec", borderRadius: 12, padding: "1rem", marginTop: "1rem" };

  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(1rem,4vw,2.5rem)", color: "#172033" }}>
    <header style={{ padding: "1.5rem", borderRadius: 16, background: "#10233f", color: "#fff" }}>
      <p style={{ marginTop: 0, letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".78rem" }}>Kingsmen · Candidate workspace</p>
      <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.5rem)" }}>Application preparation & document readiness</h1>
      <p style={{ maxWidth: 760, lineHeight: 1.6 }}>Create your checklist for each tracked opportunity: documents to prepare, tasks to finish, due dates, official source pages and evidence references. The candidate defines this checklist; Kingsmen does not invent institution-specific requirements.</p>
    </header>
    <p role="status" aria-live="polite">{message}</p>
    <section style={panelStyle}>
      <label style={{ display: "grid", gap: ".4rem" }}>Tracked opportunity
        <select style={inputStyle} value={selected} onChange={(event) => { setSelected(event.target.value); void load(event.target.value); }} disabled={!trackers.length}>
          {trackers.length === 0 ? <option value="">No tracked applications yet</option> : trackers.map((item) => {
            const opp = opportunities.find((candidateOpp) => candidateOpp.id === item.saved_opportunity_id);
            return <option key={item.id} value={item.id}>{opp?.title ?? "Saved opportunity"} — {opp?.organisation ?? "Organisation"}</option>;
          })}
        </select>
      </label>
      {opportunity?.url && <p><a href={opportunity.url} target="_blank" rel="noreferrer">Open official opportunity source</a></p>}
      {trackers.length === 0 && <p>Start tracking a saved opportunity before adding preparation items. <a href="/candidate/applications">Open application tracker</a>.</p>}
    </section>
    {selectedTracker && <>
      <section style={panelStyle}>
        <h2>Add a document or preparation task</h2>
        <p>Only add requirements you have confirmed from the opportunity owner or an official source. Evidence can be a secure reference, document name, or confirmation ID; this form does not upload document files.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: ".8rem" }}>
          <label style={{ display: "grid", gap: ".35rem" }}>Item type<select style={inputStyle} value={draft.itemType} onChange={(e) => setDraft((d) => ({ ...d, itemType: e.target.value as Draft["itemType"] }))}><option value="DOCUMENT">Document</option><option value="TASK">Preparation task</option></select></label>
          <label style={{ display: "grid", gap: ".35rem" }}>Title *<input style={inputStyle} maxLength={160} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder={draft.itemType === "DOCUMENT" ? "e.g. Certified qualification copy" : "e.g. Confirm application closing date"} /></label>
          <label style={{ display: "grid", gap: ".35rem" }}>Due date (optional)<input style={inputStyle} type="date" value={draft.dueDate} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} /></label>
          <label style={{ display: "grid", gap: ".35rem" }}>Official source URL (HTTPS)<input style={inputStyle} type="url" value={draft.officialSourceUrl} onChange={(e) => setDraft((d) => ({ ...d, officialSourceUrl: e.target.value }))} placeholder="https://…" /></label>
          <label style={{ display: "grid", gap: ".35rem" }}>Evidence reference<input style={inputStyle} maxLength={1000} value={draft.evidenceReference} onChange={(e) => setDraft((d) => ({ ...d, evidenceReference: e.target.value }))} placeholder="Secure file reference or confirmation ID" /></label>
          <label style={{ display: "grid", gap: ".35rem" }}>Candidate note<textarea style={inputStyle} rows={2} maxLength={1200} value={draft.candidateNote} onChange={(e) => setDraft((d) => ({ ...d, candidateNote: e.target.value }))} /></label>
        </div>
        <label style={{ display: "flex", gap: ".5rem", alignItems: "center", margin: ".8rem 0" }}><input type="checkbox" checked={draft.requiredByCandidate} onChange={(e) => setDraft((d) => ({ ...d, requiredByCandidate: e.target.checked }))} /> I have confirmed this is required for my application</label>
        <button disabled={busy || !draft.title.trim() || draft.title.trim().length < 2 || (draft.status === "READY_CANDIDATE_REPORTED" && !draft.evidenceReference.trim())} onClick={() => void createItem()}>Add to checklist</button>
      </section>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Checklist ({items.length})</h2>
        {items.length === 0 ? <p>No checklist items yet. Add the first confirmed document requirement or preparation task above.</p> : items.map((item) => {
          const draftItem = edits[item.id] ?? toDraft(item);
          return <article key={item.id} style={panelStyle}>
            <h3 style={{ marginTop: 0 }}>{item.item_type === "DOCUMENT" ? "Document" : "Task"}: {item.title}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: ".8rem" }}>
              <label style={{ display: "grid", gap: ".35rem" }}>Title<input style={inputStyle} maxLength={160} value={draftItem.title} onChange={(e) => editField(item.id, "title", e.target.value)} /></label>
              <label style={{ display: "grid", gap: ".35rem" }}>Status<select style={inputStyle} value={draftItem.status} onChange={(e) => editField(item.id, "status", e.target.value)}><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="READY_CANDIDATE_REPORTED">Ready (candidate-reported)</option></select></label>
              <label style={{ display: "grid", gap: ".35rem" }}>Due date<input style={inputStyle} type="date" value={draftItem.dueDate} onChange={(e) => editField(item.id, "dueDate", e.target.value)} /></label>
              <label style={{ display: "grid", gap: ".35rem" }}>Official source URL (HTTPS)<input style={inputStyle} type="url" value={draftItem.officialSourceUrl} onChange={(e) => editField(item.id, "officialSourceUrl", e.target.value)} /></label>
              <label style={{ display: "grid", gap: ".35rem" }}>Evidence reference<input style={inputStyle} maxLength={1000} value={draftItem.evidenceReference} onChange={(e) => editField(item.id, "evidenceReference", e.target.value)} /></label>
              <label style={{ display: "grid", gap: ".35rem" }}>Candidate note<textarea style={inputStyle} rows={2} maxLength={1200} value={draftItem.candidateNote} onChange={(e) => editField(item.id, "candidateNote", e.target.value)} /></label>
            </div>
            <label style={{ display: "flex", gap: ".5rem", alignItems: "center", margin: ".8rem 0" }}><input type="checkbox" checked={draftItem.requiredByCandidate} onChange={(e) => editField(item.id, "requiredByCandidate", e.target.checked)} /> Confirmed required for this application</label>
            {draftItem.officialSourceUrl && <p><a href={draftItem.officialSourceUrl} target="_blank" rel="noreferrer">Check official requirement source</a></p>}
            <button disabled={busy || !draftItem.title.trim() || draftItem.title.trim().length < 2 || (draftItem.status === "READY_CANDIDATE_REPORTED" && !draftItem.evidenceReference.trim())} onClick={() => void act("PATCH", { id: item.id, ...draftItem })}>Save checklist item</button>
            <button disabled={busy} style={{ marginLeft: ".5rem" }} onClick={() => void act("DELETE", undefined, `?id=${encodeURIComponent(item.id)}`)}>Remove item</button>
            <details style={{ marginTop: ".8rem" }}><summary>Audit history ({(byItem.get(item.id) ?? []).length})</summary>
              <ol>{(byItem.get(item.id) ?? []).map((event) => <li key={event.id}>{new Date(event.changed_at).toLocaleString()}: {event.previous_status ? `${statusLabels[event.previous_status] ?? event.previous_status} → ` : ""}{statusLabels[event.new_status] ?? event.new_status}{event.evidence_reference ? ` · Evidence reference recorded` : ""}</li>)}</ol>
            </details>
          </article>;
        })}
      </section>
      <aside style={{ marginTop: "1.5rem", padding: "1rem", background: "#fff8e8", borderLeft: "4px solid #b7791f" }}>
        <strong>Verification boundary:</strong> “Ready (candidate-reported)” means you marked the item ready and provided an evidence reference. It does not mean Kingsmen or the institution has independently inspected, certified or accepted the document. Do not put passwords or sensitive identity numbers in notes or evidence references.
      </aside>
    </>}
  </main>;
}
