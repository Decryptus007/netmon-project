import {
  CredentialPayload,
  StoredCredential,
  BaseCredential,
  CredentialResponse,
} from "@/types/credentials";
import { encrypt, decrypt } from "../encryption";

export class CredentialService {
  private static credentials: StoredCredential[] = [];

  static async getAllCredentials(): Promise<CredentialResponse> {
    try {
      const decryptedCredentials: BaseCredential[] = this.credentials.map(
        (cred) => ({
          id: cred.id,
          name: cred.name,
          type: cred.type,
          username: cred.username,
          description: cred.description,
          lastUsed: cred.lastUsed,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt,
        })
      );

      return {
        success: true,
        data: decryptedCredentials,
      };
    } catch (error) {
      console.error("Error fetching credentials:", error);
      return {
        success: false,
        error: "Failed to fetch credentials",
      };
    }
  }

  static async getCredential(id: string): Promise<CredentialResponse> {
    try {
      const credential = this.credentials.find((cred) => cred.id === id);
      if (!credential) {
        return {
          success: false,
          error: "Credential not found",
        };
      }

      const decryptedData = JSON.parse(
        decrypt(credential.encryptedData, credential.iv)
      );
      const result: BaseCredential = {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        username: credential.username,
        description: credential.description,
        lastUsed: credential.lastUsed,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
        ...decryptedData,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error fetching credential:", error);
      return {
        success: false,
        error: "Failed to fetch credential",
      };
    }
  }

  static async createCredential(
    payload: CredentialPayload
  ): Promise<CredentialResponse> {
    try {
      const id = `cred_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const now = new Date().toISOString();

      // Extract sensitive data based on credential type
      let sensitiveData: Record<string, unknown> = {};
      switch (payload.type) {
        case "network":
          sensitiveData = {
            password: (payload as { password: string }).password,
          };
          break;
        case "ssh":
          sensitiveData = {
            privateKey: (
              payload as {
                privateKey: string;
                publicKey?: string;
                passphrase?: string;
              }
            ).privateKey,
            publicKey: (
              payload as {
                privateKey: string;
                publicKey?: string;
                passphrase?: string;
              }
            ).publicKey,
            passphrase: (
              payload as {
                privateKey: string;
                publicKey?: string;
                passphrase?: string;
              }
            ).passphrase,
          };
          break;
        case "cloud":
          sensitiveData = {
            accessKey: (
              payload as {
                accessKey: string;
                secretKey: string;
                region?: string;
                additionalData?: Record<string, string>;
              }
            ).accessKey,
            secretKey: (
              payload as {
                accessKey: string;
                secretKey: string;
                region?: string;
                additionalData?: Record<string, string>;
              }
            ).secretKey,
            region: (
              payload as {
                accessKey: string;
                secretKey: string;
                region?: string;
                additionalData?: Record<string, string>;
              }
            ).region,
            additionalData: (
              payload as {
                accessKey: string;
                secretKey: string;
                region?: string;
                additionalData?: Record<string, string>;
              }
            ).additionalData,
          };
          break;
        case "vault":
          sensitiveData = {
            token: (payload as { token: string; url: string; role?: string })
              .token,
            url: (payload as { token: string; url: string; role?: string }).url,
            role: (payload as { token: string; url: string; role?: string })
              .role,
          };
          break;
      }

      const { encryptedData, iv } = encrypt(JSON.stringify(sensitiveData));

      const credential: StoredCredential = {
        id,
        name: payload.name,
        type: payload.type,
        username: payload.username,
        description: payload.description,
        encryptedData,
        iv,
        lastUsed: now,
        createdAt: now,
        updatedAt: now,
      };

      this.credentials.push(credential);

      const result: BaseCredential = {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        username: credential.username,
        description: credential.description,
        lastUsed: credential.lastUsed,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      };

      return {
        success: true,
        data: result,
        message: "Credential created successfully",
      };
    } catch (error) {
      console.error("Error creating credential:", error);
      return {
        success: false,
        error: "Failed to create credential",
      };
    }
  }

  static async updateCredential(
    id: string,
    payload: Partial<CredentialPayload>
  ): Promise<CredentialResponse> {
    try {
      const credentialIndex = this.credentials.findIndex(
        (cred) => cred.id === id
      );
      if (credentialIndex === -1) {
        return {
          success: false,
          error: "Credential not found",
        };
      }

      const existingCredential = this.credentials[credentialIndex];

      // If updating sensitive data, re-encrypt
      let encryptedData = existingCredential.encryptedData;
      let iv = existingCredential.iv;

      if (
        payload.type ||
        Object.keys(payload).some((key) =>
          [
            "password",
            "privateKey",
            "publicKey",
            "passphrase",
            "accessKey",
            "secretKey",
            "token",
            "url",
          ].includes(key)
        )
      ) {
        const currentData = JSON.parse(
          decrypt(existingCredential.encryptedData, existingCredential.iv)
        );

        // Update sensitive data
        if (
          payload.type === "network" ||
          existingCredential.type === "network"
        ) {
          if ((payload as { password?: string }).password !== undefined) {
            currentData.password = (payload as { password?: string }).password;
          }
        } else if (
          payload.type === "ssh" ||
          existingCredential.type === "ssh"
        ) {
          if ((payload as { privateKey?: string }).privateKey !== undefined) {
            currentData.privateKey = (
              payload as { privateKey?: string }
            ).privateKey;
          }
          if ((payload as { publicKey?: string }).publicKey !== undefined) {
            currentData.publicKey = (
              payload as { publicKey?: string }
            ).publicKey;
          }
          if ((payload as { passphrase?: string }).passphrase !== undefined) {
            currentData.passphrase = (
              payload as { passphrase?: string }
            ).passphrase;
          }
        } else if (
          payload.type === "cloud" ||
          existingCredential.type === "cloud"
        ) {
          if ((payload as { accessKey?: string }).accessKey !== undefined) {
            currentData.accessKey = (
              payload as { accessKey?: string }
            ).accessKey;
          }
          if ((payload as { secretKey?: string }).secretKey !== undefined) {
            currentData.secretKey = (
              payload as { secretKey?: string }
            ).secretKey;
          }
          if ((payload as { region?: string }).region !== undefined) {
            currentData.region = (payload as { region?: string }).region;
          }
          if (
            (payload as { additionalData?: Record<string, string> })
              .additionalData !== undefined
          ) {
            currentData.additionalData = (
              payload as { additionalData?: Record<string, string> }
            ).additionalData;
          }
        } else if (
          payload.type === "vault" ||
          existingCredential.type === "vault"
        ) {
          if ((payload as { token?: string }).token !== undefined) {
            currentData.token = (payload as { token?: string }).token;
          }
          if ((payload as { url?: string }).url !== undefined) {
            currentData.url = (payload as { url?: string }).url;
          }
          if ((payload as { role?: string }).role !== undefined) {
            currentData.role = (payload as { role?: string }).role;
          }
        }

        const { encryptedData: newEncryptedData, iv: newIv } = encrypt(
          JSON.stringify(currentData)
        );
        encryptedData = newEncryptedData;
        iv = newIv;
      }

      const updatedCredential: StoredCredential = {
        ...existingCredential,
        name: payload.name ?? existingCredential.name,
        username: payload.username ?? existingCredential.username,
        description: payload.description ?? existingCredential.description,
        type: payload.type ?? existingCredential.type,
        encryptedData,
        iv,
        updatedAt: new Date().toISOString(),
      };

      this.credentials[credentialIndex] = updatedCredential;

      const result: BaseCredential = {
        id: updatedCredential.id,
        name: updatedCredential.name,
        type: updatedCredential.type,
        username: updatedCredential.username,
        description: updatedCredential.description,
        lastUsed: updatedCredential.lastUsed,
        createdAt: updatedCredential.createdAt,
        updatedAt: updatedCredential.updatedAt,
      };

      return {
        success: true,
        data: result,
        message: "Credential updated successfully",
      };
    } catch (error) {
      console.error("Error updating credential:", error);
      return {
        success: false,
        error: "Failed to update credential",
      };
    }
  }

  static async deleteCredential(id: string): Promise<CredentialResponse> {
    try {
      const credentialIndex = this.credentials.findIndex(
        (cred) => cred.id === id
      );
      if (credentialIndex === -1) {
        return {
          success: false,
          error: "Credential not found",
        };
      }

      this.credentials.splice(credentialIndex, 1);

      return {
        success: true,
        message: "Credential deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting credential:", error);
      return {
        success: false,
        error: "Failed to delete credential",
      };
    }
  }
}
