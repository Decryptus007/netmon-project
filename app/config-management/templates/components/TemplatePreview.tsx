"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Template } from "../types"
import Editor from "@monaco-editor/react"
import yaml from 'js-yaml'

interface TemplatePreviewProps {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplatePreview({ template, open, onOpenChange }: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState("")

  const generatePreview = () => {
    if (!template) return

    let previewConfig = template.config
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      previewConfig = previewConfig.replace(regex, value)
    })

    try {
      const parsed = yaml.load(previewConfig)
      const formatted = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      })
      setPreview(formatted)
    } catch {
      setPreview(previewConfig)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Template Preview</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="space-y-4">
            <h3 className="font-medium">Variables</h3>
            <div className="space-y-4">
              {template?.variables.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <Label>
                    {variable.name}
                    {variable.required && <span className="text-red-500">*</span>}
                  </Label>
                  {variable.type === 'enum' ? (
                    <select
                      className="w-full border rounded-md p-2"
                      value={variables[variable.name] || ''}
                      onChange={(e) => {
                        setVariables(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))
                      }}
                    >
                      <option value="">Select {variable.name}</option>
                      {variable.enumValues?.map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={variable.type === 'number' ? 'number' : 'text'}
                      placeholder={variable.description}
                      value={variables[variable.name] || ''}
                      onChange={(e) => {
                        setVariables(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button onClick={generatePreview}>Generate Preview</Button>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Preview</h3>
            <div className="border rounded-md h-[calc(100%-2rem)]">
              <Editor
                height="100%"
                defaultLanguage="yaml"
                value={preview}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  wordWrap: "on"
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 