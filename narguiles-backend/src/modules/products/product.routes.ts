import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { uploadProductImage } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '../users/user.types';
import { productController } from './product.controller';
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  updateProductSchema,
} from './product.schemas';

export const productRouter = Router();

const staffOnly = [authenticate, authorize(Role.ADMIN, Role.STAFF)];

// Públicas
productRouter.get('/', validate(listProductsSchema), asyncHandler(productController.list));
productRouter.get('/:id', validate(productIdSchema), asyncHandler(productController.get));

// Solo ADMIN y STAFF. Orden: autenticar -> autorizar -> multer (parsea multipart) -> Zod -> controller.
productRouter.post(
  '/',
  ...staffOnly,
  uploadProductImage,
  validate(createProductSchema),
  asyncHandler(productController.create),
);
productRouter.put(
  '/:id',
  ...staffOnly,
  uploadProductImage,
  validate(updateProductSchema),
  asyncHandler(productController.update),
);
productRouter.delete('/:id', ...staffOnly, validate(productIdSchema), asyncHandler(productController.remove));
