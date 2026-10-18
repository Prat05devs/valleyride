'use strict';
/**
 * Fills the model-page specs and the route-page stops, tips and photos from src/db/content.
 * Only empty rows are filled, so anything staff have since edited in the admin console is kept.
 */
const SPECS = require('../content/vehicle-specs');
const { GUIDES } = require('../content/route-guides');

module.exports = {
  async up(queryInterface) {
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements });
    for (const [slug, specs] of Object.entries(SPECS)) {
      await q('UPDATE vehicle_models SET specs = CAST(:specs AS jsonb) WHERE slug = :slug AND specs IS NULL', { slug, specs: JSON.stringify(specs) });
    }
    for (const [slug, g] of Object.entries(GUIDES)) {
      await q(
        `UPDATE route_guides SET
           ride_time = :rideTime, best_time = :bestTime, difficulty = :difficulty, bike_advice = :bikeAdvice,
           highlights = CAST(:highlights AS jsonb), stops = CAST(:stops AS jsonb), tips = CAST(:tips AS jsonb), cover = CAST(:cover AS jsonb),
           body_md = CASE WHEN body_md = :oldBody THEN :bodyMd ELSE body_md END
         WHERE slug = :slug AND stops = '[]'::jsonb`,
        {
          slug, rideTime: g.rideTime, bestTime: g.bestTime, difficulty: g.difficulty, bikeAdvice: g.bikeAdvice, oldBody: g.oldBody, bodyMd: g.bodyMd,
          highlights: JSON.stringify(g.highlights), stops: JSON.stringify(g.stops), tips: JSON.stringify(g.tips), cover: JSON.stringify(g.cover),
        },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('UPDATE vehicle_models SET specs = NULL');
    await queryInterface.sequelize.query(
      `UPDATE route_guides SET ride_time = NULL, best_time = NULL, difficulty = NULL, bike_advice = NULL, highlights = '[]', stops = '[]', tips = '[]', cover = NULL`,
    );
  },
};
