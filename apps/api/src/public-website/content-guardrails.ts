const blockedClaims = [
  "guaranteed admission",
  "guaranteed funding",
  "guaranteed job",
  "guaranteed accommodation",
  "official university partner",
  "official nsfas partner",
  "official cao partner",
  "we approve",
  "we guarantee"
];

export function assertProofSafePublicCopy(copy: string): true {
  const lower = copy.toLowerCase();
  const blocked = blockedClaims.find((claim) => lower.includes(claim));
  if (blocked) throw new Error(`PUBLIC_COPY_BLOCKED_CLAIM:${blocked}`);
  return true;
}

export function assertNoOfficialImpersonation(copy: string): true {
  const lower = copy.toLowerCase();
  if (lower.includes("we are nsfas") || lower.includes("we are cao") || lower.includes("official government portal")) {
    throw new Error("PUBLIC_COPY_OFFICIAL_IMPERSONATION_BLOCKED");
  }
  return true;
}

export function assertNoFakeTestimonials(copy: string): true {
  const lower = copy.toLowerCase();
  if (lower.includes("testimonial") && lower.includes("accepted because of kingsmen")) {
    throw new Error("PUBLIC_COPY_FAKE_TESTIMONIAL_RISK");
  }
  return true;
}

export function assertNoSealedRouteLeak(copy: string): true {
  const lower = copy.toLowerCase();
  const leakMarkers = ["exact portal link", "sealed target", "manual route plan unlocked for free"];
  const leaked = leakMarkers.find((marker) => lower.includes(marker));
  if (leaked) throw new Error(`PUBLIC_COPY_SEALED_ROUTE_LEAK:${leaked}`);
  return true;
}

export function runPublicContentGuardrails(copy: string): string[] {
  assertProofSafePublicCopy(copy);
  assertNoOfficialImpersonation(copy);
  assertNoFakeTestimonials(copy);
  assertNoSealedRouteLeak(copy);
  return ["BRAND", "LEGAL", "SOURCE", "PRICING", "COMMS", "PRIVACY", "SEALED_INTELLIGENCE", "PROOF", "CLAIMS"];
}