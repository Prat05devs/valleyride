'use strict';
/** One row per instalment of an investment. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('repayment_schedules', {
      id:              { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      investment_id:   { type: Sequelize.UUID, allowNull: false, references: { model: 'investments', key: 'id' }, onDelete: 'CASCADE' },
      installment_no:  { type: Sequelize.INTEGER, allowNull: false },
      due_date:        { type: Sequelize.DATEONLY, allowNull: false },
      principal_paise: { type: Sequelize.BIGINT, allowNull: false },
      interest_paise:  { type: Sequelize.BIGINT, allowNull: false },
      status:          { type: Sequelize.ENUM('DUE','PAID','LATE'), allowNull: false, defaultValue: 'DUE' },
      paid_at:         { type: Sequelize.DATE },
      txn_ref:         { type: Sequelize.STRING(64) },
      created_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('repayment_schedules', ['due_date', 'status']);
    await queryInterface.addConstraint('repayment_schedules', { fields: ['investment_id', 'installment_no'], type: 'unique', name: 'repayment_schedules_investment_installment_unique' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('repayment_schedules');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_repayment_schedules_status";');
  },
};
