import type { PublicToPortalClaim } from "./candidate-mobile-types";

export interface CreateClaimInput {
  leadReference: string;
  tokenHash: string;
  now: Date;
  minutesToLive?: number;
  channel?: "email" | "sms_backup" | "operator";
  candidateId?: string;
  accountId?: string;
}

export function createPublicToPortalClaim(input: CreateClaimInput): PublicToPortalClaim & { tokenHash: string } {
  const ttl = input.minutesToLive ?? 60;
  const expires = new Date(input.now.getTime() + ttl * 60_000);
  return {
    leadReference: input.leadReference,
    candidateId: input.candidateId,
    accountId: input.accountId,
    claimStatus: "created",
    claimChannel: input.channel ?? "email",
    expiresAt: expires.toISOString(),
    tokenHash: input.tokenHash
  };
}

export function canClaimPortalLink(claim: PublicToPortalClaim, now: Date): boolean {
  if (claim.claimStatus !== "created" && claim.claimStatus !== "sent") return false;
  return new Date(claim.expiresAt).getTime() > now.getTime();
}

export function buildClaimMessage(candidateName: string | undefined): string {
  const name = candidateName?.trim() || "Candidate";
  return `${name}, continue your Kingsmen route from the secure portal. This link expires and only opens your own profile.`;
}