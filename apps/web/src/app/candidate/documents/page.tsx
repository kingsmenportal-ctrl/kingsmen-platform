"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "./documents.module.css";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const DOCUMENT_TYPES = [
  ["ID_DOCUMENT", "Identity document"],
  ["MATRIC_CERTIFICATE", "Matric certificate"],
  ["ACADEMIC_RECORD", "Academic record / transcript"],
  ["PROOF_OF_ADDRESS", "Proof of address"],
  ["BANK_LETTER", "Bank letter"],
  ["PARENT_GUARDIAN_ID", "Parent / guardian identity document"],
  ["PAYSLIP", "Payslip"],
  ["AFFIDAVIT", "Affidavit"],
  ["APPLICATION_PROOF", "Application proof"],
  ["NSFAS_DOCUMENT", "NSFAS document"],
  ["OTHER", "Other document"]
] as const;
const EVIDENCE_PURPOSES = [
  ["CANDIDATE_DOCUMENT", "Candidate document"],
  ["PRE_SUBMISSION_CHECKLIST", "Pre-submission checklist evidence"],
  ["PROVIDER_SUBMISSION_RECEIPT", "Provider submission receipt"],
  ["PROVIDER_REFERENCE", "Provider reference"],
  ["PROVIDER_STATUS_NOTICE", "Provider status notice"],
  ["PROVIDER_OUTCOME_NOTICE", "Provider outcome notice"]
] as const;

type ApplicationRecord = { id: string; application_ref?: string; pathway_type?: string; status?: string; created_at?: string };
type Review = { decision?: string; reviewer_note?: string; evidence_reference?: string; created_at?: string };
type DocumentRecord = {
  id: string;
  documentType?: string;
  document_type?: string;
  filename?: string;
  original_filename?: string;
  mimeType?: string;
  mime_type?: string;
  sizeBytes?: number;
  size_bytes?: number;
  status?: string;
  checksumRecorded?: boolean;
  sha256_hex?: string | null;
  uploadedAt?: string | null;
  uploaded_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  application_id?: string | null;
  preparation_item_id?: string | null;
  latestReview?: Review | null;
  reviewHistory?: Review[];
  timeline?: Array<Record<string, unknown>>;
};
type VaultResponse = { ok?: boolean; ready?: boolean; error?: string; code?: string; message?: string; documents?: DocumentRecord[]; applications?: ApplicationRecord[] };
type UploadResponse = VaultResponse & {
  document?: { id?: string; status?: string };
  signedUploadUrl?: string;
  signedUploadToken?: string;
  uploadPath?: string;
  documentId?: string;
  signedReadUrl?: string;
  expiresInSeconds?: number;
  status?: string;
  reasonCode?: string;
};

function accessToken(): string | null {
  try {
    const raw = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}
function getMimeType(file: File): string {
  if (["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  return "";
}
function prettyStatus(value?: string) {
  return (value || "UNKNOWN").replaceAll("_", " ");
}
function prettySize(value?: number) {
  if (!Number.isFinite(value) || !value) return "Not recorded";
  return value < 1024 * 1024 ? Math.ceil(value / 1024) + " KB" : (value / (1024 * 1024)).toFixed(2) + " MB";
}
function prettyDate(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function isProviderEvidence(value: string) {
  return ["PROVIDER_SUBMISSION_RECEIPT", "PROVIDER_REFERENCE", "PROVIDER_STATUS_NOTICE", "PROVIDER_OUTCOME_NOTICE"].includes(value);
}
async function vaultPost(payload: Record<string, unknown>): Promise<UploadResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = accessToken();
  if (!url || !anonKey) throw new Error("The private document service is not configured for this deployment.");
  if (!token) throw new Error("Sign in first. Your authenticated session was not found in this browser.");
  const response = await fetch(url.replace(/\/$/, "") + "/functions/v1/candidate-private-documents", {
    method: "POST",
    headers: { apikey: anonKey, Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const result = await response.json() as UploadResponse;
  if (!response.ok || result.ok === false) {
    throw new Error(result.error || result.code || result.reasonCode || result.message || ("Document request failed (" + response.status + ")."));
  }
  return result;
}

export default function CandidateDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [documentType, setDocumentType] = useState("ACADEMIC_RECORD");
  const [evidencePurpose, setEvidencePurpose] = useState("CANDIDATE_DOCUMENT");
  const [applicationId, setApplicationId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmPrivate, setConfirmPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [readLinks, setReadLinks] = useState<Record<string, { url: string; expiresAt: number }>>({});
  const [pendingFinalizeId, setPendingFinalizeId] = useState<string | null>(null);

  const loadVault = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const token = accessToken();
      if (!url || !anonKey) throw new Error("The private document service is not configured for this deployment.");
      if (!token) throw new Error("Sign in first. Your authenticated session was not found in this browser.");
      const response = await fetch(url.replace(/\/$/, "") + "/functions/v1/candidate-private-documents", {
        method: "GET",
        headers: { apikey: anonKey, Authorization: "Bearer " + token },
        cache: "no-store"
      });
      const result = await response.json() as VaultResponse;
      if (!response.ok || result.ready !== true) throw new Error(result.error || result.code || result.message || ("Could not load documents (" + response.status + ")."));
      setDocuments(Array.isArray(result.documents) ? result.documents : []);
      setApplications(Array.isArray(result.applications) ? result.applications : []);
      setMessage(result.message || "Private document records loaded from the authenticated service.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load private document records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadVault(); }, [loadVault]);

  async function finalizeDocument(documentId: string) {
    setWorking("finalize:" + documentId);
    setError("");
    setMessage("");
    try {
      const result = await vaultPost({ action: "finalize-upload", documentId });
      if (result.status === "UPLOAD_FAILED" || result.ok === false) {
        setPendingFinalizeId(null);
        throw new Error(result.reasonCode || "The uploaded file did not pass server-side validation.");
      }
      setPendingFinalizeId(null);
      setMessage("Upload finalized by the document service. Its recorded checksum and review status are shown below; final verification is performed by an authorised reviewer.");
      await loadVault();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The upload finalization was not confirmed.");
    } finally {
      setWorking("");
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!file) { setError("Choose a PDF, JPEG or PNG file first."); return; }
    if (file.size < 1 || file.size > MAX_FILE_BYTES) { setError("File size must be between 1 byte and 10 MiB."); return; }
    const mimeType = getMimeType(file);
    if (!mimeType) { setError("Only PDF, JPEG and PNG files are accepted."); return; }
    if (!confirmPrivate) { setError("Confirm that this is your document (or a document you are authorised to submit) and may be stored privately for the selected purpose."); return; }
    if (isProviderEvidence(evidencePurpose) && !applicationId) {
      setError("Provider receipts, references, status notices and outcome notices must be linked to a Kingsmen parent application.");
      return;
    }

    setWorking("upload");
    try {
      const request = await vaultPost({
        action: "upload-url",
        documentTypeCode: documentType,
        filename: file.name,
        mimeType,
        sizeBytes: file.size,
        applicationId: applicationId || null,
        evidencePurpose
      });
      const documentId = request.document?.id;
      const signedUrl = request.signedUploadUrl;
      if (!documentId || !signedUrl) throw new Error("The private document service did not return a signed upload capability.");

      // The signed URL is one-time and short-lived. The raw file is uploaded directly to private Storage.
      const uploadBody = new FormData();
      uploadBody.append("cacheControl", "3600");
      uploadBody.append("", file, file.name);
      const storageResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body: uploadBody
      });
      if (!storageResponse.ok) {
        let detail = "";
        try { detail = await storageResponse.text(); } catch { /* no response body */ }
        throw new Error("Private storage upload failed (" + storageResponse.status + "). " + detail.slice(0, 240));
      }
      setPendingFinalizeId(documentId);
      setMessage("File uploaded to private storage. The service must now inspect the file signature and record SHA-256 before the upload is accepted.");
      await finalizeDocument(documentId);
      setFile(null);
      setConfirmPrivate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The document upload was not completed.");
    } finally {
      setWorking("");
    }
  }

  async function createReadLink(doc: DocumentRecord) {
    setWorking("read:" + doc.id);
    setError("");
    setMessage("");
    try {
      const result = await vaultPost({ action: "read-url", documentId: doc.id });
      if (!result.signedReadUrl) throw new Error("The service did not return a signed document link.");
      const seconds = typeof result.expiresInSeconds === "number" ? result.expiresInSeconds : 60;
      setReadLinks(current => ({ ...current, [doc.id]: { url: result.signedReadUrl!, expiresAt: Date.now() + seconds * 1000 } }));
      setMessage("A short-lived, audited download link was created. It expires automatically and is not a public file URL.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "A secure download link could not be created.");
    } finally {
      setWorking("");
    }
  }

  const pendingOrActive = documents.filter(d => ["UPLOAD_PENDING", "UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW"].includes(d.status || ""));
  const verified = documents.filter(d => d.status === "VERIFIED");
  const rejectedOrCorrection = documents.filter(d => ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status || ""));

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Document vault navigation">
          <a className={styles.brand} href="/" aria-label="Kingsmen Portal home">
            <span className={styles.mark} aria-hidden="true">K</span>
            <span><strong>KINGSMEN</strong><small>PRIVATE DOCUMENT VAULT</small></span>
          </a>
          <div className={styles.navLinks}>
            <a href="/candidate/dashboard">Dashboard</a>
            <a href="/candidate/profile">Profile & consent</a>
            <a href="/candidate/workbench">Application workbench</a>
            <a href="/personal-job-desk/application-tracker">Application tracker</a>
          </div>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Candidate workspace · Private evidence</p>
          <h1>Your private document vault.</h1>
          <p className={styles.lead}>
            Upload PDF, JPEG or PNG documents up to 10 MiB to Kingsmen’s private storage. Uploads are checked server-side for signature and size,
            hashed with SHA-256 and recorded in the audit trail. A submitted document is not automatically verified; only an authorised reviewer can decide its review status.
          </p>
          <div className={styles.actions}>
            <button className={styles.primary} type="button" onClick={() => void loadVault()} disabled={loading || Boolean(working)}>
              {loading ? "Loading documents…" : "Reload document records"}
            </button>
            <a className={styles.secondary} href="/candidate/workbench">Open application workbench ↗</a>
          </div>
        </header>

        {message && <section className={styles.status} role="status">{message}</section>}
        {error && <section className={styles.error} role="alert">{error}</section>}

        <section className={styles.section} aria-labelledby="upload-heading">
          <div className={styles.sectionHeader}>
            <h2 id="upload-heading">Upload a document</h2>
            <p className={styles.muted}>Files are private by default. No public object URL is shown. The service controls document ownership, size, signature checks, SHA-256 and review history.</p>
          </div>
          <form className={styles.panel} onSubmit={uploadDocument}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="document-type">Document type</label>
                <select id="document-type" value={documentType} onChange={e => setDocumentType(e.target.value)}>
                  {DOCUMENT_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="evidence-purpose">Evidence purpose</label>
                <select id="evidence-purpose" value={evidencePurpose} onChange={e => setEvidencePurpose(e.target.value)}>
                  {EVIDENCE_PURPOSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="application-reference">Link to parent application (optional for most documents)</label>
                <select id="application-reference" value={applicationId} onChange={e => setApplicationId(e.target.value)}>
                  <option value="">No application link</option>
                  {applications.map(app => <option key={app.id} value={app.id}>{app.application_ref || app.id} · {prettyStatus(app.status)} · {prettyStatus(app.pathway_type)}</option>)}
                </select>
                <span className={styles.hint}>Provider receipt, reference, status notice and outcome evidence require an application link.</span>
              </div>
              <div className={styles.field}>
                <label htmlFor="document-file">Select file</label>
                <input id="document-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <span className={styles.hint}>{file ? file.name + " · " + prettySize(file.size) + " · " + (getMimeType(file) || "Unsupported type") : "PDF, JPEG or PNG · Maximum 10 MiB"}</span>
              </div>
            </div>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={confirmPrivate} onChange={e => setConfirmPrivate(e.target.checked)} />
              <span>I am authorised to submit this file for the chosen purpose. I understand that Kingsmen stores it privately and that upload does not mean the document has been verified.</span>
            </label>
            <div className={styles.actions}>
              <button className={styles.primary} type="submit" disabled={working === "upload" || Boolean(working) || loading}>
                {working === "upload" ? "Uploading and checking…" : "Upload and validate privately"}
              </button>
              {pendingFinalizeId && (
                <button className={styles.secondary} type="button" onClick={() => void finalizeDocument(pendingFinalizeId)} disabled={Boolean(working)}>
                  Retry upload finalization
                </button>
              )}
            </div>
          </form>
        </section>

        <section className={styles.section} aria-labelledby="state-heading">
          <div className={styles.sectionHeader}><h2 id="state-heading">Vault status summary</h2><p className={styles.muted}>Counts come from the last authenticated list response.</p></div>
          <div className={styles.checkGrid}>
            <article className={styles.step}><strong>{documents.length} total records</strong><p>Private document metadata returned by the service.</p></article>
            <article className={styles.step}><strong>{pendingOrActive.length} awaiting / active review</strong><p>Uploaded and under-review records are not automatically verified.</p></article>
            <article className={styles.step}><strong>{verified.length} verified</strong><p>Only records with reviewer-issued verification status count here.</p></article>
          </div>
          {rejectedOrCorrection.length > 0 && <div className={styles.warning}>{rejectedOrCorrection.length} document(s) have a rejected/correction status. Read the latest reviewer note below and submit a corrected document if requested.</div>}
        </section>

        <section className={styles.section} aria-labelledby="documents-heading">
          <div className={styles.sectionHeader}><h2 id="documents-heading">Your document records</h2><p className={styles.muted}>A secure read link is generated on demand, audited and short-lived. Candidate actions cannot approve, reject or delete files.</p></div>
          {documents.length === 0 ? (
            <div className={styles.empty}><h3>No document records returned.</h3><p>Upload a document using the form above. If the service reports identity review required, an authorised reviewer must resolve that access step before the vault is available.</p></div>
          ) : (
            <div className={styles.docGrid}>
              {documents.map(doc => {
                const latestReview = doc.latestReview;
                const link = readLinks[doc.id];
                const expired = Boolean(link && link.expiresAt <= Date.now());
                return (
                  <article className={styles.docCard} key={doc.id}>
                    <div className={styles.tags}>
                      <span className={styles.tag}>{prettyStatus(doc.documentType || doc.document_type)}</span>
                      <span className={styles.tag}>{prettyStatus(doc.status)}</span>
                    </div>
                    <h3>{doc.filename || doc.original_filename || "Private document"}</h3>
                    <dl className={styles.facts}>
                      <div className={styles.fact}><dt>File size</dt><dd>{prettySize(doc.sizeBytes || doc.size_bytes)}</dd></div>
                      <div className={styles.fact}><dt>File type</dt><dd>{doc.mimeType || doc.mime_type || "Not recorded"}</dd></div>
                      <div className={styles.fact}><dt>Uploaded</dt><dd>{prettyDate(doc.uploadedAt || doc.uploaded_at || doc.createdAt || doc.created_at)}</dd></div>
                      <div className={styles.fact}><dt>SHA-256</dt><dd>{doc.sha256_hex || (doc.checksumRecorded ? "Checksum recorded by service" : "Not yet recorded")}</dd></div>
                      <div className={styles.fact}><dt>Application link</dt><dd>{doc.application_id ? applications.find(a => a.id === doc.application_id)?.application_ref || "Linked application" : "No parent application link"}</dd></div>
                      {latestReview && <div className={styles.fact}><dt>Latest review</dt><dd>{prettyStatus(latestReview.decision)} · {prettyDate(latestReview.created_at)}</dd></div>}
                    </dl>
                    {latestReview && (
                      <div className={styles.review}>
                        <strong>Reviewer note:</strong> {latestReview.reviewer_note || "No note recorded."}
                        {latestReview.evidence_reference && <><br /><strong>Evidence reference:</strong> {latestReview.evidence_reference}</>}
                      </div>
                    )}
                    <div className={styles.actions}>
                      <button className={styles.secondary} type="button" onClick={() => void createReadLink(doc)} disabled={Boolean(working) || !["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(doc.status || "")}>
                        {working === "read:" + doc.id ? "Creating secure link…" : "Create secure download link"}
                      </button>
                      {link && !expired && <a className={styles.primary} href={link.url} target="_blank" rel="noopener noreferrer">Download securely ↗</a>}
                      {link && expired && <span className={styles.hint}>The secure download link has expired. Request a new one.</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.warning}>
          Document status is governed by the server and review evidence. Candidate uploads do not create a provider receipt; only provider-origin evidence may support receipt/outcome claims.
          OCR or automated checks may assist a reviewer but do not make final verification decisions. No public file URLs or service-role credentials are exposed here.
        </section>

        <footer className={styles.footer}>
          Kingsmen Portal · Private document vault · Maximum 10 MiB · PDF / JPEG / PNG · Server-validated SHA-256 · Audited expiring read links.
        </footer>
      </div>
    </main>
  );
}
