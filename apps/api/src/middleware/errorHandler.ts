import type { ErrorRequestHandler, RequestHandler } from 'express';
import { UniqueConstraintError, DatabaseError } from 'sequelize';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { captureError } from '../utils/sentry';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  // name check too: schemas from @valleyride/shared can come from a second zod copy (CJS vs ESM build under Vitest)
  if (err instanceof ZodError || err?.name === 'ZodError') return res.status(422).json({ error: { code: 'VALIDATION', message: 'Invalid input', details: err.flatten() } });
  // 23P01 = exclusion_violation, which here means a booking overlap that slipped past the availability check
  if (err instanceof DatabaseError && (err.parent as any)?.code === '23P01')
    return res.status(409).json({ error: { code: 'NO_AVAILABILITY', message: 'Vehicle was just booked. Please try again.' } });
  if (err instanceof UniqueConstraintError) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Duplicate request' } });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Request body is not valid JSON' } });
  logger.error({ err, reqId: req.id }, 'unhandled');
  captureError(err, { reqId: req.id, path: req.path });
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
};

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
};
