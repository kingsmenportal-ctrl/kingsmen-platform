import React from "react";

export interface DocumentChecklistItem {
  documentType: string;
  reason: string;
  status: "MISSING" | "UPLOADED" | "READY" | "REVIEW_REQUIRED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

export interface DocumentUploadChecklistProps {
  items: DocumentChecklistItem[];
}

export function DocumentUploadChecklist(props: DocumentUploadChecklistProps) {
  return (
    <section aria-label="Document upload checklist" className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white">
      <p className="text-sm uppercase tracking-wide text-slate-400">Upload Checklist</p>
      <h2 className="mt-2 text-xl font-semibold">Only upload what Kingsmen needs</h2>
      <p className="mt-2 text-sm text-slate-300">
        Each request shows the reason so candidates understand why a document is required.
      </p>

      <div className="mt-5 grid gap-3">
        {props.items.map((item) => (
          <div key={item.documentType} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <strong>{item.documentType}</strong>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{item.reason}</p>
            <p className="mt-2 text-xs text-slate-500">Priority: {item.priority}</p>
          </div>
        ))}
      </div>
    </section>
  );
}