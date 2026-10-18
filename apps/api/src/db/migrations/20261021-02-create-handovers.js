'use strict';
/** Digital pickup and return records. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('handovers', {
      id:                 { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      booking_id:         { type: Sequelize.UUID, allowNull: false, references: { model: 'bookings', key: 'id' } },
      type:               { type: Sequelize.ENUM('PICKUP','RETURN'), allowNull: false },
      odometer_km:        { type: Sequelize.INTEGER, allowNull: false },
      fuel_level:         { type: Sequelize.SMALLINT },
      photos:             { type: Sequelize.JSONB, allowNull: false, defaultValue: Sequelize.literal("'[]'::jsonb") },
      damage_notes:       { type: Sequelize.TEXT },
      agreement_file_key: { type: Sequelize.TEXT },
      staff_id:           { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      created_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addConstraint('handovers', { fields: ['booking_id', 'type'], type: 'unique', name: 'handovers_booking_type_unique' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('handovers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_handovers_type";');
  },
};
