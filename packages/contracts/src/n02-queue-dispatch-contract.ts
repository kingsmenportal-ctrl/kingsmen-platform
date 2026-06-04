import type { KingsmenAuditContext } from "./n02-audit-context-contract";

export type KingsmenQueueDispatch = {
  queueName: "commands" | "documents" | "payments" | "communications" | "route_workbench" | "founder_control";
  jobId: string;
  commandId: string;
  idempotencyKey: string;
  audit: KingsmenAuditContext;
  maxAttempts: number;
  oracleLiteSafe: true;
  createdAt: string;
};