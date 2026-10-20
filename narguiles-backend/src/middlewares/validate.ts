import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

/** Valida { body, query, params } contra un esquema Zod y reemplaza body con la versión parseada. */
export const validate =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) return next(result.error);
    const data = result.data as { body?: unknown };
    if (data.body) req.body = data.body;
    next();
  };
