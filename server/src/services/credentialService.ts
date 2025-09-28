import fs from 'fs/promises';
import path from 'path';
import { encrypt, decrypt, generateId } from '../utils/encryption.js';
import type { BaseCredential, StoredCredential, CredentialPayload } from '../types/index.js';

interface SensitiveData {
  password?: string;
  privateKey?: string;
  passphrase?: string;
  accessKey?: string;
  secretKey?: string;
  token?: string;
}

class CredentialService {
  private credentialsDir: string;

  constructor() {
    this.credentialsDir = path.join(process.cwd(), 'data', 'credentials');
    this.init();
  }

  private async init(): Promise<void> {
    try {
      await fs.access(this.credentialsDir);
    } catch {
      await fs.mkdir(this.credentialsDir, { recursive: true });
    }
  }

  private async readCredentialFile(id: string): Promise<StoredCredential | null> {
    try {
      const filePath = path.join(this.credentialsDir, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private async writeCredentialFile(id: string, data: StoredCredential): Promise<void> {
    const filePath = path.join(this.credentialsDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async getAllCredentials(): Promise<BaseCredential[]> {
    const files = await fs.readdir(this.credentialsDir);
    const credentials = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const credential = await this.readCredentialFile(file.replace('.json', ''));
          if (!credential) return null;
          
          // Remove sensitive data
          const { encryptedData, iv, ...safeCredential } = credential;
          return safeCredential;
        })
    );
    
    return credentials.filter((cred): cred is BaseCredential => cred !== null);
  }

  async getCredential(id: string): Promise<BaseCredential | null> {
    const credential = await this.readCredentialFile(id);
    if (!credential) return null;

    // Remove sensitive data for response
    const { encryptedData, iv, ...safeCredential } = credential;
    return safeCredential;
  }

  async createCredential(payload: CredentialPayload): Promise<BaseCredential> {
    const id = generateId();
    const now = new Date().toISOString();

    // Encrypt sensitive data
    const sensitiveData: SensitiveData = {
      password: payload.password,
      privateKey: payload.privateKey,
      passphrase: payload.passphrase,
      accessKey: payload.accessKey,
      secretKey: payload.secretKey,
      token: payload.token
    };

    const { encryptedData, iv } = encrypt(JSON.stringify(sensitiveData));

    const credential: StoredCredential = {
      id,
      name: payload.name,
      type: payload.type,
      username: payload.username,
      description: payload.description || '',
      encryptedData,
      iv,
      lastUsed: null,
      createdAt: now,
      updatedAt: now
    };

    await this.writeCredentialFile(id, credential);

    // Return credential without sensitive data
    const { encryptedData: _, iv: __, ...safeCredential } = credential;
    return safeCredential;
  }

  async updateCredential(id: string, payload: CredentialPayload): Promise<BaseCredential | null> {
    const existing = await this.readCredentialFile(id);
    if (!existing) return null;

    // Decrypt existing sensitive data
    const existingSensitiveData: SensitiveData = JSON.parse(
      decrypt(existing.encryptedData, existing.iv)
    );

    // Merge with new sensitive data
    const sensitiveData: SensitiveData = {
      ...existingSensitiveData,
      password: payload.password,
      privateKey: payload.privateKey,
      passphrase: payload.passphrase,
      accessKey: payload.accessKey,
      secretKey: payload.secretKey,
      token: payload.token
    };

    // Re-encrypt merged sensitive data
    const { encryptedData, iv } = encrypt(JSON.stringify(sensitiveData));

    const updated: StoredCredential = {
      ...existing,
      name: payload.name,
      type: payload.type,
      username: payload.username,
      description: payload.description || existing.description,
      encryptedData,
      iv,
      updatedAt: new Date().toISOString()
    };

    await this.writeCredentialFile(id, updated);

    // Return credential without sensitive data
    const { encryptedData: _, iv: __, ...safeCredential } = updated;
    return safeCredential;
  }

  async deleteCredential(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.credentialsDir, `${id}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }
}

export const credentialService = new CredentialService(); 