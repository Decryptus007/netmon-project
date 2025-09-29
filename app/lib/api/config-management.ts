import { Device, ActivityLog } from "@/app/types/config-management";

class ConfigManagementApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  async getAllDevices(tenantId: string): Promise<Device[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/devices?tenantId=${tenantId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch devices");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching devices:", error);
      // Return mock data for development
      return this.getMockDevices(tenantId);
    }
  }

  async getRecentActivity(
    tenantId: string,
    limit: number = 20
  ): Promise<ActivityLog[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/config-activity?tenantId=${tenantId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching activity:", error);
      // Return mock data for development
      return this.getMockActivityLogs(tenantId);
    }
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching device:", error);
      return null;
    }
  }

  async createConfigurationSnapshot(
    deviceId: string,
    content: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/config-backups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId, content, notes }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error creating snapshot:", error);
      return false;
    }
  }

  private getMockDevices(tenantId: string): Device[] {
    return [
      {
        id: "1",
        name: "Router-01",
        ip: "192.168.1.1",
        type: "Router",
        model: "Cisco ISR 4451",
        status: "online",
        lastSeen: new Date().toISOString(),
        location: "Main Office",
        tenantId,
      },
      {
        id: "2",
        name: "Switch-01",
        ip: "192.168.1.2",
        type: "Switch",
        model: "Cisco Catalyst 9300",
        status: "offline",
        lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        location: "Data Center",
        tenantId,
      },
      {
        id: "3",
        name: "Firewall-01",
        ip: "192.168.1.3",
        type: "Firewall",
        model: "FortiGate 60F",
        status: "online",
        lastSeen: new Date().toISOString(),
        location: "Main Office",
        tenantId,
      },
    ];
  }

  private getMockActivityLogs(tenantId: string): ActivityLog[] {
    return [
      {
        id: "1",
        deviceId: "1",
        action: "config_backup",
        description: "Configuration backup created for Router-01",
        status: "success",
        timestamp: new Date().toISOString(),
        userId: "user-1",
        tenantId,
      },
      {
        id: "2",
        deviceId: "3",
        action: "config_update",
        description: "Firewall rules updated on Firewall-01",
        status: "success",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        userId: "user-2",
        tenantId,
      },
      {
        id: "3",
        deviceId: "2",
        action: "device_check",
        description: "Health check failed for Switch-01",
        status: "error",
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        userId: "system",
        tenantId,
      },
    ];
  }
}

export const configManagementApi = new ConfigManagementApi();
