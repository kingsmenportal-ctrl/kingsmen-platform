export interface DeploymentChecklistItem {
  key: string;
  title: string;
  done: boolean;
  owner: "founder" | "operator" | "system";
  detail: string;
}

export function buildDeploymentChecklist(): DeploymentChecklistItem[] {
  return [
    {
      key: "apply_migrations",
      title: "Apply database migrations",
      done: false,
      owner: "founder",
      detail: "Run N03-N20 migrations against the intended database only after confirming DATABASE_URL."
    },
    {
      key: "wire_secrets",
      title: "Wire live/staging secrets outside git",
      done: false,
      owner: "founder",
      detail: "DATABASE_URL, PayFast, email provider, Airtable, and backup keys must be environment variables."
    },
    {
      key: "run_secret_scan",
      title: "Run secret scan",
      done: false,
      owner: "system",
      detail: "Reject any committed keys, passphrases, database URLs, tokens, or provider secrets."
    },
    {
      key: "run_payfast_sandbox",
      title: "Run PayFast sandbox flow",
      done: false,
      owner: "founder",
      detail: "Checkout, return, cancel, and ITN receipt must be recorded before live finance activation."
    },
    {
      key: "run_email_test",
      title: "Run email test",
      done: false,
      owner: "operator",
      detail: "Routine candidate communication must work through email before any public launch."
    },
    {
      key: "backup_restore_drill",
      title: "Run backup and restore drill",
      done: false,
      owner: "founder",
      detail: "A restore test must be proven before live candidate data is trusted."
    },
    {
      key: "rls_security_review",
      title: "Run RLS/security review",
      done: false,
      owner: "system",
      detail: "Service-wide RLS policies need production tightening before public traffic."
    },
    {
      key: "capacity_cap_confirmed",
      title: "Confirm 500 active candidate cap",
      done: true,
      owner: "founder",
      detail: "500 means active operational candidates, not concurrent browser users."
    }
  ];
}