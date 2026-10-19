"use client";

import { useCallback, useEffect, useState } from "react";

type Requirement = { label: string; status: string };
type Opportunity = {
  opportunityId: string;
  title?: string;
  organisation?: string;
  sourceUrl?: string;
  requirementReview?: {
    reviewSourceUrl?: string;
    requirementNotes?: string;
    requirements?: Requirement[];
    reviewStatus?: string;
    reviewedAt?: string;
  };
};
type Workspace = { opportunities?: Opportunity[]; error?: string };

const statuses = ["UNKNOWN", "REQUIRED", "NOT_REQUIRED", "CANDIDATE_SATISFIED", "CANDIDATE_MISSING"];

export default function CandidateRequirementsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [requirements, setRequirements] = useState<Requirement[]>([{ label: "CV / résumé", status: "UNKNOWN" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({})) as Workspace;
      if (!response.ok) throw new Error(data.error || "Could not load your opportunities.");
      const list = Array.isArray(data.opportunities) ? data.opportunities : [];
      setOpportunities(list);
      setSelectedId((current) => list.some((item) => item.opportunityId === current) ? current : list[0]?.opportunityId || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load your opportunities.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selected = opportunities.find((item) => item.opportunityId === selectedId);

  useEffect(() => {
    if (!selected) return;
    const review = selected.requirementReview;
    setSourceUrl(review?.reviewSourceUrl || selected.sourceUrl || "");
    setNotes(review?.requirementNotes || "");
    setRequirements(review?.requirements?.length ? review.requirements.map((item) => ({ label: item.label, status: item.status })) : [
      { label: "CV / résumé", status: "UNKNOWN" },
      { label: "Identity document (only if required)", status: "UNKNOWN" },
      { label: "Qualifications / certificates (only if required)", status: "UNKNOWN" },
    ]);
  }, [selectedId, selected?.requirementReview?.reviewedAt]);

  function patchRequirement(index: number, patch: Partial<Requirement>) {
    setRequirements((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  async function save() {
    if (!selected) { setError("Save an opportunity before reviewing its requirements."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "recordRequirementReview", opportunityId: selected.opportunityId, reviewSourceUrl: sourceUrl, requirementNotes: notes, requirements }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== "REQUIREMENT_REVIEW_RECORDED") throw new Error(typeof data.error === "string" ? data.error : "Requirement review could not be saved.");
      if (Array.isArray(data.store?.opportunities)) setOpportunities(data.store.opportunities);
      setMessage("Candidate requirement checklist saved. Employer requirements and your assessment are not independently verified.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Requirement review could not be saved.");
    } finally { setSaving(false); }
  }

  const panel = { border: "1px solid #dbe3ec", borderRadius: 16, padding: 20, background: "#fff" };
  const input = { boxSizing: "border-box" as const, width: "100%", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: 9, background: "#fff", color: "#172033", font: "inherit" };
  const button = { border: "1px solid #cbd5e1", borderRadius: 9, padding: "10px 13px", background: "#fff", color: "#1d5675", fontWeight: 800, cursor: "pointer" };

  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 64px", color: "#172033" }}>
    <a href="/candidate/dashboard" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none" }}>← Candidate dashboard</a>
    <header style={{ margin: "22px 0 24px" }}>
      <p style={{ color: "#53657a", fontSize: 12, fontWeight: 800, letterSpacing: 1.6 }}>CANDIDATE APPLICATION SAFETY</p>
      <h1 style={{ fontSize: "clamp(30px, 5vw, 42px)", margin: "0 0 10px" }}>Vacancy requirements review</h1>
      <p style={{ color: "#53657a", lineHeight: 1.7, maxWidth: 760 }}>Record what the official vacancy says before preparing an application. This checklist is candidate-reported: it does not verify the employer, vacancy, source content, eligibility or document authenticity.</p>
    </header>
    {error && <div role="alert" style={{ ...panel, marginBottom: 16, color: "#8a1c13", background: "#fff1f0", borderColor: "#fecaca" }}>{error}</div>}
    {message && <div role="status" style={{ ...panel, marginBottom: 16, color: "#176345", background: "#eaf8f0", borderColor: "#b7e4ca" }}>{message}</div>}
    {loading ? <p role="status">Loading your saved opportunities…</p> : !opportunities.length ? <section style={panel}><h2>No saved opportunities yet</h2><p>Add an opportunity with its official HTTPS source first.</p><a href="/personal-job-desk/opportunity-scout" style={{ color: "#1d5675", fontWeight: 800 }}>Open opportunity scout →</a></section> : <>
      <section style={panel}>
        <label style={{ display: "block", fontWeight: 800 }}>Opportunity
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} style={{ ...input, display: "block", marginTop: 7 }}>
            {opportunities.map((item) => <option key={item.opportunityId} value={item.opportunityId}>{item.title || "Untitled opportunity"} — {item.organisation || "Unknown organisation"}</option>)}
          </select>
        </label>
        {selected?.requirementReview && <p style={{ color: "#176345", fontSize: 13 }}>Last saved: {new Date(selected.requirementReview.reviewedAt || "").toLocaleString("en-ZA")} · Status: {selected.requirementReview.reviewStatus}</p>}
      </section>
      {selected && <section style={{ ...panel, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Source and checklist</h2>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 14 }}>official vacancy source (HTTPS)
          <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" style={{ ...input, display: "block", marginTop: 7 }} />
        </label>
        <div style={{ display: "grid", gap: 12 }}>
          {requirements.map((item, index) => <article key={index} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(190px, .8fr) auto", gap: 10, alignItems: "end" }}>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Requirement label
              <input value={item.label} maxLength={160} onChange={(event) => patchRequirement(index, { label: event.target.value })} style={{ ...input, display: "block", marginTop: 6 }} />
            </label>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Recorded status
              <select value={item.status} onChange={(event) => patchRequirement(index, { status: event.target.value })} style={{ ...input, display: "block", marginTop: 6 }}>
                {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setRequirements((current) => current.filter((_, i) => i !== index))} style={button} aria-label={"Remove requirement " + (index + 1)}>Remove</button>
          </article>)}
        </div>
        <button type="button" onClick={() => { if (requirements.length < 30) setRequirements((current) => [...current, { label: "", status: "UNKNOWN" }]); }} disabled={requirements.length >= 30} style={{ ...button, marginTop: 12 }}>+ Add requirement</button>
        <label style={{ display: "block", fontWeight: 800, marginTop: 18 }}>Candidate notes
          <textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Note deadlines, eligibility questions, required files or details to confirm manually." style={{ ...input, display: "block", marginTop: 7, resize: "vertical" }} />
        </label>
        <button type="button" disabled={saving} onClick={() => void save()} style={{ ...button, marginTop: 16, background: saving ? "#e2e8f0" : "#172f46", color: saving ? "#64748b" : "#fff", borderColor: "#172f46" }}>{saving ? "Saving…" : "Save requirement review"}</button>
        <p style={{ color: "#53657a", fontSize: 13, lineHeight: 1.6, marginBottom: 0 }}>“Candidate satisfied” and “candidate missing” are your own assessments, not verified facts. Never assume an ID or certificate is universally required; check the specific vacancy.</p>
      </section>}
    </>}
  </main>;
}
