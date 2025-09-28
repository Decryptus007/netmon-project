import express from 'express';
import { ConfigManagementService } from '../services/config-management.service';
import { authenticateTenant } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();
const configService = new ConfigManagementService();

// Device Management Routes
const deviceSchema = z.object({
  name: z.string(),
  type: z.string(),
  ipAddress: z.string().ip(),
  siteId: z.string().optional(),
  credentials: z.object({
    username: z.string(),
    password: z.string(),
    port: z.number().optional()
  }).optional()
});

router.get('/devices', authenticateTenant, async (req, res) => {
  try {
    const devices = await configService.getAllDevices(req.tenantId, req.query.siteId as string);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.get('/devices/:id', authenticateTenant, async (req, res) => {
  try {
    const device = await configService.getDeviceById(req.tenantId, req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

router.post('/devices', authenticateTenant, validateRequest(deviceSchema), async (req, res) => {
  try {
    const device = await configService.addDevice(req.tenantId, req.body);
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add device' });
  }
});

router.put('/devices/:id', authenticateTenant, validateRequest(deviceSchema.partial()), async (req, res) => {
  try {
    const device = await configService.updateDevice(req.tenantId, req.params.id, req.body);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update device' });
  }
});

router.delete('/devices/:id', authenticateTenant, async (req, res) => {
  try {
    const success = await configService.deleteDevice(req.tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Configuration Templates Routes
const templateSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(),
  content: z.string(),
  parents: z.array(z.string()).optional()
});

router.get('/templates', authenticateTenant, async (req, res) => {
  try {
    const templates = await configService.getAllTemplates(req.tenantId);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/templates/:id', authenticateTenant, async (req, res) => {
  try {
    const template = await configService.getTemplateById(req.tenantId, req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.post('/templates', authenticateTenant, validateRequest(templateSchema), async (req, res) => {
  try {
    const template = await configService.createTemplate(req.tenantId, req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/templates/:id', authenticateTenant, validateRequest(templateSchema.partial()), async (req, res) => {
  try {
    const template = await configService.updateTemplate(req.tenantId, req.params.id, req.body);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Automation Workflows Routes
const workflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(z.object({
    type: z.enum(['playbook', 'command', 'template']),
    playbook: z.string().optional(),
    command: z.string().optional(),
    device: z.string().optional(),
    template: z.string().optional()
  })),
  schedule: z.object({
    enabled: z.boolean(),
    cron: z.string().optional()
  }).optional()
});

router.get('/workflows', authenticateTenant, async (req, res) => {
  try {
    const workflows = await configService.getAllWorkflows(req.tenantId);
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

router.get('/workflows/:id', authenticateTenant, async (req, res) => {
  try {
    const workflow = await configService.getWorkflowById(req.tenantId, req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

router.post('/workflows', authenticateTenant, validateRequest(workflowSchema), async (req, res) => {
  try {
    const workflow = await configService.createWorkflow(req.tenantId, req.body);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

router.post('/workflows/:id/execute', authenticateTenant, async (req, res) => {
  try {
    const success = await configService.executeWorkflow(req.tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ message: 'Workflow executed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

// Compliance Management Routes
const compliancePolicySchema = z.object({
  name: z.string(),
  description: z.string(),
  rules: z.array(z.object({
    id: z.string(),
    type: z.enum(['config_match', 'command_output', 'version_check']),
    description: z.string(),
    parameters: z.record(z.any())
  })),
  schedule: z.object({
    enabled: z.boolean(),
    cron: z.string().optional()
  }).optional()
});

router.get('/compliance/policies', authenticateTenant, async (req, res) => {
  try {
    const policies = await configService.getAllCompliancePolicies(req.tenantId);
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance policies' });
  }
});

router.get('/compliance/policies/:id', authenticateTenant, async (req, res) => {
  try {
    const policy = await configService.getCompliancePolicyById(req.tenantId, req.params.id);
    if (!policy) {
      return res.status(404).json({ error: 'Compliance policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance policy' });
  }
});

router.post('/compliance/policies', authenticateTenant, validateRequest(compliancePolicySchema), async (req, res) => {
  try {
    const policy = await configService.createCompliancePolicy(req.tenantId, req.body);
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create compliance policy' });
  }
});

router.post('/compliance/check/:policyId/:deviceId', authenticateTenant, async (req, res) => {
  try {
    const check = await configService.runComplianceCheck(req.tenantId, req.params.policyId, req.params.deviceId);
    if (!check) {
      return res.status(404).json({ error: 'Policy or device not found' });
    }
    res.json(check);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run compliance check' });
  }
});

// Activity Log Routes
router.get('/activity', authenticateTenant, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await configService.getRecentActivity(req.tenantId, limit);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router; 