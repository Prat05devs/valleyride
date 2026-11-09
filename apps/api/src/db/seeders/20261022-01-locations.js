'use strict';
/** Valley Ride runs from a single pickup and return point. Pin: https://maps.app.goo.gl/U7GF6py8rFRpwhqQ8 */
const LOCATIONS = [
  { name: 'Dehradun · Dorm Hub', city: 'Dehradun', address: 'Dorm Hub, 4th Floor, Sahastradhara Road, near Doon IT Park, Aman Vihar, Dehradun 248001', lat: 30.355199, lng: 78.082532 },
];

/** The launch points used before November 2026. Kept inactive (not deleted) so old bookings still resolve. */
const RETIRED = ['Dehradun · ISBT', 'Dehradun · Railway Station', 'Mussoorie · Library Chowk', 'Rishikesh · Tapovan'];

module.exports = {
  // Seeders re-run on every db:seed:all (only migrations are tracked), so this must be idempotent.
  // locations has no unique key to conflict on, so skip names that already exist.
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query('SELECT name FROM locations');
    const have = new Set(existing.map((r) => r.name));
    const rows = LOCATIONS.filter((l) => !have.has(l.name)).map((l) => ({
      ...l,
      open_hours: JSON.stringify({ 'mon-sun': '08:00-20:00' }),
      is_active: true,
    }));
    if (rows.length) await queryInterface.bulkInsert('locations', rows);
    await queryInterface.bulkUpdate('locations', { is_active: false }, { name: RETIRED });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', { name: LOCATIONS.map((l) => l.name) });
    await queryInterface.bulkUpdate('locations', { is_active: true }, { name: RETIRED });
  },
};
