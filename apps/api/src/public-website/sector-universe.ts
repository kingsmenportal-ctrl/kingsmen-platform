import type { PublicSectorCard } from "./public-website-types";

/**
 * Public-facing service taxonomy. These are category previews, not evidence that
 * a provider is connected or that an opportunity/service is currently available.
 * Exact providers and targets remain sealed until source verification and activation.
 */
export const PUBLIC_SECTOR_CARDS: PublicSectorCard[] = [
  { sectorKey: "UNIVERSITY", sectorName: "Universities", sectorGroup: "EDUCATION", publicDescription: "Public university route visibility, readiness, deadline awareness, document positioning, and application pathway support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "TVET", sectorName: "TVET Colleges", sectorGroup: "EDUCATION", publicDescription: "TVET route visibility, programme fit, document readiness, campus/portal awareness, and fallback support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "SETA_QCTO", sectorName: "SETA / QCTO / Skills", sectorGroup: "SKILLS", publicDescription: "Skills programmes, SETA routes, QCTO-aligned opportunities, and learnership pipeline visibility.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "LEARNERSHIP", sectorName: "Learnerships", sectorGroup: "WORK", publicDescription: "Learnership opportunity intelligence, eligibility readiness, document preparation, and employer intake tracking.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "APPRENTICESHIP", sectorName: "Apprenticeships", sectorGroup: "WORK", publicDescription: "Apprenticeship route discovery, trade-readiness preparation, employer or training-provider intake tracking, and evidence-led follow-up.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "INTERNSHIP", sectorName: "Internships", sectorGroup: "WORK", publicDescription: "Internship route discovery, application preparation, employer intake tracking, and deadline awareness using verified source evidence.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "EMPLOYMENT", sectorName: "Employment", sectorGroup: "WORK", publicDescription: "Employment and entry-level work route support, CV and motivation preparation, application tracking, and interview readiness.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "EMPLOYER_INTERNSHIP", sectorName: "Employers / Work Placements", sectorGroup: "WORK", publicDescription: "Employer, work-integrated learning, entry-level work, and campaign route visibility with CV and motivation positioning.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "BURSARY_SCHOLARSHIP", sectorName: "Bursaries / Scholarships", sectorGroup: "FUNDING", publicDescription: "Funding route preview, document readiness, deadline watch, and evidence-backed target activation.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "GRANTS", sectorName: "Grants and Public Funding", sectorGroup: "FUNDING", publicDescription: "Grant and public-funding discovery, application readiness, supporting-document preparation, and evidence-led status tracking.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "NSFAS", sectorName: "NSFAS Support", sectorGroup: "FUNDING", publicDescription: "NSFAS document support, submission support, and appeal tracking boundaries without approval guarantees.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "CAO", sectorName: "CAO Route Planning", sectorGroup: "CENTRAL_ROUTE", publicDescription: "CAO is treated as one Kingsmen application with internal choices tracked as child items.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "PRIVATE_COLLEGE", sectorName: "Verified Private Colleges", sectorGroup: "PRIVATE_PROVIDER", publicDescription: "Private provider route visibility only after accreditation and source-confidence checks.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "ENTREPRENEURSHIP", sectorName: "Entrepreneurship", sectorGroup: "ENTERPRISE", publicDescription: "Entrepreneurship support discovery, business-readiness guidance, formalisation pathways, and evidence-backed programme referrals.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "BUSINESS_SUPPORT", sectorName: "Small Business Support", sectorGroup: "ENTERPRISE", publicDescription: "Small-business development services, enterprise support, supplier-development pathways, and verified business assistance programmes.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "CREATIVE_INDUSTRIES", sectorName: "Creative Industries", sectorGroup: "CREATIVE_PROFESSIONAL", publicDescription: "Creative-sector opportunities, portfolio readiness, training and funding pathways, and verified calls or commissions.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "PROFESSIONAL_SERVICES", sectorName: "Professional Development", sectorGroup: "CREATIVE_PROFESSIONAL", publicDescription: "Professional development, certification and licensing information, portfolio support, and verified professional opportunities.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "ACCOMMODATION", sectorName: "Accommodation", sectorGroup: "ACCOMMODATION", publicDescription: "Accommodation route preview, readiness, application routing, and stability support; provider availability requires current verification.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "TRANSPORT", sectorName: "Transport Support", sectorGroup: "TRANSPORT", publicDescription: "Transport-support service discovery, mobility assistance pathways, and verified route or subsidy information.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "HEALTHCARE", sectorName: "Healthcare Services", sectorGroup: "HEALTHCARE", publicDescription: "Healthcare-service navigation and verified public or provider referral information; Kingsmen does not provide clinical care.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "CARE_SERVICES", sectorName: "Care and Wellbeing Support", sectorGroup: "HEALTHCARE", publicDescription: "Care and wellbeing support discovery with verified service information and appropriate referral boundaries.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "LEGAL_SERVICES", sectorName: "Legal Services", sectorGroup: "LEGAL_SOCIAL", publicDescription: "Legal-information and assistance-service navigation, verified referral sources, and clear boundaries where professional advice is required.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "SOCIAL_SERVICES", sectorName: "Social Services", sectorGroup: "LEGAL_SOCIAL", publicDescription: "Social-support service navigation, verified public and community assistance pathways, and application-readiness support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "PUBLIC_SERVICES", sectorName: "Public Services", sectorGroup: "PUBLIC_SERVICES", publicDescription: "Public-service information and referral navigation based on authoritative government and public-institution sources.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "COMMUNITY_SUPPORT", sectorName: "Community Support", sectorGroup: "PUBLIC_SERVICES", publicDescription: "Community assistance and local support discovery with verified organisations, service areas, and current referral details.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true }
];

export function allSectorsVisibleFromPublicWebsite(): string[] {
  return PUBLIC_SECTOR_CARDS.map((sector) => sector.sectorKey);
}

export function exactTargetsRemainSealed(): true {
  const leak = PUBLIC_SECTOR_CARDS.find((sector) => !sector.exactTargetsSealed);
  if (leak) throw new Error("PUBLIC_SECTOR_EXACT_TARGETS_MUST_REMAIN_SEALED");
  return true;
}
