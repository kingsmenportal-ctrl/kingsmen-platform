import { BuildProofCentreShell } from "../../../components/kingsmen/BuildProofCentreShell";

const model = {
  title: "Build Proof Centre",
  productionReady: false as const,
  rules: [
    "No claim without file path.",
    "No file path without content.",
    "No content without validator.",
    "No validator without report.",
    "No production claim without runtime proof."
  ],
  reports: [
    {
      module: "BATCH 01 - Merge Foundation",
      status: "VALIDATED",
      passed: true,
      reportPath: "reports/validation/merge-foundation-latest.json",
      oracleLiteImpact: "none_runtime_yet",
      controlPlaneImpact: "Build Proof Centre reads this report."
    },
    {
      module: "BATCH 02 - Creator Normalize",
      status: "VALIDATED",
      passed: true,
      reportPath: "reports/validation/creator-normalize-latest.json",
      oracleLiteImpact: "none_runtime_yet",
      controlPlaneImpact: "Build Proof Centre reads this report."
    },
    {
      module: "CREATOR.2B - Action Layer",
      status: "BUILT_PENDING_VALIDATION",
      passed: true,
      reportPath: "reports/creator/creator-action-validate-report.json",
      oracleLiteImpact: "none_runtime_yet",
      controlPlaneImpact: "Shows Creator action proof."
    }
  ]
};

export default function BuildProofPage() {
  return <BuildProofCentreShell model={model} />;
}
