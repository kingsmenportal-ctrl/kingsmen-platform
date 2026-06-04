import { assertN02CommandAllowed } from "./command-policy-guard";

export async function dispatchKingsmenCommand(command: {
  commandId: string;
  commandType: string;
  risk?: string;
  requiresFounderApproval?: boolean;
  providerProofPresent?: boolean;
}) {
  assertN02CommandAllowed(command);

  return {
    commandId: command.commandId,
    accepted: true,
    queued: true,
    blocked: false,
    auditRequired: true
  } as const;
}