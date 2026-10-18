import { DURATION_TIERS, GST_PCT, ONE_WAY_FEE_PAISE, quote, type QuoteRequestInput, type Tier } from '@valleyride/shared';
import { AuditLog, PricingRule, VehicleModel } from '../../db';
import { AppError } from '../../utils/AppError';
import { cached, invalidate } from '../../utils/cache';
import { couponService } from './coupon.service';

type Actor = { id: string; ip: string | null };
const istDate = (d: Date) => new Date(d.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

export interface RuleDTO { id: string; vehicleModelId: string | null; minDays: number | null; discountPct: number | null; seasonFrom: string | null; seasonTo: string | null; multiplier: number }
const toRule = (r: PricingRule): RuleDTO => ({
  id: r.id, vehicleModelId: r.vehicleModelId, minDays: r.minDays, discountPct: r.discountPct === null ? null : Number(r.discountPct),
  seasonFrom: r.seasonFrom, seasonTo: r.seasonTo, multiplier: Number(r.multiplier),
});
const allRules = () => cached('pricing:rules', 300, async () => (await PricingRule.findAll()).map(toRule));

/**
 * pricing_rules, so prices change without a deploy:
 * - duration tiers: rows with min_days + discount_pct (a model's own rows replace the all-model rows);
 * - seasons: rows with season_from/to + multiplier on the day price, by pickup date in IST (a model's own row wins).
 * With no tier rows the launch tiers in packages/shared apply.
 */
function resolve(rules: RuleDTO[], modelId: string, startAt: Date) {
  const tierRows = (own: boolean) => rules.filter((r) => r.minDays !== null && r.discountPct !== null && (own ? r.vehicleModelId === modelId : r.vehicleModelId === null));
  const rows = tierRows(true).length ? tierRows(true) : tierRows(false);
  const tiers: Tier[] = rows.length ? rows.map((r) => ({ minDays: r.minDays!, pct: r.discountPct! })).sort((a, b) => b.minDays - a.minDays) : [...DURATION_TIERS];
  const day = istDate(startAt);
  const inSeason = (r: RuleDTO) => r.seasonFrom !== null && r.seasonTo !== null && r.seasonFrom <= day && day <= r.seasonTo;
  const season = rules.find((r) => inSeason(r) && r.vehicleModelId === modelId) ?? rules.find((r) => inSeason(r) && r.vehicleModelId === null);
  return { tiers, multiplier: season?.multiplier ?? 1 };
}

export const pricingService = {
  /** The one place prices are computed: model price × season, rule tiers, then quote() from packages/shared. */
  async quoteModel(model: VehicleModel, startAt: Date, endAt: Date, o: { oneWay?: boolean; couponPct?: number } = {}) {
    const { tiers, multiplier } = resolve(await allRules(), model.id, startAt);
    const base = model.toPricing();
    return quote({ ...base, pricePerDayPaise: Math.round(base.pricePerDayPaise * multiplier) }, startAt, endAt, { ...o, tiers });
  },

  /** POST /quotes: the same quote the booking engine charges, so the price shown is the price paid. */
  async quoteFor(input: QuoteRequestInput) {
    const model = await VehicleModel.findByPk(input.vehicleModelId);
    if (!model) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');
    const couponPct = await couponService.percentOff(input.couponCode);
    const q = await this.quoteModel(model, input.startAt, input.endAt, { oneWay: input.pickupLocationId !== input.returnLocationId, couponPct: couponPct ?? 0 });
    return { ...q, vehicleModelId: model.id, couponCode: couponPct === null ? null : input.couponCode!, couponValid: input.couponCode ? couponPct !== null : null };
  },

  /** GET /pricing: what clients need for hints ("3 more days for 10% off"); never used to charge. */
  async table() {
    const rules = await allRules();
    const global = resolve(rules.filter((r) => r.vehicleModelId === null), '', new Date());
    return {
      tiers: global.tiers, oneWayFeePaise: ONE_WAY_FEE_PAISE, gstPct: GST_PCT,
      seasons: rules.filter((r) => r.seasonFrom).map((r) => ({ vehicleModelId: r.vehicleModelId, from: r.seasonFrom, to: r.seasonTo, multiplier: r.multiplier })),
    };
  },

  // ─── Admin ────────────────────────────────────────────────────────────────────────────────────
  listRules: allRules,

  async saveRule(a: Actor, input: Omit<RuleDTO, 'id'> & { id?: string }) {
    const values = { vehicleModelId: input.vehicleModelId, minDays: input.minDays, discountPct: input.discountPct, seasonFrom: input.seasonFrom, seasonTo: input.seasonTo, multiplier: input.multiplier };
    const row = input.id ? await PricingRule.findByPk(input.id) : null;
    if (input.id && !row) throw new AppError(404, 'NOT_FOUND', 'Rule not found');
    const saved = row ? await row.update(values) : await PricingRule.create(values);
    await AuditLog.create({ actorId: a.id, action: row ? 'pricing.update' : 'pricing.create', entity: 'pricing_rule', entityId: saved.id, diff: values, ip: a.ip });
    await invalidate('pricing:rules');
    return toRule(saved);
  },

  async deleteRule(a: Actor, id: string) {
    const n = await PricingRule.destroy({ where: { id } });
    if (!n) throw new AppError(404, 'NOT_FOUND', 'Rule not found');
    await AuditLog.create({ actorId: a.id, action: 'pricing.delete', entity: 'pricing_rule', entityId: id, diff: null, ip: a.ip });
    await invalidate('pricing:rules');
  },

  /** Day price, deposit and km allowances live in vehicle_models and change here, not in code. */
  async updateModel(a: Actor, id: string, patch: Partial<{ pricePerDayPaise: number; depositPaise: number; kmPerDay: number; extraKmPaise: number }>) {
    const m = await VehicleModel.findByPk(id);
    if (!m) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');
    const before = m.toDTO();
    await m.update({
      ...(patch.pricePerDayPaise !== undefined && { priceDayPaise: patch.pricePerDayPaise }),
      ...(patch.depositPaise !== undefined && { depositPaise: patch.depositPaise }),
      ...(patch.kmPerDay !== undefined && { kmPerDay: patch.kmPerDay }),
      ...(patch.extraKmPaise !== undefined && { extraKmPaise: patch.extraKmPaise }),
    });
    await AuditLog.create({ actorId: a.id, action: 'pricing.model', entity: 'vehicle_model', entityId: id, diff: { before, after: m.toDTO() }, ip: a.ip });
    await invalidate('fleet:');
    return m.toDTO();
  },
};
