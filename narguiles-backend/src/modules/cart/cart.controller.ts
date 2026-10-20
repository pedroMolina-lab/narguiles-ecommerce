import type { Request, Response } from 'express';
import { cartService } from './cart.service';

// `authenticate` garantiza req.user antes de llegar aquí.
const userIdOf = (req: Request) => req.user!.id;

export const cartController = {
  async get(req: Request, res: Response) {
    res.json({ cart: await cartService.getCart(userIdOf(req)) });
  },

  async setItem(req: Request, res: Response) {
    res.json({ cart: await cartService.setItem(userIdOf(req), req.body) });
  },
};
