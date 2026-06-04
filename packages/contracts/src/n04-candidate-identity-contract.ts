export type N04CandidateIdentity = {
  candidateId: string;
  ownerUserId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  province?: string;
  idNumberHash?: string;
  popiaConsentAccepted: boolean;
  createdAt: string;
  productionReady: false;
};