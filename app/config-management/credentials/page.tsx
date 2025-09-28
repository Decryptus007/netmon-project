"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Key, 
  Plus, 
  Search, 
  Shield, 
  Cloud, 
  Terminal, 
  Eye, 
  EyeOff,
  Trash2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

type CredentialType = 'ssh' | 'network' | 'cloud' | 'vault'

interface Credential {
  id: string
  name: string
  type: CredentialType
  username: string
  lastUsed: string
  createdAt: string
}

const credentialTypeInfo = {
  ssh: {
    label: "SSH Keys",
    icon: Terminal,
    description: "Manage SSH key pairs for secure shell access",
    color: "bg-green-100 text-green-800"
  },
  network: {
    label: "Network Devices",
    icon: Shield,
    description: "Store credentials for network equipment access",
    color: "bg-blue-100 text-blue-800"
  },
  cloud: {
    label: "Cloud Providers",
    icon: Cloud,
    description: "Manage cloud service provider credentials",
    color: "bg-purple-100 text-purple-800"
  },
  vault: {
    label: "Vault Integration",
    icon: Key,
    description: "External vault system credentials",
    color: "bg-orange-100 text-orange-800"
  }
}

// Sample data - in production this would come from a secure backend
const sampleCredentials: Credential[] = [
  {
    id: "1",
    name: "Core Router Access",
    type: "network",
    username: "admin",
    lastUsed: "2024-03-15 14:30",
    createdAt: "2024-01-01"
  },
  {
    id: "2",
    name: "AWS Production",
    type: "cloud",
    username: "aws-prod-user",
    lastUsed: "2024-03-14 09:15",
    createdAt: "2024-01-15"
  },
  {
    id: "3",
    name: "Server SSH Key",
    type: "ssh",
    username: "root",
    lastUsed: "2024-03-15 11:20",
    createdAt: "2024-02-01"
  }
]

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>(sampleCredentials)
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewCredentialDialog, setShowNewCredentialDialog] = useState(false)
  const [newCredential, setNewCredential] = useState({
    name: "",
    type: "network" as CredentialType,
    username: "",
    password: "",
    key: "",
    description: ""
  })
  const [showPassword, setShowPassword] = useState(false)

  const filteredCredentials = credentials.filter(cred => 
    cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cred.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (id: string) => {
    setCredentials(prev => prev.filter(cred => cred.id !== id))
  }

  const handleAddCredential = () => {
    // In production, this would make an API call to securely store the credential
    const newId = (credentials.length + 1).toString()
    setCredentials(prev => [...prev, {
      id: newId,
      name: newCredential.name,
      type: newCredential.type,
      username: newCredential.username,
      lastUsed: "Never",
      createdAt: new Date().toISOString().split('T')[0]
    }])
    setShowNewCredentialDialog(false)
    setNewCredential({
      name: "",
      type: "network",
      username: "",
      password: "",
      key: "",
      description: ""
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Credential Management</h1>
        <Dialog open={showNewCredentialDialog} onOpenChange={setShowNewCredentialDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#5BB6B7] hover:bg-[#4CA5A6] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
              <DialogDescription>
                Securely store credentials for various services and devices.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Credential Name</label>
                <Input
                  value={newCredential.name}
                  onChange={e => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production Router Access"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Credential Type</label>
                <Select
                  value={newCredential.type}
                  onValueChange={value => setNewCredential(prev => ({ ...prev, type: value as CredentialType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select credential type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(credentialTypeInfo).map(([value, info]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <info.icon className="h-4 w-4" />
                          <span>{info.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={newCredential.username}
                  onChange={e => setNewCredential(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password/Secret</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newCredential.password}
                    onChange={e => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password or secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              {newCredential.type === 'ssh' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">SSH Key</label>
                  <Input
                    type="file"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          setNewCredential(prev => ({ 
                            ...prev, 
                            key: e.target?.result as string 
                          }))
                        }
                        reader.readAsText(file)
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCredentialDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCredential}
                className="bg-[#5BB6B7] hover:bg-[#4CA5A6] text-white"
              >
                Add Credential
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(credentialTypeInfo).map(([type, info]) => (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <info.icon className="h-5 w-5" />
                <CardTitle className="text-lg">{info.label}</CardTitle>
              </div>
              <CardDescription>{info.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {credentials.filter(c => c.type === type).length}
              </p>
              <p className="text-sm text-gray-500">stored credentials</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              className="pl-9"
              placeholder="Search credentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredentials.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell className="font-medium">{credential.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={credentialTypeInfo[credential.type].color}
                    >
                      {credentialTypeInfo[credential.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell>{credential.username}</TableCell>
                  <TableCell>{credential.lastUsed}</TableCell>
                  <TableCell>{credential.createdAt}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(credential.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 