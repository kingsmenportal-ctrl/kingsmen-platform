"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  leadId: string;
  source: string;
  category: string;
  title: string;
  organisation: string;
  location: string;
  sourceUrl: string;
  applicationMethod: string;
  confidence: string;
  scoutStatus: string;
  imported?: boolean;
};

type ScoutOutput = {
  status?: string;
  generatedAt?: string;
  query?: string;
  location?: string;
  category?: string;
  leadCount?: number;
  sourceResults?: any[];
  leads?: Lead[];
  nextAction?: string;
};

export default function OpportunityScoutClient() {
  const [data, setData] = useState<ScoutOutput>({});
  const [query, setQuery] = useState("entry level general worker admin learnership internship");
  const [location, setLocation] = useState("Johannesburg");
  const [category, setCategory] = useState("JOB");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const leads = useMemo(() => data.leads ?? [], [data]);

  useEffect(() => {
    load();
  }, []);

  async function api(body?: any) {
    const response = await fetch("/api/personal-jobs/opportunity-scout", {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });

    const json = await response.json();
    if (!response.ok) {
      return {
        status: "ERROR_VISIBLE",
        leads: [],
        sourceResults: [],
        diagnostics: [json.error || "Request failed."],
        nextAction: "Check terminal output and repair the failing route."
      };
    }
    return json;
  }

  async function load() {
    try {
      const json = await api();
      setData(json);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Load failed.");
    }
  }

  async function runScout() {
    setLoading(true);
    setMessage("Running scout. If sources block automation, Kingsmen will still give manual-open links.");
    try {
      const json = await api({ action: "runScout", query, location, category });
      setData(json);
      setMessage(`Scout completed. Leads found: ${json.leadCount ?? 0}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scout failed.");
    } finally {
      setLoading(false);
    }
  }

  async function importLead(leadId: string) {
    setLoading(true);
    try {
      const json = await api({ action: "importLead", leadId });
      setData(json.scout);
      setMessage("Lead imported to Apply Now queue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={main}>
      <section style={hero}>
        <div>
          <p style={eyebrow}>PERSONAL-JOBS-35</p>
          <h1 style={{ fontSize: 48, margin: "8px 0" }}>Connected Opportunity Scout</h1>
          <p style={muted}>
            Uses a local Playwright scout to search public opportunity pages and import leads into Apply Now.
            It does not bypass login, OTP, CAPTCHA or source rules.
          </p>
          <div style={buttonRow}>
            <a href="/personal-job-desk" style={secondaryButton}>Hub</a>
            <a href="/personal-job-desk/apply-now" style={secondaryButton}>Apply Now</a>
          </div>
        </div>

        <div style={commandCard}>
          <strong style={{ fontSize: 44 }}>{data.leadCount ?? 0}</strong>
          <span>Scouted leads</span>
          <small>{data.status || "EMPTY"}</small>
        </div>
      </section>

      {message ? <section style={alert}>{message}</section> : null}

      <section style={panel}>
        <p style={eyebrow}>SCOUT CONTROL</p>
        <h2>Search without copy/paste hunting</h2>

        <div style={formGrid}>
          <label>
            <span style={label}>Search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} style={input} />
          </label>

          <label>
            <span style={label}>Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} style={input} />
          </label>

          <label>
            <span style={label}>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
              <option value="JOB">Jobs</option>
              <option value="LEARNERSHIP">Learnerships</option>
              <option value="INTERNSHIP">Internships</option>
              <option value="FUNDING">Funding</option>
              <option value="BURSARY">Bursaries</option>
            </select>
          </label>
        </div>

        <button onClick={runScout} disabled={loading} style={primaryButton}>
          {loading ? "Scouting..." : "Run connected scout"}
        </button>
      </section>

      <section style={grid}>
        <section style={panel}>
          <p style={eyebrow}>LEADS</p>
          <h2>Review and import</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {leads.length === 0 ? <p style={muted}>No leads yet. Run the scout.</p> : null}

            {leads.map((lead) => (
              <article key={lead.leadId} style={card}>
                <p style={eyebrow}>{lead.source} / {lead.category}</p>
                <h3>{lead.title}</h3>
                <p style={muted}>{lead.organisation || lead.source}</p>
                <a href={lead.sourceUrl} target="_blank" rel="noreferrer" style={link}>Open official page</a>
                <div style={buttonRow}>
                  <button onClick={() => importLead(lead.leadId)} disabled={lead.imported || loading} style={primaryButton}>
                    {lead.imported ? "Imported" : "Import to Apply Now"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={panel}>
          <p style={eyebrow}>SOURCE STATUS</p>
          <h2>Scout report</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {(data.sourceResults ?? []).map((source: any) => (
              <article key={source.source} style={card}>
                <h3>{source.source}</h3>
                <p style={muted}>{source.status}</p>
                <p style={muted}>{source.note}</p>
                <a href={source.openUrl} target="_blank" rel="noreferrer" style={link}>Open source manually</a>
              </article>
            ))}
          </div>

          <div style={truthBox}>
            <strong>Tool boundary</strong>
            <span>
              Playwright can scout public pages and open sources. If a source needs login, OTP, CAPTCHA or blocks scraping,
              Kingsmen must switch to manual-open/import instead of bypassing.
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}

const main = { minHeight: "100vh", background: "radial-gradient(circle at top left,rgba(215,173,73,.23),transparent 30%),linear-gradient(135deg,#030303,#100b05,#251807)", color: "#f8f0db", padding: 28, fontFamily: "Arial, sans-serif" };
const hero = { display: "grid", gridTemplateColumns: "1fr minmax(220px,320px)", gap: 18, alignItems: "stretch", border: "1px solid rgba(255,215,122,.30)", borderRadius: 32, background: "linear-gradient(135deg,rgba(215,173,73,.19),rgba(0,0,0,.36))", padding: 26, marginBottom: 18 };
const commandCard = { border: "1px solid rgba(255,215,122,.30)", borderRadius: 26, background: "rgba(0,0,0,.30)", padding: 22, display: "grid", placeContent: "center", textAlign: "center" as const, color: "#ffd77a" };
const panel = { border: "1px solid rgba(255,215,122,.22)", borderRadius: 24, background: "rgba(255,255,255,.055)", padding: 22, marginBottom: 18 };
const grid = { display: "grid", gridTemplateColumns: "minmax(360px,1fr) minmax(360px,1fr)", gap: 18 };
const formGrid = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 };
const card = { border: "1px solid rgba(255,215,122,.18)", borderRadius: 20, padding: 16, background: "rgba(0,0,0,.22)", display: "grid", gap: 8 };
const alert = { border: "1px solid rgba(255,215,122,.24)", borderRadius: 18, background: "rgba(215,173,73,.12)", color: "#ffd77a", padding: 14, marginBottom: 18, fontWeight: 800 };
const truthBox = { border: "1px solid rgba(255,215,122,.18)", borderRadius: 18, padding: 14, marginTop: 16, background: "rgba(0,0,0,.25)", display: "grid", gap: 6, color: "#d8caa8" };
const buttonRow = { display: "flex", gap: 10, flexWrap: "wrap" as const };
const primaryButton = { border: 0, borderRadius: 999, background: "#d7ad49", color: "#111", padding: "12px 16px", fontWeight: 900, cursor: "pointer", marginTop: 14, textDecoration: "none" };
const secondaryButton = { border: "1px solid rgba(255,215,122,.45)", color: "#ffd77a", borderRadius: 999, padding: "12px 16px", fontWeight: 900, textDecoration: "none", marginTop: 14 };
const eyebrow = { color: "#d7ad49", textTransform: "uppercase" as const, letterSpacing: ".16em", fontSize: 12 };
const muted = { color: "#d8caa8", lineHeight: 1.6 };
const label = { display: "block", color: "#d8caa8", marginBottom: 6, fontSize: 13 };
const input = { width: "100%", border: "1px solid rgba(255,215,122,.28)", borderRadius: 12, padding: 11, background: "rgba(0,0,0,.30)", color: "#f8f0db" };
const link = { color: "#ffd77a", fontWeight: 800 };