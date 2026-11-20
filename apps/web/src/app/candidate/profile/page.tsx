"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { clearSupabaseSession, getValidSupabaseAccessToken } from "@/lib/candidate-session";

const PATHWAYS = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
] as const;

type Pathway = typeof PATHWAYS[number][0];
type Profile = {
  displayName: string;
  phone: string;
  province: string;
  highestQualification: string;
  studyInterests: string;
  employmentInterests: string;
  preferredLocation: string;
};
type Consent = { status?: string; version?: string | null; grantedAt?: string | null; text?: string };
type ProfileResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  profile?: Partial<Profile>;
  pathwayPreferences?: string[];
  consent?: Consent;
  completeness?: { completed: number; required: number; percent: number; missing: string[] };
  candidateReference?: string | null;
  identityStatus?: string;
  savedAt?: string | null;
  persistence?: string;
};

const EMPTY_PROFILE: Profile = {
  displayName: "",
  phone: "",
  province: "",
  highestQualification: "",
  studyInterests: "",
  employmentInterests: "",
  preferredLocation: ""
};

async function requestProfile(action: string, accessToken: string, extra: Record<string, unknown> = {}): Promise<{ response: Response; body: ProfileResponse }> {
  const response = await fetch("/api/candidate/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ action, ...extra }),
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({})) as ProfileResponse;
  return { response, body };
}

function displayDate(value?: string | null): string {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Saved date unavailable" : date.toLocaleString();
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [pathwayPreferences, setPathwayPreferences] = useState<Pathway[]>([]);
  const [consent, setConsent] = useState<Consent>({ status: "NOT_RECORDED", text: "" });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [identityStatus, setIdentityStatus] = useState("UNKNOWN");
  const [candidateReference, setCandidateReference] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<ProfileResponse["completeness"]>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const token = await getValidSupabaseAccessToken();
      if (!token) {
        setError("Sign in to load your saved Kingsmen profile.");
        return;
      }
      const { response, body } = await requestProfile("load", token);
      if (!response.ok || body.ok !== true) {
        if (response.status === 401) clearSupabaseSession();
        throw new Error(body.error ?? body.message ?? "The saved profile could not be loaded.");
      }
      const values = { ...EMPTY_PROFILE, ...(body.profile ?? {}) };
      setProfile(values);
      setPathwayPreferences((body.pathwayPreferences ?? []).filter((value): value is Pathway =>
        PATHWAYS.some(([key]) => key === value)
      ));
      setConsent(body.consent ?? { status: "NOT_RECORDED", text: "" });
      setConsentAccepted(body.consent?.status === "ACTIVE");
      setIdentityStatus(body.identityStatus ?? "UNKNOWN");
      setCandidateReference(body.candidateReference ?? null);
      setSavedAt(body.savedAt ?? null);
      setCompleteness(body.completeness);
      if (body.persistence === "NOT_PROVISIONED") {
        setMessage("No saved candidate profile exists for this authenticated account yet. Complete the profile and consent, then save to create one.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The profile could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function updateField(field: keyof Profile, value: string) {
    setProfile(current => ({ ...current, [field]: value }));
  }

  function togglePathway(pathway: Pathway, checked: boolean) {
    setPathwayPreferences(current => checked
      ? [...new Set([...current, pathway])]
      : current.filter(value => value !== pathway));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await getValidSupabaseAccessToken();
      if (!token) {
        clearSupabaseSession();
        throw new Error("Your session is missing or expired. Sign in again before saving your profile.");
      }
      if (!consentAccepted) throw new Error("Accept the profile-processing consent before saving.");
      const { response, body } = await requestProfile("save", token, {
        profile,
        pathwayPreferences,
        consentAccepted: true
      });
      if (!response.ok || body.ok !== true) {
        if (response.status === 401) clearSupabaseSession();
        throw new Error(body.error ?? body.message ?? "The profile could not be saved.");
      }
      setProfile({ ...EMPTY_PROFILE, ...(body.profile ?? {}) });
      setPathwayPreferences((body.pathwayPreferences ?? []).filter((value): value is Pathway =>
        PATHWAYS.some(([key]) => key === value)
      ));
      setConsent(body.consent ?? { status: "ACTIVE", text: "" });
      setConsentAccepted(body.consent?.status === "ACTIVE");
      setIdentityStatus(body.identityStatus ?? identityStatus);
      setCandidateReference(body.candidateReference ?? candidateReference);
      setSavedAt(body.savedAt ?? null);
      setCompleteness(body.completeness);
      setMessage(body.message ?? "Kingsmen confirmed that your profile was saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    clearSupabaseSession();
    window.location.assign("/candidate/login");
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">KINGSMEN PORTAL · CANDIDATE</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">My profile</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          One reusable profile supports all six pathways. Your profile is stored by Kingsmen only after the backend confirms the save.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200" href="/candidate/dashboard">Candidate dashboard</a>
          <button type="button" onClick={() => void loadProfile()} disabled={loading || saving}
            className="rounded-xl border border-slate-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Loading…" : "Reload saved profile"}
          </button>
          <button type="button" onClick={() => void signOut()} className="rounded-xl border border-slate-500 px-4 py-3 text-sm font-semibold text-white">
            Sign out
          </button>
        </div>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <a className="font-bold underline" href="/candidate/login">Sign in</a></div> : null}
      {message ? <div role="status" aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">{message}</div> : null}

      {loading ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading your saved profile from Kingsmen…</p> : (
        <form onSubmit={saveProfile} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Personal details</h2>
                <p className="mt-1 text-sm text-slate-600">Do not enter national identity numbers or sensitive identity documents in this profile form.</p>
              </div>
              {completeness ? <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">{completeness.percent}% complete</div> : null}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="displayName" className="mb-1 block text-sm font-semibold text-slate-800">Full name *</label>
                <input id="displayName" required minLength={2} maxLength={120} value={profile.displayName}
                  onChange={e => updateField("displayName", e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-slate-800">Phone (optional)</label>
                <input id="phone" type="tel" maxLength={40} value={profile.phone}
                  onChange={e => updateField("phone", e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
              <div>
                <label htmlFor="province" className="mb-1 block text-sm font-semibold text-slate-800">Province</label>
                <select id="province" value={profile.province} onChange={e => updateField("province", e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200">
                  <option value="">Select province</option>
                  {["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"].map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="highestQualification" className="mb-1 block text-sm font-semibold text-slate-800">Highest qualification</label>
                <input id="highestQualification" maxLength={100} value={profile.highestQualification}
                  onChange={e => updateField("highestQualification", e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
              <div>
                <label htmlFor="preferredLocation" className="mb-1 block text-sm font-semibold text-slate-800">Preferred location</label>
                <input id="preferredLocation" maxLength={120} value={profile.preferredLocation}
                  onChange={e => updateField("preferredLocation", e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
              <div>
                <label htmlFor="studyInterests" className="mb-1 block text-sm font-semibold text-slate-800">Study interests</label>
                <textarea id="studyInterests" maxLength={600} rows={3} value={profile.studyInterests}
                  onChange={e => updateField("studyInterests", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="employmentInterests" className="mb-1 block text-sm font-semibold text-slate-800">Work, internship and apprenticeship interests</label>
                <textarea id="employmentInterests" maxLength={600} rows={3} value={profile.employmentInterests}
                  onChange={e => updateField("employmentInterests", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-950 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-slate-950">Pathway preferences</h2>
            <p className="mt-1 text-sm text-slate-600">Choose any combination. All six pathways remain discoverable regardless of your Kingsmen plan.</p>
            <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Select pathway preferences</legend>
              {PATHWAYS.map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-amber-400">
                  <input type="checkbox" checked={pathwayPreferences.includes(value)} onChange={e => togglePathway(value, e.target.checked)}
                    className="mt-1 h-4 w-4 accent-amber-500" />
                  <span><span className="block font-semibold text-slate-900">{label}</span><span className="mt-1 block text-sm text-slate-600">Available for profile and opportunity matching preferences</span></span>
                </label>
              ))}
            </fieldset>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-slate-950">Consent and identity status</h2>
            <p className="mt-1 text-sm text-slate-600">Consent is recorded by the server with a version and timestamp. Creating a profile does not automatically verify an older identity or unlock protected records.</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{consent.text || "The current consent text will be loaded from Kingsmen before your profile can be saved."}</div>
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} required className="mt-1 h-4 w-4 accent-amber-500" />
              <span className="text-sm leading-6 text-slate-800">I consent to Kingsmen processing the profile information I enter for candidate profile, opportunity discovery and application-preparation support, according to the consent wording displayed above. I understand I can withdraw consent.</span>
            </label>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4"><dt className="text-xs uppercase tracking-wide text-slate-500">Identity status</dt><dd className="mt-1 font-semibold text-slate-900">{identityStatus.replaceAll("_", " ")}</dd></div>
              <div className="rounded-xl border border-slate-200 p-4"><dt className="text-xs uppercase tracking-wide text-slate-500">Last saved</dt><dd className="mt-1 font-semibold text-slate-900">{displayDate(savedAt)}</dd></div>
              {candidateReference ? <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-slate-500">Kingsmen candidate reference</dt><dd className="mt-1 font-mono text-sm text-slate-900">{candidateReference}</dd></div> : null}
            </dl>
            {identityStatus === "PENDING_REVIEW" ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-800">Your profile is saved, but identity verification is pending human review. Kingsmen has not linked this account to an older candidate record or confirmed any provider submission.</p> : null}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving || loading || !consentAccepted}
              className="min-h-12 rounded-xl bg-amber-300 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Saving profile…" : "Save profile to Kingsmen"}
            </button>
            <span className="text-sm text-slate-600">Kingsmen confirms the save before showing success.</span>
          </div>
        </form>
      )}
    </main>
  );
}
