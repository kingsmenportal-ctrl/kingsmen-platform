const CANDIDATE_FORBIDDEN_WORKBENCH_ACTIONS = new Set([
  "verify_source",
  "mark_paid",
  "mark_submitted",
  "verify_outcome",
  "change_source_confidence",
  "override_choice_order_as_final"
]);

export function assertN06WorkbenchApiSafe(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  action: string;
  serviceRoleVisibleToBrowser?: boolean;
  productionReady?: boolean;
}) {
  if (input.serviceRoleVisibleToBrowser === true) {
    throw new Error("N06 workbench API blocked: service_role must never be visible to browser");
  }

  if (input.productionReady === true) {
    throw new Error("N06 workbench API cannot claim productionReady=true");
  }

  if (input.actorType === "candidate" && CANDIDATE_FORBIDDEN_WORKBENCH_ACTIONS.has(input.action)) {
    throw new Error(`N06 candidate cannot perform truth-authority workbench action: ${input.action}`);
  }

  return true;
}