import type { CandidateDecisionSignals, SourceConfidence } from "./ai-decision-types";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export function buildCandidateDecisionSignals(input: {
  candidateRef: string;
  profileCompleteness: number;
  documentReadiness: number;
  academicFit: number;
  fundingNeed?: number;
  accommodationNeed?: number;
  urgencyScore?: number;
  provincePreference?: string;
  sectorPreferences?: string[];
  riskFlags?: string[];
  evidenceRefs: string[];
  sourceConfidence?: SourceConfidence;
}): CandidateDecisionSignals {
  if (!input.candidateRef.trim()) throw new Error("candidateRef is required.");
  if (input.evidenceRefs.length === 0) throw new Error("Candidate decision signals require evidenceRefs.");

  return {
    signalRef: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidateRef,
    profileCompleteness: clampScore(input.profileCompleteness),
    documentReadiness: clampScore(input.documentReadiness),
    academicFit: clampScore(input.academicFit),
    fundingNeed: clampScore(input.fundingNeed ?? 0),
    accommodationNeed: clampScore(input.accommodationNeed ?? 0),
    urgencyScore: clampScore(input.urgencyScore ?? 0),
    provincePreference: input.provincePreference,
    sectorPreferences: input.sectorPreferences ?? [],
    riskFlags: input.riskFlags ?? [],
    evidenceRefs: input.evidenceRefs,
    sourceConfidence: input.sourceConfidence ?? "MEDIUM"
  };
}

export function hasHardSignalRisk(signals: CandidateDecisionSignals): boolean {
  return signals.riskFlags.some((flag) =>
    ["fraud", "privacy", "official_status", "payment", "refund", "hard_blocker"].includes(flag.toLowerCase())
  );
}