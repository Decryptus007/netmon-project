import { Policy } from '../types';
import { samplePolicies } from '../data/sample-data';

export class PolicyService {
  private policies: Policy[] = samplePolicies;

  async getAllPolicies(): Promise<Policy[]> {
    return this.policies;
  }

  async getPolicyById(id: string): Promise<Policy | null> {
    return this.policies.find(policy => policy.id === id) || null;
  }

  async createPolicy(data: Omit<Policy, 'id'>): Promise<Policy> {
    const newPolicy: Policy = {
      id: `policy-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.policies.push(newPolicy);
    return newPolicy;
  }

  async updatePolicy(id: string, data: Partial<Omit<Policy, 'id'>>): Promise<Policy | null> {
    const policy = this.policies.find(p => p.id === id);
    if (policy) {
      Object.assign(policy, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return policy;
    }
    return null;
  }

  async deletePolicy(id: string): Promise<boolean> {
    const initialLength = this.policies.length;
    this.policies = this.policies.filter(policy => policy.id !== id);
    return this.policies.length < initialLength;
  }

  async getAgentBinary(id: string, platform: 'windows' | 'mac' | 'linux'): Promise<string> {
    const policy = await this.getPolicyById(id);
    if (!policy) {
      throw new Error('Policy not found');
    }

    // In a real implementation, this would generate a signed download URL
    return `/api/policies/${id}/agent-binary/${platform}`;
  }
} 