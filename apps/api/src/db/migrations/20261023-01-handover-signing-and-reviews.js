'use strict';
/**
 * Pickup is finished by the customer in the app (sign, confirm condition, emergency contact), so handovers keep
 * the signing time, the emergency contact and, at return, the inspection checklist and computed charges.
 * Reviews are one per booking.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('handovers', 'signed_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('handovers', 'emergency_contact', { type: Sequelize.JSONB });
    await queryInterface.addColumn('handovers', 'checklist', { type: Sequelize.JSONB });
    await queryInterface.addColumn('handovers', 'charges', { type: Sequelize.JSONB });
    await queryInterface.addConstraint('handovers', { fields: ['booking_id', 'type'], type: 'unique', name: 'handovers_booking_type_uq' });

    await queryInterface.createTable('reviews', {
      id:         { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      booking_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'bookings', key: 'id' }, onDelete: 'CASCADE' },
      user_id:    { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      rating:     { type: Sequelize.SMALLINT, allowNull: false },
      tags:       { type: Sequelize.ARRAY(Sequelize.STRING(40)), allowNull: false, defaultValue: Sequelize.literal("'{}'::varchar(40)[]") },
      comment:    { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.sequelize.query('ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reviews');
    await queryInterface.removeConstraint('handovers', 'handovers_booking_type_uq');
    for (const c of ['charges', 'checklist', 'emergency_contact', 'signed_at']) await queryInterface.removeColumn('handovers', c);
  },
};
