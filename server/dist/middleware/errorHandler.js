import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
export function errorHandler(err, req, res, next) {
    logger.logError(err, req);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: err.message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
    }
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database operation failed',
                ...(process.env.NODE_ENV === 'development' && {
                    details: err.message,
                    stack: err.stack
                })
            }
        });
    }
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            ...(process.env.NODE_ENV === 'development' && {
                details: err.message,
                stack: err.stack
            })
        }
    });
}
//# sourceMappingURL=errorHandler.js.map