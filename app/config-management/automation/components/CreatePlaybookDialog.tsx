"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import Editor from "@monaco-editor/react"

interface CreatePlaybookDialogProps {
  onPlaybookCreate: (playbook: unknown) => void
}

const deviceTypes = ["Router", "Switch", "Firewall", "All Devices"]

export function CreatePlaybookDialog({ onPlaybookCreate }: CreatePlaybookDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [config, setConfig] = useState(`---
# Example Playbook Configuration
- name: Configure NTP servers
  hosts: all
  tasks:
    - name: Set NTP servers
      ios_config:
        lines:
          - ntp server 10.0.0.1
          - ntp server 10.0.0.2
`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onPlaybookCreate({
      name,
      description,
      deviceType,
      config
    })
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setDeviceType("")
    setConfig(`---
# Example Playbook Configuration
- name: New Playbook
  hosts: all
  tasks:
    - name: Task 1
      ios_config:
        lines:
          - # Add configuration here
`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Playbook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Create New Playbook</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Playbook Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter playbook name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType} required>
                <SelectTrigger>
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
              placeholder="Enter playbook description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Configuration</Label>
            <div className="border rounded-md h-[400px]">
              <Editor
                height="400px"
                defaultLanguage="yaml"
                value={config}
                onChange={(value) => setConfig(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Playbook</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 