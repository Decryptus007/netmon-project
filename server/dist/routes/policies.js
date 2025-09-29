import { PolicyService } from "../services/policy.service";
export default async function policyRoutes(fastify) {
    const policyService = new PolicyService();
    fastify.get("/policies", async (request, reply) => {
        const { tenantId } = request.params;
        const policies = await policyService.getAllPolicies();
        return { policies };
    });
    fastify.get("/policies/:id", async (request, reply) => {
        const { tenantId, id } = request.params;
        const policy = await policyService.getPolicyById(id);
        if (!policy) {
            reply.code(404).send({ error: "Policy not found" });
            return;
        }
        return { policy };
    });
    fastify.post("/policies", async (request, reply) => {
        const { tenantId } = request.params;
        const data = request.body;
        const policy = await policyService.createPolicy(data);
        reply.code(201).send({ policy });
    });
    fastify.put("/policies/:id", async (request, reply) => {
        const { tenantId, id } = request.params;
        const data = request.body;
        const policy = await policyService.updatePolicy(id, data);
        if (!policy) {
            reply.code(404).send({ error: "Policy not found" });
            return;
        }
        return { policy };
    });
    fastify.delete("/policies/:id", async (request, reply) => {
        const { tenantId, id } = request.params;
        const success = await policyService.deletePolicy(id);
        if (!success) {
            reply.code(404).send({ error: "Policy not found" });
            return;
        }
        reply.code(204).send();
    });
    fastify.get("/policies/:id/agent-binary", async (request, reply) => {
        const { tenantId, id } = request.params;
        const { platform } = request.query;
        try {
            const downloadUrl = await policyService.getAgentBinary(id, platform);
            return { downloadUrl };
        }
        catch (error) {
            reply.code(404).send({ error: "Policy not found" });
        }
    });
}
//# sourceMappingURL=policies.js.map