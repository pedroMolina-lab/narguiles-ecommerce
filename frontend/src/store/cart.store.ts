import { create } from "zustand";

export interface Product {
  id: string | number;
  nombre: string;
  precio: number;
  imagen: string;
}

export interface CartItem extends Product {
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: Product["id"]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...product, cantidad: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  clearCart: () => set({ items: [] }),

  getTotalItems: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
}));
