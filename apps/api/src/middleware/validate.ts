import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

interface Schemas { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny }

/** Parses req.body/query/params with Zod and replaces them with the parsed (coerced) values. */
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    // Express 5 exposes req.query as a getter, so it has to be redefined rather than assigned.
    if (schemas.query) Object.defineProperty(req, 'query', { value: schemas.query.parse(req.query), writable: true });
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    next();
  };
}
