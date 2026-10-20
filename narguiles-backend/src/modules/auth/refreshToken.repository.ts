import { pool } from '../../config/database';
import type { RefreshTokenRecord, RequestMeta } from './auth.types';

const COLUMNS = `id, user_id AS "userId", token_hash AS "tokenHash",
  expires_at AS "expiresAt", revoked_at AS "revokedAt"`;

export const refreshTokenRepository = {
  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    meta: RequestMeta,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, meta.userAgent ?? null, meta.ipAddress ?? null],
    );
  },

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const { rows } = await pool.query<RefreshTokenRecord>(
      `SELECT ${COLUMNS} FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  /** Revoca atómicamente; devuelve false si ya estaba revocado (evita doble uso concurrente). */
  async revoke(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL',
      [id],
    );
    return (rowCount ?? 0) > 0;
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  },
};
