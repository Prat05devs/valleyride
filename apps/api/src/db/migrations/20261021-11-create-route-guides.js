'use strict';
/** Ride discovery guides (Mussoorie, Rishikesh, Sahastradhara, Maldevta). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_guides', {
      id:                 { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      slug:               { type: Sequelize.STRING(80), allowNull: false, unique: true },
      title:              { type: Sequelize.STRING(160), allowNull: false },
      distance_km:        { type: Sequelize.INTEGER, allowNull: false },
      body_md:            { type: Sequelize.TEXT, allowNull: false },
      recommended_models: { type: Sequelize.ARRAY(Sequelize.UUID), allowNull: false, defaultValue: Sequelize.literal("'{}'::uuid[]") },
      created_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('route_guides');
  },
};
