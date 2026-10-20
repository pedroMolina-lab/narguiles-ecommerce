import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '../users/user.types';
import { categoryController } from './category.controller';
import { categoryIdSchema, createCategorySchema, updateCategorySchema } from './category.schemas';

export const categoryRouter = Router();

const staffOnly = [authenticate, authorize(Role.ADMIN, Role.STAFF)];

// Públicas
categoryRouter.get('/', asyncHandler(categoryController.list));
categoryRouter.get('/:id', validate(categoryIdSchema), asyncHandler(categoryController.get));

// Solo ADMIN y STAFF
categoryRouter.post('/', ...staffOnly, validate(createCategorySchema), asyncHandler(categoryController.create));
categoryRouter.put('/:id', ...staffOnly, validate(updateCategorySchema), asyncHandler(categoryController.update));
categoryRouter.delete('/:id', ...staffOnly, validate(categoryIdSchema), asyncHandler(categoryController.remove));
