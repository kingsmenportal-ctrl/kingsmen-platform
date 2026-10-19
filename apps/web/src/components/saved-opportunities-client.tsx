"use client";

import { FormEvent, useEffect, useState } from "react";
import { candidateWorkspaceRequest } from "@/lib/candidate-workspace-client";

type SavedOpportunity = {
  id: string;
  title: string;
  organisation: string;
  url: string;
  pathway: string;
  closingDate: string;
  savedAt: string;
};

const STORAGE_KEY = "kingsmen-saved-opportunities-v1";
const pathwayOptions = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA / Learnership"],
  ["internship", "Internship"],
  ["apprenticeship", "Apprenticeship"],
  ["employment", "Employment"]
] as const;

export default function SavedOpportunitiesClient() {
  const [items, setItems] = useState<SavedOpportunity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("Checking your Kingsmen account session…");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [form, setForm] = useState({ title: "", organisation: "", url: "", pathway: "employment", closingDate: "" });

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      try {
        const result = await candidateWorkspaceRequest<{ opportunities: SavedOpportunity[] }>("GET");
        if (cancelled) return;
        setItems(Array.isArray(result.opportunities) ? result.opportunities : []);
        setSyncEnabled(true);
        setSyncStatus("Synced with your authenticated Kingsmen account and Truth Vault.");
      } catch (failure) {
        if (cancelled) return;
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) setItems(parsed.filter((item): item is SavedOpportunity =>
              !!item && typeof item.id === "string" && typeof item.title === "string" &&
              typeof item.organisation === "string" && typeof item.url === "string" &&
              typeof item.pathway === "string" && typeof item.closingDate === "string" &&
              typeof item.savedAt === "string"
            ));
          }
        } catch { /* Offline cache is optional. */ }
        setSyncStatus(failure instanceof Error ? failure.message : "Sign in to sync your shortlist.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void loadWorkspace();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch { /* Local cache is optional; Truth Vault remains the source of truth when signed in. */ }
  }, [items, loaded]);


  async function addOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(form.url.trim());
    } catch {
      setError("Enter a complete opportunity URL starting with https:// or http://.");
      return;
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      setError("Only web links can be saved.");
      return;
    }
    if (!form.title.trim() || !form.organisation.trim()) {
      setError("Add both the opportunity title and organisation.");
      return;
    }
    const item: SavedOpportunity = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: form.title.trim(),
      organisation: form.organisation.trim(),
      url: parsedUrl.toString(),
      pathway: form.pathway,
      closingDate: form.closingDate,
      savedAt: new Date().toISOString()
    };
    if (syncEnabled) {
      try {
        const result = await candidateWorkspaceRequest<{ opportunity: SavedOpportunity }>("POST", {
          title: item.title, organisation: item.organisation, url: item.url, pathway: item.pathway, closingDate: item.closingDate
        });
        setItems((current) => [result.opportunity, ...current.filter((saved) => saved.id !== result.opportunity.id)]);
        setSyncStatus("Synced with your authenticated Kingsmen account and Truth Vault.");
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Could not save to your Kingsmen account.");
        return;
      }
    } else {
      setItems((current) => [item, ...current]);
      setSyncStatus("Saved locally only. Sign in with an authorised candidate account to sync to the Truth Vault.");
    }
    setForm({ title: "", organisation: "", url: "", pathway: "employment", closingDate: "" });
  }

  async function removeOpportunity(id: string) {
    if (syncEnabled) {
      try {
        await candidateWorkspaceRequest<{ deleted: boolean }>("DELETE", undefined, `?id=${encodeURIComponent(id)}`);
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Could not remove this saved opportunity.");
        return;
      }
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function exportList() {
    const header = ["Title", "Organisation", "Pathway", "Closing date", "URL", "Saved at"];
    const rows = items.map((item) => [item.title, item.organisation, pathwayOptions.find(([code]) => code === item.pathway)?.[1] ?? item.pathway, item.closingDate, item.url, item.savedAt]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "kingsmen-saved-opportunities.csv";
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(1rem, 4vw, 2.5rem)", color: "#172033" }}>
      <header style={{ padding: "1.5rem", borderRadius: 16, background: "#10233f", color: "#fff" }}>
        <p style={{ margin: "0 0 .5rem", textTransform: "uppercase", letterSpacing: ".12em", fontSize: ".78rem" }}>Kingsmen · Opportunity workspace</p>
        <h1 style={{ margin: "0 0 .75rem", fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>Saved opportunities</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>Keep a shortlist of institutions, learnerships, internships, apprenticeships and jobs you want to follow up on.</p>
      </header>

      <section aria-labelledby="add-opportunity-title" style={{ marginTop: "1.5rem", border: "1px solid #d9e1ec", borderRadius: 14, padding: "1.25rem" }}>
        <h2 id="add-opportunity-title" style={{ marginTop: 0 }}>Save an opportunity</h2>
        <form onSubmit={addOpportunity} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "1rem" }}>
          <label style={{ display: "grid", gap: ".4rem" }}>Opportunity title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={180} style={inputStyle} /></label>
          <label style={{ display: "grid", gap: ".4rem" }}>Institution or organisation<input required value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} maxLength={180} style={inputStyle} /></label>
          <label style={{ display: "grid", gap: ".4rem" }}>Official opportunity URL<input required type="url" inputMode="url" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={2048} style={inputStyle} /></label>
          <label style={{ display: "grid", gap: ".4rem" }}>Pathway<select value={form.pathway} onChange={(e) => setForm({ ...form, pathway: e.target.value })} style={inputStyle}>{pathwayOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
          <label style={{ display: "grid", gap: ".4rem" }}>Closing date (if known)<input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} style={inputStyle} /></label>
          <div style={{ display: "flex", alignItems: "end" }}><button type="submit" style={primaryButton}>Save opportunity</button></div>
        </form>
        {error && <p role="alert" style={{ color: "#a12b2b", marginBottom: 0 }}>{error}</p>}
      </section>

      <section aria-labelledby="saved-list-title" style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <h2 id="saved-list-title">Your shortlist ({items.length})</h2>
          <button type="button" onClick={exportList} disabled={items.length === 0} style={{ ...secondaryButton, opacity: items.length === 0 ? .5 : 1 }}>Export CSV</button>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: "1.5rem", border: "1px dashed #aab8ca", borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>No saved opportunities yet</h3>
            <p style={{ marginBottom: 0, color: "#526176" }}>Add a link from an institution or employer you trust. Check the official page for eligibility, deadlines and application instructions.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: ".85rem" }}>
            {items.map((item) => (
              <article key={item.id} style={{ border: "1px solid #d9e1ec", borderRadius: 12, padding: "1rem", display: "grid", gap: ".5rem" }}>
                <h3 style={{ margin: 0 }}>{item.title}</h3>
                <p style={{ margin: 0 }}>{item.organisation} · {pathwayOptions.find(([code]) => code === item.pathway)?.[1] ?? item.pathway}</p>
                <p style={{ margin: 0, color: "#526176" }}>{item.closingDate ? `Closing date: ${item.closingDate}` : "Closing date not recorded"}</p>
                <p style={{ margin: 0, overflowWrap: "anywhere" }}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></p>
                <div><button type="button" onClick={() => removeOpportunity(item.id)} style={secondaryButton}>Remove from shortlist</button></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <p role="status" aria-live="polite" style={{ marginTop: "1.5rem", padding: "1rem", background: "#fff8e8", borderLeft: "4px solid #b7791f", lineHeight: 1.6 }}>{syncStatus} Saving a link does not submit an application, verify an opportunity, or guarantee eligibility. Confirm details on the official institution or employer website.</p>
    </main>
  );
}

const inputStyle = { width: "100%", minHeight: 42, boxSizing: "border-box" as const, border: "1px solid #aab8ca", borderRadius: 8, padding: ".6rem .7rem", font: "inherit", background: "#fff" };
const primaryButton = { minHeight: 42, border: "1px solid #23466d", borderRadius: 8, padding: ".65rem .9rem", background: "#23466d", color: "#fff", fontWeight: 600, cursor: "pointer" as const };
const secondaryButton = { minHeight: 38, border: "1px solid #23466d", borderRadius: 8, padding: ".55rem .8rem", background: "#fff", color: "#23466d", fontWeight: 600, cursor: "pointer" as const };
