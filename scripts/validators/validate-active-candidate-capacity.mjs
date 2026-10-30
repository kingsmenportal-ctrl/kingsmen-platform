#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migration = fs.readFileSync(path.join(root, "db/migrations/0098_enforce_active_candidate_capacity.sql"), "utf8");
const source = fs.readFileSync(path.join(root, "db/migrations/0095_candidate_self_service_profile_bootstrap.sql"), "utf8");

assert.match(source, /is_active[\s\S]{0,180}true/i, "self-service candidate creation must count as active");
assert.match(migration, /KINGSMEN_CAP_ACTIVE_CANDIDATES/);
assert.match(migration, /is_active is true/i);
assert.match(migration, /pg_advisory_xact_lock[\s\S]*?hashtextextended/i);
assert.match(migration, /for share/i, "cap configuration must remain stable during admission");
assert.match(migration, /ACTIVE_CANDIDATE_CAP_CONFIG_INVALID/);
assert.match(migration, /ACTIVE_CANDIDATE_CAP_STAGE_NOT_REGISTERED/);
assert.match(migration, /ACTIVE_CANDIDATE_CAP_EXCEEDED/);
for (const stage of [500, 1000, 5000, 10000, 25000]) assert.match(migration, new RegExp("\\b"+stage+"\\b"));
assert.match(migration, /before insert or update of is_active on public\.candidates/i);
assert.match(migration, /security definer[\s\S]*?set search_path = pg_catalog, public, pg_temp/i);
console.log("Active candidate database admission contract: PASS");
