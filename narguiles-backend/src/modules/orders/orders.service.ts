import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { userRepository } from '../users/user.repository';
import { ordersRepository, withTransaction } from './orders.repository';
import type { CheckoutLine, CheckoutResult } from './orders.types';

const money = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const buildWhatsappUrl = (
  customerName: string,
  lines: CheckoutLine[],
  total: number,
  orderId: string,
): string => {
  const number = env.WHATSAPP_NUMBER;
  if (!number) throw new AppError(500, 'WHATSAPP_NUMBER no está configurado', 'WHATSAPP_NOT_CONFIGURED');

  const detail = lines
    .map((l) => `• ${l.quantity} x ${l.name} - $${money(l.unitPrice * l.quantity)}`)
    .join('\n');
  const text = [
    `¡Hola! Quiero confirmar mi pedido #${orderId.slice(0, 8)}`,
    `Cliente: ${customerName}`,
    '',
    'Productos:',
    detail,
    '',
    `Total: $${money(total)}`,
  ].join('\n');

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

export const ordersService = {
  async checkout(userId: string): Promise<CheckoutResult> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.unauthorized('Usuario no encontrado');

    const { order, lines } = await withTransaction(async (client) => {
      const cartId = await ordersRepository.lockCartId(client, userId);
      const lines = cartId ? await ordersRepository.findCartLines(client, cartId) : [];
      if (!cartId || lines.length === 0) {
        throw AppError.badRequest('El carrito está vacío', 'EMPTY_CART');
      }

      for (const l of lines) {
        if (!l.isActive) {
          throw AppError.conflict(`El producto "${l.name}" ya no está disponible`, 'PRODUCT_UNAVAILABLE');
        }
        if (l.quantity > l.stock) {
          throw AppError.conflict(`Stock insuficiente para "${l.name}" (disponible: ${l.stock})`, 'INSUFFICIENT_STOCK');
        }
      }

      // Se suma en centavos enteros para evitar errores de coma flotante.
      const totalCents = lines.reduce((acc, l) => acc + Math.round(l.unitPrice * 100) * l.quantity, 0);
      const order = await ordersRepository.createOrder(client, userId, totalCents / 100);
      await ordersRepository.createOrderItems(client, order.id, lines);
      await ordersRepository.clearCart(client, cartId);
      return { order, lines };
    });

    const whatsappUrl = buildWhatsappUrl(
      `${user.firstName} ${user.lastName}`,
      lines,
      order.totalAmount,
      order.id,
    );

    return {
      order: {
        ...order,
        items: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          quantity: l.quantity,
          priceAtPurchase: l.unitPrice,
        })),
      },
      whatsappUrl,
    };
  },
};
