import { sampleAgents } from '../data/sample-data';
export class AgentService {
    agents = sampleAgents;
    async getAllAgents(tenantId, siteId) {
        return this.agents.filter(agent => agent.tenantId === tenantId && (!siteId || agent.siteId === siteId));
    }
    async getAgentById(tenantId, id) {
        return this.agents.find(agent => agent.tenantId === tenantId && agent.id === id) || null;
    }
    async registerAgent(tenantId, name, policyId, platform, ipAddress, siteId) {
        const newAgent = {
            id: `agent-${Date.now()}`,
            name,
            policyId,
            status: 'active',
            lastSeen: new Date().toISOString(),
            platform,
            ipAddress,
            version: '1.0.0',
            dataTypes: [],
            tenantId,
            siteId
        };
        this.agents.push(newAgent);
        return newAgent;
    }
    async updateAgentHeartbeat(tenantId, id) {
        const agent = this.agents.find(a => a.tenantId === tenantId && a.id === id);
        if (agent) {
            agent.lastSeen = new Date().toISOString();
            return agent;
        }
        return null;
    }
    async updateDataCollectionStatus(tenantId, id, dataType, status) {
        const agent = this.agents.find(a => a.tenantId === tenantId && a.id === id);
        if (agent) {
            if (status === 'active' && !agent.dataTypes.includes(dataType)) {
                agent.dataTypes.push(dataType);
            }
            else if (status === 'inactive') {
                agent.dataTypes = agent.dataTypes.filter(dt => dt !== dataType);
            }
            return agent;
        }
        return null;
    }
    async unregisterAgent(tenantId, id) {
        const initialLength = this.agents.length;
        this.agents = this.agents.filter(agent => !(agent.tenantId === tenantId && agent.id === id));
        return this.agents.length < initialLength;
    }
}
//# sourceMappingURL=agent.service.js.map