const LiveUpdateModel = require('../models/liveUpdateModel');

// @desc    List all live updates
// @route   GET /api/live-updates
// @access  Public
const listLiveUpdates = async (req, res) => {
  try {
    const updates = await LiveUpdateModel.findAll();
    res.status(200).json({
      success: true,
      data: updates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live updates.',
      error: error.message
    });
  }
};

// @desc    Create live update
// @route   POST /api/live-updates
// @access  Protected (Admin/Editor)
const createLiveUpdate = async (req, res) => {
  try {
    const { time_text, title, is_alert, youtube_url } = req.body;
    if (!time_text || !title || !youtube_url) {
      return res.status(400).json({
        success: false,
        message: 'Time text, headline title, and YouTube URL are required.'
      });
    }

    const insertId = await LiveUpdateModel.create({
      time_text,
      title,
      is_alert: is_alert ? 1 : 0,
      youtube_url: youtube_url || null
    });

    const newUpdate = await LiveUpdateModel.findById(insertId);
    res.status(201).json({
      success: true,
      message: 'Live update created successfully.',
      data: newUpdate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create live update.',
      error: error.message
    });
  }
};

// @desc    Update live update
// @route   PUT /api/live-updates/:id
// @access  Protected (Admin/Editor)
const updateLiveUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { time_text, title, is_alert, youtube_url } = req.body;

    if (youtube_url !== undefined && !youtube_url) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required.'
      });
    }

    const existing = await LiveUpdateModel.findById(id);
    if (!existing) {
      return res.status(444).json({
        success: false,
        message: 'Live update not found.'
      });
    }

    await LiveUpdateModel.update(id, {
      time_text,
      title,
      is_alert: is_alert !== undefined ? (is_alert ? 1 : 0) : undefined,
      youtube_url: youtube_url !== undefined ? youtube_url : undefined
    });

    const updated = await LiveUpdateModel.findById(id);
    res.status(200).json({
      success: true,
      message: 'Live update updated successfully.',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update live update.',
      error: error.message
    });
  }
};

// @desc    Delete live update
// @route   DELETE /api/live-updates/:id
// @access  Protected (Admin/Editor)
const deleteLiveUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await LiveUpdateModel.findById(id);
    if (!existing) {
      return res.status(444).json({
        success: false,
        message: 'Live update not found.'
      });
    }

    await LiveUpdateModel.delete(id);
    res.status(200).json({
      success: true,
      message: 'Live update deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete live update.',
      error: error.message
    });
  }
};

module.exports = {
  listLiveUpdates,
  createLiveUpdate,
  updateLiveUpdate,
  deleteLiveUpdate
};
