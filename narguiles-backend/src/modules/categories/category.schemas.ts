import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug inválido (solo minúsculas, números y guiones)');

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const idParams = z.object({ id: z.uuid() });

export const categoryIdSchema = z.object({ params: idParams });

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    slug: z.preprocess(emptyToUndefined, slug.optional()),
  }),
});

export const updateCategorySchema = z.object({
  params: idParams,
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    slug: slug.optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
