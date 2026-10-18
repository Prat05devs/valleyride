'use strict';
/**
 * Demo accounts (development and staging only; skipped when NODE_ENV=production). Log in with the phone number and
 * code 123456 (see src/modules/auth/demo.ts). The investor gets one sample 18-month investment so the portal has data.
 */
const USERS = [
  { phone: '+919000000001', full_name: 'Demo Rider', role: 'customer' },
  { phone: '+919000000002', full_name: 'Demo Staff', role: 'staff' },
  { phone: '+919000000003', full_name: 'Demo Admin', role: 'admin' },
  { phone: '+919000000004', full_name: 'Demo Investor', role: 'investor' },
];

module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === 'production') return;
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements });
    for (const u of USERS) {
      await q(`INSERT INTO users (phone, full_name, role, phone_verified_at) VALUES (:phone, :full_name, :role, now())
               ON CONFLICT (phone) DO UPDATE SET role = EXCLUDED.role`, u);
    }
    const [[inv]] = await q(`INSERT INTO investors (user_id, pan_masked, kyc_status)
      SELECT id, '••••••234F', 'VERIFIED' FROM users WHERE phone = '+919000000004'
      ON CONFLICT DO NOTHING RETURNING id`);
    if (!inv) return; // already seeded
    // ₹2,50,000 at 21% for 18 months, equal instalments, started three months ago: the architecture doc's example.
    const [[investment]] = await q(`INSERT INTO investments (investor_id, principal_paise, annual_rate_pct, tenure_months, structure, start_date, status)
      VALUES (:id, 25000000, 21, 18, 'amortizing', (date_trunc('month', now()) - interval '3 months')::date, 'ACTIVE') RETURNING id, start_date`, { id: inv.id });
    const r = 21 / 1200, n = 18, P = 25000000;
    const emi = (P * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    let bal = P;
    for (let i = 1; i <= n; i++) {
      const interest = Math.round(bal * r);
      let principal = Math.round(emi) - interest;
      if (i === n) principal = bal;
      const paid = i <= 2;
      await q(`INSERT INTO repayment_schedules (investment_id, installment_no, due_date, principal_paise, interest_paise, status, paid_at, txn_ref)
        VALUES (:inv, :i, (:start::date + make_interval(months => :i)), :principal, :interest, :status, :paidAt, :ref)`,
      { inv: investment.id, i, start: investment.start_date, principal, interest, status: paid ? 'PAID' : 'DUE', paidAt: paid ? new Date() : null, ref: paid ? `UTRDEMO${i}` : null });
      bal -= principal;
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DELETE FROM users WHERE phone IN (:phones)`, { replacements: { phones: USERS.map((u) => u.phone) } });
  },
};
