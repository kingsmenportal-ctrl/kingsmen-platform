# DHET private-register extraction run evidence — 31 October 2026

## Source run

- Pull request: [#255](https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/255)
- Workflow: [DHET Private Register Extraction](https://github.com/kingsmenportal-ctrl/kingsmen-platform/actions/runs/41226897740)
- Exact head: `aaf957e8707e5a1fef6b56a623e4948d63d52663`
- Workflow conclusion: `success`
- Artifact: `dhet-private-register-candidates-41226897740` (artifact ID `13051009494`)
- Artifact SHA-256: `dcbb2c9165aedce162c66ed0f87cc3126dc70801c513cf081f8721074f30480b`

## Extracted register coverage

The workflow downloaded the exact official DHET register PDFs dated 6 July 2026 (private higher-education institutions) and 15 July 2026 (private colleges), checked the page counts, converted them with Poppler layout extraction, generated a candidate JSON manifest, validated it, and retained the output as a workflow artifact.

| Measure | Result |
|---|---:|
| Total extracted records | 402 |
| Private higher-education records | 269 |
| Private-college records | 133 |
| Registered | 136 |
| Provisional | 56 |
| Cancelled | 196 |
| Status unresolved | 4 |
| Discontinuation requested — review required | 10 |
| Registration-identifier conflict records | 7 |
| Duplicate source-entry records | 16 |
| Duplicate normalized-name records | 18 |
| Records with registration identifiers | 298 |
| Province candidates | 277 |
| Campus/site candidates | 298 |

## Safety and import disposition

The import-preparation artifact reports `NO_REVIEWED_IMPORT_RECORDS_BLOCKED`: 0 import candidates and all 402 records excluded from import. This is intentional. Every candidate remains `import_eligible=false`, `official_route_status=NOT_VERIFIED`, `integration_status=NOT_CONNECTED`, and `automation_authorized=false`.

The extraction is DHET register evidence only. It does not establish a current intake, application route, opportunity deadline, eligibility, partnership, provider integration, submission receipt, or outcome. Cancelled, provisional, unresolved and discontinuation-requested records remain separate states. Historical name-only status entries remain identity-unresolved and non-importable.

## Remaining work before catalogue import

1. Reconcile canonical provider identities and aliases against the existing Kingsmen provider keys.
2. Review the 7 registration-identifier conflicts, 16 duplicate source entries, 18 normalized-name duplicates and 4 unresolved status records.
3. Manually review all institution name candidates and campus/site candidates; the source output marks names and campuses as review-required.
4. Obtain independent review of the generated evidence/import contract and the protected backup/restore and change-control gates.
5. Generate an idempotent evidence-only migration from an explicitly reviewed subset, then apply it only after formal approval.

No Supabase write, migration application, route activation, provider connection or Netlify deployment was performed by this extraction run.