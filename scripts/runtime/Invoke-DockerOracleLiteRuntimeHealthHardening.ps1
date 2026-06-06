param(
  [int]$TimeoutSeconds = 420
)

$ErrorActionPreference = "Stop"

node scripts/proof/prove-docker-oracle-lite-runtime-health-hardening.mjs --timeoutSeconds=$TimeoutSeconds

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

node scripts/validators/validate-docker-oracle-lite-runtime-health-hardening.mjs
exit $LASTEXITCODE
