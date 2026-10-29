"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getCandidateAccessToken } from "../../../lib/candidate-session";

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
type CorrectionRequest = { id: string; field_name: string; old_value: string | null; requested_value: string; reason: string; status: string; requested_at: string; decided_at?: string | null; decision_notes?: string | null };
type ProfileResponse = {
  ok: boolean;
  profile?: Partial<Profile>;
  pathwayPreferences?: string[];
  consent?: Consent;
  completeness?: { percent: number; completed: number; required: number; missing?: string[] };
  savedAt?: string | null;
  error?: string;
  code?: string;
  correctionRequests?: CorrectionRequest[];
  correctionRequest?: CorrectionRequest;
  candidateReference?: string | null;
  identityStatus?: "VERIFIED" | "PENDING_REVIEW" | "NOT_PROVISIONED";
  persistence?: "SUPABASE_BACKEND" | "NOT_PROVISIONED";
  message?: string;
  profilePreserved?: boolean;
};
const EMPTY: Profile = {
  displayName: "", phone: "", province: "", highestQualification: "",
  studyInterests: "", employmentInterests: "", preferredLocation: ""
};
const fieldLabels: Record<string,string> = {
  displayName: "Preferred / full name",
  province: "Province",
  highestQualification: "Highest qualification",
  pathwayPreferences: "At least one pathway"
};
function readError(body: ProfileResponse) {
  return body.code && body.error ? `${body.code}: ${body.error}` : body.error || body.message || "Profile request failed.";
}
export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [pathways, setPathways] = useState<string[]>([]);
  const [consent, setConsent] = useState<Consent>({ status: "NOT_RECORDED" });
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [candidateReference, setCandidateReference] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState<"VERIFIED" | "PENDING_REVIEW" | "NOT_PROVISIONED">("NOT_PROVISIONED");
  const [lastLoad, setLastLoad] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [correctionField, setCorrectionField] = useState<keyof Profile>("displayName");
  const [correctionValue, setCorrectionValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const request = useCallback(async (payload: Record<string, unknown>) => {
    const token = getCandidateAccessToken();
    if (!token) throw new Error("AUTHENTICATION_REQUIRED: Sign in to read or save your profile.");
    const response = await fetch("/api/candidate/profile", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload), cache: "no-store"
    });
    const body = await response.json() as ProfileResponse;
    if (!response.ok || body.ok !== true) throw new Error(readError(body));
    return body;
  }, []);

  const load = useCallback(async (preserveDraft = false) => {
    setLoading(true);
    setError("");
    try {
      const body = await request({ action: "load" });
      if (!preserveDraft) {
        setProfile({ ...EMPTY, ...(body.profile ?? {}) });
        setPathways(Array.isArray(body.pathwayPreferences) ? body.pathwayPreferences : []);
        setConsentChecked(body.consent?.status === "ACTIVE");
        setIsDirty(false);
      }
      setConsent(body.consent ?? { status: "NOT_RECORDED" });
      setCorrections(Array.isArray(body.correctionRequests) ? body.correctionRequests : []);
      setSavedAt(typeof body.savedAt === "string" ? body.savedAt : null);
      setCandidateReference(typeof body.candidateReference === "string" ? body.candidateReference : null);
      setIdentityStatus(body.identityStatus === "VERIFIED" || body.identityStatus === "PENDING_REVIEW" ? body.identityStatus : "NOT_PROVISIONED");
      setLastLoad(new Date().toISOString());
      setNotice(preserveDraft ? "Saved backend information reloaded. Unsaved edits were kept." : body.persistence === "NOT_PROVISIONED" ? "No backend profile exists yet. Complete consent, enter your name and save to create it." : body.identityStatus === "PENDING_REVIEW" ? "Loaded your saved profile. Identity review remains pending; sensitive records and personalised matching stay locked." : "Loaded current profile from the Kingsmen backend.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(old => ({ ...old, [key]: value }));
    setIsDirty(true);
  }
  function togglePathway(value: string) {
    setPathways(old => old.includes(value) ? old.filter(x => x !== value) : [...old, value]);
    setIsDirty(true);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const body = await request({ action: "save", profile, pathwayPreferences: pathways, consentAccepted: consentChecked });
      setProfile({ ...EMPTY, ...(body.profile ?? {}) });
      setPathways(Array.isArray(body.pathwayPreferences) ? body.pathwayPreferences : pathways);
      setConsent(body.consent ?? { status: "ACTIVE" });
      setConsentChecked(body.consent?.status === "ACTIVE");
      setSavedAt(typeof body.savedAt === "string" ? body.savedAt : null);
      setCandidateReference(typeof body.candidateReference === "string" ? body.candidateReference : candidateReference);
      setIdentityStatus(body.identityStatus === "VERIFIED" || body.identityStatus === "PENDING_REVIEW" ? body.identityStatus : "NOT_PROVISIONED");
      setIsDirty(false);
      setNotice(body.message || "Profile saved to the backend.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile save failed. Your previous backend data has not been intentionally erased.");
    } finally {
      setSaving(false);
    }
  }
  async function submitCorrection() {
    setSubmittingCorrection(true); setError(""); setNotice("");
    try {
      const body = await request({ action: "request_correction", fieldName: correctionField, requestedValue: correctionValue, reason: correctionReason });
      if (body.correctionRequest) setCorrections(old => [body.correctionRequest as CorrectionRequest, ...old]);
      setCorrectionValue(""); setCorrectionReason("");
      setNotice(body.message || "Correction request submitted for authorised review.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Correction request could not be saved.");
    } finally { setSubmittingCorrection(false); }
  }

  async function revokeConsent() {
    if (!window.confirm("Withdraw profile-processing consent? Your saved profile will be preserved, but consent-dependent processing may be restricted.")) return;
    setRevoking(true); setError(""); setNotice("");
    try {
      const body = await request({ action: "revoke_consent" });
      setConsent(body.consent ?? { status: "REVOKED" });
      setConsentChecked(false);
      setNotice(body.message || "Consent withdrawn. Saved profile data is preserved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Consent withdrawal could not be recorded.");
    } finally {
      setRevoking(false);
    }
  }

  const completeness = useMemo(() => {
    const checks = [
      Boolean(profile.displayName.trim()),
      Boolean(profile.province.trim()),
      Boolean(profile.highestQualification.trim()),
      pathways.length > 0
    ];
    const completed = checks.filter(Boolean).length;
    return { completed, required: checks.length, percent: Math.round(completed / checks.length * 100) };
  }, [profile.displayName, profile.province, profile.highestQualification, pathways]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">My candidate profile</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">One saved profile supports all six pathways. Your information is reloaded from Supabase after a refresh or a new sign-in; it is not stored as the authoritative profile in this browser.</p>
          <nav aria-label="Candidate navigation" className="mt-5 flex flex-wrap gap-3 text-sm">
            <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
            <a href="/candidate/opportunity-matches" className="rounded-xl border border-slate-700 px-4 py-2">Opportunities</a>
            <a href="/candidate/applications" className="rounded-xl border border-slate-700 px-4 py-2">Application tracker</a>
            <a href="/candidate/documents" className="rounded-xl border border-slate-700 px-4 py-2">Document Vault</a>
          </nav>
        </header>

        {error && <section role="alert" className="rounded-2xl border border-red-800 bg-red-950/50 p-4 text-sm leading-6 text-red-100">{error}{error.includes("AUTHENTICATION_REQUIRED") && <p className="mt-2"><a href="/candidate/login" className="underline">Sign in / create account</a></p>}{(error.includes("IDENTITY_NOT_VERIFIED") || error.includes("IDENTITY_REVIEW_REQUIRED")) && <p className="mt-2">Do not create duplicate candidate records or link accounts by email. <a href="/candidate/identity-review" className="underline">Open identity review</a> to continue with authorised human assistance.</p>}</section>}
        {notice && <p role="status" className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm leading-6 text-slate-200">{notice}</p>}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold">Profile completeness</h2><p className="mt-1 text-sm text-slate-400">Required fields: name, province, highest qualification and at least one pathway.</p></div>
            <p className="text-2xl font-black tabular-nums">{completeness.percent}%</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Profile completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completeness.percent}>
            <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${completeness.percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">{completeness.completed} of {completeness.required} required profile checks complete. This measures completeness, not eligibility or verification.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">Consent: {consent.status === "ACTIVE" ? "Granted" : consent.status === "REVOKED" ? "Withdrawn" : "Not recorded"}</span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">Identity: {identityStatus === "VERIFIED" ? "Reviewer verified" : identityStatus === "PENDING_REVIEW" ? "Pending human review" : "Not yet created"}</span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">Backend save: {savedAt ? new Date(savedAt).toLocaleString() : "No saved profile timestamp"}</span>
            {isDirty && <span className="rounded-full border border-amber-700 px-3 py-1 text-xs text-amber-200">Unsaved changes</span>}
          </div>
          {candidateReference && <p className="mt-4 break-all rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm">Your Kingsmen candidate reference: <strong>{candidateReference}</strong>. Keep it available for your identity-review request. A pending identity review does not unlock documents or confirm your identity.</p>}
          {identityStatus === "PENDING_REVIEW" && <p className="mt-3 text-sm leading-6 text-amber-200">Your own newly created profile can be edited while the link is pending. Personal documents, personalised opportunity matches and access to any older candidate record remain locked until an authorised reviewer verifies the link.</p>}
        </section>

        <form onSubmit={save} className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">Profile details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Do not enter a national ID number, bank details or sensitive document content in this form. Store actual documents only in the private Document Vault.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Preferred / full name
                <input required minLength={2} maxLength={120} autoComplete="name" value={profile.displayName} onChange={e=>setField("displayName",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
              </label>
              <label className="block text-sm font-semibold">Phone (optional)
                <input type="tel" maxLength={40} autoComplete="tel" value={profile.phone} onChange={e=>setField("phone",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
              </label>
              <label className="block text-sm font-semibold">Province
                <select required value={profile.province} onChange={e=>setField("province",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal">
                  <option value="">Select province</option>{["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"].map(x=><option key={x}>{x}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">Highest qualification
                <select required value={profile.highestQualification} onChange={e=>setField("highestQualification",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal">
                  <option value="">Select qualification</option>{["Below Grade 12","Grade 12 / Matric","N1–N6 / Technical","Certificate","Diploma","Degree","Postgraduate","Other / prefer to explain"].map(x=><option key={x}>{x}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold sm:col-span-2">Study interests (optional)
                <textarea maxLength={600} rows={3} value={profile.studyInterests} onChange={e=>setField("studyInterests",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
              </label>
              <label className="block text-sm font-semibold sm:col-span-2">Employment interests (optional)
                <textarea maxLength={600} rows={3} value={profile.employmentInterests} onChange={e=>setField("employmentInterests",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
              </label>
              <label className="block text-sm font-semibold sm:col-span-2">Preferred location (optional)
                <input maxLength={120} value={profile.preferredLocation} onChange={e=>setField("preferredLocation",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
              </label>
            </div>
          </section>

          <fieldset className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <legend className="px-2 text-xl font-bold">Pathway preferences</legend>
            <p className="text-sm leading-6 text-slate-400">Preferences help organise discovery. They do not restrict your access to the national opportunity catalogue and do not guarantee eligibility.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PATHWAYS.map(([value,label])=><label key={value} className="flex items-start gap-3 rounded-xl border border-slate-700 p-4 text-sm hover:border-cyan-700">
                <input type="checkbox" checked={pathways.includes(value)} onChange={()=>togglePathway(value)} className="mt-1 h-4 w-4 accent-cyan-300" />
                <span>{label}</span>
              </label>)}
            </div>
          </fieldset>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">Consent and data use</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Kingsmen stores your profile in Supabase to support the unified candidate journey: profile management, opportunity discovery and application preparation. Identity verification, document review and provider decisions remain separate. The consent wording and version are recorded with your consent event.</p>
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-700 p-4 text-sm leading-6">
              <input type="checkbox" required checked={consentChecked} onChange={e=>{setConsentChecked(e.target.checked);setIsDirty(true);}} className="mt-1 h-4 w-4 accent-cyan-300" />
              <span>I consent to the profile processing described above. I understand I can withdraw consent and request access, correction or deletion through Kingsmen’s privacy process. I understand withdrawal may restrict consent-dependent services.</span>
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-400">Profile details are not used to automatically approve admission, funding, employment, identity or documents. Avoid entering sensitive details not needed for this profile.</p>
            {consent.status === "ACTIVE" && <button type="button" onClick={revokeConsent} disabled={revoking} className="mt-4 rounded-xl border border-red-800 px-4 py-2 text-sm text-red-200 disabled:opacity-50">{revoking ? "Withdrawing consent…" : "Withdraw profile-processing consent"}</button>}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold">Request a profile correction</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">A correction request creates a review record; it does not overwrite your saved profile. An authorised reviewer must decide it. This is useful where a field needs a documented correction rather than a direct self-service edit.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Field to review
                <select value={correctionField} onChange={e=>setCorrectionField(e.target.value as keyof Profile)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal">
                  <option value="displayName">Name</option><option value="phone">Phone</option><option value="province">Province</option>
                  <option value="highestQualification">Highest qualification</option><option value="studyInterests">Study interests</option>
                  <option value="employmentInterests">Employment interests</option><option value="preferredLocation">Preferred location</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">Requested value
                <input required maxLength={600} value={correctionValue} onChange={e=>setCorrectionValue(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
              </label>
              <label className="block text-sm font-semibold sm:col-span-2">Reason for correction
                <textarea required minLength={5} maxLength={800} rows={3} value={correctionReason} onChange={e=>setCorrectionReason(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-normal" />
              </label>
            </div>
            <button type="button" onClick={()=>void submitCorrection()} disabled={submittingCorrection || !correctionValue.trim() || correctionReason.trim().length<5} className="mt-4 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold disabled:opacity-50">{submittingCorrection?"Submitting request…":"Submit correction request"}</button>
            <div className="mt-6 border-t border-slate-700 pt-4">
              <h3 className="font-semibold">Correction request history</h3>
              {corrections.length === 0 ? <p className="mt-2 text-sm text-slate-400">No correction requests are currently recorded for this candidate profile.</p> : <ol className="mt-3 space-y-3">{corrections.map(item=><li key={item.id} className="rounded-xl border border-slate-700 p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><strong>{item.field_name}</strong><span className="rounded-full border border-slate-600 px-2 py-1 text-xs">{item.status}</span></div>
                <p className="mt-2"><strong>Requested:</strong> {item.requested_value}</p><p className="mt-1 text-slate-400">{item.reason}</p>
                <p className="mt-2 text-xs text-slate-500">Created {new Date(item.requested_at).toLocaleString()}{item.decided_at ? ` · Decided ${new Date(item.decided_at).toLocaleString()}` : ""}</p>
                {item.decision_notes && <p className="mt-2 text-slate-300"><strong>Reviewer note:</strong> {item.decision_notes}</p>}
              </li>)}</ol>}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving || loading || !consentChecked} className="rounded-xl bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving to Supabase…" : "Save profile"}</button>
            <button type="button" disabled={loading} onClick={()=>void load(true)} className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold disabled:opacity-50">{loading ? "Reloading…" : "Reload from backend"}</button>
            <button type="button" disabled={loading||!lastLoad} onClick={()=>void load(false)} className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold disabled:opacity-50">Discard local edits & reload</button>
          </div>
          {lastLoad && <p className="text-xs text-slate-500">Last successful backend read: {new Date(lastLoad).toLocaleString()}</p>}
        </form>
      </div>
    </main>
  );
}
