export interface CheckoutLine {
  productId: string;
  name: string;
  quantity: number;
  /** Precio vigente en `products` al momento del checkout. */
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

export interface CheckoutResult {
  order: Order & {
    items: { productId: string; name: string; quantity: number; priceAtPurchase: number }[];
  };
  whatsappUrl: string;
}
