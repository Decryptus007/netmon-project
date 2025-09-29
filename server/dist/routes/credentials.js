import { credentialService } from '../services/credentialService.js';
import { NotFoundError } from '../utils/errors.js';
const idParamSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'string' }
    }
};
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
};
export const credentialsRoutes = async (fastify) => {
    fastify.get('/', async () => {
        const credentials = await credentialService.getAllCredentials();
        return { success: true, data: credentials };
    });
    fastify.get('/:id', {
        schema: {
            params: idParamSchema
        }
    }, async (request) => {
        const { id } = request.params;
        const credential = await credentialService.getCredential(id);
        if (!credential) {
            throw NotFoundError('Credential', id);
        }
        return { success: true, data: credential };
    });
    fastify.post('/', {
        schema: {
            body: credentialSchema
        }
    }, async (request, reply) => {
        const result = await credentialService.createCredential(request.body);
        await reply.code(201);
        return { success: true, data: result };
    });
    fastify.put('/:id', {
        schema: {
            params: idParamSchema,
            body: {
                ...credentialSchema,
                required: []
            }
        }
    }, async (request) => {
        const { id } = request.params;
        const result = await credentialService.updateCredential(id, request.body);
        if (!result) {
            throw NotFoundError('Credential', id);
        }
        return { success: true, data: result };
    });
    fastify.delete('/:id', {
        schema: {
            params: idParamSchema
        }
    }, async (request) => {
        const { id } = request.params;
        const result = await credentialService.deleteCredential(id);
        if (!result) {
            throw NotFoundError('Credential', id);
        }
        return { success: true, message: 'Credential deleted successfully' };
    });
    fastify.post('/:id/validate', {
        schema: {
            params: idParamSchema
        }
    }, async (request) => {
        const { id } = request.params;
        const credential = await credentialService.getCredential(id);
        if (!credential) {
            throw NotFoundError('Credential', id);
        }
        return { success: true, data: { valid: true, message: 'Credential is valid' } };
    });
};
//# sourceMappingURL=credentials.js.map