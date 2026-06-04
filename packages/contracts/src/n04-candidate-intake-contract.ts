export type N04CandidateGate =
  | "higher_education"
  | "tvet"
  | "seta_learnership"
  | "internship"
  | "apprenticeship"
  | "employment";

export type N04CandidateIntakeTruth = {
  intakeId: string;
  candidateId: string;
  knownRoute: boolean;
  selectedKnownRouteName?: string;
  documentsReady: boolean;
  fundingNeed: boolean;
  accommodationNeed: boolean;
  cvHelpNeeded: boolean;
  preferredGates: N04CandidateGate[];
  visibleGates: N04CandidateGate[];
  assessableGates: N04CandidateGate[];
  packageControlsIntensityNotGateAccess: true;
  createdAt: string;
};