export interface Device {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  ipAddress: string;
  platform: string;
  status: 'online' | 'offline' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  type: 'ansible';
  category: string;
  content: string;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  type: 'ansible';
  status: 'active' | 'inactive' | 'running' | 'completed' | 'error';
  content: string;
  devices: string[];
  schedule?: {
    enabled: boolean;
    cron: string;
  };
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  tenantId: string;
  type: 'workflow_execution' | 'template_update' | 'device_update';
  status: 'success' | 'error' | 'warning';
  details: string;
  timestamp: string;
}

export interface CompliancePolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  rules: ComplianceRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: 'configuration' | 'security' | 'performance';
  check: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceCheck {
  id: string;
  tenantId: string;
  policyId: string;
  deviceId: string;
  status: 'compliant' | 'non_compliant' | 'error';
  results: ComplianceResult[];
  timestamp: string;
}

export interface ComplianceResult {
  ruleId: string;
  status: 'pass' | 'fail' | 'error';
  message: string;
  evidence?: string;
} 