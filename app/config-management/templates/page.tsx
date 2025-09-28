"use client"

import { useState } from "react"
import { Copy, FileCode, Search, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { EditTemplateDialog } from "./components/EditTemplateDialog"
import { ImportExportDialog } from "./components/ImportExportDialog"
import { TemplatePreview } from "./components/TemplatePreview"
import { NewTemplateButton } from "./components/NewTemplateButton"
import { Template } from "./types"

const templates: Template[] = [
  {
    id: 1,
    name: "Base Router Config",
    description: "Standard router configuration template",
    deviceType: "Router",
    category: "network" as const,
    lastModified: "2024-02-18 09:00:00",
    author: "Admin",
    config: `---
# Base Router Configuration
- name: Configure base settings
  hosts: routers
  tasks:
    - name: Set hostname
      ios_config:
        lines:
          - hostname {{ hostname }}
    - name: Configure NTP
      ios_config:
        lines:
          - ntp server 10.0.0.1
          - ntp server 10.0.0.2`,
    variables: []
  },
  {
    id: 2,
    name: "Switch Access List",
    description: "Standard ACL template for switches",
    deviceType: "Switch",
    category: "security" as const,
    lastModified: "2024-02-19 14:30:00",
    author: "Admin",
    config: `---
# Switch ACL Configuration
- name: Configure ACLs
  hosts: switches
  tasks:
    - name: Set access lists
      ios_config:
        lines:
          - access-list 100 permit ip 10.0.0.0 0.0.0.255 any
          - access-list 100 deny ip any any log`,
    variables: []
  }
]

export default function TemplatesPage() {
  const [templateList, setTemplateList] = useState<Template[]>(templates)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const handleCreateTemplate = (newTemplate: {
    name: string
    description: string
    deviceType: string
    config: string
    category: 'network' | 'security' | 'system' | 'monitoring' | 'custom'
    variables: { name: string; description: string; defaultValue?: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }[]
  }) => {
    const template: Template = {
      id: templateList.length + 1,
      ...newTemplate,
      lastModified: new Date().toISOString().replace('T', ' ').split('.')[0],
      author: "Admin"
    }
    setTemplateList([...templateList, template])
  }

  const handleEditTemplate = (id: number, updates: Partial<Template>) => {
    setTemplateList(prev => 
      prev.map(template => 
        template.id === id 
          ? { ...template, ...updates }
          : template
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Configuration Templates</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ImportExportDialog
            templates={templateList}
            onImport={(templates) => setTemplateList(templates)}
          />
          <NewTemplateButton onTemplateCreate={handleCreateTemplate} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Device Type</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templateList.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.description}</TableCell>
                <TableCell>{template.deviceType}</TableCell>
                <TableCell>{template.lastModified}</TableCell>
                <TableCell>{template.author}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="View/Edit"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <FileCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Copy">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Preview"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditTemplateDialog
        template={editingTemplate}
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        onTemplateEdit={handleEditTemplate}
      />

      <TemplatePreview
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      />
    </div>
  )
} 