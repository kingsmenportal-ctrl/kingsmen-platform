"use client";

import { useEffect, useState } from "react";
import { getCandidateSessionState } from "@/lib/candidate-session";

type PortalMessage = { portal_message_ref: string; title: string; body: string; message_type: string; created_at: string; read_at: string | null };

export default function CandidateMessagesInbox() {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      const session = getCandidateSessionState();
      if (session.status !== "ready") {
        if (active) { setError("Sign in with your verified candidate account to view portal messages."); setLoading(false); }
        return;
      }
      try {
        const response = await fetch(session.url + "/rest/v1/candidate_portal_messages?select=portal_message_ref,title,body,message_type,created_at,read_at&visible_to_candidate=eq.true&order=created_at.desc&limit=50", {
          headers: { apikey: session.anonKey, Authorization: "Bearer " + session.token },
          cache: "no-store"
        });
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Your account is not authorised to view these messages." : "Messages are temporarily unavailable.");
        const result = await response.json() as PortalMessage[];
        if (active) setMessages(Array.isArray(result) ? result : []);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Messages are temporarily unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="candidate-message-history">
      <h2 id="candidate-message-history" className="text-xl font-bold">Your portal message history</h2>
      <p className="mt-2 text-sm text-slate-600">Messages are shown only when persisted to your authenticated portal inbox. Queued email is not reported as delivered here.</p>
      {loading ? <p className="mt-4 text-sm text-slate-600">Loading messages…</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p> : null}
      {!loading && !error && messages.length === 0 ? <p className="mt-4 text-sm text-slate-600">No portal messages are available.</p> : null}
      <ul className="mt-4 space-y-3">{messages.map(message => (
        <li key={message.portal_message_ref} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{message.title}</h3><span className="text-xs text-slate-500">{new Date(message.created_at).toLocaleString("en-ZA")}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.body}</p>
          <p className="mt-2 text-xs text-slate-500">{message.message_type.replaceAll("_", " ")} · {message.read_at ? "Read" : "Unread"}</p>
        </li>
      ))}</ul>
    </section>
  );
}
