"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type VaultDocument = {
  id: string; documentType: string; filename: string; mimeType: string;
  sizeBytes: number; status: string; checksumRecorded: boolean;
  uploadedAt: string | null; createdAt: string; updatedAt: string;
};
const TYPES = [
  ["CV","CV / Résumé"],["ID_DOCUMENT","Identity document"],["MATRIC_CERTIFICATE","Matric certificate"],
  ["ACADEMIC_RECORD","Academic record / transcript"],["PROOF_OF_ADDRESS","Proof of address"],
  ["BANK_LETTER","Bank letter"],["PARENT_GUARDIAN_ID","Parent / guardian ID"],["PAYSLIP","Payslip"],
  ["AFFIDAVIT","Affidavit"],["APPLICATION_PROOF","Application proof"],["NSFAS_DOCUMENT","NSFAS supporting document"],["OTHER","Other"]
] as const;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["application/pdf","image/jpeg","image/png"]);

function tokenFromSession(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || typeof window === "undefined") return null;
  try {
    const ref = new URL(base).hostname.split(".")[0];
    const stored = window.localStorage.getItem(`sb-${ref}-auth-token`);
    if (!stored) return null;
    const session = JSON.parse(stored) as Record<string, unknown>;
    return typeof session.access_token === "string" ? session.access_token : null;
  } catch { return null; }
}
function apiMessage(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    for (const key of ["status","message","error"]) if (typeof p[key] === "string") return String(p[key]);
  }
  return "The document request could not be completed.";
}
function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export default function CandidateDocumentsPage() {
  const [docs,setDocs] = useState<VaultDocument[]>([]);
  const [docType,setDocType] = useState("CV");
  const [file,setFile] = useState<File | null>(null);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [notice,setNotice] = useState("");
  const [readLink,setReadLink] = useState<{id:string;url:string}|null>(null);

  const refresh = useCallback(async () => {
    const token = tokenFromSession();
    if (!token) {
      setDocs([]); setLoading(false); setNotice("Sign in to view your private documents.");
      return;
    }
    try {
      const response = await fetch("/api/candidate/documents/status", {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || body.ok !== true) {
        setDocs([]);
        setNotice(apiMessage(body));
      } else {
        setDocs(Array.isArray(body.documents) ? body.documents as VaultDocument[] : []);
        setNotice("");
      }
    } catch { setNotice("Document status is temporarily unavailable."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(""); setReadLink(null);
    const token = tokenFromSession();
    if (!token) { setNotice("Sign in before uploading documents."); return; }
    if (!file) { setNotice("Choose a document first."); return; }
    if (!ALLOWED_MIME.has(file.type)) { setNotice("Only PDF, JPEG and PNG files are accepted."); return; }
    if (file.size < 1 || file.size > MAX_BYTES) { setNotice("The file must be between 1 byte and 10 MiB."); return; }
    setBusy(true);
    try {
      const intentResponse = await fetch("/api/candidate/documents/upload-url", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ documentTypeCode: docType, filename: file.name, mimeType: file.type, sizeBytes: file.size }),
        cache: "no-store"
      });
      const intent = await intentResponse.json();
      if (!intentResponse.ok || intent.ok !== true || typeof intent.signedUploadUrl !== "string" || typeof intent.document?.id !== "string") {
        setNotice(apiMessage(intent)); return;
      }
      // Supabase signed-upload URLs accept the raw file body, not multipart FormData.
      const uploaded = await fetch(intent.signedUploadUrl, {
        method: "PUT",
        headers: { "x-upsert": "false", "Content-Type": file.type },
        body: file,
        cache: "no-store",
        redirect: "error"
      });
      if (!uploaded.ok) { setNotice("Private storage rejected the upload. It has not been marked as received."); await refresh(); return; }

      const finalizedResponse = await fetch("/api/candidate/documents/finalize", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: intent.document.id }), cache: "no-store"
      });
      const finalized = await finalizedResponse.json();
      if (!finalizedResponse.ok || finalized.ok !== true) {
        setNotice(apiMessage(finalized)); await refresh(); return;
      }
      setFile(null);
      const fileInput = document.getElementById("kingsmen-document-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setNotice("Upload received. Server-side size, file-signature and SHA-256 checks passed. A reviewer must still verify the document.");
      await refresh();
    } catch { setNotice("The upload could not be completed. Check your connection and retry."); }
    finally { setBusy(false); }
  }

  async function getReadLink(id: string) {
    setNotice(""); setReadLink(null);
    const token = tokenFromSession();
    if (!token) { setNotice("Sign in before opening documents."); return; }
    try {
      const response = await fetch("/api/candidate/documents/read-url", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }), cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok || body.ok !== true || typeof body.signedReadUrl !== "string") { setNotice(apiMessage(body)); return; }
      setReadLink({ id, url: body.signedReadUrl });
    } catch { setNotice("A private read link could not be issued."); }
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Private Document Vault</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Upload documents once and reuse them where appropriate. Files remain private. An upload receipt is not human verification or a provider-confirmed application outcome.</p>
        </div>
        <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 text-sm">Candidate dashboard</a>
      </header>

      {notice && <div role="status" className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6">{notice}
        {!tokenFromSession() && <p className="mt-2"><a className="text-cyan-300 underline" href="/candidate/login">Sign in / create account</a></p>}
        {notice.includes("IDENTITY_REVIEW_REQUIRED") && <p className="mt-2 text-slate-300">Your authenticated account needs a verified candidate link from the authorised identity-review workflow. Kingsmen does not link accounts by email equality.</p>}
      </div>}

      <section className="mt-8 grid gap-4 md:grid-cols-[1fr_0.9fr]">
        <form onSubmit={upload} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Upload a document</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">PDF, JPEG or PNG; maximum 10 MiB. The server checks file content after upload.</p>
          <label className="mt-5 block text-sm font-medium">Document type
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3">
              {TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="mt-4 block text-sm font-medium">Choose file
            <input id="kingsmen-document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm" />
          </label>
          {file && <p className="mt-3 break-words text-xs text-slate-400">{file.name} · {formatSize(file.size)} · {file.type}</p>}
          <button type="submit" disabled={busy || !file} className="mt-5 w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Uploading and checking…" : "Upload privately"}</button>
        </form>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Privacy and verification</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>Private bucket; no public document URLs.</li>
            <li>Only a verified candidate identity can request upload or read links.</li>
            <li>Server checks actual size, PDF/JPEG/PNG signature and SHA-256.</li>
            <li>Signed read links expire after 60 seconds and issuance is audited.</li>
            <li>Only a reviewer can verify or reject documents.</li>
          </ul>
          <button type="button" disabled={loading} onClick={() => { setLoading(true); void refresh(); }} className="mt-5 rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-50">{loading ? "Refreshing…" : "Refresh document list"}</button>
        </aside>
      </section>

      {readLink && <section className="mt-6 rounded-2xl border border-cyan-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-200">This private link expires after 60 seconds.</p>
        <a href={readLink.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm text-cyan-300 underline">Open document</a>
      </section>}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold">Your documents</h2><p className="mt-1 text-sm text-slate-400">Status is persisted by Kingsmen; upload receipt is not human verification.</p></div><span className="text-sm text-slate-400">{docs.length} document{docs.length === 1 ? "" : "s"}</span></div>
        {loading ? <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">Loading document status…</p>
        : docs.length === 0 ? <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm leading-6 text-slate-300">No documents available. Sign in and complete authorised identity linking to use the private vault.</p>
        : <div className="mt-4 grid gap-3">{docs.map((doc) => <article key={doc.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h3 className="break-words font-semibold">{doc.filename}</h3><p className="mt-1 text-xs text-slate-400">{doc.documentType} · {formatSize(doc.sizeBytes)} · {doc.mimeType}</p><p className="mt-2 text-xs text-slate-500">Received: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : "Not yet confirmed"} · SHA-256: {doc.checksumRecorded ? "recorded" : "pending"}</p></div><span className="rounded-full border border-slate-700 px-3 py-1 text-xs">{doc.status}</span></div>
          {["UPLOADED_CANDIDATE_REPORTED","UNDER_REVIEW","VERIFIED"].includes(doc.status) && <button type="button" onClick={() => void getReadLink(doc.id)} className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-sm text-cyan-300 hover:border-cyan-300">Request private read link</button>}
        </article>)}</div>}
      </section>
    </div>
  </main>;
}
