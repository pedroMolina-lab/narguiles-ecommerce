import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { authorize } from '../src/middlewares/authorize';
import { Role } from '../src/modules/users/user.types';
import { AppError } from '../src/utils/AppError';

const run = (user: Request['user'], ...roles: Role[]) => {
  const next = vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
  authorize(...roles)({ user } as Request, {} as Response, next);
  return (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
};

describe('authorize (RBAC)', () => {
  it('permite un rol incluido', () => {
    expect(run({ id: '1', role: Role.ADMIN }, Role.ADMIN, Role.STAFF)).toBeUndefined();
    expect(run({ id: '1', role: Role.STAFF }, Role.ADMIN, Role.STAFF)).toBeUndefined();
  });

  it('responde 403 a un rol no incluido', () => {
    const err = run({ id: '1', role: Role.CUSTOMER }, Role.ADMIN, Role.STAFF);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
  });

  it('responde 401 si no hay usuario autenticado', () => {
    expect(run(undefined, Role.ADMIN).statusCode).toBe(401);
  });
});
