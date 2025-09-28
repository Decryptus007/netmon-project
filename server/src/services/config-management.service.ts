import { Device, ActivityLog, ConfigurationTemplate, AutomationWorkflow, CompliancePolicy, ComplianceCheck } from '../types/config-management';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { AnsibleService } from './ansible.service';
import { LocalStorageService } from './local-storage.service';

const execAsync = promisify(exec);

export class ConfigManagementService {
  private ansibleService: AnsibleService;
  private localStorageService: LocalStorageService;
  private devices: Device[] = [];
  private activities: ActivityLog[] = [];
  private compliancePolicies: CompliancePolicy[] = [];
  private complianceChecks: ComplianceCheck[] = [];

  constructor() {
    this.ansibleService = new AnsibleService();
    this.localStorageService = new LocalStorageService();
  }

  // Template operations
  async getAllTemplates(tenantId: string): Promise<ConfigurationTemplate[]> {
    return this.localStorageService.getAllTemplates();
  }

  async getTemplateById(tenantId: string, id: string): Promise<ConfigurationTemplate | null> {
    return this.localStorageService.getTemplateById(id);
  }

  async createTemplate(tenantId: string, template: Omit<ConfigurationTemplate, 'id'>): Promise<ConfigurationTemplate> {
    return this.localStorageService.createTemplate(template);
  }

  async updateTemplate(tenantId: string, id: string, template: Partial<ConfigurationTemplate>): Promise<ConfigurationTemplate | null> {
    return this.localStorageService.updateTemplate(id, template);
  }

  async deleteTemplate(tenantId: string, id: string): Promise<void> {
    return this.localStorageService.deleteTemplate(id);
  }

  // Workflow operations
  async getAllWorkflows(tenantId: string): Promise<AutomationWorkflow[]> {
    return this.localStorageService.getAllWorkflows();
  }

  async getWorkflowById(tenantId: string, id: string): Promise<AutomationWorkflow | null> {
    return this.localStorageService.getWorkflowById(id);
  }

  async createWorkflow(tenantId: string, workflow: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationWorkflow> {
    return this.localStorageService.createWorkflow(workflow);
  }

  async updateWorkflow(tenantId: string, id: string, workflow: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null> {
    return this.localStorageService.updateWorkflow(id, workflow);
  }

  async deleteWorkflow(tenantId: string, id: string): Promise<void> {
    return this.localStorageService.deleteWorkflow(id);
  }

  // Device operations
  async getDevices(tenantId: string): Promise<Device[]> {
    return this.devices.filter(d => d.tenantId === tenantId);
  }

  async getDeviceById(tenantId: string, id: string): Promise<Device | null> {
    return this.devices.find(d => d.id === id && d.tenantId === tenantId) || null;
  }

  async createDevice(tenantId: string, device: Omit<Device, 'id' | 'tenantId'>): Promise<Device> {
    const newDevice: Device = {
      ...device,
      id: `device-${this.devices.length + 1}`,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.devices.push(newDevice);
    return newDevice;
  }

  async updateDevice(tenantId: string, id: string, device: Partial<Device>): Promise<Device | null> {
    const index = this.devices.findIndex(d => d.id === id && d.tenantId === tenantId);
    if (index === -1) return null;

    this.devices[index] = {
      ...this.devices[index],
      ...device,
      updatedAt: new Date().toISOString()
    };
    return this.devices[index];
  }

  async deleteDevice(tenantId: string, id: string): Promise<void> {
    this.devices = this.devices.filter(d => !(d.id === id && d.tenantId === tenantId));
  }

  // Activity Log operations
  async getActivityLogs(tenantId: string): Promise<ActivityLog[]> {
    return this.activities.filter(a => a.tenantId === tenantId);
  }

  async logActivity(tenantId: string, activity: Omit<ActivityLog, 'id' | 'tenantId' | 'timestamp'>): Promise<ActivityLog> {
    const newActivity: ActivityLog = {
      ...activity,
      id: `activity-${this.activities.length + 1}`,
      tenantId,
      timestamp: new Date().toISOString()
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  // Workflow execution
  async executeWorkflow(tenantId: string, workflowId: string): Promise<void> {
    const workflow = await this.getWorkflowById(tenantId, workflowId);
    if (!workflow) throw new Error('Workflow not found');

    try {
      // Update workflow status
      await this.updateWorkflow(tenantId, workflowId, {
        status: 'running',
        lastRun: new Date().toISOString()
      });

      // Execute the workflow using Ansible service
      await this.ansibleService.executePlaybook(workflow.content, workflow.devices);

      // Update workflow status on success
      await this.updateWorkflow(tenantId, workflowId, {
        status: 'completed'
      });

      // Log activity
      await this.logActivity(tenantId, {
        type: 'workflow_execution',
        status: 'success',
        details: `Workflow ${workflow.name} executed successfully`
      });
    } catch (error) {
      // Update workflow status on failure
      await this.updateWorkflow(tenantId, workflowId, {
        status: 'error'
      });

      // Log activity
      await this.logActivity(tenantId, {
        type: 'workflow_execution',
        status: 'error',
        details: `Workflow ${workflow.name} execution failed: ${error.message}`
      });

      throw error;
    }
  }

  // Compliance Management
  async getAllCompliancePolicies(tenantId: string): Promise<CompliancePolicy[]> {
    return this.compliancePolicies.filter(p => p.tenantId === tenantId);
  }

  async getCompliancePolicyById(tenantId: string, id: string): Promise<CompliancePolicy | null> {
    return this.compliancePolicies.find(p => p.id === id && p.tenantId === tenantId) || null;
  }

  async createCompliancePolicy(tenantId: string, policy: Omit<CompliancePolicy, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<CompliancePolicy> {
    const newPolicy: CompliancePolicy = {
      id: `policy-${Date.now()}`,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...policy
    };
    this.compliancePolicies.push(newPolicy);
    return newPolicy;
  }

  async runComplianceCheck(tenantId: string, policyId: string, deviceId: string): Promise<ComplianceCheck | null> {
    const policy = await this.getCompliancePolicyById(tenantId, policyId);
    const device = await this.getDeviceById(tenantId, deviceId);
    
    if (!policy || !device) return null;

    try {
      // Run compliance check using Ansible
      const results = await this.ansibleService.runComplianceCheck(policy, device);

      const check: ComplianceCheck = {
        id: `check-${Date.now()}`,
        tenantId,
        policyId,
        deviceId,
        timestamp: new Date().toISOString(),
        status: results.every(r => r.status === 'compliant') ? 'compliant' : 'non_compliant',
        results,
        details: { policyName: policy.name, deviceName: device.name }
      };

      this.complianceChecks.push(check);

      // Log activity
      await this.logActivity(tenantId, {
        type: 'compliance_check',
        description: `Ran compliance check for ${device.name}`,
        timestamp: new Date().toISOString(),
        status: check.status === 'compliant' ? 'success' : 'error',
        device: device.name,
        user: 'system',
        details: { checkId: check.id }
      });

      return check;
    } catch (error) {
      await this.logActivity(tenantId, {
        type: 'compliance_check',
        description: `Failed to run compliance check for ${device.name}`,
        timestamp: new Date().toISOString(),
        status: 'error',
        device: device.name,
        user: 'system',
        details: { error: error.message }
      });
      return null;
    }
  }
} 