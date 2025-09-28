"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings2, X, Power } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DataStore {
  id: string
  name: string
  description: string
  logo: string
  features: string[]
  status: "configured" | "not_configured" | "active"
  isNative?: boolean
  config?: {
    host: string
    port: string
    username?: string
    password?: string
    apiKey?: string
  }
}

const dataStores: DataStore[] = [
  {
    id: "elasticsearch",
    name: "Elasticsearch",
    description: "Distributed search and analytics engine with powerful full-text search capabilities.",
    logo: "/images/download.png",
    features: [
      "Full-text search",
      "Log analytics",
      "Time series data",
      "Document storage"
    ],
    status: "not_configured"
  },
  {
    id: "clickhouse",
    name: "Clickhouse",
    description: "Column-oriented database management system for real-time analytics.",
    logo: "/images/clickhouse-logo.svg",
    features: [
      "Fast analytics",
      "Column-oriented storage",
      "Real-time queries",
      "High performance"
    ],
    status: "not_configured"
  },
  {
    id: "prometheus",
    name: "Prometheus",
    description: "Open-source monitoring and alerting toolkit designed for reliability.",
    logo: "/images/prometheus-logo.svg",
    features: [
      "Metrics collection",
      "Time series database",
      "Alert management",
      "Data visualization"
    ],
    status: "not_configured"
  },
  {
    id: "tracix",
    name: "Tracix Native",
    description: "Native data storage solution optimized for network monitoring and analysis.",
    logo: "/images/tracix-logo.svg",
    features: [
      "Network telemetry",
      "Custom data models",
      "Optimized storage",
      "Fast retrieval"
    ],
    status: "not_configured",
    isNative: true
  }
]

export default function DataManagementPage() {
  const [stores, setStores] = useState<DataStore[]>(dataStores)
  const [selectedStore, setSelectedStore] = useState<DataStore | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configForm, setConfigForm] = useState({
    host: "",
    port: "",
    username: "",
    password: "",
    apiKey: ""
  })

  const hasActiveStore = stores.some(store => store.status === "active")
  const hasConfiguredStore = stores.some(store => store.status === "configured")

  const handleConfigure = (store: DataStore) => {
    setSelectedStore(store)
    setConfigForm({
      host: store.config?.host || "",
      port: store.config?.port || "",
      username: store.config?.username || "",
      password: store.config?.password || "",
      apiKey: store.config?.apiKey || ""
    })
    setShowConfigDialog(true)
  }

  const handleSaveConfig = () => {
    if (!selectedStore) return

    setStores(prev => prev.map(store => 
      store.id === selectedStore.id
        ? {
            ...store,
            status: "configured",
            config: {
              host: configForm.host,
              port: configForm.port,
              username: configForm.username,
              password: configForm.password,
              apiKey: configForm.apiKey
            }
          }
        : store
    ))
    setShowConfigDialog(false)
    setSelectedStore(null)
  }

  const handleActivateNative = () => {
    setStores(prev => prev.map(store => ({
      ...store,
      status: store.id === "tracix" ? "active" : "not_configured",
      config: store.id === "tracix" ? undefined : undefined
    })))
  }

  const handleDeactivateNative = () => {
    setStores(prev => prev.map(store => ({
      ...store,
      status: store.id === "tracix" ? "not_configured" : store.status,
    })))
  }

  const handleRemoveConfig = (id: string) => {
    setStores(prev => prev.map(store => 
      store.id === id
        ? { ...store, status: "not_configured", config: undefined }
        : store
    ))
  }

  const renderActionButton = (store: DataStore) => {
    if (store.isNative) {
      if (store.status === "active") {
        return (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDeactivateNative}
          >
            <X className="h-4 w-4 mr-2" />
            Deactivate
          </Button>
        )
      }
      return (
        <Button
          variant="default"
          className="w-full mt-4"
          onClick={handleActivateNative}
        >
          <Power className="h-4 w-4 mr-2" />
          Activate
        </Button>
      )
    }

    if (store.status === "configured") {
      return (
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => handleRemoveConfig(store.id)}
        >
          <X className="h-4 w-4 mr-2" />
          Remove Configuration
        </Button>
      )
    }

    return (
      <Button
        variant="default"
        className="w-full mt-4"
        onClick={() => handleConfigure(store)}
        disabled={hasActiveStore || (hasConfiguredStore && store.status === "not_configured")}
      >
        <Settings2 className="h-4 w-4 mr-2" />
        Configure
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure your backend data store for optimal performance and storage management.
          Only one backend can be active at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map((store) => (
          <Card key={store.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12">
                    <Image
                      src={store.logo}
                      alt={`${store.name} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <CardTitle>{store.name}</CardTitle>
                    <CardDescription>{store.description}</CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={store.status === "active" ? "default" : 
                          store.status === "configured" ? "secondary" : "outline"}
                >
                  {store.status === "active" ? "Active" : 
                   store.status === "configured" ? "Configured" : "Not Configured"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {store.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                {renderActionButton(store)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {selectedStore?.name}</DialogTitle>
            <DialogDescription>
              Enter the connection details for your {selectedStore?.name} instance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Host</Label>
              <Input
                placeholder="localhost"
                value={configForm.host}
                onChange={e => setConfigForm(prev => ({ ...prev, host: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                placeholder="9200"
                value={configForm.port}
                onChange={e => setConfigForm(prev => ({ ...prev, port: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={configForm.apiKey}
                onChange={e => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Username (optional)</Label>
              <Input
                placeholder="username"
                value={configForm.username}
                onChange={e => setConfigForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password (optional)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={configForm.password}
                onChange={e => setConfigForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 