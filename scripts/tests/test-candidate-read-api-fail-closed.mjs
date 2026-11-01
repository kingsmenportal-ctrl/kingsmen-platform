import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../apps/api/src/server.ts", import.meta.url), "utf8");
const candidateRoute = source.indexOf('const candidateId = getPathParam(/^\\/api\\/candidates\\/([^/]+)\\/status$/, pathname);');
const applicationRoute = source.indexOf('const applicationId = getPathParam(/^\\/api\\/applications\\/([^/]+)\\/workbench$/, pathname);');
assert.notEqual(candidateRoute, -1, "candidate status route must exist");
assert.notEqual(applicationRoute, -1, "application workbench route must exist");

const candidateBlock = source.slice(candidateRoute, source.indexOf("const applicationId", candidateRoute));
const applicationBlock = source.slice(applicationRoute, source.indexOf('sendError(response, 404, "ROUTE_NOT_FOUND"', applicationRoute));

assert.match(candidateBlock, /CANDIDATE_AUTHORIZATION_NOT_CONFIGURED/);
assert.match(candidateBlock, /sendError\(response, 503/);
assert.doesNotMatch(candidateBlock, /handleCandidateStatus\(response, candidateId\)/);
assert.match(applicationBlock, /APPLICATION_AUTHORIZATION_NOT_CONFIGURED/);
assert.match(applicationBlock, /sendError\(response, 503/);
assert.doesNotMatch(applicationBlock, /handleApplicationWorkbench\(response, applicationId\)/);

console.log("PASS candidate and application read routes fail closed until ownership authorization is implemented.");
