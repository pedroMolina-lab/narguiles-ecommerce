import { pool } from '../../config/database';
import type { CreateProductData, Product, ProductFilters, UpdateProductData } from './product.types';

// price es NUMERIC (pg lo devuelve como string): se castea a float8 para entregar un number.
const COLUMNS = `
  id, category_id AS "categoryId", name, description, price::float8 AS price, stock,
  image_url AS "imageUrl", is_active AS "isActive",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export const productRepository = {
  /** Listado público: solo productos activos. */
  async findActive(f: ProductFilters): Promise<{ items: Product[]; total: number }> {
    const where = ['is_active = TRUE'];
    const values: unknown[] = [];
    if (f.categoryId) (values.push(f.categoryId), where.push(`category_id = $${values.length}`));
    if (f.search) (values.push(`%${escapeLike(f.search)}%`), where.push(`name ILIKE $${values.length}`));
    const whereSql = where.join(' AND ');

    const count = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM products WHERE ${whereSql}`,
      values,
    );

    values.push(f.limit, (f.page - 1) * f.limit);
    const { rows } = await pool.query<Product>(
      `SELECT ${COLUMNS} FROM products WHERE ${whereSql}
       ORDER BY created_at DESC, id
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return { items: rows, total: count.rows[0].total };
  },

  async findById(id: string): Promise<Product | null> {
    const { rows } = await pool.query<Product>(`SELECT ${COLUMNS} FROM products WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(data: CreateProductData): Promise<Product> {
    const { rows } = await pool.query<Product>(
      `INSERT INTO products (category_id, name, description, price, stock, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${COLUMNS}`,
      [
        data.categoryId,
        data.name,
        data.description ?? null,
        data.price,
        data.stock,
        data.imageUrl ?? null,
        data.isActive,
      ],
    );
    return rows[0];
  },

  async update(id: string, data: UpdateProductData): Promise<Product | null> {
    const columnOf: Record<keyof UpdateProductData, string> = {
      categoryId: 'category_id',
      name: 'name',
      description: 'description',
      price: 'price',
      stock: 'stock',
      imageUrl: 'image_url',
      isActive: 'is_active',
    };
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of Object.keys(columnOf) as (keyof UpdateProductData)[]) {
      if (data[key] === undefined) continue;
      values.push(data[key]);
      sets.push(`${columnOf[key]} = $${values.length}`);
    }
    if (sets.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await pool.query<Product>(
      `UPDATE products SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING ${COLUMNS}`,
      values,
    );
    return rows[0] ?? null;
  },

  /** Baja lógica: se conserva la fila para no romper futuros pedidos que la referencien. */
  async deactivate(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      'UPDATE products SET is_active = FALSE WHERE id = $1 AND is_active = TRUE',
      [id],
    );
    return (rowCount ?? 0) > 0;
  },
};
