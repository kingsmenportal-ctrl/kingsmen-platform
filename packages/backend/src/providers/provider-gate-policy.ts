import fs from "node:fs";
import path from "node:path";

export function readKingsmenProviderGates(root = process.cwd()) {
  const file = path.join(root, "manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function assertProviderNotProductionSafe(providerId: string, root = process.cwd()) {
  const map = readKingsmenProviderGates(root);
  const provider = map.providers.find((item: { id: string }) => item.id === providerId);

  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  if (provider.productionSafe === true) {
    throw new Error(`Provider ${providerId} cannot be productionSafe without proof gate.`);
  }

  return true;
}
