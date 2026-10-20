import { createHash, randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../modules/users/user.types';
import { AppError } from './AppError';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: (env.JWT_ACCESS_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  });

export const signRefreshToken = (userId: string): { token: string; expiresAt: Date } => {
  const token = jwt.sign({ sub: userId, jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: (env.JWT_REFRESH_EXPIRES_IN || '30d') as SignOptions['expiresIn'],
  });
  const { exp } = jwt.decode(token) as { exp: number };
  return { token, expiresAt: new Date(exp * 1000) };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw AppError.unauthorized('Access token inválido o expirado', 'INVALID_ACCESS_TOKEN');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw AppError.unauthorized('Refresh token inválido o expirado', 'INVALID_REFRESH_TOKEN');
  }
};

/** SHA-256 hex: lo que se guarda en BD en lugar del token en claro. */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
