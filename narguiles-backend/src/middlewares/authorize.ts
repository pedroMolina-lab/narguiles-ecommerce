import type { RequestHandler } from 'express';
import { Role } from '../modules/users/user.types';
import { AppError } from '../utils/AppError';

/** RBAC: permite el paso solo a los roles indicados. Usar después de `authenticate`. */
export const authorize =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
