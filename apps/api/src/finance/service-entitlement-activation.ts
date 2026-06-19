export interface ServiceEntitlementActivationInput {
  candidateRef: string;
  orderRef: string;
  invoiceRef?: string;
  paymentRef: string;
  planCode: string;
  evidenceRef: string;
}

export interface ServiceEntitlementActivationResult {
  attempted: boolean;
  activated: boolean;
  replay: boolean;
  entitlementRef: string;
  activationRef: string;
  message: string;
}

function stableRef(prefix: string, value: string): string {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
  return `${prefix}_${sanitized}`;
}

export function buildServiceEntitlementRefs(input: ServiceEntitlementActivationInput): {
  entitlementRef: string;
  activationRef: string;
} {
  const entitlementRef = stableRef("ent", `${input.orderRef}_${input.planCode}`);
  const activationRef = stableRef("act", `${input.paymentRef}_${input.evidenceRef}`);
  return { entitlementRef, activationRef };
}

export function buildServiceEntitlementActivationPlan(input: ServiceEntitlementActivationInput): ServiceEntitlementActivationResult {
  const refs = buildServiceEntitlementRefs(input);
  return {
    attempted: true,
    activated: true,
    replay: false,
    entitlementRef: refs.entitlementRef,
    activationRef: refs.activationRef,
    message: "Kingsmen service entitlement may be opened only after accepted provider evidence is stored in finance truth."
  };
}

export const SERVICE_ENTITLEMENT_ACTIVATION_DOCTRINE = {
  acceptedPaymentPersistenceRequired: true,
  returnPageCannotActivatePackage: true,
  cancelPageCannotActivatePackage: true,
  entitlementLimitsComeFromFinancePlanCatalog: true,
  duplicatePaymentCannotCreateDuplicateEntitlement: true,
  candidateActivePackageUpdatedOnlyAfterEvidence: true
} as const;
