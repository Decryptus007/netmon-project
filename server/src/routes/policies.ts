import { FastifyInstance } from "fastify";
import { Policy } from "../types/index";
import { PolicyService } from "../services/policy.service";

export default async function policyRoutes(fastify: FastifyInstance) {
  const policyService = new PolicyService();

  // Get all policies
  fastify.get("/policies", async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const policies = await policyService.getAllPolicies();
    return { policies };
  });

  // Get policy by ID
  fastify.get("/policies/:id", async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const policy = await policyService.getPolicyById(id);

    if (!policy) {
      reply.code(404).send({ error: "Policy not found" });
      return;
    }

    return { policy };
  });

  // Create a new policy
  fastify.post("/policies", async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const data = request.body as Omit<Policy, "id">;
    const policy = await policyService.createPolicy(data);
    reply.code(201).send({ policy });
  });

  // Update a policy
  fastify.put("/policies/:id", async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const data = request.body as Partial<Omit<Policy, "id">>;

    const policy = await policyService.updatePolicy(id, data);

    if (!policy) {
      reply.code(404).send({ error: "Policy not found" });
      return;
    }

    return { policy };
  });

  // Delete a policy
  fastify.delete("/policies/:id", async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const success = await policyService.deletePolicy(id);

    if (!success) {
      reply.code(404).send({ error: "Policy not found" });
      return;
    }

    reply.code(204).send();
  });

  // Get agent binary for a policy
  fastify.get("/policies/:id/agent-binary", async (request, reply) => {
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    const { platform } = request.query as {
      platform: "windows" | "mac" | "linux";
    };

    try {
      const downloadUrl = await policyService.getAgentBinary(id, platform);
      return { downloadUrl };
    } catch (error) {
      reply.code(404).send({ error: "Policy not found" });
    }
  });
}
