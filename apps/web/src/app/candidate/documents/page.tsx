export default function CandidateDocumentsPage() {
  return (
    <main>
      <h1>Kingsmen Documents</h1>
      <p>Upload and view your own documents. Verification is handled by Kingsmen review rules, not by the browser.</p>

      <section aria-label="Document Vault Boundary">
        <article>
          <h2>Private Storage</h2>
          <p>Documents use private storage with signed upload and signed read links. Raw public file access is blocked.</p>
        </article>
        <article>
          <h2>OCR and Review</h2>
          <p>OCR helps review documents but does not make final decisions. Risky documents require human review.</p>
        </article>
        <article>
          <h2>Evidence</h2>
          <p>Document status changes require proof, evidence, and audit records.</p>
        </article>
      </section>
    </main>
  );
}