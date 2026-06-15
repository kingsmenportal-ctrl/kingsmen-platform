export type DocumentFieldKey =
  | 'full_name'
  | 'id_number'
  | 'phone'
  | 'email'
  | 'address'
  | 'highest_qualification'
  | 'school_name'
  | 'work_experience'
  | 'skills'
  | 'certificates'
  | 'drivers_license';

export type DocumentFieldConfidence = 'high' | 'medium' | 'low' | 'review_required';

export interface DocumentDraftField {
  key: DocumentFieldKey;
  label: string;
  value: string;
  confidence: DocumentFieldConfidence;
  evidence: string;
  reviewRequired: boolean;
  reason: string;
}

export interface DocumentFieldMappingResult {
  fields: DocumentDraftField[];
  warnings: string[];
  reviewRequired: boolean;
}

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

const firstMatch = (text: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
    if (match?.[0]) return clean(match[0]);
  }
  return null;
};

const snippetAround = (text: string, value: string): string => {
  const idx = text.toLowerCase().indexOf(value.toLowerCase());
  if (idx < 0) return value;
  return clean(text.slice(Math.max(0, idx - 60), Math.min(text.length, idx + value.length + 60)));
};

const pushField = (
  fields: DocumentDraftField[],
  text: string,
  key: DocumentFieldKey,
  label: string,
  value: string | null,
  confidence: DocumentFieldConfidence,
  reason: string,
  forceReview = false,
) => {
  if (!value) return;
  fields.push({
    key,
    label,
    value,
    confidence,
    evidence: snippetAround(text, value),
    reviewRequired: forceReview || confidence === 'low' || confidence === 'review_required',
    reason,
  });
};

export function mapExtractedTextToCandidateDraftFields(extractedText: string): DocumentFieldMappingResult {
  const text = clean(extractedText);
  const fields: DocumentDraftField[] = [];
  const warnings: string[] = [];

  if (text.length < 40) {
    warnings.push('Extracted text is very short; upload quality or extraction engine should be reviewed.');
  }

  const email = firstMatch(text, [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i]);
  const phone = firstMatch(text, [/(?:\+27|0)[6-8][0-9][\s-]?[0-9]{3}[\s-]?[0-9]{4}/]);
  const idNumber = firstMatch(text, [/\b[0-9]{13}\b/]);
  const drivers = firstMatch(text, [/(code\s?(?:8|10|14)|driver'?s? licence|drivers license|driving licence)/i]);
  const qualification = firstMatch(text, [/(matric|national senior certificate|nsc|diploma|degree|certificate|higher certificate|nqf\s?\d)/i]);

  const name = firstMatch(text, [
    /(?:full names?|name)[:\s]+([A-Z][A-Za-z' -]{2,80})/i,
    /^([A-Z][A-Za-z' -]{2,80})\s+(?:curriculum vitae|cv|resume)/i,
  ]);

  const address = firstMatch(text, [
    /(?:address|residential address)[:\s]+([^\n]{8,140})/i,
  ]);

  const school = firstMatch(text, [
    /(?:school|high school|secondary school)[:\s]+([^\n]{4,120})/i,
  ]);

  const skills = firstMatch(text, [
    /(?:skills|competencies)[:\s]+([^\n]{8,240})/i,
  ]);

  const certificates = firstMatch(text, [
    /(?:certificates?|training|qualifications?)[:\s]+([^\n]{8,240})/i,
  ]);

  const experience = firstMatch(text, [
    /(?:work experience|employment history|experience)[:\s]+([^\n]{8,300})/i,
  ]);

  pushField(fields, text, 'full_name', 'Full name', name, name ? 'medium' : 'low', 'Detected from name/CV heading pattern.', true);
  pushField(fields, text, 'email', 'Email address', email, 'high', 'Detected using email pattern.');
  pushField(fields, text, 'phone', 'Phone number', phone, 'high', 'Detected using South African phone pattern.');
  pushField(fields, text, 'id_number', 'South African ID number', idNumber, 'review_required', 'Detected 13-digit SA ID-like value; legal identity fields require review.', true);
  pushField(fields, text, 'address', 'Address', address, 'medium', 'Detected from address label.', true);
  pushField(fields, text, 'highest_qualification', 'Highest qualification', qualification, 'medium', 'Detected education/qualification phrase.', true);
  pushField(fields, text, 'school_name', 'School name', school, 'medium', 'Detected school label.', true);
  pushField(fields, text, 'work_experience', 'Work experience', experience, 'medium', 'Detected work experience label.', true);
  pushField(fields, text, 'skills', 'Skills', skills, 'medium', 'Detected skills label.', true);
  pushField(fields, text, 'certificates', 'Certificates/training', certificates, 'medium', 'Detected certificates/training label.', true);
  pushField(fields, text, 'drivers_license', 'Driver licence', drivers, 'medium', 'Detected driver licence phrase.', true);

  if (!email) warnings.push('No email address detected.');
  if (!phone) warnings.push('No South African phone number detected.');
  if (!name) warnings.push('Full name could not be confidently detected.');

  return {
    fields,
    warnings,
    reviewRequired: true,
  };
}
