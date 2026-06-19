const TagModel = require('../models/tagModel');
const { slugify } = require('../utils/helpers');

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
const listTags = async (req, res, next) => {
  try {
    const tags = await TagModel.findAll();
    res.status(200).json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single tag by ID or Slug
// @route   GET /api/tags/:idOrSlug
// @access  Public
const getTag = async (req, res, next) => {
  const { idOrSlug } = req.params;

  try {
    let tag = null;

    if (/^\d+$/.test(idOrSlug)) {
      tag = await TagModel.findById(Number(idOrSlug));
    } else {
      tag = await TagModel.findBySlug(idOrSlug);
    }

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a tag
// @route   POST /api/tags
// @access  Private (Requires super_admin, editor, or reporter role)
const createTag = async (req, res, next) => {
  const { name, slug } = req.body;

  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a tag name.'
      });
    }

    const finalSlug = slugify(slug || name);

    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        message: 'Could not generate a valid slug from the tag name.'
      });
    }

    // Check duplicates
    const tags = await TagModel.findAll();
    const isNameDup = tags.some(t => t.name.toLowerCase() === name.toLowerCase());
    const isSlugDup = tags.some(t => t.slug === finalSlug);

    if (isNameDup) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name already exists.'
      });
    }

    if (isSlugDup) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this slug already exists.'
      });
    }

    const tagId = await TagModel.create({
      name,
      slug: finalSlug
    });

    const newTag = await TagModel.findById(tagId);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully.',
      data: newTag
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a tag
// @route   PUT /api/tags/:id
// @access  Private (Requires super_admin or editor role)
const updateTag = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const { name, slug } = req.body;

  try {
    const tag = await TagModel.findById(targetId);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found.'
      });
    }

    let finalSlug = undefined;
    if (slug !== undefined) {
      finalSlug = slugify(slug || name || tag.name);
    } else if (name !== undefined) {
      finalSlug = slugify(name);
    }

    const tags = await TagModel.findAll();

    if (name !== undefined && name.toLowerCase() !== tag.name.toLowerCase()) {
      const isNameDup = tags.some(t => t.id !== targetId && t.name.toLowerCase() === name.toLowerCase());
      if (isNameDup) {
        return res.status(400).json({
          success: false,
          message: 'Tag with this name already exists.'
        });
      }
    }

    if (finalSlug !== undefined && finalSlug !== tag.slug) {
      const isSlugDup = tags.some(t => t.id !== targetId && t.slug === finalSlug);
      if (isSlugDup) {
        return res.status(400).json({
          success: false,
          message: 'Tag with this slug already exists.'
        });
      }
    }

    await TagModel.update(targetId, {
      name,
      slug: finalSlug
    });

    const updatedTag = await TagModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully.',
      data: updatedTag
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a tag
// @route   DELETE /api/tags/:id
// @access  Private (Requires super_admin or editor role)
const deleteTag = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const tag = await TagModel.findById(targetId);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found.'
      });
    }

    await TagModel.delete(targetId);

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTags,
  getTag,
  createTag,
  updateTag,
  deleteTag
};
