'use strict';
/** Who changed fleet, money or KYC data, and how. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id:         { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      actor_id:   { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      action:     { type: Sequelize.STRING(80), allowNull: false },
      entity:     { type: Sequelize.STRING(60), allowNull: false },
      entity_id:  { type: Sequelize.STRING(64), allowNull: false },
      diff:       { type: Sequelize.JSONB },
      ip:         { type: Sequelize.INET },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('audit_logs', ['entity', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['actor_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
