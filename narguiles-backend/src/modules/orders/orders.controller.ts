import type { Request, Response } from 'express';
import { ordersService } from './orders.service';

export const ordersController = {
  async checkout(req: Request, res: Response) {
    res.status(201).json(await ordersService.checkout(req.user!.id));
  },
};
