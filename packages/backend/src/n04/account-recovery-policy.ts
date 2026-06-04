export function assertN04AccountRecoverySafe(input: {
  reason: "lost_access" | "email_change" | "phone_change" | "security_review";
  auditId?: string;
  popiaAccessLogId?: string;
  autoApprove?: boolean;
}) {
  if (!input.auditId) {
    throw new Error("N04 account recovery requires auditId");
  }

  if (!input.popiaAccessLogId) {
    throw new Error("N04 account recovery requires POPIA access log");
  }

  if (input.autoApprove === true) {
    throw new Error("N04 account recovery cannot auto-approve");
  }

  return true;
}