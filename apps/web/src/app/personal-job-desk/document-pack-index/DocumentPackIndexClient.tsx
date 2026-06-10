"use client";

import { useEffect, useMemo, useState } from "react";

type DocumentSlot = {
  documentType: string;
  label: string;
  required: boolean;
  candidateProvided: boolean;
  verified: boolean;
  source: string;
  safeNote: string;
};

type DocumentPack = {
  documentPackId: string;
  snapshotItemId: string;
  packId: string;
  packStatus: string;
  publicStatus: string;
  targetStatus: string;
  opportunity: any;
  candidateSummary: string;
  documentSlots: DocumentSlot[];
  evidenceAttachment: any;
  readiness: {
    requiredDocumentCount: number;
    requiredMissingCount: number;
    optionalDocumentCount: number;
    verifiedDocumentCount: number;
    evidenceAvailable: boolean;
    canExportPackNow: boolean;
  };
  candidateInstructions: string[];
};

type IndexOutput = {
  status?: string;
  generatedAt?: string;
  documentPackCount?: number;
  summary?: any;
  documentPacks?: DocumentPack[];
  exportIndex?: {
    format: string;
    filename: string;
    body: string;
  };
};

const filters = [
  "ALL",
  "NEEDS_CANDIDATE_DOCUMENTS",
  "EVIDENCE_ONLY",
  "PACK_READY_FOR_REVIEW",
  "READY_FOR_MANUAL_EXPORT",
  "BLOCKED_NO_EVIDENCE",
  "CLOSED",
  "AWAITING_PROOF",
  "NO_PROOF_AVAILABLE"
];

export default function DocumentPackIndexClient() {
  const [index, setIndex] = useState<IndexOutput | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const packs = useMemo(() => index?.documentPacks ?? [], [index]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return packs;
    return packs.filter((pack) =>
      pack.packStatus === filter ||
      pack.publicStatus === filter ||
      pack.evidenceAttachment?.visibility === filter ||
      pack.evidenceAttachment?.evidenceLevel === filter
    );
  }, [packs, filter]);

  const selected = useMemo(() => {
    return packs.find((pack) => pack.documentPackId === selectedId) ?? filtered[0] ?? null;
  }, [packs, filtered, selectedId]);

  useEffect(() => {
    loadIndex();
  }, []);

  async function loadIndex() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/document-pack-index", { method: "GET" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "PJ33 load failed.");
      setIndex(json);
      setSelectedId(json.documentPacks?.[0]?.documentPackId ?? "");
      setMessage(`PJ33 loaded ${json.documentPackCount} document packs.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ33 load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text || "");
    setMessage("Copied.");
  }

  function downloadIndex() {
    const body = index?.exportIndex?.body || "";
    const filename = index?.exportIndex?.filename || "kingsmen-document-pack-index.md";
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Export prepared.");
  }

  return (
    <main style={main}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-33</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Document Pack Index</h1>
        <p style={muted}>Application document readiness and evidence attachment map. No fake documents, no submission, no employer contact.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={loadIndex} disabled={loading} style={button}>
            {loading ? "Working..." : "Refresh index"}
          </button>
          <button onClick={downloadIndex} style={buttonSecondary}>
            Download index
          </button>
          <button onClick={() => copyText(index?.exportIndex?.body || "")} style={buttonSecondary}>
            Copy index
          </button>
        </div>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={statsGrid}>
        <Stat label="Packs" value={index?.summary?.totalPacks ?? 0} />
        <Stat label="Needs docs" value={index?.summary?.needsCandidateDocuments ?? 0} />
        <Stat label="Evidence only" value={index?.summary?.evidenceOnly ?? 0} />
        <Stat label="Ready review" value={index?.summary?.packReadyForReview ?? 0} />
        <Stat label="Exportable" value={index?.summary?.exportableNow ?? 0} />
        <Stat label="Missing required" value={index?.summary?.totalRequiredMissing ?? 0} />
      </section>

      <section style={layout}>
        <aside style={panel}>
          <h2>Document packs</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={input}>
            {filters.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {filtered.slice(0, 120).map((pack) => (
              <button
                key={pack.documentPackId}
                onClick={() => setSelectedId(pack.documentPackId)}
                style={{
                  ...queueCard,
                  outline: selected?.documentPackId === pack.documentPackId ? "2px solid #ffd77a" : "none"
                }}
              >
                <strong>{pack.opportunity?.title || "Untitled opportunity"}</strong>
                <span>{pack.packStatus}</span>
                <small>Missing required: {pack.readiness.requiredMissingCount}</small>
              </button>
            ))}
          </div>
        </aside>

        <section style={panel}>
          {!selected ? (
            <p style={muted}>No document pack selected.</p>
          ) : (
            <>
              <p style={eyebrow}>{selected.packStatus}</p>
              <h2>{selected.opportunity?.title || "Untitled opportunity"}</h2>
              <p style={muted}>{selected.opportunity?.company || "Unknown company"} - {selected.publicStatus}</p>

              <section style={subPanel}>
                <h3>Candidate summary</h3>
                <p style={messageBox}>{selected.candidateSummary}</p>
              </section>

              <section style={subPanel}>
                <h3>Required readiness</h3>
                <p style={muted}>Required documents: {selected.readiness.requiredDocumentCount}</p>
                <p style={muted}>Required missing: {selected.readiness.requiredMissingCount}</p>
                <p style={muted}>Verified documents: {selected.readiness.verifiedDocumentCount}</p>
                <p style={muted}>Evidence available: {selected.readiness.evidenceAvailable ? "Yes" : "No"}</p>
                <p style={muted}>Can export now: {selected.readiness.canExportPackNow ? "Yes" : "No"}</p>
              </section>

              <section style={subPanel}>
                <h3>Document slots</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {selected.documentSlots.map((slot) => (
                    <div key={`${slot.documentType}-${slot.label}`} style={progressCard}>
                      <strong>{slot.label}</strong>
                      <span>{slot.required ? "Required" : "Optional"} / {slot.candidateProvided ? "Provided" : "Missing"}</span>
                      <small>{slot.safeNote}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section style={subPanel}>
                <h3>Evidence attachment</h3>
                <p style={muted}>Evidence level: {selected.evidenceAttachment.evidenceLevel}</p>
                <p style={muted}>Visibility: {selected.evidenceAttachment.visibility}</p>
                <p style={muted}>Attachable now: {selected.evidenceAttachment.attachableNow ? "Yes" : "No"}</p>
                <p style={muted}>Proof reference: {selected.evidenceAttachment.proofReference || "None"}</p>
                <p style={muted}>Audit reference: {selected.evidenceAttachment.auditReference || "None"}</p>
              </section>

              <section style={subPanel}>
                <h3>Instructions</h3>
                <ul style={listStyle}>{selected.candidateInstructions.map((rule) => <li key={rule}>{rule}</li>)}</ul>
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article style={card}>
      <strong style={{ fontSize: 28, color: "#ffd77a" }}>{value}</strong>
      <span style={{ display: "block", color: "#b9ad92" }}>{label}</span>
    </article>
  );
}

const main = {
  minHeight: "100vh",
  background: "linear-gradient(135deg,#050505,#151108,#241907)",
  color: "#f8f0db",
  padding: 28,
  fontFamily: "Arial, sans-serif"
};

const panel = {
  border: "1px solid rgba(255,215,122,.25)",
  borderRadius: 24,
  background: "rgba(255,255,255,.055)",
  padding: 22,
  marginBottom: 20
};

const subPanel = {
  border: "1px solid rgba(255,215,122,.14)",
  borderRadius: 18,
  background: "rgba(0,0,0,.18)",
  padding: 16,
  marginTop: 14
};

const card = {
  border: "1px solid rgba(255,215,122,.2)",
  borderRadius: 18,
  background: "rgba(0,0,0,.22)",
  padding: 16
};

const layout = {
  display: "grid",
  gridTemplateColumns: "minmax(300px, 420px) 1fr",
  gap: 18,
  alignItems: "start"
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: 14,
  marginBottom: 20
};

const queueCard = {
  textAlign: "left" as const,
  border: "1px solid rgba(255,215,122,.18)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(0,0,0,.28)",
  color: "#f8f0db",
  cursor: "pointer",
  display: "grid",
  gap: 5
};

const progressCard = {
  border: "1px solid rgba(255,215,122,.18)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(0,0,0,.22)",
  color: "#f8f0db",
  display: "grid",
  gap: 5
};

const eyebrow = {
  color: "#d7ad49",
  textTransform: "uppercase" as const,
  letterSpacing: ".18em",
  fontSize: 12
};

const muted = {
  color: "#d8caa8",
  lineHeight: 1.6
};

const input = {
  width: "100%",
  border: "1px solid rgba(255,215,122,.28)",
  borderRadius: 12,
  padding: 11,
  background: "rgba(0,0,0,.28)",
  color: "#f8f0db"
};

const button = {
  border: 0,
  borderRadius: 999,
  background: "#d7ad49",
  color: "#111",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 14
};

const buttonSecondary = {
  border: "1px solid rgba(255,215,122,.45)",
  borderRadius: 999,
  background: "transparent",
  color: "#ffd77a",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 14
};

const listStyle = {
  color: "#d8caa8",
  lineHeight: 1.55,
  paddingLeft: 22
};

const messageBox = {
  color: "#f8f0db",
  lineHeight: 1.6,
  background: "rgba(215,173,73,.12)",
  border: "1px solid rgba(215,173,73,.28)",
  borderRadius: 16,
  padding: 14
};