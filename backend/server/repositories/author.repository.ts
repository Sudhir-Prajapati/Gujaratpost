import { prisma } from "@/server/database/prisma";
import { Prisma } from "@prisma/client";

export const AuthorRepository = {
  async findAllActive() {
    return prisma.author.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });
  },

  async findById(id: string) {
    return prisma.author.findFirst({
      where: { id, deletedAt: null },
    });
  },

  async findBySlug(slug: string) {
    // Author id is used as the slug (e.g. 'a1', 'a2' in mock dataset)
    return prisma.author.findFirst({
      where: { id: slug, deletedAt: null },
    });
  },

  async findByEmail(email: string) {
    return prisma.author.findFirst({
      where: { email, deletedAt: null },
    });
  },

  async create(data: Prisma.AuthorCreateInput) {
    return prisma.author.create({
      data,
    });
  },

  async update(id: string, data: Prisma.AuthorUpdateInput) {
    return prisma.author.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string) {
    return prisma.author.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
