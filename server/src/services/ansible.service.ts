import { ConfigurationTemplate, AutomationWorkflow, Device } from '../types/config-management';
import { LoggingService } from './logging.service';
import { RemoteAgentService, AgentConfig } from './remote-agent.service';

export class AnsibleService {
  private readonly logger: LoggingService;
  private readonly agents: Map<string, RemoteAgentService>;

  constructor() {
    this.logger = new LoggingService();
    this.agents = new Map();
  }

  /**
   * Register a new remote agent for a tenant
   */
  registerAgent(config: AgentConfig): void {
    this.agents.set(config.tenantId, new RemoteAgentService(config));
    this.logger.info('Registered new remote agent', {
      tenantId: config.tenantId,
      url: config.url
    });
  }

  /**
   * Get a remote agent instance for a tenant
   */
  private getAgent(tenantId: string): RemoteAgentService {
    const agent = this.agents.get(tenantId);
    if (!agent) {
      throw new Error(`No agent registered for tenant ${tenantId}`);
    }
    return agent;
  }

  /**
   * Execute an Ansible playbook with the given content and target devices
   */
  async executePlaybook(tenantId: string, content: string, devices: string[]): Promise<void> {
    const agent = this.getAgent(tenantId);
    await agent.executePlaybook(content, devices);
  }

  /**
   * Validate an Ansible playbook content
   */
  async validatePlaybook(tenantId: string, content: string): Promise<boolean> {
    const agent = this.getAgent(tenantId);
    return await agent.validatePlaybook(content);
  }

  /**
   * Add a device to the agent's inventory
   */
  async addDeviceToInventory(tenantId: string, device: Device): Promise<void> {
    const agent = this.getAgent(tenantId);
    await agent.addDeviceToInventory(device);
  }

  /**
   * Get the status of a playbook execution
   */
  async getPlaybookStatus(tenantId: string, executionId: string): Promise<{
    status: 'running' | 'completed' | 'failed';
    output?: string;
    error?: string;
  }> {
    const agent = this.getAgent(tenantId);
    return await agent.getPlaybookStatus(executionId);
  }

  /**
   * Get agent health status
   */
  async getAgentHealth(tenantId: string): Promise<{
    status: 'healthy' | 'unhealthy';
    version: string;
    lastSeen: string;
  }> {
    const agent = this.getAgent(tenantId);
    return await agent.getHealth();
  }

  /**
   * Get agent configuration
   */
  async getAgentConfig(tenantId: string): Promise<{
    ansibleVersion: string;
    collections: { name: string; version: string }[];
    supportedPlatforms: string[];
  }> {
    const agent = this.getAgent(tenantId);
    return await agent.getConfig();
  }

  /**
   * Check if an agent is registered for a tenant
   */
  hasAgent(tenantId: string): boolean {
    return this.agents.has(tenantId);
  }

  /**
   * Remove an agent registration
   */
  removeAgent(tenantId: string): void {
    this.agents.delete(tenantId);
    this.logger.info('Removed remote agent registration', {
      tenantId
    });
  }
} 