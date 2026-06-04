export type N04OwnDataBoundary = {
  candidateId: string;
  ownerUserId: string;
  canReadOwnProfile: true;
  canReadOwnDocuments: true;
  canReadOwnApplications: true;
  canReadOwnPayments: true;
  canWriteDraftProfile: true;
  canMarkPaid: false;
  canMarkSubmitted: false;
  canVerifyOutcome: false;
  canChangeSourceConfidence: false;
  serviceRoleBackendOnly: true;
};