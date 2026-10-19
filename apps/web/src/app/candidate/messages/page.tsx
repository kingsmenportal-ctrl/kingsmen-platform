"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type Message = { id: string; channel: string; direction: string; urgency: string; subject: string | null; body: string; delivery_status: string; created_at: string; read_at: string | null };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
export default function CandidateMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [urgency, setUrgency] = useState("ROUTINE");
  const [notice, setNotice] = useState("Loading portal messages…");
  const [busy, setBusy] = useState(false);

  async function load() {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in to read messages attached to your candidate account."); return; }
    const response = await fetch("/api/candidate/messages", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Messages could not be loaded.");
    setMessages(data.messages || []); setNotice("");
  }
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Messages could not be loaded.")); }, []);

  async function send(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again before sending a portal message.");
      const response = await fetch("/api/candidate/messages", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ subject, body, urgency }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Message could not be submitted.");
      setSubject(""); setBody(""); setUrgency("ROUTINE");
      setNotice("Message saved to your candidate record for authorised operator review. This is not a promise of external email/SMS delivery.");
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Message could not be submitted."); }
    finally { setBusy(false); }
  }

  async function markRead(id: string) {
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to update message status.");
      const response = await fetch("/api/candidate/messages", { method: "PATCH", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ messageId: id }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Message could not be marked read.");
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Message could not be marked read."); }
  }

  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/candidate/dashboard" style={{ color: "#a5b4fc" }}>← Candidate dashboard</Link></p><h1>Kingsmen Messages</h1>
    <p>Messages are persisted on your candidate record and queued for authorised operator review. External email/SMS delivery is a separate workflow and is never implied by a saved portal message.</p>
    {notice && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#172554" }}>{notice}</p>}
    <section style={panel}><h2>Contact Kingsmen support</h2><form onSubmit={send} style={{ display: "grid", gap: 12 }}><label>Subject<input required minLength={3} maxLength={180} style={field} value={subject} onChange={e => setSubject(e.target.value)} /></label><label>Urgency<select style={field} value={urgency} onChange={e => setUrgency(e.target.value)}><option value="ROUTINE">Routine</option><option value="IMPORTANT">Important</option><option value="URGENT">Urgent</option></select></label><label>Message<textarea required minLength={10} maxLength={8000} rows={5} style={field} value={body} onChange={e => setBody(e.target.value)} /></label><button disabled={busy} type="submit">{busy ? "Saving…" : "Submit message for review"}</button></form></section>
    <section style={{ marginTop: 24 }}><h2>Message history</h2>{messages.length === 0 && !notice && <p>No portal messages are attached to this candidate yet.</p>}<div style={{ display: "grid", gap: 12 }}>{messages.map(m => <article key={m.id} style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{m.subject || "Kingsmen portal update"}</strong><span>{m.urgency} · {m.delivery_status}</span></div><p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p><small>{m.channel} · {m.direction} · {new Date(m.created_at).toLocaleString()}</small>{!m.read_at && ["INBOUND", "SYSTEM"].includes(m.direction) && <p><button type="button" onClick={() => void markRead(m.id)}>Mark as read</button></p>}</article>)}</div></section>
    <p style={{ marginTop: 20 }}>WhatsApp is urgent-only and SMS is backup-only. Message visibility does not mean an external email/SMS was delivered.</p>
  </main>;
}
const panel: React.CSSProperties = { marginTop: 18, padding: 18, border: "1px solid #303b53", borderRadius: 12, background: "#0b1222" };
const card: React.CSSProperties = { padding: 16, border: "1px solid #39445e", borderRadius: 10, overflowWrap: "anywhere" };
