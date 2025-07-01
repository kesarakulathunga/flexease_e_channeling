// src/utils/fileValidationUtil.js
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Validates a file's content beyond just MIME type checking
 * - Performs basic scans to detect potential security issues
 * - Calculates file hash for content integrity
 * - Checks for binary content in text files
 * 
 * @param {Object} file - The uploaded file object from multer
 * @returns {Object} - Validation result with status and metadata
 */
const validateFileContent = async (file) => {
  try {
    if (!file || !file.path) {
      return { 
        valid: false, 
        reason: 'Invalid file object', 
        metadata: {} 
      };
    }

    // Read file for analysis
    const buffer = fs.readFileSync(file.path);
    
    // Calculate file hash for integrity
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Basic content checks
    const fileMetadata = {
      hash: fileHash,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname
    };

    // Simplified malware signature check (this would be more complex in production)
    // Looking for common executable signatures or suspicious patterns
    const suspiciousPatterns = [
      Buffer.from('4D5A', 'hex'),     // MZ header (Windows executables)
      Buffer.from('504B0304', 'hex'), // PK header (potentially malicious ZIP)
      Buffer.from('<script>', 'utf8') // Basic XSS check for HTML/text files
    ];

    // Check for suspicious patterns in file content
    for (const pattern of suspiciousPatterns) {
      if (buffer.includes(pattern)) {
        logger.warn(`Suspicious content detected in file: ${file.originalname}`);
        return {
          valid: false,
          reason: 'File contains potentially malicious content',
          metadata: fileMetadata
        };
      }
    }

    // Additional checks for text-based files
    if (file.mimetype.startsWith('text/')) {
      // Check for binary content in text files (basic heuristic)
      const hasBinaryContent = buffer.some(byte => byte === 0);
      if (hasBinaryContent) {
        return {
          valid: false,
          reason: 'Text file contains binary content',
          metadata: fileMetadata
        };
      }
    }

    // File passed all checks
    return {
      valid: true,
      reason: 'File content validated',
      metadata: fileMetadata
    };
  } catch (error) {
    logger.error(`Error validating file content: ${error.message}`);
    return {
      valid: false,
      reason: `Validation error: ${error.message}`,
      metadata: {
        originalName: file?.originalname || 'unknown'
      }
    };
  }
};

/**
 * Tracks file upload metrics
 * @param {Object} file - The uploaded file
 * @param {Object} metadata - Additional metadata
 */
const trackFileUpload = (file, metadata = {}) => {
  try {
    const uploadRecord = {
      timestamp: new Date().toISOString(),
      fileSize: file.size,
      fileName: file.originalname,
      mimeType: file.mimetype,
      patientId: metadata.patientId || 'unknown',
      ...metadata
    };
    
    // In a production environment, we would store this in a database or send to a monitoring service
    logger.info(`File upload tracked: ${JSON.stringify(uploadRecord)}`);
    
    return true;
  } catch (error) {
    logger.error(`Error tracking file upload: ${error.message}`);
    return false;
  }
};

module.exports = {
  validateFileContent,
  trackFileUpload
};
