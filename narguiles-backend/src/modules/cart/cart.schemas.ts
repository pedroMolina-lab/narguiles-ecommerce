import { z } from 'zod';

export const upsertCartItemSchema = z.object({
  body: z.object({
    productId: z.uuid(),
    quantity: z.number().int().min(1).max(99),
  }),
});

export type UpsertCartItemInput = z.infer<typeof upsertCartItemSchema>['body'];
