import type { ComplianceDocType } from "@prisma/client";

// Prisma generates ComplianceDocType as a value-level enum too, but the rest
// of this codebase (see restaurant.repository.ts's updateStatus) prefers
// plain string-literal unions over importing generated enums as values, so
// this stays consistent with that convention.
export const COMPLIANCE_DOC_TYPES: ComplianceDocType[] = [
  "BUSINESS_REGISTRATION",
  "FOOD_SAFETY_CERTIFICATE",
  "LIQUOR_LICENSE",
  "OTHER",
];

export const COMPLIANCE_DOC_TYPE_LABELS: Record<ComplianceDocType, string> = {
  BUSINESS_REGISTRATION: "Business Registration",
  FOOD_SAFETY_CERTIFICATE: "Food Safety Certificate",
  LIQUOR_LICENSE: "Liquor License",
  OTHER: "Other",
};

// PDFs and scanned images cover the realistic set of compliance document
// formats (business registration certificates, food safety certs, liquor
// licenses) - mirrors the image-only allowlist in /api/uploads/sign but
// widened to include application/pdf.
export const ALLOWED_COMPLIANCE_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
