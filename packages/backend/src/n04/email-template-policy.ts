export function assertN04EmailTemplateSafe(input: {
  templateCode: string;
  subject?: string;
  bodySafeMarkdown?: string;
  noGuaranteeDisclaimerRequired?: boolean;
  evidenceRequired?: boolean;
}) {
  if (!input.templateCode || !input.subject || !input.bodySafeMarkdown) {
    throw new Error("N04 email template requires code, subject, and safe body");
  }

  if (input.noGuaranteeDisclaimerRequired !== true) {
    throw new Error("N04 email template requires no-guarantee disclaimer");
  }

  if (input.evidenceRequired !== true) {
    throw new Error("N04 email template requires evidence");
  }

  return true;
}