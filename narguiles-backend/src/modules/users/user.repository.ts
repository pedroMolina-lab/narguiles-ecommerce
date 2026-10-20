import { pool } from '../../config/database';
import type { CreateUserData, User } from './user.types';

const COLUMNS = `
  id, email, password_hash AS "passwordHash", first_name AS "firstName",
  last_name AS "lastName", phone, role, is_active AS "isActive",
  last_login_at AS "lastLoginAt", created_at AS "createdAt", updated_at AS "updatedAt"
`;

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query<User>(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `SELECT ${COLUMNS} FROM users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );
    return rows[0] ?? null;
  },

  async create(data: CreateUserData): Promise<User> {
    const { rows } = await pool.query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::user_role, 'CUSTOMER'))
       RETURNING ${COLUMNS}`,
      [
        data.email,
        data.passwordHash,
        data.firstName,
        data.lastName,
        data.phone ?? null,
        data.role ?? null,
      ],
    );
    return rows[0];
  },

  async touchLastLogin(id: string): Promise<void> {
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  },
};
