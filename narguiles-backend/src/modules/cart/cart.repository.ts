import { pool } from '../../config/database';
import type { CartItemDetail } from './cart.types';

interface CartItemRow {
  id: string;
  quantity: number;
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
}

export const cartRepository = {
  async findCartId(userId: string): Promise<string | null> {
    const { rows } = await pool.query<{ id: string }>('SELECT id FROM carts WHERE user_id = $1', [userId]);
    return rows[0]?.id ?? null;
  },

  /** Crea el carrito si no existe (el UNIQUE sobre user_id evita duplicados en concurrencia). */
  async getOrCreateCartId(userId: string): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO carts (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [userId],
    );
    return rows[0].id;
  },

  async findItems(cartId: string): Promise<CartItemDetail[]> {
    const { rows } = await pool.query<CartItemRow>(
      `SELECT ci.id, ci.quantity, p.id AS "productId", p.name, p.price::float8 AS price,
              p.image_url AS "imageUrl", p.stock, p.is_active AS "isActive"
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY p.name, ci.id`,
      [cartId],
    );
    return rows.map((r) => ({
      id: r.id,
      quantity: r.quantity,
      product: {
        id: r.productId,
        name: r.name,
        price: r.price,
        imageUrl: r.imageUrl,
        stock: r.stock,
        isActive: r.isActive,
      },
      subtotal: Math.round(r.price * 100 * r.quantity) / 100,
    }));
  },

  /** Agrega el producto o reemplaza la cantidad si ya estaba en el carrito. */
  async upsertItem(cartId: string, productId: string, quantity: number): Promise<void> {
    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [cartId, productId, quantity],
    );
  },
};
