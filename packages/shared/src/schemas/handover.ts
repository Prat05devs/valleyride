import { z } from 'zod';
import type { ReturnCharges } from '../policy';

const photoKey = z.string().min(1).max(300);

/** Staff, at the desk: the bike's condition before the customer signs. The booking stays CONFIRMED. */
export const pickupHandoverSchema = z.object({
  odometerKm: z.number().int().min(0),
  fuelLevel: z.number().int().min(0).max(100).optional(),
  photos: z.array(z.object({ key: photoKey, label: z.string().max(40) })).min(4).max(12),
  damageNotes: z.string().trim().max(1000).optional(),
  licenceChecked: z.literal(true),
});
export type PickupHandoverInput = z.infer<typeof pickupHandoverSchema>;

export const RELATIONSHIPS = ['Family', 'Friend', 'Partner', 'Colleague'] as const;

/** Customer, on their phone: sign, confirm the condition, leave an emergency contact. Moves the booking to ONGOING. */
export const startRideSchema = z.object({
  signaturePng: z.string().startsWith('data:image/png;base64,').max(400_000),
  acceptedTerms: z.literal(true),
  conditionConfirmed: z.literal(true),
  emergencyContact: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number'),
    relationship: z.enum(RELATIONSHIPS),
  }),
});
export type StartRideInput = z.infer<typeof startRideSchema>;

/** Customer: a mark on the bike that the pickup checklist missed. Staff add it before the ride starts. */
export const reportMarkSchema = z.object({ note: z.string().trim().min(3).max(500) });

/** Staff, at return: inspection and odometer. Moves the booking to COMPLETED and refunds the deposit. */
export const returnHandoverSchema = z.object({
  odometerKm: z.number().int().min(0),
  fuelLevel: z.number().int().min(0).max(100).optional(),
  photos: z.array(z.object({ key: photoKey, label: z.string().max(40) })).max(12).default([]),
  damageNotes: z.string().trim().max(1000).optional(),
  damagePaise: z.number().int().min(0).default(0),
  returnedAt: z.coerce.date().optional(),
  checklist: z.object({ helmetsReturned: z.boolean(), documentsReturned: z.boolean() }),
});
export type ReturnHandoverInput = z.infer<typeof returnHandoverSchema>;

export interface HandoverPhotoDTO { label: string; url: string }

export interface HandoverDTO {
  type: 'PICKUP' | 'RETURN';
  at: string;
  odometerKm: number;
  fuelLevel: number | null;
  photos: HandoverPhotoDTO[];
  damageNotes: string | null;
  signedAt: string | null;
  charges: ReturnCharges | null;
  checklist: { helmetsReturned: boolean; documentsReturned: boolean } | null;
}

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(40)).max(8).default([]),
  comment: z.string().trim().max(1000).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
