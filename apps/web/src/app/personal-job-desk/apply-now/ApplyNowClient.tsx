"use client";

import { useEffect, useMemo, useState } from "react";

type Store = {
  updatedAt?: string;
  profile?: Record<string, string>;
  documents?: any[];
  opportunities?: any[];
  applicationPacks?: any[];
  proofLog?: any[];
};

const sourceLinks = [
  ["SA Youth", "https://sayouth.mobi/"],
  ["ESSA Labour", "https://essa.labour.gov.za/EssaOnline/WebBeans/"],
  ["NYDA", "https://www.nyda.gov.za/"],
  ["Indeed Johannesburg", "https://za.indeed.com/jobs?q=learnership+internship+entry+level&l=Johannesburg"],
  ["LinkedIn Jobs", "https://www.linkedin.com/jobs/search/?keywords=learnership%20internship%20entry%20level&location=Johannesburg%2C%20Gauteng%2C%20South%20Africa"],
  ["PNet", "https://www.pnet.co.za/jobs/learnership/in-johannesburg"],
  ["Careers24", "https://www.careers24.com/jobs/lc-johannesburg/"]
];

const blankProfile = {
  fullName: "",
  idOrPassport: "",
  phone: "",
  email: "",
  location: "Johannesburg",
  highestEducation: "",
  workExperience: "",
  skills: "",
  targetRoutes: "Jobs, Learnerships, Internships, Funding",
  notes: ""
};

const blankOpportunity = {
  title: "",
  organisation: "",
  category: "JOB",
  location: "Johannesburg",
  sourceUrl: "",
  applicationMethod: "PORTAL",
  emailTo: "",
  closingDate: "",
  notes: ""
};

export default function ApplyNowClient() {
  const [store, setStore] = useState<Store>({});
  const [profile, setProfile] = useState<Record<string, string>>(blankProfile);
  const [opportunity, setOpportunity] = useState<Record<string, string>>(blankOpportunity);
  const [documentType, setDocumentType] = useState("CV");
  const [message, setMessage] = useState("");
  const [selectedPack, setSelectedPack] = useState<any | null>(null);
  const [proofDraft, setProofDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const documents = useMemo(() => store.documents ?? [], [store]);
  const opportunities = useMemo(() => store.opportunities ?? [], [store]);
  const packs = useMemo(() => store.applicationPacks ?? [], [store]);

  useEffect(() => {
    load();
  }, []);

  async function api(body?: any) {
    const response = await fetch("/api/personal-jobs/apply-now", {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Request failed.");
    return json;
  }

  async function load() {
    setLoading(true);
    try {
      const json = await api();
      setStore(json);
      setProfile({ ...blankProfile, ...(json.profile ?? {}) });
      setMessage("Apply Desk loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setLoading(true);
    try {
      const json = await api({ action: "saveProfile", profile });
      setStore(json.store);
      setMessage("Profile saved. This one profile can be reused for multiple applications.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument(file: File | null) {
    if (!file) return;
    setLoading(true);

    try {
      const dataUrl = await readFileDataUrl(file);
      const json = await api({
        action: "uploadDocument",
        documentType,
        fileName: file.name,
        dataUrl
      });
      setStore(json.store);
      setMessage(`${documentType} uploaded: ${file.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function addOpportunity() {
    setLoading(true);
    try {
      const json = await api({ action: "addOpportunity", opportunity });
      setStore(json.store);
      setOpportunity(blankOpportunity);
      setMessage("Real opportunity saved. Generate a pack when ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Add opportunity failed.");
    } finally {
      setLoading(false);
    }
  }

  async function generatePack(opportunityId: string) {
    setLoading(true);
    try {
      const json = await api({ action: "generatePack", opportunityId });
      setStore(json.store);
      setSelectedPack(json.pack);
      setMessage("Application pack generated. Apply manually through the real source, then capture proof.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pack generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function markApplied(opportunityId: string) {
    setLoading(true);
    try {
      const proof = proofDraft[opportunityId] || "";
      const json = await api({ action: "markApplied", opportunityId, proof });
      setStore(json.store);
      setMessage("Applied status saved with proof.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Proof capture failed.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteOpportunity(opportunityId: string) {
    setLoading(true);
    try {
      const json = await api({ action: "deleteOpportunity", opportunityId });
      setStore(json.store);
      setMessage("Opportunity removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text || "");
    setMessage("Copied.");
  }

  return (
    <main style={main}>
      <section style={hero}>
        <p style={eyebrow}>KINGSMEN APPLY DESK — TODAY MODE</p>
        <h1 style={{ fontSize: 44, margin: "8px 0" }}>Find. Prepare. Apply. Track proof.</h1>
        <p style={muted}>
          One real profile, real documents, real opportunity links, multiple application packs. No fake data, no fake jobs, no automatic portal bypass.
        </p>
        <button onClick={load} disabled={loading} style={button}>{loading ? "Working..." : "Refresh"}</button>
        {message ? <p style={{ color: "#ffd77a", fontWeight: 700 }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Documents" value={documents.length} />
        <Stat label="Opportunities" value={opportunities.length} />
        <Stat label="Packs" value={packs.length} />
        <Stat label="Proof logs" value={(store.proofLog ?? []).length} />
      </section>

      <section style={panel}>
        <h2>1. Real opportunity sources</h2>
        <p style={muted}>Open real sources, choose a real opportunity, then paste the official link below. Kingsmen does not invent opportunities.</p>
        <div style={sourceGrid}>
          {sourceLinks.map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" style={sourceCard}>
              <strong>{label}</strong>
              <span>Open source</span>
            </a>
          ))}
        </div>
      </section>

      <section style={layout}>
        <section style={panel}>
          <h2>2. Candidate profile</h2>
          <div style={formGrid}>
            <Input label="Full name" value={profile.fullName} onChange={(v) => setProfile({ ...profile, fullName: v })} />
            <Input label="ID / Passport" value={profile.idOrPassport} onChange={(v) => setProfile({ ...profile, idOrPassport: v })} />
            <Input label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
            <Input label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
            <Input label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} />
            <Input label="Highest education" value={profile.highestEducation} onChange={(v) => setProfile({ ...profile, highestEducation: v })} />
          </div>
          <TextArea label="Work experience" value={profile.workExperience} onChange={(v) => setProfile({ ...profile, workExperience: v })} />
          <TextArea label="Skills" value={profile.skills} onChange={(v) => setProfile({ ...profile, skills: v })} />
          <TextArea label="Notes / restrictions / preferred jobs" value={profile.notes} onChange={(v) => setProfile({ ...profile, notes: v })} />
          <button onClick={saveProfile} style={button}>Save profile</button>
        </section>

        <section style={panel}>
          <h2>3. Upload documents</h2>
          <p style={muted}>Upload real documents only. This stores files locally inside the repo under data/personal-job-desk/uploads.</p>
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} style={input}>
            <option value="CV">CV</option>
            <option value="ID_COPY">ID copy</option>
            <option value="CERTIFICATE">Certificate / qualification</option>
            <option value="COVER_LETTER">Cover letter</option>
            <option value="REFERENCE">Reference</option>
            <option value="OTHER">Other</option>
          </select>
          <input type="file" onChange={(e) => uploadDocument(e.target.files?.[0] ?? null)} style={{ ...input, marginTop: 12 }} />

          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {documents.map((doc) => (
              <div key={doc.documentId} style={miniCard}>
                <strong>{doc.documentType}</strong>
                <span>{doc.originalName}</span>
                <small>{doc.localPath}</small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section style={panel}>
        <h2>4. Add real opportunity</h2>
        <div style={formGrid}>
          <Input label="Title" value={opportunity.title} onChange={(v) => setOpportunity({ ...opportunity, title: v })} placeholder="e.g. Admin Learnership / General Worker / Internship" />
          <Input label="Organisation" value={opportunity.organisation} onChange={(v) => setOpportunity({ ...opportunity, organisation: v })} />
          <Select label="Category" value={opportunity.category} onChange={(v) => setOpportunity({ ...opportunity, category: v })} options={["JOB", "LEARNERSHIP", "INTERNSHIP", "FUNDING", "BURSARY", "OTHER"]} />
          <Select label="Application method" value={opportunity.applicationMethod} onChange={(v) => setOpportunity({ ...opportunity, applicationMethod: v })} options={["PORTAL", "EMAIL", "UPLOAD_FORM", "WALK_IN", "OTHER"]} />
          <Input label="Email to apply, if given" value={opportunity.emailTo} onChange={(v) => setOpportunity({ ...opportunity, emailTo: v })} />
          <Input label="Closing date" value={opportunity.closingDate} onChange={(v) => setOpportunity({ ...opportunity, closingDate: v })} />
        </div>
        <Input label="Official/source link" value={opportunity.sourceUrl} onChange={(v) => setOpportunity({ ...opportunity, sourceUrl: v })} placeholder="Paste real job / learnership / funding link here" />
        <TextArea label="Notes / requirements copied from source" value={opportunity.notes} onChange={(v) => setOpportunity({ ...opportunity, notes: v })} />
        <button onClick={addOpportunity} style={button}>Save opportunity</button>
      </section>

      <section style={panel}>
        <h2>5. Applications</h2>
        <div style={{ display: "grid", gap: 14 }}>
          {opportunities.map((opp) => (
            <article key={opp.opportunityId} style={appCard}>
              <div>
                <p style={eyebrow}>{opp.category} / {opp.status}</p>
                <h3>{opp.title}</h3>
                <p style={muted}>{opp.organisation} — {opp.location}</p>
                <a href={opp.sourceUrl} target="_blank" rel="noreferrer" style={link}>Open official/source link</a>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => generatePack(opp.opportunityId)} style={button}>Generate pack</button>
                <button onClick={() => deleteOpportunity(opp.opportunityId)} style={buttonDanger}>Remove</button>
              </div>

              <div>
                <Input
                  label="Paste proof after applying"
                  value={proofDraft[opp.opportunityId] || ""}
                  onChange={(v) => setProofDraft({ ...proofDraft, [opp.opportunityId]: v })}
                  placeholder="Reference number, email sent proof, screenshot note, portal confirmation"
                />
                <button onClick={() => markApplied(opp.opportunityId)} style={buttonSecondary}>Mark applied with proof</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={panel}>
        <h2>6. Latest application pack</h2>
        {selectedPack ? (
          <>
            <p style={muted}>Use this to apply manually through the official portal/email. Then capture proof above.</p>
            <pre style={pre}>{selectedPack.body}</pre>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => copyText(selectedPack.body)} style={button}>Copy pack</button>
              {selectedPack.mailto ? <a href={selectedPack.mailto} style={buttonLink}>Open email draft</a> : null}
            </div>
          </>
        ) : (
          <p style={muted}>Generate a pack from an opportunity.</p>
        )}
      </section>
    </main>
  );
}

function readFileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File read failed."));
    reader.readAsDataURL(file);
  });
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: "block", marginTop: 12 }}>
      <span style={labelStyle}>{label}</span>
      <input value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label style={{ display: "block", marginTop: 12 }}>
      <span style={labelStyle}>{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={input}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block", marginTop: 12 }}>
      <span style={labelStyle}>{label}</span>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} style={textarea} />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article style={statCard}>
      <strong style={{ fontSize: 30, color: "#ffd77a" }}>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

const main = { minHeight: "100vh", background: "linear-gradient(135deg,#030303,#151008,#241907)", color: "#f8f0db", padding: 26, fontFamily: "Arial, sans-serif" };
const hero = { border: "1px solid rgba(255,215,122,.28)", borderRadius: 28, background: "linear-gradient(135deg,rgba(215,173,73,.18),rgba(0,0,0,.35))", padding: 24, marginBottom: 18 };
const panel = { border: "1px solid rgba(255,215,122,.22)", borderRadius: 24, background: "rgba(255,255,255,.055)", padding: 22, marginBottom: 18 };
const layout = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 18 };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 18 };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 };
const sourceGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 };
const sourceCard = { border: "1px solid rgba(255,215,122,.22)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.28)", color: "#ffd77a", textDecoration: "none", display: "grid", gap: 5 };
const appCard = { border: "1px solid rgba(255,215,122,.18)", borderRadius: 20, padding: 16, background: "rgba(0,0,0,.22)", display: "grid", gap: 14 };
const miniCard = { border: "1px solid rgba(255,215,122,.16)", borderRadius: 14, padding: 12, background: "rgba(0,0,0,.22)", display: "grid", gap: 4 };
const statCard = { border: "1px solid rgba(255,215,122,.18)", borderRadius: 18, padding: 16, background: "rgba(0,0,0,.24)", display: "grid", gap: 5 };
const eyebrow = { color: "#d7ad49", textTransform: "uppercase" as const, letterSpacing: ".16em", fontSize: 12 };
const muted = { color: "#d8caa8", lineHeight: 1.6 };
const labelStyle = { display: "block", color: "#d8caa8", marginBottom: 6, fontSize: 13 };
const input = { width: "100%", border: "1px solid rgba(255,215,122,.28)", borderRadius: 12, padding: 11, background: "rgba(0,0,0,.30)", color: "#f8f0db" };
const textarea = { ...input, minHeight: 92 };
const button = { border: 0, borderRadius: 999, background: "#d7ad49", color: "#111", padding: "12px 16px", fontWeight: 800, cursor: "pointer", marginTop: 14 };
const buttonSecondary = { border: "1px solid rgba(255,215,122,.45)", borderRadius: 999, background: "transparent", color: "#ffd77a", padding: "12px 16px", fontWeight: 800, cursor: "pointer", marginTop: 14 };
const buttonDanger = { border: "1px solid rgba(255,120,120,.45)", borderRadius: 999, background: "transparent", color: "#ffb3b3", padding: "12px 16px", fontWeight: 800, cursor: "pointer", marginTop: 14 };
const buttonLink = { ...button, display: "inline-block", textDecoration: "none" };
const link = { color: "#ffd77a", fontWeight: 800 };
const pre = { whiteSpace: "pre-wrap" as const, color: "#d8caa8", background: "rgba(0,0,0,.35)", padding: 14, borderRadius: 16, maxHeight: 420, overflow: "auto", border: "1px solid rgba(255,215,122,.16)" };