import * as dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { logger } from "./utils/logger.js";
import { credentialsRoutes } from "./routes/credentials.js";
import { dataManagementRoutes } from "./routes/dataManagement.js";
import { AppError } from "./utils/errors.js";
import agentRoutes from "./routes/agents";
import policyRoutes from "./routes/policies";
dotenv.config();
const fastify = Fastify({
    logger: true,
    trustProxy: true,
});
fastify.register(cors, {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
});
fastify.register(helmet);
fastify.addHook("onRequest", async (request) => {
    if (request.body) {
        logger.debug("Request body:", { body: request.body });
    }
    if (Object.keys(request.query).length > 0) {
        logger.debug("Query parameters:", { query: request.query });
    }
});
fastify.addHook("onResponse", async (request, reply) => {
    logger.info(`${request.method} ${request.url}`, {
        method: request.method,
        url: request.url,
        ip: request.ip,
        statusCode: reply.statusCode,
        responseTime: `${reply.getResponseTime().toFixed(2)}ms`,
        userAgent: request.headers["user-agent"],
        ...(request.user && { userId: request.user.id }),
    });
});
fastify.setErrorHandler((error, request, reply) => {
    logger.logError(error, request);
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
                ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
            },
        });
    }
    if (error.validation) {
        return reply.status(400).send({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: error.validation,
                ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
            },
        });
    }
    return reply.status(500).send({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
            ...(process.env.NODE_ENV === "development" && {
                details: error.message,
                stack: error.stack,
            }),
        },
    });
});
fastify.register(credentialsRoutes, { prefix: "/api/credentials" });
fastify.register(dataManagementRoutes, { prefix: "/api/data-management" });
fastify.register(agentRoutes, { prefix: "/api/tenants/:tenantId" });
fastify.register(policyRoutes, { prefix: "/api/tenants/:tenantId" });
fastify.get("/health", async () => {
    return { status: "ok" };
});
fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "Route not found",
            details: `Route ${request.method} ${request.url} not found`,
        },
    });
});
const PORT = process.env.PORT || 5001;
try {
    await fastify.listen({ port: Number(PORT), host: "0.0.0.0" });
    logger.info(`Server running on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
    });
}
catch (err) {
    if (err instanceof Error && "code" in err && err.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use. Please choose a different port.`);
        process.exit(1);
    }
    logger.error("Server error:", { error: err });
    process.exit(1);
}
//# sourceMappingURL=index.js.map