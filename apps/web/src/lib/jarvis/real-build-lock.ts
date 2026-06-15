export type JarvisRealBuildLock = {
  issue: number;
  status: "active";
  authority: string;
  decision: string;
  nonMinimization: boolean;
  visualLaw: string;
  runtimeLaw: string;
  localLaw: string;
  proofLaw: string;
  nextBuild: string[];
};

export const jarvisRealBuildLock: JarvisRealBuildLock = {
  issue: 36,
  status: "active",
  authority: "Commander pasted directives, 2026-06-15",
  decision:
    "Stop planning as the main output. Preserve the Commander directives and build the real Kingsmen Jarvis system.",
  nonMinimization: true,
  visualLaw:
    "The locked Jarvis visual reference is the live system identity, not wallpaper behind generic cards.",
  runtimeLaw:
    "Jarvis must be clickable, listening, speaking, intelligent, organized, professional, respectful, disciplined, and connected to Kingsmen.",
  localLaw:
    "When Commander is in CMD, instructions must be CMD-safe and must not use PowerShell-only syntax as CMD syntax.",
  proofLaw:
    "No chat claim is proof. Repo files, local output, build reports, and GitHub commits are proof.",
  nextBuild: [
    "Prove local /jarvis startup",
    "Preserve Builder Core in GitHub",
    "Expose this real-build lock in runtime",
    "Rebuild the Jarvis visual shell as the operating surface",
    "Run build and smoke proof"
  ]
};

export function getJarvisRealBuildLock() {
  return jarvisRealBuildLock;
}
