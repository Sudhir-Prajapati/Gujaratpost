import { CategoryRepository } from "@/server/repositories/category.repository";

export const CategoryService = {
  async getActiveCategories() {
    return CategoryRepository.findAllActive();
  },

  async getCategoryBySlug(slug: string) {
    return CategoryRepository.findBySlug(slug);
  },
};
