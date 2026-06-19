const EpaperModel = require('../models/epaperModel');
const fs = require('fs');
const path = require('path');

// @desc    List all ePaper issues
// @route   GET /api/epaper
// @access  Public
const listEpapers = async (req, res) => {
  try {
    const list = await EpaperModel.findAll();
    res.status(200).json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ePaper issues.',
      error: error.message
    });
  }
};

// @desc    Get latest active ePaper issue
// @route   GET /api/epaper/latest
// @access  Public
const getLatestEpaper = async (req, res) => {
  try {
    const latest = await EpaperModel.findLatest();
    res.status(200).json({
      success: true,
      data: latest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest ePaper.',
      error: error.message
    });
  }
};

// @desc    Create/Upload ePaper issue
// @route   POST /api/epaper
// @access  Protected (Admin/Editor)
const createEpaper = async (req, res) => {
  try {
    const { title, publish_date } = req.body;
    
    if (!title || !publish_date) {
      return res.status(400).json({
        success: false,
        message: 'Title and publish date are required.'
      });
    }

    if (!req.files || !req.files['pdf'] || !req.files['thumbnail']) {
      return res.status(400).json({
        success: false,
        message: 'Both PDF document and Cover Thumbnail image must be uploaded.'
      });
    }

    const pdfFile = req.files['pdf'][0];
    const thumbFile = req.files['thumbnail'][0];

    // Build static URL paths for frontend mapping
    const pdf_path = `/uploads/pdfs/${pdfFile.filename}`;
    const thumbnail_path = `/uploads/images/${thumbFile.filename}`;

    const insertId = await EpaperModel.create({
      title,
      thumbnail_path,
      pdf_path,
      publish_date
    });

    const newEpaper = await EpaperModel.findById(insertId);
    res.status(201).json({
      success: true,
      message: 'ePaper uploaded successfully.',
      data: newEpaper
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload ePaper.',
      error: error.message
    });
  }
};

// @desc    Delete ePaper issue
// @route   DELETE /api/epaper/:id
// @access  Protected (Admin/Editor)
const deleteEpaper = async (req, res) => {
  try {
    const { id } = req.params;
    const epaper = await EpaperModel.findById(id);
    if (!epaper) {
      return res.status(444).json({
        success: false,
        message: 'ePaper not found.'
      });
    }

    // Try deleting files from disk
    const rootDir = path.join(__dirname, '../');
    const pdfDiskPath = path.join(rootDir, epaper.pdf_path);
    const thumbDiskPath = path.join(rootDir, epaper.thumbnail_path);

    if (fs.existsSync(pdfDiskPath)) {
      try { fs.unlinkSync(pdfDiskPath); } catch(err) { console.error('Error deleting PDF:', err.message); }
    }
    if (fs.existsSync(thumbDiskPath)) {
      try { fs.unlinkSync(thumbDiskPath); } catch(err) { console.error('Error deleting Thumbnail:', err.message); }
    }

    await EpaperModel.delete(id);
    res.status(200).json({
      success: true,
      message: 'ePaper issue and files deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete ePaper.',
      error: error.message
    });
  }
};

module.exports = {
  listEpapers,
  getLatestEpaper,
  createEpaper,
  deleteEpaper
};
