'use strict';
/**
 * bookings.tier_pct: the duration discount used at booking time, so the long-rental and coupon lines can be shown
 * separately even after pricing_rules change. push_tokens: Expo push tokens for the Phase 3 apps.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'tier_pct', { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 });
    await queryInterface.createTable('push_tokens', {
      id:         { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      user_id:    { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token:      { type: Sequelize.STRING(200), allowNull: false, unique: true },
      platform:   { type: Sequelize.STRING(10), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('push_tokens', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('push_tokens');
    await queryInterface.removeColumn('bookings', 'tier_pct');
  },
};
