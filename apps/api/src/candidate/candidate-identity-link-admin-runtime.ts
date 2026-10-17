import {
  createPendingCandidateIdentityLink,
  verifyPendingCandidateIdentityLink,
  revokeCandidateIdentityLink,
  type CandidateIdentityLinkActor,
  type CandidateIdentityLinkCommand,
  type CandidateIdentityLinkResult
} from "./candidate-identity-link-lifecycle";
import {
  withCandidateBackendTransaction,
  type CandidateBackendPool
} from "./candidate-backend-transaction";

export interface VerifiedOperatorPrincipal {
  /** Supplied only by the trusted server-side session resolver. */
  readonly actorId: string;
  /** Permission snapshot from the trusted server-side authorization system. */
  readonly permissions: readonly string[];
}

export interface CandidateIdentityLinkOperatorResolver<TRequestContext> {
  resolve(context: TRequestContext): Promise<VerifiedOperatorPrincipal | null>;
}

export type CandidateIdentityLinkAdminAction = "create" | "verify" | "revoke";

const REQUIRED_PERMISSION: Record<CandidateIdentityLinkAdminAction, string> = {
  create: "candidate.identity_link.create",
  verify: "candidate.identity_link.verify",
  revoke: "candidate.identity_link.revoke"
};

/**
 * The only intended application entry point for identity-link lifecycle actions.
 * It resolves the actor from trusted server-side context and always owns the
 * PostgreSQL transaction that establishes the fixed backend RLS context.
 *
 * No route should construct VerifiedOperatorPrincipal from request JSON, query
 * parameters, headers, or candidate-supplied fields.
 */
export class CandidateIdentityLinkAdminRuntime<TRequestContext> {
  constructor(
    private readonly pool: CandidateBackendPool,
    private readonly operatorResolver: CandidateIdentityLinkOperatorResolver<TRequestContext>
  ) {}

  async execute(
    action: CandidateIdentityLinkAdminAction,
    requestContext: TRequestContext,
    command: CandidateIdentityLinkCommand
  ): Promise<CandidateIdentityLinkResult> {
    const principal = await this.operatorResolver.resolve(requestContext);
    if (!principal || typeof principal.actorId !== "string" || !principal.actorId.trim()) {
      throw new Error("CANDIDATE_IDENTITY_LINK_OPERATOR_REQUIRED");
    }
    if (!Array.isArray(principal.permissions) || !principal.permissions.includes(REQUIRED_PERMISSION[action])) {
      throw new Error("CANDIDATE_IDENTITY_LINK_PERMISSION_REQUIRED");
    }

    const actor: CandidateIdentityLinkActor = {
      actorId: principal.actorId,
      isAuthorizedOperator: async (actorId) => actorId === principal.actorId &&
        principal.permissions.includes(REQUIRED_PERMISSION[action])
    };

    return withCandidateBackendTransaction(this.pool, async (db) => {
      switch (action) {
        case "create":
          return createPendingCandidateIdentityLink(db, actor, command);
        case "verify":
          return verifyPendingCandidateIdentityLink(db, actor, command);
        case "revoke":
          return revokeCandidateIdentityLink(db, actor, command);
        default:
          throw new Error("CANDIDATE_IDENTITY_LINK_ACTION_UNSUPPORTED");
      }
    });
  }
}
