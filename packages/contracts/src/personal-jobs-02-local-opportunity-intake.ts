export type KingsmenPersonalJobs02LeadStatus =
  | "Found"
  | "Reviewed"
  | "Prepared"
  | "Applied"
  | "Follow Up"
  | "Interview"
  | "Rejected"
  | "Offer"
  | "Closed";

export type KingsmenPersonalJobs02SourceType =
  | "Indeed"
  | "LinkedIn"
  | "Company Career Page"
  | "Facebook"
  | "WhatsApp Group"
  | "Email"
  | "Referral"
  | "Walk-in"
  | "Other";

export type KingsmenPersonalJobs02OpportunityLead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  company: string;
  roleTitle: string;
  opportunityLink: string;
  sourceType: KingsmenPersonalJobs02SourceType;
  location: string;
  workMode: "On-site" | "Hybrid" | "Remote" | "Unknown";
  deadline: string;
  salaryText: string;
  requirementsText: string;
  fitReason: string;
  riskNotes: string;
  confidence: "Low" | "Medium" | "High";
  status: KingsmenPersonalJobs02LeadStatus;
  nextAction: string;
  cvSlot: string;
  motivationLetterSlot: string;
  proofNote: string;
};

export type KingsmenPersonalJobs02Proof = {
  schema: "kingsmen.personal-jobs-02-proof.v1";
  module: "PERSONAL-JOBS-02 - Local Job Opportunity Intake / Track External Job Leads";
  status:
    | "PERSONAL_JOBS_02_LOCAL_OPPORTUNITY_INTAKE_PROVEN"
    | "PERSONAL_JOBS_02_LOCAL_OPPORTUNITY_INTAKE_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  startsDocker: false;
  route: "/personal-job-desk/opportunities";
  localStorageKey: "kingsmen.personalJobs02.externalLeads.v1";
  failed: Array<{ name: string; passed: false; detail: string }>;
};
