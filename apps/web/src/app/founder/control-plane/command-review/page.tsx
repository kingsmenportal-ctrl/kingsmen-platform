"use client";

import { useCallback, useEffect, useState } from "react";

type RequestRow = {
  id: string;
  request_ref: string;
  command_key: string;
  command_name: string;
  actor_user_id: string;
  actor_email: string;
  request_status: string;
  reason: string;
  evidence_ref: string;
  audit_ref: string;
  created_at: string;
};
type DecisionRow = {
  id: string;
  decision_ref: string;
  request_ref: string;
  decision: "APPROVED" | "REJECTED";
  reviewer_user_id: string;
  reviewer_email: string;
  reason: string;
  audit_ref: string;
  created_at: string;
};

function newRef(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export default function FounderCommandReviewPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [workingRef, setWorkingRef] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/founder/commands/queue", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true || !Array.isArray(data.requests) || !Array.isArray(data.decisions)) {
        setError(data.error || "Review queue is not available.");
        setRows([]);
        setDecisions([]);
      } else {
        setRows(data.requests);
        setDecisions(data.decisions);
        setCurrentUserId(typeof data.currentUserId === "string" ? data.currentUserId : "");
      }
    } catch {
      setError("Could not confirm the review queue response.");
      setRows([]);
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(row: RequestRow, decision: "APPROVED" | "REJECTED") {
    const reason = (reasons[row.request_ref] || "").trim();
    if (reason.length < 8) {
      setError("Enter a decision reason of at least 8 characters.");
      return;
    }
    if (!window.confirm(`${decision === "APPROVED" ? "Approve" : "Reject"} request ${row.request_ref}? This records a decision only and will not execute the command.`)) return;
    setWorkingRef(row.request_ref);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/founder/commands/decision", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestRef: row.request_ref,
          decision,
          reason,
          decisionRef: newRef("decision"),
          auditRef: newRef("audit")
        })
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true) {
        setError(data.error || "Decision was not confirmed. Refresh the queue before retrying.");
      } else {
        setNotice(`Decision recorded for ${row.request_ref}. No command was executed.`);
        setReasons((previous) => ({ ...previous, [row.request_ref]: "" }));
        await load();
      }
    } catch {
      setError("Could not confirm the decision response. Refresh the queue before retrying.");
    } finally {
      setWorkingRef("");
    }
  }

  return (
    <main>
      <h1>Founder Command Review</h1>
      <p>Review persisted requests and record a durable approval or rejection. A decision is not execution; operational commands remain disabled.</p>
      <button type="button" onClick={() => void load()} disabled={loading || Boolean(workingRef)}>
        {loading ? "Refreshing…" : "Refresh queue"}
      </button>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading && <p>Loading command requests…</p>}
      {!loading && !error && rows.length === 0 && <p>No persisted command requests were returned.</p>}
      {rows.length > 0 && (
        <section aria-label="Persisted command requests">
          <p>{rows.length} request(s), newest first. Maximum 100 displayed.</p>
          {rows.map((row) => {
            const pending = row.request_status === "WAITING_REVIEW" || row.request_status === "WAITING_APPROVAL";
            const ownRequest = Boolean(currentUserId) && currentUserId === row.actor_user_id;
            return (
              <article key={row.id} style={{ border: "1px solid currentColor", borderRadius: 8, padding: 16, marginBlock: 12 }}>
                <h2>{row.command_name}</h2>
                <p><strong>Status:</strong> {row.request_status}</p>
                <p><strong>Command key:</strong> {row.command_key}</p>
                <p><strong>Request:</strong> {row.request_ref}</p>
                <p><strong>Requested by:</strong> {row.actor_email || row.actor_user_id}</p>
                <p><strong>Reason:</strong> {row.reason}</p>
                <p><strong>Evidence:</strong> {row.evidence_ref}</p>
                <p><strong>Request audit reference:</strong> {row.audit_ref}</p>
                <p><strong>Created:</strong> {new Date(row.created_at).toLocaleString()}</p>
                {pending && ownRequest && <p><strong>Separation of duties:</strong> You cannot decide your own request. Another founder reviewer must review it.</p>}
                {pending && !ownRequest && (
                  <div>
                    <label htmlFor={`reason-${row.request_ref}`}>Decision reason (required)</label>
                    <textarea
                      id={`reason-${row.request_ref}`}
                      value={reasons[row.request_ref] || ""}
                      onChange={(event) => setReasons((previous) => ({ ...previous, [row.request_ref]: event.target.value.slice(0, 1200) }))}
                      minLength={8}
                      maxLength={1200}
                      rows={3}
                      style={{ display: "block", width: "100%", marginBlock: 8 }}
                    />
                    <button type="button" disabled={Boolean(workingRef) || (reasons[row.request_ref] || "").trim().length < 8} onClick={() => void decide(row, "APPROVED")}>
                      {workingRef === row.request_ref ? "Saving…" : "Approve request"}
                    </button>{" "}
                    <button type="button" disabled={Boolean(workingRef) || (reasons[row.request_ref] || "").trim().length < 8} onClick={() => void decide(row, "REJECTED")}>
                      Reject request
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
      <section aria-label="Decision history">
        <h2>Decision history</h2>
        {decisions.length === 0 && !loading && <p>No decisions have been recorded.</p>}
        {decisions.map((decision) => (
          <article key={decision.id} style={{ border: "1px solid currentColor", borderRadius: 8, padding: 12, marginBlock: 8 }}>
            <p><strong>{decision.decision}</strong> — request {decision.request_ref}</p>
            <p><strong>Reviewer:</strong> {decision.reviewer_email || decision.reviewer_user_id}</p>
            <p><strong>Reason:</strong> {decision.reason}</p>
            <p><strong>Decision reference:</strong> {decision.decision_ref}</p>
            <p><strong>Audit reference:</strong> {decision.audit_ref}</p>
            <p><strong>Recorded:</strong> {new Date(decision.created_at).toLocaleString()}</p>
          </article>
        ))}
      </section>
      <section aria-label="Execution guardrail">
        <h2>Execution guardrail</h2>
        <p>Approval only changes the request's review status. It does not trigger deployment, payments, messages, external providers, or any operational command. A separate execution authorization and verified runtime remain required.</p>
      </section>
    </main>
  );
}
