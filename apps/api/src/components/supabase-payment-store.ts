import type {
  ExpectedPayment,
  PaymentCallbackStore,
  PaymentCommitInput,
  PaymentCommitResult
} from "./payfast-callback";

type SupabaseConfig = { url: string; serviceRoleKey: string };

function configFromEnvironment(): SupabaseConfig {
  const url = process.env.SUPABASE_URL ?? process.env.SUPABASE_PROJECT_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceRoleKey) throw new Error("PAYMENT_DATABASE_NOT_CONFIGURED");
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("PAYMENT_DATABASE_NOT_CONFIGURED"); }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") throw new Error("PAYMENT_DATABASE_URL_INVALID");
  return { url: parsed.origin, serviceRoleKey };
}

/**
 * Server-only adapter. Never expose this service-role credential to browsers.
 * The two RPCs must be installed by the pending payment-ledger migration.
 * The callback only calls commit after cryptographic + PayFast server verification.
 */
export class SupabasePaymentCallbackStore implements PaymentCallbackStore {
  private readonly config: SupabaseConfig;

  constructor(config: SupabaseConfig = configFromEnvironment(), private readonly fetcher: typeof fetch = fetch) {
    this.config = config;
  }

  private async rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.config.url}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: {
          apikey: this.config.serviceRoleKey,
          authorization: `Bearer ${this.config.serviceRoleKey}`,
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
        redirect: "error"
      });
    } catch {
      throw new Error("PAYMENT_DATABASE_UNAVAILABLE");
    }
    if (!response.ok) {
      // Do not echo provider payloads, SQL errors or credentials into HTTP responses/logs.
      if (response.status === 404 || response.status === 400) throw new Error("PAYMENT_DATABASE_SCHEMA_NOT_READY");
      throw new Error("PAYMENT_DATABASE_WRITE_FAILED");
    }
    return await response.json() as T;
  }

  async findExpectedPayment(paymentRef: string): Promise<ExpectedPayment | null> {
    if (!paymentRef || paymentRef.length > 128) throw new Error("PAYFAST_PAYMENT_REFERENCE_INVALID");
    const rows = await this.rpc<Array<{
      invoice_id: string;
      payment_reference: string;
      amount_cents: number;
      currency: string;
      invoice_status: string;
    }>>("payfast_expected_payment", { p_payment_reference: paymentRef });
    if (!Array.isArray(rows) || rows.length === 0) return null;
    if (rows.length !== 1) throw new Error("PAYMENT_DATABASE_AMBIGUOUS_REFERENCE");
    const row = rows[0];
    if (!Number.isSafeInteger(row.amount_cents) || row.amount_cents < 0 ||
        !["ZAR"].includes(row.currency) ||
        !["issued", "partially_paid", "paid", "cancelled", "void", "draft"].includes(row.invoice_status)) {
      throw new Error("PAYMENT_DATABASE_INVALID_INVOICE");
    }
    return {
      invoiceId: row.invoice_id,
      paymentRef: row.payment_reference,
      amountCents: row.amount_cents,
      currency: "ZAR",
      status: row.invoice_status as ExpectedPayment["status"]
    };
  }

  async commitVerifiedPayment(input: PaymentCommitInput): Promise<PaymentCommitResult> {
    const rows = await this.rpc<Array<{ outcome: string; payment_id: string; invoice_status: string }>>(
      "commit_verified_payfast_payment",
      {
        p_invoice_id: input.invoiceId,
        p_payment_reference: input.paymentRef,
        p_provider_payment_id: input.providerPaymentId,
        p_amount_cents: input.amountCents,
        p_currency: input.currency,
        p_event_fingerprint: input.eventFingerprint
      }
    );
    if (!Array.isArray(rows) || rows.length !== 1) throw new Error("PAYMENT_DATABASE_INVALID_RESULT");
    const row = rows[0];
    if (!["recorded", "duplicate"].includes(row.outcome) || !row.payment_id ||
        !["paid", "issued"].includes(row.invoice_status)) throw new Error("PAYMENT_DATABASE_INVALID_RESULT");
    return { outcome: row.outcome as PaymentCommitResult["outcome"], paymentId: row.payment_id, invoiceStatus: row.invoice_status };
  }
}
