import crypto from "crypto";

import { redactPayFastSecrets, type PayFastFields } from "./payfast-signature";
import type { PayFastItnValidationResult } from "./payfast-itn";

type JsonObject = Record<string, unknown>;

type PgQueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount: number | null;
};

type PgPool = {
  query<T = Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<PgQueryResult<T>>;
  end(): Promise<void>;
};

type PgPoolConstructor = new (config: Record<string, unknown>) => PgPool;

type PaymentIntentRow = {
  merchant_reference: string;
  order_ref: string;
  invoice_ref: string | null;
  candidate_ref: string;
  amount_cents: number;
  currency: string;
  intent_status: string;
};

type PaymentStatusRow = {
  merchant_reference: string;
  order_ref: string | null;
  invoice_ref: string | null;
  candidate_ref: string | null;
  order_status: string | null;
  invoice_status: string | null;
  payment_status: string | null;
  verified: boolean | null;
  evidence_ref: string | null;
  updated_at: string | null;
};

export interface PayFastIntentExpectation {
  merchantReference: string;
  orderRef: string;
  invoiceRef?: string;
  candidateRef: string;
  amountCents: number;
  currency: string;
  intentStatus: string;
}

export interface PayFastStoredItnResult {
  persisted: boolean;
  replay: boolean;
  evidenceRef: string;
  itnRef: string;
  paymentRef?: string;
  orderStatusChanged: boolean;
  storageMode: "memory_development_only" | "postgres_finance_truth";
  message: string;
}

export interface PayFastPaymentStatusReadModel {
  merchantReference: string;
  orderRef?: string;
  invoiceRef?: string;
  candidateRef?: string;
  orderStatus: string;
  invoiceStatus?: string;
  paymentStatus: string;
  verified: boolean;
  evidenceRef?: string;
  updatedAtIso?: string;
}

function hashRef(prefix: string, value: string): string {
  return `${prefix}_${crypto.createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function centsFromPayFastAmount(value: unknown, fallbackCents: number): number {
  if (typeof value !== "string" && typeof value !== "number") return fallbackCents;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(parsed)) return fallbackCents;
  return Math.round(parsed * 100);
}

export class PayFastFinanceRepository {
  readonly storageMode: "memory_development_only" | "postgres_finance_truth";

  private constructor(private readonly pool: PgPool | null) {
    this.storageMode = pool ? "postgres_finance_truth" : "memory_development_only";
  }

  static fromEnvironment(): PayFastFinanceRepository {
    const financeMode = process.env.KINGSMEN_FINANCE_MODE ?? process.env.KINGSMEN_TRUTH_VAULT_MODE ?? "memory";
    const databaseUrl = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;

    if (financeMode !== "postgres") return new PayFastFinanceRepository(null);
    if (!databaseUrl) throw new Error("KINGSMEN_FINANCE_MODE=postgres requires KINGSMEN_DATABASE_URL or DATABASE_URL.");

    const pg = require("pg") as { Pool: PgPoolConstructor };
    return new PayFastFinanceRepository(new pg.Pool({
      connectionString: databaseUrl,
      max: Number(process.env.KINGSMEN_DATABASE_POOL_MAX ?? 8),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.KINGSMEN_DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
    }));
  }

  get enabled(): boolean {
    return this.pool !== null;
  }

  async close(): Promise<void> {
    await this.pool?.end();
  }

  async healthCheck(): Promise<{ ok: boolean; storageMode: string; message: string }> {
    if (!this.pool) {
      return { ok: true, storageMode: this.storageMode, message: "PayFast finance repository is in memory-only development mode." };
    }

    await this.pool.query("select 1 from finance_orders limit 1");
    return { ok: true, storageMode: this.storageMode, message: "PostgreSQL finance truth tables are reachable." };
  }

  async findIntentExpectation(merchantReference: string): Promise<PayFastIntentExpectation | null> {
    if (!this.pool || !merchantReference.trim()) return null;

    const result = await this.pool.query<PaymentIntentRow>(
      `select merchant_reference, order_ref, invoice_ref, candidate_ref, amount_cents, currency, intent_status
       from payfast_payment_intents
       where merchant_reference = $1
       limit 1`,
      [merchantReference]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      merchantReference: row.merchant_reference,
      orderRef: row.order_ref,
      invoiceRef: row.invoice_ref ?? undefined,
      candidateRef: row.candidate_ref,
      amountCents: row.amount_cents,
      currency: row.currency,
      intentStatus: row.intent_status
    };
  }

  async hasItnReceipt(idempotencyKey: string): Promise<boolean> {
    if (!this.pool) return false;
    const result = await this.pool.query<{ idempotency_key: string }>(
      "select idempotency_key from payfast_itn_receipts where idempotency_key = $1 limit 1",
      [idempotencyKey]
    );
    return Boolean(result.rows[0]?.idempotency_key);
  }

  async readPaymentStatus(merchantReference: string): Promise<PayFastPaymentStatusReadModel | null> {
    if (!this.pool || !merchantReference.trim()) return null;

    const result = await this.pool.query<PaymentStatusRow>(
      `select
         p.merchant_reference,
         p.order_ref,
         p.invoice_ref,
         p.candidate_ref,
         o.order_status,
         i.invoice_status,
         fp.payment_status,
         fp.verified,
         coalesce(fp.evidence_ref, p.evidence_ref, o.evidence_ref, i.evidence_ref) as evidence_ref,
         greatest(p.updated_at, o.updated_at, coalesce(i.created_at, p.updated_at), coalesce(fp.created_at, p.updated_at))::text as updated_at
       from payfast_payment_intents p
       left join finance_orders o on o.order_ref = p.order_ref
       left join finance_invoices i on i.invoice_ref = p.invoice_ref
       left join finance_payments fp on fp.merchant_reference = p.merchant_reference
       where p.merchant_reference = $1
       order by fp.created_at desc nulls last
       limit 1`,
      [merchantReference]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      merchantReference: row.merchant_reference,
      orderRef: row.order_ref ?? undefined,
      invoiceRef: row.invoice_ref ?? undefined,
      candidateRef: row.candidate_ref ?? undefined,
      orderStatus: row.order_status ?? "PENDING_PAYMENT",
      invoiceStatus: row.invoice_status ?? undefined,
      paymentStatus: row.payment_status ?? "PENDING_PROVIDER_EVIDENCE",
      verified: row.verified === true,
      evidenceRef: row.evidence_ref ?? undefined,
      updatedAtIso: row.updated_at ?? undefined
    };
  }

  async recordItnResult(input: {
    validation: PayFastItnValidationResult;
    payload: PayFastFields;
    expectation: PayFastIntentExpectation;
  }): Promise<PayFastStoredItnResult> {
    const evidenceRef = hashRef("payfast_ev", input.validation.idempotencyKey);
    const itnRef = hashRef("itn", input.validation.idempotencyKey);
    const paymentRef = hashRef("pay", `${input.validation.idempotencyKey}:${input.expectation.orderRef}`);

    if (!this.pool) {
      return {
        persisted: false,
        replay: false,
        evidenceRef,
        itnRef,
        paymentRef: input.validation.accepted ? paymentRef : undefined,
        orderStatusChanged: false,
        storageMode: this.storageMode,
        message: "ITN result prepared only; PostgreSQL finance truth is not enabled."
      };
    }

    const existing = await this.pool.query<{ itn_ref: string; evidence_ref: string | null }>(
      "select itn_ref, evidence_ref from payfast_itn_receipts where idempotency_key = $1 limit 1",
      [input.validation.idempotencyKey]
    );

    if (existing.rows[0]?.itn_ref) {
      return {
        persisted: true,
        replay: true,
        evidenceRef: existing.rows[0].evidence_ref ?? evidenceRef,
        itnRef: existing.rows[0].itn_ref,
        paymentRef: input.validation.accepted ? paymentRef : undefined,
        orderStatusChanged: false,
        storageMode: this.storageMode,
        message: "Duplicate PayFast ITN ignored idempotently."
      };
    }

    const redactedPayload = redactPayFastSecrets(input.payload) as JsonObject;
    const grossCents = centsFromPayFastAmount(input.payload.amount_gross, input.expectation.amountCents);
    const feeCents = centsFromPayFastAmount(input.payload.amount_fee, 0);
    const netCents = centsFromPayFastAmount(input.payload.amount_net, Math.max(grossCents - feeCents, 0));
    const providerPaymentId = input.validation.providerPaymentId ?? null;

    await this.pool.query(
      `insert into payfast_itn_receipts (
         itn_ref, merchant_reference, provider_payment_id, payment_status,
         amount_gross, amount_fee, amount_net, received_payload,
         received_signature, signature_valid, ip_valid, amount_valid,
         duplicate, accepted, rejection_reason, idempotency_key, evidence_ref
       ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        itnRef,
        input.validation.merchantReference,
        providerPaymentId,
        input.validation.paymentStatus ?? null,
        input.payload.amount_gross ? String(input.payload.amount_gross) : null,
        input.payload.amount_fee ? String(input.payload.amount_fee) : null,
        input.payload.amount_net ? String(input.payload.amount_net) : null,
        JSON.stringify(redactedPayload),
        input.payload.signature ? String(input.payload.signature) : null,
        input.validation.signatureValid,
        input.validation.ipValid,
        input.validation.amountValid,
        input.validation.duplicate,
        input.validation.accepted,
        input.validation.rejectionReason ?? null,
        input.validation.idempotencyKey,
        evidenceRef
      ]
    );

    await this.pool.query(
      `insert into payment_evidence_ledger (evidence_ref, source_type, source_ref, candidate_ref, order_ref, payment_ref, event_name, event_summary, proof_payload)
       values ($1,'PAYFAST_ITN',$2,$3,$4,$5,$6,$7,$8::jsonb)
       on conflict (evidence_ref) do nothing`,
      [
        evidenceRef,
        itnRef,
        input.expectation.candidateRef,
        input.expectation.orderRef,
        input.validation.accepted ? paymentRef : null,
        input.validation.accepted ? "payfast.itn.accepted" : "payfast.itn.rejected",
        input.validation.accepted ? "Accepted PayFast ITN recorded after signature, amount, source, status, and idempotency checks." : `Rejected PayFast ITN: ${input.validation.rejectionReason ?? "unknown reason"}`,
        JSON.stringify({
          accepted: input.validation.accepted,
          merchantReference: input.validation.merchantReference,
          providerPaymentId: input.validation.providerPaymentId ?? null,
          paymentStatus: input.validation.paymentStatus ?? null,
          signatureValid: input.validation.signatureValid,
          amountValid: input.validation.amountValid,
          ipValid: input.validation.ipValid,
          duplicate: input.validation.duplicate,
          idempotencyKeyHash: crypto.createHash("sha256").update(input.validation.idempotencyKey).digest("hex")
        })
      ]
    );

    if (!input.validation.accepted) {
      await this.pool.query(
        "update payfast_payment_intents set intent_status = case when intent_status = 'PAID' then intent_status else 'ITN_RECEIVED' end, evidence_ref = coalesce(evidence_ref, $2), updated_at = now() where merchant_reference = $1",
        [input.validation.merchantReference, evidenceRef]
      );
      return {
        persisted: true,
        replay: false,
        evidenceRef,
        itnRef,
        orderStatusChanged: false,
        storageMode: this.storageMode,
        message: "Rejected PayFast ITN persisted without changing paid status."
      };
    }

    await this.pool.query("begin");
    try {
      await this.pool.query(
        "update payfast_payment_intents set intent_status = 'PAID', evidence_ref = $2, updated_at = now() where merchant_reference = $1",
        [input.validation.merchantReference, evidenceRef]
      );
      await this.pool.query(
        "update finance_orders set order_status = 'PAID', evidence_ref = $2, updated_at = now() where order_ref = $1",
        [input.expectation.orderRef, evidenceRef]
      );
      if (input.expectation.invoiceRef) {
        await this.pool.query(
          "update finance_invoices set invoice_status = 'PAID', paid_at = now(), evidence_ref = $2 where invoice_ref = $1",
          [input.expectation.invoiceRef, evidenceRef]
        );
      }
      await this.pool.query(
        `insert into finance_payments (
           payment_ref, order_ref, invoice_ref, candidate_ref, provider, provider_payment_id,
           merchant_reference, amount_gross_cents, amount_fee_cents, amount_net_cents,
           currency, payment_status, verified, verified_at, evidence_ref
         ) values ($1,$2,$3,$4,'PAYFAST',$5,$6,$7,$8,$9,$10,'COMPLETE',true,now(),$11)
         on conflict (payment_ref) do nothing`,
        [
          paymentRef,
          input.expectation.orderRef,
          input.expectation.invoiceRef ?? null,
          input.expectation.candidateRef,
          providerPaymentId,
          input.validation.merchantReference,
          grossCents,
          feeCents,
          netCents,
          input.expectation.currency,
          evidenceRef
        ]
      );
      await this.pool.query(
        `insert into finance_ledger_entries (ledger_ref, candidate_ref, order_ref, invoice_ref, payment_ref, entry_type, debit_cents, credit_cents, currency, description, evidence_ref)
         values ($1,$2,$3,$4,$5,'PAYMENT_RECEIVED',$6,0,$7,$8,$9)
         on conflict (ledger_ref) do nothing`,
        [
          hashRef("ledger", `${paymentRef}:received`),
          input.expectation.candidateRef,
          input.expectation.orderRef,
          input.expectation.invoiceRef ?? null,
          paymentRef,
          netCents,
          input.expectation.currency,
          "PayFast payment received and verified by accepted ITN.",
          evidenceRef
        ]
      );
      if (feeCents > 0) {
        await this.pool.query(
          `insert into finance_ledger_entries (ledger_ref, candidate_ref, order_ref, invoice_ref, payment_ref, entry_type, debit_cents, credit_cents, currency, description, evidence_ref)
           values ($1,$2,$3,$4,$5,'PAYFAST_FEE',0,$6,$7,$8,$9)
           on conflict (ledger_ref) do nothing`,
          [
            hashRef("ledger", `${paymentRef}:fee`),
            input.expectation.candidateRef,
            input.expectation.orderRef,
            input.expectation.invoiceRef ?? null,
            paymentRef,
            feeCents,
            input.expectation.currency,
            "PayFast processing fee recorded from accepted ITN.",
            evidenceRef
          ]
        );
      }
      await this.pool.query("commit");
    } catch (error) {
      await this.pool.query("rollback");
      throw error;
    }

    return {
      persisted: true,
      replay: false,
      evidenceRef,
      itnRef,
      paymentRef,
      orderStatusChanged: true,
      storageMode: this.storageMode,
      message: "Accepted PayFast ITN persisted and finance truth updated."
    };
  }
}
