'use strict';
/** route_guides.map_image: the route map shown on route cards and pages (apps/api/public/guides/maps). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('route_guides', 'map_image', { type: Sequelize.STRING(500), allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('route_guides', 'map_image');
  },
};
