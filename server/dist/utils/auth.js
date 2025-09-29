import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./errors";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "24h";
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw UnauthorizedError("Invalid or expired token");
    }
}
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
export function extractTokenFromHeader(authHeader) {
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}
//# sourceMappingURL=auth.js.map