"use client";

import { useCallback, useEffect, useState } from "react";

type Application = {
  applicationId: string;
  candidateId: string;
  routeType: string;
  sourceConfidenceBand: string;
  currentState: string;
  portalHealth: string;
  mapFallbackRequired: boolean;
  lastEvidenceRef?: string;
  lastUpdatedAt: string;
};
type ApplicationState =
  | { kind: "loading" }
  | { kind: "signed_out" }
  | { kind: "unavailable" }
  | { kind: "unlinked" }
  | { kind: "error" }
  | { kind: "ready"; applications: Application[] };
type ApplicationResponse = {
  ok?: boolean;
  status?: string;
  code?: string;
  applications?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseApplication(value: unknown): Application | null {
  if (!isRecord(value)) return null;
  const stringFields = ["applicationId", "candidateId", "routeType", "sourceConfidenceBand", "currentState", "portalHealth", "lastUpdatedAt"] as const;
  if (!stringFields.every((key) => typeof value[key] === "string")) return null;
  if (typeof value.mapFallbackRequired !== "boolean") return null;
  if (value.lastEvidenceRef !== undefined && typeof value.lastEvidenceRef !== "string") return null;
  return {
    applicationId: value.applicationId as string,
    candidateId: value.candidateId as string,
    routeType: value.routeType as string,
    sourceConfidenceBand: value.sourceConfidenceBand as string,
    currentState: value.currentState as string,
    portalHealth: value.portalHealth as string,
    mapFallbackRequired: value.mapFallbackRequired,
    lastEvidenceRef: value.lastEvidenceRef as string | undefined,
    lastUpdatedAt: value.lastUpdatedAt as string
  };
}
function readable(value: string): string {
  return value.replace(/[_-]+/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function displayDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date not available" : parsed.toLocaleString();
}

export default function CandidateApplicationsPage() {
  const [state, setState] = useState<ApplicationState>({ kind: "loading" });
  const [retryKey, setRetryKey] = useState(0);

  const checkApplications = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/candidate/applications", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      const body = (await response.json().catch(() => ({}))) as ApplicationResponse;
      if (response.status === 401 && body.status === "SIGNED_OUT") {
        setState({ kind: "signed_out" });
      } else if (response.status === 503 && body.code === "CANDIDATE_PROFILE_LINK_REQUIRED") {
        setState({ kind: "unlinked" });
      } else if (response.status === 503) {
        setState({ kind: "unavailable" });
      } else if (response.ok && body.ok === true && Array.isArray(body.applications)) {
        const parsed = body.applications.map(parseApplication);
        // A malformed row invalidates the response rather than silently hiding data.
        if (parsed.some((application) => application === null)) {
          setState({ kind: "error" });
        } else {
          setState({ kind: "ready", applications: parsed as Application[] });
        }
      } else {
        setState({ kind: "error" });
      }
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => { void checkApplications(); }, [checkApplications, retryKey]);
  const retry = () => setRetryKey((key) => key + 1);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
      <a href="/candidate/dashboard" style={{ color: "#f1d48b" }}>← Candidate dashboard</a>
      <p style={{ color: "#d8b66a", letterSpacing: ".14em", fontWeight: 800 }}>CANDIDATE WORKSPACE</p>
      <h1>Applications and outcomes</h1>
      <p>Only records returned by the authenticated candidate-scoped service appear here. Planning notes are not applications, and this page cannot submit applications or change official outcomes.</p>

      <section aria-live="polite" aria-busy={state.kind === "loading"} style={{ marginTop: 24, border: "1px solid #45424a", borderRadius: 14, padding: 20 }}>
        {state.kind === "loading" && <><h2>Checking application access…</h2><p>Verifying the authenticated application service.</p></>}
        {state.kind === "signed_out" && <><h2>Sign-in required</h2><p>You are not signed in. No application status can be shown.</p><a href="/candidate/login" style={{ color: "#f1d48b" }}>Go to candidate sign in →</a></>}
        {state.kind === "unlinked" && <><h2>Candidate profile link required</h2><p>Your application history cannot be shown until the verified account is safely linked to a candidate record. An email match or browser draft is not proof of ownership.</p></>}
        {state.kind === "unavailable" && <><h2>Application records unavailable</h2><p>The secure application service is not configured or is not ready. No status has been inferred.</p><button type="button" onClick={retry} style={buttonStyle}>Retry</button></>}
        {state.kind === "error" && <><h2>Could not verify application records</h2><p>The response could not be verified as an authoritative candidate-scoped result. No application status is displayed.</p><button type="button" onClick={retry} style={buttonStyle}>Retry</button></>}
        {state.kind === "ready" && state.applications.length === 0 && <><h2>No linked application records</h2><p>The authenticated service returned no application records for this verified profile. This does not mean an external institution has no record; contact the relevant institution if you expected an application to appear.</p><button type="button" onClick={retry} style={buttonStyle}>Refresh</button></>}
        {state.kind === "ready" && state.applications.length > 0 && <div style={{ display: "grid", gap: 14 }}>
          <h2>{state.applications.length} application record{state.applications.length === 1 ? "" : "s"}</h2>
          {state.applications.map((application) => (
            <article key={application.applicationId} style={panel}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>{readable(application.routeType || "Application route")}</h3>
                <span style={badge}>{readable(application.currentState)}</span>
              </div>
              <dl style={details}>
                <dt>Application reference</dt><dd>{application.applicationId}</dd>
                <dt>Portal health</dt><dd>{readable(application.portalHealth)}</dd>
                <dt>Source confidence</dt><dd>{readable(application.sourceConfidenceBand)}</dd>
                <dt>Last updated</dt><dd>{displayDate(application.lastUpdatedAt)}</dd>
                <dt>MAP fallback</dt><dd>{application.mapFallbackRequired ? "Manual fallback required" : "No fallback flag recorded"}</dd>
              </dl>
              {application.lastEvidenceRef && <p style={{ overflowWrap: "anywhere", fontSize: 13, opacity: .8 }}>Evidence reference: {application.lastEvidenceRef}</p>}
              <p style={{ marginBottom: 0, fontSize: 13, opacity: .8 }}>This is the current internal tracker state, not proof of external submission, admission, employment, payment, or an official decision.</p>
            </article>
          ))}
          <button type="button" onClick={retry} style={buttonStyle}>Refresh applications</button>
        </div>}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Continue preparing</h2>
        <p>You can organise your plans while application access is being connected. These links do not submit applications to external organisations.</p>
        <nav aria-label="Application preparation links" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="/candidate/onboarding" style={{ color: "#f1d48b" }}>Onboarding draft</a>
          <a href="/free-destiny-map" style={{ color: "#f1d48b" }}>Free Destiny Map</a>
          <a href="/candidate/documents" style={{ color: "#f1d48b" }}>Document information</a>
        </nav>
      </section>
      <p style={{ borderTop: "1px solid #45424a", marginTop: 28, paddingTop: 16, fontSize: 13, opacity: .8 }}>Official deadlines, submissions, decisions, and offers must be confirmed through authoritative records. This page only displays the fields supplied by the authenticated API.</p>
    </main>
  );
}

const panel = { border: "1px solid #45424a", borderRadius: 12, padding: 18 };
const badge = { border: "1px solid #d8b66a", borderRadius: 999, padding: "4px 10px", color: "#f1d48b", fontSize: 12, height: "fit-content" };
const details = { display: "grid", gridTemplateColumns: "minmax(130px, 180px) minmax(0, 1fr)", gap: "8px 14px", overflowWrap: "anywhere" } as const;
const buttonStyle = { padding: "10px 14px", borderRadius: 8, border: "1px solid #d8b66a", background: "#171b26", color: "#f7f4ec", fontWeight: 700, cursor: "pointer" };
