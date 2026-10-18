'use strict';
/** Investor profile, one per user. PAN is stored masked. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('investors', {
      id:               { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      user_id:          { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
      pan_masked:       { type: Sequelize.STRING(12) },
      bank_account_ref: { type: Sequelize.STRING(64) },
      kyc_status:       { type: Sequelize.ENUM('PENDING','VERIFIED','REJECTED'), allowNull: false, defaultValue: 'PENDING' },
      created_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('investors');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_investors_kyc_status";');
  },
};
