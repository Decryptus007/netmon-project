export class LoggingService {
    async logActivity(tenantId, action, details) {
        console.log(`[LOG] ${tenantId}: ${action}`, details);
    }
    async getRecentLogs(tenantId, limit = 100) {
        return [];
    }
}
//# sourceMappingURL=logging.service.js.map