export type KingsmenPublicRouteKey =
  | "higher_education"
  | "tvet"
  | "seta_learnerships"
  | "internships"
  | "apprenticeships"
  | "employment"
  | "nsfas_bursaries"
  | "accommodation"
  | "cv_readiness"
  | "documents"
  | "source_confidence"
  | "phoenix_fallback";

export interface KingsmenPublicRouteCard {
  key: KingsmenPublicRouteKey;
  title: string;
  shortFact: string;
  userNeed: string;
  kingsmenHelp: string;
}

export interface FreeDestinyMapDraft {
  fullName?: string;
  province?: string;
  currentSituation?: string;
  knownRoute?: string;
  needsAccommodation?: boolean;
  needsFundingHelp?: boolean;
  needsCvHelp?: boolean;
  hasDocumentsReady?: boolean;
  randomSourceName?: string;
  consentToBeContacted?: boolean;
}

export interface FreeDestinyMapShellModel {
  productionReady: false;
  title: "Free Destiny Map";
  disclaimer: string;
  routeCards: KingsmenPublicRouteCard[];
}

export const FREE_DESTINY_MAP_DISCLAIMER =
  "Kingsmen does not guarantee acceptance, funding, jobs, accommodation, or official outcomes. Kingsmen helps you map routes, documents, source confidence, next steps, and fallback options.";

export const KINGSMEN_PUBLIC_ROUTE_CARDS: KingsmenPublicRouteCard[] = [
  {
    key: "higher_education",
    title: "University routes",
    shortFact: "University planning is not only choosing a name. It includes documents, funding, location, proof and backup routes.",
    userNeed: "For users applying to or exploring public/private university routes.",
    kingsmenHelp: "Kingsmen helps map readiness, requirements, funding needs, accommodation needs and fallback routes."
  },
  {
    key: "tvet",
    title: "TVET routes",
    shortFact: "TVET is part of South Africa's post-school movement and can connect to practical, vocational and work-facing routes.",
    userNeed: "For users who want college, skills, campus and practical route options.",
    kingsmenHelp: "Kingsmen helps compare TVET, funding, documents, location and next-step readiness."
  },
  {
    key: "seta_learnerships",
    title: "SETA and learnership routes",
    shortFact: "Learnership routes often involve source checks, CV readiness, documents, location and training/work attendance.",
    userNeed: "For users who heard about or are searching for learnerships and skills programmes.",
    kingsmenHelp: "Kingsmen helps check source confidence and prepare CV, documents and route fit."
  },
  {
    key: "employment",
    title: "Work and CV routes",
    shortFact: "A CV is not separate from the route. It connects to qualification, location, documents and opportunity source confidence.",
    userNeed: "For job seekers, internship seekers and apprenticeship candidates.",
    kingsmenHelp: "Kingsmen helps prepare the CV path and connect it to route planning."
  },
  {
    key: "nsfas_bursaries",
    title: "Funding and bursary readiness",
    shortFact: "Admission and funding are separate problems. Users may need documents, proof and backup funding routes.",
    userNeed: "For users who need NSFAS, bursary or funding guidance.",
    kingsmenHelp: "Kingsmen helps map documents, official-source confidence and next actions."
  },
  {
    key: "accommodation",
    title: "Accommodation route",
    shortFact: "Accommodation is not just a room. It depends on campus, workplace, training site, budget, documents, proof and source safety.",
    userNeed: "For users who may need a place near study, work, learnership, internship, apprenticeship or training.",
    kingsmenHelp: "Kingsmen helps capture the need and connect it to the full route. Package users can see this as part of their current Kingsmen support where relevant."
  }
];
