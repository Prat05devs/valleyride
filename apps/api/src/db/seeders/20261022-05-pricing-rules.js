'use strict';
/**
 * The launch duration tiers (10% from 3 days, 20% from 7, 35% from 28) as editable pricing_rules rows.
 * Only inserted when no all-model tier rows exist, so edits made in the admin console are kept.
 */
const TIERS = [{ min_days: 3, discount_pct: 10 }, { min_days: 7, discount_pct: 20 }, { min_days: 28, discount_pct: 35 }];

module.exports = {
  async up(queryInterface) {
    const [[{ n }]] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS n FROM pricing_rules WHERE vehicle_model_id IS NULL AND min_days IS NOT NULL');
    if (n === 0) await queryInterface.bulkInsert('pricing_rules', TIERS.map((t) => ({ ...t, vehicle_model_id: null, multiplier: 1 })));
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('pricing_rules', { vehicle_model_id: null, season_from: null });
  },
};
