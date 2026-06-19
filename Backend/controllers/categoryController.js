const CategoryModel = require('../models/categoryModel');
const { slugify } = require('../utils/helpers');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const listCategories = async (req, res, next) => {
  try {
    const categories = await CategoryModel.findAll();
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single category by ID or Slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
const getCategory = async (req, res, next) => {
  const { idOrSlug } = req.params;

  try {
    let category = null;

    // Check if the parameter is a numeric ID
    if (/^\d+$/.test(idOrSlug)) {
      category = await CategoryModel.findById(Number(idOrSlug));
    } else {
      category = await CategoryModel.findBySlug(idOrSlug);
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Requires super_admin or editor role)
const createCategory = async (req, res, next) => {
  const { name, slug, description, is_location } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a category name.'
      });
    }

    // Auto-generate slug if not provided
    const finalSlug = slugify(slug || name);

    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        message: 'Could not generate a valid slug from the category name.'
      });
    }

    // Check if name or slug already exists
    const categories = await CategoryModel.findAll();
    const isNameDup = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    const isSlugDup = categories.some(c => c.slug === finalSlug);

    if (isNameDup) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists.'
      });
    }

    if (isSlugDup) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists.'
      });
    }

    // Insert to DB
    const categoryId = await CategoryModel.create({
      name,
      slug: finalSlug,
      description,
      is_location: is_location ? 1 : 0
    });

    const newCategory = await CategoryModel.findById(categoryId);

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Requires super_admin or editor role)
const updateCategory = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const { name, slug, description, is_location } = req.body;

  try {
    const category = await CategoryModel.findById(targetId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    let finalSlug = undefined;
    if (slug !== undefined) {
      finalSlug = slugify(slug || name || category.name);
    } else if (name !== undefined) {
      finalSlug = slugify(name);
    }

    // Check duplicates if name or slug is changing
    const categories = await CategoryModel.findAll();
    
    if (name !== undefined && name.toLowerCase() !== category.name.toLowerCase()) {
      const isNameDup = categories.some(c => c.id !== targetId && c.name.toLowerCase() === name.toLowerCase());
      if (isNameDup) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists.'
        });
      }
    }

    if (finalSlug !== undefined && finalSlug !== category.slug) {
      const isSlugDup = categories.some(c => c.id !== targetId && c.slug === finalSlug);
      if (isSlugDup) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists.'
        });
      }
    }

    // Update in DB
    await CategoryModel.update(targetId, {
      name,
      slug: finalSlug,
      description,
      is_location: is_location !== undefined ? (is_location ? 1 : 0) : undefined
    });

    const updatedCategory = await CategoryModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Requires super_admin or editor role)
const deleteCategory = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const category = await CategoryModel.findById(targetId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    await CategoryModel.delete(targetId);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
