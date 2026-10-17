"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type Message = { id: string; channel: string; direction: string; urgency: string; subject: string | null; body: string; delivery_status: string; created_at: string; read_at: string | null };
export default function CandidateMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notice, setNotice] = useState("Loading portal messages…");
  async function load() {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in to read messages attached to your candidate account."); return; }
    const response = await fetch("/api/candidate/messages", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Messages could not be loaded.");
    setMessages(data.messages || []); setNotice("");
  }
  useEffect(() => { void load().catch(e => setNotice(e instanceof Error ? e.message : "Messages could not be loaded.")); }, []);
  async function markRead(id: string) {
    try {
      const session = await getKingsmenSession();
      if (!session) throw new Error("Sign in again to update message status.");
      const response = await fetch("/api/candidate/messages", { method: "PATCH", headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ messageId: id }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Message could not be marked read.");
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Message could not be marked read."); }
  }
  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}><p><Link href="/candidate/dashboard">← Candidate dashboard</Link></p><h1>Kingsmen Messages</h1><p>Email remains the primary tracked channel; portal messages provide a candidate-owned record of communications.</p>{notice && <p role="status">{notice}</p>}{messages.length === 0 && !notice && <p>No portal messages are attached to this candidate yet.</p>}<section style={{ display: "grid", gap: 12 }}>{messages.map(m => <article key={m.id} style={{ padding: 16, border: "1px solid #39445e", borderRadius: 10 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{m.subject || "Kingsmen portal update"}</strong><span>{m.urgency} · {m.delivery_status}</span></div><p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p><small>{m.channel} · {m.direction} · {new Date(m.created_at).toLocaleString()}</small>{!m.read_at && ["INBOUND", "SYSTEM"].includes(m.direction) && <p><button type="button" onClick={() => void markRead(m.id)}>Mark as read</button></p>}</article>)}</section><p style={{ marginTop: 20 }}>WhatsApp is urgent-only and SMS is backup-only. Message visibility does not mean an external email/SMS was delivered.</p></main>;
}
