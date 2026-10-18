import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { id: string }
  }
}

/**
 * Tags every request with an id (taken from X-Request-Id when the proxy sets one) and adds
 * `meta.requestId` to every JSON body, so `{ data }` and `{ error }` responses share one envelope.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get('x-request-id');
  req.id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const json = res.json.bind(res);
  res.json = (body?: any) => {
    if (body && typeof body === 'object' && !Array.isArray(body) && ('data' in body || 'error' in body)) {
      body = { ...body, meta: { ...(body.meta ?? {}), requestId: req.id } };
    }
    return json(body);
  };
  next();
};
