"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Ticket = {
  id: string; ticket_ref: string; candidate_id: string; application_id: string | null;
  category: string; priority: string; status: string; title: string; description: string;
  evidence_ref: string | null; assigned_to: string | null; created_at: string; updated_at: string; closed_at: string | null;
};
type Event = {
  id: string; ticket_id: string; ticket_ref: string; event_type: string; from_status: string | null;
  to_status: string | null; from_assignee: string | null; to_assignee: string | null;
  note: string; actor_user_id: string; actor_email: string; audit_ref: string; created_at: string;
};
const statuses = ["OPEN", "WAITING_ON_CANDIDATE", "WAITING_ON_OPERATOR", "RESOLVED", "CLOSED"];
const eventTypes = ["ASSIGNED", "STATUS_CHANGED", "RESOLUTION_NOTE", "INTERNAL_NOTE"];
const field: React.CSSProperties = { display: "block", width: "100%", boxSizing: "border-box", padding: 10, marginTop: 5, border: "1px solid #cbd5e1", borderRadius: 8, font: "inherit" };
const isActive = (t: Ticket) => !["RESOLVED", "CLOSED"].includes(t.status);
const isUrgent = (t: Ticket) => ["URGENT", "HIGH"].includes(t.priority) || /urgent|blocker|deadline/i.test(t.category + " " + t.title);
function auditRef() { return "supportaudit_" + crypto.randomUUID().replaceAll("-", ""); }

export default function FounderSupportOperationsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [statusesByTicket, setStatusesByTicket] = useState<Record<string, string>>({});
  const [eventTypeByTicket, setEventTypeByTicket] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyRef, setBusyRef] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/founder/support/operations", { credentials: "same-origin", cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.ok !== true || !Array.isArray(data.tickets) || !Array.isArray(data.events)) throw new Error(data.error || "Support operations queue is unavailable.");
      setTickets(data.tickets); setEvents(data.events);
    } catch (e) { setTickets([]); setEvents([]); setError(e instanceof Error ? e.message : "Could not load support operations."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(ticket: Ticket) {
    const note = (notes[ticket.ticket_ref] || "").trim();
    const status = statusesByTicket[ticket.ticket_ref] || ticket.status;
    const assignedTo = (assignees[ticket.ticket_ref] ?? ticket.assigned_to ?? "").trim();
    const eventType = eventTypeByTicket[ticket.ticket_ref] || (assignedTo !== (ticket.assigned_to || "") ? "ASSIGNED" : status !== ticket.status ? (["RESOLVED","CLOSED"].includes(status) ? "RESOLUTION_NOTE" : "STATUS_CHANGED") : "INTERNAL_NOTE");
    if (note.length < 4) { setError("Enter an audit note of at least four characters."); return; }
    if (eventType === "RESOLUTION_NOTE" && !["RESOLVED", "CLOSED"].includes(status)) { setError("A resolution note requires RESOLVED or CLOSED status."); return; }
    setBusyRef(ticket.ticket_ref); setError(""); setNotice("");
    try {
      const response = await fetch("/api/founder/support/operations", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketRef: ticket.ticket_ref, status, assignedTo: assignedTo || null, eventType, note, auditRef: auditRef() })
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error(data.error || "Support change was not confirmed.");
      setNotice(`Saved ${ticket.ticket_ref}. Audit event recorded; no notification was sent.`);
      setNotes(prev => ({ ...prev, [ticket.ticket_ref]: "" }));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not confirm the support change."); }
    finally { setBusyRef(""); }
  }

  const visible = useMemo(() => tickets.filter(t => {
    const statusMatch = filter === "ALL" || (filter === "ACTIVE" ? isActive(t) : filter === "UNASSIGNED" ? isActive(t) && !t.assigned_to : filter === "URGENT" ? isActive(t) && isUrgent(t) : !isActive(t));
    const term = search.trim().toLowerCase();
    return statusMatch && (!term || [t.ticket_ref,t.title,t.description,t.category,t.priority,t.assigned_to,t.candidate_id].some(v => String(v || "").toLowerCase().includes(term)));
  }).sort((a,b) => {
    const urg = Number(isUrgent(b)) - Number(isUrgent(a));
    return urg || new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }), [tickets, filter, search]);

  const active = tickets.filter(isActive);
  const urgent = active.filter(isUrgent);
  const unassigned = active.filter(t => !t.assigned_to);
  const older24h = active.filter(t => Date.now() - new Date(t.created_at).getTime() > 24*60*60*1000);
  const card: React.CSSProperties = { border: "1px solid #29394d", borderRadius: 12, background: "#101a29", padding: 16 };
  const text: React.CSSProperties = { color: "#b7c4d5", lineHeight: 1.6 };

  return <main style={{ minHeight: "100vh", padding: "clamp(18px,4vw,40px)", background: "#07101c", color: "#edf3fa", fontFamily: "system-ui,sans-serif" }}>
    <div style={{ maxWidth: 1250, margin: "0 auto" }}>
      <a href="/founder/control-plane" style={{ color: "#f8d77a" }}>← Founder Control Plane</a>
      <p style={{ color: "#f8d77a", fontSize: 12, fontWeight: 900, letterSpacing: ".15em", textTransform: "uppercase" }}>Founder operations · Support</p>
      <h1 style={{ fontSize: "clamp(30px,4vw,46px)", margin: "8px 0" }}>Support Team Operations</h1>
      <p style={{ ...text, maxWidth: 850 }}>Assign canonical database tickets, update workflow status, document resolution and preserve an audit trail. This is not the candidate-local support queue; the two stores are not automatically mirrored.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, margin: "22px 0" }}>
        {[[tickets.length,"Canonical tickets"],[active.length,"Active"],[unassigned.length,"Unassigned"],[urgent.length,"Urgent / high priority"],[older24h.length,"Active >24 hours"]].map(([value,label])=><div key={String(label)} style={card}><strong style={{ fontSize: 27 }}>{value}</strong><div style={{ ...text, fontSize: 13 }}>{label}</div></div>)}
      </div>
      {error && <p role="alert" style={{ padding: 12, background: "#512b30", borderRadius: 8 }}>{error} <button type="button" onClick={() => void load()}>Retry</button></p>}
      {notice && <p role="status" style={{ padding: 12, background: "#164b3c", borderRadius: 8 }}>{notice}</p>}
      <section style={{ ...card, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Ticket queue {loading ? "· Loading…" : `· ${visible.length} shown`}</h2>
          <button type="button" disabled={loading || Boolean(busyRef)} onClick={() => void load()}>Refresh queue</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
          <label>Queue view<select value={filter} onChange={e=>setFilter(e.target.value)} style={field}><option value="ACTIVE">Active tickets</option><option value="UNASSIGNED">Unassigned active</option><option value="URGENT">Urgent / high priority</option><option value="RESOLVED">Resolved / closed</option><option value="ALL">All tickets</option></select></label>
          <label>Search tickets<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Reference, title, category, assignee…" style={field}/></label>
        </div>
        {!loading && !error && visible.length === 0 && <p style={text}>No canonical tickets match this view. Candidate-local requests will not appear here unless separately mirrored into the canonical table.</p>}
        {visible.map(ticket => {
          const ticketEvents = events.filter(e => e.ticket_ref === ticket.ticket_ref);
          const currentStatus = statusesByTicket[ticket.ticket_ref] || ticket.status;
          const currentAssignee = assignees[ticket.ticket_ref] ?? ticket.assigned_to ?? "";
          const changed = currentStatus !== ticket.status || currentAssignee !== (ticket.assigned_to || "");
          return <article key={ticket.id} style={{ border: "1px solid #34445a", borderRadius: 12, padding: 18, marginTop: 14, background: "#0b1523" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><h3 style={{ margin: "0 0 6px" }}>{ticket.title}</h3><p style={{ ...text, margin: 0 }}>{ticket.ticket_ref} · {ticket.category} · {ticket.priority}</p></div>
              <strong style={{ color: isUrgent(ticket) ? "#ffbd8a" : "#d8e3ef" }}>{ticket.status.replaceAll("_"," ")}</strong>
            </div>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{ticket.description}</p>
            <p style={text}>Candidate reference: {ticket.candidate_id}{ticket.application_id ? ` · Application: ${ticket.application_id}` : ""}</p>
            {ticket.evidence_ref && <p style={text}>Evidence reference: {ticket.evidence_ref}</p>}
            <p style={text}>Created {new Date(ticket.created_at).toLocaleString()} · Last changed {new Date(ticket.updated_at).toLocaleString()}{ticket.closed_at ? ` · Closed ${new Date(ticket.closed_at).toLocaleString()}` : ""}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <label>Assigned operator<input value={currentAssignee} maxLength={160} onChange={e=>setAssignees(prev=>({...prev,[ticket.ticket_ref]:e.target.value}))} placeholder="Name / operator identifier" style={field}/></label>
              <label>Status<select value={currentStatus} onChange={e=>setStatusesByTicket(prev=>({...prev,[ticket.ticket_ref]:e.target.value}))} style={field}>{statuses.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></label>
              <label>Audit event<select value={eventTypeByTicket[ticket.ticket_ref] || (changed ? (currentAssignee !== (ticket.assigned_to || "") ? "ASSIGNED" : ["RESOLVED","CLOSED"].includes(currentStatus) ? "RESOLUTION_NOTE" : "STATUS_CHANGED") : "INTERNAL_NOTE")} onChange={e=>setEventTypeByTicket(prev=>({...prev,[ticket.ticket_ref]:e.target.value}))} style={field}>{eventTypes.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></label>
            </div>
            <label>Required audit / resolution note<textarea value={notes[ticket.ticket_ref] || ""} onChange={e=>setNotes(prev=>({...prev,[ticket.ticket_ref]:e.target.value.slice(0,2000)}))} minLength={4} maxLength={2000} rows={3} placeholder="Explain assignment, status change, resolution or internal note." style={field}/></label>
            <button type="button" disabled={Boolean(busyRef) || (notes[ticket.ticket_ref] || "").trim().length < 4} onClick={()=>void save(ticket)} style={{ marginTop: 10 }}>{busyRef === ticket.ticket_ref ? "Saving…" : "Save audited change"}</button>
            <h4>Audit timeline ({ticketEvents.length})</h4>
            {ticketEvents.length === 0 ? <p style={text}>No events returned for this ticket.</p> : <ol style={{ paddingLeft: 22 }}>{ticketEvents.slice(0,12).map(event=><li key={event.id} style={{ marginBottom: 10 }}><strong>{event.event_type.replaceAll("_"," ")}</strong> · {event.from_status || "—"} → {event.to_status || "—"}<p style={{ ...text, margin: "4px 0" }}>{event.note}</p><small>{event.actor_email || event.actor_user_id} · {new Date(event.created_at).toLocaleString()} · audit {event.audit_ref}</small></li>)}</ol>}
          </article>;
        })}
      </section>
      <p style={{ ...text, fontSize: 12 }}>Boundaries: this page requires a server-verified founder/admin role and database-side role checks. Changes use a database function to atomically update the ticket and append an audit event. No email/SMS/WhatsApp notification is sent. “Active &gt;24 hours” is an age indicator, not a configured SLA breach. Production readiness remains unverified.</p>
    </div>
  </main>;
}
