export type KingsmenLayerStatus =
  | "not_started"
  | "built_pending_validation"
  | "validated"
  | "validated_pushed"
  | "validated_pushed_closeout"
  | "blocked"
  | "needs_repair"
  | "next_runtime_gate"
  | "future_mandatory_reality_gate";

export interface KingsmenLayerIndexItem {
  id: string;
  name: string;
  status: string;
  knownCommit?: string;
  knownCommits?: string[];
}

export interface KingsmenMasterLayerIndex {
  schema: "kingsmen.master-layer-index.v1";
  module: string;
  status: string;
  productionReady: false;
  deployedToOracle: false;
  layers: KingsmenLayerIndexItem[];
  nextAction: string;
}
