export class N09MessagePolicyError extends Error {
  readonly safeCode: string;
  readonly details: Record<string, unknown>;

  constructor(safeCode: string, safeMessage: string, details: Record<string, unknown> = {}) {
    super(safeMessage);
    this.name = 'N09MessagePolicyError';
    this.safeCode = safeCode;
    this.details = details;
  }
}

export function n09AssertProductionReadyFalse(input: { readonly productionReady?: boolean; readonly production_ready?: boolean }): void {
  if (input.productionReady === true || input.production_ready === true) {
    throw new N09MessagePolicyError('N09_PRODUCTION_READY_FORBIDDEN', 'N09 cannot claim production readiness.');
  }
}

export function n09AssertSafeText(value: string, fieldName: string): void {
  if (!value || value.trim().length < 2) {
    throw new N09MessagePolicyError('N09_REQUIRED_SAFE_TEXT_MISSING', `Required safe text is missing: ${fieldName}.`);
  }

  const blocked = [
    /service[_-]?role/i,
    /database[_-]?url/i,
    /raw\s+document/i,
    /raw\s+evidence/i,
    /smtp\s+password/i,
    /api[_-]?key/i,
    /guarantee(d)?\s+(acceptance|funding|placement|employment|job|success)/i,
    /100%\s*success/i,
    /we\s+are\s+the\s+institution/i,
    /officially\s+accepted\s+without\s+proof/i,
    /pay\s+this\s+fee\s+without\s+verified\s+source/i
  ];

  for (const pattern of blocked) {
    if (pattern.test(value)) {
      throw new N09MessagePolicyError('N09_SAFE_TEXT_FORBIDDEN', `Unsafe communication text in ${fieldName}.`);
    }
  }
}
