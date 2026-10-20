import { AppError } from '../../utils/AppError';
import { categoryRepository } from '../categories/category.repository';
import { supabaseStorageService, type UploadedFile } from '../storage/supabase-storage.service';
import { productRepository } from './product.repository';
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from './product.schemas';
import type { Product } from './product.types';

const notFound = () => AppError.notFound('Producto no encontrado', 'PRODUCT_NOT_FOUND');

const assertCategoryExists = async (categoryId: string) => {
  if (!(await categoryRepository.findById(categoryId))) {
    throw AppError.badRequest('La categoría indicada no existe', 'CATEGORY_NOT_FOUND');
  }
};

export const productService = {
  async list(query: ProductListQuery) {
    const { items, total } = await productRepository.findActive(query);
    return { items, total, page: query.page, limit: query.limit };
  },

  /** Los productos inactivos se tratan como inexistentes para el público. */
  async getById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product || !product.isActive) throw notFound();
    return product;
  },

  async create(input: CreateProductInput, file?: UploadedFile): Promise<Product> {
    await assertCategoryExists(input.categoryId);
    const imageUrl = file ? await supabaseStorageService.uploadImage(file) : null;
    try {
      return await productRepository.create({ ...input, imageUrl });
    } catch (err) {
      await supabaseStorageService.deleteByUrl(imageUrl); // no dejar imágenes huérfanas
      throw err;
    }
  },

  async update(id: string, input: UpdateProductInput, file?: UploadedFile): Promise<Product> {
    const current = await productRepository.findById(id);
    if (!current) throw notFound();
    if (input.categoryId) await assertCategoryExists(input.categoryId);

    const newImageUrl = file ? await supabaseStorageService.uploadImage(file) : undefined;
    try {
      const updated = await productRepository.update(id, { ...input, imageUrl: newImageUrl });
      if (!updated) throw notFound();
      if (newImageUrl) await supabaseStorageService.deleteByUrl(current.imageUrl);
      return updated;
    } catch (err) {
      await supabaseStorageService.deleteByUrl(newImageUrl);
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    if (!(await productRepository.deactivate(id))) throw notFound();
  },
};
