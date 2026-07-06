const VideoModel = require('../models/videoModel');
const { slugify } = require('../utils/helpers');

/**
 * Helper to extract 11-character YouTube video ID from standard links
 * @param {string} url 
 * @returns {string|null}
 */
const extractYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
const listVideos = async (req, res, next) => {
  try {
    const videos = await VideoModel.findAll();
    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single video by ID or Slug
// @route   GET /api/videos/:idOrSlug
// @access  Public
const getVideo = async (req, res, next) => {
  const { idOrSlug } = req.params;
  try {
    let video = null;
    if (/^\d+$/.test(idOrSlug)) {
      video = await VideoModel.findById(Number(idOrSlug));
    } else {
      video = await VideoModel.findBySlug(idOrSlug);
    }

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a video
// @route   POST /api/videos
// @access  Private (Requires super_admin, editor, reporter, or photographer role)
const createVideo = async (req, res, next) => {
  const { title, description, video_type, video_url, thumbnail_image_id } = req.body;

  try {
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a video title.'
      });
    }

    if (!video_type || !['youtube', 'local'].includes(video_type)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid video type (youtube or local).'
      });
    }

    if (!video_url) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a video URL.'
      });
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) {
      baseSlug = 'video-' + Date.now();
    }
    let finalSlug = baseSlug;
    let isSlugUnique = false;
    let counter = 0;
    while (!isSlugUnique) {
      const checkSlug = counter === 0 ? finalSlug : `${finalSlug}-${counter}`;
      const existing = await VideoModel.findBySlug(checkSlug);
      if (!existing) {
        isSlugUnique = true;
        if (counter > 0) finalSlug = `${finalSlug}-${counter}`;
      } else {
        counter++;
      }
    }

    let youtubeVideoId = null;
    if (video_type === 'youtube') {
      youtubeVideoId = extractYoutubeId(video_url);
      if (!youtubeVideoId) {
        return res.status(400).json({
          success: false,
          message: 'Failed to extract a valid YouTube video ID from the provided URL.'
        });
      }
    }

    const videoId = await VideoModel.create({
      title,
      slug: finalSlug,
      description,
      video_type,
      video_url,
      youtube_video_id: youtubeVideoId,
      thumbnail_image_id: thumbnail_image_id || null
    });

    const newVideo = await VideoModel.findById(videoId);

    res.status(201).json({
      success: true,
      message: 'Video created successfully.',
      data: newVideo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a video
// @route   PUT /api/videos/:id
// @access  Private (Requires super_admin, editor, reporter, or photographer role)
const updateVideo = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const { title, description, video_type, video_url, thumbnail_image_id } = req.body;

  try {
    const video = await VideoModel.findById(targetId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (thumbnail_image_id !== undefined) updateData.thumbnail_image_id = thumbnail_image_id;

    if (title !== undefined && title !== video.title) {
      updateData.title = title;
      // Generate new unique slug
      let baseSlug = slugify(title);
      if (!baseSlug) {
        baseSlug = 'video-' + Date.now();
      }
      let finalSlug = baseSlug;
      let isSlugUnique = false;
      let counter = 0;
      while (!isSlugUnique) {
        const checkSlug = counter === 0 ? finalSlug : `${finalSlug}-${counter}`;
        const existing = await VideoModel.findBySlug(checkSlug);
        if (!existing || existing.id === targetId) {
          isSlugUnique = true;
          if (counter > 0) finalSlug = `${finalSlug}-${counter}`;
        } else {
          counter++;
        }
      }
      updateData.slug = finalSlug;
    }

    // Handle type/url updates and YouTube ID extraction
    const newType = video_type !== undefined ? video_type : video.video_type;
    const newUrl = video_url !== undefined ? video_url : video.video_url;

    if (video_type !== undefined || video_url !== undefined) {
      if (!['youtube', 'local'].includes(newType)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid video type (youtube or local).'
        });
      }
      if (!newUrl) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a video URL.'
        });
      }

      updateData.video_type = newType;
      updateData.video_url = newUrl;

      if (newType === 'youtube') {
        const youtubeVideoId = extractYoutubeId(newUrl);
        if (!youtubeVideoId) {
          return res.status(400).json({
            success: false,
            message: 'Failed to extract a valid YouTube video ID from the provided URL.'
          });
        }
        updateData.youtube_video_id = youtubeVideoId;
      } else {
        updateData.youtube_video_id = null;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await VideoModel.update(targetId, updateData);
    }

    const updatedVideo = await VideoModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Video updated successfully.',
      data: updatedVideo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private (Requires super_admin, editor, reporter, or photographer role)
const deleteVideo = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const video = await VideoModel.findById(targetId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    await VideoModel.delete(targetId);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listVideos,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo
};
