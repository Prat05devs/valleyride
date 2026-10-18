import type { VehicleSpecs } from '@valleyride/shared';
import { VehicleModel } from '../../db';
import { audit } from '../../utils/audit';
import { AppError } from '../../utils/AppError';
import { invalidate } from '../../utils/cache';

type Actor = { id: string; ip: string | null };

/** Model-page content (engine, chassis, mileage, terrain notes), edited by staff in the admin console. */
export const vehicleSpecsService = {
  async save(a: Actor, id: string, specs: VehicleSpecs) {
    const m = await VehicleModel.findByPk(id);
    if (!m) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');
    await m.update({ specs });
    await audit(a.id, 'content.specs', 'vehicle_model', id, { slug: m.slug, modelYear: specs.modelYear }, a.ip);
    await invalidate('fleet:');
    return m.toDTO();
  },
};
