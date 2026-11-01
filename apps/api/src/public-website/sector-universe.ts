import type { PublicSectorCard } from "./public-website-types";

/**
 * Public-facing national service taxonomy. A category is not proof that a provider
 * is connected or that a service/opportunity is currently available.
 * Exact provider targets remain sealed until official-source verification.
 */
export const PUBLIC_SECTOR_CARDS: PublicSectorCard[] = [
  { sectorKey: "UNIVERSITY", sectorName: "Universities", sectorGroup: "EDUCATION", publicDescription: "University route visibility, readiness, deadline awareness and application support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "TVET", sectorName: "TVET Colleges", sectorGroup: "EDUCATION", publicDescription: "TVET programme fit, document readiness, campus awareness and application support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "CAO", sectorName: "CAO Route Planning", sectorGroup: "CENTRAL_ROUTE", publicDescription: "One Kingsmen application with ordered CAO programme choices tracked as child records.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "PRIVATE_COLLEGE", sectorName: "Verified Private Colleges", sectorGroup: "PRIVATE_PROVIDER", publicDescription: "Private-provider route visibility only after accreditation and source-confidence checks.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "SETA_QCTO", sectorName: "SETA / QCTO / Skills", sectorGroup: "SKILLS", publicDescription: "Skills programmes, SETA routes, QCTO-aligned opportunities and training pathways.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "LEARNERSHIP", sectorName: "Learnerships", sectorGroup: "WORK", publicDescription: "Learnership discovery, readiness, document preparation and intake tracking.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "APPRENTICESHIP", sectorName: "Apprenticeships", sectorGroup: "WORK", publicDescription: "Trade training routes, apprenticeship readiness and employer/provider intake tracking.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "INTERNSHIP", sectorName: "Internships", sectorGroup: "WORK", publicDescription: "Internship discovery, application preparation and verified deadline awareness.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "EMPLOYMENT", sectorName: "Employment", sectorGroup: "WORK", publicDescription: "Employment and entry-level work route support, CV preparation and application tracking.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "EMPLOYER_INTERNSHIP", sectorName: "Employers / Work Placements", sectorGroup: "WORK", publicDescription: "Employer campaigns, work-integrated learning and work-placement route visibility.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "BURSARY_SCHOLARSHIP", sectorName: "Bursaries / Scholarships", sectorGroup: "FUNDING", publicDescription: "Funding route previews, document readiness and evidence-backed target activation.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "GRANTS", sectorName: "Grants and Public Funding", sectorGroup: "FUNDING", publicDescription: "Grant discovery, application readiness and supporting-document preparation.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "NSFAS", sectorName: "NSFAS Support", sectorGroup: "FUNDING", publicDescription: "NSFAS document and appeal support without approval guarantees.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "ENTREPRENEURSHIP", sectorName: "Entrepreneurship", sectorGroup: "ENTERPRISE", publicDescription: "Business-readiness guidance, formalisation pathways and verified enterprise referrals.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "BUSINESS_SUPPORT", sectorName: "Small Business Support", sectorGroup: "ENTERPRISE", publicDescription: "Enterprise development, supplier development and small-business assistance programmes.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "CREATIVE_INDUSTRIES", sectorName: "Creative Industries", sectorGroup: "CREATIVE_PROFESSIONAL", publicDescription: "Creative-sector opportunities, portfolio readiness, funding and verified calls.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "PROFESSIONAL_SERVICES", sectorName: "Professional Development", sectorGroup: "CREATIVE_PROFESSIONAL", publicDescription: "Professional development, certification and licensing information and opportunities.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "ACCOMMODATION", sectorName: "Accommodation", sectorGroup: "ACCOMMODATION", publicDescription: "Accommodation application routing and support; provider availability needs current verification.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "TRANSPORT", sectorName: "Transport Support", sectorGroup: "TRANSPORT", publicDescription: "Mobility assistance, transport-support services and verified subsidy information.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "HEALTHCARE", sectorName: "Healthcare Services", sectorGroup: "HEALTHCARE", publicDescription: "Healthcare navigation and verified referrals; Kingsmen does not provide clinical care.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "CARE_SERVICES", sectorName: "Care and Wellbeing Support", sectorGroup: "HEALTHCARE", publicDescription: "Care and wellbeing service discovery with appropriate referral boundaries.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "LEGAL_SERVICES", sectorName: "Legal Services", sectorGroup: "LEGAL_SOCIAL", publicDescription: "Legal assistance navigation and verified referrals where professional advice may be required.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "SOCIAL_SERVICES", sectorName: "Social Services", sectorGroup: "LEGAL_SOCIAL", publicDescription: "Social-support navigation and verified public or community assistance pathways.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "PUBLIC_SERVICES", sectorName: "Public Services", sectorGroup: "PUBLIC_SERVICES", publicDescription: "Public-service information and referrals grounded in authoritative sources.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "COMMUNITY_SUPPORT", sectorName: "Community Support", sectorGroup: "PUBLIC_SERVICES", publicDescription: "Community assistance discovery with verified service areas and current referral details.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true }
];

export function allSectorsVisibleFromPublicWebsite(): string[] {
  return PUBLIC_SECTOR_CARDS.map((sector) => sector.sectorKey);
}

export function exactTargetsRemainSealed(): true {
  if (PUBLIC_SECTOR_CARDS.some((sector) => !sector.exactTargetsSealed)) {
    throw new Error("PUBLIC_SECTOR_EXACT_TARGETS_MUST_REMAIN_SEALED");
  }
  return true;
}
