import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Repositorios simulados en memoria (sin PostgreSQL) ---
const db = vi.hoisted(() => ({
  users: [] as any[],
  tokens: [] as any[],
}));

vi.mock('../src/modules/users/user.repository', () => ({
  userRepository: {
    findById: async (id: string) => db.users.find((u) => u.id === id) ?? null,
    findByEmail: async (email: string) =>
      db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
    create: async (data: any) => {
      const user = {
        id: crypto.randomUUID(),
        phone: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
        role: data.role ?? 'CUSTOMER',
      };
      db.users.push(user);
      return user;
    },
    touchLastLogin: async () => {},
  },
}));

vi.mock('../src/modules/auth/refreshToken.repository', () => ({
  refreshTokenRepository: {
    create: async (userId: string, tokenHash: string, expiresAt: Date) => {
      db.tokens.push({ id: crypto.randomUUID(), userId, tokenHash, expiresAt, revokedAt: null });
    },
    findByHash: async (hash: string) => db.tokens.find((t) => t.tokenHash === hash) ?? null,
    revoke: async (id: string) => {
      const t = db.tokens.find((x) => x.id === id);
      if (!t || t.revokedAt) return false;
      t.revokedAt = new Date();
      return true;
    },
    revokeAllForUser: async (userId: string) => {
      db.tokens.filter((t) => t.userId === userId).forEach((t) => (t.revokedAt ??= new Date()));
    },
  },
}));

vi.mock('../src/middlewares/rateLimiter', () => ({
  authRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { app } from '../src/app';

const valid = {
  email: 'Cliente@Example.com',
  password: 'Secret123',
  firstName: 'Ana',
  lastName: 'Pérez',
};

const refreshCookie = (res: request.Response): string => {
  const raw = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const cookie = raw.find((c) => c.startsWith('refreshToken='));
  return cookie!.split(';')[0];
};

beforeEach(() => {
  db.users.length = 0;
  db.tokens.length = 0;
});

describe('POST /api/auth/register', () => {
  it('crea un CUSTOMER, devuelve access token y setea cookie httpOnly', async () => {
    const res = await request(app).post('/api/auth/register').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.user.email).toBe('cliente@example.com');
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'].join(';')).toMatch(/refreshToken=.*HttpOnly/i);
    expect(db.users[0].passwordHash).not.toBe(valid.password);
  });

  it('ignora un role enviado por el cliente (no escalada de privilegios)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('CUSTOMER');
  });

  it('rechaza email duplicado con 409', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const res = await request(app).post('/api/auth/register').send(valid);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rechaza datos inválidos con 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, email: 'no-es-email', password: 'débil' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(valid);
  });

  it('autentica con credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@example.com', password: valid.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
  });

  it('rechaza contraseña incorrecta y usuario inexistente con el mismo error', async () => {
    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@example.com', password: 'Wrong1234' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@example.com', password: 'Wrong1234' });

    expect(bad.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(bad.body).toEqual(unknown.body);
  });

  it('rechaza cuentas desactivadas con 403', async () => {
    db.users[0].isActive = false;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@example.com', password: valid.password });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve el usuario con access token válido', async () => {
    const reg = await request(app).post('/api/auth/register').send(valid);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('cliente@example.com');
  });

  it('responde 401 sin token o con token inválido', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer basura');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rota el refresh token y emite un nuevo access token', async () => {
    const reg = await request(app).post('/api/auth/register').send(valid);
    const cookie = refreshCookie(reg);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(refreshCookie(res)).not.toBe(cookie);
  });

  it('detecta reutilización de un token ya rotado y revoca todas las sesiones', async () => {
    const reg = await request(app).post('/api/auth/register').send(valid);
    const oldCookie = refreshCookie(reg);

    const rotated = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    const newCookie = refreshCookie(rotated);

    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('REFRESH_TOKEN_REUSED');

    // El token legítimo más reciente también queda invalidado
    const afterRevoke = await request(app).post('/api/auth/refresh').set('Cookie', newCookie);
    expect(afterRevoke.status).toBe(401);
  });

  it('responde 401 sin cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_REFRESH_TOKEN');
  });
});

describe('POST /api/auth/logout', () => {
  it('revoca el refresh token', async () => {
    const reg = await request(app).post('/api/auth/register').send(valid);
    const cookie = refreshCookie(reg);

    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(204);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });
});
