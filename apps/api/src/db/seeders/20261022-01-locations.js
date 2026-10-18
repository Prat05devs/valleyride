'use strict';
/** The four pickup and return points used at launch. Coordinates are filled in from Google Maps before launch. */
const LOCATIONS = [
  { name: 'Dehradun · ISBT',             city: 'Dehradun',  address: 'ISBT, Haridwar Road, Dehradun 248001' },
  { name: 'Dehradun · Railway Station',  city: 'Dehradun',  address: 'Railway Station Road, Dehradun 248001' },
  { name: 'Mussoorie · Library Chowk',   city: 'Mussoorie', address: 'Library Chowk, Mall Road, Mussoorie 248179' },
  { name: 'Rishikesh · Tapovan',         city: 'Rishikesh', address: 'Tapovan, Rishikesh 249192' },
];

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
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', { name: LOCATIONS.map((l) => l.name) });
  },
};
