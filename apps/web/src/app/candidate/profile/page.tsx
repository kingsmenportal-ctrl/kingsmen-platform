"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const PATHWAYS = [
  ["higher_education", "Higher education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
] as const;

type Profile = {
  displayName: string;
  phone: string;
  province: string;
  highestQualification: string;
  studyInterests: string;
  employmentInterests: string;
  preferredLocation: string;
};
type Consent = { status: "ACTIVE" | "REVOKED" | "NOT_RECORDED"; version?: string | null; grantedAt?: string | null; text?: string };
type Correction = { id: string; field_name: string; requested_value: string; status: string; reason: string };
type ProfileResponse = {
  ok: boolean;
  profile?: Partial<Profile>;
  pathwayPreferences?: string[];
  consent?: Consent;
  completeness?: { completed: number; required: number; percent: number; missing: string[] };
  correctionRequests?: Correction[];
  correctionRequest?: Correction;
  candidateReference?: string | null;
  identityStatus?: string;
  savedAt?: string | null;
  persistence?: string;
  message?: string;
  code?: string;
  error?: string;
};

const EMPTY: Profile = {
  displayName: "", phone: "", province: "", highestQualification: "",
  studyInterests: "", employmentInterests: "", preferredLocation: ""
};
const FIELD_LABELS: Record<string, string> = {
  displayName: "Name", phone: "Phone", province: "Province",
  highestQualification: "Highest qualification", studyInterests: "Study interests",
  employmentInterests: "Employment interests", preferredLocation: "Preferred location"
};

function tokenFromSession(): string | null {
  if (typeof window === "undefined") return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  try {
    const projectRef = new URL(base).hostname.split(".")[0];
    const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
    const session = raw ? JSON.parse(raw) as Record<string, unknown> : null;
    return session && typeof session.access_token === "string" ? session.access_token : null;
  } catch { return null; }
}
function explain(body: ProfileResponse): string {
  return body.error ? `${body.code ? body.code + ": " : ""}${body.error}` : "The profile request could not be completed.";
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [pathways, setPathways] = useState<string[]>([]);
  const [consent, setConsent] = useState<Consent>({ status: "NOT_RECORDED" });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [candidateReference, setCandidateReference] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState("UNKNOWN");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [correctionField, setCorrectionField] = useState<keyof Profile>("displayName");
  const [correctionValue, setCorrectionValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionBusy, setCorrectionBusy] = useState(false);

  const request = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const token = tokenFromSession();
    if (!token) throw new Error("Sign in to load or save your profile. Your saved backend information has not been deleted.");
    const response = await fetch("/api/candidate/profile", {
      method: action === "load" ? "GET" : "POST",
      headers: { Authorization: `Bearer ${token}`, ...(action === "load" ? {} : { "Content-Type": "application/json" }) },
      ...(action === "load" ? {} : { body: JSON.stringify({ action, ...extra }) }),
      cache: "no-store"
    });
    const body = await response.json() as ProfileResponse;
    if (!response.ok || body.ok !== true) throw new Error(explain(body));
    return body;
  }, []);

  const applyServerState = useCallback((body: ProfileResponse) => {
    setProfile({ ...EMPTY, ...(body.profile ?? {}) });
    setPathways(Array.isArray(body.pathwayPreferences) ? body.pathwayPreferences : []);
    const nextConsent = body.consent ?? { status: "NOT_RECORDED" as const };
    setConsent(nextConsent);
    setConsentAccepted(nextConsent.status === "ACTIVE");
    setCorrections(Array.isArray(body.correctionRequests) ? body.correctionRequests : []);
    setCandidateReference(body.candidateReference ?? null);
    setIdentityStatus(body.identityStatus ?? "UNKNOWN");
    setSavedAt(body.savedAt ?? null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await request("load");
      applyServerState(body);
      setNotice(body.message ?? "Loaded the latest profile from Supabase.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your saved profile.");
    } finally {
      setLoading(false);
    }
  }, [request, applyServerState]);

  useEffect(() => { void load(); }, [load]);

  const completion = useMemo(() => {
    const required = [Boolean(profile.displayName.trim()), Boolean(profile.province.trim()), Boolean(profile.highestQualification.trim()), pathways.length > 0];
    const completed = required.filter(Boolean).length;
    return { completed, required: required.length, percent: Math.round(completed / required.length * 100) };
  }, [profile, pathways]);

  function updateField(key: keyof Profile, value: string) {
    setProfile(old => ({ ...old, [key]: value }));
    setNotice("");
  }
  function togglePathway(pathway: string, checked: boolean) {
    setPathways(old => checked ? [...new Set([...old, pathway])] : old.filter(value => value !== pathway));
    setNotice("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!consentAccepted) {
      setError("Consent is required before profile information can be saved.");
      return;
    }
    setSaving(true);
    try {
      const body = await request("save", { profile, pathwayPreferences: pathways, consentAccepted: true });
      applyServerState(body);
      setNotice("Profile saved to Supabase. The page now reflects the server response; use Reload saved profile to verify persistence.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile. Reload before retrying.");
    } finally {
      setSaving(false);
    }
  }

  async function revokeConsent() {
    if (!window.confirm("Withdraw profile-processing consent? Your saved profile will be preserved, but consent-dependent features may be restricted.")) return;
    setError(""); setNotice(""); setSaving(true);
    try {
      const body = await request("revoke_consent");
      setConsent(body.consent ?? { status: "REVOKED" });
      setConsentAccepted(false);
      setNotice(body.message ?? "Consent withdrawn. Your saved profile remains preserved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Consent withdrawal could not be confirmed.");
    } finally { setSaving(false); }
  }

  async function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setCorrectionBusy(true);
    try {
      const body = await request("request_correction", {
        fieldName: correctionField, requestedValue: correctionValue, reason: correctionReason
      });
      setCorrections(old => [body.correctionRequest as Correction, ...old]);
      setCorrectionValue(""); setCorrectionReason("");
      setNotice(body.message ?? "Correction request recorded for authorised review.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Correction request could not be saved.");
    } finally { setCorrectionBusy(false); }
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">My reusable profile</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Save your profile once and reuse it across all six pathways. Your profile is stored in Supabase, not just in this browser. Reloading or signing in again should retrieve the saved server copy.</p>
        <nav aria-label="Candidate navigation" className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-3">Dashboard</a>
          <a href="/candidate/workbench" className="rounded-xl border border-slate-700 px-4 py-3">Application workbench</a>
          <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-3">Opportunities</a>
          <a href="/candidate/applications" className="rounded-xl border border-slate-700 px-4 py-3">Application tracker</a>
          <a href="/candidate/documents" className="rounded-xl border border-slate-700 px-4 py-3">Document Vault</a>
        </nav>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-700 bg-amber-950/50 p-4 text-sm leading-6 text-amber-100"><strong>Not confirmed saved.</strong><p className="mt-1">{error}</p></section>}
      {notice && <p role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-100">{notice}</p>}

      <section aria-labelledby="profile-status-heading" className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 id="profile-status-heading" className="text-xl font-bold">Profile completeness</h2><p className="mt-1 text-sm text-slate-400">Required for a useful reusable profile; this is not an eligibility decision.</p></div>
          <div className="text-right"><p className="text-2xl font-black text-cyan-300">{completion.percent}%</p><p className="text-xs text-slate-400">{completion.completed} of {completion.required} required checks</p></div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Profile completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percent}><div className="h-full rounded-full bg-cyan-300" style={{ width: `${completion.percent}%` }} /></div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ["Name", Boolean(profile.displayName.trim())],
            ["Province", Boolean(profile.province.trim())],
            ["Highest qualification", Boolean(profile.highestQualification.trim())],
            ["At least one pathway", pathways.length > 0]
          ].map(([label, done]) => <li key={String(label)} className="flex items-center gap-2 text-sm"><span aria-hidden="true" className={done ? "text-emerald-300" : "text-amber-300"}>{done ? "✓" : "○"}</span>{label}: {done ? "Complete" : "Still needed"}</li>)}
        </ul>
        <div className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
          <p className="rounded-xl border border-slate-800 p-3"><span className="block text-xs text-slate-400">Consent</span><strong>{consent.status === "ACTIVE" ? "Active" : consent.status === "REVOKED" ? "Withdrawn" : "Not recorded"}</strong></p>
          <p className="rounded-xl border border-slate-800 p-3"><span className="block text-xs text-slate-400">Identity status</span><strong>{identityStatus.replaceAll("_", " ")}</strong></p>
          <p className="rounded-xl border border-slate-800 p-3"><span className="block text-xs text-slate-400">Candidate reference</span><strong>{candidateReference ?? "Not provisioned"}</strong></p>
        </div>
        <p className="mt-3 text-xs text-slate-500">{savedAt ? `Last server save: ${new Date(savedAt).toLocaleString()}` : "No server save timestamp returned yet."} {consent.version ? `· Consent version: ${consent.version}` : ""}</p>
      </section>

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-bold">Profile information</h2>
          <p className="mt-1 text-sm text-slate-400">Do not enter a national identity number or upload sensitive documents into this form. Use the private Document Vault for supported files.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {([
              ["displayName", "Full name", "Your name as you want it displayed", true],
              ["phone", "Phone (optional)", "Include country code if available", false],
              ["province", "Province", "e.g. Gauteng", true],
              ["highestQualification", "Highest qualification", "e.g. Matric, N4, diploma", true],
              ["preferredLocation", "Preferred location (optional)", "Town, city or region", false],
              ["studyInterests", "Study interests (optional)", "Courses, fields or subjects", false],
              ["employmentInterests", "Employment interests (optional)", "Roles, sectors or skills", false]
            ] as const).map(([key, label, placeholder, required]) => <label key={key} className={key === "studyInterests" || key === "employmentInterests" ? "sm:col-span-2 block text-sm font-semibold" : "block text-sm font-semibold"}>
              {label}
              <input value={profile[key]} onChange={event => updateField(key, event.target.value)} required={required} maxLength={key === "studyInterests" || key === "employmentInterests" ? 600 : key === "displayName" ? 120 : key === "highestQualification" ? 100 : key === "phone" ? 40 : 120}
                autoComplete={key === "displayName" ? "name" : key === "phone" ? "tel" : "off"}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                placeholder={placeholder} />
            </label>)}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-bold">Pathway preferences</h2>
          <p className="mt-1 text-sm text-slate-400">These preferences help personalize support. Selecting one does not restrict access to the other pathways.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PATHWAYS.map(([value, label]) => <label key={value} className="flex items-start gap-3 rounded-xl border border-slate-800 p-4">
              <input type="checkbox" checked={pathways.includes(value)} onChange={event => togglePathway(value, event.target.checked)} className="mt-1 h-4 w-4 accent-cyan-300" />
              <span className="text-sm font-semibold">{label}</span>
            </label>)}
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-900 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-bold">Consent and privacy</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{consent.text ?? "I consent to Kingsmen processing the profile information I enter for candidate profile, opportunity discovery and application-preparation support. Access to my personal records is restricted to my verified candidate identity and authorised roles. Information is handled under the published privacy, security and retention rules. I may withdraw consent; withdrawal does not automatically delete my saved profile, but functions that depend on consent may be restricted. I will not enter national identity numbers or sensitive documents in this profile form."}</p>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-700 p-4">
            <input type="checkbox" checked={consentAccepted} onChange={event => { setConsentAccepted(event.target.checked); setNotice(""); }} className="mt-1 h-4 w-4 accent-cyan-300" />
            <span className="text-sm leading-6"><strong>I agree to this profile-processing consent.</strong><span className="block text-slate-400">Required to save or update profile information. You can withdraw consent below; your existing saved profile will not be automatically deleted.</span></span>
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={loading || saving || !consentAccepted} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving…" : "Save profile"}</button>
            <button type="button" onClick={() => void load()} disabled={loading || saving} className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold disabled:opacity-40">{loading ? "Loading…" : "Reload saved profile"}</button>
            {consent.status === "ACTIVE" && <button type="button" onClick={() => void revokeConsent()} disabled={saving || loading} className="rounded-xl border border-amber-800 px-5 py-3 text-sm font-semibold text-amber-200 disabled:opacity-40">Withdraw consent</button>}
          </div>
        </section>
      </form>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <h2 className="text-xl font-bold">Request a profile correction</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">If an existing candidate record requires an authorised correction, submit a request. The saved value is not changed until a reviewer decides it.</p>
        <form onSubmit={submitCorrection} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Field to correct
            <select value={correctionField} onChange={event => setCorrectionField(event.target.value as keyof Profile)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3">
              {Object.entries(FIELD_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Requested value
            <input required maxLength={600} value={correctionValue} onChange={event => setCorrectionValue(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3" />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">Reason (5–800 characters)
            <textarea required minLength={5} maxLength={800} rows={3} value={correctionReason} onChange={event => setCorrectionReason(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3" />
          </label>
          <div className="sm:col-span-2"><button type="submit" disabled={correctionBusy || loading || !candidateReference} className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold disabled:opacity-40">{correctionBusy ? "Submitting…" : "Submit correction request"}</button></div>
        </form>
        <div className="mt-5 space-y-2">
          {corrections.map(item => <article key={item.id} className="rounded-xl border border-slate-800 p-4 text-sm"><p className="font-semibold">{FIELD_LABELS[item.field_name] ?? item.field_name}: {item.requested_value}</p><p className="mt-1 text-slate-400">Status: {item.status.replaceAll("_", " ")} · {item.reason}</p></article>)}
          {corrections.length === 0 && <p className="text-sm text-slate-500">No correction requests are currently returned.</p>}
        </div>
      </section>

      <footer className="text-xs leading-5 text-slate-500">Personal profile access may remain limited while an identity link is pending. Opportunity matching, private documents and legacy candidate records require the appropriate authorised identity review. This page does not create an email-only link to an existing candidate record.</footer>
    </div>
  </main>;
}
