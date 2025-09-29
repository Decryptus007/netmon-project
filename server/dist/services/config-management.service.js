export class ConfigManagementService {
    async getAllDevices(tenantId, siteId) {
        return [];
    }
    async getDeviceById(tenantId, id) {
        return null;
    }
    async addDevice(tenantId, device) {
        return { id: "1", ...device };
    }
    async updateDevice(tenantId, id, updates) {
        return { id, ...updates };
    }
    async deleteDevice(tenantId, id) {
        return true;
    }
    async getAllTemplates(tenantId) {
        return [];
    }
    async getTemplateById(tenantId, id) {
        return null;
    }
    async createTemplate(tenantId, template) {
        return { id: "1", ...template };
    }
    async updateTemplate(tenantId, id, updates) {
        return { id, ...updates };
    }
    async getAllWorkflows(tenantId) {
        return [];
    }
    async getWorkflowById(tenantId, id) {
        return null;
    }
    async createWorkflow(tenantId, workflow) {
        return { id: "1", ...workflow };
    }
    async executeWorkflow(tenantId, id) {
        return true;
    }
    async getAllCompliancePolicies(tenantId) {
        return [];
    }
    async getCompliancePolicyById(tenantId, id) {
        return null;
    }
    async createCompliancePolicy(tenantId, policy) {
        return { id: "1", ...policy };
    }
    async runComplianceCheck(tenantId, policyId, deviceId) {
        return {};
    }
    async getRecentActivity(tenantId, limit) {
        return [];
    }
}
//# sourceMappingURL=config-management.service.js.map