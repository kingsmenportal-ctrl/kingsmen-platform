import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const apiRequire = createRequire(join(root, "apps/api/package.json"));
const ts = apiRequire("typescript");
const sourcePath = join(root, "apps/web/src/lib/free-destiny-map-intake-validation.ts");
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const module = { exports: {} };
new Function("module", "exports", compiled)(module, module.exports);
const { validateFreeDestinyMapIntake } = module.exports;

const validPayload = () => ({
  clientRequestId: "123e4567-e89b-42d3-a456-426614174000",
  fullName: "Test Candidate",
  email: "TEST.CANDIDATE@example.co.za",
  province: "Gauteng",
  currentSituation: "Grade 12 / Matric learner",
  knownRoute: "Diploma in information technology",
  routeInterests: ["higher_education"],
  urgency: "normal",
  needsAccommodation: false,
  accommodationArea: "",
  needsFundingHelp: true,
  needsCvHelp: false,
  hasDocumentsReady: false,
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
});

const accepted = validateFreeDestinyMapIntake(validPayload());
assert.equal(accepted.ok, true, "a valid consented public intake must pass");
assert.equal(accepted.payload.email, "test.candidate@example.co.za", "email must be canonicalised");
assert.equal(accepted.payload.routeInterests.length, 1);
assert.equal(accepted.payload.consentToBeContacted, true);

assert.equal(validateFreeDestinyMapIntake(null).ok, false, "null must not be accepted as a payload");
assert.equal(validateFreeDestinyMapIntake([]).ok, false, "arrays must not be accepted as payload objects");

const spoofedIdentity = validPayload();
spoofedIdentity.candidatePublicRef = "candidate-b";
assert.ok(validateFreeDestinyMapIntake(spoofedIdentity).issues.some(x => x.code === "UNSUPPORTED_FIELDS_BLOCKED"),
  "caller-supplied candidate references must be rejected");

const passport = validPayload();
passport.passportNumber = "not-accepted";
assert.ok(validateFreeDestinyMapIntake(passport).issues.some(x => x.code === "SENSITIVE_FIELDS_BLOCKED"),
  "identity and passport fields must be rejected");

const invalidEmail = validPayload();
invalidEmail.email = "not-an-email";
assert.ok(validateFreeDestinyMapIntake(invalidEmail).issues.some(x => x.code === "VALID_EMAIL_REQUIRED"));

const invalidProvince = validPayload();
invalidProvince.province = "Atlantis";
assert.ok(validateFreeDestinyMapIntake(invalidProvince).issues.some(x => x.code === "VALID_PROVINCE_REQUIRED"));

const invalidRoute = validPayload();
invalidRoute.routeInterests = ["employment", "unknown-route"];
assert.ok(validateFreeDestinyMapIntake(invalidRoute).issues.some(x => x.code === "VALID_ROUTE_INTERESTS_REQUIRED"));

const duplicateRoute = validPayload();
duplicateRoute.routeInterests = ["employment", "employment"];
assert.ok(validateFreeDestinyMapIntake(duplicateRoute).issues.some(x => x.code === "VALID_ROUTE_INTERESTS_REQUIRED"));

const missingConsent = validPayload();
missingConsent.consentToProcessBasicInfo = false;
assert.ok(validateFreeDestinyMapIntake(missingConsent).issues.some(x => x.code === "CONSENT_REQUIRED"));

const wrongType = validPayload();
wrongType.needsCvHelp = "false";
assert.ok(validateFreeDestinyMapIntake(wrongType).issues.some(x => x.field === "needsCvHelp"));

const invalidOptionalType = validPayload();
invalidOptionalType.knownRoute = 42;
assert.ok(validateFreeDestinyMapIntake(invalidOptionalType).issues.some(x => x.code === "KNOWN_ROUTE_TOO_LONG"));

const accommodationWithoutArea = validPayload();
accommodationWithoutArea.needsAccommodation = true;
assert.ok(validateFreeDestinyMapIntake(accommodationWithoutArea).issues.some(x => x.code === "ACCOMMODATION_AREA_REQUIRED"));

const noRequestId = validPayload();
noRequestId.clientRequestId = "1";
assert.ok(validateFreeDestinyMapIntake(noRequestId).issues.some(x => x.code === "VALID_REQUEST_ID_REQUIRED"));

console.log("Free Destiny Map intake validation: PASS (16 security and schema assertions).");
