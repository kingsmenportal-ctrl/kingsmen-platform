import type { MobileStatusCard } from "./candidate-mobile-types";
import { assertCandidateStatusIsSafe } from "./mobile-policy";

export function buildMobileStatusCard(card: MobileStatusCard): MobileStatusCard {
  assertCandidateStatusIsSafe(`${card.title} ${card.body}`);
  return card;
}

export function buildManualFallbackCard(candidateId: string, reason: string): MobileStatusCard {
  return buildMobileStatusCard({
    candidateId,
    cardKey: "manual_fallback_ready",
    title: "Manual route package ready",
    body: `Automation could not continue because: ${reason}. Open the Manual Application Package for verified steps, links, fees, and evidence instructions.`,
    sourceModule: "orchestrator",
    severity: "warning",
    confidenceBand: "manual_review"
  });
}

export function buildDocumentMissingCard(candidateId: string, documentName: string): MobileStatusCard {
  return buildMobileStatusCard({
    candidateId,
    cardKey: `missing_document_${documentName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    title: "Document needed",
    body: `${documentName} is needed before this route can become execution-ready. Upload it once; the Document Vault will reuse it across matching routes.`,
    sourceModule: "document-vault",
    severity: "info",
    confidenceBand: "system"
  });
}