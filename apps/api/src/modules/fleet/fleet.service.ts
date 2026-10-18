import { QueryTypes } from 'sequelize';
import { Location, sequelize, VehicleModel } from '../../db';

/** Units in service (not retired) per model, shown as "In the fleet". */
async function unitCounts() {
  const rows = await sequelize.query<{ id: string; n: number }>(
    `SELECT vehicle_model_id AS id, COUNT(*)::int AS n FROM vehicles WHERE status <> 'RETIRED' GROUP BY vehicle_model_id`, { type: QueryTypes.SELECT });
  return new Map(rows.map((r) => [r.id, r.n]));
}
import { AppError } from '../../utils/AppError';
import { cached } from '../../utils/cache';

export const fleetService = {
  locations() {
    return cached('fleet:locations', 600, async () => {
      const rows = await Location.findAll({ where: { isActive: true }, order: [['city', 'ASC'], ['name', 'ASC']] });
      return rows.map((l) => l.toDTO());
    });
  },

  models() {
    return cached('fleet:models', 300, async () => {
      const [rows, units] = await Promise.all([VehicleModel.findAll({ order: [['priceDayPaise', 'ASC']] }), unitCounts()]);
      return rows.map((m) => ({ ...m.toDTO(), units: units.get(m.id) ?? 0 }));
    });
  },

  async modelBySlug(slug: string) {
    const m = await VehicleModel.findOne({ where: { slug } });
    if (!m) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');
    return { ...m.toDTO(), units: (await unitCounts()).get(m.id) ?? 0 };
  },
};
