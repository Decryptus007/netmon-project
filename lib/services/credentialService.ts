import { 
  BaseCredential, 
  CredentialPayload, 
  StoredCredential,
  CredentialResponse
} from '@/types/credentials'
import { encrypt, decrypt, generateId } from '../encryption'
import fs from 'fs/promises'
import path from 'path'

const CREDENTIALS_DIR = path.join(process.cwd(), 'data', 'credentials')

// Ensure credentials directory exists
async function ensureCredentialsDir() {
  try {
    await fs.access(CREDENTIALS_DIR)
  } catch {
    await fs.mkdir(CREDENTIALS_DIR, { recursive: true })
  }
}

// Initialize the service
ensureCredentialsDir()

export class CredentialService {
  private static async readCredentialFile(id: string): Promise<StoredCredential | null> {
    try {
      const filePath = path.join(CREDENTIALS_DIR, `${id}.json`)
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  private static async writeCredentialFile(id: string, data: StoredCredential): Promise<void> {
    const filePath = path.join(CREDENTIALS_DIR, `${id}.json`)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
  }

  private static async getAllCredentialFiles(): Promise<StoredCredential[]> {
    try {
      const files = await fs.readdir(CREDENTIALS_DIR)
      const credentials = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async file => {
            const id = file.replace('.json', '')
            const cred = await CredentialService.readCredentialFile(id)
            return cred
          })
      )
      return credentials.filter((cred): cred is StoredCredential => cred !== null)
    } catch {
      return []
    }
  }

  static async createCredential(payload: CredentialPayload): Promise<CredentialResponse> {
    try {
      const id = generateId()
      const now = new Date().toISOString()

      // Remove sensitive data from base credential
      const baseCredential: BaseCredential = {
        id,
        name: payload.name,
        type: payload.type,
        username: payload.username,
        description: payload.description,
        lastUsed: now,
        createdAt: now,
        updatedAt: now
      }

      // Encrypt sensitive data
      const sensitiveData = { ...payload }
      delete sensitiveData.name
      delete sensitiveData.type
      delete sensitiveData.username
      delete sensitiveData.description
      
      const { iv, encryptedData } = encrypt(JSON.stringify(sensitiveData))

      const storedCredential: StoredCredential = {
        ...baseCredential,
        encryptedData,
        iv
      }

      await CredentialService.writeCredentialFile(id, storedCredential)

      return {
        success: true,
        message: 'Credential created successfully',
        data: baseCredential
      }
    } catch {
      return {
        success: false,
        error: 'Failed to create credential'
      }
    }
  }

  static async getCredential(id: string): Promise<CredentialResponse> {
    try {
      const credential = await CredentialService.readCredentialFile(id)
      if (!credential) {
        return {
          success: false,
          error: 'Credential not found'
        }
      }

      // Return only base credential info without sensitive data
      const { encryptedData, iv, ...baseCredential } = credential
      void encryptedData // Mark as used
      void iv // Mark as used
      return {
        success: true,
        data: baseCredential
      }
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve credential'
      }
    }
  }

  static async getAllCredentials(): Promise<CredentialResponse> {
    try {
      const credentials = await CredentialService.getAllCredentialFiles()
      const baseCredentials = credentials.map(({ encryptedData, iv, ...base }) => {
        void encryptedData // Mark as used
        void iv // Mark as used
        return base
      })
      
      return {
        success: true,
        data: baseCredentials
      }
    } catch {
      return {
        success: false,
        error: 'Failed to retrieve credentials'
      }
    }
  }

  static async updateCredential(
    id: string, 
    payload: Partial<CredentialPayload>
  ): Promise<CredentialResponse> {
    try {
      const existing = await CredentialService.readCredentialFile(id)
      if (!existing) {
        return {
          success: false,
          error: 'Credential not found'
        }
      }

      // Decrypt existing sensitive data
      const existingSensitiveData = JSON.parse(
        decrypt(existing.encryptedData, existing.iv)
      )

      // Merge with new data
      const sensitiveData = {
        ...existingSensitiveData,
        ...payload
      }

      // Remove non-sensitive fields
      delete sensitiveData.name
      delete sensitiveData.type
      delete sensitiveData.username
      delete sensitiveData.description

      // Encrypt updated sensitive data
      const { iv, encryptedData } = encrypt(JSON.stringify(sensitiveData))

      const updatedCredential: StoredCredential = {
        ...existing,
        ...payload,
        encryptedData,
        iv,
        updatedAt: new Date().toISOString()
      }

      await CredentialService.writeCredentialFile(id, updatedCredential)

      const { encryptedData, iv, ...baseCredential } = updatedCredential
      void encryptedData // Mark as used
      void iv // Mark as used
      return {
        success: true,
        message: 'Credential updated successfully',
        data: baseCredential
      }
    } catch {
      return {
        success: false,
        error: 'Failed to update credential'
      }
    }
  }

  static async deleteCredential(id: string): Promise<CredentialResponse> {
    try {
      const filePath = path.join(CREDENTIALS_DIR, `${id}.json`)
      await fs.unlink(filePath)
      
      return {
        success: true,
        message: 'Credential deleted successfully'
      }
    } catch {
      return {
        success: false,
        error: 'Failed to delete credential'
      }
    }
  }

  static async validateCredential(
    id: string, 
    type: 'network' | 'ssh' | 'cloud' | 'vault'
  ): Promise<CredentialResponse> {
    try {
      const credential = await CredentialService.readCredentialFile(id)
      if (!credential) {
        return {
          success: false,
          error: 'Credential not found'
        }
      }

      JSON.parse(
        decrypt(credential.encryptedData, credential.iv)
      )

      // Implement validation logic based on credential type
      switch (type) {
        case 'network':
          // Add network device validation
          break
        case 'ssh':
          // Add SSH key validation
          break
        case 'cloud':
          // Add cloud provider validation
          break
        case 'vault':
          // Add vault connection validation
          break
      }

      return {
        success: true,
        message: 'Credential validated successfully'
      }
    } catch {
      return {
        success: false,
        error: 'Failed to validate credential'
      }
    }
  }
} 