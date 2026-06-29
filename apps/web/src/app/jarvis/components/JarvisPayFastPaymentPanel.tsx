'use client';

export type JarvisPayFastPaymentPanelProps = {
  readonly paymentRef?: string;
  readonly environment?: 'sandbox' | 'live' | 'unknown';
  readonly providerConfirmation?: 'missing' | 'received' | 'verified' | 'failed';
  readonly backendPaymentState?: 'missing' | 'pending' | 'paid_verified' | 'blocked' | 'disputed';
  readonly evidenceRef?: string | null;
  readonly paidUnlock?: 'locked' | 'approval_required' | 'unlocked_verified';
  readonly runtimeProof?: string | null;
};

export function JarvisPayFastPaymentPanel(props: JarvisPayFastPaymentPanelProps) {
  const rows = [
    ['Payment reference', props.paymentRef ?? 'not_selected'],
    ['Environment', props.environment ?? 'unknown'],
    ['Provider confirmation', props.providerConfirmation ?? 'missing'],
    ['Backend payment state', props.backendPaymentState ?? 'missing'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Paid execution', props.paidUnlock ?? 'locked'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis PayFast Payment Panel" data-jarvis-panel="payfast-payment">
      <header>
        <p>PAYFAST PAYMENT PROVIDER</p>
        <h2>Paid Execution Boundary — Locked Until Verified</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-payfast-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not treat checkout, screenshots, or unverified notifications as payment truth.
        Provider confirmation, backend payment state, and evidence ledger proof are required before paid execution unlocks.
      </p>
    </section>
  );
}

export default JarvisPayFastPaymentPanel;
