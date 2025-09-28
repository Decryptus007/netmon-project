"use client"

import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Brain, MessageSquare, Server, Search, AlertTriangle, ChevronDown, Plus, Send, X, LineChart, Tags, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
 
} from "@/components/ui/dialog"

// Sample data for network devices
const networkDevices = [
  { id: "1", name: "core-switch-1", type: "Switch" },
  { id: "2", name: "edge-router-1", type: "Router" },
  { id: "3", name: "fw-1", type: "Firewall" },
  { id: "4", name: "access-sw-1", type: "Switch" },
  { id: "5", name: "dist-sw-1", type: "Switch" },
  { id: "6", name: "wlc-1", type: "Wireless Controller" },
  { id: "7", name: "srv-1", type: "Server" },
  { id: "8", name: "core-router-1", type: "Router" },
]

// Sample chat messages
const initialMessages = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm Tracix Assistant. How can I help with your network today?",
    timestamp: new Date().toISOString()
  }
]

// Sample log patterns
const logPatterns = [
  {
    id: "1",
    pattern: "Connection refused from IP: (?P<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)",
    count: 156,
    devices: ["fw-1", "edge-router-1"],
    lastSeen: "2024-03-17 10:30:00",
    severity: "warning"
  },
  {
    id: "2",
    pattern: "Interface (?P<interface>\\w+) state changed to (?P<state>\\w+)",
    count: 89,
    devices: ["core-switch-1", "access-sw-1"],
    lastSeen: "2024-03-17 10:25:00",
    severity: "info"
  },
  {
    id: "3",
    pattern: "CPU utilization exceeded (?P<percent>\\d+)%",
    count: 45,
    devices: ["core-router-1"],
    lastSeen: "2024-03-17 10:20:00",
    severity: "error"
  }
]

// Sample log categories
const logCategories = [
  {
    id: "1",
    name: "Security Events",
    count: 234,
    patterns: ["Connection refused", "Failed login attempt", "Firewall rule match"],
    devices: ["fw-1", "edge-router-1"],
    lastUpdated: "2024-03-17 10:30:00"
  },
  {
    id: "2",
    name: "Network State Changes",
    count: 156,
    patterns: ["Interface state", "Link status", "BGP neighbor"],
    devices: ["core-switch-1", "access-sw-1"],
    lastUpdated: "2024-03-17 10:25:00"
  },
  {
    id: "3",
    name: "Performance Alerts",
    count: 89,
    patterns: ["CPU utilization", "Memory usage", "Bandwidth threshold"],
    devices: ["core-router-1", "srv-1"],
    lastUpdated: "2024-03-17 10:20:00"
  }
]

export default function BrainPage() {
  const [openSections, setOpenSections] = useState({
    assistant: true,
    assessment: false,
    rootCause: false,
    patternAnalysis: false,
    categorization: false
  })
  
  // Chat state
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [contextDevices, setContextDevices] = useState<string[]>([])
  const [showDeviceSearch, setShowDeviceSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mentionActive, setMentionActive] = useState(false)
  
  const filteredDevices = networkDevices.filter(device => 
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.type.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Check if @ was just typed to activate device mention
    if (value.endsWith('@') && !value.endsWith('\\@')) {
      setMentionActive(true)
      setShowDeviceSearch(true)
      setSearchQuery("")
    } else if (mentionActive) {
      // Extract the text after @ for searching
      const parts = value.split('@')
      const searchTerm = parts[parts.length - 1].trim()
      setSearchQuery(searchTerm)
      
      // If user pressed space after selecting or typing the device name, deactivate mention
      if (searchTerm.includes(' ')) {
        setMentionActive(false)
        setShowDeviceSearch(false)
      }
    }
  }
  
  const handleDeviceSelect = (deviceId: string) => {
    const device = networkDevices.find(d => d.id === deviceId)
    if (device) {
      if (mentionActive) {
        // Replace the @query with @device-name
        const parts = inputValue.split('@')
        parts.pop() // Remove the search part
        const newValue = parts.join('@') + '@' + device.name + ' '
        setInputValue(newValue)
        setMentionActive(false)
      }
      
      // Add to context if not already there
      if (!contextDevices.includes(deviceId)) {
        setContextDevices([...contextDevices, deviceId])
      }
      
      setShowDeviceSearch(false)
    }
  }
  
  const removeFromContext = (deviceId: string) => {
    setContextDevices(contextDevices.filter(id => id !== deviceId))
  }
  
  const sendMessage = () => {
    if (!inputValue.trim()) return
    
    setIsSending(true)
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString()
    }
    
    setMessages([...messages, userMessage])
    setInputValue("")
    
    // Simulate AI response after delay
    setTimeout(() => {
      const deviceContext = contextDevices.length > 0 
        ? networkDevices
            .filter(d => contextDevices.includes(d.id))
            .map(d => d.name)
            .join(", ")
        : "No specific devices"
            
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm analyzing your question about ${deviceContext}. Here's what I found...`,
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setIsSending(false)
    }, 1500)
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Brain</h1>
      
      {/* Tracix Assistant */}
      <Collapsible 
        open={openSections.assistant} 
        onOpenChange={(open) => setOpenSections({...openSections, assistant: open})}
        className="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#5BB6B7]" />
            <span className="font-medium">Tracix Assistant</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            <div className="h-[600px] flex flex-col">
              {/* Context devices */}
              <div className="pb-2 border-b mb-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Device Context</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDeviceSearch(true)}
                    className="h-8 gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Device
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contextDevices.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No devices added. Type @ to mention a device or use the + button.</span>
                  ) : (
                    contextDevices.map(deviceId => {
                      const device = networkDevices.find(d => d.id === deviceId)
                      return (
                        <Badge 
                          key={deviceId} 
                          variant="outline" 
                          className="pl-2 pr-1 py-1 flex items-center gap-1 bg-[#f0f9f9] border-[#5BB6B7] text-[#5BB6B7]"
                        >
                          <Server className="h-3 w-3" />
                          <span>{device?.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFromContext(deviceId)} 
                            className="h-4 w-4 p-0 ml-1 hover:bg-[#e0f0f0]"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )
                    })
                  )}
                </div>
              </div>
              
              {/* Chat messages */}
              <ScrollArea className="flex-1 px-2">
                <div className="space-y-4 py-2">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[80%] ${
                        message.role === 'assistant' 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'bg-[#5BB6B7] text-white'
                        } p-3 rounded-lg`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <Avatar className="h-8 w-8 bg-[#5BB6B7] text-white flex items-center justify-center">
                              <Brain className="h-4 w-4" />
                            </Avatar>
                          </div>
                        )}
                        <div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Input area */}
              <div className="mt-4 relative">
                <Textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type @ to mention a device or ask a question..."
                  className="min-h-[80px] pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                    
                    if (e.key === 'Escape' && mentionActive) {
                      setMentionActive(false)
                      setShowDeviceSearch(false)
                    }
                  }}
                />
                <Button 
                  className="absolute bottom-3 right-3 bg-[#4CA5A6] hover:bg-[#3B9495] text-white" 
                  size="sm"
                  disabled={!inputValue.trim() || isSending}
                  onClick={sendMessage}
                >
                  {isSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Device mention dropdown */}
                {showDeviceSearch && mentionActive && (
                  <div className="absolute bottom-full left-0 w-full mb-2 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-medium mb-2">Select a device to mention</div>
                      {filteredDevices.length > 0 ? (
                        filteredDevices.map(device => (
                          <div 
                            key={device.id}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => handleDeviceSelect(device.id)}
                          >
                            <Server className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{device.name}</span>
                            <span className="text-xs text-gray-500">({device.type})</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 p-2">No devices found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Device Search Dialog */}
      <Dialog open={showDeviceSearch && !mentionActive} onOpenChange={setShowDeviceSearch}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Devices to Context</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md h-[300px] overflow-y-auto">
              {filteredDevices.length > 0 ? (
                filteredDevices.map(device => (
                  <div 
                    key={device.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{device.name}</div>
                        <div className="text-xs text-gray-500">{device.type}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={contextDevices.includes(device.id) ? "bg-[#5BB6B7] text-white" : ""}
                      onClick={() => {
                        if (contextDevices.includes(device.id)) {
                          removeFromContext(device.id)
                        } else {
                          handleDeviceSelect(device.id)
                        }
                      }}
                    >
                      {contextDevices.includes(device.id) ? "Added" : "Add"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No devices found
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowDeviceSearch(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* AI Network Assessment */}
      <Collapsible 
        open={openSections.assessment} 
        onOpenChange={(open) => setOpenSections({...openSections, assessment: open})}
        className="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#5BB6B7]" />
            <span className="font-medium">AI Network Assessment</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The AI Network Assessment analyzes your entire network configuration, 
                identifying potential risks, misconfigurations, and opportunities for optimization.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-[#5BB6B7] hover:bg-[#4CA5A6] text-white">
                  Run Full Assessment
                </Button>
                <Button variant="outline">
                  View Previous Reports
                </Button>
              </div>
              
              {/* Sample assessment preview */}
              <div className="border rounded-lg p-4 mt-4 bg-gray-50">
                <h3 className="font-medium mb-2">Last Assessment Summary</h3>
                <p className="text-sm text-gray-600">No previous assessments found.</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* AI-Powered Root Cause Analysis */}
      <Collapsible 
        open={openSections.rootCause} 
        onOpenChange={(open) => setOpenSections({...openSections, rootCause: open})}
        className="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#5BB6B7]" />
            <span className="font-medium">AI-Powered Root Cause Analysis</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The AI-Powered Root Cause Analysis helps you identify the underlying causes of network issues
                by analyzing patterns, logs, and configurations across your devices.
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input placeholder="Describe the issue you're experiencing..." />
                </div>
                <Button className="bg-[#5BB6B7] hover:bg-[#4CA5A6] text-white shrink-0">
                  Analyze
                </Button>
              </div>
              
              {/* Sample analysis placeholder */}
              <div className="border rounded-lg p-4 mt-4 bg-gray-50">
                <h3 className="font-medium mb-2">Analysis Results</h3>
                <p className="text-sm text-gray-600">Enter a description of your issue and click Analyze to get started.</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Log Pattern Analysis */}
      <Collapsible 
        open={openSections.patternAnalysis} 
        onOpenChange={(open) => setOpenSections({...openSections, patternAnalysis: open})}
        className="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-[#5BB6B7]" />
            <span className="font-medium">Log Pattern Analysis</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Detected Patterns</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered pattern detection from your network logs
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Analysis
                </Button>
              </div>

              <div className="grid gap-4">
                {logPatterns.map((pattern) => (
                  <div key={pattern.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        <p className="text-sm text-muted-foreground">
                          Seen {pattern.count} times across {pattern.devices.length} devices
                        </p>
                      </div>
                      <Badge variant={pattern.severity === 'error' ? 'destructive' : pattern.severity === 'warning' ? 'warning' : 'default'}>
                        {pattern.severity}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pattern.devices.map((device) => (
                        <Badge key={device} variant="outline">
                          {device}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last seen: {new Date(pattern.lastSeen).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Log Categorization */}
      <Collapsible 
        open={openSections.categorization} 
        onOpenChange={(open) => setOpenSections({...openSections, categorization: open})}
        className="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-[#5BB6B7]" />
            <span className="font-medium">Log Categorization</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Log Categories</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered categorization of your network logs
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Categories
                </Button>
              </div>

              <div className="grid gap-4">
                {logCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {category.count} events in this category
                        </p>
                      </div>
                      <Badge variant="outline">
                        {category.patterns.length} patterns
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {category.patterns.map((pattern) => (
                        <Badge key={pattern} variant="secondary">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.devices.map((device) => (
                        <Badge key={device} variant="outline">
                          {device}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {new Date(category.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
} 