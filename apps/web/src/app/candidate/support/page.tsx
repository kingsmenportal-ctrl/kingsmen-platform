"use client";

import { useEffect, useMemo, useState } from "react";

type HistoryEvent = { eventId: string; eventType: string; summary: string; fromStatus?: string; toStatus?: string; createdAt: string };
type Item = {
  requestId: string; subject: string; category: string; priority: string; status: string;
  description: string; createdAt: string; updatedAt: string; reference?: string;
  affectedWorkflow?: string; deadlineDate?: string; blockerImpact?: string;
  owner?: string; history?: HistoryEvent[];
};

const field: React.CSSProperties = { display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 5, border: "1px solid #cbd5e1", borderRadius: 8, font: "inherit" };
const active = (item: Item) => !["RESOLVED", "CLOSED"].includes(item.status);

export default function CandidateSupportPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("NORMAL");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [affectedWorkflow, setAffectedWorkflow] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [blockerImpact, setBlockerImpact] = useState("");
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("ACTIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/personal-jobs/apply-now", { credentials: "same-origin", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load support requests");
      setItems(Array.isArray(data.supportRequests) ? data.supportRequests : []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load support requests"); }
  }
  useEffect(() => { void load(); }, []);

  async function send(payload: Record<string, unknown>, success: string) {
    setBusy(true); setError(""); setNote("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save support update");
      if (Array.isArray(data.store?.supportRequests)) setItems(data.store.supportRequests);
      else if (data.request) setItems(current => [data.request, ...current.filter(item => item.requestId !== data.request.requestId)]);
      setNote(success);
      return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save support update"); return false; }
    finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const saved = await send({ action: "createSupportRequest", subject, category, priority, description, reference, affectedWorkflow, deadlineDate, blockerImpact }, "Request recorded in your candidate workspace. It has not been sent to or assigned to an operator.");
    if (saved) { setSubject(""); setDescription(""); setReference(""); setAffectedWorkflow(""); setDeadlineDate(""); setBlockerImpact(""); setCategory("GENERAL"); setPriority("NORMAL"); }
  }

  async function updateRequest(item: Item, requestAction: string) {
    const updateText = (updates[item.requestId] || "").trim();
    if (updateText.length < 4) { setError("Add an update of at least four characters before saving."); return; }
    const success = await send({ action: "updateSupportRequest", requestId: item.requestId, requestAction, updateText }, requestAction === "REOPEN" ? "Request reopened in your workspace. No operator alert was sent." : "Update added to the request history.");
    if (success) setUpdates(current => ({ ...current, [item.requestId]: "" }));
  }

  const visible = useMemo(() => items.filter(item => filter === "ALL" || (filter === "ACTIVE" ? active(item) : !active(item))).sort((a,b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()), [items, filter]);
  const urgentCount = items.filter(item => active(item) && (item.priority === "URGENT" || item.category === "URGENT_BLOCKER" || item.deadlineDate)).length;
  const inputLabel = (label: string, control: React.ReactNode) => <label>{label}{control}</label>;

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 28, color: "#172033" }}>
    <a href="/candidate/dashboard">← Candidate dashboard</a>
    <h1 style={{ marginBottom: 8 }}>Support & blocker resolution</h1>
    <p style={{ lineHeight: 1.65 }}>Log a problem, capture deadline and impact, add follow-up evidence, and keep a history of updates. A recorded request is not an operator assignment or a live alert.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, margin: "18px 0 24px" }}>
      {[[""+items.length,"Total requests"],[""+items.filter(active).length,"Active requests"],[""+urgentCount,"Deadline / urgent blockers"],[""+items.filter(x=>["RESOLVED","CLOSED"].includes(x.status)).length,"Resolved / closed"]].map(([value,label])=><div key={label} style={{ border: "1px solid #dbe3ec", borderRadius: 12, padding: 16 }}><strong style={{ fontSize: 26 }}>{value}</strong><div style={{ color: "#53657a", fontSize: 13 }}>{label}</div></div>)}
    </div>
    {error && <p role="alert" style={{ color: "#9f2218", background: "#fff1f0", padding: 12, borderRadius: 8 }}>{error} <button type="button" onClick={() => void load()}>Retry</button></p>}
    {note && <p role="status" style={{ color: "#176345", background: "#e8f7ef", padding: 12, borderRadius: 8 }}>{note}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20, alignItems: "start" }}>
      <section style={{ border: "1px solid #dbe3ec", borderRadius: 12, padding: 18 }}>
        <h2>New help request</h2>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          {inputLabel("Subject", <input required minLength={4} maxLength={160} value={subject} onChange={e=>setSubject(e.target.value)} style={field}/>)}
          {inputLabel("Category", <select value={category} onChange={e=>setCategory(e.target.value)} style={field}>{[["GENERAL","General help"],["APPLICATION","Application"],["DOCUMENTS","Documents"],["FINANCE","Finance"],["URGENT_BLOCKER","Urgent blocker"],["DISPUTE","Dispute"]].map(([v,t])=><option key={v} value={v}>{t}</option>)}</select>)}
          {inputLabel("Priority", <select value={priority} onChange={e=>setPriority(e.target.value)} style={field}><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>)}
          {inputLabel("Affected workflow (optional)", <input maxLength={120} placeholder="e.g. upload CV, submit application" value={affectedWorkflow} onChange={e=>setAffectedWorkflow(e.target.value)} style={field}/>)}
          {inputLabel("Deadline at risk (optional)", <input type="date" value={deadlineDate} onChange={e=>setDeadlineDate(e.target.value)} style={field}/>)}
          {inputLabel("Impact / what is blocked (optional)", <textarea rows={3} maxLength={1200} value={blockerImpact} onChange={e=>setBlockerImpact(e.target.value)} style={field}/>)}
          {inputLabel("Describe what happened", <textarea required minLength={10} maxLength={3000} rows={5} value={description} onChange={e=>setDescription(e.target.value)} style={field}/>)}
          {inputLabel("Reference (optional)", <input maxLength={180} value={reference} onChange={e=>setReference(e.target.value)} style={field}/>)}
          <button disabled={busy}>{busy ? "Saving…" : "Submit support request"}</button>
        </form>
      </section>
      <section style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h2>Your request queue</h2><select aria-label="Filter requests" value={filter} onChange={e=>setFilter(e.target.value)} style={{ ...field, width: "auto", margin: 0 }}><option value="ACTIVE">Active</option><option value="RESOLVED">Resolved / closed</option><option value="ALL">All requests</option></select></div>
        {visible.length === 0 ? <p>No requests in this view.</p> : visible.map(item=><article key={item.requestId} style={{ border: "1px solid #dbe3ec", borderRadius: 12, padding: 16, marginBottom: 14, background: "#fff" }}>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}><h3 style={{ margin: 0 }}>{item.subject}</h3><strong>{item.status.replaceAll("_"," ")}</strong></div>
          <p style={{ margin: "8px 0", color: "#53657a" }}>{item.category.replaceAll("_"," ")} · {item.priority} priority · Owner: {item.owner === "CANDIDATE" ? "Candidate follow-up" : "Awaiting Kingsmen support assignment"}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{item.description}</p>
          {item.affectedWorkflow && <p><strong>Affected workflow:</strong> {item.affectedWorkflow}</p>}
          {item.deadlineDate && <p><strong>Deadline at risk:</strong> {item.deadlineDate}</p>}
          {item.blockerImpact && <p><strong>Impact:</strong> {item.blockerImpact}</p>}
          {item.reference && <p><strong>Reference:</strong> {item.reference}</p>}
          <small>Created {new Date(item.createdAt).toLocaleString()} · Updated {new Date(item.updatedAt || item.createdAt).toLocaleString()}</small>
          <h4>History</h4>
          {(!item.history || item.history.length === 0) ? <p>No history events yet. Existing legacy requests are preserved.</p> : <ol style={{ paddingLeft: 22 }}>{item.history.map(event=><li key={event.eventId} style={{ marginBottom: 8 }}><strong>{event.eventType.replaceAll("_"," ")}</strong>{event.fromStatus && <> · {event.fromStatus} → {event.toStatus}</>}<p style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>{event.summary}</p><small>{new Date(event.createdAt).toLocaleString()}</small></li>)}</ol>}
          <label>Add an update<textarea rows={3} minLength={4} maxLength={2000} value={updates[item.requestId] || ""} onChange={e=>setUpdates(current=>({...current,[item.requestId]:e.target.value}))} style={field} placeholder="What changed? Include evidence references, steps tried, or the latest blocker status."/></label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" disabled={busy} onClick={()=>void updateRequest(item,"ADD_UPDATE")}>Add to history</button>
            {["RESOLVED","CLOSED"].includes(item.status) && <button type="button" disabled={busy} onClick={()=>void updateRequest(item,"REOPEN")}>Reopen request</button>}
          </div>
        </article>)}
      </section>
    </div>
    <p style={{ marginTop: 24, padding: 14, borderRadius: 10, background: "#f1f5f9", color: "#53657a", lineHeight: 1.6 }}>Safety boundary: urgent or deadline-risk items are flagged in this workspace only. No email, SMS, WhatsApp or operator notification is sent. Assignment and resolution decisions must be recorded by an authorised support workflow; this candidate page cannot impersonate staff or mark a request resolved.</p>
  </main>;
}
