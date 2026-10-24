import type { Request, Response } from 'express';
import { sequelize } from './db';
import { getRedis } from './jobs/queue';

/** Readiness checks dependencies; /health remains a cheap process liveness check. */
export async function readiness(_req: Request, res: Response) {
  res.set('Cache-Control', 'no-store');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all([sequelize.authenticate(), getRedis().ping()]),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Readiness timeout')), 5000); }),
    ]);
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  } finally {
    clearTimeout(timer);
  }
}
