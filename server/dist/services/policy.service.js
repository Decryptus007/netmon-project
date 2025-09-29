import { samplePolicies } from '../data/sample-data';
export class PolicyService {
    policies = samplePolicies;
    async getAllPolicies() {
        return this.policies;
    }
    async getPolicyById(id) {
        return this.policies.find(policy => policy.id === id) || null;
    }
    async createPolicy(data) {
        const newPolicy = {
            id: `policy-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.policies.push(newPolicy);
        return newPolicy;
    }
    async updatePolicy(id, data) {
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
    async deletePolicy(id) {
        const initialLength = this.policies.length;
        this.policies = this.policies.filter(policy => policy.id !== id);
        return this.policies.length < initialLength;
    }
    async getAgentBinary(id, platform) {
        const policy = await this.getPolicyById(id);
        if (!policy) {
            throw new Error('Policy not found');
        }
        return `/api/policies/${id}/agent-binary/${platform}`;
    }
}
//# sourceMappingURL=policy.service.js.map