import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(authController.register));
authRouter.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
