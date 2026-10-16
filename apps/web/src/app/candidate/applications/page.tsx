"use client";

import { useCallback, useEffect, useState } from "react";

type ApplicationState = "loading" | "signed_out" | "unavailable" | "unlinked" | "error";
type ApplicationResponse = {
  ok?: boolean;
  status?: string;
  code?: string;
  applications?: unknown[];
};

export default function CandidateApplicationsPage() {
  const [state, setState] = useState<ApplicationState>("loading");
  const [retryKey, setRetryKey] = useState(0);

  const checkApplications = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/candidate/applications", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const body = (await response.json().catch(() => ({}))) as ApplicationResponse;

      if (response.status === 401 && body.status === "SIGNED_OUT") {
        setState("signed_out");
      } else if (response.status === 503 && body.code === "CANDIDATE_PROFILE_LINK_REQUIRED") {
        setState("unlinked");
      } else if (response.status === 503) {
        setState("unavailable");
      } else if (response.ok && Array.isArray(body.applications)) {
        // An empty list is shown only when returned by the authenticated API.
        setState("error");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void checkApplications(); }, [checkApplications, retryKey]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <a href="/candidate/dashboard" style={{ color: "#f1d48b" }}>← Candidate dashboard</a>
      <p style={{ color: "#d8b66a", letterSpacing: ".14em", fontWeight: 800 }}>CANDIDATE WORKSPACE</p>
      <h1>Applications and outcomes</h1>
      <p>This area is reserved for application records linked to your verified candidate profile. It will not invent applications, deadlines, submissions, or outcomes from local planning data.</p>

      <section aria-live="polite" aria-busy={state === "loading"} style={{ marginTop: 24, border: "1px solid #45424a", borderRadius: 14, padding: 20 }}>
        {state === "loading" && <><h2>Checking application access…</h2><p>Verifying whether an authenticated candidate-scoped application service is available.</p></>}
        {state === "signed_out" && <><h2>Sign-in required</h2><p>You are not signed in. No application status can be shown.</p><a href="/candidate/login" style={{ color: "#f1d48b" }}>Go to candidate sign in →</a></>}
        {state === "unlinked" && <><h2>Candidate profile link required</h2><p>Your application history cannot be shown until the verified account is safely linked to a candidate record. An email match or a browser draft is not sufficient proof of ownership.</p></>}
        {state === "unavailable" && <><h2>Application records unavailable</h2><p>The secure application service is not configured or is not ready. No application status has been inferred.</p><button type="button" onClick={() => setRetryKey(x => x + 1)} style={buttonStyle}>Retry</button></>}
        {state === "error" && <><h2>Could not verify application records</h2><p>No list, submission status, or outcome is displayed because the response could not be verified as an authoritative candidate-scoped result.</p><button type="button" onClick={() => setRetryKey(x => x + 1)} style={buttonStyle}>Retry</button></>}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Prepare while access is being connected</h2>
        <p>You can continue organising your plans, but planning notes are not applications and do not reserve a place or submit anything to an external organisation.</p>
        <nav aria-label="Application preparation links" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="/candidate/onboarding" style={{ color: "#f1d48b" }}>Onboarding draft</a>
          <a href="/free-destiny-map" style={{ color: "#f1d48b" }}>Free Destiny Map</a>
          <a href="/candidate/documents" style={{ color: "#f1d48b" }}>Document information</a>
        </nav>
      </section>
      <p style={{ borderTop: "1px solid #45424a", marginTop: 28, paddingTop: 16, fontSize: 13, opacity: .8 }}>Application history, submission receipts, deadlines, decisions, and offers require a trusted backend record. This page does not create or change them.</p>
    </main>
  );
}

const buttonStyle = { padding: "10px 14px", borderRadius: 8, border: "1px solid #d8b66a", background: "#171b26", color: "#f7f4ec", fontWeight: 700, cursor: "pointer" };
