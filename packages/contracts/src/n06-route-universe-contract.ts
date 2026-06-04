export type N06RouteGate =
  | "higher_education"
  | "tvet"
  | "seta_learnership"
  | "internship"
  | "apprenticeship"
  | "employment";

export type N06RouteSystem =
  | "cao"
  | "institution_direct"
  | "nsfas"
  | "tvet_college"
  | "seta_provider"
  | "employer"
  | "bursary_provider"
  | "other";

export type N06RouteUniverseItem = {
  routeId: string;
  gate: N06RouteGate;
  routeSystem: N06RouteSystem;
  institutionOrProviderName: string;
  programmeOrOpportunityName: string;
  province?: string;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  officialInstructionAllowed: boolean;
  productionReady: false;
};