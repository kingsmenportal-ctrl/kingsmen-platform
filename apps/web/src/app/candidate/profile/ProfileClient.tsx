"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Field = {
  id: string; field_name: string; proposed_value: string | null; value_summary: string;
  source_type: string; confidence_band: string; candidate_confirmed: boolean;
  operator_review_required: boolean; accepted_into_profile: boolean; created_at: string;
};
type Correction = {
  id: string; field_name: string; requested_value: string; reason: string;
  sensitivity: string; status: string; requested_at: string; decision_notes?: string | null;
};
type Identity = {
  candidateId: string; email: string; authStatus: string; emailVerified: boolean;
  identityLinkVerified: boolean; accountRecoveryRequired: boolean;
};
type Payload = { ok: boolean; error?: string; fields?: Field[]; correctionRequests?: Correction[]; identity?: Identity; };

const fieldOptions = [
  ["displayName", "Display name"], ["preferredName", "Preferred name"], ["phone", "Phone number"],
  ["email", "Email address"], ["address", "Street address"], ["city", "City"],
  ["province", "Province"], ["postalCode", "Postal code"], ["dateOfBirth", "Date of birth"],
  ["idNumber", "Identity number"], ["legalName", "Legal name"], ["highestGrade", "Highest grade"],
  ["qualificationSummary", "Qualification summary"], ["academicResults", "Academic results"],
  ["bankName", "Bank name"], ["bankAccount", "Bank account"]
] as const;

function accessToken(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const normalized = raw.startsWith("base64-") ? atob(raw.slice(7)) : raw;
        const parsed = JSON.parse(normalized) as { access_token?: unknown };
        if (typeof parsed.access_token === "string" && parsed.access_token.length > 20) return parsed.access_token;
      } catch { /* Ignore unrelated local storage entries. */ }
    }
  } catch { return null; }
  return null;
}

export default function ProfileClient() {
  const [token, setToken] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [requests, setRequests] = useState<Correction[]>([]);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [fieldName, setFieldName] = useState<string>("displayName");
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setToken(accessToken()); setLoading(false); }, []);

  const load = useCallback(async () => {
    const current = token || accessToken();
    if (!current) { setMessage("Sign in to view your private profile."); setLoading(false); return; }
    setLoading(true);
    try {
      const headers = { authorization: `Bearer ${current}` };
      const [profileResponse, identityResponse] = await Promise.all([
        fetch("/api/candidate/profile", { headers, cache: "no-store" }),
        fetch("/api/candidate/identity", { headers, cache: "no-store" })
      ]);
      const [profile, identityResult] = await Promise.all([profileResponse.json() as Promise<Payload>, identityResponse.json() as Promise<Payload>]);
      if (!profileResponse.ok || !profile.ok) throw new Error(profile.error || "Could not load profile.");
      if (!identityResponse.ok || !identityResult.ok || !identityResult.identity) throw new Error(identityResult.error || "Could not verify account identity.");
      setFields(profile.fields || []);
      setRequests(profile.correctionRequests || []);
      setIdentity(identityResult.identity);
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load profile."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (token) void load(); }, [token, load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = token || accessToken();
    if (!current) { setMessage("Sign in before requesting a correction."); return; }
    setSaving(true); setMessage("Recording correction request…");
    try {
      const response = await fetch("/api/candidate/profile", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${current}` },
        body: JSON.stringify({ fieldName, requestedValue, reason })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Correction request failed.");
      setRequestedValue(""); setReason("");
      setMessage(result.message || "Correction request recorded. Current profile unchanged.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Correction request failed."); }
    finally { setSaving(false); }
  }

  return <section aria-label="Candidate profile workspace">
    {message && <p role="status" style={{ border: "1px solid #777", padding: 12, borderRadius: 8 }}>{message}</p>}
    {loading ? <p>Loading private profile…</p> : <>
      <section style={{ border: "1px solid #555", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h2>Identity link</h2>
        {identity ? <>
          <p><strong>Candidate reference:</strong> {identity.candidateId}</p>
          <p><strong>Account email:</strong> {identity.email}</p>
          <p><strong>Account status:</strong> {identity.authStatus}</p>
          <p><strong>Email verified:</strong> {identity.emailVerified ? "Yes" : "Not confirmed"}</p>
          <p><strong>Candidate record linked:</strong> {identity.identityLinkVerified ? "Yes — authenticated user ID matched one record" : "Needs authorised review"}</p>
          {identity.accountRecoveryRequired && <p>Account recovery requires attention.</p>}
        </> : <p>Identity status is not available.</p>}
      </section>
      <section style={{ border: "1px solid #555", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h2>Evidence-backed profile fields</h2>
        {fields.length === 0 ? <p>No profile field evidence is linked yet. Use the correction request form below to ask for a field to be added or corrected.</p> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {fields.map(field => <article key={field.id} style={{ border: "1px solid #444", borderRadius: 8, padding: 12 }}>
              <h3>{field.field_name}</h3>
              <p>{field.proposed_value || field.value_summary || "No display value recorded"}</p>
              <p>Source: {field.source_type} · Confidence: {field.confidence_band}</p>
              <p>Candidate confirmed: {field.candidate_confirmed ? "Yes" : "No"} · Operator review: {field.operator_review_required ? "Required" : "Not flagged"}</p>
              <p>Accepted into profile: {field.accepted_into_profile ? "Yes" : "No"}</p>
            </article>)}
          </div>}
      </section>
      <section style={{ border: "1px solid #555", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h2>Request a correction</h2>
        <p>Legal identity, finance, and academic changes are held for authorised review. Submitting a request does not change your current profile.</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 680 }}>
          <label>Field to correct<select value={fieldName} onChange={event => setFieldName(event.target.value)} style={{ display: "block", width: "100%", padding: 10 }}>
            {fieldOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>Correct value<textarea required maxLength={2000} value={requestedValue} onChange={event => setRequestedValue(event.target.value)} rows={3} style={{ display: "block", width: "100%", padding: 10 }} /></label>
          <label>Reason for correction<textarea required minLength={8} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} rows={3} style={{ display: "block", width: "100%", padding: 10 }} /></label>
          <button type="submit" disabled={saving} style={{ padding: 12 }}>{saving ? "Submitting…" : "Submit correction for review"}</button>
        </form>
      </section>
      <section style={{ border: "1px solid #555", borderRadius: 12, padding: 16 }}>
        <h2>Correction history</h2>
        {requests.length === 0 ? <p>No correction requests recorded.</p> : <div style={{ display: "grid", gap: 10 }}>
          {requests.map(item => <article key={item.id} style={{ border: "1px solid #444", borderRadius: 8, padding: 12 }}>
            <h3>{item.field_name} — {item.status}</h3>
            <p>Requested value: {item.requested_value}</p><p>Reason: {item.reason}</p>
            <p>Review class: {item.sensitivity} · Requested: {new Date(item.requested_at).toLocaleString()}</p>
            {item.decision_notes && <p>Reviewer notes: {item.decision_notes}</p>}
          </article>)}
        </div>}
      </section>
    </>}
  </section>;
}
