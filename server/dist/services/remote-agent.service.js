export class RemoteAgentService {
    async deployAgent(config) {
        return { id: config.id, status: "deploying" };
    }
    async getAgentStatus(id) {
        return { id, status: "active" };
    }
    async updateAgentConfig(id, config) {
        return { id, status: "updated" };
    }
    async removeAgent(id) {
        return true;
    }
}
//# sourceMappingURL=remote-agent.service.js.map