"use client";

import { useTenant } from '../contexts/TenantContext';
import { SiteDropdown } from './SiteDropdown';

export function Header() {
  const { tenant, site, sites, setSite } = useTenant();

  if (!tenant) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{tenant.name}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-500">Site:</span>
            <SiteDropdown
              sites={sites}
              selectedSite={site}
              onSiteChange={setSite}
            />
          </div>
        </div>
      </div>
    </header>
  );
} 