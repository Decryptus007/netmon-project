import { LoggingService } from './logging.service';
import { RemoteAgentService } from './remote-agent.service';
export class AnsibleService {
    logger;
    agents;
    constructor() {
        this.logger = new LoggingService();
        this.agents = new Map();
    }
    registerAgent(config) {
        this.agents.set(config.tenantId, new RemoteAgentService(config));
        this.logger.info('Registered new remote agent', {
            tenantId: config.tenantId,
            url: config.url
        });
    }
    getAgent(tenantId) {
        const agent = this.agents.get(tenantId);
        if (!agent) {
            throw new Error(`No agent registered for tenant ${tenantId}`);
        }
        return agent;
    }
    async executePlaybook(tenantId, content, devices) {
        const agent = this.getAgent(tenantId);
        await agent.executePlaybook(content, devices);
    }
    async validatePlaybook(tenantId, content) {
        const agent = this.getAgent(tenantId);
        return await agent.validatePlaybook(content);
    }
    async addDeviceToInventory(tenantId, device) {
        const agent = this.getAgent(tenantId);
        await agent.addDeviceToInventory(device);
    }
    async getPlaybookStatus(tenantId, executionId) {
        const agent = this.getAgent(tenantId);
        return await agent.getPlaybookStatus(executionId);
    }
    async getAgentHealth(tenantId) {
        const agent = this.getAgent(tenantId);
        return await agent.getHealth();
    }
    async getAgentConfig(tenantId) {
        const agent = this.getAgent(tenantId);
        return await agent.getConfig();
    }
    hasAgent(tenantId) {
        return this.agents.has(tenantId);
    }
    removeAgent(tenantId) {
        this.agents.delete(tenantId);
        this.logger.info('Removed remote agent registration', {
            tenantId
        });
    }
}
//# sourceMappingURL=ansible.service.js.map