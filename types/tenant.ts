export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string;
  settings: {
    defaultSiteId: string;
    theme: string;
    notifications: {
      email: boolean;
      slack: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
} 