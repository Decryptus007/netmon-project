export interface Agent {
  id: string;
  name: string;
  policyId: string;
  status: 'online' | 'offline';
  lastSeen: string;
  platform: 'windows' | 'mac' | 'linux';
  ipAddress: string;
  version: string;
  dataTypes: {
    snmp?: {
      status: 'active' | 'inactive';
      lastCollection: string;
    };
    syslog?: {
      status: 'active' | 'inactive';
      lastCollection: string;
    };
    netflow?: {
      status: 'active' | 'inactive';
      lastCollection: string;
    };
  };
} 