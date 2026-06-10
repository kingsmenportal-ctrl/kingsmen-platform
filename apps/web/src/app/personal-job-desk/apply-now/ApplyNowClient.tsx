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

const realSources = [
  {
    name: "SA Youth",
    type: "Jobs / Programmes / Skills",
    url: "https://sayouth.mobi/",
    note: "Free youth opportunity network. Use for job, youth programme and skilling routes."
  },
  {
    name: "ESSA Labour",
    type: "Government work seeker database",
    url: "https://essa.labour.gov.za/EssaOnline/WebBeans/",
    note: "Register, capture CV and search work or learning opportunities."
  },
  {
    name: "NYDA",
    type: "Youth grants / skills / scholarships",
    url: "https://www.nyda.gov.za/",
    note: "Use for youth services, grants, vouchers, education and skills routes."
  },
  {
    name: "Indeed",
    type: "Jobs / internships / learnerships",
    url: "https://za.indeed.com/",
    note: "Use search terms, then import only real listings."
  },
  {
    name: "LinkedIn Jobs",
    type: "Internships / entry jobs",
    url: "https://www.linkedin.com/jobs/",
    note: "Use for formal listings and company pages."
  },
  {
    name: "Careers24",
    type: "Jobs",
    url: "https://www.careers24.com/",
    note: "Use for SA job listings."
  },
  {
    name: "PNet",
    type: "Jobs / learnerships",
    url: "https://www.pnet.co.za/",
    note: "Use for formal SA job listings."
  }
];

const routeCards = [
  {
    key: "JOB",
    title: "Jobs",
    subtitle: "General worker, admin, retail, call centre, driver, office support",
    search: "entry level general worker admin retail call centre"
  },
  {
    key: "LEARNERSHIP",
    title: "Learnerships",
    subtitle: "SETAs, companies, youth programmes, work-integrated learning",
    search: "learnership matric no experience"
  },
  {
    key: "INTERNSHIP",
    title: "Internships",
    subtitle: "Graduate, TVET, workplace exposure, entry internships",
    search: "internship entry level graduate TVET"
  },
  {
    key: "FUNDING",
    title: "Funding",
    subtitle: "Bursaries, youth grants, training support, scholarships",
    search: "bursary youth grant scholarship training funding"
  }
];

function encode(value: string) {
  return encodeURIComponent(value.trim());
}

function searchLinks(query: string, location: string) {
  const q = encode(query || "entry level jobs learnership internships");
  const l = encode(location || "Johannesburg");

  return [
    ["Indeed", `https://za.indeed.com/jobs?q=${q}&l=${l}`],
    ["LinkedIn", `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}%2C%20South%20Africa`],
    ["Google Jobs Search", `https://www.google.com/search?q=${q}+${l}+South+Africa+apply`],
    ["Careers24", `https://www.careers24.com/jobs/lc-${l}/?q=${q}`],
    ["PNet", `https://www.pnet.co.za/jobs/${q}/in-${l}`],
    ["SA Youth", "https://sayouth.mobi/"],
    ["ESSA", "https://essa.labour.gov.za/EssaOnline/WebBeans/"],
    ["NYDA", "https://www.nyda.gov.za/"]
  ];
}

export default function ApplyNowClient() {
  const [store, setStore] = useState<Store>({});
  const [profile, setProfile] = useState<Record<string, string>>(blankProfile);
  const [opportunity, setOpportunity] = useState<Record<string, string>>(blankOpportunity);
  const [documentType, setDocumentType] = useState("CV");
  const [message, setMessage] = useState("");
  const [selectedPack, setSelectedPack] = useState<any | null>(null);
  const [proofDraft, setProofDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState("JOB");
  const [searchText, setSearchText] = useState("entry level general worker admin learnership internship");

  const documents = useMemo(() => store.documents ?? [], [store]);
  const opportunities = useMemo(() => store.opportunities ?? [], [store]);
  const packs = useMemo(() => store.applicationPacks ?? [], [store]);
  const proofLog = useMemo(() => store.proofLog ?? [], [store]);

  const readiness = useMemo(() => {
    const required = [
      profile.fullName,
      profile.phone,
      profile.email,
      profile.location,
      profile.highestEducation,
      profile.skills
    ].filter(Boolean).length;

    const hasCv = documents.some((doc) => doc.documentType === "CV");
    const hasId = documents.some((doc) => doc.documentType === "ID_COPY");
    const score = Math.round(((required / 6) * 70) + (hasCv ? 15 : 0) + (hasId ? 15 : 0));

    return {
      score,
      hasCv,
      hasId,
      profileFields: required,
      ready: score >= 80
    };
  }, [profile, documents]);

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
      setMessage("Kingsmen Apply Desk loaded.");
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
      setMessage("Candidate profile saved.");
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
      setProfile({ ...blankProfile, ...(json.store?.profile ?? profile) });

      if (json.smartProfile?.filledFields?.length) {
        setMessage(`${documentType} uploaded. Kingsmen read the document and autofilled: ${json.smartProfile.filledFields.join(", ")}. Review before applying.`);
      } else {
        setMessage(`${documentType} uploaded. ${json.document?.extractionMessage ?? "No fields extracted."}`);
      }
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
      setOpportunity({ ...blankOpportunity, category: activeRoute, location: profile.location || "Johannesburg" });
      setMessage("Real opportunity saved to the application queue.");
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
      setMessage("Application pack generated. Apply through the real source, then capture proof.");
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
      setMessage("Application marked as applied with proof.");
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

  function selectRoute(route: any) {
    setActiveRoute(route.key);
    setSearchText(route.search);
    setOpportunity({ ...opportunity, category: route.key, location: profile.location || opportunity.location || "Johannesburg" });
  }

  return (
    <main style={main}>
      <section style={topBar}>
        <div>
          <p style={eyebrow}>KINGSMEN PERSONAL JOB DESK</p>
          <h1 style={{ fontSize: 46, margin: "6px 0" }}>Apply Command Centre</h1>
          <p style={muted}>Built for real applications today: profile, documents, source search, opportunity import, application pack, proof tracking.</p>
        </div>

        <div style={readinessBox}>
          <strong style={{ fontSize: 42 }}>{readiness.score}%</strong>
          <span>Readiness</span>
          <small>{readiness.ready ? "Ready to apply faster" : "Complete profile + CV + ID"}</small>
        </div>
      </section>

      <section style={statsGrid}>
        <Stat label="Documents" value={documents.length} />
        <Stat label="Opportunities" value={opportunities.length} />
        <Stat label="Application packs" value={packs.length} />
        <Stat label="Proof captured" value={proofLog.length} />
      </section>

      {message ? <section style={alertBox}>{message}</section> : null}

      <section style={routeGrid}>
        {routeCards.map((route) => (
          <button
            key={route.key}
            onClick={() => selectRoute(route)}
            style={{ ...routeCard, outline: activeRoute === route.key ? "2px solid #ffd77a" : "none" }}
          >
            <strong>{route.title}</strong>
            <span>{route.subtitle}</span>
          </button>
        ))}
      </section>

      <section style={panel}>
        <div style={sectionHead}>
          <div>
            <p style={eyebrow}>REAL SOURCE HUNTER</p>
            <h2>Search real opportunities</h2>
          </div>
          <button onClick={load} disabled={loading} style={button}>{loading ? "Working..." : "Refresh"}</button>
        </div>

        <div style={searchRow}>
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} style={input} />
          <input value={profile.location || "Johannesburg"} onChange={(e) => setProfile({ ...profile, location: e.target.value })} style={input} />
        </div>

        <div style={sourceGrid}>
          {searchLinks(searchText, profile.location).map(([label, url]) => (
            <a key={`${label}-${url}`} href={url} target="_blank" rel="noreferrer" style={sourceCard}>
              <strong>{label}</strong>
              <span>Open live search</span>
            </a>
          ))}
        </div>

        <div style={miniNote}>
          Kingsmen does not pretend to have a live employer API yet. Use these live sources, open real listings, then import the link below.
        </div>
      </section>

      <section style={layout}>
        <section style={panel}>
          <p style={eyebrow}>CANDIDATE CORE</p>
          <h2>One profile for many applications</h2>
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
          <TextArea label="Preferred jobs / restrictions / notes" value={profile.notes} onChange={(v) => setProfile({ ...profile, notes: v })} />
          <button onClick={saveProfile} style={button}>Save profile</button>
        </section>

        <section style={panel}>
          <p style={eyebrow}>DOCUMENT VAULT</p>
          <h2>Upload real documents</h2>
          <div style={dropZone}>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} style={input}>
              <option value="CV">CV</option>
              <option value="ID_COPY">ID copy</option>
              <option value="CERTIFICATE">Certificate / qualification</option>
              <option value="COVER_LETTER">Cover letter</option>
              <option value="REFERENCE">Reference</option>
              <option value="OTHER">Other</option>
            </select>
            <input type="file" onChange={(e) => uploadDocument(e.target.files?.[0] ?? null)} style={input} />
          </div>

          <button
            onClick={async () => {
              setLoading(true);
              try {
                const json = await api({ action: "smartProfileFromDocuments" });
                setStore(json.store);
                setProfile({ ...blankProfile, ...(json.store?.profile ?? profile) });
                setMessage(json.smartProfile?.filledFields?.length
                  ? `Smart autofill refreshed: ${json.smartProfile.filledFields.join(", ")}.`
                  : "No extra profile fields found in uploaded documents.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Smart autofill failed.");
              } finally {
                setLoading(false);
              }
            }}
            style={buttonSecondary}
          >
            Smart autofill from uploaded documents
          </button>

          <div style={truthBox}>
            <strong>Smart form rule</strong>
            <span>Upload CV/documents first. Kingsmen reads what it can and fills the form. You only review, correct missing fields, then apply.</span>
          </div>

          <div style={docGrid}>
            {documents.length === 0 ? <p style={muted}>No documents uploaded yet. Upload CV and ID first.</p> : null}
            {documents.map((doc) => (
              <article key={doc.documentId} style={miniCard}>
                <strong>{doc.documentType}</strong>
                <span>{doc.originalName}</span>
                <small>{doc.localPath}</small>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section style={panel}>
        <p style={eyebrow}>IMPORT REAL OPPORTUNITY</p>
        <h2>Add job / learnership / internship / funding route</h2>
        <div style={formGrid}>
          <Input label="Title" value={opportunity.title} onChange={(v) => setOpportunity({ ...opportunity, title: v })} placeholder="e.g. Admin Learnership / General Worker / Internship" />
          <Input label="Organisation" value={opportunity.organisation} onChange={(v) => setOpportunity({ ...opportunity, organisation: v })} />
          <Select label="Category" value={opportunity.category || activeRoute} onChange={(v) => setOpportunity({ ...opportunity, category: v })} options={["JOB", "LEARNERSHIP", "INTERNSHIP", "FUNDING", "BURSARY", "OTHER"]} />
          <Select label="Application method" value={opportunity.applicationMethod} onChange={(v) => setOpportunity({ ...opportunity, applicationMethod: v })} options={["PORTAL", "EMAIL", "UPLOAD_FORM", "WALK_IN", "OTHER"]} />
          <Input label="Email to apply, if listed" value={opportunity.emailTo} onChange={(v) => setOpportunity({ ...opportunity, emailTo: v })} />
          <Input label="Closing date" value={opportunity.closingDate} onChange={(v) => setOpportunity({ ...opportunity, closingDate: v })} />
        </div>
        <Input label="Official/source link" value={opportunity.sourceUrl} onChange={(v) => setOpportunity({ ...opportunity, sourceUrl: v })} placeholder="Paste real opportunity link here" />
        <TextArea label="Requirements copied from the source" value={opportunity.notes} onChange={(v) => setOpportunity({ ...opportunity, notes: v })} />
        <button onClick={addOpportunity} style={button}>Add to application queue</button>
      </section>

      <section style={columns}>
        <section style={panel}>
          <p style={eyebrow}>APPLICATION QUEUE</p>
          <h2>Apply list</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {opportunities.length === 0 ? <p style={muted}>No opportunities imported yet. Search real sources above, then paste a real link.</p> : null}

            {opportunities.map((opp) => (
              <article key={opp.opportunityId} style={appCard}>
                <div>
                  <p style={eyebrow}>{opp.category} / {opp.status}</p>
                  <h3>{opp.title}</h3>
                  <p style={muted}>{opp.organisation} Ã¢â‚¬â€ {opp.location}</p>
                  <a href={opp.sourceUrl} target="_blank" rel="noreferrer" style={link}>Open official/source link</a>
                </div>

                <div style={buttonRow}>
                  <button onClick={() => generatePack(opp.opportunityId)} style={button}>Build pack</button>
                  <button onClick={() => deleteOpportunity(opp.opportunityId)} style={buttonDanger}>Remove</button>
                </div>

                <Input
                  label="Proof after applying"
                  value={proofDraft[opp.opportunityId] || ""}
                  onChange={(v) => setProofDraft({ ...proofDraft, [opp.opportunityId]: v })}
                  placeholder="Reference number, email sent proof, screenshot note, portal confirmation"
                />
                <button onClick={() => markApplied(opp.opportunityId)} style={buttonSecondary}>Mark applied with proof</button>
              </article>
            ))}
          </div>
        </section>

        <section style={panel}>
          <p style={eyebrow}>APPLICATION PACK</p>
          <h2>Ready-to-use pack</h2>

          {selectedPack ? (
            <>
              <p style={muted}>Use this to apply manually through the official portal or email. Then capture proof in the queue.</p>
              <pre style={pre}>{selectedPack.body}</pre>
              <div style={buttonRow}>
                <button onClick={() => copyText(selectedPack.body)} style={button}>Copy pack</button>
                {selectedPack.mailto ? <a href={selectedPack.mailto} style={buttonLink}>Open email draft</a> : null}
              </div>
            </>
          ) : (
            <p style={muted}>Select an opportunity and click Build pack.</p>
          )}

          <div style={truthBox}>
            <strong>Reality boundary</strong>
            <span>One form cannot legally and reliably submit to every employer automatically today. Kingsmen must package your profile and documents, route you to real sources, and capture proof.</span>
          </div>
        </section>
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
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

const main = { minHeight: "100vh", background: "radial-gradient(circle at top left,rgba(215,173,73,.2),transparent 28%),linear-gradient(135deg,#020202,#120d06,#261a07)", color: "#f8f0db", padding: 26, fontFamily: "Arial, sans-serif" };
const topBar = { display: "grid", gridTemplateColumns: "1fr minmax(180px,260px)", gap: 18, alignItems: "stretch", border: "1px solid rgba(255,215,122,.28)", borderRadius: 30, background: "linear-gradient(135deg,rgba(215,173,73,.18),rgba(0,0,0,.38))", padding: 24, marginBottom: 18 };
const readinessBox = { border: "1px solid rgba(255,215,122,.32)", borderRadius: 24, background: "rgba(0,0,0,.28)", padding: 18, display: "grid", placeContent: "center", textAlign: "center" as const, color: "#ffd77a" };
const panel = { border: "1px solid rgba(255,215,122,.22)", borderRadius: 24, background: "rgba(255,255,255,.055)", padding: 22, marginBottom: 18 };
const layout = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 };
const columns = { display: "grid", gridTemplateColumns: "minmax(360px,1fr) minmax(360px,1fr)", gap: 18 };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 18 };
const routeGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 18 };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 };
const searchRow = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 };
const sourceGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 };
const sectionHead = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" as const };
const routeCard = { textAlign: "left" as const, border: "1px solid rgba(255,215,122,.20)", borderRadius: 20, padding: 16, background: "rgba(0,0,0,.26)", color: "#f8f0db", display: "grid", gap: 8, cursor: "pointer" };
const sourceCard = { border: "1px solid rgba(255,215,122,.22)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.28)", color: "#ffd77a", textDecoration: "none", display: "grid", gap: 5 };
const appCard = { border: "1px solid rgba(255,215,122,.18)", borderRadius: 20, padding: 16, background: "rgba(0,0,0,.22)", display: "grid", gap: 14 };
const miniCard = { border: "1px solid rgba(255,215,122,.16)", borderRadius: 14, padding: 12, background: "rgba(0,0,0,.22)", display: "grid", gap: 4 };
const statCard = { border: "1px solid rgba(255,215,122,.18)", borderRadius: 18, padding: 16, background: "rgba(0,0,0,.24)", display: "grid", gap: 5 };
const docGrid = { display: "grid", gap: 10, marginTop: 16 };
const dropZone = { display: "grid", gap: 12, border: "1px dashed rgba(255,215,122,.32)", borderRadius: 18, padding: 16, background: "rgba(0,0,0,.18)" };
const buttonRow = { display: "flex", gap: 10, flexWrap: "wrap" as const };
const alertBox = { border: "1px solid rgba(255,215,122,.24)", borderRadius: 18, background: "rgba(215,173,73,.12)", color: "#ffd77a", padding: 14, marginBottom: 18, fontWeight: 800 };
const truthBox = { border: "1px solid rgba(255,215,122,.18)", borderRadius: 18, padding: 14, marginTop: 16, background: "rgba(0,0,0,.25)", display: "grid", gap: 6, color: "#d8caa8" };
const miniNote = { color: "#d8caa8", marginTop: 14, lineHeight: 1.5, borderLeft: "3px solid #d7ad49", paddingLeft: 12 };
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
const pre = { whiteSpace: "pre-wrap" as const, color: "#d8caa8", background: "rgba(0,0,0,.35)", padding: 14, borderRadius: 16, maxHeight: 500, overflow: "auto", border: "1px solid rgba(255,215,122,.16)" };