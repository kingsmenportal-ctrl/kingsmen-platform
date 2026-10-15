"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Opportunity = { opportunityId: string; title: string; organisation: string; category?: string; applicationMethod?: string; sourceUrl?: string; closingDate?: string; notes?: string; status?: string; updatedAt?: string };
type Task = { taskId: string; title: string; dueDate?: string; priority?: string; status?: string; opportunityId?: string; notes?: string };
type Pack = { packId: string; opportunityId: string; title: string; body: string; createdAt?: string };
type Proof = { proofId: string; opportunityId: string; proof: string; createdAt?: string };
type Contact = { entryId: string; opportunityId?: string; contactName: string; organisation: string; channel: string; direction: string; summary: string; followUpDate?: string; createdAt?: string };
type Workspace = { profile?: { fullName?: string; email?: string }; opportunities?: Opportunity[]; tasks?: Task[]; applicationPacks?: Pack[]; proofLog?: Proof[]; contactLog?: Contact[]; error?: string };
const STATUSES = ["READY_TO_PREPARE", "PREPARING", "PACK_READY", "SUBMITTED_REPORTED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];
const GATES = ["Higher Education", "TVET", "SETA / Learnership", "Internship", "Apprenticeship", "Employment"];

function labelStatus(value?: string) {
  return String(value || "READY_TO_PREPARE").toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function dateLabel(value?: string) {
  if (!value) return "No date set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(date);
}
function downloadPack(pack: Pack) {
  const blob = new Blob([pack.body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = (pack.title || "kingsmen-application-pack").replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-") + ".txt";
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}

export default function CandidateWorkbenchPage() {
  const [workspace, setWorkspace] = useState<Workspace>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("NORMAL");
  const [taskOpportunityId, setTaskOpportunityId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactOrganisation, setContactOrganisation] = useState("");
  const [contactChannel, setContactChannel] = useState("EMAIL");
  const [contactDirection, setContactDirection] = useState("OUTBOUND");
  const [contactSummary, setContactSummary] = useState("");
  const [contactOpportunityId, setContactOpportunityId] = useState("");
  const [proofDrafts, setProofDrafts] = useState<Record<string, string>>({});
  const [evidenceUrlDrafts, setEvidenceUrlDrafts] = useState<Record<string, string>>({});
  const [submissionChannels, setSubmissionChannels] = useState<Record<string, string>>({});

  const opportunities = workspace.opportunities ?? [];
  const tasks = workspace.tasks ?? [];
  const packs = workspace.applicationPacks ?? [];
  const proofs = workspace.proofLog ?? [];
  const contacts = workspace.contactLog ?? [];
  const openTasks = useMemo(() => tasks.filter((task) => task.status !== "DONE"), [tasks]);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Please sign in to access your private application workbench." : (data.error || "The workbench could not be loaded."));
      if (!Array.isArray(data.opportunities) || !Array.isArray(data.tasks) || !Array.isArray(data.applicationPacks)) throw new Error("The workbench response is incomplete. No changes were made.");
      setWorkspace(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The workbench could not be loaded.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function mutate(action: string, fields: Record<string, unknown>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action, ...fields }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status === "FAILED" || data.status === "STORAGE_UNAVAILABLE") throw new Error(typeof data.error === "string" ? data.error : "The requested change could not be saved.");
      if (data.store) setWorkspace(data.store);
      else await load();
      setNotice(success);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The requested change could not be saved.");
      return false;
    } finally { setBusy(false); }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await mutate("addTask", { title: taskTitle, dueDate: taskDueDate, priority: taskPriority, opportunityId: taskOpportunityId }, "Follow-up task saved.")) {
      setTaskTitle(""); setTaskDueDate(""); setTaskPriority("NORMAL"); setTaskOpportunityId("");
    }
  }
  async function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await mutate("addContactLog", { contactName, organisation: contactOrganisation, channel: contactChannel, direction: contactDirection, summary: contactSummary, opportunityId: contactOpportunityId }, "Contact history saved.")) {
      setContactName(""); setContactOrganisation(""); setContactSummary(""); setContactOpportunityId("");
    }
  }
  const panel = { border: "1px solid #dbe3ec", borderRadius: 16, padding: 20, background: "#fff" };
  const input = { boxSizing: "border-box" as const, width: "100%", border: "1px solid #cbd5e1", borderRadius: 9, padding: "10px 11px", background: "#fff", color: "#172033", font: "inherit" };
  const button = { border: 0, borderRadius: 9, padding: "10px 13px", background: busy ? "#94a3b8" : "#172f46", color: "#fff", fontWeight: 800, cursor: busy ? "wait" : "pointer" };

  return <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 20px 64px", color: "#172033" }}>
    <a href="/candidate/dashboard" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none", fontSize: 14 }}>← Candidate dashboard</a>
    <header style={{ margin: "22px 0 26px" }}>
      <p style={{ color: "#53657a", fontSize: 12, fontWeight: 800, letterSpacing: 1.8, margin: "0 0 8px" }}>APPLICATION MANAGEMENT</p>
      <h1 style={{ fontSize: "clamp(30px, 5vw, 42px)", margin: "0 0 10px" }}>Application Workbench</h1>
      <p style={{ color: "#53657a", lineHeight: 1.7, maxWidth: 760, margin: 0 }}>Track real opportunities, prepare application packs, manage follow-ups, record contact history and store submission evidence. Nothing here submits an application on your behalf.</p>
    </header>

    {error && <div role="alert" style={{ background: "#fff1f0", border: "1px solid #fecaca", color: "#8a1c13", borderRadius: 12, padding: 14, marginBottom: 14 }}>{error}<button type="button" onClick={() => void load()} style={{ marginLeft: 12, textDecoration: "underline", border: 0, background: "transparent", color: "inherit", cursor: "pointer" }}>Retry</button></div>}
    {notice && <div role="status" style={{ background: "#eaf8f0", border: "1px solid #b7e4ca", color: "#176345", borderRadius: 12, padding: 14, marginBottom: 14 }}>{notice}</div>}
    {loading ? <p role="status">Loading your private application workspace…</p> : <>
      <section aria-label="Application summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 12, marginBottom: 22 }}>
        {[[opportunities.length, "Saved opportunities"], [packs.length, "Application packs"], [openTasks.length, "Open follow-ups"], [proofs.length, "Proof records"]].map(([value, title]) => <div key={String(title)} style={{ ...panel, padding: 16 }}><div style={{ fontSize: 27, fontWeight: 800 }}>{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{title}</div></div>)}
      </section>

      <section aria-label="Six pathway gates" style={{ ...panel, marginBottom: 22 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 21 }}>Six opportunity pathways</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 9 }}>{GATES.map((gate, index) => <div key={gate} style={{ background: "#f4f7fa", borderRadius: 10, padding: 12 }}><div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>GATE 0{index + 1}</div><strong style={{ display: "block", marginTop: 5, fontSize: 13 }}>{gate}</strong></div>)}</div>
        <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5, margin: "13px 0 0" }}>Pathways organise the work; they do not mean an opportunity has been verified or that eligibility or an outcome is guaranteed.</p>
      </section>

      <section aria-label="Saved opportunities" style={{ ...panel, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 15 }}><div><h2 style={{ margin: "0 0 5px", fontSize: 21 }}>Application pipeline</h2><p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Update the stage as your work progresses.</p></div><a href="/personal-job-desk/opportunity-scout" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none" }}>Find opportunities →</a></div>
        {opportunities.length === 0 ? <div style={{ background: "#f5f8fb", borderRadius: 12, padding: 22 }}><strong>No opportunities saved yet.</strong><p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>Use Opportunity Scout to add an opportunity with its official source link. It will appear here after saving.</p><a href="/personal-job-desk/opportunity-scout" style={{ color: "#1d5675", fontWeight: 800 }}>Open Opportunity Scout →</a></div> : <div style={{ display: "grid", gap: 12 }}>{opportunities.map((opportunity) => {
          const opportunityPacks = packs.filter((pack) => pack.opportunityId === opportunity.opportunityId);
          const opportunityProofs = proofs.filter((proof) => proof.opportunityId === opportunity.opportunityId);
          return <article key={opportunity.opportunityId} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}><div style={{ minWidth: 0, flex: "1 1 300px" }}><h3 style={{ margin: "0 0 5px", fontSize: 17 }}>{opportunity.title}</h3><p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{opportunity.organisation} · {opportunity.category || "Opportunity"}</p><p style={{ margin: "7px 0 0", color: "#64748b", fontSize: 12 }}>Closing: {dateLabel(opportunity.closingDate)}</p>{opportunity.sourceUrl && <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, color: "#1d5675", fontSize: 13, fontWeight: 700 }}>Open source ↗</a>}</div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, minWidth: 190 }}>Application stage<select aria-label={`Stage for ${opportunity.title}`} value={opportunity.status || "READY_TO_PREPARE"} disabled={busy} onChange={(event) => void mutate("updateOpportunityStatus", { opportunityId: opportunity.opportunityId, status: event.target.value }, "Application stage updated.")} style={{ ...input, display: "block", marginTop: 6 }}>{STATUSES.map((status) => <option key={status} value={status} disabled={status === "SUBMITTED_REPORTED"}>{labelStatus(status)}{status === "SUBMITTED_REPORTED" ? " · record evidence below" : ""}</option>)}</select></label>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 15 }}>
              <button type="button" disabled={busy} onClick={() => void mutate("generatePack", { opportunityId: opportunity.opportunityId }, "Application pack generated.")} style={button}>Generate / refresh pack</button>
              {opportunityPacks.map((pack) => <button key={pack.packId} type="button" onClick={() => downloadPack(pack)} style={{ border: "1px solid #cbd5e1", borderRadius: 9, padding: "9px 11px", background: "#fff", color: "#1d5675", fontWeight: 800, cursor: "pointer" }}>Download pack</button>)}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); const proof = proofDrafts[opportunity.opportunityId]?.trim(); if (proof) void mutate("markApplied", { opportunityId: opportunity.opportunityId, proof, evidenceUrl: evidenceUrlDrafts[opportunity.opportunityId] || "", submissionChannel: submissionChannels[opportunity.opportunityId] || "OTHER" }, "Candidate-reported submission and evidence note recorded; it has not been independently verified."); }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, marginTop: 14 }}>
              <input aria-label={`Submission reference for ${opportunity.title}`} value={proofDrafts[opportunity.opportunityId] || ""} onChange={(event) => setProofDrafts((current) => ({ ...current, [opportunity.opportunityId]: event.target.value }))} maxLength={1200} minLength={3} placeholder="Submission reference / evidence note (required)" style={input} />
              <select aria-label={`Submission channel for ${opportunity.title}`} value={submissionChannels[opportunity.opportunityId] || "OTHER"} onChange={(event) => setSubmissionChannels((current) => ({ ...current, [opportunity.opportunityId]: event.target.value }))} style={input}><option value="PORTAL">Organisation portal</option><option value="EMAIL">Email</option><option value="IN_PERSON">In person</option><option value="PHONE">Phone</option><option value="OTHER">Other / not specified</option></select>
              <input aria-label={`Evidence link for ${opportunity.title}`} type="url" value={evidenceUrlDrafts[opportunity.opportunityId] || ""} onChange={(event) => setEvidenceUrlDrafts((current) => ({ ...current, [opportunity.opportunityId]: event.target.value }))} maxLength={1000} placeholder="Optional public evidence link" style={input} />
              <button type="submit" disabled={busy || (proofDrafts[opportunity.opportunityId] || "").trim().length < 3} style={button}>Record submission evidence</button>
            </form>
            {opportunityProofs.length > 0 && <div style={{ color: "#176345", fontSize: 12, margin: "9px 0 0" }}>✓ {opportunityProofs.length} candidate-recorded evidence item{opportunityProofs.length === 1 ? "" : "s"}. Not independently verified.{opportunityProofs.slice(0, 3).map((item) => <p key={item.proofId} style={{ margin: "6px 0 0", color: "#53657a", overflowWrap: "anywhere" }}>{dateLabel(item.createdAt)} · {item.proof}{item.evidenceUrl ? <> · <a href={item.evidenceUrl} target="_blank" rel="noreferrer">Evidence link ↗</a></> : ""}</p>)}</div>}
          </article>;
        })}</div>}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginBottom: 22 }}>
        <section aria-label="Follow-up task manager" style={panel}>
          <h2 style={{ margin: "0 0 6px", fontSize: 21 }}>Follow-up tasks</h2><p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5, margin: "0 0 16px" }}>Create reminders and mark them complete when finished.</p>
          <form onSubmit={addTask} style={{ display: "grid", gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Task title<input required minLength={2} maxLength={160} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }} placeholder="Follow up with admissions office" /></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><label style={{ fontSize: 13, fontWeight: 700 }}>Due date<input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }} /></label><label style={{ fontSize: 13, fontWeight: 700 }}>Priority<select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }}><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option></select></label></div>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Link to opportunity<select value={taskOpportunityId} onChange={(event) => setTaskOpportunityId(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }}><option value="">No linked opportunity</option>{opportunities.map((item) => <option key={item.opportunityId} value={item.opportunityId}>{item.title}</option>)}</select></label>
            <button type="submit" disabled={busy} style={button}>Add follow-up task</button>
          </form>
          <div style={{ display: "grid", gap: 9, marginTop: 18 }}>{tasks.length === 0 ? <p style={{ color: "#64748b", fontSize: 13 }}>No tasks recorded yet.</p> : tasks.map((task) => <article key={task.taskId} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, opacity: task.status === "DONE" ? .7 : 1 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong style={{ fontSize: 14, textDecoration: task.status === "DONE" ? "line-through" : "none" }}>{task.title}</strong><span style={{ fontSize: 11, color: "#64748b" }}>{task.priority || "NORMAL"}</span></div><p style={{ margin: "5px 0 10px", color: "#64748b", fontSize: 12 }}>Due {dateLabel(task.dueDate)}</p><div style={{ display: "flex", gap: 8 }}><button type="button" disabled={busy} onClick={() => void mutate("updateTask", { taskId: task.taskId, status: task.status === "DONE" ? "OPEN" : "DONE" }, task.status === "DONE" ? "Task reopened." : "Task marked complete.")} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "7px 9px", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{task.status === "DONE" ? "Reopen" : "Mark done"}</button><button type="button" disabled={busy} onClick={() => { if (window.confirm("Delete this follow-up task?")) void mutate("deleteTask", { taskId: task.taskId }, "Task deleted."); }} style={{ border: "1px solid #fecaca", borderRadius: 8, padding: "7px 9px", background: "#fff", color: "#9f2d25", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Delete</button></div></article>)}</div>
        </section>

        <section aria-label="Contact history" style={panel}>
          <h2 style={{ margin: "0 0 6px", fontSize: 21 }}>Contact history</h2><p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5, margin: "0 0 16px" }}>Keep a factual log of messages, calls and follow-up notes.</p>
          <form onSubmit={addContact} style={{ display: "grid", gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Contact name<input required minLength={2} maxLength={120} value={contactName} onChange={(event) => setContactName(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }} /></label>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Organisation<input maxLength={160} value={contactOrganisation} onChange={(event) => setContactOrganisation(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><label style={{ fontSize: 13, fontWeight: 700 }}>Channel<select value={contactChannel} onChange={(event) => setContactChannel(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }}><option value="EMAIL">Email</option><option value="PHONE">Phone</option><option value="PORTAL">Portal</option><option value="IN_PERSON">In person</option><option value="OTHER">Other</option></select></label><label style={{ fontSize: 13, fontWeight: 700 }}>Direction<select value={contactDirection} onChange={(event) => setContactDirection(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }}><option value="OUTBOUND">Outbound</option><option value="INBOUND">Inbound</option></select></label></div>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Related opportunity<select value={contactOpportunityId} onChange={(event) => setContactOpportunityId(event.target.value)} style={{ ...input, display: "block", marginTop: 5 }}><option value="">General contact</option>{opportunities.map((item) => <option key={item.opportunityId} value={item.opportunityId}>{item.title}</option>)}</select></label>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Summary / outcome<textarea required minLength={2} maxLength={1600} rows={3} value={contactSummary} onChange={(event) => setContactSummary(event.target.value)} style={{ ...input, display: "block", marginTop: 5, resize: "vertical" }} placeholder="Record what was actually said or agreed." /></label>
            <button type="submit" disabled={busy} style={button}>Save contact record</button>
          </form>
          <div style={{ display: "grid", gap: 9, marginTop: 18 }}>{contacts.length === 0 ? <p style={{ color: "#64748b", fontSize: 13 }}>No contact records recorded yet.</p> : contacts.map((contact) => <article key={contact.entryId} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}><strong style={{ fontSize: 14 }}>{contact.contactName}{contact.organisation ? ` · ${contact.organisation}` : ""}</strong><p style={{ color: "#64748b", fontSize: 12, margin: "5px 0" }}>{contact.channel} · {contact.direction} · {dateLabel(contact.createdAt)}</p><p style={{ fontSize: 13, lineHeight: 1.5, margin: "7px 0 10px", whiteSpace: "pre-wrap" }}>{contact.summary}</p><button type="button" disabled={busy} onClick={() => { if (window.confirm("Delete this contact record?")) void mutate("deleteContactLog", { entryId: contact.entryId }, "Contact record deleted."); }} style={{ border: "1px solid #fecaca", borderRadius: 8, padding: "7px 9px", background: "#fff", color: "#9f2d25", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Delete record</button></article>)}</div>
        </section>
      </div>

      <section aria-label="Saved application packs" style={{ ...panel, marginBottom: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 21 }}>Application pack library</h2><p style={{ color: "#64748b", fontSize: 13, margin: "0 0 14px" }}>Download the latest saved text pack to review and edit before submitting through the official channel.</p>
        {packs.length === 0 ? <p style={{ color: "#64748b", fontSize: 14 }}>No packs generated. Generate a pack from an opportunity above to get started.</p> : <div style={{ display: "grid", gap: 8 }}>{packs.map((pack) => <div key={pack.packId} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}><div><strong style={{ fontSize: 14 }}>{pack.title}</strong><p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>Created {dateLabel(pack.createdAt)}</p></div><button type="button" onClick={() => downloadPack(pack)} style={{ border: "1px solid #cbd5e1", borderRadius: 9, padding: "9px 11px", background: "#fff", color: "#1d5675", fontWeight: 800, cursor: "pointer" }}>Download .txt</button></div>)}</div>}
      </section>
    </>}
    <p style={{ background: "#f1f5f9", color: "#53657a", borderRadius: 12, padding: 15, fontSize: 12, lineHeight: 1.6 }}>Evidence notes are candidate-recorded and are not independently verified. Do not record an application as submitted unless you have actually submitted it through the official channel. Kingsmen does not guarantee admissions, funding, placement or employment.</p>
  </main>;
}
