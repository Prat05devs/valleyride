import { UniqueConstraintError } from 'sequelize';
import type { RouteGuideInput } from '@valleyride/shared';
import { RouteGuide } from '../../db';
import { audit } from '../../utils/audit';
import { AppError } from '../../utils/AppError';
import { cached, invalidate } from '../../utils/cache';

type Actor = { id: string; ip: string | null };

/** Ride-discovery guides: public reads are cached; staff edit them in the admin console (the CMS). */
export const routeGuideService = {
  list() {
    return cached('content:routes', 600, async () => {
      const rows = await RouteGuide.findAll({ order: [['createdAt', 'ASC'], ['slug', 'ASC']] }); // editorial order, as seeded from the architecture doc
      return rows.map((r) => r.toDTO());
    });
  },

  async bySlug(slug: string) {
    const r = (await this.list()).find((g) => g.slug === slug);
    if (!r) throw new AppError(404, 'NOT_FOUND', 'Route guide not found');
    return r;
  },

  async save(a: Actor, input: RouteGuideInput, id?: string) {
    try {
      const row = id ? await RouteGuide.findByPk(id) : null;
      if (id && !row) throw new AppError(404, 'NOT_FOUND', 'Route guide not found');
      const saved = row ? await row.update(input) : await RouteGuide.create(input);
      await audit(a.id, row ? 'content.update' : 'content.create', 'route_guide', saved.id, { slug: input.slug, title: input.title }, a.ip);
      await invalidate('content:');
      return saved.toDTO();
    } catch (e) {
      if (e instanceof UniqueConstraintError) throw new AppError(409, 'DUPLICATE', 'Another guide already uses this slug.');
      throw e;
    }
  },

  async remove(a: Actor, id: string) {
    if (!(await RouteGuide.destroy({ where: { id } }))) throw new AppError(404, 'NOT_FOUND', 'Route guide not found');
    await audit(a.id, 'content.delete', 'route_guide', id, null, a.ip);
    await invalidate('content:');
  },
};
