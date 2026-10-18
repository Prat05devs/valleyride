'use strict';
/** Rentable models with their day price, deposit and included km. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_models', {
      id:              { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      slug:            { type: Sequelize.STRING(60), allowNull: false, unique: true },
      name:            { type: Sequelize.STRING(120), allowNull: false },
      category:        { type: Sequelize.ENUM('SCOOTER','MOTORCYCLE','ADVENTURE'), allowNull: false },
      engine_cc:       { type: Sequelize.INTEGER, allowNull: false },
      price_day_paise: { type: Sequelize.BIGINT, allowNull: false },
      deposit_paise:   { type: Sequelize.BIGINT, allowNull: false },
      km_per_day:      { type: Sequelize.INTEGER, allowNull: false },
      extra_km_paise:  { type: Sequelize.BIGINT, allowNull: false },
      images:          { type: Sequelize.JSONB, allowNull: false, defaultValue: Sequelize.literal("'[]'::jsonb") },
      created_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vehicle_models');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vehicle_models_category";');
  },
};
