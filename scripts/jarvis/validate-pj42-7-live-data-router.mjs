#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routeCatalogPath = path.join(root, 'manifests', 'jarvis', 'jarvis-live-route-catalog.json');
const freshnessPath = path.join(root, 'manifests', 'jarvis', 'jarvis-live-freshness-triggers.json');
const matrixPath = path.join(root, 'manifests', 'jarvis', 'jarvis-live-routing-matrix.json');
const cachePath = path.join(root, 'manifests', 'jarvis', 'jarvis-live-cache-policy.json');
const fallbackPath = path.join(root, 'manifests', 'jarvis', 'jarvis-live-failure-fallback.json');
const validationPath = path.join(root, 'manifests', 'jarvis', 'jarvis-live-data-router-validation.json');
const adaptersPath = path.join(root, 'manifests', 'jarvis', 'jarvis-approved-tool-adapters.json');

const requiredRoutes = new Set([
  'web_research_live',
  'github_live',
  'system_health_live',
  'postgres_read_model_live',
  'playwright_scout_live',
  'utility_api_live',
  'source_registry_snapshot_live',
  'blocked_manual_review_live'
]);

function readJson(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function fail(message) {
  console.error(`PJ42.7 VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

function main() {
  const catalog = readJson(routeCatalogPath);
  const freshness = readJson(freshnessPath);
  const matrix = readJson(matrixPath);
  const cache = readJson(cachePath);
  const fallback = readJson(fallbackPath);
  const validation = readJson(validationPath);
  const adapters = readJson(adaptersPath);

  for (const file of validation.required_files || []) {
    if (!existsSync(path.join(root, file))) fail(`Required file not found: ${file}`);
  }

  const adapterIds = new Set((adapters.adapters || []).map((adapter) => adapter.adapter_id));
  adapterIds.add('utility_api_adapter');
  adapterIds.add('source_registry_adapter');

  if (!Array.isArray(catalog.live_routes) || catalog.live_routes.length === 0) {
    fail('live_routes missing or empty.');
    return;
  }

  const routeIds = new Set();
  for (const route of catalog.live_routes) {
    if (routeIds.has(route.route_id)) fail(`Duplicate route_id: ${route.route_id}`);
    routeIds.add(route.route_id);
    if (!adapterIds.has(route.adapter_id)) fail(`${route.route_id} references unknown adapter ${route.adapter_id}`);
    if (route.requires_evidence !== true) fail(`${route.route_id} must require evidence.`);
    if (!Array.isArray(route.freshness_domains) || route.freshness_domains.length === 0) fail(`${route.route_id} missing freshness_domains.`);
    if (!route.failure_fallback) fail(`${route.route_id} missing failure_fallback.`);
    if (typeof route.cache_ttl_seconds !== 'number') fail(`${route.route_id} missing numeric cache_ttl_seconds.`);
  }

  for (const required of requiredRoutes) {
    if (!routeIds.has(required)) fail(`Required live route missing: ${required}`);
  }

  if (!Array.isArray(freshness.must_route_live_when_terms_present) || freshness.must_route_live_when_terms_present.length === 0) fail('freshness trigger terms missing.');
  if (!Array.isArray(freshness.freshness_domains) || freshness.freshness_domains.length === 0) fail('freshness domains missing.');
  for (const domain of freshness.freshness_domains || []) {
    for (const routeId of domain.route_preference || []) {
      if (!routeIds.has(routeId)) fail(`Freshness domain ${domain.domain} references unknown route ${routeId}`);
    }
  }

  if (!Array.isArray(matrix.routes) || matrix.routes.length === 0) fail('live routing matrix routes missing.');
  for (const route of matrix.routes || []) {
    for (const candidate of route.route_candidates || []) {
      if (!routeIds.has(candidate)) fail(`Matrix route for ${route.intent_id} references unknown route ${candidate}`);
    }
    if (route.requires_evidence !== true) fail(`Matrix route for ${route.intent_id} must require evidence.`);
  }

  if (cache.core_rules?.expired_cache_requires_live_refresh !== true) fail('expired_cache_requires_live_refresh must be true.');
  if (!cache.ttl_seconds_by_domain || Object.keys(cache.ttl_seconds_by_domain).length === 0) fail('cache ttl definitions missing.');
  if (cache.cache_use_rules?.may_use_cache_without_refresh_for_current_deadlines !== false) fail('current deadlines may not use cache as final answer.');
  if (cache.cache_use_rules?.may_use_cache_without_refresh_for_fees !== false) fail('fees may not use cache as final answer.');

  if (!Array.isArray(fallback.failure_types) || fallback.failure_types.length === 0) fail('failure_types missing.');
  if (!Array.isArray(fallback.manual_fallback_routes) || fallback.manual_fallback_routes.length === 0) fail('manual_fallback_routes missing.');
  if (!Array.isArray(fallback.forbidden_failure_behavior) || fallback.forbidden_failure_behavior.length === 0) fail('forbidden_failure_behavior missing.');

  if (process.exitCode) return;
  console.log('PJ42.7 VALIDATION PASSED');
  console.log(`Live routes validated: ${routeIds.size}`);
  console.log(`Freshness domains validated: ${(freshness.freshness_domains || []).length}`);
  console.log(`Routing matrix entries validated: ${(matrix.routes || []).length}`);
  console.log(`Failure types validated: ${(fallback.failure_types || []).length}`);
}

main();
