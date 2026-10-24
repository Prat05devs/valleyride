'use strict';
/**
 * 20261023-01 added handovers_booking_type_uq, a second copy of 20261021-02's handovers_booking_type_unique.
 * Two identical unique indexes double the write cost for no gain, so the later one goes.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE handovers DROP CONSTRAINT IF EXISTS handovers_booking_type_uq');
  },

  async down(queryInterface) {
    await queryInterface.addConstraint('handovers', { fields: ['booking_id', 'type'], type: 'unique', name: 'handovers_booking_type_uq' });
  },
};
