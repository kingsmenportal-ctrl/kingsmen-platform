export type KingsmenProviderGateStatus =
  | "not_required_for_current_phase"
  | "not_configured"
  | "configured_pending_proof"
  | "sandbox_proven"
  | "controlled_live"
  | "live_blocked"
  | "degraded"
  | "incident"
  | "disabled_by_policy";

export type KingsmenProviderGate = {
  code: string;
  name: string;
  role: string;
  boundary: string;
  status: KingsmenProviderGateStatus;
};

export type KingsmenProviderGateMap = {
  schema: "kingsmen.provider-gates.v1";
  module: "MASTER-INDEX-01";
  productionReady: false;
  providerCount: 25;
  providers: KingsmenProviderGate[];
};