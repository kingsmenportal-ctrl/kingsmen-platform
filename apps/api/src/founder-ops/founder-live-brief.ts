export type FounderOperationalDomain =
  | "system_health"
  | "queue"
  | "finance"
  | "documents"
  | "matching"
  | "map_playwright"
  | "incidents"
  | "capacity"
  | "urgent_candidates";

export type FounderEvidenceState = "OK" | "WATCH" | "CRITICAL" | "UNKNOWN";
export type FounderSectionState = "FRESH" | "STALE" | "MISSING" | "DEGRADED";
export type FounderOverallState = "HEALTHY" | "WATCH" | "DEGRADED" | "CRITICAL" | "UNKNOWN";

export type FounderOperationalObservation = {
  domain: FounderOperationalDomain;
  sourceRef: string;
  generatedAt: string;
  state: FounderEvidenceState;
  summary: string;
  metrics?: Record<string, number | string | boolean | null>;
};

export type FounderLiveBriefInput = {
  briefType: "MORNING" | "MIDDAY" | "EVENING" | "INCIDENT" | "WEEKLY" | "MONTHLY";
  now?: string;
  activeCandidateCount?: number;
  activeCandidateCap?: number;
  observations: FounderOperationalObservation[];
};

export type FounderLiveBriefSection = {
  domain: FounderOperationalDomain;
  state: FounderSectionState;
  sourceRef: string | null;
  generatedAt: string | null;
  ageSeconds: number | null;
  severity: FounderEvidenceState;
  summary: string;
  metrics: Record<string, number | string | boolean | null>;
};

export type FounderLiveBrief = {
  briefType: FounderLiveBriefInput["briefType"];
  generatedAt: string;
  overallState: FounderOverallState;
  productionReady: false;
  activeCandidateCount: number | null;
  activeCandidateCap: number;
  capState: "WITHIN_CAP" | "AT_CAP" | "OVER_CAP" | "UNKNOWN";
  sections: FounderLiveBriefSection[];
  evidenceRefs: string[];
  warnings: string[];
  recommendedActions: string[];
};

const DOMAINS: FounderOperationalDomain[] = [
  "system_health", "queue", "finance", "documents", "matching",
  "map_playwright", "incidents", "capacity", "urgent_candidates"
];

// Domain freshness budgets are intentionally conservative; a source may override
// nothing. Stale evidence is visible, never silently re-labelled healthy.
const MAX_AGE_SECONDS: Record<FounderOperationalDomain, number> = {
  system_health: 300,
  queue: 300,
  finance: 900,
  documents: 600,
  matching: 900,
  map_playwright: 600,
  incidents: 300,
  capacity: 900,
  urgent_candidates: 300
};

const cleanSummary = (value: string): string => value
  .replace(/[\r\n\t]+/g, " ")
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
  .replace(/\b\d{13}\b/g, "[redacted-id]")
  .replace(/\b(?:\+?27|0)[1-8]\d{8}\b/g, "[redacted-phone]")
  .trim()
  .slice(0, 500);

const SENSITIVE_METRIC_KEY = /(?:name|email|phone|mobile|identity|id_number|address|document|cv|candidate_ref|application_ref|token|secret|password|birth|passport)/i;

function sectionFor(domain: FounderOperationalDomain, observation: FounderOperationalObservation | undefined, nowMs: number): FounderLiveBriefSection {
  if (!observation) {
    return { domain, state: "MISSING", sourceRef: null, generatedAt: null, ageSeconds: null, severity: "UNKNOWN", summary: "No source evidence supplied; health is unknown, not healthy.", metrics: {} };
  }

  const timestamp = Date.parse(observation.generatedAt);
  if (typeof observation.sourceRef !== "string" || !observation.sourceRef.trim() ||\n      typeof observation.summary !== "string" ||\n      !["OK", "WATCH", "CRITICAL", "UNKNOWN"].includes(observation.state) ||\n      !Number.isFinite(timestamp) || timestamp > nowMs + 30_000) {
    return { domain, state: "DEGRADED", sourceRef: null, generatedAt: observation.generatedAt, ageSeconds: null, severity: "UNKNOWN", summary: "Evidence metadata is invalid; source result cannot be trusted.", metrics: {} };
  }

  const ageSeconds = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  const stale = ageSeconds > MAX_AGE_SECONDS[domain];
  const summary = cleanSummary(observation.summary);
  const safeMetrics = Object.fromEntries(Object.entries(observation.metrics ?? {}).filter(([key, value]) =>
    /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key) && !SENSITIVE_METRIC_KEY.test(key) &&
    (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") &&
    !(typeof value === "string" && value.length > 160)
  ));

  return {
    domain,
    state: stale ? "STALE" : observation.state === "UNKNOWN" ? "DEGRADED" : "FRESH",
    sourceRef: observation.sourceRef,
    generatedAt: new Date(timestamp).toISOString(),
    ageSeconds,
    severity: stale ? "UNKNOWN" : observation.state,
    summary: stale ? `Stale source evidence (${ageSeconds}s old): ${summary || "no summary"}` : summary || "Source supplied no explanatory summary.",
    metrics: safeMetrics
  };
}

/**
 * Builds a founder brief from explicit source observations. It does not query
 * systems, infer missing values, approve commands, or assert launch readiness.
 * Callers must obtain each observation from an authorised persisted read model.
 */
export function buildFounderLiveBrief(input: FounderLiveBriefInput): FounderLiveBrief {
  const nowMs = Date.parse(input.now ?? new Date().toISOString());
  if (!Number.isFinite(nowMs)) throw new Error("FOUNDER_BRIEF_INVALID_CLOCK");
  if (!Array.isArray(input.observations)) throw new Error("FOUNDER_BRIEF_OBSERVATIONS_REQUIRED");

  const byDomain = new Map<FounderOperationalDomain, FounderOperationalObservation>();
  for (const observation of input.observations) {
    if (!DOMAINS.includes(observation.domain)) continue;
    const prior = byDomain.get(observation.domain);
    if (!prior || Date.parse(observation.generatedAt) > Date.parse(prior.generatedAt)) byDomain.set(observation.domain, observation);
  }
  const sections = DOMAINS.map((domain) => sectionFor(domain, byDomain.get(domain), nowMs));
  const warnings: string[] = [];
  const missing = sections.filter((section) => section.state === "MISSING");
  const stale = sections.filter((section) => section.state === "STALE");
  const degraded = sections.filter((section) => section.state === "DEGRADED");
  if (missing.length) warnings.push(`Missing evidence: ${missing.map((s) => s.domain).join(", ")}.`);
  if (stale.length) warnings.push(`Stale evidence: ${stale.map((s) => s.domain).join(", ")}.`);
  if (degraded.length) warnings.push(`Untrusted or unknown evidence: ${degraded.map((s) => s.domain).join(", ")}.`);

  const critical = sections.some((section) => section.state === "FRESH" && section.severity === "CRITICAL");
  const watch = sections.some((section) => section.state === "FRESH" && section.severity === "WATCH");
  const complete = sections.every((section) => section.state === "FRESH");
  const overallState: FounderOverallState = critical ? "CRITICAL" : !complete ? "DEGRADED" : watch ? "WATCH" : "HEALTHY";

  const cap = Number.isInteger(input.activeCandidateCap) && (input.activeCandidateCap as number) > 0 ? input.activeCandidateCap as number : 500;
  const count = Number.isInteger(input.activeCandidateCount) && (input.activeCandidateCount as number) >= 0 ? input.activeCandidateCount as number : null;
  const capState = count === null ? "UNKNOWN" : count > cap ? "OVER_CAP" : count === cap ? "AT_CAP" : "WITHIN_CAP";
  if (capState === "OVER_CAP") warnings.push("Active candidate count exceeds the configured operating cap; do not silently disable national route access.");
  if (capState === "AT_CAP") warnings.push("Active candidate cap reached; preserve access to all in-scope national routes and follow capacity controls.");

  const recommendedActions = [
    ...missing.map((section) => `Restore evidence feed for ${section.domain}; keep its health state unknown until verified.`),
    ...stale.map((section) => `Refresh ${section.domain} from its authoritative source.`),
    ...degraded.map((section) => `Investigate ${section.domain} evidence integrity before relying on it.`),
    ...(critical ? ["Review critical operational evidence and route any intervention through N12 approval and N16 execution."] : []),
    ...(capState === "AT_CAP" || capState === "OVER_CAP" ? ["Review capacity and queue-drain evidence; do not remove candidate route eligibility as a capacity shortcut."] : []),
    "Keep founder commands audited; do not use this brief to directly submit applications, settle refunds, or make final fraud/privacy decisions."
  ];

  return {
    briefType: input.briefType,
    generatedAt: new Date(nowMs).toISOString(),
    overallState,
    productionReady: false,
    activeCandidateCount: count,
    activeCandidateCap: cap,
    capState,
    sections,
    evidenceRefs: sections.flatMap((section) => section.sourceRef ? [section.sourceRef] : []),
    warnings,
    recommendedActions
  };
}
