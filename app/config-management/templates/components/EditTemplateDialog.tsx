"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import Editor from "@monaco-editor/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import yaml from 'js-yaml'
import { Template } from "../types"

interface EditTemplateDialogProps {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateEdit: (id: number, template: Partial<Template>) => void
}

const deviceTypes = ["Router", "Switch", "Firewall", "All Devices"]

export function EditTemplateDialog({ 
  template, 
  open, 
  onOpenChange,
  onTemplateEdit 
}: EditTemplateDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [config, setConfig] = useState("")
  const [yamlError, setYamlError] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description)
      setDeviceType(template.deviceType)
      setConfig(template.config)
    }
  }, [template])

  const handleConfigChange = (value: string | undefined) => {
    const newConfig = value || ""
    setConfig(newConfig)
    
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
    if (!template || yamlError) return

    onTemplateEdit(template.id, {
      name,
      description,
      deviceType,
      config,
      lastModified: new Date().toISOString().replace('T', ' ').split('.')[0]
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!!yamlError}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 