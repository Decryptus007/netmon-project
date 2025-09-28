"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface NetworkInterface {
  id: string
  name: string
  status: "up" | "down"
  ipAddress: string
  speed: string
  duplex: string
  alertingEnabled: boolean
}

interface NetworkInterfacesProps {
  deviceId: string
  interfaces: NetworkInterface[]
}

export function NetworkInterfaces({ interfaces: initialInterfaces }: NetworkInterfacesProps) {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>(initialInterfaces)

  const handleAlertToggle = async (interfaceId: string) => {
    setInterfaces(prevInterfaces =>
      prevInterfaces.map(iface =>
        iface.id === interfaceId
          ? { ...iface, alertingEnabled: !iface.alertingEnabled }
          : iface
      )
    )

    // TODO: Add API call to update alerting status
    // await fetch(`/api/devices/${deviceId}/interfaces/${interfaceId}/alerting`, {
    //   method: 'PUT',
    //   body: JSON.stringify({ enabled: !interface.alertingEnabled }),
    // })
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Interface</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Speed</TableHead>
            <TableHead>Duplex</TableHead>
            <TableHead className="text-right">Alerting</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interfaces.map((iface) => (
            <TableRow key={iface.id}>
              <TableCell className="font-medium">{iface.name}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  iface.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {iface.status}
                </span>
              </TableCell>
              <TableCell>{iface.ipAddress}</TableCell>
              <TableCell>{iface.speed}</TableCell>
              <TableCell>{iface.duplex}</TableCell>
              <TableCell className="text-right">
                <Switch
                  checked={iface.alertingEnabled}
                  onCheckedChange={() => handleAlertToggle(iface.id)}
                  aria-label={`Toggle alerting for ${iface.name}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 