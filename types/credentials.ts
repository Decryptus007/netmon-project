export type CredentialType = 'ssh' | 'network' | 'cloud' | 'vault'

export interface BaseCredential {
  id: string
  name: string
  type: CredentialType
  username: string
  description?: string
  lastUsed: string
  createdAt: string
  updatedAt: string
}

export interface StoredCredential extends BaseCredential {
  encryptedData: string
  iv: string
}

export interface NetworkCredential extends BaseCredential {
  password: string
}

export interface SSHCredential extends BaseCredential {
  privateKey: string
  publicKey?: string
  passphrase?: string
}

export interface CloudCredential extends BaseCredential {
  accessKey: string
  secretKey: string
  region?: string
  additionalData?: Record<string, string>
}

export interface VaultCredential extends BaseCredential {
  token: string
  url: string
  role?: string
}

export type CredentialPayload = NetworkCredential | SSHCredential | CloudCredential | VaultCredential

export interface CredentialResponse {
  success: boolean
  message?: string
  data?: BaseCredential | BaseCredential[]
  error?: string
} 