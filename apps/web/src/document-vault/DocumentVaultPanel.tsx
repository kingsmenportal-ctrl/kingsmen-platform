import React from "react";

export type DocumentVaultItemStatus = "UPLOADED" | "PROCESSING" | "READY" | "REJECTED" | "ARCHIVED" | "DELETED";
export type DocumentVaultVerificationStatus = "PENDING" | "VERIFIED" | "REVIEW_REQUIRED" | "REJECTED" | "EXPIRED";

export interface DocumentVaultItem {
  documentRef: string;
  documentType: string;
  displayName: string;
  documentStatus: DocumentVaultItemStatus;
  verificationStatus: DocumentVaultVerificationStatus;
  uploadedAt: string;
}

export interface DocumentVaultPanelProps {
  candidateName: string;
  documents: DocumentVaultItem[];
}

export function DocumentVaultPanel(props: DocumentVaultPanelProps) {
  return (
    <section aria-label="Kingsmen document vault" className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white">
      <p className="text-sm uppercase tracking-wide text-slate-400">Document Vault</p>
      <h2 className="mt-2 text-xl font-semibold">{props.candidateName} documents</h2>
      <p className="mt-2 text-sm text-slate-300">
        Documents are private, evidence-backed, and reviewed before they are used for applications.
      </p>

      <div className="mt-5 space-y-3">
        {props.documents.map((document) => (
          <article key={document.documentRef} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{document.displayName}</h3>
                <p className="mt-1 text-xs text-slate-400">{document.documentType}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full border border-slate-700 px-3 py-1">{document.documentStatus}</span>
                <span className="rounded-full border border-slate-700 px-3 py-1">{document.verificationStatus}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Uploaded: {document.uploadedAt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}