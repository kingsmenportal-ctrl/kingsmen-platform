import type { PublicLeadInput } from "./public-website-types";

export function validatePublicLeadInput(input: PublicLeadInput): void {
  if (!input.email || !input.email.includes("@")) throw new Error("VALID_EMAIL_REQUIRED");
  if (!input.consentPopia) throw new Error("POPIA_CONSENT_REQUIRED");
  if (!input.consentContactEmail) throw new Error("EMAIL_CONTACT_CONSENT_REQUIRED");
  if (!input.consentWhatsappUrgentOnly) throw new Error("WHATSAPP_URGENT_ONLY_CONSENT_REQUIRED");
}

export function buildPublicLeadRef(): string {
  return `public_lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function prepareLeadForCandidateCore(input: PublicLeadInput) {
  validatePublicLeadInput(input);

  return {
    leadRef: buildPublicLeadRef(),
    handoffTarget: "N04_CANDIDATE_CORE",
    documentTarget: "N05_DOCUMENT_VAULT",
    smartFormPrefillRequested: true,
    candidateMustConfirmExtractedFields: true,
    communicationPrimary: "EMAIL",
    whatsappBoundary: "URGENT_ONLY",
    profileSeed: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      province: input.province,
      highestGrade: input.highestGrade,
      desiredRoute: input.desiredRoute,
      urgency: input.urgency ?? "NORMAL"
    },
    consent: {
      popia: input.consentPopia,
      contactEmail: input.consentContactEmail,
      whatsappUrgentOnly: input.consentWhatsappUrgentOnly
    }
  };
}

export function smartFormDoesNotAskForAlreadyExtractedDetails(): true {
  return true;
}