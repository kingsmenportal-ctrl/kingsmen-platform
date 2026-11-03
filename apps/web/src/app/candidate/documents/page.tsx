import Link from "next/link";
import CandidateDocumentSelectionDemo from "@/components/preview/candidate-document-selection-demo";

const requirements = [
  { title: "Identity document", description: "Prepare a clear, readable document when the route requires it." },
  { title: "Qualifications", description: "Keep certificates or academic records ready for eligible applications." },
  { title: "Proof of residence", description: "Provide a recent accepted document if the provider requires one." },
];

export default function CandidateDocumentsPage() {
  return (
    <main className="public-site candidate-page">
      <div className="public-notice"><span aria-hidden="true" /> DOCUMENT VAULT · Uploads are not connected on this screen</div>
      <header className="public-header"><div className="public-container public-header-inner">
        <Link className="public-brand" href="/" aria-label="Kingsmen Portal home"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link>
        <nav className="public-nav" aria-label="Candidate navigation"><Link href="/">Home</Link><Link href="/candidate/dashboard/">Dashboard</Link><Link href="/packages/">Packages</Link><Link className="public-nav-portal" href="/free-destiny-map/">Destiny Map ↗</Link></nav>
      </div></header>
      <div className="public-container candidate-page-body">
        <header className="candidate-page-heading"><div><div className="public-eyebrow"><span /> DOCUMENT VAULT</div><h1>Documents & <em>verification.</em></h1><p>Prepare the correct documents before moving to an eligible application route.</p></div><span className="candidate-preview-chip">LOCAL PREVIEW</span></header>
        <section className="candidate-doc-progress"><div className="candidate-doc-progress-heading"><div><h2>Document readiness checklist</h2><p>No documents have been uploaded or verified through this screen.</p></div><strong>0 / 3</strong></div><div className="candidate-progress-track"><span /></div><div className="candidate-progress-steps"><span>01 · Select</span><span>02 · Review</span><span>03 · Verify</span><span>04 · Continue</span></div></section>
        <div className="candidate-doc-layout"><section className="candidate-doc-panel"><div className="candidate-subheading"><h2>Documents to prepare</h2><p>Production file policy target: PDF, JPEG or PNG, up to 10 MiB per file.</p></div>
          {requirements.map((doc, index) => <article className="candidate-doc-row" key={doc.title}><span className="candidate-doc-file">{index === 2 ? "IMG" : "PDF"}</span><div><h3>{doc.title}</h3><p>{doc.description}</p></div><span className="candidate-doc-status">Not submitted</span></article>)}
          <CandidateDocumentSelectionDemo />
          <p className="candidate-doc-callout">Production upload, SHA-256 integrity checks, private storage, expiring access links and reviewer audit events are not connected to this screen.</p>
        </section>
        <aside className="candidate-doc-panel candidate-doc-sidebar"><span className="candidate-doc-shield" aria-hidden="true">✓</span><h2>Privacy and review boundaries</h2><p>Documents must remain private. OCR can assist review but does not make final decisions; a human reviewer must handle decisions that need verification or correction.</p><div className="candidate-doc-rule"><span>Storage</span><strong>Private only</strong></div><div className="candidate-doc-rule"><span>Review</span><strong>Human-controlled</strong></div><div className="candidate-doc-rule"><span>Evidence</span><strong>Required</strong></div><Link className="public-button public-button-outline" href="/candidate/dashboard/">Back to candidate dashboard</Link></aside></div>
      </div>
      <footer className="public-footer public-container"><Link className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link><span>Document readiness preview · No file transmission</span></footer>
    </main>
  );
}
