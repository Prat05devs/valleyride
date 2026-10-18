'use strict';
/** Duration discounts and seasonal multipliers, editable without a deploy. A null model applies to every model. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pricing_rules', {
      id:               { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      vehicle_model_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'vehicle_models', key: 'id' }, onDelete: 'CASCADE' },
      min_days:         { type: Sequelize.INTEGER },
      discount_pct:     { type: Sequelize.DECIMAL(5, 2) },
      season_from:      { type: Sequelize.DATEONLY },
      season_to:        { type: Sequelize.DATEONLY },
      multiplier:       { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 1 },
      created_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('pricing_rules', ['vehicle_model_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pricing_rules');
  },
};
