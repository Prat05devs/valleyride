'use strict';
/**
 * The client's fleet as of 10 November 2026 (30 units):
 *   Activa 125 ×11, Hunter 350 ×5, Himalayan 450 ×3, Triumph Scrambler 400 X ×3, XPulse 210 ×2, Scram 440 ×2,
 *   Suzuki V-Strom SX 250 ×2, KTM 390 Adventure X ×2.
 * Adds the four new models (prices are starting points; change them in Admin → Pricing) with their model-page specs,
 * then gives every model that has no units yet its units at the Dorm Hub, with placeholder number plates
 * "XX00 <code> <n>" that staff replace in Admin → Fleet. Models that already have units are left alone, so this can
 * run again without duplicating anything or undoing the console's edits.
 */
const SPECS = require('../content/vehicle-specs');

const NEW_MODELS = [
  { slug: 'xpulse-210',      name: 'Hero XPulse 210',          category: 'ADVENTURE',  engine_cc: 210, price_day_paise: 149900, deposit_paise: 500000, km_per_day: 220, extra_km_paise: 600 },
  { slug: 'v-strom-sx-250',  name: 'Suzuki V-Strom SX 250',    category: 'ADVENTURE',  engine_cc: 249, price_day_paise: 159900, deposit_paise: 500000, km_per_day: 220, extra_km_paise: 600 },
  { slug: 'scrambler-400-x', name: 'Triumph Scrambler 400 X',  category: 'MOTORCYCLE', engine_cc: 349, price_day_paise: 199900, deposit_paise: 700000, km_per_day: 250, extra_km_paise: 700 },
  { slug: '390-adventure-x', name: 'KTM 390 Adventure X',      category: 'ADVENTURE',  engine_cc: 399, price_day_paise: 219900, deposit_paise: 800000, km_per_day: 250, extra_km_paise: 800 },
];

const FLEET = [
  { slug: 'activa-125', count: 11, code: 'ACT' },
  { slug: 'hunter-350', count: 5, code: 'HUN' },
  { slug: 'himalayan-450', count: 3, code: 'HIM' },
  { slug: 'scrambler-400-x', count: 3, code: 'TSX' },
  { slug: 'xpulse-210', count: 2, code: 'XPL' },
  { slug: 'scram-440', count: 2, code: 'SCR' },
  { slug: 'v-strom-sx-250', count: 2, code: 'VSX' },
  { slug: '390-adventure-x', count: 2, code: 'KTM' },
];
const HOME = 'Dehradun · Dorm Hub';

module.exports = {
  async up(queryInterface) {
    // The integration suite is written against the four launch models and its own units.
    if (process.env.NODE_ENV === 'test') return;
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements });
    await queryInterface.bulkInsert('vehicle_models', NEW_MODELS.map((m) => ({ ...m, images: JSON.stringify([]) })), { ignoreDuplicates: true });
    for (const { slug } of NEW_MODELS) {
      await q('UPDATE vehicle_models SET specs = CAST(:specs AS jsonb) WHERE slug = :slug AND specs IS NULL', { slug, specs: JSON.stringify(SPECS[slug]) });
    }

    const [[home]] = await q('SELECT id FROM locations WHERE name = :name AND is_active ORDER BY created_at LIMIT 1', { name: HOME });
    if (!home) throw new Error(`Pickup point "${HOME}" not found: run 20261022-01-locations first`);
    const [models] = await q(`SELECT m.id, m.slug, (SELECT COUNT(*)::int FROM vehicles v WHERE v.vehicle_model_id = m.id) AS units FROM vehicle_models m`);
    const bySlug = Object.fromEntries(models.map((m) => [m.slug, m]));

    const rows = [];
    for (const f of FLEET) {
      const m = bySlug[f.slug];
      if (!m) throw new Error(`Model ${f.slug} not found: run 20261022-02-vehicle-models first`);
      if (m.units > 0) continue;
      for (let i = 1; i <= f.count; i++) {
        rows.push({ vehicle_model_id: m.id, registration_no: `XX00 ${f.code} ${i}`, home_location_id: home.id, current_location_id: home.id, status: 'ACTIVE', odometer_km: 0 });
      }
    }
    if (rows.length) await queryInterface.bulkInsert('vehicles', rows, { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DELETE FROM vehicles WHERE registration_no LIKE 'XX00 %'
      AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.vehicle_id = vehicles.id)`);
  },
};
