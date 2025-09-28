export type CredentialType = 'ssh' | 'network' | 'cloud' | 'vault';
export type DataStoreType = 'elasticsearch' | 'clickhouse' | 'prometheus' | 'tracix';

export interface BaseCredential {
  id: string;
  name: string;
  type: CredentialType;
  username: string;
  description?: string;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCredential extends BaseCredential {
  encryptedData: string;
  iv: string;
}

export interface CredentialPayload {
  name: string;
  type: CredentialType;
  username: string;
  description?: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  accessKey?: string;
  secretKey?: string;
  token?: string;
}

export interface DataStore {
  name: string;
  type: DataStoreType;
  host: string;
  port: number;
  username?: string;
  apiKey?: string;
  configured: boolean;
}

export interface DataStoreConfig {
  configured: boolean;
  store: DataStore | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  policyId: string;
  status: 'active' | 'inactive';
  lastSeen: string;
  platform: 'windows' | 'mac' | 'linux';
  ipAddress: string;
  version: string;
  dataTypes: ('snmp' | 'syslog' | 'netflow')[];
  tenantId: string;
  siteId?: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  deviceTypes: string[];
  dataTypes: ('snmp' | 'syslog' | 'netflow')[];
  collectionInterval: number;
  retentionPeriod: number;
  thresholds: {
    cpu: number;
    memory: number;
    bandwidth: number;
  };
  createdAt: string;
  updatedAt: string;
} 