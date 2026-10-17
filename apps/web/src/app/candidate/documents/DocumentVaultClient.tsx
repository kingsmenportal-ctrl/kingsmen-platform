"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type DocumentRow = {
  id: string;
  document_type: string;
  display_name: string;
  mime_type: string;
  file_size_bytes: number | string;
  document_status: string;
  verification_status: string;
  uploaded_at: string;
};

type RequestRow = {
  id: string;
  document_type: string;
  reason: string;
  priority: string;
  request_status: string;
  due_at: string | null;
};

type StatusPayload = {
  ok: boolean;
  error?: string;
  code?: string;
  documents?: DocumentRow[];
  requests?: RequestRow[];
  counts?: { documents: number; pendingVerification: number; openRequests: number };
};

const documentTypes = [
  ["CV", "CV / résumé"],
  ["ID_DOCUMENT", "Identity document"],
  ["MATRIC_CERTIFICATE", "Matric certificate"],
  ["ACADEMIC_RECORD", "Academic record"],
  ["PROOF_OF_ADDRESS", "Proof of address"],
  ["BANK_LETTER", "Bank letter"],
  ["PARENT_GUARDIAN_ID", "Parent / guardian ID"],
  ["PAYSLIP", "Payslip"],
  ["AFFIDAVIT", "Affidavit"],
  ["APPLICATION_PROOF", "Application proof"],
  ["NSFAS_DOCUMENT", "NSFAS document"],
  ["OTHER", "Other document"]
] as const;

function getStoredAccessToken(): string | null {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let parsed: unknown;
      try {
        const normalized = raw.startsWith("base64-") ? atob(raw.slice(7)) : raw;
        parsed = JSON.parse(normalized);
      } catch {
        continue;
      }
      if (parsed && typeof parsed === "object" && "access_token" in parsed) {
        const token = (parsed as { access_token?: unknown }).access_token;
        if (typeof token === "string" && token.length > 20) return token;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function readableBytes(value: number | string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentVaultClient() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [documentTypeCode, setDocumentTypeCode] = useState<string>("CV");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAccessToken(getStoredAccessToken());
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const token = accessToken || getStoredAccessToken();
    if (!token) {
      setMessage("No signed-in Supabase session was found in this browser. Sign in before opening private documents.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/candidate/documents/status", {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const result = await response.json() as StatusPayload;
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not load document status.");
      setDocuments(result.documents || []);
      setRequests(result.requests || []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load document status.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) void refresh();
  }, [accessToken, refresh]);

  async function openDocument(documentId: string) {
    const token = accessToken || getStoredAccessToken();
    if (!token) {
      setMessage("No signed-in session was found. Sign in before reading private documents.");
      return;
    }
    try {
      const response = await fetch("/api/candidate/documents/read-url", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentId })
      });
      const result = await response.json();
      if (!response.ok || !result.ok || typeof result.signedReadUrl !== "string") {
        throw new Error(result.error || "Could not create a private document link.");
      }
      const opened = window.open(result.signedReadUrl, "_blank", "noopener,noreferrer");
      if (!opened) window.location.assign(result.signedReadUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open private document.");
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = accessToken || getStoredAccessToken();
    if (!token) {
      setMessage("No signed-in session was found. Sign in before uploading private documents.");
      return;
    }
    if (!file) {
      setMessage("Choose a document file first.");
      return;
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      setMessage("Documents must be between 1 byte and 10 MiB.");
      return;
    }

    setUploading(true);
    setMessage("Creating a candidate-scoped private upload link…");
    try {
      const linkResponse = await fetch("/api/candidate/documents/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentTypeCode, filename: file.name, mimeType: file.type, sizeBytes: file.size })
      });
      const linkResult = await linkResponse.json();
      if (!linkResponse.ok || !linkResult.ok) throw new Error(linkResult.error || "Could not create private upload link.");

      setMessage("Uploading file to private storage…");
      const uploadResponse = await fetch(linkResult.signedUploadUrl as string, {
        method: "POST",
        headers: { "content-type": file.type || "application/octet-stream", "x-upsert": "false" },
        body: file
      });
      if (!uploadResponse.ok) throw new Error("Private storage rejected the upload. Retry with a supported file type.");

      setMessage("Verifying stored object and recording document metadata…");
      const completeResponse = await fetch("/api/candidate/documents/complete", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          uploadId: linkResult.uploadId,
          storagePath: linkResult.storagePath,
          documentTypeCode
        })
      });
      const completeResult = await completeResponse.json();
      if (!completeResponse.ok || !completeResult.ok) {
        throw new Error(completeResult.error || "The file uploaded but document completion needs attention.");
      }

      setFile(null);
      const input = document.getElementById("candidate-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage("Document uploaded and recorded. Its verification status remains pending until an authorised review.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section aria-label="Candidate document vault" style={{ display: "grid", gap: 22 }}>
      <section style={{ border: "1px solid #454545", borderRadius: 14, padding: 18 }}>
        <h2>Upload a document</h2>
        <p>Uploads are tied to the candidate mapped to your verified Supabase session. Uploading never verifies a document automatically.</p>
        <form onSubmit={uploadDocument} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
          <label>
            Document type
            <select value={documentTypeCode} onChange={(event) => setDocumentTypeCode(event.target.value)} style={{ display: "block", width: "100%", padding: 10, marginTop: 5 }}>
              {documentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            File (PDF, DOCX, or plain text where allowed; maximum 10 MiB)
            <input id="candidate-document-file" type="file" required onChange={(event) => setFile(event.target.files?.[0] || null)} style={{ display: "block", marginTop: 5 }} />
          </label>
          <button type="submit" disabled={uploading || loading} style={{ width: "fit-content", padding: "10px 16px", borderRadius: 8, fontWeight: 800 }}>
            {uploading ? "Working…" : "Upload private document"}
          </button>
        </form>
        {message && <p role="status" aria-live="polite">{message}</p>}
      </section>

      <section style={{ border: "1px solid #454545", borderRadius: 14, padding: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>My documents</h2>
          <button type="button" onClick={() => void refresh()} disabled={loading} style={{ padding: "8px 12px" }}>{loading ? "Loading…" : "Refresh status"}</button>
        </div>
        {documents.length === 0 && <p>{loading ? "Loading your private document records…" : "No document records were returned for this candidate."}</p>}
        {documents.length > 0 && <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead><tr>{["Document", "Type", "Size", "Document status", "Verification", "Uploaded", "Private file"].map((label) => <th key={label} scope="col" style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #555" }}>{label}</th>)}</tr></thead>
            <tbody>{documents.map((item) => <tr key={item.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #333" }}>{item.display_name}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #333" }}>{item.document_type}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #333" }}>{readableBytes(item.file_size_bytes)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #333" }}>{item.document_status}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #333" }}>{item.verification_status}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #333" }}>{new Date(item.uploaded_at).toLocaleString()}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #333" }}><button type="button" onClick={() => void openDocument(item.id)}>Open temporary link</button></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>

      <section style={{ border: "1px solid #454545", borderRadius: 14, padding: 18 }}>
        <h2>Requested documents</h2>
        {requests.length === 0 ? <p>No open or fulfilled document requests were returned.</p> : <ul>{requests.map((item) => (
          <li key={item.id} style={{ marginBottom: 10 }}>
            <strong>{item.document_type}</strong> — {item.request_status} ({item.priority})<br />
            <span>{item.reason}</span>
            {item.due_at && <span> · Due {new Date(item.due_at).toLocaleDateString()}</span>}
          </li>
        ))}</ul>}
      </section>
    </section>
  );
}
