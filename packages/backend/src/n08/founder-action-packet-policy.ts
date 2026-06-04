export function assertN08FounderActionPacketSafe(input: {
  actionPacketId?: string;
  severity: "info" | "watch" | "urgent" | "critical";
  evidenceId?: string;
  auditId?: string;
  proofId?: string;
  truthChangeRequested?: boolean;
  productionReady?: boolean;
}) {
  if (!input.actionPacketId || !input.evidenceId || !input.auditId) {
    throw new Error("N08 action packet requires actionPacketId, evidenceId, and auditId");
  }

  if (input.truthChangeRequested === true && !input.proofId) {
    throw new Error("N08 truth-changing action packet requires proofId");
  }

  if (input.productionReady === true) {
    throw new Error("N08 founder control cannot claim productionReady=true");
  }

  return true;
}