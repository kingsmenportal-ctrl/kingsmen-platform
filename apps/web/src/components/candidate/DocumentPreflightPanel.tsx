"use client";

import { useState, type ChangeEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg, .jpeg",
  "image/png": ".png"
};

type Preflight = { name: string; size: number; mime: string; sha256: string };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DocumentPreflightPanel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [inputVersion, setInputVersion] = useState(0);

  async function onChooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setError("");
    setPreflight(null);
    setInputVersion((n) => n + 1);
    if (!file) return;

    if (file.size <= 0) {
      setError("This file is empty. Choose a non-empty PDF, JPEG or PNG file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("This file exceeds the 10 MiB per-file limit.");
      return;
    }

    const extension = file.name.includes(".") ? `.${file.name.split(".").pop()!.toLowerCase()}` : "";
    const allowedExtension = [".pdf", ".jpg", ".jpeg", ".png"].includes(extension);
    const allowedMime = Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, file.type);
    if (!allowedExtension || (file.type && !allowedMime)) {
      setError("Only PDF, JPEG and PNG files are supported. The secure server must repeat this validation before upload.");
      return;
    }

    setBusy(true);
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      setPreflight({ name: file.name, size: file.size, mime: file.type || (extension === ".pdf" ? "application/pdf" : extension === ".png" ? "image/png" : "image/jpeg"), sha256 });
    } catch {
      setError("The file was not uploaded. This browser could not compute a SHA-256 preflight digest.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="document-preflight-title">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Local file preflight</p>
      <h2 id="document-preflight-title" className="mt-2 text-xl font-bold text-slate-950">Check your document before secure upload.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Choose a PDF, JPEG or PNG up to 10 MiB. This step checks basic browser-side requirements and computes SHA-256 locally; the file bytes are not sent to Kingsmen by this component.</p>

      <label className="mt-5 block rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-amber-400 hover:bg-amber-50">
        <span className="block text-sm font-bold text-slate-900">Select a document</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">PDF, JPG, JPEG or PNG · maximum 10 MiB</span>
        <input key={inputVersion} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onChooseFile} className="mt-4 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </label>

      {busy ? <p role="status" aria-live="polite" className="mt-4 text-sm text-slate-600">Checking file and computing SHA-256 locally…</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{error}</p> : null}

      {preflight ? (
        <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-slate-950">Browser preflight passed</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">File name</dt><dd className="mt-1 break-words font-medium text-slate-900">{preflight.name}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size / type</dt><dd className="mt-1 font-medium text-slate-900">{formatBytes(preflight.size)} · {preflight.mime}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">SHA-256 (browser preflight)</dt><dd className="mt-1 break-all font-mono text-xs text-slate-800">{preflight.sha256}</dd></div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-slate-800"><strong>Not uploaded or saved.</strong> The private-storage signer is not active on this route. Do not treat this preflight as document receipt, verification or a persisted record.</p>
        </div>
      ) : null}
    </section>
  );
}
