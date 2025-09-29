import { FastifyPluginAsync } from "fastify";
import { ConfigManagementService } from "../services/config-management.service";
import { z } from "zod";

const configService = new ConfigManagementService();

const routes: FastifyPluginAsync = async (fastify) => {
  // Device routes will be implemented with proper auth and validation
  // For now, placeholder empty plugin to avoid compilation errors
};

export default routes;
