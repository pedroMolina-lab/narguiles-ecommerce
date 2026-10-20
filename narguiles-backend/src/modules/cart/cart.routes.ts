import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { cartController } from './cart.controller';
import { upsertCartItemSchema } from './cart.schemas';

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get('/', asyncHandler(cartController.get));
cartRouter.post('/items', validate(upsertCartItemSchema), asyncHandler(cartController.setItem));
