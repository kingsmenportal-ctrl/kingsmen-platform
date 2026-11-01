-- Read-only parity report for the seven paid products.
-- This intentionally reports drift; it does not mutate catalogue or entitlement data.
WITH expected(package_key, finance_plan_code, service_package_code, price_cents, priority_apps, concurrent_routes, accommodation_included) AS (
  VALUES
    ('artisan_charter','ARTISAN_CHARTER_R149_99','ARTISAN_CHARTER',14999,5,3,0),
    ('foundational_accord','FOUNDATIONAL_ACCORD_R169_99','FOUNDATIONAL_ACCORD',16999,5,4,8),
    ('guildmasters_charter','GUILDMASTERS_CHARTER_R199_99','GUILDMASTERS_CHARTER',19999,8,5,0),
    ('collegiate_ordinance','COLLEGIATE_ORDINANCE_R299_99','COLLEGIATE_ORDINANCE',29999,10,8,0),
    ('chancellors_writ','CHANCELLORS_WRIT_R399_99','CHANCELLORS_WRIT',39999,15,10,0),
    ('regency_mandate','REGENCY_MANDATE_R469_99','REGENCY_MANDATE',46999,15,12,0),
    ('cv_revamp','CV_REVAMP_R49_99','CV_REVAMP',4999,NULL,0,0)
),
f AS (
  SELECT plan_code, amount_cents, active, priority_application_count,
         managed_application_count, accommodation_route_count,
         accommodation_support_available, upgrade_bonus_routes_when_cv_revamp_owned
  FROM public.finance_plan_catalog
),
w AS (
  SELECT package_key, price_zar::numeric * 100 AS price_cents, active,
         priority_application_count, managed_application_count,
         included_accommodation_routes, accommodation_support_available,
         route_visibility, included_cv_versions, included_motivation_letters
  FROM public.public_website_package_cards
),
s AS (
  SELECT package_code, price_minor, active, entitlement_snapshot
  FROM public.service_packages
)
SELECT e.package_key,
       e.price_cents AS expected_price_cents,
       f.amount_cents AS finance_price_cents,
       w.price_cents AS website_price_cents,
       s.price_minor AS service_package_price_cents,
       e.priority_apps AS expected_priority_apps,
       f.priority_application_count AS finance_priority_apps,
       w.priority_application_count AS website_priority_apps,
       e.concurrent_routes AS expected_concurrent_routes,
       f.managed_application_count AS finance_concurrent_routes,
       w.managed_application_count AS website_concurrent_routes,
       e.accommodation_included AS expected_accommodation_included,
       f.accommodation_route_count AS finance_accommodation_included,
       w.included_accommodation_routes AS website_accommodation_included,
       f.accommodation_support_available AS finance_accommodation_support,
       w.accommodation_support_available AS website_accommodation_support,
       w.route_visibility AS website_route_visibility,
       s.entitlement_snapshot AS legacy_entitlement_snapshot,
       f.upgrade_bonus_routes_when_cv_revamp_owned AS finance_cv_revamp_bonus,
       CASE WHEN f.plan_code IS NULL OR w.package_key IS NULL OR s.package_code IS NULL THEN 'MISSING_ROW'
            WHEN f.amount_cents <> e.price_cents OR w.price_cents <> e.price_cents OR s.price_minor <> e.price_cents THEN 'PRICE_DRIFT'
            WHEN f.priority_application_count IS DISTINCT FROM e.priority_apps OR w.priority_application_count IS DISTINCT FROM e.priority_apps THEN 'PRIORITY_DRIFT'
            WHEN f.managed_application_count <> e.concurrent_routes OR w.managed_application_count <> e.concurrent_routes THEN 'CAPACITY_DRIFT'
            WHEN f.accommodation_route_count <> e.accommodation_included OR w.included_accommodation_routes <> e.accommodation_included THEN 'ACCOMMODATION_DRIFT'
            WHEN w.route_visibility = 'SEALED' THEN 'REVIEW_ROUTE_VISIBILITY_SEMANTICS'
            WHEN COALESCE((s.entitlement_snapshot->>'managed_applications')::integer, -1) <> COALESCE(e.priority_apps, 0) THEN 'LEGACY_ENTITLEMENT_SNAPSHOT_DRIFT'
            ELSE 'PARITY_PASS'
       END AS parity_status
FROM expected e
LEFT JOIN f ON f.plan_code = e.finance_plan_code
LEFT JOIN w ON w.package_key = e.package_key
LEFT JOIN s ON s.package_code = e.service_package_code
ORDER BY e.price_cents, e.package_key;
