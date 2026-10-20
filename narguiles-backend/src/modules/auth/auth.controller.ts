import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { userService } from '../users/user.service';
import { authService } from './auth.service';
import type { RequestMeta } from './auth.types';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = (expires?: Date): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
  ...(expires ? { expires, maxAge: expires.getTime() - Date.now() } : {}),
});

const getMeta = (req: Request): RequestMeta => ({
  userAgent: req.get('user-agent'),
  ipAddress: req.ip,
});

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body, getMeta(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(result.refreshExpiresAt));
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body, getMeta(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(result.refreshExpiresAt));
    res.json({ user: result.user, accessToken: result.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw AppError.unauthorized('Falta el refresh token', 'MISSING_REFRESH_TOKEN');

    try {
      const result = await authService.refresh(token, getMeta(req));
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(result.refreshExpiresAt));
      res.json({ accessToken: result.accessToken });
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE, cookieOptions());
      throw err;
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    const user = await userService.getPublicById(req.user!.id);
    res.json({ user });
  },
};
