'use strict';
/** One row per physical vehicle. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicles', {
      id:               { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      vehicle_model_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicle_models', key: 'id' } },
      registration_no:  { type: Sequelize.STRING(20), allowNull: false, unique: true },
      home_location_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'locations', key: 'id' } },
      status:           { type: Sequelize.ENUM('ACTIVE','MAINT','RETIRED'), allowNull: false, defaultValue: 'ACTIVE' },
      odometer_km:      { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      purchased_on:     { type: Sequelize.DATEONLY },
      created_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('vehicles', ['vehicle_model_id', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vehicles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vehicles_status";');
  },
};
