'use strict';
/** Login by phone number and password (scrypt hash, see src/modules/auth/password.ts) instead of SMS codes. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'password_hash', { type: Sequelize.STRING(200) });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'password_hash');
  },
};
