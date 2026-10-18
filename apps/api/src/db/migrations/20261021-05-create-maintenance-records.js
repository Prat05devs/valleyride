'use strict';
/** Services and repairs per vehicle. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_records', {
      id:           { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      vehicle_id:   { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' }, onDelete: 'CASCADE' },
      type:         { type: Sequelize.ENUM('SERVICE','REPAIR'), allowNull: false },
      odometer_km:  { type: Sequelize.INTEGER, allowNull: false },
      cost_paise:   { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      performed_on: { type: Sequelize.DATEONLY, allowNull: false },
      notes:        { type: Sequelize.TEXT },
      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('maintenance_records', ['vehicle_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('maintenance_records');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_maintenance_records_type";');
  },
};
