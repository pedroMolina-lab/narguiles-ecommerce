export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryData {
  name: string;
  description?: string | null;
  slug: string;
}
