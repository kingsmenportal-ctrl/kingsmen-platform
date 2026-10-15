"use client";

import { useState } from "react";

export default function FounderCommandRequestPage() {
  const [commandId, setCommandId] = useState("REQUEST_DOCUMENT_REVIEW");
  const [commandName, setCommandName] = useState("Request Document Review");
  const [evidenceId, setEvidenceId] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/founder/commands/request", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandId, commandName, evidenceId, reason,
          requestId: "cmdreq_" + crypto.randomUUID().replaceAll("-", ""),
          auditId: "audit_" + crypto.randomUUID().replaceAll("-", ""),
          payload: {}
        })
      });
      const data = await response.json();
      setStatus(response.ok ? "Request persisted for review. No command was dispatched." : (data.error || "Request was not accepted."));
    } catch {
      setStatus("Could not confirm request persistence. No command was dispatched.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>New Founder Command Request</h1>
      <p>Requests are saved in WAITING_REVIEW with an audit event. This form does not approve or execute commands.</p>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>Command key <input required maxLength={100} value={commandId} onChange={(e) => setCommandId(e.target.value)} /></label>
          <label>Command name <input required maxLength={180} value={commandName} onChange={(e) => setCommandName(e.target.value)} /></label>
          <label>Evidence reference <input required maxLength={180} value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} /></label>
          <label>Reason <textarea required minLength={8} maxLength={1200} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <button type="submit">{busy ? "Saving…" : "Save for review"}</button>
        </fieldset>
      </form>
      {status && <p role="status" aria-live="polite">{status}</p>}
      <p><a href="/founder/control-plane/command-review/">Open command review queue</a></p>
    </main>
  );
}
