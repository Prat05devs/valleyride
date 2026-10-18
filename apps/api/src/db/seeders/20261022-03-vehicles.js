'use strict';
/** 30 vehicles: 15 Activa 125, 5 each of Hunter 350, Scram 440 and Himalayan 450, spread across the four locations. */
const FLEET = [
  { slug: 'activa-125', count: 15, series: 'SC' },
  { slug: 'hunter-350', count: 5, series: 'RE' },
  { slug: 'scram-440', count: 5, series: 'RE' },
  { slug: 'himalayan-450', count: 5, series: 'RE' },
];
const LOCATION_ORDER = ['Dehradun · ISBT', 'Dehradun · Railway Station', 'Mussoorie · Library Chowk', 'Rishikesh · Tapovan'];

module.exports = {
  async up(queryInterface) {
    const [models] = await queryInterface.sequelize.query('SELECT id, slug FROM vehicle_models');
    // Oldest row per name, so a stray duplicate location can never become a vehicle's home.
    const [locations] = await queryInterface.sequelize.query('SELECT DISTINCT ON (name) id, name FROM locations ORDER BY name, created_at');
    const modelId = Object.fromEntries(models.map((m) => [m.slug, m.id]));
    const locationId = Object.fromEntries(locations.map((l) => [l.name, l.id]));

    const rows = [];
    let n = 0;
    for (const f of FLEET) {
      for (let i = 0; i < f.count; i++, n++) {
        rows.push({
          vehicle_model_id: modelId[f.slug],
          registration_no: `UK07 ${f.series} ${4100 + n * 7}`,
          home_location_id: locationId[LOCATION_ORDER[n % 4]],
          status: 'ACTIVE',
          odometer_km: 800 + ((n * 617) % 9000),
          purchased_on: '2026-09-01',
        });
      }
    }
    // Idempotent: ON CONFLICT (registration_no) DO NOTHING.
    await queryInterface.bulkInsert('vehicles', rows, { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DELETE FROM vehicles WHERE registration_no LIKE 'UK07 %'`);
  },
};
