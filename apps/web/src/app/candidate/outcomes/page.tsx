"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getKingsmenSession } from "../../../lib/supabase-browser-auth";

type Outcome = { id: string; event_type: string; event_status: string; outcome_confidence: string; summary: string; evidence_ref: string | null; feedback_score: number | null; created_at: string };
export default function CandidateOutcomesPage() {
  const [events, setEvents] = useState<Outcome[]>([]);
  const [notice, setNotice] = useState("Loading proof-backed outcomes…");
  useEffect(() => { void (async () => {
    const session = await getKingsmenSession();
    if (!session) { setNotice("Sign in to see outcomes linked to your candidate account."); return; }
    const response = await fetch("/api/candidate/outcomes", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Outcomes could not be loaded.");
    setEvents(data.events || []); setNotice("");
  })().catch(e => setNotice(e instanceof Error ? e.message : "Outcomes could not be loaded.")); }, []);
  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}><p><Link href="/candidate/dashboard">← Candidate dashboard</Link></p><h1>Kingsmen Outcomes</h1><p>Only persisted evidence records appear here. Kingsmen does not guarantee acceptance, funding, placement, employment, or success.</p>{notice && <p role="status">{notice}</p>}{events.length === 0 && !notice && <p>No outcome records have been attached to your candidate account yet.</p>}<section style={{ display: "grid", gap: 12 }}>{events.map(event => <article key={event.id} style={{ padding: 16, border: "1px solid #39445e", borderRadius: 10 }}><strong>{event.event_type}</strong> · {event.event_status}<p>{event.summary}</p><p>Evidence confidence: {event.outcome_confidence}</p>{event.evidence_ref && <p>Evidence reference: {event.evidence_ref}</p>}<small>{new Date(event.created_at).toLocaleString()}</small></article>)}</section></main>;
}
