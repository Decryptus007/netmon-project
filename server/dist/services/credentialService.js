import fs from 'fs/promises';
import path from 'path';
import { encrypt, decrypt, generateId } from '../utils/encryption.js';
class CredentialService {
    credentialsDir;
    constructor() {
        this.credentialsDir = path.join(process.cwd(), 'data', 'credentials');
        this.init();
    }
    async init() {
        try {
            await fs.access(this.credentialsDir);
        }
        catch {
            await fs.mkdir(this.credentialsDir, { recursive: true });
        }
    }
    async readCredentialFile(id) {
        try {
            const filePath = path.join(this.credentialsDir, `${id}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return null;
            throw error;
        }
    }
    async writeCredentialFile(id, data) {
        const filePath = path.join(this.credentialsDir, `${id}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
    async getAllCredentials() {
        const files = await fs.readdir(this.credentialsDir);
        const credentials = await Promise.all(files
            .filter(file => file.endsWith('.json'))
            .map(async (file) => {
            const credential = await this.readCredentialFile(file.replace('.json', ''));
            if (!credential)
                return null;
            const { encryptedData, iv, ...safeCredential } = credential;
            return safeCredential;
        }));
        return credentials.filter((cred) => cred !== null);
    }
    async getCredential(id) {
        const credential = await this.readCredentialFile(id);
        if (!credential)
            return null;
        const { encryptedData, iv, ...safeCredential } = credential;
        return safeCredential;
    }
    async createCredential(payload) {
        const id = generateId();
        const now = new Date().toISOString();
        const sensitiveData = {
            password: payload.password,
            privateKey: payload.privateKey,
            passphrase: payload.passphrase,
            accessKey: payload.accessKey,
            secretKey: payload.secretKey,
            token: payload.token
        };
        const { encryptedData, iv } = encrypt(JSON.stringify(sensitiveData));
        const credential = {
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
        const { encryptedData: _, iv: __, ...safeCredential } = credential;
        return safeCredential;
    }
    async updateCredential(id, payload) {
        const existing = await this.readCredentialFile(id);
        if (!existing)
            return null;
        const existingSensitiveData = JSON.parse(decrypt(existing.encryptedData, existing.iv));
        const sensitiveData = {
            ...existingSensitiveData,
            password: payload.password,
            privateKey: payload.privateKey,
            passphrase: payload.passphrase,
            accessKey: payload.accessKey,
            secretKey: payload.secretKey,
            token: payload.token
        };
        const { encryptedData, iv } = encrypt(JSON.stringify(sensitiveData));
        const updated = {
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
        const { encryptedData: _, iv: __, ...safeCredential } = updated;
        return safeCredential;
    }
    async deleteCredential(id) {
        try {
            const filePath = path.join(this.credentialsDir, `${id}.json`);
            await fs.unlink(filePath);
            return true;
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return false;
            throw error;
        }
    }
}
export const credentialService = new CredentialService();
//# sourceMappingURL=credentialService.js.map