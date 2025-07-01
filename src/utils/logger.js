// src/utils/logger.js
const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const LOG_DIRECTORY = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIRECTORY)) {
  fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIRECTORY, 'application.log');

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  let metaString = '';
  
  if (Object.keys(meta).length > 0) {
    try {
      metaString = JSON.stringify(meta);
    } catch (e) {
      metaString = '[Error serializing metadata]';
    }
  }
  
  return `[${timestamp}] [${level}] ${message} ${metaString}\n`;
}

function log(level, message, meta = {}) {
  const formattedMessage = formatMessage(level, message, meta);
  
  // Log to console
  console.log(formattedMessage);
  
  // Log to file
  fs.appendFileSync(LOG_FILE, formattedMessage);
}

const logger = {
  error: (message, meta = {}) => log(LOG_LEVELS.ERROR, message, meta),
  warn: (message, meta = {}) => log(LOG_LEVELS.WARN, message, meta),
  info: (message, meta = {}) => log(LOG_LEVELS.INFO, message, meta),
  debug: (message, meta = {}) => log(LOG_LEVELS.DEBUG, message, meta),
};

module.exports = logger;
