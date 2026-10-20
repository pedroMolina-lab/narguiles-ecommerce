export interface CartItemDetail {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    stock: number;
    isActive: boolean;
  };
  subtotal: number;
}

export interface CartView {
  id: string | null;
  items: CartItemDetail[];
  totalItems: number;
  total: number;
}
