'use strict';
/** RC, insurance, permit and PUC, with expiry dates for renewal alerts. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle_documents', {
      id:         { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      vehicle_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vehicles', key: 'id' }, onDelete: 'CASCADE' },
      type:       { type: Sequelize.ENUM('RC','INSURANCE','PERMIT','PUC'), allowNull: false },
      number:     { type: Sequelize.STRING(64), allowNull: false },
      expires_on: { type: Sequelize.DATEONLY },
      file_key:   { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('vehicle_documents', ['vehicle_id']);
    await queryInterface.addIndex('vehicle_documents', ['expires_on']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vehicle_documents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_vehicle_documents_type";');
  },
};
