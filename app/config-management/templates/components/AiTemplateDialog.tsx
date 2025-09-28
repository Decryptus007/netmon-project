"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Loader2 } from "lucide-react"
import Editor from "@monaco-editor/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AiTemplateDialogProps {
  onTemplateCreate: (template: {
    name: string
    description: string
    deviceType: string
    config: string
    category: 'network' | 'security' | 'system' | 'monitoring' | 'custom'
    variables: { name: string; description: string; defaultValue?: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }[]
  }) => void
  children?: React.ReactNode
}

const categories = ['network', 'security', 'system', 'monitoring', 'custom']

export function AiTemplateDialog({ onTemplateCreate, children }: AiTemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState<{
    name: string
    description: string
    deviceType: string
    config: string
    category: 'network' | 'security' | 'system' | 'monitoring' | 'custom'
    variables: { name: string; description: string; defaultValue?: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }[]
  } | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setGeneratedTemplate({
        name: "Generated Template",
        description: "AI generated configuration template",
        deviceType: "Router",
        category: "network",
        variables: [],
        config: `---
# Generated Configuration
- name: Configure device
  hosts: all
  tasks:
    - name: Set basic configuration
      ios_config:
        lines:
          - hostname {{ hostname }}
          - ntp server 10.0.0.1`
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCreate = () => {
    if (generatedTemplate) {
      onTemplateCreate(generatedTemplate)
      setOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setPrompt("")
    setGeneratedTemplate(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="default" className="w-full justify-start">
            <Bot className="mr-2 h-4 w-4" />
            AI Generated
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Generate Template with AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 h-full">
          <div className="space-y-2">
            <Label>Describe the configuration you want to create</Label>
            <Textarea
              placeholder="E.g., Create a router configuration template that sets up OSPF routing with area 0, configures loopback interfaces, and enables basic security features"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-32"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!prompt || generating}
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Template
            </Button>
          </div>

          {generatedTemplate && (
            <Tabs defaultValue="preview" className="flex-1">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="h-[calc(100%-2rem)] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={generatedTemplate.name}
                      onChange={(e) => setGeneratedTemplate({
                        ...generatedTemplate,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label>Device Type</Label>
                    <Input
                      value={generatedTemplate.deviceType}
                      onChange={(e) => setGeneratedTemplate({
                        ...generatedTemplate,
                        deviceType: e.target.value
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={generatedTemplate.category}
                    onValueChange={(value: 'network' | 'security' | 'system' | 'monitoring' | 'custom') =>
                      setGeneratedTemplate({
                        ...generatedTemplate,
                        category: value
                      })
                    }
                  >
                    <SelectTrigger>
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
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={generatedTemplate.description}
                    onChange={(e) => setGeneratedTemplate({
                      ...generatedTemplate,
                      description: e.target.value
                    })}
                  />
                </div>
                <div className="h-[calc(100%-12rem)]">
                  <Label>Configuration</Label>
                  <div className="border rounded-md h-full">
                    <Editor
                      height="100%"
                      defaultLanguage="yaml"
                      value={generatedTemplate.config}
                      onChange={(value) => setGeneratedTemplate({
                        ...generatedTemplate,
                        config: value || ""
                      })}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        wordWrap: "on"
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {generatedTemplate && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create Template
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 