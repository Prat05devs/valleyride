import type { CreateCouponInput } from '@valleyride/shared';
import { Coupon } from '../../db';
import { AppError } from '../../utils/AppError';
import { audit, type Actor } from '../../utils/audit';

const toDTO = (c: Coupon) => ({
  code: c.code, percentOff: Number(c.percentOff), maxUses: c.maxUses, used: c.used,
  validTill: c.validTill?.toISOString() ?? null, partner: c.partner,
});

export const couponService = {
  /** Percent off for a valid coupon code, or null when the code is unknown, expired or used up. */
  async percentOff(code: string | undefined): Promise<number | null> {
    if (!code) return null;
    const coupon = await Coupon.findValid(code);
    return coupon ? coupon.percentOff : null;
  },

  async list() {
    return (await Coupon.findAll({ order: [['code', 'ASC']] })).map(toDTO);
  },

  async create(actor: Actor, input: CreateCouponInput) {
    if (await Coupon.findByPk(input.code)) throw new AppError(409, 'DUPLICATE', 'That code already exists.');
    const c = await Coupon.create({ code: input.code, percentOff: input.percentOff, maxUses: input.maxUses ?? null, validTill: input.validTill ?? null, partner: input.partner ?? null });
    await audit(actor, { action: 'coupon.create', entity: 'coupon', entityId: c.code, diff: input });
    return toDTO(c);
  },
};
