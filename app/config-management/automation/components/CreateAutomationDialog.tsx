"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Server, CalendarIcon } from "lucide-react"
import { Template } from "../../templates/types"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import Editor from "@monaco-editor/react"
import yaml from 'js-yaml'

interface CreateAutomationDialogProps {
  onAutomationCreate: (automation: {
    name: string
    description: string
    template: string
    targetDevices: string[]
  }) => void
  templates: Template[]
  availableDevices: Array<{ id: string, name: string, type: string }>
}

interface Schedule {
  enabled: boolean
  type: 'once' | 'daily' | 'weekly'
  date?: Date
  time?: string
  daysOfWeek?: number[]
}

export function CreateAutomationDialog({ 
  onAutomationCreate, 
  templates,
  availableDevices 
}: CreateAutomationDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [schedule, setSchedule] = useState<Schedule>({
    enabled: false,
    type: 'once',
    date: new Date(),
    time: '12:00'
  })
  const [selectedDeviceGroups, setSelectedDeviceGroups] = useState<string[]>([])
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [previewConfig, setPreviewConfig] = useState("")

  // Sample device groups
  const deviceGroups = [
    { id: 'core', name: 'Core Network', devices: ['1', '2'] },
    { id: 'edge', name: 'Edge Devices', devices: ['3', '4'] },
    { id: 'dmz', name: 'DMZ', devices: ['5', '6'] }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAutomationCreate({
      name,
      description,
      template: selectedTemplate,
      targetDevices: selectedDevices
    })
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setSelectedTemplate("")
    setSelectedDevices([])
    setSchedule({
      enabled: false,
      type: 'once',
      date: new Date(),
      time: '12:00'
    })
    setSelectedDeviceGroups([])
    setVariables({})
    setPreviewConfig("")
  }

  const filteredDevices = selectedTemplate
    ? availableDevices.filter(device => {
        const template = templates.find(t => t.name === selectedTemplate)
        return template?.deviceType.toLowerCase() === device.type.toLowerCase() ||
               template?.deviceType.toLowerCase() === 'all devices'
      })
    : availableDevices

  const selectedTemplateObj = templates.find(t => t.name === selectedTemplate)

  const generatePreview = () => {
    if (!selectedTemplateObj) return

    let preview = selectedTemplateObj.config
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      preview = preview.replace(regex, value)
    })

    try {
      const parsed = yaml.load(preview)
      const formatted = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      })
      setPreviewConfig(formatted)
    } catch {
      setPreviewConfig(preview)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Automation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Automation</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Automation Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter automation name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter automation description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Configuration Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Device Groups</Label>
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  {deviceGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedDeviceGroups.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDeviceGroups([...selectedDeviceGroups, group.id])
                            setSelectedDevices([...new Set([...selectedDevices, ...group.devices])])
                          } else {
                            setSelectedDeviceGroups(selectedDeviceGroups.filter(id => id !== group.id))
                            setSelectedDevices(selectedDevices.filter(id => !group.devices.includes(id)))
                          }
                        }}
                      />
                      <div>
                        <label className="font-medium">{group.name}</label>
                        <div className="text-xs text-muted-foreground">
                          {group.devices.length} devices
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Individual Devices</Label>
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  {filteredDevices.map((device) => (
                    <div key={device.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={device.id}
                        checked={selectedDevices.includes(device.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDevices([...selectedDevices, device.id])
                          } else {
                            setSelectedDevices(selectedDevices.filter(id => id !== device.id))
                          }
                        }}
                      />
                      <label htmlFor={device.id} className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        {device.name}
                        <span className="text-xs text-gray-500">({device.type})</span>
                      </label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variables" className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label>Template Variables</Label>
                  <ScrollArea className="h-[400px] border rounded-md p-4">
                    {selectedTemplateObj?.variables.map((variable) => (
                      <div key={variable.name} className="space-y-2 mb-4">
                        <Label>
                          {variable.name}
                          {variable.required && <span className="text-red-500">*</span>}
                        </Label>
                        {variable.type === 'enum' ? (
                          <Select
                            value={variables[variable.name] || ''}
                            onValueChange={(value) => {
                              setVariables(prev => ({...prev, [variable.name]: value}))
                              generatePreview()
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${variable.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.enumValues?.map(value => (
                                <SelectItem key={value} value={value}>
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={variable.type === 'number' ? 'number' : 'text'}
                            value={variables[variable.name] || ''}
                            onChange={(e) => {
                              setVariables(prev => ({...prev, [variable.name]: e.target.value}))
                              generatePreview()
                            }}
                            placeholder={variable.description}
                          />
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <div className="space-y-4">
                  <Label>Preview</Label>
                  <div className="h-[400px] border rounded-md">
                    <Editor
                      height="400px"
                      defaultLanguage="yaml"
                      value={previewConfig}
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
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => 
                    setSchedule(prev => ({...prev, enabled: checked}))
                  }
                />
                <Label>Enable Scheduling</Label>
              </div>

              {schedule.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Schedule Type</Label>
                    <Select
                      value={schedule.type}
                      onValueChange={(value: Schedule['type']) => 
                        setSchedule(prev => ({...prev, type: value}))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Run Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {schedule.type === 'once' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {schedule.date ? format(schedule.date, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={schedule.date}
                              onSelect={(date) => 
                                setSchedule(prev => ({...prev, date}))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => 
                            setSchedule(prev => ({...prev, time: e.target.value}))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {schedule.type === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Days of Week</Label>
                      <div className="flex gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <Button
                            key={day}
                            variant={schedule.daysOfWeek?.includes(index) ? 'default' : 'outline'}
                            className="w-12"
                            onClick={() => {
                              const days = schedule.daysOfWeek || []
                              setSchedule(prev => ({
                                ...prev,
                                daysOfWeek: days.includes(index)
                                  ? days.filter(d => d !== index)
                                  : [...days, index]
                              }))
                            }}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
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
            onClick={handleSubmit}
            disabled={!selectedTemplate || selectedDevices.length === 0}
          >
            Create Automation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 