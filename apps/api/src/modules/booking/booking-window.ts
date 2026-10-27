import { deskOpenAt } from '@valleyride/shared';
import { Location } from '../../db';
import { AppError } from '../../utils/AppError';

export async function assertDeskWindow(start: Date, end: Date, pickup: string, returnTo = pickup) {
  const points = await Location.findAll({ where: { id: [...new Set([pickup, returnTo])], isActive: true } });
  for (const [id, at, label] of [[pickup, start, 'Pickup'], [returnTo, end, 'Return']] as const) {
    const point = points.find((p) => p.id === id);
    if (!point) throw new AppError(422, 'LOCATION_UNAVAILABLE', `${label} point is unavailable. Choose another point.`);
    if (!deskOpenAt(point.openHours, at)) throw new AppError(422, 'DESK_CLOSED', `${label} is outside ${point.name}'s opening hours. Choose another time (IST).`);
  }
}
