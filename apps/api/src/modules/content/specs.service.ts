import type { VehicleSpecs } from '@valleyride/shared';
import { VehicleModel } from '../../db';
import { audit, type Actor } from '../../utils/audit';
import { AppError } from '../../utils/AppError';
import { invalidate } from '../../utils/cache';

/** Model-page content (engine, chassis, mileage, terrain notes), edited by staff in the admin console. */
export const vehicleSpecsService = {
  async save(a: Actor, id: string, specs: VehicleSpecs) {
    const m = await VehicleModel.findByPk(id);
    if (!m) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');
    await m.update({ specs });
    await audit(a, { action: 'content.specs', entity: 'vehicle_model', entityId: id, diff: { slug: m.slug, modelYear: specs.modelYear } });
    await invalidate('fleet:');
    return m.toDTO();
  },
};
