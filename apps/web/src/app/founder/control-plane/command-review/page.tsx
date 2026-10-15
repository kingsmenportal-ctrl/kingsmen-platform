"use client";

import { useCallback, useEffect, useState } from "react";

type RequestRow = {
  id: string;
  request_ref: string;
  command_key: string;
  command_name: string;
  actor_email: string;
  request_status: string;
  reason: string;
  evidence_ref: string;
  audit_ref: string;
  created_at: string;
};

export default function FounderCommandReviewPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/founder/commands/queue", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true || !Array.isArray(data.requests)) {
        setError(data.error || "Review queue is not available.");
        setRows([]);
      } else {
        setRows(data.requests);
      }
    } catch {
      setError("Could not confirm the review queue response.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main>
      <h1>Founder Command Review</h1>
      <p>Authenticated view of persisted command requests. This screen is read-only: it cannot approve or execute a command.</p>
      <button type="button" onClick={() => void load()} disabled={loading}>
        {loading ? "Refreshing…" : "Refresh queue"}
      </button>
      {error && <p role="alert">{error}</p>}
      {loading && <p>Loading command requests…</p>}
      {!loading && !error && rows.length === 0 && <p>No persisted command requests were returned.</p>}
      {rows.length > 0 && (
        <section aria-label="Persisted command requests">
          <p>{rows.length} request(s), newest first. Maximum 100 displayed.</p>
          {rows.map((row) => (
            <article key={row.id} style={{ border: "1px solid currentColor", borderRadius: 8, padding: 16, marginBlock: 12 }}>
              <h2>{row.command_name}</h2>
              <p><strong>Status:</strong> {row.request_status}</p>
              <p><strong>Command key:</strong> {row.command_key}</p>
              <p><strong>Request:</strong> {row.request_ref}</p>
              <p><strong>Requested by:</strong> {row.actor_email || row.actor_user_id}</p>
              <p><strong>Reason:</strong> {row.reason}</p>
              <p><strong>Evidence:</strong> {row.evidence_ref}</p>
              <p><strong>Audit reference:</strong> {row.audit_ref}</p>
              <p><strong>Created:</strong> {new Date(row.created_at).toLocaleString()}</p>
            </article>
          ))}
        </section>
      )}
      <section aria-label="Approval guardrail">
        <h2>Approval guardrail</h2>
        <p>Approval and rejection controls are intentionally not exposed until a separately authorized decision workflow with durable decision records is implemented. Nothing shown here implies execution.</p>
      </section>
    </main>
  );
}
