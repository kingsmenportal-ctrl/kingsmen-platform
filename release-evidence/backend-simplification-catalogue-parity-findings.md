# Backend Simplification — Live Catalogue Parity Findings
Date: 2026-10-29
Environment: Supabase staging euhubhhnumtibbyufghm (euhubhhnumtibbyufghm)
Scope: read-only inspection; no database writes performed.

## Confirmed catalogue agreement
The active rows in public.finance_plan_catalog and public.public_website_package_cards agree on the seven paid products and the canonical price values:
- Artisan Charter: R149.99; 5 priority applications; 3 concurrent managed routes.
- Foundational Accord: R169.99; 5 priority applications; 4 concurrent managed routes; 8 accommodation routes included at no extra charge.
- Guildmasters Charter: R199.99; 8 priority applications; 5 concurrent managed routes.
- Collegiate Ordinance: R299.99; 10 priority applications; 8 concurrent managed routes.
- Chancellor’s Writ: R399.99; 15 priority applications; 10 concurrent managed routes.
- Regency Mandate: R469.99; 15 priority applications; 12 concurrent managed routes.
- CV Revamp: R49.99; standalone CV service, 15 CV versions + 15 matching letters; no package application allowance.
Finance catalog additionally has Free Destiny Map at R0, so eight rows is expected in that table (7 paid/service products + free preview).

All paid plans show accommodation_support_available = true. Foundational's accommodation_route_count/included_accommodation_routes = 8. The finance catalog and public cards explicitly distinguish priority_application_count from managed_application_count.

## Material divergence: legacy service_packages snapshots
The current public.service_packages active rows have matching prices but older/incomplete entitlement_snapshot values:
- Foundational Accord snapshot says managed_applications = 1, while current canonical catalog says 5 priority applications and 4 concurrent managed routes.
- Collegiate Ordinance says managed_applications = 2, while current catalog says 10 priority and 8 concurrent.
- Chancellor’s Writ says managed_applications = 3, while current catalog says 15 priority and 10 concurrent.
- Regency Mandate says managed_applications = 4, while current catalog says 15 priority and 12 concurrent.
- Artisan Charter and Guildmasters Charter snapshots do not carry the same numeric entitlement key; they use service labels.
- CV Revamp snapshot stores upgrade_bonus_active_routes = 2 on the CV Revamp product itself, while finance_plan_catalog stores upgrade_bonus_routes_when_cv_revamp_owned = 2 on eligible package rows and 0 on CV Revamp. The bonus authority/consumer must be traced before changing anything.
This is not safe to fix by blindly copying values: first find all readers/writers of service_packages.entitlement_snapshot and confirm whether managed_applications is treated as application allowance or active-route capacity. Then migrate to explicit fields/keys (priority_application_count, concurrent_managed_route_capacity, accommodation_included_count, eligible_cv_revamp_upgrade_bonus) while preserving a compatibility key only if live consumers require it. Keep existing candidate order snapshots immutable.

## Potential access-law contradiction to trace
The public website card rows inspected include route_visibility = SEALED while the same records and canonical doctrine say full discovery access across all six pathways for every package. Determine whether SEALED means only “application execution targets remain sealed until entitlement activation” (which can be valid) or incorrectly hides catalogue access (which would violate product rules). Do not rename/change it until code consumers are identified; add separate explicit catalogue_visibility and execution_entitlement semantics if needed.

## Required next implementation
1. Search the repo for service_packages, entitlement_snapshot, managed_applications, route_visibility and package card selectors.
2. Produce a consumer matrix: code path, meaning, read/write, tests, owner, migration and rollback.
3. Add a parity contract that asserts prices, priority counts, managed-route capacity, accommodation and CV Revamp bonus semantics across the canonical manifest, finance_plan_catalog, website cards and service_packages.
4. Add a reviewed additive migration to backfill explicit semantics only after consumers are migrated. Preserve historical order snapshots and do not activate paid checkout before payment/entitlement proof.
5. Verify the candidate UI still exposes all six pathway catalogues regardless of plan; package controls only application/service execution capacity and support.
