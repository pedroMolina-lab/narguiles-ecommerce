import type { PoolClient } from 'pg';
import { pool } from '../../config/database';
import type { CheckoutLine, Order } from './orders.types';

interface LineRow {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  isActive: boolean;
}

/** Ejecuta `fn` dentro de BEGIN/COMMIT; ante cualquier error hace ROLLBACK y relanza. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export const ordersRepository = {
  /** Bloquea el carrito del usuario (evita doble checkout concurrente). */
  async lockCartId(client: PoolClient, userId: string): Promise<string | null> {
    const { rows } = await client.query<{ id: string }>(
      'SELECT id FROM carts WHERE user_id = $1 FOR UPDATE',
      [userId],
    );
    return rows[0]?.id ?? null;
  },

  /** Items del carrito con el precio ACTUAL de products (no el de cuando se agregaron). */
  async findCartLines(client: PoolClient, cartId: string): Promise<(CheckoutLine & { stock: number; isActive: boolean })[]> {
    const { rows } = await client.query<LineRow>(
      `SELECT p.id AS "productId", p.name, ci.quantity, p.price::float8 AS "unitPrice",
              p.stock, p.is_active AS "isActive"
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY p.name, ci.id`,
      [cartId],
    );
    return rows;
  },

  async createOrder(client: PoolClient, userId: string, totalAmount: number): Promise<Order> {
    const { rows } = await client.query<Order>(
      `INSERT INTO orders (user_id, total_amount) VALUES ($1, $2)
       RETURNING id, user_id AS "userId", total_amount::float8 AS "totalAmount", status,
                 created_at AS "createdAt"`,
      [userId, totalAmount],
    );
    return rows[0];
  },

  async createOrderItems(client: PoolClient, orderId: string, lines: CheckoutLine[]): Promise<void> {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
       SELECT $1, t.product_id, t.quantity, t.price
       FROM UNNEST($2::uuid[], $3::int[], $4::numeric[]) AS t(product_id, quantity, price)`,
      [orderId, lines.map((l) => l.productId), lines.map((l) => l.quantity), lines.map((l) => l.unitPrice)],
    );
  },

  async clearCart(client: PoolClient, cartId: string): Promise<void> {
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
  },
};
