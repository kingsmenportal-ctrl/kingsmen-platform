export type N06RouteRecord = {
  routeId: string;
  gate: string;
  routeSystem: string;
  institutionOrProviderName: string;
  programmeOrOpportunityName: string;
  province?: string;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  officialInstructionAllowed: boolean;
};

const routes = new Map<string, N06RouteRecord>();

export const n06RouteRepository = {
  async saveRoute(record: N06RouteRecord) {
    if (!record.routeId || !record.gate || !record.routeSystem) {
      throw new Error("N06 route repository save requires routeId, gate, and routeSystem");
    }

    routes.set(record.routeId, record);
    return record;
  },

  async findRoute(routeId: string) {
    return routes.get(routeId) ?? null;
  },

  async listRoutesByGate(gate: string) {
    return [...routes.values()].filter((route) => route.gate === gate);
  }
} as const;