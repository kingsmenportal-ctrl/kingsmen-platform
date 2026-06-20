# Jarvis AI Provider Credential Boundary

Jarvis AI provider routing is backend-governed. The web layer must not call any AI provider directly, must not print provider credentials, and must not claim a model is live without redacted runtime proof.

Required local/staging variables are KINGSMEN_AI_PROVIDER, KINGSMEN_AI_MODEL, and OPENAI_API_KEY when the selected provider is openai. These values must stay outside Git and must only be read from the process environment or local env files.

Proof commands:

- npm run jarvis:validate:ai-provider-credential-boundary
- npm run jarvis:credentials:scan:local
- npm run jarvis:ai:credential-proof

Rules:

- no fake status
- no raw secrets
- no browser-side provider call
- no direct database access from web
- no local shell execution from web
- backend-governed command envelope only

A passed credential boundary proof means Jarvis can see redacted provider readiness and can hand an AI provider readiness command to the backend. It does not mark AI Provider Router LIVE. A separate backend-governed redacted model call proof is still required before live activation.
