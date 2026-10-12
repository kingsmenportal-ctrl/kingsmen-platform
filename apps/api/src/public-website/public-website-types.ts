export type PublicPageType =
  | "HOME"
  | "DESTINY_MAP"
  | "PRICING"
  | "SECTORS"
  | "CV_REVAMP"
  | "ACCOMMODATION"
  | "HOW_IT_WORKS"
  | "TRUST_SAFETY"
  | "FAQ"
  | "CONTACT"
  | "LEGAL";

export type PublicLeadStatus =
  | "NEW"
  | "CONTACTABLE"
  | "WAITING_DOCUMENTS"
  | "HANDED_TO_CANDIDATE_CORE"
  | "UNQUALIFIED"
  | "DUPLICATE"
  | "CANCELLED";

export type PublicPackageKey = "FREE_DESTINY_MAP" | "CV_REVAMP" | "ARTISAN_CHARTER" | "FOUNDATIONAL_ACCORD" | "GUILDMASTERS_CHARTER" | "COLLEGIATE_ORDINANCE" | "CHANCELLORS_WRIT" | "REGENCY_MANDATE";

export interface PublicPackageCard {
  packageKey: PublicPackageKey;
  packageName: string;
  priceLabel: string;
  managedApplicationCount: number;
  includedCvVersions: number;
  includedMotivationLetters: number;
  includedAccommodationRoutes: number;
  serviceTermDays?: number;
  acknowledgementTargetBusinessHours?: number;
  firstResponseTargetBusinessHours?: number;
  upgradeBonusRoutesWhenCvRevampOwned?: number;
  refundPolicyVersion?: string;
  catalogueVersion?: string;
  responseTargetDisclaimer?: string;
  routeVisibility: "PREVIEW_ONLY" | "SEALED" | "ACTIVATED";
  boundary: string;
}

export interface PublicSectorCard {
  sectorKey: string;
  sectorName: string;
  sectorGroup: "EDUCATION" | "FUNDING" | "WORK" | "ACCOMMODATION" | "SKILLS" | "PRIVATE_PROVIDER" | "CENTRAL_ROUTE";
  publicDescription: string;
  previewAllowed: boolean;
  exactTargetsSealed: boolean;
  officialSourceRequired: boolean;
}

export interface PublicLeadInput {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  province?: string;
  highestGrade?: string;
  desiredRoute?: string;
  urgency?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  consentPopia: boolean;
  consentContactEmail: boolean;
  consentWhatsappUrgentOnly: boolean;
  cvUploaded?: boolean;
  documentsUploaded?: boolean;
}

export interface DestinyMapPreview {
  requestRef: string;
  priceLabel: "R0";
  managedApplications: 0;
  previewScope: "ALL_SECTOR_PREVIEW";
  exactTargetsSealed: true;
  activationPrompt: string;
  visibleSectors: string[];
  hiddenUntilActivation: string[];
}

export interface PublicWebsiteReadModel {
  identity: string;
  heroPromise: string;
  packageCards: PublicPackageCard[];
  sectorCards: PublicSectorCard[];
  hardBoundaries: string[];
  leadCaptureEnabled: boolean;
}