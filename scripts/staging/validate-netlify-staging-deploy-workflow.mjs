#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflow = readFileSync(resolve(".github/workflows/kingsmen-netlify-staging-deploy.yml"), "utf8");
const verifier = readFileSync(resolve("scripts/staging/verify-netlify-staging-deploy.mjs"), "utf8");
const netlifyConfig = readFileSync(resolve("netlify.toml"), "utf8");
const ignore = readFileSync(resolve(".gitignore"), "utf8");

assert.match(workflow, /branches:\s*\n\s*- main/);
assert.match(workflow, /workflow_dispatch:/);
assert.match(workflow, /confirm_staging_deploy/);
assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
assert.match(workflow, /secrets\.NETLIFY_AUTH_TOKEN/);
assert.match(workflow, /NETLIFY_SITE_ID: fb27d0db-b116-4890-8f7f-14e654c27dbc/);
assert.match(workflow, /netlify-cli@27\.16\.2 build/);
assert.match(workflow, /netlify-cli@27\.16\.2 deploy --prod/);
assert.match(workflow, /verify-netlify-staging-deploy\.mjs/);
assert.match(workflow, /actions\/upload-artifact@v4/);
assert.ok(workflow.includes("state:'BUILD_PENDING'"));
assert.match(workflow, /if-no-files-found: error/);
assert.match(verifier, /api\.netlify\.com\/api\/v1\/sites/);
assert.match(verifier, /message\.includes\(sourceSha\)/);
assert.match(verifier, /DEPLOYED_AND_SMOKE_PASSED/);
assert.match(verifier, /candidate\/identity-review/);
assert.match(verifier, /deploy_id/);
assert.match(netlifyConfig, /base = "apps\/web"/);
assert.match(netlifyConfig, /package = "@netlify\/plugin-nextjs"/);
assert.match(ignore, /\.netlify\//);

console.log("PASS: Netlify staging deployment is restricted to reviewed main, uses the existing Kingsmen staging site, requires a deploy credential, builds before publishing, and verifies exact source SHA, deploy ID, and candidate-route HTTP smoke.");
