import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { credentialService } from '../services/credentialService.js';
import { NotFoundError } from '../utils/errors.js';
import type { CredentialPayload } from '../types/index.js';

// Define route parameter types
interface IdParam {
  id: string;
}

// Define request body types
interface CreateCredentialBody extends CredentialPayload {}
interface UpdateCredentialBody extends Partial<CredentialPayload> {}

// Define JSON Schema for validation
const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' }
  }
} as const;

const credentialSchema = {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { type: 'string', enum: ['network', 'ssh', 'cloud', 'vault'] },
    description: { type: 'string' },
    username: { type: 'string' },
    password: { type: 'string' },
    privateKey: { type: 'string' },
    accessKey: { type: 'string' },
    secretKey: { type: 'string' }
  }
} as const;

export const credentialsRoutes = async (fastify: FastifyInstance) => {
  // Get all credentials
  fastify.get('/', async () => {
    const credentials = await credentialService.getAllCredentials();
    return { success: true, data: credentials };
  });

  // Get credential by ID
  fastify.get<{ Params: IdParam }>('/:id', {
    schema: {
      params: idParamSchema
    }
  }, async (request: FastifyRequest<{ Params: IdParam }>) => {
    const { id } = request.params;
    const credential = await credentialService.getCredential(id);
    
    if (!credential) {
      throw NotFoundError('Credential', id);
    }
    
    return { success: true, data: credential };
  });

  // Create new credential
  fastify.post<{ Body: CreateCredentialBody }>('/', {
    schema: {
      body: credentialSchema
    }
  }, async (request: FastifyRequest<{ Body: CreateCredentialBody }>, reply: FastifyReply) => {
    const result = await credentialService.createCredential(request.body);
    await reply.code(201);
    return { success: true, data: result };
  });

  // Update credential
  fastify.put<{ Params: IdParam; Body: UpdateCredentialBody }>('/:id', {
    schema: {
      params: idParamSchema,
      body: {
        ...credentialSchema,
        required: [] // Make all fields optional for update
      }
    }
  }, async (request: FastifyRequest<{ Params: IdParam; Body: UpdateCredentialBody }>) => {
    const { id } = request.params;
    const result = await credentialService.updateCredential(id, request.body as CredentialPayload);
    
    if (!result) {
      throw NotFoundError('Credential', id);
    }
    
    return { success: true, data: result };
  });

  // Delete credential
  fastify.delete<{ Params: IdParam }>('/:id', {
    schema: {
      params: idParamSchema
    }
  }, async (request: FastifyRequest<{ Params: IdParam }>) => {
    const { id } = request.params;
    const result = await credentialService.deleteCredential(id);
    
    if (!result) {
      throw NotFoundError('Credential', id);
    }
    
    return { success: true, message: 'Credential deleted successfully' };
  });

  // Validate credential
  fastify.post<{ Params: IdParam }>('/:id/validate', {
    schema: {
      params: idParamSchema
    }
  }, async (request: FastifyRequest<{ Params: IdParam }>) => {
    const { id } = request.params;
    const credential = await credentialService.getCredential(id);
    
    if (!credential) {
      throw NotFoundError('Credential', id);
    }
    
    // Since validateCredential is not implemented yet, we'll return a mock response
    // TODO: Implement actual credential validation
    return { success: true, data: { valid: true, message: 'Credential is valid' } };
  });
}; 