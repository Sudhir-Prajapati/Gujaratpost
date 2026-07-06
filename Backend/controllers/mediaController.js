const fs = require('fs');
const path = require('path');
const MediaModel = require('../models/mediaModel');

// Helper to construct public file URL
const getPublicUrl = (req, filepath) => {
  const host = req.get('host');
  // Normalize Windows paths if needed, but since we use relative path in DB like uploads/images/..., forward slash works fine
  const normalizedPath = filepath.replace(/\\/g, '/');
  return `${req.protocol}://${host}/${normalizedPath}`;
};

// @desc    Upload an image
// @route   POST /api/upload/image
// @access  Private (Requires super_admin, editor, reporter, or photographer role)
const uploadImageFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file to upload.'
      });
    }

    const relativePath = `/uploads/images/${req.file.filename}`;
    
    // Save metadata to DB
    const mediaId = await MediaModel.create({
      filename: req.file.filename,
      filepath: relativePath,
      filetype: 'image',
      mime_type: req.file.mimetype,
      size: req.file.size,
      user_id: req.user.id
    });

    const mediaRecord = await MediaModel.findById(mediaId);
    const publicUrl = getPublicUrl(req, relativePath);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        ...mediaRecord,
        url: publicUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload a video
// @route   POST /api/upload/video
// @access  Private (Requires super_admin, editor, reporter, or photographer role)
const uploadVideoFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a video file to upload.'
      });
    }

    const relativePath = `/uploads/videos/${req.file.filename}`;
    
    // Save metadata to DB
    const mediaId = await MediaModel.create({
      filename: req.file.filename,
      filepath: relativePath,
      filetype: 'video',
      mime_type: req.file.mimetype,
      size: req.file.size,
      user_id: req.user.id
    });

    const mediaRecord = await MediaModel.findById(mediaId);
    const publicUrl = getPublicUrl(req, relativePath);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully.',
      data: {
        ...mediaRecord,
        url: publicUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all media library records
// @route   GET /api/media
// @access  Private (Requires admin or staff role)
const listMedia = async (req, res, next) => {
  try {
    const mediaList = await MediaModel.findAll();
    
    // Map with public URLs
    const data = mediaList.map(item => ({
      ...item,
      url: getPublicUrl(req, item.filepath)
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete media from library and disk
// @route   DELETE /api/media/:id
// @access  Private (Admins or the uploading owner)
const deleteMedia = async (req, res, next) => {
  const mediaId = Number(req.params.id);
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    // 1. Fetch media details
    const media = await MediaModel.findById(mediaId);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found.'
      });
    }

    // 2. Authorization Check:
    // Only super_admin or editor can delete any media. 
    // Reporters and photographers can only delete their own uploaded files.
    const isAuthorizedToDelete = 
      ['super_admin', 'editor'].includes(currentUserRole) || 
      (media.user_id === currentUserId);

    if (!isAuthorizedToDelete) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this media file.'
      });
    }

    // 3. Delete physical file from filesystem
    const absoluteFilePath = path.join(__dirname, '..', media.filepath);
    
    if (fs.existsSync(absoluteFilePath)) {
      try {
        fs.unlinkSync(absoluteFilePath);
      } catch (err) {
        console.error(`Failed to delete file on disk at ${absoluteFilePath}:`, err.message);
      }
    } else {
      console.warn(`File on disk not found at ${absoluteFilePath} during media deletion.`);
    }

    // 4. Delete DB record
    await MediaModel.delete(mediaId);

    res.status(200).json({
      success: true,
      message: 'Media file deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImageFile,
  uploadVideoFile,
  listMedia,
  deleteMedia
};
