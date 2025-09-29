import { AgentService } from '../services/agent.service';
export default async function agentRoutes(fastify) {
    const agentService = new AgentService();
    fastify.get('/agents', async (request, reply) => {
        const { tenantId } = request.params;
        const { siteId } = request.query;
        const agents = await agentService.getAllAgents(tenantId, siteId);
        return { agents };
    });
    fastify.get('/agents/:id', async (request, reply) => {
        const { tenantId, id } = request.params;
        const agent = await agentService.getAgentById(tenantId, id);
        if (!agent) {
            reply.code(404).send({ error: 'Agent not found' });
            return;
        }
        return { agent };
    });
    fastify.post('/agents', async (request, reply) => {
        const { tenantId } = request.params;
        const { name, policyId, platform, ipAddress, siteId } = request.body;
        const agent = await agentService.registerAgent(tenantId, name, policyId, platform, ipAddress, siteId);
        reply.code(201).send({ agent });
    });
    fastify.put('/agents/:id/heartbeat', async (request, reply) => {
        const { tenantId, id } = request.params;
        const agent = await agentService.updateAgentHeartbeat(tenantId, id);
        if (!agent) {
            reply.code(404).send({ error: 'Agent not found' });
            return;
        }
        return { agent };
    });
    fastify.put('/agents/:id/data-collection', async (request, reply) => {
        const { tenantId, id } = request.params;
        const { dataType, status } = request.body;
        const agent = await agentService.updateDataCollectionStatus(tenantId, id, dataType, status);
        if (!agent) {
            reply.code(404).send({ error: 'Agent not found' });
            return;
        }
        return { agent };
    });
    fastify.delete('/agents/:id', async (request, reply) => {
        const { tenantId, id } = request.params;
        const success = await agentService.unregisterAgent(tenantId, id);
        if (!success) {
            reply.code(404).send({ error: 'Agent not found' });
            return;
        }
        reply.code(204).send();
    });
}
//# sourceMappingURL=agents.js.map