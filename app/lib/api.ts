import { Agent } from '@/types/agent';
import { Policy } from '@/types/policy';
import { Tenant } from '@/types/tenant';
import { Site } from '@/types/site';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('API Request:', {
    url,
    method: options.method || 'GET',
    headers: options.headers,
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Data:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const api = {
  // Tenant endpoints
  tenants: {
    getById: (id: string) => fetchApi<{ tenant: Tenant }>(`/tenants/${id}`),
    getAll: () => fetchApi<{ tenants: Tenant[] }>('/tenants'),
    create: (data: Omit<Tenant, 'id'>) => 
      fetchApi<{ tenant: Tenant }>('/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Tenant, 'id'>>) =>
      fetchApi<{ tenant: Tenant }>(`/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<void>(`/tenants/${id}`, { method: 'DELETE' }),
  },

  // Site endpoints
  sites: {
    getAll: (tenantId: string) => fetchApi<{ sites: Site[] }>(`/tenants/${tenantId}/sites`),
    getById: (tenantId: string, id: string) => 
      fetchApi<{ site: Site }>(`/tenants/${tenantId}/sites/${id}`),
    create: (tenantId: string, data: Omit<Site, 'id'>) => 
      fetchApi<{ site: Site }>(`/tenants/${tenantId}/sites`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (tenantId: string, id: string, data: Partial<Omit<Site, 'id'>>) =>
      fetchApi<{ site: Site }>(`/tenants/${tenantId}/sites/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (tenantId: string, id: string) => 
      fetchApi<void>(`/tenants/${tenantId}/sites/${id}`, { method: 'DELETE' }),
  },

  // Agent endpoints
  agents: {
    getAll: (tenantId: string, siteId?: string) => 
      fetchApi<{ agents: Agent[] }>(`/tenants/${tenantId}/agents${siteId ? `?siteId=${siteId}` : ''}`),
    getById: (tenantId: string, id: string) => 
      fetchApi<{ agent: Agent }>(`/tenants/${tenantId}/agents/${id}`),
    unregister: (tenantId: string, id: string) => 
      fetchApi<void>(`/tenants/${tenantId}/agents/${id}`, { method: 'DELETE' }),
  },

  // Policy endpoints
  policies: {
    getAll: (tenantId: string) => 
      fetchApi<{ policies: Policy[] }>(`/tenants/${tenantId}/policies`),
    getById: (tenantId: string, id: string) => 
      fetchApi<{ policy: Policy }>(`/tenants/${tenantId}/policies/${id}`),
    create: (tenantId: string, data: Omit<Policy, 'id'>) => 
      fetchApi<{ policy: Policy }>(`/tenants/${tenantId}/policies`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (tenantId: string, id: string, data: Partial<Omit<Policy, 'id'>>) =>
      fetchApi<{ policy: Policy }>(`/tenants/${tenantId}/policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (tenantId: string, id: string) => 
      fetchApi<void>(`/tenants/${tenantId}/policies/${id}`, { method: 'DELETE' }),
    downloadAgent: (tenantId: string, id: string, platform: 'windows' | 'mac' | 'linux') =>
      fetchApi<{ downloadUrl: string }>(`/tenants/${tenantId}/policies/${id}/agent-binary?platform=${platform}`),
  },
}; 