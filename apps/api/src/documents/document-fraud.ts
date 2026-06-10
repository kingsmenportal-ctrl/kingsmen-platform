import type { DocumentFileRecord } from "./document-types";

export type DocumentFraudFlagType =
  | "DUPLICATE_FILE"
  | "MISMATCHED_IDENTITY"
  | "TAMPER_SIGNAL"
  | "UNREADABLE"
  | "EXPIRED"
  | "INCONSISTENT_RESULTS"
  | "SUSPICIOUS_METADATA"
  | "OTHER";

export interface DocumentFraudFlagInput {
  document: DocumentFileRecord;
  flagType: DocumentFraudFlagType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  evidenceRef?: string;
}

export interface DocumentFraudFlagRecord {
  flagRef: string;
  documentRef: string;
  flagType: DocumentFraudFlagType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "FALSE_POSITIVE" | "ESCALATED";
  summary: string;
  evidenceRef?: string;
}

export function createFraudFlag(input: DocumentFraudFlagInput): DocumentFraudFlagRecord {
  if (!input.summary || input.summary.trim().length < 5) {
    throw new Error("Fraud flag summary is required.");
  }

  return {
    flagRef: `docflag_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    documentRef: input.document.documentRef,
    flagType: input.flagType,
    severity: input.severity,
    status: input.severity === "CRITICAL" ? "ESCALATED" : "OPEN",
    summary: input.summary,
    evidenceRef: input.evidenceRef
  };
}

export function fraudFlagIsFinalDecision(): false {
  return false;
}