"use client";

import { FormEvent, useMemo, useState } from "react";

type SubmissionResult = {
  request_id?: string;
  status?: string;
  message?: string;
  error?: string;
};

const PROJECT_REF = "euhubhhnumtibbyufghm";

function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  // Supabase Auth's default browser storage key. Never send a token to our own
  // server or log it; it is used only as the bearer for the Supabase function.
  const keys = [
    `sb-${PROJECT_REF}-auth-token`,
    ...Object.keys(window.localStorage).filter(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    )
  ];
  for (const key of [...new Set(keys)]) {
    try {
      const stored = window.localStorage.getItem(key);
      if (!stored) continue;
      const parsed = JSON.parse(stored) as {
        access_token?: unknown;
        currentSession?: { access_token?: unknown };
        session?: { access_token?: unknown };
      };
      const token =
        parsed.access_token ??
        parsed.currentSession?.access_token ??
        parsed.session?.access_token;
      if (typeof token === "string" && token.length > 20) return token;
    } catch {
      // Ignore unrelated or invalid local-storage entries.
    }
  }
  return null;
}

export default function CandidateIdentityReviewPage() {
  const endpoint = useMemo(
    () => `https://${PROJECT_REF}.supabase.co/functions/v1/candidate-identity-review-request`,
    []
  );
  const [candidateReference, setCandidateReference] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimantMessage, setClaimantMessage] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const accessToken = readAccessToken();
    if (!accessToken) {
      setResult({
        error:
          "No active Kingsmen staging sign-in was found in this browser. Sign in first, then return to this page."
      });
      return;
    }

    const message = [
      claimantMessage.trim(),
      evidenceSummary.trim()
        ? `Supporting evidence described by candidate (not independently verified):\n${evidenceSummary.trim()}`
        : "Supporting evidence description: not supplied in this submission."
    ].join("\n\n");
    if (message.length > 1200) {
      setResult({ error: "Your explanation and evidence description together must be 1,200 characters or fewer. Shorten the text and try again." });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          candidate_reference: candidateReference.trim(),
          claimant_name: claimantName.trim(),
          claimant_message: message
        })
      });
      const body = (await response.json().catch(() => ({}))) as SubmissionResult;
      if (!response.ok) {
        setResult({
          error:
            body.error ??
            `Kingsmen could not save this request (HTTP ${response.status}). No submission is confirmed.`
        });
      } else {
        setResult(body);
        setCandidateReference("");
        setClaimantName("");
        setClaimantMessage("");
        setEvidenceSummary("");
      }
    } catch {
      setResult({
        error:
          "Kingsmen could not be reached. The request may not have been saved; check your review queue before retrying."
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Kingsmen · Candidate account support
          </p>
          <h1 className="mt-3 text-3xl font-bold">Request an identity review</h1>
          <p className="mt-3 leading-7 text-slate-300">
            Use this form if your signed-in account needs to be linked to an existing
            Kingsmen candidate record. A reviewer will inspect the claim before making
            any decision. Submitting this form does not verify your identity or change
            your candidate record.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="mt-6 space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label htmlFor="candidate-reference" className="mb-2 block font-semibold">
              Exact existing Kingsmen candidate reference
            </label>
            <input
              id="candidate-reference"
              name="candidate_reference"
              required
              minLength={2}
              maxLength={120}
              autoComplete="off"
              value={candidateReference}
              onChange={(event) => setCandidateReference(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              placeholder="Enter the reference exactly as issued"
            />
            <p className="mt-2 text-sm text-slate-400">
              Do not enter another person's password, access token, or other secret.
            </p>
          </div>

          <div>
            <label htmlFor="claimant-name" className="mb-2 block font-semibold">
              Your full name
            </label>
            <input
              id="claimant-name"
              name="claimant_name"
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              value={claimantName}
              onChange={(event) => setClaimantName(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label htmlFor="claimant-message" className="mb-2 block font-semibold">
              Explain the identity-linking problem
            </label>
            <textarea
              id="claimant-message"
              name="claimant_message"
              required
              minLength={3}
              maxLength={1000}
              rows={5}
              value={claimantMessage}
              onChange={(event) => setClaimantMessage(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              placeholder="Explain why this account should be linked to that candidate record."
            />
          </div>

          <div>
            <label htmlFor="evidence-summary" className="mb-2 block font-semibold">
              Supporting evidence description (recommended)
            </label>
            <textarea
              id="evidence-summary"
              name="evidence_summary"
              maxLength={1000}
              rows={4}
              value={evidenceSummary}
              onChange={(event) => setEvidenceSummary(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              placeholder="Describe relevant evidence and where a reviewer can find it. Do not paste passwords, OTPs, or access tokens."
            />
            <p className="mt-2 text-sm text-amber-200">
              This field records your description only; it does not upload or verify a
              document. Do not include sensitive document numbers unless the reviewer
              specifically requests them through an approved secure channel.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Submitting securely…" : "Submit for manual review"}
          </button>
        </form>

        {result ? (
          <section
            aria-live="polite"
            className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6"
          >
            {result.request_id ? (
              <>
                <h2 className="text-xl font-bold text-emerald-300">
                  Request received
                </h2>
                <p className="mt-3 text-slate-200">
                  Request ID: <code className="break-all">{result.request_id}</code>
                </p>
                <p className="mt-2 text-slate-300">
                  Persisted status returned by Kingsmen:{" "}
                  <strong>{result.status ?? "Pending status confirmation"}</strong>
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  {result.message ??
                    "Your request was sent for manual review. Identity is not yet verified."}
                </p>
                <p className="mt-3 text-sm text-amber-200">
                  Keep the request ID. Do not assume your candidate records are linked
                  until a reviewer completes an audited decision.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-amber-200">
                  Submission not confirmed
                </h2>
                <p className="mt-3 text-slate-200">{result.error}</p>
              </>
            )}
          </section>
        ) : null}

        <p className="mt-6 text-sm leading-6 text-slate-500">
          Privacy: the submission is associated with your verified sign-in session.
          Access to the review request and any identity-link change remains controlled
          by backend authorization and manual review.
        </p>
      </div>
    </main>
  );
}
