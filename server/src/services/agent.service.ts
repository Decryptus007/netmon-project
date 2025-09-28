import { Agent } from '../types';
import { sampleAgents } from '../data/sample-data';

export class AgentService {
  private agents: Agent[] = sampleAgents;

  async getAllAgents(tenantId: string, siteId?: string): Promise<Agent[]> {
    return this.agents.filter(agent => 
      agent.tenantId === tenantId && (!siteId || agent.siteId === siteId)
    );
  }

  async getAgentById(tenantId: string, id: string): Promise<Agent | null> {
    return this.agents.find(agent => 
      agent.tenantId === tenantId && agent.id === id
    ) || null;
  }

  async registerAgent(
    tenantId: string,
    name: string,
    policyId: string,
    platform: 'windows' | 'mac' | 'linux',
    ipAddress: string,
    siteId?: string
  ): Promise<Agent> {
    const newAgent: Agent = {
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

  async updateAgentHeartbeat(tenantId: string, id: string): Promise<Agent | null> {
    const agent = this.agents.find(a => a.tenantId === tenantId && a.id === id);
    if (agent) {
      agent.lastSeen = new Date().toISOString();
      return agent;
    }
    return null;
  }

  async updateDataCollectionStatus(
    tenantId: string,
    id: string,
    dataType: 'snmp' | 'syslog' | 'netflow',
    status: 'active' | 'inactive'
  ): Promise<Agent | null> {
    const agent = this.agents.find(a => a.tenantId === tenantId && a.id === id);
    if (agent) {
      if (status === 'active' && !agent.dataTypes.includes(dataType)) {
        agent.dataTypes.push(dataType);
      } else if (status === 'inactive') {
        agent.dataTypes = agent.dataTypes.filter(dt => dt !== dataType);
      }
      return agent;
    }
    return null;
  }

  async unregisterAgent(tenantId: string, id: string): Promise<boolean> {
    const initialLength = this.agents.length;
    this.agents = this.agents.filter(agent => 
      !(agent.tenantId === tenantId && agent.id === id)
    );
    return this.agents.length < initialLength;
  }
} 