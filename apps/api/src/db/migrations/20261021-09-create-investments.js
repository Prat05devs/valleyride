'use strict';
/** Signed investments. Phase 4, only after legal and CA sign-off. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('investments', {
      id:                 { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      investor_id:        { type: Sequelize.UUID, allowNull: false, references: { model: 'investors', key: 'id' } },
      principal_paise:    { type: Sequelize.BIGINT, allowNull: false },
      annual_rate_pct:    { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      tenure_months:      { type: Sequelize.INTEGER, allowNull: false },
      structure:          { type: Sequelize.ENUM('amortizing','interest_only'), allowNull: false },
      start_date:         { type: Sequelize.DATEONLY, allowNull: false },
      agreement_file_key: { type: Sequelize.TEXT },
      status:             { type: Sequelize.ENUM('DRAFT','ACTIVE','CLOSED'), allowNull: false, defaultValue: 'DRAFT' },
      created_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('investments', ['investor_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('investments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_investments_structure";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_investments_status";');
  },
};
