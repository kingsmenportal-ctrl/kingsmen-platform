"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

const PATHWAYS = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
] as const;

type Pathway = typeof PATHWAYS[number][0];
type ProfileFields = {
  displayName: string;
  phone: string;
  province: string;
  highestQualification: string;
  studyInterests: string;
  employmentInterests: string;
  preferredLocation: string;
};
type Consent = {
  status: "ACTIVE" | "REVOKED" | "NOT_RECORDED" | string;
  version: string | null;
  grantedAt: string | null;
  text: string;
};
type CorrectionRequest = {
  id: string;
  field_name: string;
  old_value: string | null;
  requested_value: string;
  reason: string;
  status: string;
  requested_at: string;
};
type ApiState = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  profile?: Partial<ProfileFields>;
  pathwayPreferences?: string[];
  consent?: Consent;
  completeness?: { completed: number; required: number; percent: number; missing: string[] };
  correctionRequests?: CorrectionRequest[];
  candidateReference?: string | null;
  identityStatus?: string | null;
  savedAt?: string | null;
  persistence?: string;
  correctionRequest?: CorrectionRequest;
  profilePreserved?: boolean;
};

const blankProfile: ProfileFields = {
  displayName: "",
  phone: "",
  province: "",
  highestQualification: "",
  studyInterests: "",
  employmentInterests: "",
  preferredLocation: ""
};

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let storageKey = "sb-euhubhhnumtibbyufghm-auth-token";
  try {
    if (url) {
      const ref = new URL(url).hostname.split(".")[0];
      if (ref) storageKey = `sb-${ref}-auth-token`;
    }
  } catch {}
  return { url, anonKey, storageKey };
}

function readToken() {
  const settings = config();
  if (!settings.url || !settings.anonKey) throw new Error("Candidate profile is not configured for this deployment.");
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(settings.storageKey); } catch {}
  if (!raw) throw new Error("Sign in before opening your candidate profile.");
  try {
    const session = JSON.parse(raw) as { access_token?: string; expires_at?: number };
    if (!session.access_token) throw new Error("Sign in before opening your candidate profile.");
    if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) {
      throw new Error("Your session has expired. Sign in again to continue.");
    }
    return { ...settings, token: session.access_token };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Sign in")) throw error;
    if (error instanceof Error && error.message.startsWith("Your session")) throw error;
    throw new Error("Your browser session could not be read. Sign in again.");
  }
}

async function callProfile(payload: Record<string, unknown>): Promise<ApiState> {
  const session = readToken();
  const response = await fetch(`${session.url}/functions/v1/candidate-master-profile`, {
    method: "POST",
    headers: {
      apikey: session.anonKey!,
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  let result: ApiState = {};
  try { result = await response.json() as ApiState; } catch {}
  if (!response.ok || result.ok === false) {
    const detail = result.error || result.message || `Profile request failed (${response.status}).`;
    throw Object.assign(new Error(detail), { code: result.code || "PROFILE_REQUEST_FAILED", status: response.status });
  }
  return result;
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

export default function CandidateMasterProfileForm() {
  const [profile, setProfile] = useState<ProfileFields>(blankProfile);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [identityStatus, setIdentityStatus] = useState<string | null>(null);
  const [candidateReference, setCandidateReference] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<ApiState["completeness"]>();
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [correctionField, setCorrectionField] = useState<keyof ProfileFields>("displayName");
  const [correctionValue, setCorrectionValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const loadProfile = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const result = await callProfile({ action: "load" });
      setProfile({ ...blankProfile, ...(result.profile ?? {}) });
      setPathways((result.pathwayPreferences ?? []).filter((value): value is Pathway =>
        PATHWAYS.some(([key]) => key === value)
      ));
      setConsent(result.consent ?? null);
      setConsentAccepted(result.consent?.status === "ACTIVE");
      setIdentityStatus(result.identityStatus ?? null);
      setCandidateReference(result.candidateReference ?? null);
      setSavedAt(result.savedAt ?? null);
      setCompleteness(result.completeness);
      setCorrections(result.correctionRequests ?? []);
      setNotice(result.message ?? "Profile loaded.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not load your profile.";
      setError(message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  function updateProfile(field: keyof ProfileFields, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function togglePathway(pathway: Pathway, checked: boolean) {
    setPathways((current) => checked
      ? [...new Set([...current, pathway])]
      : current.filter((item) => item !== pathway));
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!consentAccepted) {
      setError("Please actively confirm profile-processing consent before saving. You can withdraw consent later; saved profile data is not automatically erased.");
      return;
    }
    if (profile.displayName.trim().length < 2) {
      setError("Enter your name (at least two characters) before saving.");
      return;
    }
    setSaving(true);
    try {
      const result = await callProfile({
        action: "save",
        consentAccepted: true,
        profile,
        pathwayPreferences: pathways
      });
      setProfile({ ...blankProfile, ...(result.profile ?? {}) });
      setPathways((result.pathwayPreferences ?? []).filter((value): value is Pathway =>
        PATHWAYS.some(([key]) => key === value)
      ));
      setConsent(result.consent ?? null);
      setConsentAccepted(result.consent?.status === "ACTIVE");
      setIdentityStatus(result.identityStatus ?? null);
      setCandidateReference(result.candidateReference ?? null);
      setSavedAt(result.savedAt ?? null);
      setCompleteness(result.completeness);
      setCorrections(result.correctionRequests ?? []);
      setNotice(result.message ?? "Profile save response received.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profile was not saved. Reload and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onRevokeConsent() {
    if (!window.confirm("Withdraw profile-processing consent? Your saved profile will be preserved, but consent-dependent services may be restricted.")) return;
    setError("");
    setNotice("");
    setRevoking(true);
    try {
      const result = await callProfile({ action: "revoke_consent" });
      setConsent((current) => current ? { ...current, status: "REVOKED" } : current);
      setConsentAccepted(false);
      setNotice(result.message ?? "Consent withdrawal response received. Profile data was not deleted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Consent withdrawal could not be confirmed.");
    } finally {
      setRevoking(false);
    }
  }

  async function onRequestCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmittingCorrection(true);
    try {
      const result = await callProfile({
        action: "request_correction",
        fieldName: correctionField,
        requestedValue: correctionValue,
        reason: correctionReason
      });
      if (result.correctionRequest) setCorrections((current) => [result.correctionRequest!, ...current]);
      setCorrectionValue("");
      setCorrectionReason("");
      setNotice(result.message ?? "Correction request submitted. The saved value has not been changed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Correction request was not submitted.");
    } finally {
      setSubmittingCorrection(false);
    }
  }

  const consentActive = consent?.status === "ACTIVE";
  const identityLabel = useMemo(() => {
    if (identityStatus === "VERIFIED") return "Verified candidate identity";
    if (identityStatus === "PENDING_REVIEW") return "Profile saved · identity review pending";
    if (identityStatus === "NOT_PROVISIONED") return "New profile · setup available";
    if (identityStatus) return identityStatus.replaceAll("_", " ").toLowerCase();
    return "Not checked";
  }, [identityStatus]);

  return (
    <main className="public-site candidate-page">
      <div className="public-notice"><span aria-hidden="true" /> CANDIDATE PROFILE · Authenticated backend workflow</div>
      <header className="public-header"><div className="public-container public-header-inner">
        <a className="public-brand" href="/" aria-label="Kingsmen Portal home"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></a>
        <nav className="public-nav" aria-label="Candidate navigation"><a href="/candidate/dashboard/">Dashboard</a><a href="/candidate/saved-opportunities/">Saved opportunities</a><a href="/candidate/documents/">Documents</a><a className="public-nav-portal" href="/candidate/opportunity-matches/">Opportunities ↗</a></nav>
      </div></header>

      <div className="public-container candidate-page-body">
        <header className="candidate-page-heading"><div><div className="public-eyebrow"><span /> REUSABLE CANDIDATE PROFILE</div><h1>Your profile, <em>one place.</em></h1><p>Save your reusable profile and pathway preferences for the Kingsmen journey. A saved profile is not an application submission; a new profile remains pending until identity review is complete.</p></div><span className="candidate-preview-chip">{loading ? "LOADING" : consentActive ? "CONSENT ACTIVE" : "PROFILE SETUP"}</span></header>

        {error ? <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"><strong className="block">{error.startsWith("Sign in") || error.startsWith("Your session") ? "Sign-in required" : "Request needs attention"}</strong><p className="mt-1">{error}</p>{error.startsWith("Sign in") || error.startsWith("Your session") ? <a className="mt-3 inline-flex rounded-lg bg-slate-950 px-3 py-2 font-semibold text-white" href="/candidate/login/">Sign in</a> : null}</section> : null}
        {notice && !loading ? <p role="status" aria-live="polite" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-800">{notice}</p> : null}

        {loading ? <section className="candidate-doc-panel"><p className="text-sm text-slate-600">Loading candidate profile and consent state…</p></section> : (
          <>
            <section className="candidate-hero-panel"><div><span className="candidate-panel-kicker">PERSISTENCE STATUS</span><h2>{identityLabel}</h2><p>{candidateReference ? `Candidate reference: ${candidateReference}` : "No candidate reference returned yet."} {savedAt ? `Last saved: ${formatDate(savedAt)}.` : "No saved timestamp returned yet."}</p></div><div className="candidate-profile-completeness"><strong>{completeness?.percent ?? 0}%</strong><span>Profile completeness</span><div className="candidate-progress-track"><span style={{ width: `${completeness?.percent ?? 0}%` }} /></div></div></section>

            <form className="candidate-doc-panel mt-6" onSubmit={onSave}>
              <div className="candidate-subheading"><h2>Profile information</h2><p>Only enter the information needed for route planning. Do not enter an ID number, password, bank details or document contents here.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-800">Display name
                  <input required minLength={2} maxLength={120} value={profile.displayName} onChange={(e) => updateProfile("displayName", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" autoComplete="name" />
                </label>
                <label className="block text-sm font-semibold text-slate-800">Phone (optional)
                  <input type="tel" maxLength={40} value={profile.phone} onChange={(e) => updateProfile("phone", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" autoComplete="tel" />
                </label>
                <label className="block text-sm font-semibold text-slate-800">Province
                  <select value={profile.province} onChange={(e) => updateProfile("province", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200">
                    <option value="">Choose province</option>
                    {["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-800">Highest qualification / grade
                  <input maxLength={100} value={profile.highestQualification} onChange={(e) => updateProfile("highestQualification", e.target.value)} placeholder="Example: Matric, N4 or diploma" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
                </label>
                <label className="block text-sm font-semibold text-slate-800">Study interests (optional)
                  <textarea rows={3} maxLength={600} value={profile.studyInterests} onChange={(e) => updateProfile("studyInterests", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
                </label>
                <label className="block text-sm font-semibold text-slate-800">Employment / skills interests (optional)
                  <textarea rows={3} maxLength={600} value={profile.employmentInterests} onChange={(e) => updateProfile("employmentInterests", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
                </label>
                <label className="block text-sm font-semibold text-slate-800 md:col-span-2">Preferred location (optional)
                  <input maxLength={120} value={profile.preferredLocation} onChange={(e) => updateProfile("preferredLocation", e.target.value)} placeholder="City or area; avoid street or home address" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" />
                </label>
              </div>

              <fieldset className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <legend className="px-2 text-sm font-bold text-slate-950">Pathway preferences</legend>
                <p className="mb-4 text-sm leading-6 text-slate-600">You may select every relevant pathway. These preferences do not limit discovery.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PATHWAYS.map(([key, label]) => <label key={key} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={pathways.includes(key)} onChange={(e) => togglePathway(key, e.target.checked)} className="mt-1 h-4 w-4 accent-amber-600" /><span>{label}</span></label>)}
                </div>
              </fieldset>

              <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5" aria-labelledby="profile-consent-title">
                <h3 id="profile-consent-title" className="font-bold text-slate-950">Consent for profile processing</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{consent?.text || "Kingsmen will show the consent text from the profile service before saving your information."}</p>
                <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" required checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-amber-600" /><span>I have read and agree to the profile-processing consent above.</span></label>
                <p className="mt-3 text-xs leading-5 text-slate-600">Consent version: {consent?.version || "new consent will be recorded on save"} · Status: {consent?.status || "not loaded"} · Granted: {formatDate(consent?.grantedAt)}</p>
              </section>

              <div className="mt-6 flex flex-wrap gap-3">
                <button disabled={saving} className="public-button public-button-gold disabled:cursor-wait disabled:opacity-60" type="submit">{saving ? "Saving profile…" : "Save profile"} <span aria-hidden="true">→</span></button>
                <button disabled={saving || loading} className="public-button public-button-outline disabled:opacity-60" type="button" onClick={() => void loadProfile()} >Reload saved profile</button>
                {consentActive ? <button disabled={revoking} className="public-button public-button-outline disabled:opacity-60" type="button" onClick={() => void onRevokeConsent()}>{revoking ? "Withdrawing…" : "Withdraw consent"}</button> : null}
              </div>
            </form>

            {identityStatus === "PENDING_REVIEW" || identityStatus === "NOT_PROVISIONED" ? <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-slate-950">Identity verification boundary</h2><p className="mt-2 text-sm leading-6 text-slate-700">A new profile can be saved after the backend confirms your email. Until an authorised reviewer verifies the identity link, candidate-specific opportunity saving and personal-document workflows may remain unavailable. Kingsmen does not link a candidate by email equality and does not claim that an official provider application has been submitted.</p></aside> : null}

            {candidateReference ? <section className="candidate-doc-panel mt-6"><div className="candidate-subheading"><h2>Request a profile correction</h2><p>A correction request is queued for authorised review; it does not immediately overwrite the saved field.</p></div>
              <form onSubmit={onRequestCorrection} className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">Field to correct
                  <select value={correctionField} onChange={(e) => setCorrectionField(e.target.value as keyof ProfileFields)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal">
                    {PATHWAYS.length > 0 ? (Object.keys(blankProfile) as (keyof ProfileFields)[]).map((key) => <option key={key} value={key}>{({ displayName: "Display name", phone: "Phone", province: "Province", highestQualification: "Highest qualification", studyInterests: "Study interests", employmentInterests: "Employment interests", preferredLocation: "Preferred location" } as Record<keyof ProfileFields,string>)[key]}</option>) : null}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-800">Requested value
                  <input required value={correctionValue} onChange={(e) => setCorrectionValue(e.target.value)} maxLength={600} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-slate-800 md:col-span-2">Reason
                  <textarea required minLength={5} maxLength={800} value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal" />
                </label>
                <button disabled={submittingCorrection} className="public-button public-button-outline md:col-span-2 disabled:opacity-60" type="submit">{submittingCorrection ? "Submitting correction…" : "Submit correction request"}</button>
              </form>
              {corrections.length > 0 ? <div className="mt-5"><h3 className="font-bold text-slate-900">Correction history</h3><div className="mt-3 space-y-3">{corrections.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-slate-900">{item.field_name.replaceAll("_", " ")}</strong><span className="text-xs font-bold text-amber-700">{item.status}</span></div><p className="mt-2 text-sm text-slate-700">Requested: {item.requested_value}</p><p className="mt-1 text-xs text-slate-500">Submitted: {formatDate(item.requested_at)}</p></article>)}</div></div> : null}
            </section> : null}
          </>
        )}
      </div>
      <footer className="public-footer public-container"><a className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></a><span>Profile persistence is confirmed only by a successful backend response.</span></footer>
    </main>
  );
}
