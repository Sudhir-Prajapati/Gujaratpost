import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError, ConflictError } from '../utils/errors.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

export class CategoryController {
  /**
   * Get all categories sorted by displayOrder DESC (large number first, low number last).
   */
  static async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          displayOrder: 'desc',
        },
      });
      return sendSuccess(res, categories, 'Categories list retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category.
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, nameGu, nameHi, slug, icon, color, displayOrder, isActive, showInHome, showInHeader, headerType } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new BadRequestError('Category name is required.');
      }

      const nameClean = name.trim();
      const nameGuClean = nameGu && typeof nameGu === 'string' && nameGu.trim() ? nameGu.trim() : nameClean;
      const nameHiClean = nameHi && typeof nameHi === 'string' && nameHi.trim() ? nameHi.trim() : nameClean;

      // Generate a slug if not provided
      let categorySlug = slug;
      if (!categorySlug || typeof categorySlug !== 'string' || categorySlug.trim() === '') {
        categorySlug = nameClean
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      } else {
        categorySlug = categorySlug.trim().toLowerCase();
      }

      if (!categorySlug) {
        categorySlug = `cat-${Date.now()}`;
      }

      // Check displayOrder is positive/non-negative
      const parsedOrder = displayOrder !== undefined ? (typeof displayOrder === 'number' ? displayOrder : parseInt(displayOrder)) : 0;
      if (isNaN(parsedOrder) || parsedOrder < 0) {
        throw new BadRequestError('Category order must be a positive number or zero (0 કે તેથી વધુ ધન સંખ્યા હોવી જોઈએ).');
      }

      // Check duplicate category name or slug (case-insensitive)
      const existingList = await prisma.category.findMany({
        where: {
          OR: [
            { slug: categorySlug },
            { name: { equals: nameClean } },
            { nameGu: { equals: nameGuClean } },
          ],
        },
      });

      if (existingList.length > 0) {
        throw new ConflictError(`Category with name "${nameClean}" or slug "${categorySlug}" already exists! (આ નામ અથવા સ્લગ ધરાવતી કૅટેગરી પહેલાથી જ હયાત છે)`);
      }

      const category = await prisma.category.create({
        data: {
          name: nameClean,
          nameGu: nameGuClean,
          nameHi: nameHiClean,
          slug: categorySlug,
          icon: icon || null,
          color: color || null,
          displayOrder: parsedOrder,
          isActive: isActive !== undefined ? isActive : true,
          showInHome: showInHome !== undefined ? showInHome : true,
          showInHeader: showInHeader !== undefined ? showInHeader : true,
          headerType: headerType !== undefined ? headerType : 'GLOBAL',
        },
      });

      clearPublicRoutesCache();
      return sendSuccess(res, category, 'Category created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update details of an existing category.
   */
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, nameGu, nameHi, slug, icon, color, displayOrder, isActive, showInHome, showInHeader, headerType } = req.body;

      const category = await prisma.category.findUnique({
        where: { id },
      });
      if (!category) {
        throw new BadRequestError('Category not found.');
      }

      const updateData: any = {};

      if (name !== undefined) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
          throw new BadRequestError('Category name cannot be empty.');
        }
        updateData.name = name.trim();
      }
      if (nameGu !== undefined) updateData.nameGu = typeof nameGu === 'string' ? nameGu.trim() : category.nameGu;
      if (nameHi !== undefined) updateData.nameHi = typeof nameHi === 'string' ? nameHi.trim() : category.nameHi;
      if (icon !== undefined) updateData.icon = icon || null;
      if (color !== undefined) updateData.color = color || null;

      if (displayOrder !== undefined) {
        const parsedOrder = typeof displayOrder === 'number' ? displayOrder : parseInt(displayOrder);
        if (isNaN(parsedOrder) || parsedOrder < 0) {
          throw new BadRequestError('Category order must be a positive number or zero (0 કે તેથી વધુ ધન સંખ્યા હોવી જોઈએ).');
        }
        updateData.displayOrder = parsedOrder;
      }

      if (isActive !== undefined) updateData.isActive = isActive;
      if (showInHome !== undefined) updateData.showInHome = showInHome;
      if (showInHeader !== undefined) updateData.showInHeader = showInHeader;
      if (headerType !== undefined) updateData.headerType = headerType;

      if (req.body.homeOrder !== undefined) {
        updateData.homeOrder = typeof req.body.homeOrder === 'number' ? req.body.homeOrder : parseInt(req.body.homeOrder) || 0;
      }
      if (req.body.headerOrder !== undefined) {
        updateData.headerOrder = typeof req.body.headerOrder === 'number' ? req.body.headerOrder : parseInt(req.body.headerOrder) || 0;
      }

      const checkName = updateData.name || category.name;
      const checkNameGu = updateData.nameGu || category.nameGu;
      const checkSlug = slug && typeof slug === 'string' ? slug.trim().toLowerCase() : category.slug;

      // Duplicate check against other categories
      const duplicateList = await prisma.category.findMany({
        where: {
          id: { not: id },
          OR: [
            { slug: checkSlug },
            { name: { equals: checkName } },
            { nameGu: { equals: checkNameGu } },
          ],
        },
      });

      if (duplicateList.length > 0) {
        throw new ConflictError(`Category with name "${checkName}" or slug "${checkSlug}" already exists! (આ નામ અથવા સ્લગ ધરાવતી કૅટેગરી પહેલાથી જ હયાત છે)`);
      }

      if (slug && typeof slug === 'string') {
        updateData.slug = checkSlug;
      }

      const updated = await prisma.category.update({
        where: { id },
        data: updateData,
      });

      clearPublicRoutesCache();
      return sendSuccess(res, updated, 'Category updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder categories batch update.
   */
  static async reorderCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, target } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Items array is required for reordering.');
      }

      // Check all display orders are non-negative
      for (const item of items) {
        const orderVal = typeof item.displayOrder === 'number' ? item.displayOrder : parseInt(item.displayOrder);
        if (isNaN(orderVal) || orderVal < 0) {
          throw new BadRequestError('Category order must be a positive number or zero (0 કે તેથી વધુ ધન સંખ્યા હોવી જોઈએ).');
        }
      }

      await prisma.$transaction(
        items.map((item: { id: string; displayOrder: number; headerOrder?: number; homeOrder?: number }) => {
          const val = typeof item.displayOrder === 'number' ? item.displayOrder : (parseInt(item.displayOrder as any) || 0);
          const updateData: any = {};
          if (target === 'header') {
            updateData.headerOrder = typeof item.headerOrder === 'number' ? item.headerOrder : val;
          } else if (target === 'home') {
            updateData.homeOrder = typeof item.homeOrder === 'number' ? item.homeOrder : val;
          } else {
            updateData.displayOrder = val;
          }
          return prisma.category.update({
            where: { id: item.id },
            data: updateData,
          });
        })
      );

      let orderBy: any = [{ displayOrder: 'desc' }];
      if (target === 'home') {
        orderBy = [{ homeOrder: 'desc' }, { displayOrder: 'desc' }];
      } else if (target === 'header') {
        orderBy = [{ headerOrder: 'desc' }, { displayOrder: 'desc' }];
      }

      const categories = await prisma.category.findMany({
        orderBy,
      });

      clearPublicRoutesCache();
      return sendSuccess(res, categories, 'Categories reordered successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category.
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Restrict deletion if there are posts assigned to this category
      const postsCount = await prisma.post.count({
        where: { categoryId: id },
      });
      if (postsCount > 0) {
        throw new BadRequestError('Cannot delete category: posts are associated with it.');
      }

      await prisma.category.delete({
        where: { id },
      });

      clearPublicRoutesCache();
      return sendSuccess(res, null, 'Category deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}
