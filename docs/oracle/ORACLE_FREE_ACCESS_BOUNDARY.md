# ORACLE-01 - Oracle Free Access Boundary

This file records the safe Oracle Free / Oracle Lite access boundary for Kingsmen.

Oracle access has two separate parts:

1. OCI API key/config - used by OCI CLI, Terraform, and PowerShell to create or manage Oracle resources.
2. SSH key - used by PowerShell to enter the Oracle VM after the VM exists.

Local-only files that must stay outside GitHub:

- C:\Users\dell\.oci\config
- C:\Users\dell\.oci\oci_api_key.pem
- C:\Users\dell\.ssh\oracle_kingsmen.key
- C:\Users\dell\.ssh\oracle_kingsmen.pub

Never commit:

- OCI API private key
- SSH private key
- Oracle password
- GitHub token
- Supabase service_role
- payment secret
- SMTP password

Required proof commands:

oci iam region list
terraform -version
ssh -i "C:\Users\dell\.ssh\oracle_kingsmen.key" opc@YOUR_ORACLE_PUBLIC_IP

Kingsmen law:

PowerShell may read local Oracle files.
GitHub must never store private keys.
Oracle Lite must stay Free Tier disciplined.
This boundary does not deploy to Oracle.
productionReady = false until Oracle deployment proof exists.
