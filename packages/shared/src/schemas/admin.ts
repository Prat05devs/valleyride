import { z } from 'zod';
import { routeDetailsSchema } from './guide';
import { INVESTMENT_STRUCTURES, MAINTENANCE_TYPES, VEHICLE_DOCUMENT_TYPES, VEHICLE_STATUSES } from '../constants';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const createVehicleSchema = z.object({
  vehicleModelId: z.string().uuid(),
  registrationNo: z.string().trim().toUpperCase().regex(/^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}$/, 'Use a registration like UK07 RE 4205'),
  homeLocationId: z.string().uuid(),
  odometerKm: z.number().int().min(0).default(0),
  purchasedOn: dateOnly.optional(),
});
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const vehicleStatusSchema = z.object({ status: z.enum(VEHICLE_STATUSES), reason: z.string().trim().max(200).optional() });

export const maintenanceSchema = z.object({
  type: z.enum(MAINTENANCE_TYPES),
  odometerKm: z.number().int().min(0),
  costPaise: z.number().int().min(0).default(0),
  performedOn: dateOnly,
  notes: z.string().trim().max(1000).optional(),
});
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

export const vehicleDocumentSchema = z.object({
  type: z.enum(VEHICLE_DOCUMENT_TYPES),
  number: z.string().trim().min(2).max(60),
  expiresOn: dateOnly.optional(),
});

export const calendarQuerySchema = z.object({ from: z.coerce.date(), to: z.coerce.date() })
  .refine((q) => q.to > q.from && q.to.getTime() - q.from.getTime() <= 62 * 86_400_000, 'Pick a range of up to 62 days');

export const monthQuerySchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM') });

export const createCouponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/, '4–20 letters and digits'),
  percentOff: z.number().min(1).max(50),
  maxUses: z.number().int().min(1).optional(),
  validTill: z.coerce.date().optional(),
  partner: z.string().trim().max(80).optional(),
});
export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const createInvestorSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  fullName: z.string().trim().min(2).max(120),
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'PAN looks like ABCDE1234F').optional(),
  bankAccountRef: z.string().trim().max(60).optional(),
});

export const createInvestmentSchema = z.object({
  investorId: z.string().uuid(),
  principalPaise: z.number().int().positive(),
  annualRatePct: z.number().min(0).max(50),
  tenureMonths: z.number().int().min(1).max(120),
  structure: z.enum(INVESTMENT_STRUCTURES),
  startDate: dateOnly,
  agreementFileKey: z.string().max(300).optional(),
});
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;

export const markPaidSchema = z.object({ txnRef: z.string().trim().min(4).max(64), paidAt: z.coerce.date().optional() });

/** A pricing_rules row: either a duration tier (minDays + discountPct) or a season (from/to + multiplier). */
export const pricingRuleSchema = z.object({
  vehicleModelId: z.string().uuid().nullable().default(null),
  minDays: z.number().int().min(1).max(365).nullable().default(null),
  discountPct: z.number().min(0).max(80).nullable().default(null),
  seasonFrom: dateOnly.nullable().default(null),
  seasonTo: dateOnly.nullable().default(null),
  multiplier: z.number().min(0.5).max(3).default(1),
}).refine((r) => (r.minDays !== null && r.discountPct !== null) !== (r.seasonFrom !== null && r.seasonTo !== null), 'A rule is either a duration tier or a season')
  .refine((r) => !r.seasonFrom || !r.seasonTo || r.seasonFrom <= r.seasonTo, 'The season ends before it starts');

export const vehicleModelPriceSchema = z.object({
  pricePerDayPaise: z.number().int().positive().optional(),
  depositPaise: z.number().int().min(0).optional(),
  kmPerDay: z.number().int().positive().optional(),
  extraKmPaise: z.number().int().min(0).optional(),
}).refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const routeGuideInputSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,80}$/, 'Lowercase letters, digits and dashes'),
  title: z.string().trim().min(3).max(160),
  distanceKm: z.number().int().min(1).max(2000),
  bodyMd: z.string().trim().min(10).max(20_000),
  recommendedModels: z.array(z.string().uuid()).max(8).default([]),
}).merge(routeDetailsSchema);
export type RouteGuideInput = z.infer<typeof routeGuideInputSchema>;
