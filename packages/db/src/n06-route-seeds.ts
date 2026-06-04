export const N06_ROUTE_GATE_SEEDS = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
] as const;

export const N06_ROUTE_SYSTEM_SEEDS = [
  "cao",
  "institution_direct",
  "nsfas",
  "tvet_college",
  "seta_provider",
  "employer",
  "bursary_provider",
  "other"
] as const;

export function assertN06RouteSeedsSafe() {
  if (N06_ROUTE_GATE_SEEDS.length !== 6) {
    throw new Error("N06 must seed exactly six route gates");
  }

  if (!N06_ROUTE_SYSTEM_SEEDS.includes("cao")) {
    throw new Error("N06 route systems must include CAO");
  }

  return true;
}