import api from "@/services/api";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<{ items: Category[] }>("/categories");
  return data.items;
}
