import { createHash } from 'node:crypto';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import express, { Router } from 'express';
import { MAX_MODEL_PHOTO_BYTES } from '@valleyride/shared';
import { VehicleModel } from '../../db';
import { AppError } from '../../utils/AppError';
import { audit, type Actor } from '../../utils/audit';
import { invalidate } from '../../utils/cache';

/**
 * Public model photos uploaded from the admin console. They live in the "uploads" volume (so the daily file backup
 * includes them) under public/models, named <slug>-<content hash>.<ext>, and are served at /media/models/<file>.
 * A new upload gets a new name, so the files can be cached for a year; vehicle_models.images holds the path.
 * Bundled cut-outs in the website and app are the fallback when a model has no uploaded photo.
 */
const MEDIA_DIR = path.resolve(__dirname, '../../../.uploads/public/models');
const URL_PREFIX = '/media/models/';

/** The image type from the file's first bytes; the browser-sent Content-Type is not trusted. */
function sniff(b: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Deletes this model's earlier uploads (never another model's: names start with the slug and a dash plus hash). */
async function removeOld(slug: string, keep?: string) {
  const files = await readdir(MEDIA_DIR).catch(() => [] as string[]);
  const mine = new RegExp(`^${slug.replace(/[^a-z0-9-]/g, '')}-[0-9a-f]{12}\\.(png|jpg|webp)$`);
  await Promise.all(files.filter((f) => mine.test(f) && f !== keep).map((f) => unlink(path.join(MEDIA_DIR, f)).catch(() => undefined)));
}

export const modelPhotoService = {
  async set(a: Actor, id: string, body: unknown) {
    if (!Buffer.isBuffer(body) || body.length === 0) throw new AppError(422, 'NO_FILE', 'Choose a PNG, JPEG or WebP photo.');
    if (body.length > MAX_MODEL_PHOTO_BYTES) throw new AppError(413, 'TOO_LARGE', 'The photo must be under 3 MB.');
    const ext = sniff(body);
    if (!ext) throw new AppError(415, 'UNSUPPORTED', 'Only PNG, JPEG or WebP photos can be used.');
    const m = await VehicleModel.findByPk(id);
    if (!m) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');

    const file = `${m.slug}-${createHash('sha256').update(body).digest('hex').slice(0, 12)}.${ext}`;
    await mkdir(MEDIA_DIR, { recursive: true });
    await writeFile(path.join(MEDIA_DIR, file), body);
    const before = m.images;
    await m.update({ images: [`${URL_PREFIX}${file}`] });
    await removeOld(m.slug, file);
    await audit(a, { action: 'vehicle_model.photo', entity: 'vehicle_model', entityId: id, diff: { before, after: m.images } });
    await invalidate('fleet:');
    return m.toDTO();
  },

  /** Back to the bundled photo. */
  async clear(a: Actor, id: string) {
    const m = await VehicleModel.findByPk(id);
    if (!m) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');
    const before = m.images;
    await m.update({ images: [] });
    await removeOld(m.slug);
    await audit(a, { action: 'vehicle_model.photo', entity: 'vehicle_model', entityId: id, diff: { before, after: [] } });
    await invalidate('fleet:');
    return m.toDTO();
  },
};

/** Raw image body for PUT /admin/vehicle-models/:id/photo; anything over the limit is refused before it is buffered. */
export const rawPhotoBody = express.raw({ type: () => true, limit: MAX_MODEL_PHOTO_BYTES });

/** GET /media/models/<file>: public, cross-origin (website and app), cached for a year because names change on upload. */
export const mediaRouter = Router();
mediaRouter.use('/media/models', express.static(MEDIA_DIR, {
  index: false, dotfiles: 'deny', fallthrough: true, immutable: true, maxAge: '365d',
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
}));
