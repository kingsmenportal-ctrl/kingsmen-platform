export type JarvisCommandMode =
  | "WAKE"
  | "ANSWER"
  | "LIVE_VERIFY"
  | "REPORT"
  | "INSPECT"
  | "REPAIR"
  | "BUILD"
  | "DEPLOY"
  | "RESEARCH"
  | "PERSONAL_ASSIST"
  | "RISK"
  | "DECIDE";

export type JarvisToolRoute =
  | "wake-greeting-engine"
  | "live-intelligence-agent"
  | "personal-desk-agent"
  | "kingsmen-backend-api"
  | "postgresql-truth-vault"
  | "airtable-mirror"
  | "n8n-thin-worker"
  | "playwright-portal-scout"
  | "openclaw-gateway"
  | "research-agents"
  | "github-repo-agent"
  | "powershell-creator"
  | "finance-agent"
  | "document-vault-agent"
  | "application-workbench-agent"
  | "security-compliance-agent"
  | "general-ai-answer";

export interface JarvisContext {
  day?: string;
  date?: string;
  time?: string;
  location?: string;
  weather?: string;
  calendarSummary?: string;
  commandStatus?: "Green" | "Amber" | "Red";
}

export interface JarvisClassification {
  mode: JarvisCommandMode;
  route: JarvisToolRoute;
  liveVerificationRequired: boolean;
  evidenceRequired: boolean;
  commanderDecisionRequired: boolean;
  greetingRequired: boolean;
  reason: string;
}

const LIVE_VERIFICATION_TERMS = [
  "open",
  "opening date",
  "closing date",
  "deadline",
  "latest",
  "current",
  "today",
  "tomorrow",
  "weather",
  "news",
  "price",
  "fee",
  "job",
  "vacancy",
  "application date",
  "government",
  "law",
  "regulation",
  "portal status",
  "company",
  "nsfas",
  "cao",
  "tvet",
  "seta",
  "bursary",
  "learnership"
];

const REPORT_TERMS = [
  "report",
  "brief",
  "status",
  "pipeline",
  "health",
  "finance",
  "document vault",
  "application workbench",
  "closeout",
  "morning brief",
  "midday brief",
  "evening brief"
];

const REPAIR_TERMS = ["repair", "fix", "correct", "patch", "broken", "failed", "error", "bug"];
const BUILD_TERMS = ["build", "create", "generate", "make", "design", "architecture"];
const DEPLOY_TERMS = ["deploy", "repo", "github", "commit", "push", "powershell", "migration"];
const PORTAL_TERMS = ["portal", "form", "website", "playwright", "browser", "captcha", "otp"];
const PERSONAL_TERMS = ["calendar", "email", "weather", "time", "date", "remind", "schedule", "day"];
const RISK_TERMS = ["risk", "safe", "unsafe", "compliance", "popia", "fraud", "refund", "payment", "legal"];
const DECISION_TERMS = ["decide", "decision", "recommend", "best command", "what should i do", "next command"];

export const JARVIS_STANDARD_WAKE =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.";

export const JARVIS_SHORT_WAKE =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. Your command desk is prepared, and I am standing by, Sir.";

function containsAny(input: string, terms: string[]): boolean {
  return terms.some((term) => input.includes(term));
}

export function isJarvisWake(input: string): boolean {
  const normalised = input.trim().toLowerCase();
  return normalised === "jarvis" || normalised.startsWith("jarvis,") || normalised.startsWith("jarvis ");
}

export function stripWakeWord(input: string): string {
  return input.replace(/^\s*jarvis[,.\s]*/i, "").trim();
}

export function requiresLiveVerification(input: string): boolean {
  return containsAny(input.toLowerCase(), LIVE_VERIFICATION_TERMS);
}

export function selectWakeGreeting(context: JarvisContext = {}): string {
  const hour = parseHour(context.time);

  if (context.day && context.date && context.time && context.location && context.weather) {
    return `Welcome to Kingsmen Command, Commander. Jarvis is online. Today is ${context.day}, ${context.date}. The local time is ${context.time} in ${context.location}. Current conditions are ${context.weather}. Your command desk is prepared: Kingsmen system health, route intelligence, application workbench, document vault, finance, automation, Playwright scouting, OpenClaw intelligence, agent reports, calendar, email, research, and personal command assistance are ready for your instruction.`;
  }

  if (hour !== null && hour < 12) {
    return `Good morning, Commander. Welcome to Kingsmen Command. Jarvis is online. Today is ${context.day ?? "the present day"}, ${context.date ?? "date pending"}, and the local time is ${context.time ?? "time pending"}. Your command desk is prepared for system health, route intelligence, documents, finance, automation, live research, personal assistance, and priority decisions.`;
  }

  if (hour !== null && hour < 18) {
    return "Good afternoon, Commander. Welcome to Kingsmen Command. Jarvis is online. The command house is active. I am ready to brief the present position, inspect live intelligence, review risks, organise your day, or execute your next instruction.";
  }

  if (hour !== null) {
    return "Good evening, Commander. Welcome to Kingsmen Command. Jarvis is online. I am ready to prepare the closeout brief, unresolved risks, tomorrow’s command queue, system health, personal assistance, and any matter requiring your decision before the day is sealed.";
  }

  return JARVIS_STANDARD_WAKE;
}

export function classifyJarvisCommand(input: string): JarvisClassification {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const greetingRequired = isJarvisWake(raw);
  const command = greetingRequired ? stripWakeWord(raw).toLowerCase() : lower;

  if (greetingRequired && command.length === 0) {
    return {
      mode: "WAKE",
      route: "wake-greeting-engine",
      liveVerificationRequired: false,
      evidenceRequired: false,
      commanderDecisionRequired: false,
      greetingRequired: true,
      reason: "Commander woke Jarvis without an additional command."
    };
  }

  if (containsAny(command, PORTAL_TERMS)) {
    return {
      mode: "INSPECT",
      route: "playwright-portal-scout",
      liveVerificationRequired: true,
      evidenceRequired: true,
      commanderDecisionRequired: false,
      greetingRequired,
      reason: "Portal or browser inspection requires live scouting and evidence."
    };
  }

  if (containsAny(command, RISK_TERMS)) {
    return {
      mode: "RISK",
      route: "security-compliance-agent",
      liveVerificationRequired: command.includes("payment") || command.includes("legal") || command.includes("refund"),
      evidenceRequired: true,
      commanderDecisionRequired: command.includes("refund") || command.includes("legal") || command.includes("payment"),
      greetingRequired,
      reason: "Risk, compliance, payment, legal, or safety language detected."
    };
  }

  if (containsAny(command, DECISION_TERMS)) {
    return {
      mode: "DECIDE",
      route: "research-agents",
      liveVerificationRequired: requiresLiveVerification(command),
      evidenceRequired: true,
      commanderDecisionRequired: true,
      greetingRequired,
      reason: "Commander requested recommendation or decision support."
    };
  }

  if (containsAny(command, REPORT_TERMS)) {
    return {
      mode: "REPORT",
      route: "kingsmen-backend-api",
      liveVerificationRequired: command.includes("latest") || command.includes("today"),
      evidenceRequired: true,
      commanderDecisionRequired: false,
      greetingRequired,
      reason: "Report or briefing language detected."
    };
  }

  if (containsAny(command, REPAIR_TERMS)) {
    return {
      mode: "REPAIR",
      route: "github-repo-agent",
      liveVerificationRequired: false,
      evidenceRequired: true,
      commanderDecisionRequired: false,
      greetingRequired,
      reason: "Repair or defect language detected."
    };
  }

  if (containsAny(command, DEPLOY_TERMS)) {
    return {
      mode: "DEPLOY",
      route: command.includes("powershell") ? "powershell-creator" : "github-repo-agent",
      liveVerificationRequired: false,
      evidenceRequired: true,
      commanderDecisionRequired: false,
      greetingRequired,
      reason: "Deployment, repository, or script-generation language detected."
    };
  }

  if (containsAny(command, BUILD_TERMS)) {
    return {
      mode: "BUILD",
      route: "github-repo-agent",
      liveVerificationRequired: false,
      evidenceRequired: true,
      commanderDecisionRequired: false,
      greetingRequired,
      reason: "Build or architecture language detected."
    };
  }

  if (containsAny(command, PERSONAL_TERMS)) {
    return {
      mode: "PERSONAL_ASSIST",
      route: "personal-desk-agent",
      liveVerificationRequired: command.includes("weather") || command.includes("time") || command.includes("today"),
      evidenceRequired: command.includes("email") || command.includes("calendar"),
      commanderDecisionRequired: false,
      greetingRequired,
      reason: "Personal assistance language detected."
    };
  }

  if (requiresLiveVerification(command)) {
    return {
      mode: "LIVE_VERIFY",
      route: "live-intelligence-agent",
      liveVerificationRequired: true,
      evidenceRequired: true,
      commanderDecisionRequired: false,
      greetingRequired,
      reason: "Question may involve current, official, or time-sensitive information."
    };
  }

  return {
    mode: "ANSWER",
    route: "general-ai-answer",
    liveVerificationRequired: false,
    evidenceRequired: false,
    commanderDecisionRequired: false,
    greetingRequired,
    reason: "General lawful Commander question."
  };
}

export function formatSeriousResponse(params: {
  verified: string;
  unverified?: string;
  operationalMeaning: string;
  risk?: string;
  recommendedCommand: string;
}): string {
  return [
    "Certainly, Commander.",
    "",
    "Verified:",
    params.verified,
    "",
    "Unverified:",
    params.unverified ?? "No material uncertainty has been identified.",
    "",
    "Operational meaning:",
    params.operationalMeaning,
    "",
    "Risk:",
    params.risk ?? "No immediate risk has been identified.",
    "",
    "Recommended command:",
    params.recommendedCommand,
    "",
    "Standing by, Sir."
  ].join("\n");
}

export function buildJarvisOpening(input: string, context: JarvisContext = {}): string | null {
  if (!isJarvisWake(input)) return null;
  return selectWakeGreeting(context);
}

function parseHour(time?: string): number | null {
  if (!time) return null;
  const match = time.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)?/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const meridiem = match[2]?.toLowerCase();

  if (Number.isNaN(hour) || hour < 0 || hour > 24) return null;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour;
}
