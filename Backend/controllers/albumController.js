const AlbumModel = require('../models/albumModel');
const { slugify } = require('../utils/helpers');

// @desc    Get all albums
// @route   GET /api/albums
// @access  Public
const listAlbums = async (req, res, next) => {
  try {
    const albums = await AlbumModel.findAll();
    res.status(200).json({
      success: true,
      data: albums
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single album by ID or Slug
// @route   GET /api/albums/:idOrSlug
// @access  Public
const getAlbum = async (req, res, next) => {
  const { idOrSlug } = req.params;
  try {
    let album = null;
    if (/^\d+$/.test(idOrSlug)) {
      album = await AlbumModel.findById(Number(idOrSlug));
    } else {
      album = await AlbumModel.findBySlug(idOrSlug);
    }

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an album
// @route   POST /api/albums
// @access  Private (Requires super_admin, editor, or photographer role)
const createAlbum = async (req, res, next) => {
  const { title, description, cover_image_id, images } = req.body;

  try {
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an album title.'
      });
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) {
      baseSlug = 'album-' + Date.now();
    }
    let finalSlug = baseSlug;
    let isSlugUnique = false;
    let counter = 0;
    while (!isSlugUnique) {
      const checkSlug = counter === 0 ? finalSlug : `${finalSlug}-${counter}`;
      const existing = await AlbumModel.findBySlug(checkSlug);
      if (!existing) {
        isSlugUnique = true;
        if (counter > 0) finalSlug = `${finalSlug}-${counter}`;
      } else {
        counter++;
      }
    }

    const albumId = await AlbumModel.create({
      title,
      slug: finalSlug,
      description,
      cover_image_id: cover_image_id || null
    });

    // Sync images if provided
    if (images && Array.isArray(images)) {
      await AlbumModel.syncImages(albumId, images);
    }

    const newAlbum = await AlbumModel.findById(albumId);

    res.status(201).json({
      success: true,
      message: 'Album created successfully.',
      data: newAlbum
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an album
// @route   PUT /api/albums/:id
// @access  Private (Requires super_admin, editor, or photographer role)
const updateAlbum = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const { title, description, cover_image_id, images } = req.body;

  try {
    const album = await AlbumModel.findById(targetId);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found.'
      });
    }

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (cover_image_id !== undefined) updateData.cover_image_id = cover_image_id;

    if (title !== undefined && title !== album.title) {
      updateData.title = title;
      // Generate new unique slug
      let baseSlug = slugify(title);
      if (!baseSlug) {
        baseSlug = 'album-' + Date.now();
      }
      let finalSlug = baseSlug;
      let isSlugUnique = false;
      let counter = 0;
      while (!isSlugUnique) {
        const checkSlug = counter === 0 ? finalSlug : `${finalSlug}-${counter}`;
        const existing = await AlbumModel.findBySlug(checkSlug);
        // It's fine if the existing matches the current album
        if (!existing || existing.id === targetId) {
          isSlugUnique = true;
          if (counter > 0) finalSlug = `${finalSlug}-${counter}`;
        } else {
          counter++;
        }
      }
      updateData.slug = finalSlug;
    }

    // Perform metadata update if there is any field to update
    if (Object.keys(updateData).length > 0) {
      await AlbumModel.update(targetId, updateData);
    }

    // Sync images if provided
    if (images && Array.isArray(images)) {
      await AlbumModel.syncImages(targetId, images);
    }

    const updatedAlbum = await AlbumModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Album updated successfully.',
      data: updatedAlbum
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an album
// @route   DELETE /api/albums/:id
// @access  Private (Requires super_admin, editor, or photographer role)
const deleteAlbum = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const album = await AlbumModel.findById(targetId);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found.'
      });
    }

    await AlbumModel.delete(targetId);

    res.status(200).json({
      success: true,
      message: 'Album deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  deleteAlbum
};
