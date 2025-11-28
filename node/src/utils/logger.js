/**
 * Winston Logger Configuration
 * Provides structured logging for production and development environments
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}] ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'v2v-backend' },
    transports: [
        // Error log - only errors
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined log - all levels
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Access log - for HTTP requests
        new winston.transports.File({
            filename: path.join(logsDir, 'access.log'),
            level: 'http',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
    }));
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Helper methods for common logging patterns
logger.logRequest = (req, statusCode, responseTime) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.url,
        status: statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
};

logger.logAlert = (alertKey, ephemeralId, hazardType, location) => {
    logger.info('Alert verified', {
        alertKey,
        ephemeralId,
        hazardType,
        location,
        timestamp: new Date().toISOString(),
    });
};

logger.logBlockchain = (action, details) => {
    logger.info('Blockchain operation', {
        action,
        ...details,
        timestamp: new Date().toISOString(),
    });
};

logger.logSignature = (valid, ephemeralId, reason) => {
    if (valid) {
        logger.info('Signature verified', { ephemeralId });
    } else {
        logger.warn('Signature verification failed', { ephemeralId, reason });
    }
};

logger.logError = (context, error, additionalInfo = {}) => {
    logger.error(`Error in ${context}`, {
        error: error.message,
        stack: error.stack,
        ...additionalInfo,
    });
};

module.exports = logger;
