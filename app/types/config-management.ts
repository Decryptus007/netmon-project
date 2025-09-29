export interface Device {
  id: string;
  name: string;
  ip: string;
  type: string;
  model: string;
  status: "online" | "offline" | "error";
  lastSeen: string;
  location: string;
  tenantId: string;
}

export interface ActivityLog {
  id: string;
  deviceId?: string;
  action: string;
  description: string;
  status: "success" | "error" | "warning" | "info";
  timestamp: string;
  userId?: string;
  tenantId: string;
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export interface ConfigurationSnapshot {
  id: string;
  deviceId: string;
  templateId?: string;
  content: string;
  timestamp: string;
  status: "active" | "backup" | "archived";
  notes?: string;
  tenantId: string;
}

export interface AutomationJob {
  id: string;
  name: string;
  description: string;
  type: "backup" | "deployment" | "monitoring" | "maintenance";
  schedule?: string;
  targets: string[];
  status: "pending" | "running" | "completed" | "failed";
  lastRun?: string;
  nextRun?: string;
  tenantId: string;
}
