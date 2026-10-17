"use client";

import { useEffect, useState } from "react";

const gates = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA / Learnership"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"],
] as const;

type OnboardingDraft = { fullName: string; preferredName: string; province: string; goals: string[]; completed: string[] };
type SessionStatus = "loading" | "authenticated_linked" | "authenticated_unlinked" | "signed_out" | "unavailable" | "error";
const STORAGE_KEY = "kingsmen.candidate.onboarding.v1";

function readDraft(): OnboardingDraft | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.goals) || !Array.isArray(parsed.completed)) return null;
    return parsed as OnboardingDraft;
  } catch { return null; }
}

export default function CandidateDashboardPage() {
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [session, setSession] = useState<SessionStatus>("loading");

  useEffect(() => {
    setDraft(readDraft());
    let active = true;
    fetch("/api/candidate/session", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!active) return;
        if (response.status === 401 && body?.status === "SIGNED_OUT") setSession("signed_out");
        else if (response.ok && body?.authenticated === true && body?.candidateRecordLinked === true) setSession("authenticated_linked");
        else if (response.ok && body?.authenticated === true && body?.candidateRecordLinked === false) setSession("authenticated_unlinked");
        else if (response.status === 503) setSession("unavailable");
        else setSession("error");
      })
      .catch(() => { if (active) setSession("error"); });
    return () => { active = false; };
  }, []);

  const done = Math.min(draft?.completed.length ?? 0, 4);

  return <main style={{ maxWidth: 980, margin: "0 auto", padding: 24, color: "#f7f4ec", background: "#080b14", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif" }}>
    <header>
      <p style={{ color: "#d8b66a", letterSpacing: ".16em", fontWeight: 800 }}>KINGSMEN CANDIDATE SPACE</p>
      <h1>Candidate Dashboard</h1>
      <p>Your workspace for planning next steps. Local drafts and verified sign-in are shown separately; neither is treated as an authoritative candidate record.</p>
    </header>
    <section aria-labelledby="account-heading" aria-live="polite" style={{ border: "1px solid #45424a", borderRadius: 14, padding: 20, margin: "24px 0" }}>
      <h2 id="account-heading">Account connection</h2>
      {session === "loading" && <p>Checking secure sign-in status…</p>}
      {session === "authenticated_linked" && <><p><strong>Signed in — verified candidate profile link found.</strong></p><p>The server confirmed an active candidate identity link. This confirms linkage only; profile readiness, documents, and application records are checked separately by their own services.</p></>}
      {session === "authenticated_unlinked" && <><p><strong>Signed in — candidate profile not linked.</strong></p><p>Your account session was verified by the server, but this dashboard cannot yet confirm a matching candidate record or application history.</p></>}
      {session === "signed_out" && <><p><strong>You are not signed in.</strong></p><p>Sign in to access account features. Local draft information below is not an account record.</p><a href="/auth/login" style={{ color: "#f1d48b" }}>Go to candidate sign in →</a></>}
      {session === "unavailable" && <p><strong>Secure sign-in status is unavailable.</strong> The identity provider is not configured or could not verify the session. Try again later.</p>}
      {session === "error" && <><p><strong>Could not check sign-in status.</strong> No account or application status is inferred.</p><button type="button" onClick={() => window.location.reload()}>Retry</button></>}
      <p style={{ fontSize: 13, opacity: .8 }}>This check confirms session status only. It does not authorize document access, prove candidate-profile linkage, or confirm application progress.</p>
    </section>
    <section aria-labelledby="progress-heading" style={{ border: "1px solid #45424a", borderRadius: 14, padding: 20, margin: "24px 0" }}>
      <h2 id="progress-heading">Your onboarding progress (local draft)</h2>
      {draft ? <><p><strong>{done} of 4 steps marked complete in this browser</strong></p><progress value={done} max={4} aria-label="Local draft onboarding completion" style={{ width: "100%" }} /><p>{draft.fullName ? `Draft profile: ${draft.fullName}` : "Profile details still need to be added."}</p><a href="/candidate/onboarding" style={{ color: "#f1d48b" }}>Resume onboarding →</a></> : <><p>Not started — no local onboarding draft was found in this browser.</p><a href="/candidate/onboarding" style={{ color: "#f1d48b" }}>Start onboarding →</a></>}
      <p style={{ fontSize: 13, opacity: .8 }}>Local-only save: drafts remain in this browser on this device. Clearing site data or switching devices may remove them. Do not enter identity numbers, banking details, or other sensitive documents here.</p>
    </section>
    <section aria-labelledby="gates-heading">
      <h2 id="gates-heading">Your pathway areas</h2>
      <p>These are planning categories, not eligibility decisions or official application results.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {gates.map(([code, label]) => <article key={code} data-gate={code} style={{ border: "1px solid #45424a", borderRadius: 12, padding: 16 }}>
          <h3>{label}</h3><p>Status: <strong>Not assessed</strong></p><p style={{ fontSize: 13 }}>No authoritative status record is connected to this view.</p>
        </article>)}
      </div>
    </section>
    <nav aria-label="Candidate tools" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 24 }}>
      <a href="/candidate/applications" style={{ color: "#f1d48b" }}>Applications & outcomes</a><a href="/candidate/saved-opportunities" style={{ color: "#f1d48b" }}>Saved opportunities</a><a href="/candidate/profile" style={{ color: "#f1d48b" }}>Candidate profile</a><a href="/candidate/documents" style={{ color: "#f1d48b" }}>Documents information</a><a href="/free-destiny-map" style={{ color: "#f1d48b" }}>Free Destiny Map</a>
    </nav>
    <p data-boundary="browser-safe" style={{ borderTop: "1px solid #45424a", marginTop: 28, paddingTop: 16, fontSize: 13 }}>No service-role authority, payment confirmation, submitted application, verified outcome, or external decision is represented here. Demo/local draft data is not an authoritative candidate record.</p>
  </main>;
}
