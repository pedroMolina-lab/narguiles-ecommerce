import { AppError } from '../../utils/AppError';
import { productRepository } from '../products/product.repository';
import { cartRepository } from './cart.repository';
import type { UpsertCartItemInput } from './cart.schemas';
import type { CartView } from './cart.types';

const buildView = (id: string | null, items: CartView['items']): CartView => ({
  id,
  items,
  totalItems: items.reduce((n, i) => n + i.quantity, 0),
  total: items.reduce((cents, i) => cents + Math.round(i.subtotal * 100), 0) / 100,
});

export const cartService = {
  async getCart(userId: string): Promise<CartView> {
    const cartId = await cartRepository.findCartId(userId);
    if (!cartId) return buildView(null, []);
    return buildView(cartId, await cartRepository.findItems(cartId));
  },

  async setItem(userId: string, { productId, quantity }: UpsertCartItemInput): Promise<CartView> {
    const product = await productRepository.findById(productId);
    if (!product || !product.isActive) {
      throw AppError.notFound('Producto no encontrado', 'PRODUCT_NOT_FOUND');
    }
    if (quantity > product.stock) {
      throw AppError.conflict(`Stock insuficiente (disponible: ${product.stock})`, 'INSUFFICIENT_STOCK');
    }

    const cartId = await cartRepository.getOrCreateCartId(userId);
    await cartRepository.upsertItem(cartId, productId, quantity);
    return buildView(cartId, await cartRepository.findItems(cartId));
  },
};
