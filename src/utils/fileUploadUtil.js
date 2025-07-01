// src/utils/fileUploadUtil.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');

// Ensure the reports upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'reports');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Generate a secure filename: timestamp + random string + original extension
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const safeFilename = `${timestamp}-${randomString}${extension}`;

    cb(null, safeFilename);
  }
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  // Array of allowed file types
  const allowedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, JPEG, PNG, DOC, DOCX, TXT`), false);
  }
};

// Size limits (10MB)
const limits = {
  fileSize: 10 * 1024 * 1024 // 10MB in bytes
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

// Handler function to wrap multer's upload.single in a promise to use with async/await
const uploadReportFile = (fieldName) => {
  return async function(req, res, next) {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'File too large',
            message: 'The uploaded file exceeds the maximum size limit of 10MB',
            code: 'FILE_TOO_LARGE'
          });
        }

        logger.error(`Multer upload error: ${err.message}`);
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          message: err.message,
          code: 'UPLOAD_ERROR'
        });
      } else if (err) {
        // An unknown error occurred
        logger.error(`File upload error: ${err.message}`);
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          message: err.message,
          code: 'UPLOAD_ERROR'
        });
      }

      // If no file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please provide a file to upload',
          code: 'NO_FILE'
        });
      }

      // Deep content validation has been removed
      // Success! Continue to the next middleware
      next();
    });
  };
};

// Helper function to safely delete files
const deleteFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted successfully: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error deleting file ${filePath}: ${error.message}`);
    return false;
  }
};

module.exports = {
  uploadReportFile,
  deleteFile,
  UPLOAD_DIR
};
