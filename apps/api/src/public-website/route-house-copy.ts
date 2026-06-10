export const ROUTE_HOUSE_COPY = {
  identity: "Kingsmen is a private route command house.",
  notCheapHelp: "Kingsmen is not cheap application help or rushed form filling.",
  valueStack: [
    "direction",
    "protection",
    "positioning",
    "evidence",
    "speed",
    "route intelligence",
    "document readiness",
    "opportunity confidence",
    "accommodation stability",
    "CV and motivation strength",
    "fallback",
    "managed execution"
  ],
  hero: "Move with route command, not confusion.",
  promise:
    "Kingsmen helps candidates prepare, position, and route through South African study, work, funding, skills, CV, and accommodation pathways using evidence-led execution discipline."
};

export function assertPublicIdentityUsesRouteCommandHouse(copy: string): true {
  if (!copy.toLowerCase().includes("route") || !copy.toLowerCase().includes("command")) {
    throw new Error("PUBLIC_COPY_MUST_USE_ROUTE_COMMAND_HOUSE_POSITIONING");
  }
  return true;
}

export function assertNotCheapApplicationHelp(copy: string): true {
  if (copy.toLowerCase().includes("cheap application help")) {
    throw new Error("PUBLIC_COPY_MUST_NOT_POSITION_KINGSMEN_AS_CHEAP_APPLICATION_HELP");
  }
  return true;
}

export const PRIVATE_ROUTE_COMMAND_HOUSE_MARKER = "PRIVATE_ROUTE_COMMAND_HOUSE";
export const NOT_CHEAP_APPLICATION_HELP_SERVICE_MARKER = "NOT_CHEAP_APPLICATION_HELP_SERVICE";