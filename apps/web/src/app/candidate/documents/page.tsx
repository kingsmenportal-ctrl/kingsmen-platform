"use client";
import { useCallback, useEffect, useState } from "react";
type CandidateDocument = { documentRef: string; documentType: string; displayName: string; mimeType: string; fileSizeBytes: number; documentStatus: string; verificationStatus: string; extractionStatus: string; uploadedAt: string };\ntype CandidateDocumentRequest = { requestRef: string; documentType: string; reason: string; priority: string; dueAt: string | null; createdAt: string };\ntype RequestState = { kind: "loading" } | { kind: "blocked"; message: string } | { kind: "ready"; requests: CandidateDocumentRequest[] };
type DocumentStatus = { ok?: boolean; status?: string; code?: string; error?: string; message?: string; documents?: CandidateDocument[] };
type ViewState = { kind: "loading" } | { kind: "blocked"; message: string; code?: string } | { kind: "error" } | { kind: "ready"; data: DocumentStatus };
const stages = [
 { status: "Not started", meaning: "No upload or document record has been created in this view." },
 { status: "Awaiting candidate", meaning: "The candidate needs to provide or replace a document. This status must come from an authoritative record before being shown as a real request." },
 { status: "In review", meaning: "A reviewer is checking the submitted material. OCR or automated extraction alone is not approval." },
 { status: "Action required", meaning: "A reviewer has identified a next step. Follow instructions in the authenticated candidate account once the service is connected." },
 { status: "Accepted / verified", meaning: "Only an authorised, evidence-backed review service may set this status. This page does not verify documents." },
];
export default function CandidateDocumentsPage() {
 const [view, setView] = useState<ViewState>({ kind: "loading" });\n const [requestState, setRequestState] = useState<RequestState>({ kind: "loading" });
 const refreshStatus = useCallback(async () => {
  setView({ kind: "loading" });
  try {
   const response = await fetch("/api/candidate/documents/status", { method: "GET", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
   const payload = (await response.json().catch(() => ({}))) as DocumentStatus;
   if (!response.ok || payload.ok !== true) {
    setView({ kind: "blocked", code: typeof payload.code === "string" ? payload.code : undefined, message: typeof payload.error === "string" ? payload.error : "Your document records cannot be loaded safely right now." });
    return;
   }
   setView({ kind: "ready", data: payload });
  } catch { setView({ kind: "error" }); }
 }, []);
 const refreshRequests = useCallback(async () => {
  setRequestState({ kind: "loading" });
  try {
   const response = await fetch("/api/candidate/document-requests", { method: "GET", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
   const payload = await response.json().catch(() => ({})) as { ok?: boolean; requests?: CandidateDocumentRequest[]; error?: string };
   if (!response.ok || payload.ok !== true || !Array.isArray(payload.requests)) {
    setRequestState({ kind: "blocked", message: typeof payload.error === "string" ? payload.error : "Requested document records are unavailable right now." });
    return;
   }
   setRequestState({ kind: "ready", requests: payload.requests });
  } catch { setRequestState({ kind: "blocked", message: "Requested document records could not be loaded. Please try again." }); }
 }, []);
 useEffect(() => { void refreshStatus(); void refreshRequests(); }, [refreshStatus, refreshRequests]);
 return <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
  <a href="/candidate/dashboard" style={{ color: "#f1d48b" }}>← Candidate dashboard</a>
  <p style={{ color: "#d8b66a", letterSpacing: ".14em", fontWeight: 800 }}>CANDIDATE DOCUMENTS</p>
  <h1>Document checklist and review guide</h1>
  <p>This screen checks the candidate-document status endpoint. It never treats a browser-supplied document ID as proof of ownership and does not display invented candidate records.</p>
  <section aria-labelledby="live-status-heading" aria-live="polite" style={{ border: "1px solid #a67b35", borderRadius: 12, padding: 16, margin: "20px 0" }}>
   <h2 id="live-status-heading">Document service status</h2>
   {view.kind === "loading" && <p role="status">Checking whether secure document status is available…</p>}
   {view.kind === "blocked" && <><p><strong>Secure document status is currently unavailable.</strong></p><p>{view.message}</p>{view.code && <p style={{ fontSize: 13, opacity: .8 }}>Reference: {view.code}</p>}<p>No personal document information has been returned. Upload, download, signed-link access, and document review remain unavailable until authenticated ownership and storage integration are enabled.</p><button type="button" onClick={() => void refreshStatus()} style={buttonStyle}>Check again</button></>}
   {view.kind === "error" && <><p><strong>Could not contact the document status service.</strong></p><p>No document data is shown. Please try again later.</p><button type="button" onClick={() => void refreshStatus()} style={buttonStyle}>Retry</button></>}
   {view.kind === "ready" && <><p role="status">Secure document metadata loaded.</p>{(view.data.documents ?? []).length === 0 ? <p>No active document records were found for this account.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}><thead><tr>{["Document","Type","Status","Verification","Extraction","Size","Uploaded"].map(label => <th key={label} scope="col" style={{ padding: 10, borderBottom: "1px solid #45424a" }}>{label}</th>)}</tr></thead><tbody>{(view.data.documents ?? []).map(doc => <tr key={doc.documentRef}><td style={cell}>{doc.displayName}</td><td style={cell}>{doc.documentType}</td><td style={cell}>{doc.documentStatus}</td><td style={cell}>{doc.verificationStatus}</td><td style={cell}>{doc.extractionStatus}</td><td style={cell}>{formatBytes(doc.fileSizeBytes)}</td><td style={cell}>{formatDate(doc.uploadedAt)}</td></tr>)}</tbody></table></div>}<p>These are metadata-only records. This screen does not expose file contents or download links, and automated extraction is not document approval.</p><button type="button" onClick={() => void refreshStatus()} style={buttonStyle}>Refresh documents</button></>}
  </section>
  <section aria-labelledby="document-requests-heading" aria-live="polite" style={{ border: "1px solid #45424a", borderRadius: 12, padding: 16, margin: "20px 0" }}>
   <h2 id="document-requests-heading">Requested documents</h2>
   {requestState.kind === "loading" && <p role="status">Checking your open document requests…</p>}
   {requestState.kind === "blocked" && <><p>{requestState.message}</p><p>No request data is shown unless it can be linked to your authenticated account.</p><button type="button" onClick={() => void refreshRequests()} style={buttonStyle}>Retry requests</button></>}
   {requestState.kind === "ready" && <>{requestState.requests.length === 0 ? <p>There are no open document requests recorded for this account.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}><thead><tr>{["Document type","Reason","Priority","Due","Requested"].map(label => <th key={label} scope="col" style={{ padding: 10, borderBottom: "1px solid #45424a" }}>{label}</th>)}</tr></thead><tbody>{requestState.requests.map(item => <tr key={item.requestRef}><td style={cell}>{item.documentType}</td><td style={cell}>{item.reason}</td><td style={cell}>{item.priority}</td><td style={cell}>{item.dueAt ? formatDate(item.dueAt) : "No due date recorded"}</td><td style={cell}>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div>}<button type="button" onClick={() => void refreshRequests()} style={buttonStyle}>Refresh requests</button></>}
   <p style={{ fontSize: 13, opacity: .85 }}>Only open request metadata is shown. This does not upload a file, fulfill a request, or change a review decision.</p>
  </section>
  <section aria-label="Document handling boundaries" style={{ display: "grid", gap: 12 }}>
   <article style={panel}><h2>Private storage boundary</h2><p>Files must remain private and access-controlled per authenticated candidate. Public file URLs are not appropriate for identity or application documents.</p></article>
   <article style={panel}><h2>Review and evidence</h2><p>OCR may assist a reviewer but cannot make a final decision. Acceptance, rejection and requests for replacement must be backed by authorised review evidence and an audit trail.</p></article>
   <article style={panel}><h2>Candidate-visible status meanings</h2><dl>{stages.map(s => <div key={s.status} style={{ marginBottom: 14 }}><dt style={{ fontWeight: 800, color: "#f1d48b" }}>{s.status}</dt><dd style={{ marginLeft: 0 }}>{s.meaning}</dd></div>)}</dl></article>
  </section>
  <p style={{ borderTop: "1px solid #45424a", paddingTop: 16, fontSize: 13, opacity: .85 }}>Status labels above are explanatory examples, not live statuses for a candidate. No real documents, candidate records, or verification decisions are displayed.</p>
 </main>;
}
const panel = { border: "1px solid #45424a", borderRadius: 12, padding: 18 };
const buttonStyle = { background: "#f1d48b", color: "#080b14", border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };

const cell = { padding: 10, borderBottom: "1px solid #45424a", verticalAlign: "top" as const };
function formatBytes(value: number): string {
 if (!Number.isFinite(value) || value < 0) return "—";
 if (value < 1024) return `${value} B`;
 if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
 return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(value: string): string {
 const date = new Date(value);
 return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
