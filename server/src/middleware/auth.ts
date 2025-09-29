import { FastifyPluginAsync } from "fastify";
import { verifyToken } from "../utils/auth";
import { UnauthorizedError, InvalidRequestError } from "../utils/errors";

export const authenticateTenant: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", async (request) => {
    const authHeader = request.headers.authorization as string;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw UnauthorizedError("No token provided");
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);

      request.user = {
        id: decoded.id,
        role: decoded.role,
      };

      // Extract tenantId from URL params
      const tenantId = (request.params as Record<string, string>).tenantId;
      if (!tenantId) {
        throw InvalidRequestError("Tenant ID required");
      }

      request.tenantId = tenantId;
    } catch (error) {
      throw UnauthorizedError("Invalid or expired token");
    }
  });
};

export default authenticateTenant;
