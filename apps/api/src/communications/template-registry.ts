import type { CommunicationTemplate } from "./communication-types";

export const DEFAULT_COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    templateKey: "candidate.welcome.email",
    templateName: "Candidate Welcome Email",
    channel: "EMAIL_PRIMARY",
    subjectTemplate: "Welcome to Kingsmen",
    bodyTemplate: "Hello {{candidate_name}}, your Kingsmen route house journey has started.",
    purpose: "WELCOME",
    allowedWhen: ["INTAKE_PENDING"],
    requiresHumanReview: false,
    isActive: true
  },
  {
    templateKey: "candidate.documents.request.email",
    templateName: "Document Request Email",
    channel: "EMAIL_PRIMARY",
    subjectTemplate: "Documents needed for your route",
    bodyTemplate: "Hello {{candidate_name}}, we need these documents before execution can continue: {{document_list}}.",
    purpose: "DOCUMENT_REQUEST",
    allowedWhen: ["DOCUMENT_PENDING"],
    requiresHumanReview: false,
    isActive: true
  },
  {
    templateKey: "candidate.urgent.whatsapp",
    templateName: "Urgent WhatsApp Escalation",
    channel: "WHATSAPP_URGENT_ONLY",
    bodyTemplate: "Urgent Kingsmen update: {{urgent_reason}}. Please check your email/portal for full details.",
    purpose: "URGENT_ESCALATION",
    allowedWhen: ["URGENT_ONLY"],
    requiresHumanReview: true,
    isActive: true
  }
];

export function renderTemplate(template: CommunicationTemplate, values: Record<string, string>) {
  const render = (input?: string) => {
    if (!input) return undefined;
    return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, value), input);
  };

  return {
    subject: render(template.subjectTemplate),
    body: render(template.bodyTemplate)
  };
}

export function findTemplate(templateKey: string, templates = DEFAULT_COMMUNICATION_TEMPLATES) {
  return templates.find((template) => template.templateKey === templateKey && template.isActive);
}