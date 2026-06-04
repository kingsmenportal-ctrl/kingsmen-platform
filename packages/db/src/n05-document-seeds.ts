export const N05_DOCUMENT_TYPE_SEEDS = [
  { code: "id_document", displayName: "ID Document", requiredForGate: "all" },
  { code: "latest_results", displayName: "Latest Results", requiredForGate: "higher_education" },
  { code: "matric_certificate", displayName: "Matric Certificate", requiredForGate: "higher_education" },
  { code: "proof_of_residence", displayName: "Proof of Residence", requiredForGate: "funding" },
  { code: "parent_guardian_id", displayName: "Parent or Guardian ID", requiredForGate: "funding" },
  { code: "proof_of_income", displayName: "Proof of Income", requiredForGate: "funding" },
  { code: "cv", displayName: "CV", requiredForGate: "employment" },
  { code: "motivation_letter", displayName: "Motivation Letter", requiredForGate: "multiple" },
  { code: "academic_transcript", displayName: "Academic Transcript", requiredForGate: "higher_education" },
  { code: "bank_confirmation", displayName: "Bank Confirmation", requiredForGate: "payments" }
] as const;

export function assertN05DocumentSeedsSafe() {
  if (N05_DOCUMENT_TYPE_SEEDS.length < 10) {
    throw new Error("N05 document seeds require at least 10 baseline document types");
  }

  return true;
}