export interface Site {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  tags: string[];
  settings: {
    monitoring: {
      enabled: boolean;
      interval: number;
      alerts: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
} 