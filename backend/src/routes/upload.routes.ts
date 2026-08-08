import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// Ensure local uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Extract PDF total page count dynamically from PDF metadata catalog
function getPdfPageCount(filePath: string): number {
  try {
    const data = fs.readFileSync(filePath);
    const text = data.toString('latin1');
    const matches = text.match(/\/Count\s+(\d+)/g);
    if (matches && matches.length > 0) {
      const counts = matches
        .map((m) => parseInt(m.replace(/\/Count\s+/, ''), 10))
        .filter((n) => !isNaN(n) && n > 0 && n < 1000);
      if (counts.length > 0) {
        return Math.max(...counts);
      }
    }
  } catch (err) {
    console.warn('PDF page count calculation error:', err);
  }
  return 24;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvcffkyjz',
  api_key: process.env.CLOUDINARY_API_KEY || '495845865934762',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ea99jiIs2CS9jRYnPpTmF9PjNIM',
});

// Disk storage for 100% reliable local file saving with correct extension
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueName = `${cleanBase}_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (!file) return cb(null, false);
  const mimetype = (file.mimetype || '').toLowerCase();
  const originalName = (file.originalname || '').toLowerCase();

  const isImageMime = mimetype.startsWith('image/') || mimetype.startsWith('video/') || mimetype === 'application/octet-stream';
  const isImageExt = /\.(jpg|jpeg|png|gif|webp|jfif|pjpeg|avif|svg|bmp|mp4|webm|mov|mkv)$/i.test(originalName);

  if (isAllowedMime || isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image and video files are allowed.'), false);
  }
};

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Increased to 100MB for videos
  },
  fileFilter,
});

const handleUpload = (req: any, res: any) => {
  // Support multiple common field names in Multer
  const singleUpload = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ]);

  singleUpload(req, res, async (err: any) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ success: false, error: err.message || 'File upload error.' });
    }

    const uploadedFile =
      req.file ||
      (req.files && (req.files.file?.[0] || req.files.image?.[0] || req.files.photo?.[0] || req.files.avatar?.[0]));

    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    // Construct local fallback URL
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const localUrl = `/uploads/${uploadedFile.filename}`;
    const fullLocalUrl = `${protocol}://${host}${localUrl}`;

    // Read buffer if diskStorage was used
    const fileBuffer =
      uploadedFile.buffer ||
      (uploadedFile.path && fs.existsSync(uploadedFile.path) ? fs.readFileSync(uploadedFile.path) : null);

    if (!fileBuffer) {
      return res.status(200).json({
        success: true,
        url: fullLocalUrl,
        data: { url: fullLocalUrl },
      });
    }

    // Attempt upload to Cloudinary stream with automatic local fallback
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'gujarat-post',
          resource_type: 'auto',
        },
        (uploadErr: any, result: any) => {
          // Clean up temp disk file after Cloudinary upload
          if (uploadedFile.path && fs.existsSync(uploadedFile.path)) {
            try {
              fs.unlinkSync(uploadedFile.path);
            } catch (e) {
              // Ignore cleanup error
            }
          }

          if (uploadErr) {
            console.warn('Cloudinary upload warning, using local file URL fallback:', uploadErr.message || uploadErr);
            return res.status(200).json({
              success: true,
              url: fullLocalUrl,
              data: { url: fullLocalUrl },
            });
          }

          const fileUrl = result?.secure_url || result?.url || fullLocalUrl;
          return res.status(200).json({
            success: true,
            url: fileUrl,
            data: { url: fileUrl },
          });
        }
      );

      uploadStream.end(fileBuffer);
    } catch (error: any) {
      console.warn('Upload route catch error, using local URL fallback:', error.message || error);
      return res.status(200).json({
        success: true,
        url: fullLocalUrl,
        data: { url: fullLocalUrl },
      });
    }
  });
};

router.post('/', handleUpload);
router.post('/image', handleUpload);

export default router;
