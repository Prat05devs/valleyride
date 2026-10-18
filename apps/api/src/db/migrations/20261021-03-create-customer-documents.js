'use strict';
/** Driving licence and ID uploads. Only masked numbers are stored (last 4 digits of Aadhaar). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_documents', {
      id:            { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      user_id:       { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type:          { type: Sequelize.ENUM('DL','AADHAAR','PASSPORT'), allowNull: false },
      number_masked: { type: Sequelize.STRING(32), allowNull: false },
      file_key:      { type: Sequelize.TEXT, allowNull: false },
      status:        { type: Sequelize.ENUM('PENDING','VERIFIED','REJECTED'), allowNull: false, defaultValue: 'PENDING' },
      verified_by:   { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      verified_at:   { type: Sequelize.DATE },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('customer_documents', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('customer_documents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customer_documents_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customer_documents_status";');
  },
};
