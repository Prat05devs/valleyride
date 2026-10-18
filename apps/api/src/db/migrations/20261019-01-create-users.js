'use strict';
/** Customers, staff, admins and investors. Login is by phone OTP. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');

    await queryInterface.createTable('users', {
      id:                { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      role:              { type: Sequelize.ENUM('customer','staff','admin','investor'), allowNull: false, defaultValue: 'customer' },
      full_name:         { type: Sequelize.STRING(120) },
      phone:             { type: Sequelize.STRING(15), allowNull: false, unique: true },
      email:             { type: Sequelize.CITEXT },
      phone_verified_at: { type: Sequelize.DATE },
      status:            { type: Sequelize.ENUM('ACTIVE','BLOCKED'), allowNull: false, defaultValue: 'ACTIVE' },
      created_at:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
  },
};
