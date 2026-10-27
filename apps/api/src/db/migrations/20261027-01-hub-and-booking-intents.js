'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('vehicles', 'current_location_id', {
        type: Sequelize.UUID, allowNull: true, references: { model: 'locations', key: 'id' },
      }, { transaction });
      await queryInterface.sequelize.query(`UPDATE vehicles v SET current_location_id = COALESCE(
        (SELECT b.return_location_id FROM handovers h JOIN bookings b ON b.id = h.booking_id
         WHERE b.vehicle_id = v.id AND h.type = 'RETURN' ORDER BY h.created_at DESC LIMIT 1), v.home_location_id)`, { transaction });
      await queryInterface.addIndex('vehicles', ['current_location_id'], { transaction });
      await queryInterface.addColumn('bookings', 'client_request_key', { type: Sequelize.STRING(100), allowNull: true }, { transaction });
      await queryInterface.addColumn('bookings', 'client_request_hash', { type: Sequelize.STRING(64), allowNull: true }, { transaction });
      await queryInterface.addIndex('bookings', ['user_id', 'client_request_key'], { name: 'bookings_user_client_request_unique', unique: true, transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('bookings', 'bookings_user_client_request_unique', { transaction });
      await queryInterface.removeColumn('bookings', 'client_request_hash', { transaction });
      await queryInterface.removeColumn('bookings', 'client_request_key', { transaction });
      await queryInterface.removeColumn('vehicles', 'current_location_id', { transaction });
    });
  },
};
