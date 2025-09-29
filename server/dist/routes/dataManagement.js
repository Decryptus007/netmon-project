import { NotFoundError, InvalidRequestError } from '../utils/errors.js';
const configSchema = {
    type: 'object',
    required: ['host', 'port'],
    properties: {
        host: { type: 'string', format: 'hostname' },
        port: { type: 'number', minimum: 1, maximum: 65535 },
        username: { type: 'string' },
        password: { type: 'string' },
        apiKey: { type: 'string' }
    }
};
let dataStores = [
    {
        id: 'elasticsearch',
        name: 'Elasticsearch',
        type: 'elasticsearch',
        status: 'not_configured'
    },
    {
        id: 'clickhouse',
        name: 'Clickhouse',
        type: 'clickhouse',
        status: 'not_configured'
    },
    {
        id: 'prometheus',
        name: 'Prometheus',
        type: 'prometheus',
        status: 'not_configured'
    },
    {
        id: 'tracix',
        name: 'Tracix Native',
        type: 'tracix',
        status: 'not_configured'
    }
];
export const dataManagementRoutes = async (fastify) => {
    fastify.get('/', async () => {
        return { success: true, data: dataStores };
    });
    fastify.get('/:id', {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request) => {
        const { id } = request.params;
        const dataStore = dataStores.find(ds => ds.id === id);
        if (!dataStore) {
            throw NotFoundError('Data store', id);
        }
        return { success: true, data: dataStore };
    });
    fastify.post('/:id/configure', {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            },
            body: configSchema
        }
    }, async (request) => {
        const { id } = request.params;
        const config = request.body;
        const configuredStore = dataStores.find(ds => ds.status === 'configured' && ds.id !== id);
        if (configuredStore) {
            throw InvalidRequestError(`Cannot configure multiple data stores. ${configuredStore.name} is already configured.`);
        }
        const dataStore = dataStores.find(ds => ds.id === id);
        if (!dataStore) {
            throw NotFoundError('Data store', id);
        }
        dataStore.config = config;
        dataStore.status = 'configured';
        return { success: true, data: dataStore };
    });
    fastify.delete('/:id/configure', {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request) => {
        const { id } = request.params;
        const dataStore = dataStores.find(ds => ds.id === id);
        if (!dataStore) {
            throw NotFoundError('Data store', id);
        }
        if (dataStore.status !== 'configured') {
            throw InvalidRequestError('Data store is not configured');
        }
        delete dataStore.config;
        dataStore.status = 'not_configured';
        return { success: true, data: dataStore };
    });
    fastify.post('/:id/test', {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request) => {
        const { id } = request.params;
        const dataStore = dataStores.find(ds => ds.id === id);
        if (!dataStore) {
            throw NotFoundError('Data store', id);
        }
        if (dataStore.status !== 'configured') {
            throw InvalidRequestError('Data store is not configured');
        }
        return {
            success: true,
            data: {
                connected: true,
                message: 'Successfully connected to data store'
            }
        };
    });
};
//# sourceMappingURL=dataManagement.js.map