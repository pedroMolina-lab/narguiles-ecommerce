export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  page: number;
  limit: number;
}
