import { FastifyInstance } from 'fastify';
import { AgentService } from '../services/agent.service';

export default async function agentRoutes(fastify: FastifyInstance) {
  const agentService = new AgentService();

  // Get all agents for a tenant
  fastify.get('/agents', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const { siteId } = request.query as { siteId?: string };
    
    const agents = await agentService.getAllAgents(tenantId, siteId);
    return { agents };
  });

  // Get agent by ID
  fastify.get('/agents/:id', async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const agent = await agentService.getAgentById(tenantId, id);
    
    if (!agent) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }
    
    return { agent };
  });

  // Register a new agent
  fastify.post('/agents', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const { name, policyId, platform, ipAddress, siteId } = request.body as {
      name: string;
      policyId: string;
      platform: 'windows' | 'mac' | 'linux';
      ipAddress: string;
      siteId?: string;
    };

    const agent = await agentService.registerAgent(tenantId, name, policyId, platform, ipAddress, siteId);
    reply.code(201).send({ agent });
  });

  // Update agent heartbeat
  fastify.put('/agents/:id/heartbeat', async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const agent = await agentService.updateAgentHeartbeat(tenantId, id);
    
    if (!agent) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }
    
    return { agent };
  });

  // Update data collection status
  fastify.put('/agents/:id/data-collection', async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const { dataType, status } = request.body as {
      dataType: 'snmp' | 'syslog' | 'netflow';
      status: 'active' | 'inactive';
    };

    const agent = await agentService.updateDataCollectionStatus(tenantId, id, dataType, status);
    
    if (!agent) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }
    
    return { agent };
  });

  // Unregister an agent
  fastify.delete('/agents/:id', async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const success = await agentService.unregisterAgent(tenantId, id);
    
    if (!success) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }
    
    reply.code(204).send();
  });
} 