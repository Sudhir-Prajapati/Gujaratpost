const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const uploadImagesDir = path.join(__dirname, '../uploads/images');
const uploadVideosDir = path.join(__dirname, '../uploads/videos');

if (!fs.existsSync(uploadImagesDir)) {
  fs.mkdirSync(uploadImagesDir, { recursive: true });
}
if (!fs.existsSync(uploadVideosDir)) {
  fs.mkdirSync(uploadVideosDir, { recursive: true });
}

// Storage configuration for Images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'image-' + uniqueSuffix + path.extname(file.originalname).toLowerCase()
    );
  }
});

// Storage configuration for Videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadVideosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'video-' + uniqueSuffix + path.extname(file.originalname).toLowerCase()
    );
  }
});

// File validation filter for Images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|jfif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error('Error: Only images (jpeg, jpg, png, gif, webp, jfif) are allowed!')
    );
  }
};

// File validation filter for Videos
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mkv|avi|mov|webm/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error('Error: Only videos (mp4, mkv, avi, mov, webm) are allowed!')
    );
  }
};

// Multer instances
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: imageFilter
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
  fileFilter: videoFilter
});

// Storage configuration for PDFs
const pdfDir = path.join(__dirname, '../uploads/pdfs');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'epaper-' + uniqueSuffix + path.extname(file.originalname).toLowerCase()
    );
  }
});

const pdfFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase() === '.pdf';
  const mimetype = file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only PDF documents are allowed!'));
  }
};

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Max 25MB
  fileFilter: pdfFilter
});

// Storage configuration for joint ePaper (PDF + cover image)
const epaperStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'pdf') {
      cb(null, path.join(__dirname, '../uploads/pdfs'));
    } else {
      cb(null, path.join(__dirname, '../uploads/images'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const prefix = file.fieldname === 'pdf' ? 'epaper-' : 'epaper-thumb-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const epaperFilter = (req, file, cb) => {
  if (file.fieldname === 'pdf') {
    const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf' && file.mimetype === 'application/pdf';
    if (isPdf) return cb(null, true);
    return cb(new Error('Only PDF documents allowed for the ePaper file field.'));
  } else if (file.fieldname === 'thumbnail') {
    const allowedTypes = /jpeg|jpg|png|webp|jfif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    return cb(new Error('Only images (jpg, png, webp, jfif) allowed for ePaper thumbnail field.'));
  }
  cb(null, true);
};

const uploadEpaperFiles = multer({
  storage: epaperStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Max 255MB
  fileFilter: epaperFilter
});

module.exports = {
  uploadImage,
  uploadVideo,
  uploadPdf,
  uploadEpaperFiles
};
