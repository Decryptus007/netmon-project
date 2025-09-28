"use client"

import { useParams } from "next/navigation"
import { DeviceMetricsOverview } from "../components/DeviceMetricsOverview"
import { DeviceTimePicker } from "../components/DeviceTimePicker"
import { NetworkInterfaces } from "../components/NetworkInterfaces"
import { DeviceInfoSkeleton } from "../components/DeviceInfoSkeleton"
import { ErrorMessage } from "../components/ErrorMessage"
import type { NetworkInterface } from "../components/NetworkInterfaces"
import { useDeviceData } from "../hooks/useDeviceData"
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, Info, Bell, AlertCircle, Network } from "lucide-react"
import { useState } from "react"

const cpuData = [
  { time: '22:45', value: 40 },
  { time: '23:00', value: 45 },
  { time: '23:15', value: 42 },
  { time: '23:30', value: 48 },
  { time: '23:45', value: 45 },
]

const loadData = [
  { time: '22:45', value: 0.65 },
  { time: '23:00', value: 0.75 },
  { time: '23:15', value: 0.70 },
  { time: '23:30', value: 0.80 },
  { time: '23:45', value: 0.75 },
]

// Sample network interfaces data - replace with actual API call
const sampleInterfaces: NetworkInterface[] = [
  {
    id: "1",
    name: "GigabitEthernet0/0",
    status: "up" as const,
    ipAddress: "192.168.1.1/24",
    speed: "1000Mbps",
    duplex: "Full",
    alertingEnabled: true
  },
  {
    id: "2",
    name: "GigabitEthernet0/1",
    status: "up" as const,
    ipAddress: "10.0.0.1/24",
    speed: "1000Mbps",
    duplex: "Full",
    alertingEnabled: false
  },
  {
    id: "3",
    name: "GigabitEthernet0/2",
    status: "down" as const,
    ipAddress: "172.16.0.1/24",
    speed: "-",
    duplex: "-",
    alertingEnabled: true
  }
]

export default function DeviceDetailsPage() {
  const params = useParams()
  const deviceId = params.deviceId as string
  const { data: deviceInfo, isLoading, error } = useDeviceData(deviceId)
  const [openSections, setOpenSections] = useState({
    info: true,
    alerts: true,
    interfaces: true,
    metrics: true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Device Details</h1>
        <DeviceTimePicker />
      </div>

      <DeviceMetricsOverview />

      <div className="space-y-4">
        <Collapsible 
          defaultOpen 
          onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, info: isOpen }))}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-white rounded-lg hover:bg-gray-50">
            <Info className="h-5 w-5" />
            <span className="font-medium">Device Information</span>
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform duration-200 ${openSections.info ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            {isLoading && <DeviceInfoSkeleton />}
            {error && (
              <ErrorMessage 
                message={error} 
                onRetry={() => window.location.reload()}
              />
            )}
            {deviceInfo && (
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-white rounded-lg border">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Hostname</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.hostname}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Model</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.model}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Serial Number</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.serialNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Software Version</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.softwareVersion}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Uptime</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.uptime}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Total Memory</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.memory.total}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Used Memory</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.memory.used}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Free Memory</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.memory.free}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">System Details</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Processor</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.processorType}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Boot Time</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.bootTime}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Last Config Change</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.lastConfigChange}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Flash Memory</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Total Flash</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.flash.total}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Used Flash</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.flash.used}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Free Flash</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.flash.free}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Location</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.location}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium">Contact</dt>
                        <dd className="text-sm text-gray-900">{deviceInfo.contact}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible 
          defaultOpen
          onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, alerts: isOpen }))}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-white rounded-lg hover:bg-gray-50">
            <Bell className="h-5 w-5" />
            <span className="font-medium">Alerts</span>
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform duration-200 ${openSections.alerts ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            {/* Alerts content */}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible 
          defaultOpen
          onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, interfaces: isOpen }))}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-white rounded-lg hover:bg-gray-50">
            <Network className="h-5 w-5" />
            <span className="font-medium">Network Interfaces</span>
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform duration-200 ${openSections.interfaces ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <NetworkInterfaces deviceId={deviceId} interfaces={sampleInterfaces} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible 
          defaultOpen
          onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, metrics: isOpen }))}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-white rounded-lg hover:bg-gray-50">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Metrics</span>
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform duration-200 ${openSections.metrics ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <h4 className="text-sm font-medium mb-4">CPU Usage</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cpuData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="p-4 rounded-lg border">
                <h4 className="text-sm font-medium mb-4">Normalized Load</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={loadData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
