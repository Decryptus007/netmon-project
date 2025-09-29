import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';
export function validate(validations) {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));
        throw new ValidationError('Validation failed', formattedErrors);
    };
}
//# sourceMappingURL=validate.js.map