import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentPath = "apps/web/src/app/free-destiny-map/FreeDestinyMapIntake.tsx";
const pagePath = "apps/web/src/app/free-destiny-map/page.tsx";
const packagePath = "package.json";

const component = readFileSync(componentPath, "utf8");
const page = readFileSync(pagePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.match(component, /^"use client";/m, "Preview UI must be a client component.");
assert.match(component, /onSubmit=\{handlePreview\}/, "Preview form must invoke the readiness preview handler.");
assert.match(component, /event\.preventDefault\(\)/, "Preview must prevent native form submission.");
assert.match(component, /data-kingsmen-browser-only="true"/, "Preview must mark its browser-only boundary.");
assert.match(component, /data-kingsmen-preview-status="ready"/, "Ready state must be exposed for runtime tests.");
assert.match(component, /data-kingsmen-preview-steps="true"/, "Generated next steps must be identifiable.");
assert.match(component, /role="alert"/, "Validation feedback must be accessible.");
assert.match(component, /aria-live="polite"/, "Preview updates must be announced accessibly.");
assert.match(component, /These selections are not sent to Kingsmen or saved by this page/, "The form must state its data boundary.");
assert.match(component, /does not call an API, use browser storage or submit the form/, "The privacy boundary must remain visible.");
assert.doesNotMatch(component, /\bfetch\s*\(/, "Browser-only preview must not call fetch.");
assert.doesNotMatch(component, /\b(localStorage|sessionStorage)\b/, "Browser-only preview must not persist candidate selections.");
assert.doesNotMatch(component, /\b(XMLHttpRequest|sendBeacon)\b/, "Browser-only preview must not transmit candidate selections.");
assert.match(page, /import FreeDestinyMapIntake from ["']\.\/FreeDestinyMapIntake["']/, "Free Destiny Map page must use the interactive component.");
assert.match(page, /<FreeDestinyMapIntake\s*\/>/, "Interactive preview component must be rendered.");
assert.match(packageJson.scripts.test, /validate-free-destiny-map-preview\.mjs/, "The source contract must run under npm test.");

console.log("Free Destiny Map browser-only readiness preview contract passed.");
