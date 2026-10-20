import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Estado en memoria que simula PostgreSQL ---
const db = vi.hoisted(() => ({
  users: [] as any[],
  products: [] as any[],
  carts: [] as { id: string; userId: string; items: { id: string; productId: string; quantity: number }[] }[],
  orders: [] as any[],
  orderItems: [] as any[],
  failOrderItems: false,
}));

const toCartItems = (cartId: string) => {
  const cart = db.carts.find((c) => c.id === cartId)!;
  return cart.items.map((i) => {
    const p = db.products.find((x) => x.id === i.productId)!;
    return { ...i, p };
  });
};

vi.mock('../src/modules/users/user.repository', () => ({
  userRepository: { findById: async (id: string) => db.users.find((u) => u.id === id) ?? null },
}));

vi.mock('../src/modules/products/product.repository', () => ({
  productRepository: { findById: async (id: string) => db.products.find((p) => p.id === id) ?? null },
}));

vi.mock('../src/modules/cart/cart.repository', () => ({
  cartRepository: {
    findCartId: async (userId: string) => db.carts.find((c) => c.userId === userId)?.id ?? null,
    getOrCreateCartId: async (userId: string) => {
      let cart = db.carts.find((c) => c.userId === userId);
      if (!cart) db.carts.push((cart = { id: crypto.randomUUID(), userId, items: [] }));
      return cart.id;
    },
    findItems: async (cartId: string) =>
      toCartItems(cartId).map(({ id, quantity, p }) => ({
        id,
        quantity,
        product: {
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          stock: p.stock,
          isActive: p.isActive,
        },
        subtotal: Math.round(p.price * 100 * quantity) / 100,
      })),
    upsertItem: async (cartId: string, productId: string, quantity: number) => {
      const cart = db.carts.find((c) => c.id === cartId)!;
      const existing = cart.items.find((i) => i.productId === productId);
      if (existing) existing.quantity = quantity;
      else cart.items.push({ id: crypto.randomUUID(), productId, quantity });
    },
  },
}));

vi.mock('../src/modules/orders/orders.repository', () => ({
  // Simula la transacción: si fn lanza, se restaura el estado previo (ROLLBACK).
  withTransaction: async (fn: (c: unknown) => Promise<unknown>) => {
    const snapshot = structuredClone({ carts: db.carts, orders: db.orders, orderItems: db.orderItems });
    try {
      return await fn({});
    } catch (err) {
      db.carts = snapshot.carts;
      db.orders = snapshot.orders;
      db.orderItems = snapshot.orderItems;
      throw err;
    }
  },
  ordersRepository: {
    lockCartId: async (_c: unknown, userId: string) => db.carts.find((c) => c.userId === userId)?.id ?? null,
    findCartLines: async (_c: unknown, cartId: string) =>
      toCartItems(cartId).map(({ quantity, p }) => ({
        productId: p.id,
        name: p.name,
        quantity,
        unitPrice: p.price,
        stock: p.stock,
        isActive: p.isActive,
      })),
    createOrder: async (_c: unknown, userId: string, totalAmount: number) => {
      const order = { id: crypto.randomUUID(), userId, totalAmount, status: 'PENDING', createdAt: new Date() };
      db.orders.push(order);
      return order;
    },
    createOrderItems: async (_c: unknown, orderId: string, lines: any[]) => {
      if (db.failOrderItems) throw new Error('fallo simulado');
      lines.forEach((l) =>
        db.orderItems.push({ orderId, productId: l.productId, quantity: l.quantity, price: l.unitPrice }),
      );
    },
    clearCart: async (_c: unknown, cartId: string) => {
      db.carts.find((c) => c.id === cartId)!.items = [];
    },
  },
}));

import { app } from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { Role } from '../src/modules/users/user.types';

const USER_ID = crypto.randomUUID();
const hookah = { id: crypto.randomUUID(), name: 'Narguile Khalil', price: 100.5, stock: 10, isActive: true, imageUrl: 'http://img/1.jpg' };
const coal = { id: crypto.randomUUID(), name: 'Carbón Coco', price: 20, stock: 5, isActive: true, imageUrl: null };
const auth = () => ({ Authorization: `Bearer ${signAccessToken({ sub: USER_ID, role: Role.CUSTOMER })}` });

beforeEach(() => {
  db.users = [{ id: USER_ID, firstName: 'Ana', lastName: 'Pérez' }];
  db.products = [{ ...hookah }, { ...coal }];
  db.carts = [];
  db.orders = [];
  db.orderItems = [];
  db.failOrderItems = false;
});

describe('Carrito', () => {
  it('exige autenticación', async () => {
    expect((await request(app).get('/api/cart')).status).toBe(401);
    expect((await request(app).post('/api/cart/items').send({})).status).toBe(401);
    expect((await request(app).post('/api/checkout')).status).toBe(401);
  });

  it('devuelve un carrito vacío si el usuario aún no tiene uno', async () => {
    const res = await request(app).get('/api/cart').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.cart).toMatchObject({ id: null, items: [], total: 0, totalItems: 0 });
  });

  it('agrega un producto y devuelve detalle, foto y total', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set(auth())
      .send({ productId: hookah.id, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].product).toMatchObject({ name: hookah.name, imageUrl: hookah.imageUrl });
    expect(res.body.cart.total).toBe(201);
  });

  it('actualiza la cantidad si el producto ya existe (no duplica)', async () => {
    await request(app).post('/api/cart/items').set(auth()).send({ productId: hookah.id, quantity: 2 });
    const res = await request(app).post('/api/cart/items').set(auth()).send({ productId: hookah.id, quantity: 5 });
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].quantity).toBe(5);
  });

  it.each([
    [{ productId: 'no-uuid', quantity: 1 }],
    [{ productId: hookah.id, quantity: 0 }],
    [{ productId: hookah.id, quantity: 1.5 }],
    [{ productId: hookah.id }],
  ])('rechaza entradas inválidas %j con 400', async (body) => {
    const res = await request(app).post('/api/cart/items').set(auth()).send(body);
    expect(res.status).toBe(400);
  });

  it('404 si el producto no existe o está inactivo', async () => {
    const missing = await request(app).post('/api/cart/items').set(auth()).send({ productId: crypto.randomUUID(), quantity: 1 });
    expect(missing.status).toBe(404);

    db.products[0].isActive = false;
    const inactive = await request(app).post('/api/cart/items').set(auth()).send({ productId: hookah.id, quantity: 1 });
    expect(inactive.status).toBe(404);
  });

  it('409 si la cantidad supera el stock', async () => {
    const res = await request(app).post('/api/cart/items').set(auth()).send({ productId: coal.id, quantity: 6 });
    expect(res.status).toBe(409);
  });
});

describe('Checkout', () => {
  const fill = async () => {
    await request(app).post('/api/cart/items').set(auth()).send({ productId: hookah.id, quantity: 2 });
    await request(app).post('/api/cart/items').set(auth()).send({ productId: coal.id, quantity: 3 });
  };

  it('400 EMPTY_CART si el usuario no tiene carrito', async () => {
    const res = await request(app).post('/api/checkout').set(auth());
    expect(res.status).toBe(400);
    expect(res.body.error?.code ?? res.body.code).toBe('EMPTY_CART');
    expect(db.orders).toHaveLength(0);
  });

  it('400 EMPTY_CART si el carrito existe pero no tiene items', async () => {
    db.carts.push({ id: crypto.randomUUID(), userId: USER_ID, items: [] });
    const res = await request(app).post('/api/checkout').set(auth());
    expect(res.status).toBe(400);
    expect(db.orders).toHaveLength(0);
  });

  it('crea la orden con el precio actual, vacía el carrito y genera el enlace de WhatsApp', async () => {
    await fill();
    db.products[1].price = 25; // el precio cambia después de agregar al carrito

    const res = await request(app).post('/api/checkout').set(auth());
    expect(res.status).toBe(201);

    // 2 x 100.50 + 3 x 25 = 276
    expect(res.body.order.totalAmount).toBe(276);
    expect(res.body.order.status).toBe('PENDING');
    expect(db.orderItems).toHaveLength(2);
    expect(db.orderItems.find((i) => i.productId === coal.id).price).toBe(25);
    expect(db.carts[0].items).toHaveLength(0);

    const url = new URL(res.body.whatsappUrl);
    expect(url.origin + url.pathname).toBe('https://wa.me/5491112345678');
    const text = url.searchParams.get('text')!;
    expect(text).toContain('Ana Pérez');
    expect(text).toContain('2 x Narguile Khalil');
    expect(text).toContain('3 x Carbón Coco');
    expect(text).toContain('276,00');
  });

  it('hace ROLLBACK si algo falla: no queda orden y el carrito se conserva', async () => {
    await fill();
    db.failOrderItems = true;

    const res = await request(app).post('/api/checkout').set(auth());
    expect(res.status).toBe(500);
    expect(db.orders).toHaveLength(0);
    expect(db.carts[0].items).toHaveLength(2);
  });

  it('409 si un producto del carrito ya no tiene stock suficiente', async () => {
    await fill();
    db.products[1].stock = 1;
    const res = await request(app).post('/api/checkout').set(auth());
    expect(res.status).toBe(409);
    expect(db.orders).toHaveLength(0);
    expect(db.carts[0].items).toHaveLength(2);
  });

  it('un segundo checkout consecutivo falla por carrito vacío', async () => {
    await fill();
    expect((await request(app).post('/api/checkout').set(auth())).status).toBe(201);
    expect((await request(app).post('/api/checkout').set(auth())).status).toBe(400);
  });
});
