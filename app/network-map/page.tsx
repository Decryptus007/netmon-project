"use client"

import React, { useState, useEffect, useCallback } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider, 
  BackgroundVariant,
  Position,
  Panel,
  Handle,
  getBezierPath,
  EdgeProps,
  Node,
  Edge
} from "reactflow"
import { 
  Router, Network, Shield, Wifi, Server, Cloud, LayoutGrid, RefreshCw, X, Activity, CheckCircle, XCircle, AlertTriangle
} from "lucide-react"
import dagre from "dagre"
import "reactflow/dist/style.css"

// Define SNMP device type
interface Interface {
  ifIndex: number;
  ifName: string;
  ifDescr: string;
  ifType: string;
  ifSpeed: number;
  ifAdminStatus: 'up' | 'down';
  ifOperStatus: 'up' | 'down';
  ifPhysAddress?: string;
  ifConnectedTo?: string; // LLDP neighbor device ID
  ifConnectedInterface?: string; // LLDP neighbor port
}

interface SNMPDevice {
  id: string;
  sysName: string;
  sysDescr: string;
  sysLocation: string;
  sysUpTime: number;
  sysContact: string;
  ipAddress: string;
  deviceType: 'router' | 'switch' | 'firewall' | 'wap' | 'server' | 'loadbalancer' | 'cloud';
  deviceSubType?: 'core' | 'distribution' | 'access' | 'edge' | 'branch';
  interfaces: Interface[];
  status: 'active' | 'warning' | 'critical' | 'maintenance' | 'unknown';
  lastUpdated: string;
}

// Define interface for node data
interface DeviceNodeData {
  type: 'router' | 'switch' | 'firewall' | 'wap' | 'server' | 'loadbalancer' | 'cloud';
  label: string;
  ip?: string;
  onClick?: (id: string) => void;
}

// Custom node component that displays an icon based on the device type
const DeviceTypeNode = ({ data, id }: { data: DeviceNodeData, id: string }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'router': return <Router className="h-5 w-5 text-amber-600" />;
      case 'switch': return <Network className="h-5 w-5 text-blue-600" />;
      case 'firewall': return <Shield className="h-5 w-5 text-red-600" />;
      case 'wap': return <Wifi className="h-5 w-5 text-green-600" />;
      case 'server': return <Server className="h-5 w-5 text-purple-600" />;
      case 'cloud': return <Cloud className="h-5 w-5 text-sky-600" />;
      default: return <Router className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div 
      className="flex flex-col items-center cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        console.log("Node clicked directly:", id);
        if (typeof data.onClick === 'function') {
          data.onClick(id);
        }
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ opacity: 0, width: '1px', height: '1px' }} 
        id="top"
      />
      
      <div className="mb-1">{getIcon()}</div>
      <div className="text-xs font-medium">{data.label}</div>
      {data.ip && <div className="text-xs mt-1 px-1.5 py-0.5 bg-gray-100/80 rounded-full backdrop-blur-sm">{data.ip}</div>}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ opacity: 0, width: '1px', height: '1px' }} 
        id="bottom"
      />
      
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ opacity: 0, width: '1px', height: '1px' }} 
        id="left"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ opacity: 0, width: '1px', height: '1px' }} 
        id="right"
      />
    </div>
  );
};

// Custom edge component to show interface names
const InterfaceEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate text offset based on position
  const getTextOffset = (position: Position) => {
    switch (position) {
      case Position.Top:
        return { x: 0, y: -25 };
      case Position.Bottom:
        return { x: 0, y: 25 };
      case Position.Left:
        return { x: -25, y: 0 };
      case Position.Right:
        return { x: 25, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const sourceOffset = getTextOffset(sourcePosition);
  const targetOffset = getTextOffset(targetPosition);

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Main edge label (speed) */}
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2 - 10}
          style={{ fill: '#64748b', fontSize: 10 }}
          textAnchor="middle"
          dominantBaseline="middle"
          className="react-flow__edge-text"
        >
          {data.label}
        </text>
      )}
      
      {/* Source interface name */}
      {data?.sourceInterface && (
        <text
          x={sourceX + sourceOffset.x}
          y={sourceY + sourceOffset.y}
          style={{ fill: '#64748b', fontSize: 8 }}
          textAnchor="middle"
          dominantBaseline="middle"
          className="react-flow__edge-text"
        >
          {data.sourceInterface}
        </text>
      )}
      
      {/* Target interface name */}
      {data?.targetInterface && (
        <text
          x={targetX + targetOffset.x}
          y={targetY + targetOffset.y}
          style={{ fill: '#64748b', fontSize: 8 }}
          textAnchor="middle"
          dominantBaseline="middle"
          className="react-flow__edge-text"
        >
          {data.targetInterface}
        </text>
      )}
    </>
  );
};

// Mock API function to simulate fetching SNMP data
const fetchSNMPData = async (): Promise<SNMPDevice[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // This would be replaced with actual API call in production
  return [
    // ISP connections
    {
      id: "isp-a",
      sysName: "ISP-A",
      sysDescr: "External ISP Provider A",
      sysLocation: "External",
      sysUpTime: 15552000,
      sysContact: "support@isp-a.com",
      ipAddress: "203.0.113.1",
      deviceType: "cloud",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Port 1/1",
          ifDescr: "Link to CORE-RTR-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-rtr-01",
          ifConnectedInterface: "GE0/0/0"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "isp-b",
      sysName: "ISP-B",
      sysDescr: "External ISP Provider B",
      sysLocation: "External",
      sysUpTime: 15379200,
      sysContact: "support@isp-b.com",
      ipAddress: "198.51.100.1",
      deviceType: "cloud",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Port 1/1",
          ifDescr: "Link to CORE-RTR-02",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-rtr-02",
          ifConnectedInterface: "GE0/0/0"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // Core routers - Both connect to the same core switch
    {
      id: "core-rtr-01",
      sysName: "CORE-RTR-01",
      sysDescr: "Cisco ASR1001-X Router",
      sysLocation: "Datacenter Rack A1",
      sysUpTime: 7948800,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.0.1",
      deviceType: "router",
      deviceSubType: "core",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "GE0/0/0",
          ifDescr: "Uplink to ISP-A",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "isp-a",
          ifConnectedInterface: "Port 1/1"
        },
        {
          ifIndex: 2,
          ifName: "GE0/0/1",
          ifDescr: "Link to CORE-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-sw-01",
          ifConnectedInterface: "Ten1/0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "core-rtr-02",
      sysName: "CORE-RTR-02",
      sysDescr: "Cisco ASR1001-X Router",
      sysLocation: "Datacenter Rack A2",
      sysUpTime: 7689600,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.0.2",
      deviceType: "router",
      deviceSubType: "core",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "GE0/0/0",
          ifDescr: "Uplink to ISP-B",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "isp-b",
          ifConnectedInterface: "Port 1/1"
        },
        {
          ifIndex: 2,
          ifName: "GE0/0/1",
          ifDescr: "Link to CORE-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-sw-01",
          ifConnectedInterface: "Ten1/0/2"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // Central core switch - Everything connects through this
    {
      id: "core-sw-01",
      sysName: "CORE-SW-01",
      sysDescr: "Cisco Catalyst 9600 Switch",
      sysLocation: "Datacenter Rack B1",
      sysUpTime: 8035200,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.1.1",
      deviceType: "switch",
      deviceSubType: "core",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Ten1/0/1",
          ifDescr: "Link to CORE-RTR-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-rtr-01",
          ifConnectedInterface: "GE0/0/1"
        },
        {
          ifIndex: 2,
          ifName: "Ten1/0/2",
          ifDescr: "Link to CORE-RTR-02",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-rtr-02",
          ifConnectedInterface: "GE0/0/1"
        },
        {
          ifIndex: 3,
          ifName: "Ten1/0/3",
          ifDescr: "Link to DIST-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dist-sw-01",
          ifConnectedInterface: "Ten1/0/1"
        },
        {
          ifIndex: 4,
          ifName: "Ten1/0/4",
          ifDescr: "Link to DIST-SW-02",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dist-sw-02",
          ifConnectedInterface: "Ten1/0/1"
        },
        {
          ifIndex: 5,
          ifName: "Ten1/0/5",
          ifDescr: "Link to CORE-FW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-fw-01",
          ifConnectedInterface: "eth1/1"
        },
        {
          ifIndex: 6,
          ifName: "Ten1/0/6",
          ifDescr: "Link to WAN-RTR-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "wan-rtr-01",
          ifConnectedInterface: "GE0/0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // Distribution switches - Connect to core switch
    {
      id: "dist-sw-01",
      sysName: "DIST-SW-01",
      sysDescr: "Cisco Catalyst 9300 Switch",
      sysLocation: "Datacenter Rack C1",
      sysUpTime: 7603200,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.2.1",
      deviceType: "switch",
      deviceSubType: "distribution",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Ten1/0/1",
          ifDescr: "Uplink to CORE-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-sw-01",
          ifConnectedInterface: "Ten1/0/3"
        },
        {
          ifIndex: 2,
          ifName: "Gi1/0/1",
          ifDescr: "Link to ACCESS-SW-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "access-sw-01",
          ifConnectedInterface: "Gi0/1"
        },
        {
          ifIndex: 3,
          ifName: "Gi1/0/2",
          ifDescr: "Link to ACCESS-SW-02",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "access-sw-02",
          ifConnectedInterface: "Gi0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "dist-sw-02",
      sysName: "DIST-SW-02",
      sysDescr: "Cisco Catalyst 9300 Switch",
      sysLocation: "Datacenter Rack C2",
      sysUpTime: 7430400,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.2.2",
      deviceType: "switch",
      deviceSubType: "distribution",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Ten1/0/1",
          ifDescr: "Uplink to CORE-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-sw-01",
          ifConnectedInterface: "Ten1/0/4"
        },
        {
          ifIndex: 2,
          ifName: "Gi1/0/1",
          ifDescr: "Link to ACCESS-SW-03",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "access-sw-03",
          ifConnectedInterface: "Gi0/1"
        },
        {
          ifIndex: 3,
          ifName: "Gi1/0/2",
          ifDescr: "Link to ACCESS-SW-04",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "access-sw-04",
          ifConnectedInterface: "Gi0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // Access switches - Connect to distribution switches
    {
      id: "access-sw-01",
      sysName: "ACCESS-SW-01",
      sysDescr: "Cisco Catalyst 2960X Switch",
      sysLocation: "Floor 1 IDF",
      sysUpTime: 6912000,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.3.1",
      deviceType: "switch",
      deviceSubType: "access",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Gi0/1",
          ifDescr: "Uplink to DIST-SW-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dist-sw-01",
          ifConnectedInterface: "Gi1/0/1"
        },
        {
          ifIndex: 2,
          ifName: "Gi0/2",
          ifDescr: "Link to WAP-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "wap-01",
          ifConnectedInterface: "Gi0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "access-sw-02",
      sysName: "ACCESS-SW-02",
      sysDescr: "Cisco Catalyst 2960X Switch",
      sysLocation: "Floor 2 IDF",
      sysUpTime: 6739200,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.3.2",
      deviceType: "switch",
      deviceSubType: "access",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Gi0/1",
          ifDescr: "Uplink to DIST-SW-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dist-sw-01",
          ifConnectedInterface: "Gi1/0/2"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "access-sw-03",
      sysName: "ACCESS-SW-03",
      sysDescr: "Cisco Catalyst 2960X Switch",
      sysLocation: "Floor 3 IDF",
      sysUpTime: 6566400,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.3.3",
      deviceType: "switch",
      deviceSubType: "access",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Gi0/1",
          ifDescr: "Uplink to DIST-SW-02",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dist-sw-02",
          ifConnectedInterface: "Gi1/0/1"
        },
        {
          ifIndex: 2,
          ifName: "Gi0/2",
          ifDescr: "Link to WAP-02",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "wap-02",
          ifConnectedInterface: "Gi0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "access-sw-04",
      sysName: "ACCESS-SW-04",
      sysDescr: "Cisco Catalyst 2960X Switch",
      sysLocation: "Floor 4 IDF",
      sysUpTime: 6393600,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.3.4",
      deviceType: "switch",
      deviceSubType: "access",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Gi0/1",
          ifDescr: "Uplink to DIST-SW-02",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dist-sw-02",
          ifConnectedInterface: "Gi1/0/2"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // WAPs - Connect to access switches
    {
      id: "wap-01",
      sysName: "WAP-01",
      sysDescr: "Cisco Catalyst 9130 Access Point",
      sysLocation: "Floor 1 East Wing",
      sysUpTime: 6048000,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.4.1",
      deviceType: "wap",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Gi0/1",
          ifDescr: "Link to ACCESS-SW-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "access-sw-01",
          ifConnectedInterface: "Gi0/2"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "wap-02",
      sysName: "WAP-02",
      sysDescr: "Cisco Catalyst 9130 Access Point",
      sysLocation: "Floor 3 West Wing",
      sysUpTime: 5875200,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.4.2",
      deviceType: "wap",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Gi0/1",
          ifDescr: "Link to ACCESS-SW-03",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "access-sw-03",
          ifConnectedInterface: "Gi0/2"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // Core firewall - Connects to the core switch
    {
      id: "core-fw-01",
      sysName: "CORE-FW-01",
      sysDescr: "Palo Alto PA-5260 Firewall",
      sysLocation: "Datacenter Rack D1",
      sysUpTime: 6220800,
      sysContact: "security@example.com",
      ipAddress: "10.0.5.1",
      deviceType: "firewall",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "eth1/1",
          ifDescr: "Link to CORE-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-sw-01",
          ifConnectedInterface: "Ten1/0/5"
        },
        {
          ifIndex: 2,
          ifName: "eth1/2",
          ifDescr: "Link to DMZ-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dmz-sw-01",
          ifConnectedInterface: "Ten1/0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // DMZ Switch - Connects to the firewall
    {
      id: "dmz-sw-01",
      sysName: "DMZ-SW-01",
      sysDescr: "Cisco Catalyst 9300 Switch",
      sysLocation: "Datacenter Rack D2",
      sysUpTime: 6048000,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.10.1",
      deviceType: "switch",
      deviceSubType: "distribution",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "Ten1/0/1",
          ifDescr: "Link to CORE-FW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-fw-01",
          ifConnectedInterface: "eth1/2"
        },
        {
          ifIndex: 2,
          ifName: "Gi1/0/1",
          ifDescr: "Link to WEB-SRV-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "web-srv-01",
          ifConnectedInterface: "eth0"
        },
        {
          ifIndex: 3,
          ifName: "Gi1/0/2",
          ifDescr: "Link to WEB-SRV-02",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "web-srv-02",
          ifConnectedInterface: "eth0"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // Web servers - Connect to the DMZ switch
    {
      id: "web-srv-01",
      sysName: "WEB-SRV-01",
      sysDescr: "Dell PowerEdge R750 Server",
      sysLocation: "Datacenter Rack E1",
      sysUpTime: 5184000,
      sysContact: "sysadmin@example.com",
      ipAddress: "10.0.20.1",
      deviceType: "server",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "eth0",
          ifDescr: "Link to DMZ-SW-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dmz-sw-01",
          ifConnectedInterface: "Gi1/0/1"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: "web-srv-02",
      sysName: "WEB-SRV-02",
      sysDescr: "Dell PowerEdge R750 Server",
      sysLocation: "Datacenter Rack E1",
      sysUpTime: 5011200,
      sysContact: "sysadmin@example.com",
      ipAddress: "10.0.20.2",
      deviceType: "server",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "eth0",
          ifDescr: "Link to DMZ-SW-01",
          ifType: "ethernet",
          ifSpeed: 1000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "dmz-sw-01",
          ifConnectedInterface: "Gi1/0/2"
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    
    // WAN Router - Connects to core switch
    {
      id: "wan-rtr-01",
      sysName: "WAN-RTR-01",
      sysDescr: "Cisco ISR 4431 Router",
      sysLocation: "Datacenter Rack F1",
      sysUpTime: 5702400,
      sysContact: "network-ops@example.com",
      ipAddress: "10.0.6.1",
      deviceType: "router",
      deviceSubType: "branch",
      status: "active",
      interfaces: [
        {
          ifIndex: 1,
          ifName: "GE0/0/1",
          ifDescr: "Link to CORE-SW-01",
          ifType: "ethernet",
          ifSpeed: 10000000000,
          ifAdminStatus: "up",
          ifOperStatus: "up",
          ifConnectedTo: "core-sw-01",
          ifConnectedInterface: "Ten1/0/6"
        }
      ],
      lastUpdated: new Date().toISOString()
    }
  ];
};

function NetworkMap() {
  const [selectedNode, setSelectedNode] = useState<SNMPDevice | null>(null);
  const [monitoredInterfaces, setMonitoredInterfaces] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'TB' | 'LR'>('TB');
  const [snmpData, setSNMPData] = useState<SNMPDevice[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Define custom node and edge types
  const nodeTypes = { deviceNode: DeviceTypeNode };
  const edgeTypes = { interface: InterfaceEdge };
  
  // Completely rewrite generateNodesFromSNMP to correctly pass the click handler
  const generateNodesFromSNMP = useCallback((deviceData: SNMPDevice[]) => {
    return deviceData.map(device => ({
      id: device.id,
      position: { x: 0, y: 0 },
      type: 'deviceNode',
      data: {
        label: device.sysName,
        type: device.deviceType,
        ip: device.ipAddress,
        status: device.status,
        // Store a direct reference to the actual device object
        device: device,
        // Define click handler as function to update selectedNode state
        onClick: (nodeId: string) => {
          console.log("onClick handler called with ID:", nodeId, "looking for device");
          // Find the device data (should match since we're using the same ID)
          const selectedDevice = deviceData.find(d => d.id === nodeId);
          if (selectedDevice) {
            console.log("Found device, setting selected node:", selectedDevice.sysName);
            setSelectedNode(selectedDevice);
          } else {
            console.warn("Device not found with ID:", nodeId);
          }
        }
      }
    }));
  }, []);  // No dependency on setSelectedNode as it's from useState and stable

  // Function to generate edges from SNMP data
  const generateEdgesFromSNMP = (snmpData: SNMPDevice[]) => {
    const edges: Edge[] = [];
    const processedConnections = new Set();
    
    snmpData.forEach(device => {
      device.interfaces.forEach(iface => {
        if (iface.ifConnectedTo) {
          // Create unique connection ID
          const connectionPair = [device.id, iface.ifConnectedTo].sort();
          const connectionId = `${connectionPair[0]}-${connectionPair[1]}`;
          
          // Skip if we've already processed this connection
          if (processedConnections.has(connectionId)) {
            return;
          }
          
          // Mark connection as processed
          processedConnections.add(connectionId);
          
          // Find target device and interface
          const targetDevice = snmpData.find(d => d.id === iface.ifConnectedTo);
          targetDevice?.interfaces.find(i => 
            i.ifConnectedTo === device.id && i.ifConnectedInterface === iface.ifName
          );
          
          // Create the edge
          edges.push({
            id: `e-${device.id}-${iface.ifConnectedTo}`,
            source: device.id,
            target: iface.ifConnectedTo,
            sourceHandle: 'bottom', // Default
            targetHandle: 'top',    // Default
            style: { 
              stroke: iface.ifOperStatus === 'up' ? '#22c55e' : '#ef4444',
              strokeWidth: iface.ifSpeed >= 10000000000 ? 3 : 2
            },
            animated: iface.ifOperStatus === 'down',
            type: 'interface',
            data: {
              label: `${(iface.ifSpeed / 1000000000).toFixed(1)} Gbps`,
              sourceInterface: iface.ifName,
              targetInterface: iface.ifConnectedInterface,
              linkStatus: iface.ifOperStatus,
              linkSpeed: iface.ifSpeed
            }
          });
        }
      });
    });
    
    return edges;
  };

  // Layout function using dagre for hierarchical positioning
  const getLayoutedElements = (
    nodes: Node<DeviceNodeData>[],
    edges: Edge[],
    direction = 'TB'
  ) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ 
      rankdir: direction,
      nodesep: 120,
      ranksep: 150,
      marginx: 20,
      marginy: 20
    });

    // Set nodes
    nodes.forEach(node => {
      dagreGraph.setNode(node.id, { width: 150, height: 60 });
    });

    // Set edges
    edges.forEach(edge => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply layout to nodes
    return {
      nodes: nodes.map(node => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 75,
            y: nodeWithPosition.y - 30
          },
        };
      }),
      edges: edges.map(edge => {
        // Update handles based on layout direction
        return {
          ...edge,
          sourceHandle: isHorizontal ? 'right' : 'bottom',
          targetHandle: isHorizontal ? 'left' : 'top',
        }
      })
    };
  };

  // Load SNMP data and create diagram
  const loadNetworkData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch data from API
      const data = await fetchSNMPData();
      setSNMPData(data);
      
      // Generate nodes and edges
      const generatedNodes = generateNodesFromSNMP(data);
      const generatedEdges = generateEdgesFromSNMP(data);
      
      // Apply layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        generatedNodes,
        generatedEdges,
        layout
      );
      
      // Update state
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  }, [layout, setNodes, setEdges, generateNodesFromSNMP]);
  
  // Initial load
  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);
  
  // Toggle between vertical and horizontal layouts
  const toggleLayout = () => {
    setLayout(prev => prev === 'TB' ? 'LR' : 'TB');
  };
  
  // Add function to toggle interface monitoring
  const toggleInterfaceMonitoring = (nodeId: string, ifIndex: number) => {
    const key = `${nodeId}-${ifIndex}`;
    setMonitoredInterfaces(prev => {
      const updated = new Set(prev);
      if (updated.has(key)) {
        updated.delete(key);
      } else {
        updated.add(key);
      }
      return updated;
    });
  };

  // Add this effect to directly handle clicks on nodes via DOM events
  useEffect(() => {
    // Skip if still loading
    if (loading) return;
    
    // Function to handle click events on nodes
    const handleNodeClick = (event: Event) => {
      // Look for closest node element
      const nodeElement = (event.target as Element).closest('.react-flow__node');
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id');
        console.log("Node clicked via DOM event:", nodeId);
        
        if (nodeId) {
          const device = snmpData.find(d => d.id === nodeId);
          if (device) {
            console.log("Found device:", device.sysName);
            setSelectedNode(device);
          }
        }
      }
    };
    
    // Get the ReactFlow container
    const flowContainer = document.querySelector('.react-flow');
    if (flowContainer) {
      // Add click event listener to the flow container
      flowContainer.addEventListener('click', handleNodeClick);
      
      // Return cleanup function
      return () => {
        flowContainer.removeEventListener('click', handleNodeClick);
      };
    }
  }, [loading, snmpData, setSelectedNode]);

  return (
    <div className="border rounded-lg shadow-sm relative" style={{ width: '100%', height: '80vh' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <div className="text-sm text-gray-600">Loading network data...</div>
          </div>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        elementsSelectable={true}
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(n) => {
            switch (n.data.type) {
              case 'router': return '#F59E0B';
              case 'switch': return '#3B82F6';
              case 'firewall': return '#EF4444';
              case 'wap': return '#10B981';
              case 'server': return '#8B5CF6';
              case 'cloud': return '#0EA5E9';
              default: return '#6B7280';
            }
          }}
        />
        
        <Panel position="top-right" className="flex space-x-2">
          <button 
            onClick={toggleLayout}
            className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm border border-gray-200"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-xs">{layout === 'TB' ? 'Horizontal' : 'Vertical'} Layout</span>
          </button>
          
          <button 
            onClick={loadNetworkData}
            className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm border border-gray-200"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs">Refresh Data</span>
          </button>
        </Panel>
        
        <Panel position="bottom-left" className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
          <div className="text-sm font-medium mb-2">Device Types</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <Router className="h-4 w-4 text-amber-600" />
              <span className="text-xs">Router</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="h-4 w-4 text-blue-600" />
              <span className="text-xs">Switch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-xs">Firewall</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-xs">Wireless AP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="h-4 w-4 text-purple-600" />
              <span className="text-xs">Server</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-sky-600" />
              <span className="text-xs">ISP/Cloud</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
      
      {/* Node details panel */}
      {selectedNode && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-10">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h3 className="font-medium">{selectedNode.sysName}</h3>
            <button 
              onClick={() => setSelectedNode(null)}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Device info */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Device Information</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <div className="flex items-center">
                  {selectedNode.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
                  {selectedNode.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />}
                  {selectedNode.status === 'critical' && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                  <span className="capitalize">{selectedNode.status}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">IP Address</span>
                <span>{selectedNode.ipAddress}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">{selectedNode.deviceType} {selectedNode.deviceSubType && `(${selectedNode.deviceSubType})`}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Location</span>
                <span>{selectedNode.sysLocation}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Uptime</span>
                <span>{Math.floor(selectedNode.sysUpTime / 86400)} days</span>
              </div>
            </div>
          </div>
          
          {/* Interface list */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Interfaces</h4>
            
            <div className="space-y-3">
              {selectedNode.interfaces.map(iface => {
                const isMonitored = monitoredInterfaces.has(`${selectedNode.id}-${iface.ifIndex}`);
                
                return (
                  <div key={iface.ifIndex} className="p-2 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{iface.ifName}</span>
                      <div className="flex items-center">
                        {iface.ifOperStatus === 'up' ? (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Up</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Down</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-1">{iface.ifDescr}</div>
                    
                    <div className="flex justify-between text-xs mb-2">
                      <span>{iface.ifType}</span>
                      <span>{(iface.ifSpeed / 1000000000).toFixed(1)} Gbps</span>
                    </div>
                    
                    {iface.ifConnectedTo && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <Activity className="h-3 w-3 mr-1" />
                        <span>Connected to {iface.ifConnectedTo} ({iface.ifConnectedInterface})</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {isMonitored ? 'Monitored' : 'Not monitored'}
                      </span>
                      <button 
                        onClick={() => toggleInterfaceMonitoring(selectedNode.id, iface.ifIndex)}
                        className={`px-2 py-1 text-xs rounded ${
                          isMonitored 
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isMonitored ? 'Disable Monitoring' : 'Enable Monitoring'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NetworkMapPage() {
  return (
    <ReactFlowProvider>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Network Topology</h1>
        <p className="text-sm text-gray-500 mb-4">
          Dynamic network map with real-time SNMP data and interface information
        </p>
        <NetworkMap />
      </div>
    </ReactFlowProvider>
  );
}

