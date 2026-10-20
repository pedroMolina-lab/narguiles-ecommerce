import type { Request, Response } from 'express';
import { categoryService } from './category.service';

const idOf = (req: Request) => String(req.params.id);

export const categoryController = {
  async list(_req: Request, res: Response) {
    res.json({ items: await categoryService.list() });
  },

  async get(req: Request, res: Response) {
    res.json({ category: await categoryService.getById(idOf(req)) });
  },

  async create(req: Request, res: Response) {
    res.status(201).json({ category: await categoryService.create(req.body) });
  },

  async update(req: Request, res: Response) {
    res.json({ category: await categoryService.update(idOf(req), req.body) });
  },

  async remove(req: Request, res: Response) {
    await categoryService.remove(idOf(req));
    res.status(204).send();
  },
};
