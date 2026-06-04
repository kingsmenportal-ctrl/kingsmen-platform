# KINGSMEN CONNECTED APPS / TOOLS PROVIDER GATE

This file maps the 25 connected apps/tools into Kingsmen as provider gates.

Connected means mapped. It does not mean live.

- ChatGPT: Architect, doctrine keeper, planner, reviewer, prompt/module generator. Boundary: Does not prove repo files exist. Status: configured_pending_proof
- GitHub: Repo source control, proof history, Git checkpoints. Boundary: GitHub presence is not production readiness. Status: configured_pending_proof
- GitHub Actions: CI proof runner. Boundary: CI passing does not mean live providers are configured. Status: not_configured
- PowerShell Creator / KINGSMEN_CREATOR.ps1: Windows-first materializer, builder, validator, deploy runner. Boundary: Not the business brain. Status: configured_pending_proof
- Docker / Docker Compose: Oracle Lite runtime packaging. Boundary: Local Docker is not public production proof. Status: configured_pending_proof
- Oracle Cloud Free / Oracle Lite: First controlled deployment host. Boundary: Low concurrency, no AWS-style assumptions. Status: not_configured
- Nginx / Public HTTPS Gate: Reverse proxy and HTTPS readiness. Boundary: HTTPS does not mean payments/email/submissions live. Status: not_configured
- Supabase: Auth, RLS, signed storage, own-data boundary. Boundary: service_role backend-only. Status: not_configured
- PostgreSQL Truth Vault: Primary system truth. Boundary: Airtable/n8n/AI cannot override truth. Status: configured_pending_proof
- Redis / Queue Layer: Low-cost queue and retry discipline. Boundary: No infinite retry. Status: not_configured
- Gmail: Email-first runtime. Boundary: Live only after COMMS-01. Status: not_configured
- Google Drive: Non-secret planning and report workspace. Boundary: No raw secrets. Status: configured_pending_proof
- Google Calendar: Scheduling support. Boundary: Calendar is not source truth. Status: not_required_for_current_phase
- Google Contacts: Contact reference. Boundary: Cannot bypass verification/consent. Status: not_required_for_current_phase
- Canva: Public/outreach creative production. Boundary: Does not replace policy/legal proof. Status: not_required_for_current_phase
- PayFast: South African payment provider. Boundary: Live only after PAYMENTS-04. Status: not_configured
- PayPal: Optional secondary payment provider. Boundary: Optional; must not weaken PayFast policy. Status: not_configured
- Airtable: Async mirror / operations visibility. Boundary: Never truth. Status: not_configured
- n8n: Thin workflow wrapper. Boundary: No orchestration authority. Status: not_configured
- Playwright: Scout/probe. Boundary: No CAPTCHA/OTP bypass. Status: configured_pending_proof
- Neon Postgres: Optional managed Postgres/dev/staging. Boundary: Not default production unless approved. Status: not_required_for_current_phase
- Namecheap / Domain / DNS: Domain and DNS readiness. Boundary: Domain does not equal production. Status: not_configured
- OpenAI Codex CLI / Aider: Repo coding acceleration. Boundary: No uncontrolled production writes. Status: not_required_for_current_phase
- Cursor / Windsurf / Cline / Continue / Copilot / Gemini CLI: Optional UI/code helpers. Boundary: Cannot replace validators or PowerShell Creator. Status: not_required_for_current_phase
- OpenJarvis / OpenClaw / Founder Command Layer: Controlled founder command gateway. Boundary: No raw shell from browser. Status: not_required_for_current_phase
