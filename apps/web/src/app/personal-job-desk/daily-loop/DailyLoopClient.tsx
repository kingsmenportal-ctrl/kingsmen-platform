"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { PersonalJobs10SafeProfile } from "./page";

type DailyTargets = {
  leadTarget: number;
  applyPackTarget: number;
  submissionTarget: number;
  followUpTarget: number;
};

type DailyCommand = {
  id: string;
  rank: number;
  title: string;
  reason: string;
  route: string;
  urgency: "CROWN" | "HIGH" | "STEADY" | "WATCH";
  proofRequired: boolean;
};

type StorageSource = {
  module: string;
  label: string;
  key: string;
  route: string;
  emptyInstruction: string;
};

const DAILY_LOOP_KEY = "kingsmen.personalJobs10.dailyOperatingLoop.v1";

const SOURCES: StorageSource[] = [
  {
    module: "PERSONAL-JOBS-02",
    label: "External job leads",
    key: "kingsmen.personalJobs02.externalLeads.v1",
    route: "/personal-job-desk/opportunities",
    emptyInstruction: "Capture real job leads first."
  },
  {
    module: "PERSONAL-JOBS-03",
    label: "Scored shortlist",
    key: "kingsmen.personalJobs03.shortlist.v1",
    route: "/personal-job-desk/shortlist",
    emptyInstruction: "Rank captured leads before spending effort."
  },
  {
    module: "PERSONAL-JOBS-04",
    label: "CV and motivation apply packs",
    key: "kingsmen.personalJobs04.applyPacks.v1",
    route: "/personal-job-desk/apply-pack",
    emptyInstruction: "Build truthful CV and motivation packs."
  },
  {
    module: "PERSONAL-JOBS-05",
    label: "Manual submissions and proof",
    key: "kingsmen.personalJobs05.submissions.v1",
    route: "/personal-job-desk/submissions",
    emptyInstruction: "Capture proof after every manual application."
  },
  {
    module: "PERSONAL-JOBS-06",
    label: "Follow-ups and interview prep",
    key: "kingsmen.personalJobs06.followUps.v1",
    route: "/personal-job-desk/follow-up",
    emptyInstruction: "Set follow-up dates and interview prep tasks."
  },
  {
    module: "PERSONAL-JOBS-07",
    label: "Outcomes and decisions",
    key: "kingsmen.personalJobs07.outcomeLedger.v1",
    route: "/personal-job-desk/outcomes",
    emptyInstruction: "Record responses, interviews, rejections, offers, and decisions."
  },
  {
    module: "PERSONAL-JOBS-08",
    label: "Real-use gate",
    key: "kingsmen.personalJobs08.realUseGate.v1",
    route: "/personal-job-desk/real-use-gate",
    emptyInstruction: "Run the browser-side real-use gate."
  }
];

function countValue(value: unknown): number {
  if (!value) return 0;
  if (Array.isArray(value)) return value.length;

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["leads", "rows", "items", "packs", "records", "submissions", "followUps", "outcomes", "ledger", "testedRoutes", "commands"]) {
      if (Array.isArray(record[key])) return record[key].length;
    }

    return Object.keys(record).length > 0 ? 1 : 0;
  }

  return 0;
}

function readLocalCount(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    return countValue(JSON.parse(raw));
  } catch {
    return 0;
  }
}

function buildSnapshot(): Record<string, number> {
  const snapshot: Record<string, number> = {};
  for (const source of SOURCES) snapshot[source.key] = readLocalCount(source.key);
  return snapshot;
}

function c(counts: Record<string, number>, key: string): number {
  return counts[key] || 0;
}

function buildSummary(counts: Record<string, number>) {
  const leads = c(counts, "kingsmen.personalJobs02.externalLeads.v1");
  const packs = c(counts, "kingsmen.personalJobs04.applyPacks.v1");
  const submissions = c(counts, "kingsmen.personalJobs05.submissions.v1");
  const followUps = c(counts, "kingsmen.personalJobs06.followUps.v1");
  const outcomes = c(counts, "kingsmen.personalJobs07.outcomeLedger.v1");

  return {
    leadPool: leads >= 15 ? "strong" : leads >= 8 ? "usable" : leads > 0 ? "thin" : "empty",
    applyReadiness: packs >= 5 ? "active" : packs > 0 ? "started" : "missing",
    proofDiscipline: submissions >= packs && submissions > 0 ? "controlled" : submissions > 0 ? "partial" : "missing",
    followUpDiscipline: followUps >= submissions && followUps > 0 ? "controlled" : followUps > 0 ? "partial" : "missing",
    outcomeDiscipline: outcomes > 0 ? "started" : "not yet started"
  };
}

function buildCommands(counts: Record<string, number>, targets: DailyTargets): DailyCommand[] {
  const leads = c(counts, "kingsmen.personalJobs02.externalLeads.v1");
  const shortlist = c(counts, "kingsmen.personalJobs03.shortlist.v1");
  const packs = c(counts, "kingsmen.personalJobs04.applyPacks.v1");
  const submissions = c(counts, "kingsmen.personalJobs05.submissions.v1");
  const followUps = c(counts, "kingsmen.personalJobs06.followUps.v1");
  const outcomes = c(counts, "kingsmen.personalJobs07.outcomeLedger.v1");
  const gate = c(counts, "kingsmen.personalJobs08.realUseGate.v1");

  const commands: DailyCommand[] = [];

  if (gate === 0) {
    commands.push({
      id: "run-real-use-gate",
      rank: 1,
      title: "Run the Real Use Gate before trusting today&apos;s campaign.",
      reason: "The desks may be clickable, but the current browser-side smoke gate has not been recorded yet.",
      route: "/personal-job-desk/real-use-gate",
      urgency: "CROWN",
      proofRequired: false
    });
  }

  if (leads < targets.leadTarget) {
    commands.push({
      id: "grow-lead-pool",
      rank: 2,
      title: `Grow the lead pool to at least ${targets.leadTarget} real opportunities.`,
      reason: `Current lead count is ${leads}. A thin lead pool gives weak choice and weak speed.`,
      route: "/personal-job-desk/opportunities",
      urgency: leads === 0 ? "CROWN" : "HIGH",
      proofRequired: false
    });
  }

  if (leads > shortlist) {
    commands.push({
      id: "score-shortlist",
      rank: 3,
      title: "Score the unranked leads.",
      reason: `${leads - shortlist} captured lead(s) are not reflected in the shortlist count.`,
      route: "/personal-job-desk/shortlist",
      urgency: "HIGH",
      proofRequired: false
    });
  }

  if (packs < targets.applyPackTarget || shortlist > packs) {
    commands.push({
      id: "build-apply-packs",
      rank: 4,
      title: `Build at least ${targets.applyPackTarget} CV and motivation apply pack(s).`,
      reason: `Current apply-pack count is ${packs}. Ready packs turn opportunity interest into submission speed.`,
      route: "/personal-job-desk/apply-pack",
      urgency: packs === 0 ? "CROWN" : "HIGH",
      proofRequired: false
    });
  }

  if (submissions < targets.submissionTarget || packs > submissions) {
    commands.push({
      id: "submit-and-prove",
      rank: 5,
      title: `Submit manually and capture at least ${targets.submissionTarget} proof record(s).`,
      reason: `Current submission proof count is ${submissions}. Kingsmen does not treat an application as real without proof.`,
      route: "/personal-job-desk/submissions",
      urgency: packs > submissions ? "CROWN" : "HIGH",
      proofRequired: true
    });
  }

  if (followUps < targets.followUpTarget || submissions > followUps) {
    commands.push({
      id: "follow-up-discipline",
      rank: 6,
      title: "Create follow-up dates and interview-prep tasks.",
      reason: `Current follow-up count is ${followUps}. Submitted applications need controlled follow-up.`,
      route: "/personal-job-desk/follow-up",
      urgency: submissions > followUps ? "HIGH" : "STEADY",
      proofRequired: false
    });
  }

  if (outcomes === 0 || followUps > outcomes) {
    commands.push({
      id: "record-outcomes",
      rank: 7,
      title: "Record responses, interviews, rejections, offers, and decisions.",
      reason: `Current outcome count is ${outcomes}. The campaign only learns when outcomes are recorded honestly.`,
      route: "/personal-job-desk/outcomes",
      urgency: outcomes === 0 ? "STEADY" : "WATCH",
      proofRequired: true
    });
  }

  if (commands.length === 0) {
    commands.push({
      id: "continue-controlled-campaign",
      rank: 1,
      title: "Continue the controlled campaign.",
      reason: "The local chain has activity across the main desks. Keep applying, proving, following up, and learning.",
      route: "/personal-job-desk/outcomes",
      urgency: "STEADY",
      proofRequired: true
    });
  }

  return commands.sort((a, b) => a.rank - b.rank);
}

function exportJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DailyLoopClient({ initialProfile }: { initialProfile: PersonalJobs10SafeProfile }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [targets, setTargets] = useState<DailyTargets>({
    leadTarget: 10,
    applyPackTarget: 3,
    submissionTarget: 3,
    followUpTarget: 3
  });
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [lastReport, setLastReport] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  function refreshDailySnapshot(): void {
    setCounts(buildSnapshot());

    try {
      const saved = localStorage.getItem(DAILY_LOOP_KEY);
      if (saved) setLastReport(JSON.parse(saved));
    } catch {
      setLastReport(null);
    }
  }

  useEffect(() => {
    refreshDailySnapshot();
  }, []);

  const commands = useMemo(() => buildCommands(counts, targets), [counts, targets]);
  const summary = useMemo(() => buildSummary(counts), [counts]);

  function runDailyLoop(): void {
    const nextCounts = buildSnapshot();
    const nextCommands = buildCommands(nextCounts, targets);
    const completedCommandIds = Object.entries(completed).filter(([, value]) => value).map(([id]) => id);

    const report = {
      schema: "kingsmen.personal-jobs-10-daily-operating-loop.v1",
      generatedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      profile: initialProfile,
      targets,
      counts: nextCounts,
      commands: nextCommands,
      completedCommandIds,
      summary: buildSummary(nextCounts)
    };

    localStorage.setItem(DAILY_LOOP_KEY, JSON.stringify(report, null, 2));
    setCounts(nextCounts);
    setLastReport(report);
  }

  async function copyReport(): Promise<void> {
    const payload = lastReport || {
      schema: "kingsmen.personal-jobs-10-daily-operating-loop-copy.v1",
      generatedAt: new Date().toISOString(),
      localOnly: true,
      noSendBoundary: true,
      profile: initialProfile,
      targets,
      counts,
      commands,
      completedCommandIds: Object.entries(completed).filter(([, value]) => value).map(([id]) => id),
      summary
    };

    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section data-kingsmen-personal-jobs-10-daily-loop="true" data-kingsmen-personal-jobs-10-no-send="true" style={{ display: "grid", gap: "18px" }}>
      <section style={panelStyle}>
        <p style={eyebrowStyle}>Campaign officer</p>
        <h2 style={{ margin: "8px 0", color: "#f8d77a", fontSize: "31px" }}>
          {initialProfile.fullName} · {initialProfile.targetRole}
        </h2>
        <p style={{ margin: 0, color: "rgba(248,237,210,0.74)", lineHeight: 1.7 }}>
          {initialProfile.priority}
        </p>
      </section>

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p style={eyebrowStyle}>Today&apos;s targets</p>
            <h2 style={{ margin: "8px 0 0", fontSize: "28px" }}>Set the campaign pressure</h2>
          </div>
          <button type="button" onClick={refreshDailySnapshot} style={buttonStyle}>Refresh local data</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "12px", marginTop: "16px" }}>
          {[
            ["leadTarget", "Lead target"],
            ["applyPackTarget", "Apply-pack target"],
            ["submissionTarget", "Submission proof target"],
            ["followUpTarget", "Follow-up target"]
          ].map(([key, label]) => (
            <label key={key} style={cardStyle}>
              <span style={smallLabelStyle}>{label}</span>
              <input
                type="number"
                min={0}
                value={targets[key as keyof DailyTargets]}
                onChange={(event) => setTargets((current) => ({ ...current, [key]: Number(event.target.value || 0) }))}
                style={inputStyle}
              />
            </label>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Local campaign data</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>Pipeline state from the existing desks</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: "13px" }}>
          {SOURCES.map((source) => {
            const count = counts[source.key] || 0;

            return (
              <a key={source.key} href={source.route} style={routeCardStyle}>
                <span style={smallLabelStyle}>{source.module}</span>
                <strong style={{ display: "block", marginTop: "8px", color: "#f8d77a", fontSize: "26px" }}>{count}</strong>
                <span style={{ display: "block", color: "rgba(248,237,210,0.78)", fontWeight: 900 }}>{source.label}</span>
                <span style={{ display: "block", marginTop: "8px", color: "rgba(248,237,210,0.62)", lineHeight: 1.5 }}>
                  {count > 0 ? "Local data found. Click to review." : source.emptyInstruction}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Command sequence</p>
        <h2 style={{ margin: "8px 0 12px", fontSize: "28px" }}>What must happen today</h2>

        <div style={{ display: "grid", gap: "12px" }}>
          {commands.map((command) => (
            <article key={command.id} style={commandStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ maxWidth: "830px" }}>
                  <span style={smallLabelStyle}>#{command.rank} · {command.urgency}</span>
                  <h3 style={{ margin: "6px 0", color: "#f8d77a", fontSize: "21px" }}>{command.title}</h3>
                  <p style={{ margin: 0, color: "rgba(248,237,210,0.72)", lineHeight: 1.6 }}>{command.reason}</p>
                  <p style={{ margin: "8px 0 0", color: command.proofRequired ? "#f0bd68" : "rgba(248,237,210,0.58)", fontWeight: 900 }}>
                    {command.proofRequired ? "Proof is required before this may be treated as done." : "This command prepares the campaign; it does not contact employers."}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <a href={command.route} style={buttonLinkStyle}>Open desk</a>
                  <button type="button" onClick={() => setCompleted((current) => ({ ...current, [command.id]: !current[command.id] }))} style={buttonStyle}>
                    {completed[command.id] ? "Marked done" : "Mark done"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button type="button" onClick={runDailyLoop} style={buttonStyle}>Run daily loop</button>
          <button type="button" onClick={() => exportJson("personal-jobs-10-daily-loop.local.json", lastReport || { generatedAt: new Date().toISOString(), counts, commands, targets, summary })} style={buttonStyle}>Export daily report</button>
          <button type="button" onClick={copyReport} style={buttonStyle}>{copied ? "Copied" : "Copy report JSON"}</button>
        </div>
      </section>

      <section style={panelStyle}>
        <p style={eyebrowStyle}>Campaign health</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "10px" }}>
          {Object.entries(summary).map(([key, value]) => (
            <article key={key} style={cardStyle}>
              <span style={smallLabelStyle}>{key.replace(/([A-Z])/g, " $1")}</span>
              <strong style={metricStyle}>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section style={warningStyle}>
        <strong>Hard boundary:</strong> PERSONAL-JOBS-10 is a local daily command loop only. It does not send applications, send email, send WhatsApp, contact employers, touch payments, sync calendars, start Docker, deploy to Oracle, or claim production readiness.
      </section>
    </section>
  );
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.20)",
  borderRadius: "28px",
  padding: "20px",
  background: "rgba(0,0,0,0.24)"
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.18)",
  borderRadius: "20px",
  padding: "16px",
  background: "rgba(255,255,255,0.035)"
};

const routeCardStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.20)",
  borderRadius: "22px",
  padding: "17px",
  background: "rgba(255,255,255,0.04)",
  color: "#f8edd2",
  boxShadow: "0 16px 45px rgba(0,0,0,0.20)",
  textDecoration: "none"
};

const commandStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.22)",
  borderRadius: "22px",
  padding: "17px",
  background: "linear-gradient(135deg, rgba(214,178,94,0.10), rgba(255,255,255,0.035))"
};

const warningStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.22)",
  borderRadius: "22px",
  padding: "16px",
  background: "rgba(214,178,94,0.08)",
  color: "rgba(248,237,210,0.78)",
  lineHeight: 1.65
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#d6b25e",
  fontSize: "12px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 900
};

const smallLabelStyle: CSSProperties = {
  color: "rgba(248,237,210,0.58)",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 900
};

const metricStyle: CSSProperties = {
  display: "block",
  marginTop: "8px",
  fontSize: "22px",
  color: "#f8d77a",
  textTransform: "capitalize"
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(214,178,94,0.38)",
  borderRadius: "999px",
  padding: "11px 15px",
  background: "rgba(214,178,94,0.12)",
  color: "#f8d77a",
  fontWeight: 900,
  cursor: "pointer"
};

const buttonLinkStyle: CSSProperties = {
  ...buttonStyle,
  textDecoration: "none"
};

const inputStyle: CSSProperties = {
  width: "100%",
  marginTop: "9px",
  border: "1px solid rgba(214,178,94,0.28)",
  borderRadius: "14px",
  padding: "11px",
  background: "rgba(0,0,0,0.28)",
  color: "#f8d77a",
  fontWeight: 900,
  fontSize: "18px"
};