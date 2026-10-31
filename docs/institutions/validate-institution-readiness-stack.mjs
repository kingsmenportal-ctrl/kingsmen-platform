import assert from 'node:assert/strict';
import { applicationReadinessStates } from '../../apps/api/src/institutions/application-readiness.mjs';
assert.equal(applicationReadinessStates.provider.length, 6);
assert.equal(applicationReadinessStates.opportunity.length, 7);
console.log('Institution readiness state contract smoke check passed.');
