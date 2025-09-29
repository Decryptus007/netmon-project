import { verifyToken } from "../utils/auth";
import { UnauthorizedError, InvalidRequestError } from "../utils/errors";
export const authenticateTenant = async (fastify) => {
    fastify.addHook("preHandler", async (request) => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw UnauthorizedError("No token provided");
        }
        const token = authHeader.slice(7);
        try {
            const decoded = verifyToken(token);
            request.user = {
                id: decoded.id,
                role: decoded.role,
            };
            const tenantId = request.params.tenantId;
            if (!tenantId) {
                throw InvalidRequestError("Tenant ID required");
            }
            request.tenantId = tenantId;
        }
        catch (error) {
            throw UnauthorizedError("Invalid or expired token");
        }
    });
};
export default authenticateTenant;
//# sourceMappingURL=auth.js.map