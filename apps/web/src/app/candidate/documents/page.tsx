import Link from "next/link";
import DocumentVaultClient from "./DocumentVaultClient";

export const dynamic = "force-dynamic";

export default function CandidateDocumentsPage() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 18px 48px" }}>
      <p><Link href="/candidate/dashboard">← Candidate dashboard</Link></p>
      <h1>Kingsmen Documents</h1>
      <p>Upload private documents, view your own stored records, and track requested evidence. A successful upload creates a pending review record; it does not mark a document verified.</p>
      <DocumentVaultClient />
      <section aria-label="Document authority boundaries" style={{ marginTop: 24, border: "1px solid #454545", borderRadius: 12, padding: 16 }}>
        <h2>Review and privacy rules</h2>
        <ul>
          <li>Only the candidate identity resolved from the verified Supabase session may access candidate-owned document records.</li>
          <li>Raw public file URLs are not issued. Uploads use a server-created signed URL for private storage.</li>
          <li>Document verification, rejection, official application outcomes, and payment status are not candidate-controlled actions.</li>
          <li>OCR or automated extraction can assist review but cannot independently make final decisions.</li>
        </ul>
      </section>
    </main>
  );
}
