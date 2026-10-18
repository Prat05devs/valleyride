import { z } from 'zod';
import { INVESTMENT_STRUCTURES } from '../constants';

/** POST /investor/calculate: illustrative only, nothing is stored. */
export const investorCalculateSchema = z.object({
  principalPaise: z.number().int().positive().max(100_000_000_00), // ₹10 crore cap
  annualRatePct: z.number().min(0).max(50),
  months: z.number().int().min(1).max(120),
  structure: z.enum(INVESTMENT_STRUCTURES),
  startDate: z.coerce.date(),
});
export type InvestorCalculateInput = z.infer<typeof investorCalculateSchema>;
