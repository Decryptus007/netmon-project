export interface Agent {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string; // hostname of the collector
  policyId: string;
  status: "online" | "offline" | "error";
  lastSeen: string;
  platform: "windows" | "mac" | "linux";
  ipAddress: string;
  version: string;
  dataTypes: {
    snmp?: {
      status: "active" | "inactive" | "error";
      lastCollection: string;
    };
    syslog?: {
      status: "active" | "inactive" | "error";
      lastCollection: string;
    };
    netflow?: {
      status: "active" | "inactive" | "error";
      lastCollection: string;
    };
  };
}

export interface AgentRegistration {
  hostname: string;
  policyId: string;
  platform: "windows" | "mac" | "linux";
  ipAddress: string;
  version: string;
} 