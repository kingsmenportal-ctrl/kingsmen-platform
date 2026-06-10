import type { AirtableBaseDefinition } from "./airtable-types";

export const AIRTABLE_BASE_REGISTRY: readonly AirtableBaseDefinition[] = [
  {
    key: "nexus_7",
    name: "Kingsman Nexus-7",
    envVar: "AIRTABLE_BASE_NEXUS_7",
    purpose: "Candidate portal sessions, form drafts, WhatsApp pairing, notifications, and onboarding mirror.",
    inboundAllowed: true,
    outboundAllowed: true
  },
  {
    key: "nexus_msb",
    name: "Kingsman Nexus (MSB)",
    envVar: "AIRTABLE_BASE_NEXUS_MSB",
    purpose: "Sovereign council, student profiles, qualification profiles, and sync-state mirror.",
    inboundAllowed: true,
    outboundAllowed: true
  },
  {
    key: "applications_hub",
    name: "Applications Hub",
    envVar: "AIRTABLE_BASE_APPLICATIONS_HUB",
    purpose: "Applications, timeline, war room, automation runs, and portal execution mirror.",
    inboundAllowed: false,
    outboundAllowed: true
  },
  {
    key: "ai_engine",
    name: "AI Engine",
    envVar: "AIRTABLE_BASE_AI_ENGINE",
    purpose: "Model configs, prompt templates, knowledge base pointers, execution logs, content, and scoring mirror.",
    inboundAllowed: false,
    outboundAllowed: true
  },
  {
    key: "ai_decision_orchestration",
    name: "AI Decision & Orchestration Engine",
    envVar: "AIRTABLE_BASE_AI_DECISION_ORCHESTRATION",
    purpose: "Destiny maps, predictions, optimization rules, and recommendation audit mirror.",
    inboundAllowed: false,
    outboundAllowed: true
  },
  {
    key: "system_operations",
    name: "System Operations",
    envVar: "AIRTABLE_BASE_SYSTEM_OPERATIONS",
    purpose: "Health, capacity, errors, incidents, and runtime operations mirror.",
    inboundAllowed: false,
    outboundAllowed: true
  },
  {
    key: "automation_control",
    name: "Automation Control",
    envVar: "AIRTABLE_BASE_AUTOMATION_CONTROL",
    purpose: "Approvals queue, kill switches, rate limits, trigger rules, execution logs, and workflow versions mirror.",
    inboundAllowed: true,
    outboundAllowed: true
  },
  {
    key: "communications_center",
    name: "Communications Center",
    envVar: "AIRTABLE_BASE_COMMUNICATIONS_CENTER",
    purpose: "Messages, campaigns, tickets, and email-first communication ledger mirror.",
    inboundAllowed: true,
    outboundAllowed: true
  },
  {
    key: "programs_intelligence",
    name: "Programs & Intelligence",
    envVar: "AIRTABLE_BASE_PROGRAMS_INTELLIGENCE",
    purpose: "Programs, institutions, requirements, SETA programs, bursaries, accommodation, matching, and deadlines mirror.",
    inboundAllowed: false,
    outboundAllowed: true
  },
  {
    key: "financial_operations",
    name: "Kingsmen Financial Operations",
    envVar: "AIRTABLE_BASE_FINANCIAL_OPERATIONS",
    purpose: "Invoices, payments, plans, orders, expenses, and financial summary mirror.",
    inboundAllowed: false,
    outboundAllowed: true
  },
  {
    key: "partner_ecosystem",
    name: "Partner Ecosystem Directory",
    envVar: "AIRTABLE_BASE_PARTNER_ECOSYSTEM",
    purpose: "Institutions, SETA providers, employers, bursary providers, portal DNA, fees, contacts, and health monitor mirror.",
    inboundAllowed: false,
    outboundAllowed: true
  },
  {
    key: "document_vault",
    name: "Document Vault",
    envVar: "AIRTABLE_BASE_DOCUMENT_VAULT",
    purpose: "Documents, requests, AI analysis, verification, fraud, and storage monitoring mirror.",
    inboundAllowed: true,
    outboundAllowed: true
  }
] as const;

export function getAirtableBaseDefinition(key: AirtableBaseDefinition["key"]): AirtableBaseDefinition {
  const base = AIRTABLE_BASE_REGISTRY.find((item) => item.key === key);
  if (!base) {
    throw new Error(`Unknown Airtable base key: ${key}`);
  }
  return base;
}