'use strict';
/** Pickup and return points. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      id:         { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name:       { type: Sequelize.STRING(120), allowNull: false },
      city:       { type: Sequelize.STRING(60), allowNull: false },
      address:    { type: Sequelize.TEXT, allowNull: false },
      lat:        { type: Sequelize.DECIMAL(9, 6) },
      lng:        { type: Sequelize.DECIMAL(9, 6) },
      open_hours: { type: Sequelize.JSONB },
      is_active:  { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('locations');
  },
};
