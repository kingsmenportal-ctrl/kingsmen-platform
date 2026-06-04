export function assertN05StorageBoundarySafe(input: {
  candidateId: string;
  storageRef?: string;
  signedUploadRequired: boolean;
  signedReadRequired: boolean;
  rawPublicAccessAllowed: boolean;
  serviceRoleVisibleToBrowser: boolean;
}) {
  if (!input.candidateId || !input.storageRef) {
    throw new Error("N05 storage boundary requires candidateId and storageRef");
  }

  if (input.signedUploadRequired !== true) {
    throw new Error("N05 storage boundary requires signed upload");
  }

  if (input.signedReadRequired !== true) {
    throw new Error("N05 storage boundary requires signed read");
  }

  if (input.rawPublicAccessAllowed !== false) {
    throw new Error("N05 raw public file access is blocked");
  }

  if (input.serviceRoleVisibleToBrowser !== false) {
    throw new Error("N05 service_role must never be visible to browser");
  }

  return true;
}