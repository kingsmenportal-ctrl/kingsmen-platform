"use client";

import { useMemo, useState } from "react";

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRoles: string;
  skills: string;
  education: string;
  experienceSummary: string;
  cvText: string;
};

type PackOutput = {
  status?: string;
  generatedAt?: string;
  totalReadyLeadsFromPJ20B?: number;
  applicationPackCount?: number;
  readyForHumanReviewCount?: number;
  needsProfileCompletionCount?: number;
  profileCompleteness?: any;
  packs?: any[];
};

const emptyProfile: Profile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  targetRoles: "",
  skills: "",
  education: "",
  experienceSummary: "",
  cvText: ""
};

function loadProfile(): Profile {
  if (typeof window === "undefined") return emptyProfile;
  try {
    const saved = localStorage.getItem("kingsmen.personalJobs21.oneProfile.v1");
    return saved ? { ...emptyProfile, ...JSON.parse(saved) } : emptyProfile;
  } catch {
    return emptyProfile;
  }
}

export default function ApplyPackBuilderClient() {
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState<PackOutput | null>(null);

  const packs = useMemo(() => output?.packs ?? [], [output]);

  function update(key: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function buildPacks() {
    setRunning(true);
    setMessage("");

    try {
      localStorage.setItem("kingsmen.personalJobs21.oneProfile.v1", JSON.stringify(profile));

      const response = await fetch("/api/personal-jobs/apply-pack-builder/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || json.stderr || "PJ21 failed.");

      setOutput(json);
      localStorage.setItem("kingsmen.personalJobs21.applyPacks.v1", JSON.stringify(json));
      setMessage(`PJ21 complete: ${json.applicationPackCount} packs built from ${json.totalReadyLeadsFromPJ20B} PJ20B-ready leads.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ21 failed.");
    } finally {
      setRunning(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard.");
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#050505,#151108,#261b08)",
      color: "#f8f0db",
      padding: 28,
      fontFamily: "Arial, sans-serif"
    }}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-21</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>One Profile Apply Pack Builder</h1>
        <p style={{ color: "#d8caa8", maxWidth: 980, lineHeight: 1.65 }}>
          Save your profile once. Kingsmen uses PJ20B-ready job leads to prepare CV focus points,
          motivation drafts, manual application steps, and proof requirements without sending anything automatically.
        </p>
      </section>

      <section style={panel}>
        <h2>One profile</h2>
        <div style={formGrid}>
          <Input label="Full name" value={profile.fullName} onChange={(v) => update("fullName", v)} />
          <Input label="Email" value={profile.email} onChange={(v) => update("email", v)} />
          <Input label="Phone" value={profile.phone} onChange={(v) => update("phone", v)} />
          <Input label="Location" value={profile.location} onChange={(v) => update("location", v)} />
          <Input label="Target roles" value={profile.targetRoles} onChange={(v) => update("targetRoles", v)} placeholder="cashier, retail assistant, general worker" />
          <Input label="Skills" value={profile.skills} onChange={(v) => update("skills", v)} placeholder="customer service, POS, stock control" />
        </div>

        <label style={label}>Education</label>
        <textarea value={profile.education} onChange={(e) => update("education", e.target.value)} style={textarea} />

        <label style={label}>Experience summary</label>
        <textarea value={profile.experienceSummary} onChange={(e) => update("experienceSummary", e.target.value)} style={textarea} />

        <label style={label}>Paste CV text / document facts</label>
        <textarea value={profile.cvText} onChange={(e) => update("cvText", e.target.value)} style={{ ...textarea, minHeight: 140 }} />

        <button onClick={buildPacks} disabled={running} style={button}>
          {running ? "Building application packs..." : "Save profile and build packs"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="PJ20B-ready leads" value={output?.totalReadyLeadsFromPJ20B ?? 0} />
        <Stat label="Packs built" value={output?.applicationPackCount ?? 0} />
        <Stat label="Ready for review" value={output?.readyForHumanReviewCount ?? 0} />
        <Stat label="Need profile completion" value={output?.needsProfileCompletionCount ?? 0} />
      </section>

      <section style={panel}>
        <h2>Application packs</h2>
        <div style={packGrid}>
          {packs.slice(0, 80).map((pack: any) => (
            <article key={pack.packId} style={card}>
              <div style={{ color: "#ffd77a", fontSize: 12 }}>{pack.status}</div>
              <h3>{pack.lead.title}</h3>
              <p style={{ color: "#d8caa8" }}>{pack.lead.company} - {pack.lead.location}</p>
              <p style={{ color: "#b9ad92", fontSize: 13 }}>Fit: {pack.fit.score}/100</p>

              <h4>CV focus</h4>
              <ul style={{ color: "#d8caa8", paddingLeft: 18 }}>
                {pack.cvFocus?.slice(0, 5).map((x: string) => <li key={x}>{x}</li>)}
              </ul>

              <h4>Motivation draft</h4>
              <pre style={pre}>{pack.motivationDraft}</pre>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={smallButton} onClick={() => copyText(pack.motivationDraft)}>Copy motivation</button>
                {pack.lead.sourceUrl ? (
                  <a href={pack.lead.sourceUrl} target="_blank" rel="noreferrer" style={linkButton}>Open source</a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={panel}>
        <h2>Safety boundary</h2>
        <p style={{ color: "#d8caa8" }}>
          PJ21 builds review packs only. It does not apply, send emails, send WhatsApp, contact employers,
          touch payments, bypass login, bypass OTP, bypass CAPTCHA, or claim production readiness.
        </p>
      </section>
    </main>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article style={card}>
      <strong style={{ fontSize: 30, color: "#ffd77a" }}>{value}</strong>
      <span style={{ display: "block", color: "#b9ad92" }}>{label}</span>
    </article>
  );
}

const panel = {
  border: "1px solid rgba(255,215,122,.25)",
  borderRadius: 24,
  background: "rgba(255,255,255,.055)",
  padding: 24,
  marginBottom: 22
};

const card = {
  border: "1px solid rgba(255,215,122,.2)",
  borderRadius: 18,
  background: "rgba(0,0,0,.22)",
  padding: 16
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: 14
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22
};

const packGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: 14
};

const eyebrow = {
  color: "#d7ad49",
  textTransform: "uppercase" as const,
  letterSpacing: ".18em",
  fontSize: 12
};

const labelStyle = {
  display: "block",
  color: "#d8caa8",
  marginBottom: 6,
  fontSize: 13
};

const label = {
  display: "block",
  color: "#d8caa8",
  marginTop: 14,
  marginBottom: 6,
  fontSize: 13
};

const input = {
  width: "100%",
  border: "1px solid rgba(255,215,122,.28)",
  borderRadius: 12,
  padding: 12,
  background: "rgba(0,0,0,.28)",
  color: "#f8f0db"
};

const textarea = {
  width: "100%",
  minHeight: 90,
  border: "1px solid rgba(255,215,122,.28)",
  borderRadius: 12,
  padding: 12,
  background: "rgba(0,0,0,.28)",
  color: "#f8f0db"
};

const button = {
  border: 0,
  borderRadius: 999,
  background: "#d7ad49",
  color: "#111",
  padding: "13px 18px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 16
};

const smallButton = {
  border: 0,
  borderRadius: 999,
  background: "#d7ad49",
  color: "#111",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer"
};

const linkButton = {
  borderRadius: 999,
  border: "1px solid rgba(255,215,122,.45)",
  color: "#ffd77a",
  padding: "9px 12px",
  textDecoration: "none"
};

const pre = {
  whiteSpace: "pre-wrap" as const,
  color: "#d8caa8",
  background: "rgba(0,0,0,.25)",
  padding: 12,
  borderRadius: 12,
  maxHeight: 280,
  overflow: "auto"
};