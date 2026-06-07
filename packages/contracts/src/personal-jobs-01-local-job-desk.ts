export type KingsmenPersonalJobs01LocalJobDeskProof = {
  schema: "kingsmen.personal-jobs-01-proof.v1";
  module: "PERSONAL-JOBS-01 - Local Personal Job Desk";
  status: "PERSONAL_JOBS_01_LOCAL_JOB_DESK_PROVEN" | "PERSONAL_JOBS_01_LOCAL_JOB_DESK_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  startsDocker: false;
  route: "/personal-job-desk";
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json";
  localPrivateProfileIgnoredByGit: boolean;
  committedFilesContainPersonalContact: false;
  failed: Array<{ name: string; passed: false; detail: string }>;
};
