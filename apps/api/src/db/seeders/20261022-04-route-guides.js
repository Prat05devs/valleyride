'use strict';
/**
 * The four launch guides from the architecture document's ride-discovery section.
 * Distances, times and recommended bikes are copied from it; longer write-ups belong in the CMS.
 */
const GUIDES = [
  {
    slug: 'dehradun-mussoorie', title: 'Dehradun → Mussoorie', distance_km: 35, models: ['hunter-350', 'scram-440'],
    body_md: 'About 1.5 hours. A winding climb into the hills, with a detour to Kempty Falls.',
  },
  {
    slug: 'dehradun-rishikesh', title: 'Dehradun → Rishikesh', distance_km: 45, models: ['activa-125', 'hunter-350'],
    body_md: 'About 1.25 hours through the Rajaji forest road.',
  },
  {
    slug: 'sahastradhara-loop', title: 'Sahastradhara loop', distance_km: 16, models: ['activa-125'],
    body_md: 'About 40 minutes. An easy ride out to the sulphur springs.',
  },
  {
    slug: 'maldevta', title: 'Maldevta & beyond', distance_km: 20, models: ['scram-440', 'himalayan-450'],
    body_md: 'A river valley ride with gravel sections.',
  },
];

module.exports = {
  async up(queryInterface) {
    // Idempotent: ON CONFLICT (slug) DO NOTHING, so edits made in the CMS are kept.
    for (const g of GUIDES) {
      await queryInterface.sequelize.query(
        `INSERT INTO route_guides (slug, title, distance_km, body_md, recommended_models)
         VALUES (:slug, :title, :distance_km, :body_md,
                 ARRAY(SELECT id FROM vehicle_models WHERE slug IN (:models) ORDER BY price_day_paise))
         ON CONFLICT (slug) DO NOTHING`,
        { replacements: g },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('route_guides', { slug: GUIDES.map((g) => g.slug) });
  },
};
