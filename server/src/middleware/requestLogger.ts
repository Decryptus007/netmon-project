import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Record start time
  const start = process.hrtime();

  // Log request body if present and not a file upload
  if (req.body && Object.keys(req.body).length > 0 && !req.is('multipart/form-data')) {
    logger.debug('Request body:', { body: req.body });
  }

  // Log query parameters if present
  if (req.query && Object.keys(req.query).length > 0) {
    logger.debug('Query parameters:', { query: req.query });
  }

  // Process the request and log response
  res.on('finish', () => {
    // Calculate response time
    const diff = process.hrtime(start);
    const responseTime = Math.round((diff[0] * 1e9 + diff[1]) / 1e6); // Convert to milliseconds

    logger.logRequest(req, res, responseTime);
  });

  next();
} 