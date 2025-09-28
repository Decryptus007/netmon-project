"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Template } from "../types"
import { Upload, Download } from "lucide-react"
import Editor from "@monaco-editor/react"
import yaml from 'js-yaml'

interface ImportExportDialogProps {
  onImport: (templates: Template[]) => void
  templates: Template[]
}

export function ImportExportDialog({ onImport, templates }: ImportExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'import' | 'export'>('export')
  const [importData, setImportData] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    try {
      const imported = yaml.load(importData) as Template[]
      if (!Array.isArray(imported)) {
        throw new Error("Invalid import format")
      }
      onImport(imported)
      setOpen(false)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleExport = () => {
    const exportData = yaml.dump(templates, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    })
    const blob = new Blob([exportData], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'templates.yaml'
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setMode('import')
            setOpen(true)
          }}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => {
            setMode('export')
            handleExport()
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </DialogTrigger>
      {mode === 'import' && (
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-md h-[400px]">
              <Editor
                height="400px"
                defaultLanguage="yaml"
                value={importData}
                onChange={(value) => {
                  setImportData(value || "")
                  setError(null)
                }}
                theme="vs-dark"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
} 