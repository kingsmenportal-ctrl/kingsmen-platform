import { DocumentVaultPanel } from "@/document-vault/DocumentVaultPanel";
import { DocumentUploadChecklist } from "@/document-vault/DocumentUploadChecklist";

export default function CandidateDocumentsPage() {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 text-slate-100 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">Candidate portal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Document Vault</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-300">
          Review the document requirements and the evidence rules before sharing personal information.
          This page does not claim that a file has been uploaded, stored, or verified.
        </p>
      </header>

      <section aria-label="Document service status" className="rounded-2xl border border-amber-700/60 bg-amber-950/30 p-5">
        <h2 className="font-semibold text-amber-100">Secure document actions are not connected here yet</h2>
        <p className="mt-2 text-sm leading-6 text-amber-50/90">
          No authenticated candidate document records or private-storage upload flow are available to this page.
          Upload and verification actions remain disabled until the secure backend and ownership checks are connected.
        </p>
      </section>

      <DocumentVaultPanel candidateName="Candidate" documents={[]} />
      <p className="text-sm text-slate-400">
        No document records were loaded. This is not evidence that you have no documents on file.
      </p>
      <DocumentUploadChecklist items={[]} />

      <section aria-label="Accepted document guidance" className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <h2 className="text-lg font-semibold">Preparation guidance</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          <li>Prepare clear PDF, JPEG, or PNG files, no larger than 10 MiB each.</li>
          <li>Only provide documents requested for your route; avoid sending unnecessary sensitive information.</li>
          <li>Upload, OCR, and review status must be confirmed by the service, not inferred by the browser.</li>
          <li>Document verification is a human-governed review state, not a guarantee of application acceptance.</li>
        </ul>
      </section>
    </main>
  );
}
