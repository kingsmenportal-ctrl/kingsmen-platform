export type N08ActionPacketSeverity =
  | "info"
  | "watch"
  | "urgent"
  | "critical";

export type N08ActionPacketDecisionType =
  | "approve"
  | "reject"
  | "pause"
  | "retry"
  | "stop_selling"
  | "source_freeze"
  | "manual_review"
  | "escalate";

export type N08FounderActionPacket = {
  actionPacketId: string;
  title: string;
  severity: N08ActionPacketSeverity;
  cause: string;
  impact: string;
  recommendedAction: string;
  decisionType: N08ActionPacketDecisionType;
  rollbackAvailable: boolean;
  owner: "founder";
  proofId?: string;
  evidenceId: string;
  auditId: string;
  productionReady: false;
};