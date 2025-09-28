import { FastifyInstance, FastifyRequest } from 'fastify';
import { NotFoundError, InvalidRequestError } from '../utils/errors.js';

interface DataStoreConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  apiKey?: string;
}

interface DataStore {
  id: string;
  name: string;
  type: 'elasticsearch' | 'clickhouse' | 'prometheus' | 'tracix';
  status: 'configured' | 'not_configured';
  config?: DataStoreConfig;
}

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
} as const;

// In-memory storage for data stores (replace with database in production)
let dataStores: DataStore[] = [
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

export const dataManagementRoutes = async (fastify: FastifyInstance) => {
  // Get all data stores
  fastify.get('/', async () => {
    return { success: true, data: dataStores };
  });

  // Get data store by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const { id } = request.params;
    const dataStore = dataStores.find(ds => ds.id === id);

    if (!dataStore) {
      throw NotFoundError('Data store', id);
    }

    return { success: true, data: dataStore };
  });

  // Configure data store
  fastify.post<{ Params: { id: string }; Body: DataStoreConfig }>('/:id/configure', {
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
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: DataStoreConfig }>) => {
    const { id } = request.params;
    const config = request.body;

    // Check if any other data store is configured
    const configuredStore = dataStores.find(ds => ds.status === 'configured' && ds.id !== id);
    if (configuredStore) {
      throw InvalidRequestError(`Cannot configure multiple data stores. ${configuredStore.name} is already configured.`);
    }

    const dataStore = dataStores.find(ds => ds.id === id);
    if (!dataStore) {
      throw NotFoundError('Data store', id);
    }

    // Update data store configuration
    dataStore.config = config;
    dataStore.status = 'configured';

    return { success: true, data: dataStore };
  });

  // Remove data store configuration
  fastify.delete<{ Params: { id: string } }>('/:id/configure', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const { id } = request.params;
    const dataStore = dataStores.find(ds => ds.id === id);

    if (!dataStore) {
      throw NotFoundError('Data store', id);
    }

    if (dataStore.status !== 'configured') {
      throw InvalidRequestError('Data store is not configured');
    }

    // Remove configuration
    delete dataStore.config;
    dataStore.status = 'not_configured';

    return { success: true, data: dataStore };
  });

  // Test data store connection
  fastify.post<{ Params: { id: string } }>('/:id/test', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const { id } = request.params;
    const dataStore = dataStores.find(ds => ds.id === id);

    if (!dataStore) {
      throw NotFoundError('Data store', id);
    }

    if (dataStore.status !== 'configured') {
      throw InvalidRequestError('Data store is not configured');
    }

    // TODO: Implement actual connection testing
    // For now, return a mock response
    return {
      success: true,
      data: {
        connected: true,
        message: 'Successfully connected to data store'
      }
    };
  });
}; 