export type ErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: any;

  constructor(code: ErrorCode, message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper functions to create specific error types
export function NotFoundError(resource: string, id?: string) {
  const message = id
    ? `${resource} with id ${id} not found`
    : `${resource} not found`;
  return new AppError('NOT_FOUND', message, 404);
}

export function ValidationError(message: string, details?: any) {
  return new AppError('VALIDATION_ERROR', message, 400, details);
}

export function UnauthorizedError(message = 'Unauthorized') {
  return new AppError('UNAUTHORIZED', message, 401);
}

export function ForbiddenError(message = 'Forbidden') {
  return new AppError('FORBIDDEN', message, 403);
}

export function InvalidRequestError(message: string, details?: any) {
  return new AppError('INVALID_REQUEST', message, 400, details);
}

export function InternalError(message = 'Internal server error', details?: any) {
  return new AppError('INTERNAL_ERROR', message, 500, details);
} 