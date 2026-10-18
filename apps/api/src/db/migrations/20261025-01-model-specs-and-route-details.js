'use strict';
/**
 * Model-page specs (vehicle_models.specs) and route-page content (route_guides: ride time, best time, difficulty,
 * bike advice, highlights, stops, tips, cover photo). Shapes are validated by packages/shared/src/schemas/guide.ts.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('vehicle_models', 'specs', { type: Sequelize.JSONB, allowNull: true });
    const add = (name, def) => queryInterface.addColumn('route_guides', name, def);
    await add('ride_time', { type: Sequelize.STRING(60), allowNull: true });
    await add('best_time', { type: Sequelize.STRING(200), allowNull: true });
    await add('difficulty', { type: Sequelize.STRING(20), allowNull: true });
    await add('bike_advice', { type: Sequelize.TEXT, allowNull: true });
    await add('highlights', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] });
    await add('stops', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] });
    await add('tips', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] });
    await add('cover', { type: Sequelize.JSONB, allowNull: true });
  },

  async down(queryInterface) {
    for (const c of ['cover', 'tips', 'stops', 'highlights', 'bike_advice', 'difficulty', 'best_time', 'ride_time']) await queryInterface.removeColumn('route_guides', c);
    await queryInterface.removeColumn('vehicle_models', 'specs');
  },
};
