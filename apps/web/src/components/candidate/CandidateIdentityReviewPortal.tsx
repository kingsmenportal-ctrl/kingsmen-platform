"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

type Session = { url: string; anonKey: string; token: string };
type Evidence = {
  id: string;
  request_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  review_status: string;
  reviewer_note?: string | null;
  uploaded_at?: string | null;
  reviewed_at?: string | null;
};
type ReviewRequest = {
  id: string;
  candidate_reference: string;
  request_status: string;
  claimant_message: string;
  candidate_response?: string | null;
  reviewer_note?: string | null;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string | null;
  evidence: Evidence[];
};
type StatusResponse = { requests?: ReviewRequest[]; error?: string };
type ProfileResponse = {
  candidateReference?: string | null;
  identityStatus?: string | null;
  profile?: { displayName?: string };
  error?: string;
  message?: string;
};
type ApiResponse = {
  request_id?: string;
  status?: string;
  message?: string;
  error?: string;
  evidence?: Evidence;
};

function sessionConfig(): Session {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Identity review is not configured for this deployment.");
  let storageKey = "sb-euhubhhnumtibbyufghm-auth-token";
  try {
    const ref = new URL(url).hostname.split(".")[0];
    if (ref) storageKey = `sb-${ref}-auth-token`;
  } catch {}
  let raw: string | null;
  try { raw = window.localStorage.getItem(storageKey); }
  catch { throw new Error("The browser session could not be read. Sign in again."); }
  if (!raw) throw new Error("Sign in before requesting identity review.");
  let value: { access_token?: string; expires_at?: number };
  try { value = JSON.parse(raw) as { access_token?: string; expires_at?: number }; }
  catch { throw new Error("The browser session is invalid. Sign in again."); }
  if (!value.access_token) throw new Error("Sign in before requesting identity review.");
  if (typeof value.expires_at === "number" && value.expires_at <= Math.floor(Date.now() / 1000)) {
    throw new Error("Your session has expired. Sign in again.");
  }
  return { url, anonKey, token: value.access_token };
}

async function readResponse<T>(response: Response): Promise<T> {
  let body: T & { error?: string; message?: string };
  try { body = await response.json() as T & { error?: string; message?: string }; }
  catch { throw new Error("The identity-review service returned an unreadable response."); }
  if (!response.ok) {
    throw new Error(body.error || body.message || `Identity-review request failed (HTTP ${response.status}).`);
  }
  return body;
}

async function loadProfileReference(session: Session): Promise<ProfileResponse> {
  const response = await fetch(`${session.url}/functions/v1/candidate-master-profile`, {
    method: "POST",
    headers: { apikey: session.anonKey, Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "load" }),
    cache: "no-store"
  });
  if (!response.ok) return {};
  return readResponse<ProfileResponse>(response);
}

async function loadReviewStatus(session: Session): Promise<ReviewRequest[]> {
  const response = await fetch(`${session.url}/functions/v1/candidate-identity-review-status`, {
    method: "GET",
    headers: { apikey: session.anonKey, Authorization: `Bearer ${session.token}` },
    cache: "no-store"
  });
  const body = await readResponse<StatusResponse>(response);
  return Array.isArray(body.requests) ? body.requests : [];
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}
function formatBytes(value: number): string {
  return value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / (1024 * 1024)).toFixed(2)} MB`;
}
function statusLabel(status: string): string {
  return status.replaceAll("_", " ").toLowerCase();
}

export default function CandidateIdentityReviewPortal() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [candidateReference, setCandidateReference] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimantMessage, setClaimantMessage] = useState("");
  const [candidateResponse, setCandidateResponse] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [identityStatus, setIdentityStatus] = useState("");
  const [profileReferenceFound, setProfileReferenceFound] = useState(false);
  const [signedIn, setSignedIn] = useState(true);

  const activeRequest = useMemo(
    () => requests.find((item) => ["PENDING", "NEEDS_INFORMATION"].includes(item.request_status)) ?? null,
    [requests]
  );

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const session = sessionConfig();
      const [statusItems, profile] = await Promise.all([
        loadReviewStatus(session),
        loadProfileReference(session).catch(() => ({} as ProfileResponse))
      ]);
      setRequests(statusItems);
      setIdentityStatus(profile.identityStatus ?? "");
      if (profile.candidateReference) {
        setCandidateReference((current) => current || profile.candidateReference || "");
        setProfileReferenceFound(true);
      }
      if (profile.profile?.displayName) {
        setClaimantName((current) => current || profile.profile?.displayName || "");
      }
      setSignedIn(true);
    } catch (caught) {
      setRequests([]);
      const message = caught instanceof Error ? caught.message : "Identity-review status could not be loaded.";
      const authenticationFailure = /sign in|session is invalid|session has expired|browser session/i.test(message);
      setSignedIn(!authenticationFailure);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (candidateReference.trim().length < 2 || candidateReference.trim().length > 120) {
      setError("Enter the existing Kingsmen candidate reference. Do not enter an email address or create a new reference.");
      return;
    }
    if (claimantName.trim().length < 2 || claimantName.trim().length > 160) {
      setError("Enter your name (2–160 characters).");
      return;
    }
    if (claimantMessage.trim().length < 3 || claimantMessage.trim().length > 1200) {
      setError("Enter a short explanation (3–1,200 characters).");
      return;
    }
    setSaving(true);
    try {
      const session = sessionConfig();
      const response = await fetch(`${session.url}/functions/v1/candidate-identity-review-request`, {
        method: "POST",
        headers: { apikey: session.anonKey, Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_reference: candidateReference.trim(),
          claimant_name: claimantName.trim(),
          claimant_message: claimantMessage.trim()
        }),
        cache: "no-store"
      });
      const result = await readResponse<ApiResponse>(response);
      setNotice(result.message || "Your request was submitted for manual review. Identity has not been verified.");
      setClaimantMessage("");
      await load(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The identity-review request was not submitted.");
    } finally {
      setSaving(false);
    }
  }

  function chooseEvidence(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setNotice("");
    const file = event.currentTarget.files?.[0] ?? null;
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
      setError("Choose a PDF, JPEG or PNG evidence file.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size < 1 || file.size > MAX_EVIDENCE_BYTES) {
      setError("Identity evidence files must be no larger than 8 MiB.");
      event.currentTarget.value = "";
      return;
    }
    setSelectedFile(file);
    setSelectedRequestId(activeRequest?.id ?? "");
  }

  async function uploadEvidence() {
    setError("");
    setNotice("");
    const requestId = selectedRequestId || activeRequest?.id || "";
    if (!requestId || !selectedFile) {
      setError("Choose an open identity-review request and a supported evidence file.");
      return;
    }
    if (selectedFile.size > MAX_EVIDENCE_BYTES || !ALLOWED_EVIDENCE_TYPES.has(selectedFile.type)) {
      setError("The selected evidence file is no longer within the allowed file rules.");
      return;
    }
    setUploading(true);
    try {
      const session = sessionConfig();
      const form = new FormData();
      form.set("request_id", requestId);
      form.set("file", selectedFile, selectedFile.name);
      const response = await fetch(`${session.url}/functions/v1/candidate-identity-review-evidence-upload`, {
        method: "POST",
        headers: { apikey: session.anonKey, Authorization: `Bearer ${session.token}` },
        body: form,
        cache: "no-store"
      });
      const result = await readResponse<ApiResponse>(response);
      setNotice(result.message || "Evidence was uploaded privately and awaits reviewer inspection. It is not verified.");
      setSelectedFile(null);
      await load(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Evidence was not uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function submitFollowup(requestId: string) {
    setError("");
    setNotice("");
    if (candidateResponse.trim().length < 3 || candidateResponse.trim().length > 1200) {
      setError("Your response must be between 3 and 1,200 characters.");
      return;
    }
    setReplying(true);
    try {
      const session = sessionConfig();
      const response = await fetch(`${session.url}/functions/v1/candidate-identity-review-followup`, {
        method: "POST",
        headers: { apikey: session.anonKey, Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, response: candidateResponse.trim() }),
        cache: "no-store"
      });
      const result = await readResponse<ApiResponse>(response);
      setNotice(result.message || "Your response was returned to the reviewer queue.");
      setCandidateResponse("");
      await load(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your response could not be saved.");
    } finally {
      setReplying(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/candidate/dashboard" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">IDENTITY REVIEW</span></span>
          </Link>
          <nav aria-label="Candidate navigation" className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            <Link className="hover:text-amber-200" href="/candidate/profile">Profile</Link>
            <Link className="hover:text-amber-200" href="/candidate/documents">Documents</Link>
            <Link className="hover:text-amber-200" href="/candidate/workbench">Workbench</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:py-10">
        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Human-governed identity review</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Confirm your candidate identity.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Use this secure route to ask Kingsmen to review an existing candidate record. Your sign-in account is not automatically linked to a candidate by matching email addresses. A reviewer checks your request and evidence before any identity link is changed.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">Private evidence · PDF/JPEG/PNG</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">8 MiB maximum per file</span>
            <span className="rounded-full border border-slate-700 px-3 py-2 text-slate-200">Manual reviewer decision</span>
          </div>
        </section>

        {loading ? <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">Loading your identity-review status…</section> : null}
        {!loading && !signedIn ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5" role="alert"><p className="text-sm leading-6 text-slate-800">{error || "Sign in to request identity review."}</p><Link href="/candidate/login" className="mt-3 inline-flex font-bold underline">Sign in to continue</Link></section> : null}

        {signedIn && !activeRequest ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-bold">Request identity review</h2><p className="mt-1 text-sm leading-6 text-slate-600">Enter your existing Kingsmen candidate reference so the reviewer can locate the correct record.</p></div>
              {identityStatus ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{statusLabel(identityStatus)}</span> : null}
            </div>
            {!profileReferenceFound ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">No candidate reference was returned by your profile service. Complete your reusable profile first, or enter the existing reference supplied by Kingsmen. This form does not create a new candidate reference or link by email.<Link href="/candidate/profile" className="ml-1 font-bold underline">Open profile</Link></div> : null}
            <form className="mt-5 grid gap-4" onSubmit={submitRequest}>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Existing Kingsmen candidate reference
                <input value={candidateReference} onChange={(event) => setCandidateReference(event.target.value)} required minLength={2} maxLength={120} autoComplete="off" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" placeholder="Enter the candidate reference supplied by Kingsmen" />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Your name
                <input value={claimantName} onChange={(event) => setClaimantName(event.target.value)} required minLength={2} maxLength={160} autoComplete="name" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" placeholder="Name used for your candidate record" />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Reason for review
                <textarea value={claimantMessage} onChange={(event) => setClaimantMessage(event.target.value)} required minLength={3} maxLength={1200} rows={4} className="rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" placeholder="Explain which candidate record should be reviewed and how you can identify it." />
              </label>
              <p className="text-xs leading-5 text-slate-500">Only submit information needed to identify the correct record. Do not put passwords, payment-card data, or unnecessary sensitive details in this message.</p>
              <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{saving ? "Submitting review request…" : "Submit identity-review request"}</button>
            </form>
          </section>
        ) : null}

        {activeRequest ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-bold">Your open review request</h2><p className="mt-1 text-sm text-slate-600">Reference: {activeRequest.candidate_reference} · Submitted {formatDate(activeRequest.created_at)}</p></div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">{statusLabel(activeRequest.request_status)}</span>
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{activeRequest.claimant_message}</p>
            {activeRequest.reviewer_note ? <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-800"><strong>Reviewer message:</strong> {activeRequest.reviewer_note}</p> : null}
            <div className="mt-5">
              <h3 className="font-bold">Private supporting evidence</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Upload only evidence requested for this review. Files are validated and stored privately. Upload does not mean the evidence or your identity has been accepted.</p>
              <label className="mt-3 grid gap-1.5 text-sm font-semibold text-slate-800">Select evidence (PDF, JPEG or PNG · up to 8 MiB)
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={chooseEvidence} className="block w-full rounded-lg border border-slate-300 p-3 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:font-semibold file:text-white" />
              </label>
              {selectedFile ? <p className="mt-2 text-xs text-slate-600">Selected: {selectedFile.name} · {formatBytes(selectedFile.size)}</p> : null}
              <button type="button" onClick={() => void uploadEvidence()} disabled={!selectedFile || uploading} className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">{uploading ? "Uploading privately…" : "Upload evidence securely"}</button>
              {activeRequest.evidence.length ? <ul className="mt-4 space-y-2">{activeRequest.evidence.map((item) => <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="break-all font-semibold">{item.original_filename}</span><span className="text-xs font-semibold text-slate-600">{statusLabel(item.review_status)}</span></div><p className="mt-1 text-xs text-slate-500">{formatBytes(item.size_bytes)} · uploaded {formatDate(item.uploaded_at)}{item.reviewed_at ? ` · reviewed ${formatDate(item.reviewed_at)}` : ""}</p>{item.reviewer_note ? <p className="mt-2 text-xs leading-5 text-slate-600">Reviewer message: {item.reviewer_note}</p> : null}</li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No evidence has been recorded for this request yet.</p>}
            </div>
            {activeRequest.request_status === "NEEDS_INFORMATION" ? <div className="mt-5 border-t border-slate-200 pt-5"><h3 className="font-bold">Reply to the reviewer</h3><p className="mt-1 text-sm text-slate-600">{activeRequest.candidate_response || activeRequest.reviewer_note || "The reviewer has requested more information."}</p><textarea value={candidateResponse} onChange={(event) => setCandidateResponse(event.target.value)} rows={3} maxLength={1200} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" placeholder="Enter your response (3–1,200 characters)" /><button type="button" onClick={() => void submitFollowup(activeRequest.id)} disabled={replying} className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50">{replying ? "Sending response…" : "Send response to reviewer"}</button></div> : null}
          </section>
        ) : null}

        {requests.filter((item) => item.id !== activeRequest?.id).map((item) => (
          <section key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">Previous identity-review request</h2><span className="text-xs font-semibold text-slate-600">{statusLabel(item.request_status)}</span></div>
            <p className="mt-2 text-sm text-slate-600">Reference: {item.candidate_reference} · Submitted {formatDate(item.created_at)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.claimant_message}</p>
            {item.reviewer_note ? <p className="mt-2 text-sm leading-6 text-slate-600">Reviewer message: {item.reviewer_note}</p> : null}
            {item.evidence.length ? <ul className="mt-3 space-y-1 text-xs text-slate-600">{item.evidence.map((entry) => <li key={entry.id}>{entry.original_filename} · {statusLabel(entry.review_status)}</li>)}</ul> : null}
          </section>
        ))}

        {error && signedIn ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert">{error}</p> : null}
        {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" role="status">{notice}</p> : null}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-slate-950">What this process does not do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
            <li>Submitting a request does not verify identity or create an identity link.</li>
            <li>Uploading evidence does not mean a reviewer has accepted it.</li>
            <li>Only an authorised reviewer can inspect the private evidence and record an identity decision.</li>
            <li>Do not upload evidence for another person or share a temporary private link.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void load(true)} disabled={loading} className="inline-flex min-h-10 items-center rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-amber-100 disabled:opacity-50">Refresh review status</button>
            <Link href="/candidate/documents" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Return to Document Vault</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
