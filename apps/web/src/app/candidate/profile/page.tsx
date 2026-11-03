"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "./candidate-profile.module.css";

const PATHWAYS = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
] as const;

const EMPTY_PROFILE = {
  displayName: "",
  phone: "",
  province: "",
  highestQualification: "",
  studyInterests: "",
  employmentInterests: "",
  preferredLocation: ""
};

type Profile = typeof EMPTY_PROFILE;
type CorrectionRequest = {
  id?: string;
  field_name?: string;
  old_value?: string | null;
  requested_value?: string;
  reason?: string;
  status?: string;
  requested_at?: string;
  decided_at?: string | null;
  decision_notes?: string | null;
};
type ProfileResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  profile?: Partial<Profile>;
  pathwayPreferences?: string[];
  consent?: { status?: string; version?: string | null; grantedAt?: string | null; text?: string };
  candidateReference?: string | null;
  identityStatus?: string;
  persistence?: string;
  savedAt?: string | null;
  correctionRequests?: CorrectionRequest[];
};

const CORRECTION_FIELDS = [
  ["displayName", "Display name"],
  ["phone", "Phone"],
  ["province", "Province"],
  ["highestQualification", "Highest qualification"],
  ["studyInterests", "Study interests"],
  ["employmentInterests", "Employment interests"],
  ["preferredLocation", "Preferred location"]
] as const;

function getAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

async function profileRequest(payload: Record<string, unknown>): Promise<ProfileResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Candidate profile is not configured for this deployment.");
  const token = getAccessToken();
  if (!token) throw new Error("Sign in first. Your authenticated session was not found in this browser.");

  const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/candidate-master-profile`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const result = await response.json() as ProfileResponse;
  if (!response.ok) throw new Error(result.error || result.message || result.code || `Profile request failed (${response.status}).`);
  return result;
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile>({ ...EMPTY_PROFILE });
  const [pathwayPreferences, setPathwayPreferences] = useState<string[]>([]);
  const [consentText, setConsentText] = useState("");
  const [consentStatus, setConsentStatus] = useState("NOT_CHECKED");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [candidateReference, setCandidateReference] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState("NOT_CHECKED");
  const [persistence, setPersistence] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [correctionField, setCorrectionField] = useState("displayName");
  const [correctionValue, setCorrectionValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [requestingCorrection, setRequestingCorrection] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const applyResponse = useCallback((result: ProfileResponse) => {
    setProfile({ ...EMPTY_PROFILE, ...(result.profile ?? {}) });
    setPathwayPreferences(Array.isArray(result.pathwayPreferences) ? result.pathwayPreferences : []);
    setConsentText(result.consent?.text ?? "");
    setConsentStatus(result.consent?.status ?? "UNKNOWN");
    setConsentAccepted(result.consent?.status === "ACTIVE");
    setCandidateReference(result.candidateReference ?? null);
    setIdentityStatus(result.identityStatus ?? "UNKNOWN");
    setPersistence(result.persistence ?? "");
    setSavedAt(result.savedAt ?? null);
    setCorrectionRequests(Array.isArray(result.correctionRequests) ? result.correctionRequests : []);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await profileRequest({ action: "load" });
      applyResponse(result);
      setMessage(result.message ?? "Profile loaded from the candidate profile service.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the candidate profile.");
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(current => ({ ...current, [key]: value }));
  }

  function togglePathway(code: string, checked: boolean) {
    setPathwayPreferences(current => checked
      ? [...new Set([...current, code])]
      : current.filter(item => item !== code));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!consentAccepted) {
      setError("Accept the profile-processing consent statement before saving.");
      return;
    }
    if (pathwayPreferences.length === 0) {
      setError("Choose at least one pathway interest. All six pathways remain discoverable regardless of package.");
      return;
    }

    setSaving(true);
    try {
      const result = await profileRequest({
        action: "save",
        profile: {
          displayName: profile.displayName.trim(),
          phone: profile.phone.trim(),
          province: profile.province,
          highestQualification: profile.highestQualification.trim(),
          studyInterests: profile.studyInterests.trim(),
          employmentInterests: profile.employmentInterests.trim(),
          preferredLocation: profile.preferredLocation.trim()
        },
        pathwayPreferences,
        consentAccepted: true
      });
      applyResponse(result);
      setMessage(result.message ?? "Profile response received.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The profile was not confirmed as saved.");
    } finally {
      setSaving(false);
    }
  }

  async function withdrawConsent() {
    if (!window.confirm("Withdraw consent for profile-processing support? Your saved profile will be preserved, but consent-dependent services may be restricted.")) return;
    setError("");
    setMessage("");
    setWithdrawing(true);
    try {
      const result = await profileRequest({ action: "revoke_consent" });
      setConsentStatus(result.consent?.status ?? "REVOKED");
      setConsentAccepted(false);
      setMessage(result.message ?? "Consent withdrawal was recorded by the profile service.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Consent withdrawal was not confirmed.");
    } finally {
      setWithdrawing(false);
    }
  }

  async function requestCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setRequestingCorrection(true);
    try {
      const result = await profileRequest({
        action: "request_correction",
        fieldName: correctionField,
        requestedValue: correctionValue.trim(),
        reason: correctionReason.trim()
      });
      if (result.ok) {
        const confirmation = result.message ?? "Correction request recorded.";
        setCorrectionValue("");
        setCorrectionReason("");
        await loadProfile();
        setMessage(confirmation);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Correction request was not confirmed.");
    } finally {
      setRequestingCorrection(false);
    }
  }

  const profileIsProvisioned = persistence === "SUPABASE_BACKEND" && Boolean(candidateReference);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Candidate profile navigation">
          <a className={styles.brand} href="/" aria-label="Kingsmen Portal home">
            <span className={styles.mark} aria-hidden="true">K</span>
            <span><strong>KINGSMEN</strong><small>YOUR OPPORTUNITY, CONNECTED</small></span>
          </a>
          <div className={styles.navLinks}>
            <a href="/candidate/dashboard">Candidate dashboard</a>
            <a href="/candidate/workbench">Application workbench</a>
            <a href="/packages/">Packages</a>
          </div>
        </nav>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Candidate profile · Consent and preferences</p>
          <h1>Your reusable Kingsmen profile.</h1>
          <p className={styles.lead}>
            Maintain one profile for your Kingsmen pathway journey. The profile service stores updates in Supabase when it confirms a save;
            identity verification and access to sensitive documents remain separate, review-controlled steps.
          </p>
          <div className={styles.status} aria-live="polite">
            <strong>Service status:</strong> {loading ? "Loading profile…" : persistence === "SUPABASE_BACKEND" ? "Supabase profile persistence confirmed by the service" : persistence === "NOT_PROVISIONED" ? "No saved profile confirmed yet" : consentStatus === "NOT_CHECKED" ? "Waiting for profile service" : "Profile state requires service confirmation"}.
            {candidateReference && <> <br /><strong>Candidate reference:</strong> {candidateReference}</>}
            {identityStatus !== "NOT_CHECKED" && <> <br /><strong>Identity review:</strong> {identityStatus.replaceAll("_", " ")}</>}
            {savedAt && <> <br /><strong>Last saved:</strong> {new Date(savedAt).toLocaleString()}</>}
          </div>
          {message && <div className={styles.status} role="status">{message}</div>}
          {error && <div className={styles.error} role="alert">{error}</div>}
        </header>

        <form className={styles.formPanel} onSubmit={saveProfile}>
          <h2>Profile details</h2>
          <p className={styles.intro}>Do not enter a South African ID number or upload identity documents in this form. Use the private document workflow for documents.</p>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="display-name">Display name *</label>
              <input id="display-name" required minLength={2} maxLength={120} autoComplete="name" value={profile.displayName} onChange={e => updateField("displayName", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" inputMode="tel" autoComplete="tel" maxLength={40} value={profile.phone} onChange={e => updateField("phone", e.target.value)} placeholder="+27…" />
              <span className={styles.hint}>Use a reachable number. Email remains Kingsmen’s primary service communication channel.</span>
            </div>
            <div className={styles.field}>
              <label htmlFor="province">Province</label>
              <select id="province" value={profile.province} onChange={e => updateField("province", e.target.value)}>
                <option value="">Choose province</option>
                {["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="highest-qualification">Highest qualification</label>
              <input id="highest-qualification" maxLength={100} value={profile.highestQualification} onChange={e => updateField("highestQualification", e.target.value)} placeholder="e.g. Matric / NQF qualification" />
            </div>
            <div className={styles.field}>
              <label htmlFor="preferred-location">Preferred location</label>
              <input id="preferred-location" maxLength={120} value={profile.preferredLocation} onChange={e => updateField("preferredLocation", e.target.value)} placeholder="Town, municipality or province" />
            </div>
            <div className={styles.field}>
              <label htmlFor="study-interests">Study interests</label>
              <textarea id="study-interests" maxLength={600} value={profile.studyInterests} onChange={e => updateField("studyInterests", e.target.value)} placeholder="Fields of study, qualification goals or preferred programmes" />
            </div>
            <div className={styles.field}>
              <label htmlFor="employment-interests">Employment interests</label>
              <textarea id="employment-interests" maxLength={600} value={profile.employmentInterests} onChange={e => updateField("employmentInterests", e.target.value)} placeholder="Roles, sectors, skills or workplace goals" />
            </div>
          </div>

          <div className={styles.section} style={{ marginTop: 24 }}>
            <h2>Pathway interests</h2>
            <p className={styles.intro}>These preferences help tailor guidance. They do not restrict discovery based on your service package.</p>
            <div className={styles.pathwayGrid}>
              {PATHWAYS.map(([code, label]) => (
                <label className={styles.checkLabel} key={code}>
                  <input type="checkbox" checked={pathwayPreferences.includes(code)} onChange={e => togglePathway(code, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <section className={styles.consent} aria-labelledby="consent-heading">
            <h3 id="consent-heading">Profile-processing consent</h3>
            <p>{consentText || "Load your profile to retrieve the current consent statement from Kingsmen."}</p>
            <label>
              <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} />
              <span>I have read the consent statement above and agree to profile processing for the purposes described.</span>
            </label>
            <p className={styles.hint}>Consent is recorded by the profile service with a versioned statement. Withdrawing consent preserves the saved profile but can restrict services that depend on it.</p>
          </section>

          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={saving || loading}>{saving ? "Saving profile…" : "Save profile to Kingsmen"}</button>
            <button className={styles.buttonSecondary} type="button" onClick={() => void loadProfile()} disabled={loading || saving}>{loading ? "Reloading…" : "Reload saved profile"}</button>
            {consentStatus === "ACTIVE" && profileIsProvisioned && (
              <button className={styles.buttonSecondary} type="button" onClick={() => void withdrawConsent()} disabled={withdrawing || saving}>{withdrawing ? "Withdrawing consent…" : "Withdraw consent"}</button>
            )}
          </div>
        </form>

        {profileIsProvisioned && (
          <section className={styles.formPanel} style={{ marginTop: 18 }}>
            <h2>Request a correction</h2>
            <p className={styles.intro}>Correction requests are stored for authorised review. Sending a request does not overwrite the saved profile.</p>
            <form onSubmit={requestCorrection}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="correction-field">Profile field</label>
                  <select id="correction-field" value={correctionField} onChange={e => setCorrectionField(e.target.value)}>
                    {CORRECTION_FIELDS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="correction-value">Requested value</label>
                  <input id="correction-value" required maxLength={600} value={correctionValue} onChange={e => setCorrectionValue(e.target.value)} />
                </div>
                <div className={`${styles.field} ${styles.wide}`}>
                  <label htmlFor="correction-reason">Reason for correction</label>
                  <textarea id="correction-reason" required minLength={5} maxLength={800} value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} />
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.buttonSecondary} type="submit" disabled={requestingCorrection || loading}>{requestingCorrection ? "Submitting request…" : "Submit correction request"}</button>
              </div>
            </form>
            {correctionRequests.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <h3>Recent correction requests</h3>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {correctionRequests.map((item, index) => (
                    <article key={item.id ?? `${item.field_name}-${index}`} className={styles.status}>
                      <strong>{CORRECTION_FIELDS.find(([key]) => key === item.field_name)?.[1] ?? item.field_name ?? "Profile field"}</strong>
                      <span> · {item.status ?? "STATUS UNKNOWN"}</span>
                      <p>Requested: {item.requested_value || "—"}</p>
                      <p>Reason: {item.reason || "—"}</p>
                      <p>Review status is supplied by the profile service; the saved profile is not changed until authorised review completes.</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className={styles.footer}>
          <span>© Kingsmen Portal · South Africa</span>
          <span>Only the signed-in account’s profile is requested. Identity review, source verification and provider outcomes are separate decisions.</span>
        </footer>
      </div>
    </main>
  );
}
