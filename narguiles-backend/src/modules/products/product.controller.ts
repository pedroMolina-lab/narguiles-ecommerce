import type { Request, Response } from 'express';
import { productListQuerySchema } from './product.schemas';
import { productService } from './product.service';

const idOf = (req: Request) => String(req.params.id);

export const productController = {
  async list(req: Request, res: Response) {
    // `validate` ya comprobó la query; aquí se parsea de nuevo para obtener defaults y tipos.
    const query = productListQuerySchema.parse(req.query);
    res.json(await productService.list(query));
  },

  async get(req: Request, res: Response) {
    res.json({ product: await productService.getById(idOf(req)) });
  },

  async create(req: Request, res: Response) {
    res.status(201).json({ product: await productService.create(req.body, req.file) });
  },

  async update(req: Request, res: Response) {
    res.json({ product: await productService.update(idOf(req), req.body, req.file) });
  },

  async remove(req: Request, res: Response) {
    await productService.remove(idOf(req));
    res.status(204).send();
  },
};
