"use client"

import { useState } from "react"
import { PlaySquare, FileCode, Check, AlertCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CreateAutomationDialog } from "./components/CreateAutomationDialog"

interface Playbook {
  id: number
  name: string
  description: string
  targetDevices: string[]
  template: string
  lastRun: string | null
  status: 'success' | 'failed' | 'never' | 'running'
  devices: number
}

const playbooks: Playbook[] = [
  {
    id: 1,
    name: "Daily NTP Update",
    description: "Update NTP servers on core network devices",
    targetDevices: ["core-switch-1", "core-router-1"],
    template: "ntp-configuration",
    lastRun: "2024-02-19 10:15:00",
    status: "success",
    devices: 15
  }
]

const sampleDevices = [
  { id: "1", name: "core-switch-1", type: "Switch" },
  { id: "2", name: "edge-router-1", type: "Router" },
  { id: "3", name: "fw-1", type: "Firewall" },
  // Add more devices...
]

const sampleTemplates = [
  {
    id: 1,
    name: "Base Router Config",
    description: "Standard router configuration template",
    deviceType: "Router",
    category: "network" as const,
    lastModified: "2024-02-18 09:00:00",
    author: "Admin",
    config: "...",
    variables: []
  },
  // Add more templates...
]

export default function AutomationPage() {
  const [playBookList, setPlayBookList] = useState<Playbook[]>(playbooks)

  const handleRunPlaybook = async (id: number) => {
    setPlayBookList(prev => 
      prev.map(p => p.id === id ? { ...p, status: 'running' } : p)
    )

    // Simulate playbook execution
    await new Promise(resolve => setTimeout(resolve, 3000))

    setPlayBookList(prev =>
      prev.map(p => p.id === id ? {
        ...p,
        status: 'success',
        lastRun: new Date().toISOString().replace('T', ' ').split('.')[0],
        devices: Math.floor(Math.random() * 20) + 1
      } : p)
    )
  }

  const handleCreateAutomation = (automation: {
    name: string
    description: string
    template: string
    targetDevices: string[]
  }) => {
    const newPlaybook: Playbook = {
      id: playBookList.length + 1,
      name: automation.name,
      description: automation.description,
      template: automation.template,
      targetDevices: automation.targetDevices,
      lastRun: null,
      status: 'never',
      devices: automation.targetDevices.length
    }
    setPlayBookList([...playBookList, newPlaybook])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Configuration Automation</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search playbooks..."
            />
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="never">Never Run</SelectItem>
            </SelectContent>
          </Select>
          <CreateAutomationDialog
            onAutomationCreate={handleCreateAutomation}
            templates={sampleTemplates}
            availableDevices={sampleDevices}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Target Devices</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playBookList.map((playbook) => (
              <TableRow key={playbook.id}>
                <TableCell className="font-medium">{playbook.name}</TableCell>
                <TableCell>{playbook.description}</TableCell>
                <TableCell>{playbook.template}</TableCell>
                <TableCell>{playbook.targetDevices.join(", ")}</TableCell>
                <TableCell>{playbook.lastRun || 'Never'}</TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                    playbook.status === 'success' && "bg-success/10 text-success",
                    playbook.status === 'failed' && "bg-error/10 text-error",
                    playbook.status === 'never' && "bg-gray-100 text-gray-600",
                    playbook.status === 'running' && "bg-blue-100 text-blue-600"
                  )}>
                    {playbook.status === 'running' ? (
                      <>
                        <PlaySquare className="h-3 w-3 animate-pulse" />
                        Running
                      </>
                    ) : playbook.status === 'success' ? (
                      <>
                        <Check className="h-3 w-3" />
                        Success
                      </>
                    ) : playbook.status === 'failed' ? (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </>
                    ) : (
                      'Never run'
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRunPlaybook(playbook.id)}
                      disabled={playbook.status === 'running'}
                    >
                      <PlaySquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FileCode className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 