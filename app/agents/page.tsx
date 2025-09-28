"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Server, Settings2, Trash2, RefreshCw, Download, FileCode, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { useTenant } from "@/app/contexts/TenantContext";

interface Policy {
  id: string
  name: string
  description: string
  platform?: 'windows' | 'mac' | 'linux'
  dataTypes: {
    snmp?: {
      enabled: boolean
      metrics: string[]
      interval: number
    }
    syslog?: {
      enabled: boolean
      facilities: string[]
      severities: string[]
    }
    netflow?: {
      enabled: boolean
      samplingRate: number
      template: string
    }
  }
}

interface Agent {
  id: string
  name: string // This will be the hostname of the collector
  policyId: string
  status: "online" | "offline" | "error"
  lastSeen: string
  platform: "windows" | "mac" | "linux"
  ipAddress: string
  version: string
  dataTypes: {
    snmp?: {
      status: "active" | "inactive" | "error"
      lastCollection: string
    }
    syslog?: {
      status: "active" | "inactive" | "error"
      lastCollection: string
    }
    netflow?: {
      status: "active" | "inactive" | "error"
      lastCollection: string
    }
  }
}

export default function AgentsPage() {
  const { tenant, site } = useTenant();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showNewPolicyAlert, setShowNewPolicyAlert] = useState(false);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);
  const [, setIsLoading] = useState(true);
  const [unenrollingAgent, setUnenrollingAgent] = useState<string | null>(null);
  const { toast } = useToast();

  const [policyForm, setPolicyForm] = useState({
    name: "",
    description: "",
    dataTypes: {
      snmp: {
        enabled: false,
        metrics: [] as string[],
        interval: 300
      },
      syslog: {
        enabled: false,
        facilities: [] as string[],
        severities: [] as string[]
      },
      netflow: {
        enabled: false,
        samplingRate: 1000,
        template: "default"
      }
    }
  });

  // Debug tenant context
  useEffect(() => {
    console.log('Tenant Context:', { tenant, site });
  }, [tenant, site]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data with tenant:', tenant?.id);
      
      if (!tenant) {
        console.log('No tenant available, skipping data load');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching agents and policies...');
        const [agentsData, policiesData] = await Promise.all([
          api.agents.getAll(tenant.id, site?.id),
          api.policies.getAll(tenant.id)
        ]);
        console.log('Received data:', { agents: agentsData.agents, policies: policiesData.policies });
        setAgents(agentsData.agents);
        setPolicies(policiesData.policies);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tenant, site, toast]);

  const handleAddPolicy = () => {
    setSelectedPolicy(null);
    setPolicyForm({
      name: "",
      description: "",
      dataTypes: {
        snmp: {
          enabled: false,
          metrics: [],
          interval: 300
        },
        syslog: {
          enabled: false,
          facilities: [],
          severities: []
        },
        netflow: {
          enabled: false,
          samplingRate: 1000,
          template: "default"
        }
      }
    });
    setShowPolicyDialog(true);
  };

  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setPolicyForm({
      name: policy.name,
      description: policy.description,
      dataTypes: {
        snmp: policy.dataTypes.snmp || {
          enabled: false,
          metrics: [],
          interval: 300
        },
        syslog: policy.dataTypes.syslog || {
          enabled: false,
          facilities: [],
          severities: []
        },
        netflow: policy.dataTypes.netflow || {
          enabled: false,
          samplingRate: 1000,
          template: "default"
        }
      }
    });
    setShowPolicyDialog(true);
  };

  const handleSavePolicy = async () => {
    if (!tenant) return;

    try {
      const policyData = {
        name: policyForm.name,
        description: policyForm.description,
        dataTypes: {
          ...(policyForm.dataTypes.snmp.enabled && {
            snmp: policyForm.dataTypes.snmp
          }),
          ...(policyForm.dataTypes.syslog.enabled && {
            syslog: policyForm.dataTypes.syslog
          }),
          ...(policyForm.dataTypes.netflow.enabled && {
            netflow: policyForm.dataTypes.netflow
          })
        }
      };

      if (selectedPolicy) {
        const response = await api.policies.update(tenant.id, selectedPolicy.id, policyData);
        setPolicies(prev => prev.map(p => p.id === selectedPolicy.id ? response.policy : p));
      } else {
        const response = await api.policies.create(tenant.id, policyData);
        setPolicies(prev => [...prev, response.policy]);
      }

      setShowPolicyDialog(false);
      setSelectedPolicy(null);
      
      if (!selectedPolicy) {
        setShowNewPolicyAlert(true);
      }

      toast({
        title: "Success",
        description: `Policy ${selectedPolicy ? 'updated' : 'created'} successfully.`
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save policy. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadAgent = async (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowDownloadDialog(true);
  };

  const handleUnenrollAgent = async (agentId: string) => {
    if (!tenant) return;

    try {
      setUnenrollingAgent(agentId);
      await api.agents.unregister(tenant.id, agentId);
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      setShowAgentDetails(false);
      toast({
        title: "Success",
        description: "Agent unenrolled successfully."
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to unenroll agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUnenrollingAgent(null);
    }
  };

  const handleDownloadAgentBinary = async (policyId: string, platform: 'windows' | 'mac' | 'linux') => {
    if (!tenant) return;

    try {
      const response = await api.policies.downloadAgent(tenant.id, policyId, platform);
      window.open(response.downloadUrl, '_blank');
      setShowDownloadDialog(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to download agent binary. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderAgentCard = (agent: Agent) => {
    const policy = policies.find(p => p.id === agent.policyId)
    return (
      <Card 
        key={agent.id} 
        className="relative cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => {
          setSelectedAgent(agent)
          setShowAgentDetails(true)
        }}
      >
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded-lg">
                <Server className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">{agent.name}</CardTitle>
                <CardDescription className="text-xs">v{agent.version}</CardDescription>
              </div>
            </div>
            <Badge 
              variant={agent.status === "online" ? "default" : 
                      agent.status === "error" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {agent.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="truncate">
              <span className="font-medium">IP:</span> {agent.ipAddress}
            </div>
            <div className="truncate">
              <span className="font-medium">Platform:</span> {agent.platform}
            </div>
            <div className="truncate">
              <span className="font-medium">Policy:</span> {policy?.name || "None"}
            </div>
            <div className="col-span-3 text-muted-foreground">
              Last seen: {new Date(agent.lastSeen).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPolicyCard = (policy: Policy) => {
    const policyAgents = agents.filter(agent => agent.policyId === policy.id)
    return (
      <Card 
        key={policy.id} 
        className="relative cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => {
          setSelectedPolicy(policy)
          setShowPolicyDetails(true)
        }}
      >
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded-lg">
                <FileCode className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">{policy.name}</CardTitle>
                <CardDescription className="text-xs">{policy.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditPolicy(policy)
                }}
              >
                <Settings2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownloadAgent(policy)
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-xs">SNMP</Badge>
            <Badge variant="outline" className="text-xs">Syslog</Badge>
            <Badge variant="outline" className="text-xs">Netflow</Badge>
            <span className="text-muted-foreground ml-auto">{policyAgents.length} agents</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Agents & Policies</h1>
          <p className="text-muted-foreground mt-2">
            Manage your data collection policies and monitor agent health.
          </p>
        </div>
        <Button onClick={handleAddPolicy}>
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>
        <TabsContent value="agents" className="space-y-4">
          {agents.map(renderAgentCard)}
        </TabsContent>
        <TabsContent value="policies" className="space-y-4">
          {policies.map(renderPolicyCard)}
        </TabsContent>
      </Tabs>

      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedPolicy ? "Edit Policy" : "Add New Policy"}</DialogTitle>
            <DialogDescription>
              Configure your data collection policy settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="policy-name">Name</Label>
              <Input
                id="policy-name"
                value={policyForm.name}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="policy-description">Description</Label>
              <Input
                id="policy-description"
                value={policyForm.description}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="snmp-enabled"
                  checked={policyForm.dataTypes.snmp.enabled}
                  onCheckedChange={(checked) => 
                    setPolicyForm(prev => ({
                      ...prev,
                      dataTypes: {
                        ...prev.dataTypes,
                        snmp: {
                          ...prev.dataTypes.snmp,
                          enabled: checked as boolean
                        }
                      }
                    }))
                  }
                />
                <Label htmlFor="snmp-enabled">Enable SNMP Collection</Label>
              </div>
              {policyForm.dataTypes.snmp.enabled && (
                <div className="grid gap-2 pl-6">
                  <Label htmlFor="snmp-metrics">Metrics to Collect</Label>
                  <Select
                    value={policyForm.dataTypes.snmp.metrics.join(",")}
                    onValueChange={(value) => 
                      setPolicyForm(prev => ({
                        ...prev,
                        dataTypes: {
                          ...prev.dataTypes,
                          snmp: {
                            ...prev.dataTypes.snmp,
                            metrics: value.split(",")
                          }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interface,system,memory,cpu">Basic System Metrics</SelectItem>
                      <SelectItem value="interface,system,memory,cpu,storage,network">Extended Metrics</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label htmlFor="snmp-interval">Collection Interval (seconds)</Label>
                  <Input
                    id="snmp-interval"
                    type="number"
                    value={policyForm.dataTypes.snmp.interval}
                    onChange={(e) => 
                      setPolicyForm(prev => ({
                        ...prev,
                        dataTypes: {
                          ...prev.dataTypes,
                          snmp: {
                            ...prev.dataTypes.snmp,
                            interval: parseInt(e.target.value)
                          }
                        }
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="syslog-enabled"
                  checked={policyForm.dataTypes.syslog.enabled}
                  onCheckedChange={(checked) => 
                    setPolicyForm(prev => ({
                      ...prev,
                      dataTypes: {
                        ...prev.dataTypes,
                        syslog: {
                          ...prev.dataTypes.syslog,
                          enabled: checked as boolean
                        }
                      }
                    }))
                  }
                />
                <Label htmlFor="syslog-enabled">Enable Syslog Collection</Label>
              </div>
              {policyForm.dataTypes.syslog.enabled && (
                <div className="grid gap-2 pl-6">
                  <Label htmlFor="syslog-facilities">Facilities</Label>
                  <Select
                    value={policyForm.dataTypes.syslog.facilities.join(",")}
                    onValueChange={(value) => 
                      setPolicyForm(prev => ({
                        ...prev,
                        dataTypes: {
                          ...prev.dataTypes,
                          syslog: {
                            ...prev.dataTypes.syslog,
                            facilities: value.split(",")
                          }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local0,local1">Local Facilities</SelectItem>
                      <SelectItem value="kern,user,mail,daemon">System Facilities</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label htmlFor="syslog-severities">Severities</Label>
                  <Select
                    value={policyForm.dataTypes.syslog.severities.join(",")}
                    onValueChange={(value) => 
                      setPolicyForm(prev => ({
                        ...prev,
                        dataTypes: {
                          ...prev.dataTypes,
                          syslog: {
                            ...prev.dataTypes.syslog,
                            severities: value.split(",")
                          }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info,warning,error">Important Events</SelectItem>
                      <SelectItem value="emerg,alert,crit,err,warning,notice,info,debug">All Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="netflow-enabled"
                  checked={policyForm.dataTypes.netflow.enabled}
                  onCheckedChange={(checked) => 
                    setPolicyForm(prev => ({
                      ...prev,
                      dataTypes: {
                        ...prev.dataTypes,
                        netflow: {
                          ...prev.dataTypes.netflow,
                          enabled: checked as boolean
                        }
                      }
                    }))
                  }
                />
                <Label htmlFor="netflow-enabled">Enable Netflow Collection</Label>
              </div>
              {policyForm.dataTypes.netflow.enabled && (
                <div className="grid gap-2 pl-6">
                  <Label htmlFor="netflow-sampling">Sampling Rate</Label>
                  <Input
                    id="netflow-sampling"
                    type="number"
                    value={policyForm.dataTypes.netflow.samplingRate}
                    onChange={(e) => 
                      setPolicyForm(prev => ({
                        ...prev,
                        dataTypes: {
                          ...prev.dataTypes,
                          netflow: {
                            ...prev.dataTypes.netflow,
                            samplingRate: parseInt(e.target.value)
                          }
                        }
                      }))
                    }
                  />
                  <Label htmlFor="netflow-template">Template</Label>
                  <Select
                    value={policyForm.dataTypes.netflow.template}
                    onValueChange={(value) => 
                      setPolicyForm(prev => ({
                        ...prev,
                        dataTypes: {
                          ...prev.dataTypes,
                          netflow: {
                            ...prev.dataTypes.netflow,
                            template: value
                          }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSavePolicy}>Save Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Download Agent</DialogTitle>
            <DialogDescription>
              Download the agent binary for your selected platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select
                value={selectedPolicy?.platform || "linux"}
                onValueChange={() => {
                  // Handle platform selection
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="mac">macOS</SelectItem>
                  <SelectItem value="linux">Linux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Installation Instructions</Label>
              <div className="text-sm space-y-2">
                {selectedPolicy?.platform === "windows" && (
                  <>
                    <p>1. Download the Windows agent installer</p>
                    <p>2. Run the installer as administrator</p>
                    <p>3. Follow the installation wizard</p>
                    <p>4. The agent will start automatically as a Windows service</p>
                  </>
                )}
                {selectedPolicy?.platform === "mac" && (
                  <>
                    <p>1. Download the macOS agent package</p>
                    <p>2. Double-click the package to install</p>
                    <p>3. Follow the installation wizard</p>
                    <p>4. The agent will start automatically as a LaunchDaemon</p>
                  </>
                )}
                {selectedPolicy?.platform === "linux" && (
                  <>
                    <p>1. Download the Linux agent package</p>
                    <p>2. Install using your package manager:</p>
                    <code className="block p-2 bg-muted rounded">
                      sudo dpkg -i netmon-agent.deb  # For Debian/Ubuntu
                      sudo rpm -i netmon-agent.rpm   # For RHEL/CentOS
                    </code>
                    <p>3. The agent will start automatically as a systemd service</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (selectedPolicy) {
                handleDownloadAgentBinary(selectedPolicy.id, selectedPolicy.platform || 'linux');
              }
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewPolicyAlert} onOpenChange={setShowNewPolicyAlert}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Agent to Policy</DialogTitle>
            <DialogDescription>
              Would you like to download the agent binary for this policy now?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>New Policy Created</AlertTitle>
              <AlertDescription>
                To start collecting data, you need to install an agent on your target system.
                The agent will automatically register itself with the service using its hostname.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPolicyAlert(false)}>
              Later
            </Button>
            <Button onClick={() => {
              setShowNewPolicyAlert(false)
              setShowDownloadDialog(true)
            }}>
              Download Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Agent Details Dialog */}
      <Dialog open={showAgentDetails} onOpenChange={setShowAgentDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
            <DialogDescription>
              Detailed information about the agent and its data collection status.
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hostname</Label>
                  <div className="text-sm">{selectedAgent.name}</div>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <div className="text-sm">{selectedAgent.ipAddress}</div>
                </div>
                <div>
                  <Label>Platform</Label>
                  <div className="text-sm">{selectedAgent.platform}</div>
                </div>
                <div>
                  <Label>Version</Label>
                  <div className="text-sm">{selectedAgent.version}</div>
                </div>
                <div>
                  <Label className="mr-2">Status</Label>
                  <Badge 
                    variant={selectedAgent.status === "online" ? "default" : 
                            selectedAgent.status === "error" ? "destructive" : "secondary"}
                  >
                    {selectedAgent.status}
                  </Badge>
                </div>
                <div>
                  <Label>Last Seen</Label>
                  <div className="text-sm">{new Date(selectedAgent.lastSeen).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Data Collection Status</Label>
                <div className="space-y-2">
                  {selectedAgent.dataTypes.snmp && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">SNMP</Badge>
                        <span className="text-sm">Status: <span className="ml-1">{selectedAgent.dataTypes.snmp.status}</span></span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Last Collection: <span className="ml-1">{new Date(selectedAgent.dataTypes.snmp.lastCollection).toLocaleString()}</span>
                      </span>
                    </div>
                  )}
                  {selectedAgent.dataTypes.syslog && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Syslog</Badge>
                        <span className="text-sm">Status: <span className="ml-1">{selectedAgent.dataTypes.syslog.status}</span></span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Last Collection: <span className="ml-1">{new Date(selectedAgent.dataTypes.syslog.lastCollection).toLocaleString()}</span>
                      </span>
                    </div>
                  )}
                  {selectedAgent.dataTypes.netflow && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Netflow</Badge>
                        <span className="text-sm">Status: <span className="ml-1">{selectedAgent.dataTypes.netflow.status}</span></span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Last Collection: <span className="ml-1">{new Date(selectedAgent.dataTypes.netflow.lastCollection).toLocaleString()}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => handleUnenrollAgent(selectedAgent!.id)}
              disabled={unenrollingAgent === selectedAgent?.id}
            >
              {unenrollingAgent === selectedAgent?.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Unenrolling...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Unenroll Agent
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Policy Details Dialog */}
      <Dialog open={showPolicyDetails} onOpenChange={setShowPolicyDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
            <DialogDescription>
              Detailed information about the policy and its configuration.
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <div className="text-sm">{selectedPolicy.name}</div>
                <Label>Description</Label>
                <div className="text-sm">{selectedPolicy.description}</div>
              </div>

              <div className="space-y-4">
                <Label>Data Collection Configuration</Label>
                {selectedPolicy.dataTypes.snmp && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">SNMP</Badge>
                      <span className="text-sm font-medium">Enabled</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Metrics:</span>
                        <div className="mt-1">{selectedPolicy.dataTypes.snmp.metrics.join(", ")}</div>
                      </div>
                      <div>
                        <span className="font-medium">Interval:</span>
                        <div className="mt-1">{selectedPolicy.dataTypes.snmp.interval} seconds</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPolicy.dataTypes.syslog && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Syslog</Badge>
                      <span className="text-sm font-medium">Enabled</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Facilities:</span>
                        <div className="mt-1">{selectedPolicy.dataTypes.syslog.facilities.join(", ")}</div>
                      </div>
                      <div>
                        <span className="font-medium">Severities:</span>
                        <div className="mt-1">{selectedPolicy.dataTypes.syslog.severities.join(", ")}</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPolicy.dataTypes.netflow && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Netflow</Badge>
                      <span className="font-medium">Enabled</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Sampling Rate:</span>
                        <div className="mt-1">{selectedPolicy.dataTypes.netflow.samplingRate}</div>
                      </div>
                      <div>
                        <span className="font-medium">Template:</span>
                        <div className="mt-1">{selectedPolicy.dataTypes.netflow.template}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Label>Active Agents</Label>
                <div className="mt-2 space-y-2">
                  {agents.filter(agent => agent.policyId === selectedPolicy.id).map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-primary" />
                        <span className="text-sm">{agent.name}</span>
                      </div>
                      <Badge 
                        variant={agent.status === "online" ? "default" : 
                                agent.status === "error" ? "destructive" : "secondary"}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDetails(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowPolicyDetails(false)
              handleDownloadAgent(selectedPolicy!)
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 