"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, AlertCircle } from "lucide-react"
import Editor from "@monaco-editor/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import yaml from 'js-yaml'

interface CreateTemplateDialogProps {
  onTemplateCreate: (template: {
    name: string
    description: string
    deviceType: string
    config: string
    category: 'network' | 'security' | 'system' | 'monitoring' | 'custom'
    variables: { name: string; description: string; defaultValue?: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }[]
  }) => void
  children: React.ReactNode
}

const deviceTypes = ["Router", "Switch", "Firewall", "All Devices"]
const categories = ['network', 'security', 'system', 'monitoring', 'custom']

const defaultConfig = `---
# Example Template Configuration
- name: Configure device
  hosts: all
  tasks:
    - name: Set configuration
      ios_config:
        lines:
          - # Add configuration here
`

export function CreateTemplateDialog({ onTemplateCreate }: CreateTemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [category, setCategory] = useState<'network' | 'security' | 'system' | 'monitoring' | 'custom'>('network')
  const [config, setConfig] = useState(defaultConfig)
  const [yamlError, setYamlError] = useState<string | null>(null)
  const [variables, setVariables] = useState<{ name: string; description: string; defaultValue?: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }[]>([])

  const handleConfigChange = (value: string | undefined) => {
    const newConfig = value || ""
    setConfig(newConfig)
    
    // Validate YAML
    try {
      yaml.load(newConfig)
      setYamlError(null)
    } catch (e) {
      setYamlError((e as Error).message)
    }
  }

  const formatConfig = () => {
    try {
      const parsed = yaml.load(config)
      const formatted = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
      setConfig(formatted)
      setYamlError(null)
    } catch (e) {
      setYamlError((e as Error).message)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (yamlError) return

    onTemplateCreate({
      name,
      description,
      deviceType,
      config,
      category,
      variables
    })
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setDeviceType("")
    setCategory('network')
    setConfig(defaultConfig)
    setYamlError(null)
    setVariables([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter template name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType} required>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: 'network' | 'security' | 'system' | 'monitoring' | 'custom') => setCategory(value)} required>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Configuration</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={formatConfig}
                disabled={!!yamlError}
              >
                Format YAML
              </Button>
            </div>
            <div className="border rounded-md">
              <Editor
                height="400px"
                defaultLanguage="yaml"
                value={config}
                onChange={handleConfigChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  wordWrap: "on",
                  wrappingIndent: "indent",
                  tabSize: 2
                }}
              />
            </div>
            {yamlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  YAML Error: {yamlError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!!yamlError}
            >
              Create Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 