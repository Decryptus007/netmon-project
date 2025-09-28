import { NextResponse } from 'next/server'

// This is mock data - replace with actual database/API calls
const mockDeviceData = {
  "1": {
    hostname: "CAT-RTR-01",
    model: "Cisco Catalyst 8300-1N1S-6T",
    serialNumber: "FCZ2329A1BC",
    softwareVersion: "IOS-XE Version 17.9.3",
    uptime: "150 days, 3 hours, 24 minutes",
    bootTime: "2023-10-15 08:45:32 UTC",
    processorType: "Intel x86-64",
    memory: {
      total: "32768 MB",
      used: "12288 MB",
      free: "20480 MB"
    },
    flash: {
      total: "16384 MB",
      used: "8192 MB",
      free: "8192 MB"
    },
    location: "Main Data Center - Rack A05",
    contact: "network-ops@company.com",
    lastConfigChange: "2024-03-10 15:23:41 UTC"
  },
  "2": {
    hostname: "CAT-RTR-02",
    model: "Cisco Catalyst 8300-2N2S-6T",
    serialNumber: "FCZ2329A2CD",
    softwareVersion: "IOS-XE Version 17.9.3",
    uptime: "90 days, 12 hours, 15 minutes",
    bootTime: "2023-12-15 14:30:00 UTC",
    processorType: "Intel x86-64",
    memory: {
      total: "32768 MB",
      used: "14336 MB",
      free: "18432 MB"
    },
    flash: {
      total: "16384 MB",
      used: "9216 MB",
      free: "7168 MB"
    },
    location: "Main Data Center - Rack B03",
    contact: "network-ops@company.com",
    lastConfigChange: "2024-03-08 09:15:22 UTC"
  },
  "3": {
    hostname: "CAT-SW-01",
    model: "Cisco Catalyst 9300-48P",
    serialNumber: "FOC2332L1JH",
    softwareVersion: "IOS-XE Version 17.6.1",
    uptime: "245 days, 8 hours, 56 minutes",
    bootTime: "2023-07-15 06:20:12 UTC",
    processorType: "ARM v8.1",
    memory: {
      total: "16384 MB",
      used: "8192 MB",
      free: "8192 MB"
    },
    flash: {
      total: "8192 MB",
      used: "4096 MB",
      free: "4096 MB"
    },
    location: "Main Data Center - Row C",
    contact: "network-ops@company.com",
    lastConfigChange: "2024-02-28 11:45:33 UTC"
  },
  "4": {
    hostname: "CAT-RTR-EDGE-01",
    model: "Cisco Catalyst 8500-12X",
    serialNumber: "FJC2440Z1KL",
    softwareVersion: "IOS-XE Version 17.9.2",
    uptime: "180 days, 22 hours, 15 minutes",
    bootTime: "2023-09-15 12:00:00 UTC",
    processorType: "Intel x86-64",
    memory: {
      total: "65536 MB",
      used: "28672 MB",
      free: "36864 MB"
    },
    flash: {
      total: "32768 MB",
      used: "16384 MB",
      free: "16384 MB"
    },
    location: "Edge Site - Building 2",
    contact: "network-ops@company.com",
    lastConfigChange: "2024-03-12 08:30:15 UTC"
  },
  "5": {
    hostname: "CAT-SW-CORE-01",
    model: "Cisco Catalyst 9500-32C",
    serialNumber: "FDO2342P1MN",
    softwareVersion: "IOS-XE Version 17.7.1",
    uptime: "300 days, 4 hours, 12 minutes",
    bootTime: "2023-05-20 18:15:45 UTC",
    processorType: "ARM v8.1",
    memory: {
      total: "32768 MB",
      used: "18432 MB",
      free: "14336 MB"
    },
    flash: {
      total: "16384 MB",
      used: "10240 MB",
      free: "6144 MB"
    },
    location: "Core Network - Room 101",
    contact: "network-ops@company.com",
    lastConfigChange: "2024-03-01 16:20:55 UTC"
  }
}

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1000))

    const deviceId = params.deviceId
    const deviceData = mockDeviceData[deviceId as keyof typeof mockDeviceData]

    if (!deviceData) {
      return new NextResponse(JSON.stringify({ error: 'Device not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return NextResponse.json(deviceData)
  } catch (error) {
    console.error('Error fetching device data:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
} 