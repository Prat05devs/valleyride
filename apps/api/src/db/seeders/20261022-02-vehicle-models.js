'use strict';
/**
 * The four launch models. Prices are starting points to test (paise): Activa ₹649, Hunter ₹1,199,
 * Scram ₹1,799 and Himalayan ₹2,199 a day. Change them in the table, not in code.
 */
const MODELS = [
  { slug: 'activa-125',    name: 'Honda Activa 125',            category: 'SCOOTER',    engine_cc: 124, price_day_paise: 64900,  deposit_paise: 200000, km_per_day: 120, extra_km_paise: 400 },
  { slug: 'hunter-350',    name: 'Royal Enfield Hunter 350',    category: 'MOTORCYCLE', engine_cc: 349, price_day_paise: 119900, deposit_paise: 500000, km_per_day: 200, extra_km_paise: 600 },
  { slug: 'scram-440',     name: 'Royal Enfield Scram 440',     category: 'MOTORCYCLE', engine_cc: 443, price_day_paise: 179900, deposit_paise: 600000, km_per_day: 220, extra_km_paise: 700 },
  { slug: 'himalayan-450', name: 'Royal Enfield Himalayan 450', category: 'ADVENTURE',  engine_cc: 452, price_day_paise: 219900, deposit_paise: 800000, km_per_day: 250, extra_km_paise: 800 },
];

module.exports = {
  async up(queryInterface) {
    // Idempotent: ON CONFLICT (slug) DO NOTHING, which also keeps any price already changed in the table.
    await queryInterface.bulkInsert('vehicle_models', MODELS.map((m) => ({ ...m, images: JSON.stringify([]) })), { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('vehicle_models', { slug: MODELS.map((m) => m.slug) });
  },
};
