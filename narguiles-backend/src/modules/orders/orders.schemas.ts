import { z } from 'zod';

/** El checkout no recibe datos: todo se deriva del carrito persistido del usuario. */
export const checkoutSchema = z.object({
  body: z.object({}).optional(),
});
