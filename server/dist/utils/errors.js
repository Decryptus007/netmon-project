export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function NotFoundError(resource, id) {
    const message = id
        ? `${resource} with id ${id} not found`
        : `${resource} not found`;
    return new AppError('NOT_FOUND', message, 404);
}
export function ValidationError(message, details) {
    return new AppError('VALIDATION_ERROR', message, 400, details);
}
export function UnauthorizedError(message = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', message, 401);
}
export function ForbiddenError(message = 'Forbidden') {
    return new AppError('FORBIDDEN', message, 403);
}
export function InvalidRequestError(message, details) {
    return new AppError('INVALID_REQUEST', message, 400, details);
}
export function InternalError(message = 'Internal server error', details) {
    return new AppError('INTERNAL_ERROR', message, 500, details);
}
//# sourceMappingURL=errors.js.map