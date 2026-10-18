'use strict';
/** Creates bookings + the anti-double-booking exclusion constraint. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');

    await queryInterface.createTable('bookings', {
      id:                 { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      code:               { type: Sequelize.STRING(12), allowNull: false, unique: true },
      user_id:            { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      vehicle_id:         { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' } },
      vehicle_model_id:   { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicle_models', key: 'id' } },
      pickup_location_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'locations', key: 'id' } },
      return_location_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'locations', key: 'id' } },
      start_at:           { type: Sequelize.DATE, allowNull: false },   // timestamptz
      end_at:             { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM('PENDING_PAYMENT','CONFIRMED','ONGOING','COMPLETED','DEPOSIT_SETTLED','CANCELLED','EXPIRED'),
        allowNull: false, defaultValue: 'PENDING_PAYMENT',
      },
      hold_expires_at:    { type: Sequelize.DATE },
      billable_days:      { type: Sequelize.INTEGER, allowNull: false },
      km_included:        { type: Sequelize.INTEGER, allowNull: false },
      rental_paise:       { type: Sequelize.BIGINT, allowNull: false },
      discount_paise:     { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      fees_paise:         { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      tax_paise:          { type: Sequelize.BIGINT, allowNull: false },
      deposit_paise:      { type: Sequelize.BIGINT, allowNull: false },
      total_paise:        { type: Sequelize.BIGINT, allowNull: false },
      coupon_code:        { type: Sequelize.STRING(32) },
      created_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings
        ADD CONSTRAINT bookings_period_valid CHECK (end_at > start_at),
        ADD CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
          vehicle_id WITH =,
          tstzrange(start_at, end_at, '[)') WITH &&
        ) WHERE (status IN ('PENDING_PAYMENT','CONFIRMED','ONGOING'));
    `);
    await queryInterface.addIndex('bookings', ['status', 'hold_expires_at']);
    await queryInterface.addIndex('bookings', ['user_id', 'start_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bookings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_status";');
  },
};
