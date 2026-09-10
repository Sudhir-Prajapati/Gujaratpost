import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { cloudinary } from '../config/cloudinary.js';

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

// Disk storage for 100% reliable file saving before Cloudinary stream upload
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueName = `${cleanBase}_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (!file) return cb(null, false);
  const mimetype = (file.mimetype || '').toLowerCase();
  const originalName = (file.originalname || '').toLowerCase();

  const isMimeOk =
    mimetype.startsWith('image/') ||
    mimetype.startsWith('video/') ||
    mimetype === 'application/pdf' ||
    mimetype === 'application/x-pdf' ||
    mimetype === 'application/octet-stream';

  const isExtOk = /\.(jpg|jpeg|png|gif|webp|jfif|pjpeg|avif|svg|bmp|mp4|webm|mov|mkv|pdf)$/i.test(originalName);

  if (isMimeOk || isExtOk) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image, video, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB max limit
  },
  fileFilter,
});

const handleUpload = (req: any, res: any) => {
  // Support 'file', 'image', 'video', 'pdf', 'photo', and 'avatar' field names
  const singleUpload = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
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
      (req.files &&
        (req.files.file?.[0] ||
          req.files.image?.[0] ||
          req.files.video?.[0] ||
          req.files.pdf?.[0] ||
          req.files.photo?.[0] ||
          req.files.avatar?.[0]));

    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const filePath = uploadedFile.path;
    const isPdf = uploadedFile.originalname?.toLowerCase().endsWith('.pdf') || uploadedFile.mimetype?.includes('pdf');
    const totalPages = isPdf && filePath ? getPdfPageCount(filePath) : undefined;

    try {
      // Determine resource_type for Cloudinary ('image', 'video', or 'raw')
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (isPdf) resourceType = 'raw';
      else if (uploadedFile.mimetype?.startsWith('image/')) resourceType = 'image';
      else if (uploadedFile.mimetype?.startsWith('video/')) resourceType = 'video';

      console.log(`📤 Uploading to Cloudinary [${uploadedFile.originalname}] resourceType=${resourceType}...`);

      let result: any;
      try {
        result = await cloudinary.uploader.upload(filePath, {
          folder: 'gujarat-post',
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        });
      } catch (uploadErr) {
        if (isPdf) {
          console.warn('⚠️ Cloudinary raw upload retry for PDF:', uploadErr);
          result = await cloudinary.uploader.upload(filePath, {
            folder: 'gujarat-post',
            resource_type: 'raw',
          });
        } else {
          throw uploadErr;
        }
      }

      let fileUrl = result?.secure_url || result?.url;
      if (isPdf) {
        const localFilename = path.basename(filePath);
        fileUrl = `/uploads/${localFilename}`;
      } else if (fileUrl && fileUrl.includes('res.cloudinary.com')) {
        fileUrl = fileUrl.replace('/raw/upload/', '/image/upload/');
      }
      console.log(`✅ Upload Success: ${fileUrl}`);

      // Clean up temporary local file for non-PDFs (preserve local PDF file for native 100% reliable PDF download)
      if (!isPdf && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch { }
      }

      return res.status(200).json({
        success: true,
        url: fileUrl,
        data: {
          url: fileUrl,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          totalPages,
        },
      });
    } catch (cloudinaryErr: any) {
      console.error('⚠️ Cloudinary Upload Error, falling back to local URL:', cloudinaryErr?.message || cloudinaryErr);

      // Fallback: Return local upload URL if Cloudinary fails
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      const localUrl = `${protocol}://${host}/uploads/${uploadedFile.filename}`;

      return res.status(200).json({
        success: true,
        url: localUrl,
        data: {
          url: localUrl,
          totalPages,
        },
      });
    }
  });
};

router.post('/', handleUpload);
router.post('/image', handleUpload);
router.post('/video', handleUpload);

router.get('/download-pdf', async (req: any, res: any) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Clean duplicate fl_attachment
    let cleanUrl = rawUrl.trim().replace(/\/fl_attachment\/+/g, '/');

    // If local upload file
    if (cleanUrl.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), cleanUrl);
      if (fs.existsSync(localPath)) {
        return res.download(localPath, path.basename(localPath));
      }
    }

    // If HTTP / HTTPS URL
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      let fetchUrl = cleanUrl;
      if (fetchUrl.includes('res.cloudinary.com') && fetchUrl.includes('/upload/') && !fetchUrl.includes('/fl_attachment/')) {
        fetchUrl = fetchUrl.replace('/upload/', '/upload/fl_attachment/');
      }

      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          let filename = path.basename(cleanUrl.split('?')[0]) || 'Official_Document.pdf';
          if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return res.send(buffer);
        }
      } catch (e) {
        console.warn('Fetch error in proxy, trying raw URL:', e);
      }

      // Try raw Cloudinary URL fallback
      let rawCloudUrl = cleanUrl.replace('/image/upload/', '/raw/upload/');
      try {
        const rawRes = await fetch(rawCloudUrl);
        if (rawRes.ok) {
          const arrayBuf = await rawRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          let filename = path.basename(cleanUrl.split('?')[0]) || 'Official_Document.pdf';
          if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return res.send(buffer);
        }
      } catch (e) {}

      // Final fallback: Redirect to clean URL with fl_attachment
      return res.redirect(fetchUrl);
    }

    return res.status(404).json({ error: 'File not found' });
  } catch (err: any) {
    console.error('PDF proxy download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
