import { ZodError } from "zod";
import { ValidationError } from "../utils/errors";
export function validateRequest(schema) {
    return async (fastify) => {
        fastify.addHook("preHandler", async (request) => {
            try {
                request.body = schema.parse(request.body);
            }
            catch (error) {
                if (error instanceof ZodError) {
                    throw ValidationError("Validation failed", error.issues);
                }
                throw error;
            }
        });
    };
}
export function validateParams(schema) {
    return async (fastify) => {
        fastify.addHook("preHandler", async (request) => {
            try {
                request.validatedParams = schema.parse(request.params);
            }
            catch (error) {
                if (error instanceof ZodError) {
                    throw ValidationError("Parameter validation failed", error.issues);
                }
                throw error;
            }
        });
    };
}
export function validateQuery(schema) {
    return async (fastify) => {
        fastify.addHook("preHandler", async (request) => {
            try {
                request.validatedQuery = schema.parse(request.query);
            }
            catch (error) {
                if (error instanceof ZodError) {
                    throw ValidationError("Query validation failed", error.issues);
                }
                throw error;
            }
        });
    };
}
export default validateRequest;
//# sourceMappingURL=validation.js.map