"use client";

import { useEffect, useMemo, useState } from "react";

type Opportunity = {
  id: string; title: string; category: string; qualification: string | null;
  province: string | null; deliveryMode: string; applicationMethod: string;
  sourceUrl: string; provider: string; eligibilitySummary: string; availability: string;
  verifiedAt: string; sourceConfidence: string;
};
type Props = { initialSector?: string; title?: string; intro?: string };

const categories = [
  ["ALL", "All pathways"], ["UNIVERSITY", "Universities"], ["TVET", "TVET colleges"],
  ["PRIVATE_COLLEGE", "Private colleges"], ["SETA", "SETA"], ["LEARNERSHIP", "Learnerships"],
  ["BURSARY", "Bursaries & funding"], ["NSFAS", "NSFAS"], ["ACCOMMODATION", "Accommodation"],
  ["EMPLOYER", "Employment"], ["CAO", "CAO routes"]
];

const gold = "#d8b66a";
const panel: React.CSSProperties = { border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, background: "rgba(255,255,255,.045)", padding: 20 };

export default function OpportunityDirectory({ initialSector = "ALL", title = "Opportunity directory", intro = "Search verified education, training, funding, accommodation and work pathways from Kingsmen’s curated records." }: Props) {
  const [sector, setSector] = useState(initialSector);
  const [province, setProvince] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "unavailable">("loading");
  const [message, setMessage] = useState("Loading verified listings…");
  const [refresh, setRefresh] = useState(0);

  const provinces = useMemo(() => ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"], []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState("loading");
    const params = new URLSearchParams();
    if (sector !== "ALL") params.set("sector", sector);
    if (province) params.set("province", province);
    if (search.trim()) params.set("q", search.trim());
    fetch("/api/public/opportunities?" + params.toString(), { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok || body.ok !== true) {
          setRows([]);
          setState("unavailable");
          setMessage(body.message || "Verified opportunity data is currently unavailable.");
          return;
        }
        const list = Array.isArray(body.opportunities) ? body.opportunities as Opportunity[] : [];
        setRows(list);
        setState(list.length ? "ready" : "empty");
        setMessage(list.length ? "" : "No listings currently meet Kingsmen’s public verification and freshness rules.");
      }).catch(error => {
        if (!active || error?.name === "AbortError") return;
        setRows([]);
        setState("unavailable");
        setMessage("Could not connect to the verified opportunity service. Try again shortly.");
      });
    return () => { active = false; controller.abort(); };
  }, [sector, province, search, refresh]);

  return <main style={{ minHeight: "100vh", color: "#f7f4ec", background: "radial-gradient(ellipse at 85% 0%,rgba(216,182,106,.13),transparent 38%),#080b14", fontFamily: "Inter,system-ui,sans-serif" }}>
    <header style={{ maxWidth: 1180, margin: "0 auto", padding: "24px", display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
      <a href="/" style={{ color: gold, textDecoration: "none", fontWeight: 950, letterSpacing: ".18em" }}>KINGSMEN</a>
      <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }} aria-label="Portal navigation">
        <a href="/candidate/dashboard" style={{ color: "#e6e1d5" }}>Candidate portal</a>
        <a href="/personal-job-desk" style={{ color: "#e6e1d5" }}>Personal Job Desk</a>
        <a href="/free-destiny-map" style={{ color: "#e6e1d5" }}>Destiny Map</a>
      </nav>
    </header>
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 24px 70px" }}>
      <p style={{ color: gold, fontWeight: 850, letterSpacing: ".16em", fontSize: 12, textTransform: "uppercase" }}>Verified routes · South Africa</p>
      <h1 style={{ fontSize: "clamp(36px,6vw,62px)", letterSpacing: "-.04em", lineHeight: 1.04, margin: "12px 0" }}>{title}</h1>
      <p style={{ maxWidth: 820, color: "#c4c9d4", fontSize: 17, lineHeight: 1.75 }}>{intro}</p>
      <div style={{ ...panel, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginTop: 28 }}>
        <label style={{ display: "grid", gap: 7, fontSize: 13, color: "#c4c9d4" }}>Search opportunities
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Course, bursary, job, provider…" style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 7, fontSize: 13, color: "#c4c9d4" }}>Province
          <select value={province} onChange={e => setProvince(e.target.value)} style={inputStyle}><option value="">All provinces</option>{provinces.map(p => <option key={p}>{p}</option>)}</select>
        </label>
        <label style={{ display: "grid", gap: 7, fontSize: 13, color: "#c4c9d4" }}>Category
          <select value={sector} onChange={e => setSector(e.target.value)} style={inputStyle}>{categories.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <button type="button" onClick={() => setRefresh(n => n + 1)} style={{ ...buttonStyle, alignSelf: "end" }}>Refresh verified data ↻</button>
      </div>
      <div aria-live="polite" style={{ margin: "22px 0 14px", color: "#b9c0cc", fontSize: 14 }}>
        {state === "loading" ? "Checking current verified listings…" : state === "ready" ? `${rows.length} verified listing${rows.length === 1 ? "" : "s"} returned` : message}
      </div>
      {state === "unavailable" && <div role="status" style={{ ...panel, borderColor: "rgba(216,182,106,.4)" }}><strong style={{ color: gold }}>Live listings unavailable</strong><p style={{ color: "#c4c9d4", lineHeight: 1.7 }}>{message}</p><p style={{ color: "#969eae", fontSize: 13 }}>Kingsmen will not fill this screen with invented vacancies or unverified application links.</p><button onClick={() => setRefresh(n => n + 1)} style={buttonStyle}>Try again</button></div>}
      {state === "empty" && <div style={panel}><h2 style={{ marginTop: 0 }}>No verified matches yet</h2><p style={{ color: "#c4c9d4", lineHeight: 1.7 }}>{message}</p><p style={{ color: "#c4c9d4", lineHeight: 1.7 }}>Try another category or province, or open the Destiny Map to plan alternative routes.</p><a href="/free-destiny-map" style={{ color: gold, fontWeight: 800 }}>Open Destiny Map →</a></div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 14, marginTop: 10 }}>
        {rows.map(row => <article key={row.id} style={{ ...panel, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><span style={{ color: gold, fontSize: 11, fontWeight: 850, letterSpacing: ".1em" }}>{row.category.replaceAll("_", " ")}</span><span style={{ color: "#9bd3ae", fontSize: 11, fontWeight: 800 }}>SOURCE VERIFIED</span></div>
          <h2 style={{ fontSize: 21, lineHeight: 1.3, margin: 0 }}>{row.title}</h2>
          <p style={{ color: "#d2d5dc", margin: 0 }}>{row.provider}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{row.province && <Badge>{row.province}</Badge>}<Badge>{row.deliveryMode.replaceAll("_", " ")}</Badge><Badge>{row.availability}</Badge></div>
          {row.qualification && <p style={{ color: "#c4c9d4", margin: 0 }}><strong>Qualification:</strong> {row.qualification}</p>}
          <p style={{ color: "#c4c9d4", lineHeight: 1.65, margin: 0, flex: 1 }}>{row.eligibilitySummary || "Confirm requirements, eligibility and current deadlines with the official provider before applying."}</p>
          <p style={{ color: "#8e97a8", fontSize: 12, margin: 0 }}>Record last updated {new Date(row.verifiedAt).toLocaleDateString("en-ZA")} · Confidence band {row.sourceConfidence}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 5 }}>
            <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ ...buttonStyle, textDecoration: "none" }}>Open official source ↗</a>
            <a href="/auth/register" style={{ color: gold, alignSelf: "center", fontWeight: 800, fontSize: 13 }}>Create account →</a>
          </div>
          <p style={{ color: "#8e97a8", fontSize: 11, margin: 0 }}>Opening the source does not submit an application. Availability and eligibility must be confirmed with the provider.</p>
        </article>)}
      </div>
    </section>
  </main>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={{ border: "1px solid #464858", borderRadius: 999, padding: "5px 9px", fontSize: 11, color: "#c4c9d4" }}>{children}</span>;
}

const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "#0d1120", color: "#f7f4ec", border: "1px solid #424657", borderRadius: 10, padding: "12px 13px", font: "inherit", minHeight: 44 };
const buttonStyle: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", background: gold, color: "#080b14", border: 0, borderRadius: 10, padding: "12px 15px", minHeight: 44, fontWeight: 850, cursor: "pointer", font: "inherit" };
