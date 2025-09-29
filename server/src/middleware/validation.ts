import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

export interface ValidatedRequest<T = any> extends FastifyRequest {
  body: T;
}

export function validateRequest<T>(schema: z.ZodSchema<T>): FastifyPluginAsync {
  return async (fastify) => {
    fastify.addHook("preHandler", async (request) => {
      try {
        request.body = schema.parse(request.body);
      } catch (error) {
        if (error instanceof ZodError) {
          throw ValidationError("Validation failed", error.issues);
        }
        throw error;
      }
    });
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>): FastifyPluginAsync {
  return async (fastify) => {
    fastify.addHook("preHandler", async (request) => {
      try {
        (request as any).validatedParams = schema.parse(request.params);
      } catch (error) {
        if (error instanceof ZodError) {
          throw ValidationError("Parameter validation failed", error.issues);
        }
        throw error;
      }
    });
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>): FastifyPluginAsync {
  return async (fastify) => {
    fastify.addHook("preHandler", async (request) => {
      try {
        (request as any).validatedQuery = schema.parse(request.query);
      } catch (error) {
        if (error instanceof ZodError) {
          throw ValidationError("Query validation failed", error.issues);
        }
        throw error;
      }
    });
  };
}

export default validateRequest;
