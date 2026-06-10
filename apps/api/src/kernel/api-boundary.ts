export const API_BOUNDARY = {
  commands: {
    receiveCommand: "POST /api/commands",
    receiveWorkflowResult: "POST /api/workflow/result",
    getCandidateStatus: "GET /api/candidates/:candidateId/status",
    getApplicationWorkbench: "GET /api/applications/:applicationId/workbench",
    getSystemHealth: "GET /api/system/health"
  },
  rules: [
    "API validates command envelopes before handlers run.",
    "Workflow result endpoint accepts exactly one normalized worker result.",
    "Read endpoints expose read models, not raw internal tables.",
    "Policy middleware runs before sensitive commands.",
    "Correlation ID and idempotency key are required on command writes."
  ]
} as const;