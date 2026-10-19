"use client";

import { useEffect, useState } from "react";

type Opportunity = {
  id: string;
  company: string;
  role: string;
  location?: string;
  source?: string;
  status?: string;
  priority?: string;
  nextAction?: string;
  notes?: string;
  createdAt?: string;
};

const STORAGE_KEY = "kingsmen.personal-jobs-01.opportunities.v1";

export default function SavedOpportunitiesClient() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setOpportunities(parsed.filter((item): item is Opportunity =>
          !!item && typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.company === "string" &&
          typeof item.role === "string"
        ));
      } else {
        setMessage("Saved opportunity data has an unexpected format. Open the Personal Job Desk to review it.");
      }
    } catch {
      setMessage("Saved opportunities could not be read from this browser.");
    } finally {
      setLoaded(true);
    }
  }, []);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <p>KINGSMEN CANDIDATE WORKSPACE</p>
      <h1>Saved opportunities</h1>
      <p>
        This view reads the opportunities stored by your Personal Job Desk in this browser.
        These local records are not verified provider vacancies and are not submitted applications.
      </p>
      <p><a href="/personal-job-desk">Open Personal Job Desk</a></p>
      {message && <p role="status">{message}</p>}
      {!loaded ? <p>Loading saved opportunities…</p> : opportunities.length === 0 ? (
        <section>
          <h2>No saved opportunities yet</h2>
          <p>Add an opportunity in Personal Job Desk to see it listed here.</p>
        </section>
      ) : (
        <section aria-label="Saved opportunities">
          <p>{opportunities.length} saved record{opportunities.length === 1 ? "" : "s"}</p>
          {opportunities.map((opportunity) => (
            <article key={opportunity.id} style={{ border: "1px solid #888", borderRadius: 12, padding: 16, margin: "12px 0" }}>
              <h2>{opportunity.role} — {opportunity.company}</h2>
              <p>Location: {opportunity.location || "Not recorded"}</p>
              <p>Status: {opportunity.status || "Lead Captured"} · Priority: {opportunity.priority || "Not set"}</p>
              <p>Source: {opportunity.source || "Not recorded"}</p>
              {opportunity.nextAction && <p>Next action: {opportunity.nextAction}</p>}
              {opportunity.notes && <p>Notes: {opportunity.notes}</p>}
              {opportunity.createdAt && <p>Recorded: {opportunity.createdAt}</p>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
