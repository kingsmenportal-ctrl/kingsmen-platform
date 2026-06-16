export interface ExtractedCandidateField {
  key: string;
  value: string;
  confidence: number;
  source: "cv" | "id_document" | "academic_record" | "candidate" | "operator";
  candidateConfirmed: boolean;
}

export interface SmartMobileQuestion {
  key: string;
  label: string;
  reason: "missing" | "low_confidence" | "candidate_confirmation";
  prefill?: string;
}

export function buildMobileSmartQuestions(fields: ExtractedCandidateField[]): SmartMobileQuestion[] {
  const required: Array<readonly [key: string, label: string]> = [
    ["full_name", "Full names"],
    ["id_number", "ID number"],
    ["phone", "Phone number"],
    ["email", "Email address"],
    ["highest_grade", "Highest grade / qualification"],
    ["home_address", "Residential address"]
  ];

  const byKey = new Map(fields.map((f) => [f.key, f]));

  return required.flatMap<SmartMobileQuestion>(([key, label]) => {
    const field = byKey.get(key);
    if (!field || !field.value) return [{ key, label, reason: "missing" }];
    if (field.confidence < 0.78) return [{ key, label, reason: "low_confidence", prefill: field.value }];
    if (!field.candidateConfirmed && field.source !== "candidate") {
      return [{ key, label, reason: "candidate_confirmation", prefill: field.value }];
    }
    return [];
  });
}

export function smartFormDoesNotRetypeDocumentData(): true {
  return true;
}
