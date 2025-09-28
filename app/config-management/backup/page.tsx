"use client"

import { useState, useMemo } from "react"
import { Download, Upload, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Device {
  id: string
  name: string
  type: string
  lastBackup: string | null
  status: 'never' | 'success' | 'failed'
}

const devices: Device[] = [
  {
    id: "1",
    name: "csr1000v-1",
    type: "Router",
    lastBackup: "2024-02-20 15:30:00",
    status: "success"
  },
  {
    id: "2",
    name: "core-switch-1",
    type: "Switch",
    lastBackup: "2024-02-19 10:15:00",
    status: "success"
  },
  {
    id: "3",
    name: "edge-fw-1",
    type: "Firewall",
    lastBackup: null,
    status: "never"
  },
  ...Array.from({ length: 97 }, (_, i) => ({
    id: `${i + 4}`,
    name: `device-${i + 4}`,
    type: ['Router', 'Switch', 'Firewall'][i % 3],
    lastBackup: i % 5 === 0 ? null : `2024-02-${20 - (i % 20)} ${15 - (i % 12)}:${30 - (i % 30)}:00`,
    status: (i % 5 === 0 ? 'never' : i % 7 === 0 ? 'failed' : 'success') as 'success' | 'failed' | 'never'
  }))
]

const backupHistory = [
  {
    id: 1,
    device: "csr1000v-1",
    timestamp: "2024-02-20 15:30:00",
    status: "Success",
    size: "45.2 KB"
  }
]

export default function BackupPage() {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState("10")

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices

    const query = searchQuery.toLowerCase()
    return devices.filter(device => {
      // Handle field:value search queries
      if (query.includes(":")) {
        const [field, value] = query.split(":")
        const trimmedValue = value.trim()
        
        switch (field.trim()) {
          case "name":
            return device.name.toLowerCase().includes(trimmedValue)
          case "type":
            return device.type.toLowerCase().includes(trimmedValue)
          case "status":
            return device.status.toLowerCase().includes(trimmedValue)
          default:
            return false
        }
      }
      
      // Regular search across all fields
      return (
        device.name.toLowerCase().includes(query) ||
        device.type.toLowerCase().includes(query) ||
        device.status.toLowerCase().includes(query)
      )
    })
  }, [searchQuery])

  const paginatedDevices = useMemo(() => {
    const start = (page - 1) * parseInt(perPage)
    const end = start + parseInt(perPage)
    return filteredDevices.slice(start, end)
  }, [filteredDevices, page, perPage])

  const totalPages = Math.ceil(filteredDevices.length / parseInt(perPage))

  const handlePerPageChange = (value: string) => {
    setPerPage(value)
    setPage(1) // Reset to first page when changing items per page
  }

  const handleSelectAll = () => {
    if (selectedDevices.length === paginatedDevices.length) {
      setSelectedDevices([])
    } else {
      setSelectedDevices(paginatedDevices.map(d => d.id))
    }
  }

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId)
      }
      return [...prev, deviceId]
    })
  }

  const handleBackup = async () => {
    if (selectedDevices.length === 0) return

    setIsBackingUp(true)
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Here you would make API calls to backup selected devices
      console.log('Backing up devices:', selectedDevices)
    } finally {
      setIsBackingUp(false)
      setSelectedDevices([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Configuration Backup & Restore</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={selectedDevices.length === 0 || isBackingUp}
            onClick={handleBackup}
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Backing up...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Backup Selected ({selectedDevices.length})
              </>
            )}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Restore
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 font-mono"
            placeholder='Search devices (e.g., "type:router" or "status:success")'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Found {filteredDevices.length} device(s)
          </p>
        )}
      </div>

      {/* Device Selection */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={perPage} onValueChange={handlePerPageChange}>
              <SelectTrigger className="w-20 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-md min-w-[80px]">
                <SelectItem value="10" className="hover:bg-gray-100">10</SelectItem>
                <SelectItem value="25" className="hover:bg-gray-100">25</SelectItem>
                <SelectItem value="50" className="hover:bg-gray-100">50</SelectItem>
                <SelectItem value="100" className="hover:bg-gray-100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {((page - 1) * parseInt(perPage)) + 1} to{" "}
              {Math.min(page * parseInt(perPage), filteredDevices.length)} of{" "}
              {filteredDevices.length} entries
            </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedDevices.length === paginatedDevices.length && paginatedDevices.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Device Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Last Backup</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No devices found matching your search
                </TableCell>
              </TableRow>
            ) : (
              paginatedDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedDevices.includes(device.id)}
                      onCheckedChange={() => handleSelectDevice(device.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>{device.type}</TableCell>
                  <TableCell>{device.lastBackup || 'Never'}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      device.status === 'success' && "bg-success/10 text-success",
                      device.status === 'failed' && "bg-error/10 text-error",
                      device.status === 'never' && "bg-gray-100 text-gray-600"
                    )}>
                      {device.status === 'never' ? 'Never backed up' : 
                       device.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={page === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(i + 1)}
                className={cn(
                  "w-8 h-8",
                  totalPages > 7 && i > 2 && i < totalPages - 3 && page !== i + 1 && "hidden"
                )}
              >
                {totalPages > 7 && i === 2 && page > 4 && "..."}
                {totalPages <= 7 || i < 2 || i > totalPages - 3 || Math.abs(page - (i + 1)) < 2
                  ? i + 1
                  : ""}
                {totalPages > 7 && i === totalPages - 3 && page < totalPages - 3 && "..."}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <h2 className="text-lg font-semibold mt-8">Backup History</h2>
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backupHistory.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell>{backup.device}</TableCell>
                <TableCell>{backup.timestamp}</TableCell>
                <TableCell>{backup.status}</TableCell>
                <TableCell>{backup.size}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 