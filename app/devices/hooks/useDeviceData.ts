import { useState, useEffect } from 'react'

export interface DeviceInfo {
  hostname: string
  model: string
  serialNumber: string
  softwareVersion: string
  uptime: string
  bootTime: string
  processorType: string
  memory: {
    total: string
    used: string
    free: string
  }
  flash: {
    total: string
    used: string
    free: string
  }
  location: string
  contact: string
  lastConfigChange: string
}

export function useDeviceData(deviceId: string) {
  const [data, setData] = useState<DeviceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/devices/${deviceId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch device data: ${response.statusText}`)
        }
        
        const deviceData = await response.json()
        setData(deviceData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching device data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeviceData()
  }, [deviceId])

  return { data, isLoading, error }
} 