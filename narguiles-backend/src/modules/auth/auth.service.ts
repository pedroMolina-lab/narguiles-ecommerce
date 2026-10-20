import { AppError } from '../../utils/AppError';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { hashPassword, verifyPassword } from '../../utils/password';
import { userRepository } from '../users/user.repository';
import { toPublicUser } from '../users/user.service';
import { Role, type User } from '../users/user.types';
import type { LoginInput, RegisterInput } from './auth.schemas';
import type { AuthResult, RefreshResult, RequestMeta } from './auth.types';
import { refreshTokenRepository } from './refreshToken.repository';

const PG_UNIQUE_VIOLATION = '23505';

async function issueTokens(user: User, meta: RequestMeta): Promise<RefreshResult> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken, expiresAt } = signRefreshToken(user.id);
  await refreshTokenRepository.create(user.id, hashToken(refreshToken), expiresAt, meta);
  return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
}

export const authService = {
  async register(input: RegisterInput, meta: RequestMeta): Promise<AuthResult> {
    if (await userRepository.findByEmail(input.email)) {
      throw AppError.conflict('El email ya está registrado', 'EMAIL_TAKEN');
    }

    let user: User;
    try {
      user = await userRepository.create({
        email: input.email,
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: Role.CUSTOMER, // el registro público SIEMPRE crea CUSTOMER
      });
    } catch (err) {
      if ((err as { code?: string }).code === PG_UNIQUE_VIOLATION) {
        throw AppError.conflict('El email ya está registrado', 'EMAIL_TAKEN');
      }
      throw err;
    }

    const tokens = await issueTokens(user, meta);
    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput, meta: RequestMeta): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    const valid = user ? await verifyPassword(user.passwordHash, input.password) : false;

    if (!user || !valid) {
      throw AppError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS');
    }
    if (!user.isActive) {
      throw AppError.forbidden('La cuenta está desactivada', 'ACCOUNT_DISABLED');
    }

    await userRepository.touchLastLogin(user.id);
    const tokens = await issueTokens(user, meta);
    return { user: toPublicUser(user), ...tokens };
  },

  /** Rotación: el token usado se revoca y se emite uno nuevo. Reuso de uno revocado => se revocan todas las sesiones. */
  async refresh(token: string, meta: RequestMeta): Promise<RefreshResult> {
    const payload = verifyRefreshToken(token);
    const record = await refreshTokenRepository.findByHash(hashToken(token));

    if (!record) throw AppError.unauthorized('Refresh token inválido', 'INVALID_REFRESH_TOKEN');

    if (record.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(record.userId);
      throw AppError.unauthorized('Refresh token reutilizado', 'REFRESH_TOKEN_REUSED');
    }

    if (!(await refreshTokenRepository.revoke(record.id))) {
      throw AppError.unauthorized('Refresh token inválido', 'INVALID_REFRESH_TOKEN');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Usuario no disponible', 'INVALID_REFRESH_TOKEN');
    }

    return issueTokens(user, meta);
  },

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    const record = await refreshTokenRepository.findByHash(hashToken(token));
    if (record) await refreshTokenRepository.revoke(record.id);
  },
};
