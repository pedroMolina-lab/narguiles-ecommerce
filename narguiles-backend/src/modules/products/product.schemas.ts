import { z } from 'zod';

/** En multipart/form-data todo llega como string; "" se trata como "no enviado". */
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const price = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .min(0)
    .max(99_999_999.99)
    .transform((v) => Math.round(v * 100) / 100),
);

const stock = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(1_000_000));

const boolish = z.preprocess(
  (v) => (v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : emptyToUndefined(v)),
  z.boolean(),
);

const name = z.string().trim().min(1).max(200);
const description = z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional());

const idParams = z.object({ id: z.uuid() });

export const productIdSchema = z.object({ params: idParams });

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z.uuid(),
    name,
    description,
    price,
    stock: stock.default(0),
    isActive: boolish.default(true),
  }),
});

export const updateProductSchema = z.object({
  params: idParams,
  body: z.object({
    categoryId: z.uuid().optional(),
    name: name.optional(),
    description,
    price: price.optional(),
    stock: stock.optional(),
    isActive: boolish.optional(),
  }),
});

export const productListQuerySchema = z.object({
  categoryId: z.preprocess(emptyToUndefined, z.uuid().optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listProductsSchema = z.object({ query: productListQuerySchema });

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
