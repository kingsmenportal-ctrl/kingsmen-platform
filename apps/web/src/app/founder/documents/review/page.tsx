"use client";

import { FormEvent, useState } from "react";

type Status = "verified" | "rejected" | "needs_more_info" | "fraud_review";
type Proposal = {
  ok?: boolean;
  persisted?: boolean;
  statusChanged?: boolean;
  boundary?: string;
  error?: string;
  decision?: { documentId: string; candidateId: string; reviewStatus: Status; proofId: string; evidenceId: string; auditId: string; reviewerUserId: string; proposedAt: string; safeNotes: string };
  requirementsBeforePersistence?: string[];
};
const fields: Array<{ key: "documentId" | "candidateId" | "proofId" | "evidenceId" | "auditId"; label: string; help: string }> = [
  { key: "documentId", label: "Document reference", help: "Use an internal document ID, not a public file URL." },
  { key: "candidateId", label: "Candidate reference", help: "Must be independently checked against the document owner." },
  { key: "proofId", label: "Proof record reference", help: "A real immutable record proving the review action is warranted." },
  { key: "evidenceId", label: "Evidence reference", help: "A real evidence record supporting the decision." },
  { key: "auditId", label: "Audit record reference", help: "A unique audit reference; persistence is not implemented in this proposal tool." },
];
export default function FounderDocumentReviewPage() {
  const [values, setValues] = useState<Record<string, string>>({ documentId: "", candidateId: "", proofId: "", evidenceId: "", auditId: "", safeNotes: "" });
  const [status, setStatus] = useState<Status>("needs_more_info");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setProposal(null);
    try {
      const response = await fetch("/api/founder/documents/review", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...values, reviewStatus: status }),
      });
      const data = await response.json().catch(() => ({})) as Proposal;
      if (!response.ok || !data.ok) throw new Error(data.error || "Review proposal could not be prepared.");
      setProposal(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Review proposal could not be prepared."); }
    finally { setBusy(false); }
  }
  const input = { width: "100%", boxSizing: "border-box" as const, padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: 9, font: "inherit", background: "#fff", color: "#172033" };
  const panel = { border: "1px solid #dbe3ec", borderRadius: 14, padding: 18, background: "#fff" };
  return <main style={{ maxWidth: 920, margin: "0 auto", padding: "30px 20px 60px", color: "#172033" }}>
    <a href="/founder/control-plane" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none" }}>← Founder control plane</a>
    <header style={{ margin: "22px 0" }}><p style={{ color: "#53657a", fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>DOCUMENT GOVERNANCE · N05</p><h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", margin: "8px 0" }}>Document review proposal</h1><p style={{ color: "#53657a", lineHeight: 1.7 }}>Prepare a bounded, authenticated review proposal with references to proof, evidence and audit records. This page does not retrieve files or persist a decision. A proposal is not document verification.</p></header>
    <div role="note" style={{ ...panel, borderColor: "#f5d08a", background: "#fffbeb", marginBottom: 16 }}><strong>Authority boundary:</strong> only authenticated founder accounts can access the API. The endpoint validates inputs but does not yet verify ownership, resolve evidence references, write an audit event, or change a document status. Do not use this page as a production verification system.</div>
    {error && <p role="alert" style={{ color: "#991b1b", background: "#fef2f2", padding: 12, borderRadius: 8 }}>{error}</p>}
    <form onSubmit={submit} style={{ ...panel, display: "grid", gap: 16 }}>
      {fields.map((field) => <label key={field.key} style={{ display: "grid", gap: 6, fontWeight: 800, fontSize: 14 }}>{field.label}<input required minLength={3} maxLength={180} value={values[field.key]} onChange={(e) => setValues((old) => ({ ...old, [field.key]: e.target.value }))} style={input} autoComplete="off" /><span style={{ fontWeight: 400, color: "#64748b", fontSize: 12 }}>{field.help}</span></label>)}
      <label style={{ display: "grid", gap: 6, fontWeight: 800, fontSize: 14 }}>Proposed decision<select value={status} onChange={(e) => setStatus(e.target.value as Status)} style={input}><option value="needs_more_info">Needs more information</option><option value="verified">Verified (proposal only)</option><option value="rejected">Rejected (proposal only)</option><option value="fraud_review">Escalate to fraud review (proposal only)</option></select></label>
      <label style={{ display: "grid", gap: 6, fontWeight: 800, fontSize: 14 }}>Review notes<textarea rows={4} maxLength={1200} value={values.safeNotes} onChange={(e) => setValues((old) => ({ ...old, safeNotes: e.target.value }))} style={input} placeholder="Record objective observations; avoid unnecessary personal information."/><span style={{ color: "#64748b", fontSize: 12, fontWeight: 400 }}>{values.safeNotes.length}/1200 characters. Never include passwords, access tokens or unnecessary identity data.</span></label>
      <button disabled={busy} type="submit" style={{ justifySelf: "start", border: 0, borderRadius: 9, padding: "12px 16px", background: "#173e57", color: "#fff", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>{busy ? "Validating proposal…" : "Validate review proposal"}</button>
    </form>
    {proposal?.decision && <section aria-live="polite" style={{ ...panel, marginTop: 18, borderColor: "#b7d8c8" }}><p style={{ color: "#176345", fontWeight: 850, marginTop: 0 }}>Proposal validated · not saved</p><h2 style={{ fontSize: 20 }}>Review proposal summary</h2><dl style={{ display: "grid", gridTemplateColumns: "minmax(120px, .6fr) 1fr", gap: 10, fontSize: 14 }}>{Object.entries({ "Document": proposal.decision.documentId, "Candidate": proposal.decision.candidateId, "Proposed decision": proposal.decision.reviewStatus, "Reviewer user ID": proposal.decision.reviewerUserId, "Proposed at": new Date(proposal.decision.proposedAt).toLocaleString("en-ZA"), "Persistence": proposal.persisted ? "Saved" : "Not saved", "Document status changed": proposal.statusChanged ? "Yes" : "No" }).map(([label, value]) => <div key={label} style={{ display: "contents" }}><dt style={{ color: "#64748b" }}>{label}</dt><dd style={{ margin: 0, overflowWrap: "anywhere", fontWeight: 700 }}>{value}</dd></div>)}</dl><h3>Required before persistence</h3><ul style={{ color: "#53657a", lineHeight: 1.7 }}>{(proposal.requirementsBeforePersistence || []).map((item) => <li key={item}>{item}</li>)}</ul><p style={{ color: "#53657a", fontSize: 13 }}>{proposal.boundary}</p></section>}
  </main>;
}
