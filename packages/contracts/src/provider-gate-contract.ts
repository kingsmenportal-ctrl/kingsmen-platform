export type KingsmenProviderStatus =
  | "callable_verified"
  | "callable_contextual"
  | "configured_pending_proof"
  | "local_runner"
  | "local_build_proven"
  | "access_material_pending_cli_proof"
  | "visible_untested"
  | "not_configured"
  | "ping_verified_not_truth"
  | "optional_gated"
  | "sandbox_proven_research_only"
  | string;

export interface KingsmenProviderGate {
  id: string;
  name: string;
  class: string;
  status: KingsmenProviderStatus;
  productionSafe: false;
  highRisk: boolean;
}

export interface KingsmenProviderGateMap {
  schema: "kingsmen.provider-gates.v1";
  module: string;
  status: string;
  productionReady: false;
  providers: KingsmenProviderGate[];
  nextAction: string;
}
