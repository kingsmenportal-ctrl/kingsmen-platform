export const PUBLIC_SOURCE_DISCLOSURES = [
  {
    key: "NOT_OFFICIAL",
    title: "Not an official portal",
    text: "Kingsmen is a private route command house. Kingsmen is not an official university, TVET, SETA, NSFAS, CAO, employer, bursary provider, accommodation provider, payment provider, or government portal."
  },
  {
    key: "NO_GUARANTEE",
    title: "No guarantee",
    text: "Kingsmen supports direction, readiness, routing, evidence, and execution discipline. Kingsmen does not guarantee admission, funding, employment, accommodation, approval, or official response speed."
  },
  {
    key: "SEALED_ROUTES",
    title: "Sealed route intelligence",
    text: "Free previews do not reveal exact activated-package targets, links, manual plans, or route execution details."
  },
  {
    key: "EMAIL_FIRST",
    title: "Email-first communication",
    text: "Kingsmen uses email as the primary evidence channel. WhatsApp is reserved for urgent-only escalation."
  },
  {
    key: "SMART_FORM",
    title: "Smart form prefill",
    text: "Kingsmen intake is document-aware. CVs and uploaded documents may prefill fields, but candidates must confirm extracted details."
  }
];

export function requiredPublicDisclosures(): string[] {
  return PUBLIC_SOURCE_DISCLOSURES.map((disclosure) => disclosure.key);
}