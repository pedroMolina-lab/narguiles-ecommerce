import api from "@/services/api";

/** Refleja el modelo que devuelve el backend (camelCase). */
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<ProductListResponse>("/products");
  return data.items;
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await api.get<{ product: Product }>(`/products/${id}`);
  return data.product;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  /** UUID de la categoría. Se envía como `categoryId`, que es lo que valida el backend. */
  categoryId: string;
  image?: File | null;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const formData = new FormData();
  formData.append("name", input.name);
  if (input.description) formData.append("description", input.description);
  formData.append("price", String(input.price));
  formData.append("stock", String(input.stock));
  formData.append("categoryId", input.categoryId);
  // El backend (multer) espera el archivo en el campo "image"
  if (input.image) formData.append("image", input.image);

  const { data } = await api.post<{ product: Product }>("/products", formData);
  return data.product;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  image?: File | null;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const formData = new FormData();
  if (input.name !== undefined) formData.append("name", input.name);
  if (input.description !== undefined) formData.append("description", input.description);
  if (input.price !== undefined) formData.append("price", String(input.price));
  if (input.stock !== undefined) formData.append("stock", String(input.stock));
  if (input.categoryId !== undefined) formData.append("categoryId", input.categoryId);
  if (input.image) formData.append("image", input.image);

  const { data } = await api.put<{ product: Product }>(`/products/${id}`, formData);
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}
