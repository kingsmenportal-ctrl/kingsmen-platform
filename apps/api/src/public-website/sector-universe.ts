import type { PublicSectorCard } from "./public-website-types";

export const PUBLIC_SECTOR_CARDS: PublicSectorCard[] = [
  { sectorKey: "UNIVERSITY", sectorName: "Universities", sectorGroup: "EDUCATION", publicDescription: "Public university route visibility, readiness, deadline awareness, document positioning, and application pathway support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "TVET", sectorName: "TVET Colleges", sectorGroup: "EDUCATION", publicDescription: "TVET route visibility, programme fit, document readiness, campus/portal awareness, and fallback support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "SETA_QCTO", sectorName: "SETA / QCTO / Skills", sectorGroup: "SKILLS", publicDescription: "Skills programmes, SETA routes, QCTO-aligned opportunities, and learnership pipeline visibility.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "LEARNERSHIP", sectorName: "Learnerships", sectorGroup: "WORK", publicDescription: "Learnership opportunity intelligence, eligibility readiness, document preparation, and employer intake tracking.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "EMPLOYER_INTERNSHIP", sectorName: "Employers / Internships", sectorGroup: "WORK", publicDescription: "Employer, internship, entry-level work, and campaign route visibility with CV/motivation positioning.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "BURSARY_SCHOLARSHIP", sectorName: "Bursaries / Scholarships", sectorGroup: "FUNDING", publicDescription: "Funding route preview, document readiness, deadline watch, and evidence-backed target activation.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "NSFAS", sectorName: "NSFAS Support", sectorGroup: "FUNDING", publicDescription: "NSFAS document support, submission support, and appeal tracking boundaries without approval guarantees.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "CAO", sectorName: "CAO Route Planning", sectorGroup: "CENTRAL_ROUTE", publicDescription: "CAO is treated as one Kingsmen application with internal choices tracked as child items.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "ACCOMMODATION", sectorName: "Accommodation", sectorGroup: "ACCOMMODATION", publicDescription: "Accommodation route preview, readiness, application routing, and stability support.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true },
  { sectorKey: "PRIVATE_COLLEGE", sectorName: "Verified Private Colleges", sectorGroup: "PRIVATE_PROVIDER", publicDescription: "Private provider route visibility only after accreditation/source-confidence checks.", previewAllowed: true, exactTargetsSealed: true, officialSourceRequired: true }
];

export function allSectorsVisibleFromPublicWebsite(): string[] {
  return PUBLIC_SECTOR_CARDS.map((sector) => sector.sectorKey);
}

export function exactTargetsRemainSealed(): true {
  const leak = PUBLIC_SECTOR_CARDS.find((sector) => !sector.exactTargetsSealed);
  if (leak) throw new Error("PUBLIC_SECTOR_EXACT_TARGETS_MUST_REMAIN_SEALED");
  return true;
}