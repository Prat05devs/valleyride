import { Op } from 'sequelize';
import type { CreateInvestmentInput, InvestorCalculateInput } from '@valleyride/shared';
import { Investment, Investor, RepaymentSchedule, sequelize, User } from '../../db';
import { AppError } from '../../utils/AppError';
import { audit, type Actor } from '../../utils/audit';
import { buildSchedule } from './amortization';

const ymd = (d: Date) => d.toISOString().slice(0, 10);

function scheduleDTO(r: RepaymentSchedule) {
  return {
    id: r.id, installmentNo: r.installmentNo, dueDate: r.dueDate,
    principalPaise: Number(r.principalPaise), interestPaise: Number(r.interestPaise), paymentPaise: Number(r.principalPaise) + Number(r.interestPaise),
    status: r.status, paidAt: r.paidAt ? r.paidAt.toISOString() : null, txnRef: r.txnRef,
  };
}

function investmentDTO(i: Investment, rows: RepaymentSchedule[], ref: string) {
  const schedule = rows.sort((a, b) => a.installmentNo - b.installmentNo).map(scheduleDTO);
  const paid = schedule.filter((s) => s.status === 'PAID');
  const next = schedule.find((s) => s.status !== 'PAID') ?? null;
  return {
    id: i.id, ref,
    principalPaise: Number(i.principalPaise), annualRatePct: Number(i.annualRatePct), tenureMonths: i.tenureMonths,
    structure: i.structure, startDate: i.startDate, status: i.status,
    paidCount: paid.length, receivedPaise: paid.reduce((s, r) => s + r.paymentPaise, 0),
    outstandingPrincipalPaise: Number(i.principalPaise) - paid.reduce((s, r) => s + r.principalPaise, 0),
    next, schedule,
  };
}

/** Stable short refs (VRC-0001…) by creation order, without a schema change. */
async function refs(): Promise<(id: string) => string> {
  const all = await Investment.findAll({ attributes: ['id'], order: [['createdAt', 'ASC'], ['id', 'ASC']] });
  const seq = new Map(all.map((r, i) => [r.id, `VRC-${String(i + 1).padStart(4, '0')}`]));
  return (id) => seq.get(id) ?? 'VRC-?';
}

export const investorService = {
  /** Illustrative schedule for the public calculator. Nothing is stored. */
  calculate(input: InvestorCalculateInput) {
    const rows = buildSchedule(input);
    const totalPaidPaise = rows.reduce((s, r) => s + r.paymentPaise, 0);
    const totalInterestPaise = rows.reduce((s, r) => s + r.interestPaise, 0);
    return {
      illustrative: true,
      monthlyPaymentPaise: rows[0]?.paymentPaise ?? 0,
      finalPaymentPaise: rows.at(-1)?.paymentPaise ?? 0,
      totalPaidPaise,
      totalInterestPaise,
      principalPaise: input.principalPaise,
      schedule: rows,
      disclaimer: 'Illustrative commercial terms only. Returns and repayment of principal are not guaranteed.',
    };
  },

  // ─── Investor portal (Phase 4) ────────────────────────────────────────────────────────────────
  async profileFor(userId: string) {
    const inv = await Investor.findOne({ where: { userId } });
    if (!inv) throw new AppError(403, 'NOT_AN_INVESTOR', 'This account has no investor profile.');
    return inv;
  },

  async myProfile(userId: string) {
    const inv = await this.profileFor(userId);
    const user = await User.findByPk(userId, { attributes: ['fullName', 'phone'] });
    return { name: user?.fullName ?? null, phone: user?.phone ?? null, panMasked: inv.panMasked, bankAccountRef: inv.bankAccountRef, kycStatus: inv.kycStatus };
  },

  /** Onboarding: only masked values are stored (PAN last 4, account last 4 with the IFSC); staff verify before the first repayment. */
  async updateProfile(userId: string, input: { pan?: string; bank?: { holder: string; ifsc: string; accountNumber: string } }) {
    const inv = await this.profileFor(userId);
    const patch: Partial<{ panMasked: string; bankAccountRef: string; kycStatus: 'PENDING' }> = {};
    if (input.pan) { patch.panMasked = `••••••${input.pan.slice(-4)}`; patch.kycStatus = 'PENDING'; }
    if (input.bank) patch.bankAccountRef = `${input.bank.holder.slice(0, 30)} · ${input.bank.ifsc} · ••••${input.bank.accountNumber.slice(-4)}`;
    await inv.update(patch);
    return this.myProfile(userId);
  },

  async agreementKey(userId: string | null, id: string) {
    const where = userId ? { id, investorId: (await this.profileFor(userId)).id } : { id };
    const row = await Investment.findOne({ where });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Investment not found');
    if (!row.agreementFileKey) throw new AppError(404, 'NO_AGREEMENT', 'The signed agreement has not been uploaded yet.');
    return row.agreementFileKey;
  },

  async myInvestments(userId: string) {
    const inv = await this.profileFor(userId);
    const rows = await Investment.findAll({ where: { investorId: inv.id, status: { [Op.ne]: 'DRAFT' } }, order: [['startDate', 'ASC']] });
    const [schedules, ref] = await Promise.all([RepaymentSchedule.findAll({ where: { investmentId: rows.map((r) => r.id) } }), refs()]);
    return rows.map((r) => investmentDTO(r, schedules.filter((s) => s.investmentId === r.id), ref(r.id)));
  },

  async myInvestment(userId: string, id: string) {
    const inv = await this.profileFor(userId);
    const row = await Investment.findOne({ where: { id, investorId: inv.id } });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Investment not found');
    const [rows, ref] = await Promise.all([RepaymentSchedule.findAll({ where: { investmentId: id } }), refs()]);
    return { ...investmentDTO(row, rows, ref(row.id)), investorName: (await User.findByPk(userId, { attributes: ['fullName'] }))?.fullName ?? null, panMasked: inv.panMasked };
  },

  // ─── Admin ────────────────────────────────────────────────────────────────────────────────────
  async listInvestors() {
    const rows = await Investor.findAll({ include: [{ model: User, as: 'user', attributes: ['fullName', 'phone'] }], order: [['createdAt', 'ASC']] });
    return rows.map((i) => {
      const u = (i as Investor & { user: User }).user;
      return { id: i.id, name: u?.fullName ?? null, phone: u?.phone ?? null, panMasked: i.panMasked, kycStatus: i.kycStatus };
    });
  },

  /** Creates (or upgrades) the user with the investor role and an investor profile. Only the last 4 PAN characters are kept. */
  async createInvestor(a: Actor, input: { phone: string; fullName: string; pan?: string; bankAccountRef?: string }) {
    return sequelize.transaction(async (t) => {
      const [user] = await User.findOrCreate({ where: { phone: input.phone }, defaults: { phone: input.phone, fullName: input.fullName, email: null, phoneVerifiedAt: null, role: 'investor' }, transaction: t });
      if (user.role === 'customer') await user.update({ role: 'investor', fullName: user.fullName ?? input.fullName }, { transaction: t });
      else if (user.role !== 'investor') throw new AppError(409, 'ROLE_CONFLICT', 'This number belongs to a staff account.');
      const existing = await Investor.findOne({ where: { userId: user.id }, transaction: t });
      if (existing) throw new AppError(409, 'DUPLICATE', 'This person is already an investor.');
      const inv = await Investor.create({
        userId: user.id, panMasked: input.pan ? `••••••${input.pan.slice(-4)}` : null, bankAccountRef: input.bankAccountRef ?? null,
        kycStatus: input.pan ? 'VERIFIED' : 'PENDING',
      }, { transaction: t });
      await audit(a, { action: 'investor.create', entity: 'investor', entityId: inv.id, diff: { phone: input.phone } }, t);
      return { id: inv.id, name: user.fullName, phone: user.phone, panMasked: inv.panMasked, kycStatus: inv.kycStatus };
    });
  },

  /** Records a signed investment and stores its full schedule from the same amortization code as the calculator. */
  async createInvestment(a: Actor, input: CreateInvestmentInput) {
    const investor = await Investor.findByPk(input.investorId);
    if (!investor) throw new AppError(404, 'NOT_FOUND', 'Investor not found');
    return sequelize.transaction(async (t) => {
      const inv = await Investment.create({ ...input, agreementFileKey: input.agreementFileKey ?? null, status: 'ACTIVE' }, { transaction: t });
      const rows = buildSchedule({ principalPaise: input.principalPaise, annualRatePct: input.annualRatePct, months: input.tenureMonths, structure: input.structure, startDate: new Date(`${input.startDate}T00:00:00Z`) });
      await RepaymentSchedule.bulkCreate(rows.map((r) => ({
        investmentId: inv.id, installmentNo: r.installmentNo, dueDate: ymd(r.dueDate), principalPaise: r.principalPaise, interestPaise: r.interestPaise, paidAt: null, txnRef: null,
      })), { transaction: t });
      await audit(a, { action: 'investment.create', entity: 'investment', entityId: inv.id, diff: input }, t);
      return inv.id;
    });
  },

  async allInvestments() {
    const rows = await Investment.findAll({ include: [{ model: Investor, as: 'investor', include: [{ model: User, as: 'user', attributes: ['fullName'] }] }], order: [['createdAt', 'ASC']] });
    const [schedules, ref] = await Promise.all([RepaymentSchedule.findAll({ where: { investmentId: rows.map((r) => r.id) } }), refs()]);
    return rows.map((r) => {
      const { schedule: _s, ...rest } = investmentDTO(r, schedules.filter((s) => s.investmentId === r.id), ref(r.id));
      return { ...rest, investor: (r as Investment & { investor: Investor & { user: User } }).investor?.user?.fullName ?? null };
    });
  },

  /** Instalments due in a YYYY-MM month (and anything earlier still unpaid). */
  async dues(month: string) {
    const [y, m] = month.split('-').map(Number) as [number, number];
    const start = `${month}-01`;
    const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const rows = await RepaymentSchedule.findAll({
      where: { [Op.or]: [{ dueDate: { [Op.gte]: start, [Op.lt]: end } }, { dueDate: { [Op.lt]: start }, status: { [Op.ne]: 'PAID' } }] },
      include: [{ model: Investment, as: 'investment', include: [{ model: Investor, as: 'investor', include: [{ model: User, as: 'user', attributes: ['fullName'] }] }] }],
      order: [['dueDate', 'ASC']],
    });
    const ref = await refs();
    return rows.map((r) => {
      const inv = (r as RepaymentSchedule & { investment: Investment & { investor: Investor & { user: User } } }).investment;
      return { ...scheduleDTO(r), investmentId: inv.id, ref: ref(inv.id), investor: inv.investor?.user?.fullName ?? null, structure: inv.structure, tenureMonths: inv.tenureMonths };
    });
  },

  async markPaid(a: Actor, id: string, txnRef: string, paidAt?: Date) {
    return sequelize.transaction(async (t) => {
      const r = await RepaymentSchedule.findByPk(id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!r) throw new AppError(404, 'NOT_FOUND', 'Instalment not found');
      if (r.status === 'PAID') throw new AppError(409, 'ALREADY_PAID', 'This instalment is already marked paid.');
      await r.update({ status: 'PAID', paidAt: paidAt ?? new Date(), txnRef }, { transaction: t });
      const left = await RepaymentSchedule.count({ where: { investmentId: r.investmentId, status: { [Op.ne]: 'PAID' } }, transaction: t });
      if (left === 0) await Investment.update({ status: 'CLOSED' }, { where: { id: r.investmentId }, transaction: t });
      await audit(a, { action: 'repayment.paid', entity: 'repayment_schedule', entityId: id, diff: { txnRef } }, t);
      return scheduleDTO(r);
    });
  },
};
