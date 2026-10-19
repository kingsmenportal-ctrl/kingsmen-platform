"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getKingsmenSession, signOutKingsmen } from "../../../lib/supabase-browser-auth";

type Message = { id: string; candidate_id: string; public_ref: string; display_name: string; email: string; subject: string | null; body: string; urgency: string; delivery_status: string; created_at: string; correlation_id: string };
type Draft = { subject: string; body: string; urgency: string };
const panel: React.CSSProperties = { padding: 16, border: "1px solid #39445e", borderRadius: 12, background: "#0b1222" };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };

export default function FounderMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Record<string,Draft>>({});
  const [notice, setNotice] = useState("Loading candidate messages…");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in with an authorised founder/operator account to review candidate messages."); return; }
    const response = await fetch("/api/founder/messages", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Candidate messages could not be loaded.");
    setMessages(data.messages || []);
    setDrafts(current => {
      const next = { ...current };
      for (const message of data.messages || []) next[message.id] ||= { subject: `Re: ${message.subject || "Kingsmen support request"}`.slice(0,180), body: "", urgency: "ROUTINE" };
      return next;
    });
    setNotice("");
  }, []);
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Candidate messages could not be loaded.")); }, [load]);

  async function reply(message: Message) {
    const draft = drafts[message.id] || { subject: "", body: "", urgency: "ROUTINE" };
    if (draft.subject.trim().length < 3 || draft.body.trim().length < 10) { setNotice("Enter a subject and a reply of at least ten characters."); return; }
    setBusy(message.id); setNotice("");
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again before replying.");
      const response = await fetch("/api/founder/messages", {
        method: "POST", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ messageId: message.id, subject: draft.subject, body: draft.body, urgency: draft.urgency }), cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Reply could not be saved.");
      setNotice(data.message || "Reply saved to candidate portal and audited. External delivery is not implied.");
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Reply could not be saved."); }
    finally { setBusy(""); }
  }

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p><Link href="/workspace">← Operations workspace</Link> · <Link href="/founder/operations">Notifications and dead letters</Link></p>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><h1>Candidate message queue</h1><button onClick={async () => { await signOutKingsmen(); window.location.assign("/auth/login"); }}>Sign out</button></div>
    <p>Replies are saved as portal messages and audited. This workflow does not claim email/SMS delivery; external channels remain a separate notification pipeline.</p>
    {notice && <p role="status" style={{ padding: 12, borderRadius: 8, background: "#172554" }}>{notice}</p>}
    {messages.length === 0 && !notice && <p>No candidate messages are awaiting a response.</p>}
    <section style={{ display: "grid", gap: 14 }}>{messages.map(message => { const draft = drafts[message.id] || { subject: "", body: "", urgency: "ROUTINE" }; return <article key={message.id} style={panel}><div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}><h2 style={{ margin: 0 }}>{message.subject || "Support request"}</h2><b>{message.urgency} · {message.delivery_status}</b></div><p>{message.display_name} · {message.public_ref} · {message.email}</p><p style={{ whiteSpace: "pre-wrap" }}>{message.body}</p><small>{new Date(message.created_at).toLocaleString()} · Correlation {message.correlation_id}</small><form onSubmit={e => { e.preventDefault(); void reply(message); }} style={{ display: "grid", gap: 10, marginTop: 16 }}><label>Reply subject<input required minLength={3} maxLength={180} style={field} value={draft.subject} onChange={e => setDrafts(current => ({ ...current, [message.id]: { ...draft, subject: e.target.value } }))} /></label><label>Urgency<select style={field} value={draft.urgency} onChange={e => setDrafts(current => ({ ...current, [message.id]: { ...draft, urgency: e.target.value } }))}><option value="ROUTINE">Routine</option><option value="IMPORTANT">Important</option><option value="URGENT">Urgent</option></select></label><label>Reply<textarea required minLength={10} maxLength={8000} rows={4} style={field} value={draft.body} onChange={e => setDrafts(current => ({ ...current, [message.id]: { ...draft, body: e.target.value } }))} /></label><button type="submit" disabled={busy===message.id}>{busy===message.id ? "Saving reply…" : "Reply in candidate portal"}</button></form></article>; })}</section>
  </main>;
}
