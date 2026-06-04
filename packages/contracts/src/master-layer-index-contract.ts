export type KingsmenLayerStatus =
  | "not_started"
  | "built_pending_validation"
  | "validated"
  | "blocked"
  | "needs_repair"
  | "ready_for_next_layer"
  | "pilot_only"
  | "controlled_live"
  | "production_blocked";

export type KingsmenMasterLayerIndex = {
  schema: "kingsmen.master-layer-index.v1";
  module: "MASTER-INDEX-01";
  productionReady: false;
  oracleLiteDefault: true;
  proofMatrixRequired: true;
  layerFamilies: string[];
  layers: string[];
};