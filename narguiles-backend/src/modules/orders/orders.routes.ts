import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ordersController } from './orders.controller';
import { checkoutSchema } from './orders.schemas';

/** Se monta en /api/checkout. */
export const ordersRouter = Router();

ordersRouter.post('/', authenticate, validate(checkoutSchema), asyncHandler(ordersController.checkout));
