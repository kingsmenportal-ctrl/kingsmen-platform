import test from "node:test";
import assert from "node:assert/strict";
import { buildCandidatePortalSections } from "./candidate-portal-read-model";
import type { CandidatePortalSummary } from "./candidate-types";
import type { CandidateProfileReadiness } from "./candidate-profile-readiness";

const summary: CandidatePortalSummary = {
  candidate: {
    candidateId: "candidate-a",
    publicRef: "KM-TEST-A",
    displayName: "Candidate A",
    email: "candidate-a@example.test",
    currentState: "NEW" as CandidatePortalSummary["candidate"]["currentState"]
  },
  profileConfidence: "HIGH",
  documentReadiness: "READY",
  applicationReadiness: "READY",
  unreadMessages: 0,
  openSupportTickets: 0,
  outstandingAmountCents: 0,
  lastUpdatedAt: "2026-01-01T00:00:00.000Z"
};

const ready: CandidateProfileReadiness = {
  candidateId: "candidate-a",
  status: "READY",
  ready: true,
  blockers: [],
  missingFields: [],
  nextActions: []
};

test("application card is ready only when server readiness is ready", () => {
  const sections = buildCandidatePortalSections(summary, ready);
  assert.equal(sections.find((section) => section.key === "applications")?.status, "OK");
});

test("legacy READY application summary is gated when profile readiness needs action", () => {
  const readiness: CandidateProfileReadiness = {
    ...ready,
    status: "ACTION_REQUIRED",
    ready: false,
    missingFields: ["phone"],
    nextActions: ["Complete profile fields: phone."]
  };
  const sections = buildCandidatePortalSections(summary, readiness);
  assert.equal(sections.find((section) => section.key === "profile")?.status, "ACTION_REQUIRED");
  assert.equal(sections.find((section) => section.key === "applications")?.status, "ACTION_REQUIRED");
  assert.match(sections.find((section) => section.key === "applications")!.message, /phone/);
});

test("rejected identity blocks application card even when legacy summary says ready", () => {
  const readiness: CandidateProfileReadiness = {
    ...ready,
    status: "BLOCKED",
    ready: false,
    blockers: ["IDENTITY_LINK_REJECTED"],
    nextActions: ["Complete identity verification before accessing protected candidate workflows."]
  };
  const sections = buildCandidatePortalSections(summary, readiness);
  assert.equal(sections.find((section) => section.key === "profile")?.status, "BLOCKED");
  assert.equal(sections.find((section) => section.key === "applications")?.status, "BLOCKED");
});

test("candidate ownership mismatch fails closed", () => {
  assert.throws(
    () => buildCandidatePortalSections(summary, { ...ready, candidateId: "candidate-b" }),
    /CANDIDATE_PORTAL_READINESS_OWNERSHIP_MISMATCH/
  );
});
