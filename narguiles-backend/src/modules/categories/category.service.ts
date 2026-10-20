import { AppError } from '../../utils/AppError';
import { slugify } from '../../utils/slugify';
import { categoryRepository } from './category.repository';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schemas';
import type { Category } from './category.types';

const pgCode = (err: unknown) => (err as { code?: string } | null)?.code;

const slugTaken = () => AppError.conflict('Ya existe una categoría con ese slug', 'SLUG_TAKEN');

export const categoryService = {
  list(): Promise<Category[]> {
    return categoryRepository.findAll();
  },

  async getById(id: string): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) throw AppError.notFound('Categoría no encontrada', 'CATEGORY_NOT_FOUND');
    return category;
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const slug = input.slug ?? slugify(input.name);
    if (!slug) throw AppError.badRequest('No se pudo generar un slug válido', 'INVALID_SLUG');
    try {
      return await categoryRepository.create({ name: input.name, description: input.description, slug });
    } catch (err) {
      if (pgCode(err) === '23505') throw slugTaken();
      throw err;
    }
  },

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    try {
      const updated = await categoryRepository.update(id, input);
      if (!updated) throw AppError.notFound('Categoría no encontrada', 'CATEGORY_NOT_FOUND');
      return updated;
    } catch (err) {
      if (pgCode(err) === '23505') throw slugTaken();
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const deleted = await categoryRepository.delete(id);
      if (!deleted) throw AppError.notFound('Categoría no encontrada', 'CATEGORY_NOT_FOUND');
    } catch (err) {
      if (pgCode(err) === '23503') {
        throw AppError.conflict('La categoría tiene productos asociados', 'CATEGORY_IN_USE');
      }
      throw err;
    }
  },
};
