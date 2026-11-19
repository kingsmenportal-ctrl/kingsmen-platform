"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  getKingsmenSupabaseAccessToken,
  getKingsmenSupabaseBrowserConfig
} from "../../../lib/kingsmen/supabase-session";

const PATHWAYS = [
  { value: "higher_education", label: "Higher Education", detail: "Universities, qualifications and CAO choices" },
  { value: "tvet", label: "TVET", detail: "Technical and vocational colleges" },
  { value: "seta_learnership", label: "SETA Programmes & Learnerships", detail: "Skills programmes and learnerships" },
  { value: "internship", label: "Internships", detail: "Workplace exposure and WIL" },
  { value: "apprenticeship", label: "Apprenticeships", detail: "Trade training and artisan routes" },
  { value: "employment", label: "Employment", detail: "Jobs and employer opportunities" }
] as const;

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const EMPTY_PROFILE: Record<string, string> = {
  displayName: "",
  phone: "",
  province: "",
  highestQualification: "",
  studyInterests: "",
  employmentInterests: "",
  preferredLocation: ""
};

type ProfileResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  profile?: Record<string, unknown>;
  pathwayPreferences?: string[];
  consent?: { status?: string; version?: string | null; grantedAt?: string | null; text?: string | null };
  completeness?: { completed?: number; required?: number; percent?: number; missing?: string[] };
  candidateReference?: string | null;
  identityStatus?: string;
  persistence?: string;
  savedAt?: string | null;
};

async function callProfileAction(action: "load" | "save" | "revoke_consent", payload: Record<string, unknown> = {}): Promise<ProfileResponse> {
  const config = getKingsmenSupabaseBrowserConfig();
  const token = await getKingsmenSupabaseAccessToken();
  if (!config) throw new Error("Kingsmen profile service is not configured for this deployment.");
  if (!token) throw new Error("No signed-in Kingsmen session was found for this Supabase project. Sign in, then reload this page.");

  const response = await fetch(`${config.url}/functions/v1/candidate-master-profile`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store"
  });

  const data = await response.json().catch(() => null) as ProfileResponse | null;
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || data?.code || `Profile request failed (${response.status}).`);
  }
  return data;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function StatusPill({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "good" | "warning" }) {
  const classes = tone === "good"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>{children}</span>;
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Record<string, string>>({ ...EMPTY_PROFILE });
  const [pathwayPreferences, setPathwayPreferences] = useState<string[]>([]);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentStatus, setConsentStatus] = useState("NOT_RECORDED");
  const [consentText, setConsentText] = useState("I consent to Kingsmen processing the profile information I enter for candidate profile, opportunity discovery and application-preparation support. Access to my personal records is restricted to my verified candidate identity and authorised roles. I may withdraw consent; withdrawal does not automatically delete my saved profile.");
  const [identityStatus, setIdentityStatus] = useState("UNKNOWN");
  const [candidateReference, setCandidateReference] = useState<string | null>(null);
  const [persistence, setPersistence] = useState("UNKNOWN");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<{ completed?: number; required?: number; percent?: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const applyResponse = useCallback((data: ProfileResponse) => {
    setProfile({ ...EMPTY_PROFILE, ...Object.fromEntries(
      Object.entries(data.profile ?? {}).map(([key, value]) => [key, stringValue(value)])
    ) });
    setPathwayPreferences(Array.isArray(data.pathwayPreferences) ? data.pathwayPreferences : []);
    setConsentStatus(data.consent?.status ?? "NOT_RECORDED");
    setConsentAccepted(data.consent?.status === "ACTIVE");
    if (typeof data.consent?.text === "string" && data.consent.text) setConsentText(data.consent.text);
    setIdentityStatus(data.identityStatus ?? "UNKNOWN");
    setCandidateReference(data.candidateReference ?? null);
    setPersistence(data.persistence ?? "UNKNOWN");
    setSavedAt(data.savedAt ?? null);
    setCompleteness(data.completeness ?? {});
    if (data.message) setMessage(data.message);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await callProfileAction("load");
      applyResponse(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the saved profile.");
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function updateField(field: string, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function togglePathway(value: string, checked: boolean) {
    setPathwayPreferences((current) => checked
      ? [...current.filter((item) => item !== value), value]
      : current.filter((item) => item !== value));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!profile.displayName.trim() || profile.displayName.trim().length < 2) {
      setError("Enter your name (at least two characters) before saving.");
      return;
    }
    if (!consentAccepted) {
      setError("You must accept the profile-processing consent before saving.");
      return;
    }
    setSaving(true);
    try {
      const data = await callProfileAction("save", {
        profile,
        pathwayPreferences,
        consentAccepted: true
      });
      applyResponse(data);
      setMessage(data.message || "Your profile was saved to Kingsmen.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function withdrawConsent() {
    const approved = window.confirm("Withdraw profile-processing consent? Your saved profile will be preserved, but consent-dependent features may be restricted.");
    if (!approved) return;
    setError("");
    setMessage("");
    setWithdrawing(true);
    try {
      const data = await callProfileAction("revoke_consent");
      setConsentStatus(data.consent?.status ?? "REVOKED");
      setConsentAccepted(false);
      setMessage(data.message || "Consent was withdrawn. Your profile data remains saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Consent could not be withdrawn.");
    } finally {
      setWithdrawing(false);
    }
  }

  const percent = typeof completeness.percent === "number" ? completeness.percent : 0;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">KINGSMEN PORTAL · CANDIDATE PROFILE</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">One profile for all six pathways</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          Save reusable details once. Kingsmen uses them to support opportunity discovery and prepare applications; your profile does not itself submit an application to a provider.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/candidate/dashboard" className="inline-flex min-h-10 items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Candidate dashboard</a>
          <a href="/candidate/workbench" className="inline-flex min-h-10 items-center rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-200">Application workbench</a>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Profile state">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completeness</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{percent}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} /></div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Identity</p>
          <div className="mt-3"><StatusPill tone={identityStatus === "VERIFIED" ? "good" : identityStatus === "PENDING_REVIEW" ? "warning" : "neutral"}>{identityStatus.replaceAll("_", " ")}</StatusPill></div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Consent</p>
          <div className="mt-3"><StatusPill tone={consentStatus === "ACTIVE" ? "good" : "warning"}>{consentStatus.replaceAll("_", " ")}</StatusPill></div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Persistence</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{persistence === "SUPABASE_BACKEND" ? "Saved in Kingsmen" : persistence === "NOT_PROVISIONED" ? "Not saved yet" : persistence === "UNKNOWN" ? "Checking…" : persistence}</p>
          {candidateReference && <p className="mt-1 break-all text-xs text-slate-500">Candidate ref: {candidateReference}</p>}
        </article>
      </section>

      {loading && <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">Loading your saved profile from Kingsmen…</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}

      <form onSubmit={saveProfile} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">Your details</h2>
            <p className="mt-1 text-sm text-slate-600">Only enter information needed for your profile. Do not enter a national ID number or upload sensitive identity documents here.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">Full name
              <input value={profile.displayName} onChange={(e) => updateField("displayName", e.target.value)} maxLength={120} autoComplete="name" required className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
            <label className="block text-sm font-semibold text-slate-800">Phone (optional)
              <input value={profile.phone} onChange={(e) => updateField("phone", e.target.value)} maxLength={40} type="tel" autoComplete="tel" placeholder="+27…" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
            <label className="block text-sm font-semibold text-slate-800">Province
              <select value={profile.province} onChange={(e) => updateField("province", e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                <option value="">Choose a province</option>
                {PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-800">Highest qualification
              <input value={profile.highestQualification} onChange={(e) => updateField("highestQualification", e.target.value)} maxLength={100} placeholder="e.g. Matric / Grade 12" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
            <label className="block text-sm font-semibold text-slate-800 sm:col-span-2">Study interests (optional)
              <textarea value={profile.studyInterests} onChange={(e) => updateField("studyInterests", e.target.value)} maxLength={600} rows={3} placeholder="Qualifications, subjects or fields you are considering" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
            <label className="block text-sm font-semibold text-slate-800 sm:col-span-2">Employment interests (optional)
              <textarea value={profile.employmentInterests} onChange={(e) => updateField("employmentInterests", e.target.value)} maxLength={600} rows={3} placeholder="Roles, industries or skills you want to pursue" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
            <label className="block text-sm font-semibold text-slate-800 sm:col-span-2">Preferred location (optional)
              <input value={profile.preferredLocation} onChange={(e) => updateField("preferredLocation", e.target.value)} maxLength={120} placeholder="Town, city or region" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950">Pathway preferences</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Select any paths you want Kingsmen to prioritise when personalising your discovery. This does not restrict access to the full catalogue.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PATHWAYS.map((pathway) => (
              <label key={pathway.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-amber-400">
                <input type="checkbox" checked={pathwayPreferences.includes(pathway.value)} onChange={(e) => togglePathway(pathway.value, e.target.checked)} className="mt-1 h-4 w-4 accent-amber-500" />
                <span><span className="block text-sm font-semibold text-slate-900">{pathway.label}</span><span className="mt-1 block text-sm text-slate-600">{pathway.detail}</span></span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950">Profile-processing consent</h2>
          <p className="mt-2 text-sm leading-6 text-slate-800">{consentText}</p>
          <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-900">
            <input type="checkbox" checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-amber-600" />
            <span>I have read the consent text and agree to this processing for my Kingsmen profile, opportunity discovery and application-preparation support.</span>
          </label>
          <p className="mt-3 text-xs leading-5 text-slate-700">Consent can be withdrawn. Withdrawal preserves saved profile data but may restrict features that rely on active consent. Confirm current privacy and retention terms before public launch.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={loading || saving || withdrawing} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Saving to Kingsmen…" : "Save my profile"}
            </button>
            {consentStatus === "ACTIVE" && <button type="button" onClick={() => void withdrawConsent()} disabled={loading || saving || withdrawing} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-400 bg-white px-5 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50">{withdrawing ? "Withdrawing…" : "Withdraw consent"}</button>}
            <button type="button" onClick={() => void loadProfile()} disabled={loading || saving || withdrawing} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50">Reload saved profile</button>
          </div>
        </section>
      </form>

      {savedAt && <p className="text-xs text-slate-500">Last saved: {new Date(savedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}. Data is loaded from the Kingsmen backend, not browser-only storage.</p>}
      <p className="text-xs leading-5 text-slate-500">Profile setup may remain in pending identity review. Kingsmen does not link legacy accounts by email equality, and an unverified identity does not unlock another candidate’s records. The profile form does not submit any external application.</p>
    </main>
  );
}
