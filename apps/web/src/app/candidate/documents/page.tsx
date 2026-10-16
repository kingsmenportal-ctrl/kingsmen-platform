export default function CandidateDocumentsPage() {
  const stages = [
    { status: "Not started", meaning: "No upload or document record has been created in this view." },
    { status: "Awaiting candidate", meaning: "The candidate needs to provide or replace a document. This status must come from an authoritative record before being shown as a real request." },
    { status: "In review", meaning: "A reviewer is checking the submitted material. OCR or automated extraction alone is not approval." },
    { status: "Action required", meaning: "A reviewer has identified a next step. Follow the instructions in an authenticated candidate account once that service is connected." },
    { status: "Accepted / verified", meaning: "Only an authorised, evidence-backed review service may set this status. This page does not verify documents." },
  ];
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <a href="/candidate/dashboard" style={{ color: "#f1d48b" }}>← Candidate dashboard</a>
      <p style={{ color: "#d8b66a", letterSpacing: ".14em", fontWeight: 800 }}>CANDIDATE DOCUMENTS</p>
      <h1>Document checklist and review guide</h1>
      <p>This page explains the intended document workflow. It does not currently list personal files or connect to a candidate-specific document record.</p>
      <aside role="note" style={{ border: "1px solid #a67b35", borderRadius: 12, padding: 16, margin: "20px 0" }}>
        <strong>Not connected to document storage</strong>
        <p>No upload, download, signed link, OCR job, verification or review action is available from this page. Do not treat it as a functioning document vault or upload sensitive files here.</p>
      </aside>
      <section aria-label="Document handling boundaries" style={{ display: "grid", gap: 12 }}>
        <article style={panel}><h2>Private storage boundary</h2><p>When storage is integrated, files must be private and access-controlled per authenticated candidate. Public file URLs are not appropriate for identity or application documents.</p></article>
        <article style={panel}><h2>Review and evidence</h2><p>OCR may assist a reviewer but cannot make a final decision. Acceptance, rejection and requests for replacement must be backed by authorised review evidence and an audit trail.</p></article>
        <article style={panel}><h2>Candidate-visible status meanings</h2><dl>{stages.map(s => <div key={s.status} style={{ marginBottom: 14 }}><dt style={{ fontWeight: 800, color: "#f1d48b" }}>{s.status}</dt><dd style={{ marginLeft: 0 }}>{s.meaning}</dd></div>)}</dl></article>
      </section>
      <p style={{ borderTop: "1px solid #45424a", paddingTop: 16, fontSize: 13, opacity: .85 }}>Status labels above are explanatory examples, not live statuses for a candidate. No real documents, candidate records, or verification decisions are displayed.</p>
    </main>
  );
}
const panel = { border: "1px solid #45424a", borderRadius: 12, padding: 18 };
