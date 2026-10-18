'use strict';
/**
 * Route maps drawn for the four launch guides: shaded relief from public-domain SRTM elevation, with the road traced
 * from OpenStreetMap. Fills only guides without a map, so a map changed in the CMS is kept.
 */
const SLUGS = ['dehradun-mussoorie', 'dehradun-rishikesh', 'sahastradhara-loop', 'maldevta'];

module.exports = {
  async up(queryInterface) {
    for (const slug of SLUGS) {
      await queryInterface.sequelize.query('UPDATE route_guides SET map_image = :url WHERE slug = :slug AND map_image IS NULL', { replacements: { slug, url: `/static/guides/maps/${slug}.jpg` } });
    }
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('UPDATE route_guides SET map_image = NULL WHERE slug IN (:slugs)', { replacements: { slugs: SLUGS } });
  },
};
