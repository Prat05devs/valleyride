import express, { Router } from 'express';
import { MAX_UPLOAD_BYTES } from '@valleyride/shared';
import { AppError } from '../../utils/AppError';
import { localRead, localWrite, verifyLocalSignature } from './s3-presign';

/**
 * STORAGE_DRIVER=local: private files on the server's disk (a Docker volume in production), behind the same kind of
 * short-lived signed PUT and GET links S3 would give. Only links signed by this API work.
 */
export const filesLocalRouter = Router();

const check = (op: 'put' | 'get', q: Record<string, unknown>) => {
  const key = String(q.key ?? '');
  if (!verifyLocalSignature(op, key, Number(q.exp), String(q.sig ?? ''))) throw new AppError(403, 'FORBIDDEN', 'Link expired or invalid');
  return key;
};

filesLocalRouter.put('/files', express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES }), async (req, res) => {
  const key = check('put', req.query);
  await localWrite(key, req.body as Buffer);
  res.status(200).end();
});

filesLocalRouter.get('/files', async (req, res) => {
  const key = check('get', req.query);
  const body = await localRead(key).catch(() => { throw new AppError(404, 'NOT_FOUND', 'File not found'); });
  const ext = key.split('.').pop();
  // Shown on the website and in the app (another origin); private, so never kept by shared caches.
  res.set({ 'Cross-Origin-Resource-Policy': 'cross-origin', 'Cache-Control': 'private, max-age=300' });
  res.type(ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg').send(body);
});
