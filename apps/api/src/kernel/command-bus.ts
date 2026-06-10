import type { CommandEnvelope } from "./command-envelope";
import { assertCommandEnvelope } from "./command-envelope";
import { assertPolicyAllows, type PolicyDecision } from "../policy/policy-middleware";

export interface CommandResult<TData = unknown> {
  commandId: string;
  correlationId: string;
  idempotencyKey: string;
  accepted: boolean;
  policy: PolicyDecision;
  data?: TData;
}

export type CommandHandler<TPayload = unknown, TResult = unknown> = (
  command: CommandEnvelope<TPayload>
) => Promise<TResult> | TResult;

export class KingsmenCommandBus {
  private handlers = new Map<string, CommandHandler>();

  register<TPayload, TResult>(
    commandType: string,
    handler: CommandHandler<TPayload, TResult>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler already registered for ${commandType}`);
    }

    this.handlers.set(commandType, handler as CommandHandler);
  }

  async dispatch<TPayload, TResult>(
    command: CommandEnvelope<TPayload>
  ): Promise<CommandResult<TResult>> {
    const validCommand = assertCommandEnvelope(command);
    const policy = assertPolicyAllows(validCommand);
    const handler = this.handlers.get(validCommand.commandType);

    if (!handler) {
      throw new Error(`No handler registered for ${validCommand.commandType}`);
    }

    const data = await handler(validCommand);

    return {
      commandId: validCommand.commandId,
      correlationId: validCommand.correlationId,
      idempotencyKey: validCommand.idempotencyKey,
      accepted: true,
      policy,
      data: data as TResult
    };
  }
}