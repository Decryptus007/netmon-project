import { logger } from '../utils/logger.js';
export function requestLogger(req, res, next) {
    const start = process.hrtime();
    if (req.body && Object.keys(req.body).length > 0 && !req.is('multipart/form-data')) {
        logger.debug('Request body:', { body: req.body });
    }
    if (req.query && Object.keys(req.query).length > 0) {
        logger.debug('Query parameters:', { query: req.query });
    }
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const responseTime = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
        logger.logRequest(req, res, responseTime);
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map