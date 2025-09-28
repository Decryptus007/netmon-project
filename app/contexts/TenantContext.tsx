"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '@/types/tenant';
import { Site } from '@/types/site';

interface TenantContextType {
  tenant: Tenant | null;
  site: Site | null;
  sites: Site[];
  setSite: (site: Site | null) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Mock data for development
const mockTenant: Tenant = {
  id: 'default-tenant',
  name: 'Default Tenant',
  slug: 'default',
  description: 'Default tenant for development',
  settings: {
    defaultSiteId: 'site-1',
    theme: 'dark',
    notifications: {
      email: true,
      slack: false,
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSites: Site[] = [
  {
    id: 'site-1',
    tenantId: 'default-tenant',
    name: 'Main Office',
    description: 'Primary office location',
    location: {
      address: '123 Main St, City, Country',
      coordinates: {
        lat: 40.7128,
        lng: -74.0060,
      },
    },
    tags: ['office', 'headquarters'],
    settings: {
      monitoring: {
        enabled: true,
        interval: 300,
        alerts: true,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'site-2',
    tenantId: 'default-tenant',
    name: 'Branch Office',
    description: 'Secondary office location',
    location: {
      address: '456 Branch Ave, City, Country',
      coordinates: {
        lat: 40.7128,
        lng: -74.0060,
      },
    },
    tags: ['office', 'branch'],
    settings: {
      monitoring: {
        enabled: true,
        interval: 300,
        alerts: true,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenantAndSites = async () => {
      try {
        // For development, use mock data
        setTenant(mockTenant);
        setSites(mockSites);

        // Set default site
        const defaultSite = mockSites.find(
          (s) => s.id === mockTenant.settings.defaultSiteId
        );
        setSite(defaultSite || null);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tenant and sites:', error);
        setLoading(false);
      }
    };

    fetchTenantAndSites();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        site,
        sites,
        setSite,
        loading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
} 