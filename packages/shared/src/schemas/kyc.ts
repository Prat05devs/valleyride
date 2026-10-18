import { z } from 'zod';
import { CUSTOMER_DOCUMENT_TYPES, type CustomerDocumentType, type VerificationStatus } from '../constants';

export const UPLOAD_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const presignUploadSchema = z.object({
  type: z.enum(CUSTOMER_DOCUMENT_TYPES),
  contentType: z.enum(UPLOAD_CONTENT_TYPES),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

/** The full number is only used to keep its last 4 characters; it is never stored. */
export const submitDocumentSchema = z.object({
  type: z.enum(CUSTOMER_DOCUMENT_TYPES),
  number: z.string().trim().min(4).max(32).transform((s) => s.replace(/[\s-]/g, '').toUpperCase()),
  fileKey: z.string().min(1).max(300),
}).superRefine((v, ctx) => {
  if (v.type === 'AADHAAR' && !/^\d{12}$/.test(v.number)) ctx.addIssue({ code: 'custom', path: ['number'], message: 'Aadhaar has 12 digits' });
});
export type SubmitDocumentInput = z.infer<typeof submitDocumentSchema>;

export const reviewDocumentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  note: z.string().trim().max(300).optional(),
});
export type ReviewDocumentInput = z.infer<typeof reviewDocumentSchema>;

export interface PresignedUpload { uploadUrl: string; fileKey: string; headers: Record<string, string>; expiresInSeconds: number }

export interface CustomerDocumentDTO {
  id: string;
  type: CustomerDocumentType;
  numberMasked: string;
  status: VerificationStatus;
  verifiedAt: string | null;
  createdAt: string;
  /** GET /kyc/documents only: the staff reason when a document is rejected. */
  note?: string | null;
}

export const DOCUMENT_LABEL: Record<CustomerDocumentType, string> = { DL: 'Driving licence', AADHAAR: 'Aadhaar', PASSPORT: 'Passport' };
