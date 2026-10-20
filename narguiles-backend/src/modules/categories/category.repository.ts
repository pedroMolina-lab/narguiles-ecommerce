import { pool } from '../../config/database';
import type { Category, CategoryData } from './category.types';

const COLUMNS = `id, name, description, slug, created_at AS "createdAt", updated_at AS "updatedAt"`;

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    const { rows } = await pool.query<Category>(`SELECT ${COLUMNS} FROM categories ORDER BY name`);
    return rows;
  },

  async findById(id: string): Promise<Category | null> {
    const { rows } = await pool.query<Category>(`SELECT ${COLUMNS} FROM categories WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(data: CategoryData): Promise<Category> {
    const { rows } = await pool.query<Category>(
      `INSERT INTO categories (name, description, slug) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [data.name, data.description ?? null, data.slug],
    );
    return rows[0];
  },

  async update(id: string, data: Partial<CategoryData>): Promise<Category | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (data.name !== undefined) (values.push(data.name), sets.push(`name = $${values.length}`));
    if (data.description !== undefined) (values.push(data.description), sets.push(`description = $${values.length}`));
    if (data.slug !== undefined) (values.push(data.slug), sets.push(`slug = $${values.length}`));
    if (sets.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await pool.query<Category>(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING ${COLUMNS}`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
