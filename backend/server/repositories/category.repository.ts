import { prisma } from "@/server/database/prisma";
import { Prisma } from "@prisma/client";

export const CategoryRepository = {
  async findAllActive() {
    return prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });
  },

  async findById(id: string) {
    return prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
  },

  async findBySlug(slug: string) {
    return prisma.category.findFirst({
      where: { slug, deletedAt: null },
    });
  },

  async create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({
      data,
    });
  },

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string) {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
