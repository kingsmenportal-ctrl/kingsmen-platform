import type { KingsmenCommandEnvelope } from "./n02-command-envelope-contract";

export type KingsmenCommandBusResult = {
  commandId: string;
  accepted: boolean;
  queued: boolean;
  blocked: boolean;
  reason?: string;
  auditRequired: true;
};

export type KingsmenCommandBus = {
  dispatch(command: KingsmenCommandEnvelope): Promise<KingsmenCommandBusResult>;
};