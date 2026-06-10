export type LedgerEntryType =
  | "ORDER_CREATED"
  | "INVOICE_ISSUED"
  | "PAYMENT_RECEIVED"
  | "PAYFAST_FEE"
  | "REFUND_REQUESTED"
  | "REFUND_APPROVED"
  | "REFUND_COMPLETED"
  | "ADJUSTMENT"
  | "CREDIT_GRANTED";

export interface FinanceLedgerEntry {
  ledgerRef: string;
  candidateRef?: string;
  orderRef?: string;
  invoiceRef?: string;
  paymentRef?: string;
  refundRef?: string;
  entryType: LedgerEntryType;
  debitCents: number;
  creditCents: number;
  currency: "ZAR";
  description: string;
  evidenceRef?: string;
}

export function createLedgerEntry(input: Omit<FinanceLedgerEntry, "ledgerRef" | "currency">): FinanceLedgerEntry {
  if (!input.description.trim()) throw new Error("Ledger entry requires description.");
  if (input.debitCents < 0 || input.creditCents < 0) throw new Error("Ledger amounts cannot be negative.");
  return {
    ledgerRef: `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    currency: "ZAR",
    ...input
  };
}

export function assertLedgerBalancedForPayment(entries: FinanceLedgerEntry[]): void {
  const totalDebit = entries.reduce((sum, entry) => sum + entry.debitCents, 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.creditCents, 0);
  if (totalDebit !== totalCredit) {
    throw new Error("Finance ledger entries are not balanced.");
  }
}