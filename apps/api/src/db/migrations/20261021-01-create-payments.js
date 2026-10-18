'use strict';
/** Razorpay orders, captures and refunds. Unique keys make webhooks and retries safe to repeat. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id:                  { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      booking_id:          { type: Sequelize.UUID, allowNull: false, references: { model: 'bookings', key: 'id' } },
      kind:                { type: Sequelize.ENUM('RENTAL','DEPOSIT','EXTRA','REFUND'), allowNull: false },
      provider_order_id:   { type: Sequelize.STRING(64) },
      provider_payment_id: { type: Sequelize.STRING(64), unique: true },
      amount_paise:        { type: Sequelize.BIGINT, allowNull: false },
      status:              { type: Sequelize.ENUM('CREATED','CAPTURED','FAILED','REFUNDED'), allowNull: false, defaultValue: 'CREATED' },
      idempotency_key:     { type: Sequelize.STRING(100), unique: true },
      raw:                 { type: Sequelize.JSONB },
      created_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('payments', ['booking_id']);
    await queryInterface.addIndex('payments', ['provider_order_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_kind";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
  },
};
