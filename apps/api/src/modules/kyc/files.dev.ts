import express, { Router } from 'express';
import { MAX_UPLOAD_BYTES } from '@valleyride/shared';
import { AppError } from '../../utils/AppError';
import { localRead, localWrite, verifyLocalSignature } from './s3-presign';

/** STORAGE_DRIVER=local only: stands in for the S3 pre-signed PUT and GET URLs. */
export const filesDevRouter = Router();

const check = (op: 'put' | 'get', q: Record<string, unknown>) => {
  const key = String(q.key ?? '');
  if (!verifyLocalSignature(op, key, Number(q.exp), String(q.sig ?? ''))) throw new AppError(403, 'FORBIDDEN', 'Link expired or invalid');
  return key;
};

filesDevRouter.put('/dev/files', express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES }), async (req, res) => {
  const key = check('put', req.query);
  await localWrite(key, req.body as Buffer);
  res.status(200).end();
});

filesDevRouter.get('/dev/files', async (req, res) => {
  const key = check('get', req.query);
  const body = await localRead(key).catch(() => { throw new AppError(404, 'NOT_FOUND', 'File not found'); });
  const ext = key.split('.').pop();
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.type(ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg').send(body);
});
