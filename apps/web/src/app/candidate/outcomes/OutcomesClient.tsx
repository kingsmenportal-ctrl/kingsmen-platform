"use client";

import { useCallback, useEffect, useState } from "react";

type Outcome = {
  id: string;
  outcome_ref: string;
  application_id: string;
  opportunity_id: string;
  outcome_type: string;
  outcome_status: string;
  provider_name: string;
  evidence_ref: string;
  provider_reference?: string | null;
  confirmed_at: string;
  summary: string;
  next_step?: string | null;
};

type Correction = {
  id: string;
  request_ref: string;
  outcome_id: string;
  reason: string;
  requested_change: string;
  status: string;
  decision_note?: string | null;
  created_at: string;
  decided_at?: string | null;
};

function token(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw.startsWith("base64-") ? atob(raw.slice(7)) : raw);
      if (typeof parsed.access_token === "string") return parsed.access_token;
    }
  } catch {
    return null;
  }
  return null;
}

export default function OutcomesClient() {
  const [access, setAccess] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [change, setChange] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const accessToken = access || token();
    if (!accessToken) {
      setMessage("Sign in to view your own outcome records.");
      return;
    }
    try {
      const response = await fetch("/api/candidate/outcomes", {
        headers: { authorization: "Bearer " + accessToken },
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Outcomes unavailable.");
      setOutcomes(Array.isArray(data.outcomes) ? data.outcomes : []);
      setCorrections(Array.isArray(data.correctionRequests) ? data.correctionRequests : []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Outcome service unavailable.");
    }
  }, [access]);

  useEffect(() => {
    setAccess(token());
  }, []);

  useEffect(() => {
    if (access) void load();
  }, [access, load]);

  async function submit(outcomeId: string) {
    const accessToken = access || token();
    if (!accessToken) return;
    setBusy(true);
    try {
      const response = await fetch("/api/candidate/outcomes", {
        method: "POST",
        headers: {
          authorization: "Bearer " + accessToken,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          outcomeId,
          reason: reason[outcomeId],
          requestedChange: change[outcomeId]
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Correction request failed.");
      setMessage(data.message || "Correction request submitted.");
      setReason((current) => ({ ...current, [outcomeId]: "" }));
      setChange((current) => ({ ...current, [outcomeId]: "" }));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Correction request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      {message && <p role="status">{message}</p>}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2>Your outcome timeline</h2>
        <button type="button" onClick={() => void load()} disabled={busy}>Refresh</button>
      </div>
      <p>
        Outcomes are displayed only when recorded against verified provider evidence. Kingsmen does not
        guarantee admission, funding, placement, employment, or provider decisions.
      </p>
      {outcomes.length === 0 && (
        <p>
          No evidence-backed outcomes have been recorded for your candidate account yet. This does not
          mean a provider has rejected your application.
        </p>
      )}
      {outcomes.map((outcome) => (
        <article key={outcome.id} style={{ border: "1px solid #888", borderRadius: 12, padding: 16, margin: "14px 0" }}>
          <h3>{outcome.outcome_type.replaceAll("_", " ")}</h3>
          <p>{outcome.provider_name} · {new Date(outcome.confirmed_at).toLocaleString()}</p>
          <p>Status: <strong>{outcome.outcome_status}</strong></p>
          <p>{outcome.summary}</p>
          {outcome.next_step && <p><strong>Next step:</strong> {outcome.next_step}</p>}
          <p>Evidence reference: <code>{outcome.evidence_ref}</code></p>
          {outcome.provider_reference && <p>Provider reference: <code>{outcome.provider_reference}</code></p>}
          <details>
            <summary>Request a correction or dispute</summary>
            <label>
              Reason
              <textarea
                value={reason[outcome.id] || ""}
                onChange={(event) => setReason((current) => ({ ...current, [outcome.id]: event.target.value }))}
                style={{ display: "block", width: "100%" }}
                placeholder="Explain what appears incorrect (at least 20 characters)."
              />
            </label>
            <label>
              Requested change
              <textarea
                value={change[outcome.id] || ""}
                onChange={(event) => setChange((current) => ({ ...current, [outcome.id]: event.target.value }))}
                style={{ display: "block", width: "100%" }}
                placeholder="Describe the correction you request (at least 10 characters)."
              />
            </label>
            <button type="button" disabled={busy} onClick={() => void submit(outcome.id)}>
              Submit correction request
            </button>
          </details>
        </article>
      ))}
      <h2>Correction request history</h2>
      {corrections.length === 0 ? (
        <p>No correction requests yet.</p>
      ) : (
        corrections.map((correction) => (
          <article key={correction.id} style={{ borderTop: "1px solid #888", padding: 12 }}>
            <strong>{correction.status}</strong>
            <p>{correction.reason}</p>
            <p>Requested change: {correction.requested_change}</p>
            {correction.decision_note && <p>Reviewer note: {correction.decision_note}</p>}
          </article>
        ))
      )}
    </section>
  );
}
