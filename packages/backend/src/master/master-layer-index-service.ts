import fs from "node:fs";
import path from "node:path";

export function readKingsmenMasterLayerIndex(root = process.cwd()) {
  const file = path.join(root, "manifests/master/kingsmen-master-layer-index.json");
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    ...manifest,
    productionReady: false,
    source: "repo_manifest"
  };
}

export function getNextKingsmenLayer(root = process.cwd()) {
  const manifest = readKingsmenMasterLayerIndex(root);
  return manifest.layers.find((layer: { status: string }) => layer.status === "next_runtime_gate") ?? null;
}
