"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = {
  fullName?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  location?: string;
  highestEducation?: string;
  workExperience?: string;
  skills?: string;
  notes?: string;
};
const fields: Array<{ key: keyof Profile; label: string; required?: boolean; type?: string; hint?: string }> = [
  { key: "fullName", label: "Full name", required: true },
  { key: "email", label: "Email address", required: true, type: "email" },
  { key: "phone", label: "Phone number", required: true, type: "tel" },
  { key: "location", label: "Town / city", hint: "Used to help identify relevant local opportunities." },
  { key: "idNumber", label: "Identity number", hint: "Optional. Only provide it if your application workflow requires it." },
  { key: "highestEducation", label: "Highest education" },
  { key: "skills", label: "Skills", hint: "Separate skills with commas." },
  { key: "workExperience", label: "Work experience", hint: "Describe only real experience; do not add qualifications you do not have." },
  { key: "notes", label: "Additional notes" },
];

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<Profile>({ location: "Johannesburg" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/personal-jobs/apply-now", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Please sign in to manage your private profile." : (data.error || "Profile could not be loaded."));
        if (active) setProfile(data.profile && typeof data.profile === "object" ? data.profile : { location: "Johannesburg" });
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Profile could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function update(key: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!profile.fullName?.trim() || !profile.email?.trim() || !profile.phone?.trim()) {
      setError("Full name, email and phone number are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/personal-jobs/apply-now", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "saveProfile", profile }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== "SAVED") throw new Error(typeof data.error === "string" ? data.error : "Your profile could not be saved.");
      setProfile(data.store?.profile ?? profile);
      setMessage("Profile saved. Your candidate workspace has been updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: 10, font: "inherit", color: "#172033", background: "#fff" };
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px 64px", color: "#172033" }}>
      <a href="/candidate/dashboard" style={{ color: "#1d5675", fontWeight: 800, textDecoration: "none", fontSize: 14 }}>← Candidate dashboard</a>
      <header style={{ margin: "22px 0 26px" }}>
        <p style={{ color: "#53657a", fontSize: 12, fontWeight: 800, letterSpacing: 1.8, margin: "0 0 8px" }}>CANDIDATE ACCOUNT</p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 42px)", margin: "0 0 10px" }}>My profile</h1>
        <p style={{ color: "#53657a", lineHeight: 1.7, maxWidth: 700, margin: 0 }}>Keep your contact details and experience accurate. Kingsmen uses these details to prepare application drafts; saving your profile does not submit an application.</p>
      </header>

      {error && <div role="alert" style={{ background: "#fff1f0", border: "1px solid #fecaca", color: "#8a1c13", borderRadius: 12, padding: 14, marginBottom: 18 }}>{error}</div>}
      {message && <div role="status" style={{ background: "#eaf8f0", border: "1px solid #b7e4ca", color: "#176345", borderRadius: 12, padding: 14, marginBottom: 18 }}>{message}</div>}
      {loading ? <p role="status">Loading your private profile…</p> : <form onSubmit={submit} style={{ border: "1px solid #dbe3ec", borderRadius: 18, padding: "clamp(18px, 4vw, 30px)", background: "#fff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
          {fields.map((field) => <label key={field.key} style={{ display: "block", fontWeight: 700, fontSize: 14, gridColumn: field.key === "workExperience" || field.key === "notes" ? "1 / -1" : undefined }}>
            <span>{field.label}{field.required && <span aria-hidden="true"> *</span>}</span>
            {field.key === "workExperience" || field.key === "notes" ? <textarea value={profile[field.key] ?? ""} onChange={(event) => update(field.key, event.target.value)} rows={4} maxLength={5000} style={{ ...inputStyle, display: "block", marginTop: 7, resize: "vertical" }} /> : <input type={field.type ?? "text"} value={profile[field.key] ?? ""} onChange={(event) => update(field.key, event.target.value)} required={field.required} maxLength={field.key === "idNumber" ? 32 : 500} autoComplete={field.key === "fullName" ? "name" : field.key === "email" ? "email" : field.key === "phone" ? "tel" : "off"} style={{ ...inputStyle, display: "block", marginTop: 7 }} />}
            {field.hint && <span style={{ display: "block", fontSize: 12, lineHeight: 1.5, color: "#64748b", fontWeight: 400, marginTop: 6 }}>{field.hint}</span>}
          </label>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5, margin: 0 }}>Only save information you are comfortable storing in your candidate workspace.</p>
          <button type="submit" disabled={saving} style={{ border: 0, borderRadius: 11, background: saving ? "#64748b" : "#172f46", color: "#fff", padding: "13px 20px", fontWeight: 800, cursor: saving ? "wait" : "pointer" }}>{saving ? "Saving…" : "Save profile"}</button>
        </div>
      </form>}
    </main>
  );
}
