'use strict';
/** Partner and referral coupons. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupons', {
      code:        { type: Sequelize.STRING(32), primaryKey: true },
      percent_off: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      max_uses:    { type: Sequelize.INTEGER },
      used:        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      valid_till:  { type: Sequelize.DATE },
      partner:     { type: Sequelize.STRING(80) },
      created_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('coupons');
  },
};
