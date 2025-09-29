export const samplePolicies = [
    {
        id: 'policy-1',
        name: 'Basic Network Monitoring',
        description: 'Basic network monitoring policy for routers and switches',
        deviceTypes: ['router', 'switch'],
        dataTypes: ['snmp', 'syslog'],
        collectionInterval: 300,
        retentionPeriod: 30,
        thresholds: {
            cpu: 80,
            memory: 85,
            bandwidth: 90
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'policy-2',
        name: 'Advanced Security Monitoring',
        description: 'Advanced security monitoring for firewalls and IDS/IPS',
        deviceTypes: ['firewall', 'ids', 'ips'],
        dataTypes: ['syslog', 'netflow'],
        collectionInterval: 60,
        retentionPeriod: 90,
        thresholds: {
            cpu: 70,
            memory: 75,
            bandwidth: 80
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'policy-3',
        name: 'Server Performance Monitoring',
        description: 'Server performance monitoring policy',
        deviceTypes: ['server'],
        dataTypes: ['snmp', 'syslog'],
        collectionInterval: 120,
        retentionPeriod: 60,
        thresholds: {
            cpu: 90,
            memory: 90,
            bandwidth: 95
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
export const sampleAgents = [
    {
        id: 'agent-1',
        name: 'Core Router Agent',
        policyId: 'policy-1',
        status: 'active',
        lastSeen: new Date().toISOString(),
        platform: 'linux',
        ipAddress: '192.168.1.1',
        version: '1.0.0',
        dataTypes: ['snmp', 'syslog'],
        tenantId: 'default-tenant',
        siteId: 'site-1'
    },
    {
        id: 'agent-2',
        name: 'Edge Firewall Agent',
        policyId: 'policy-2',
        status: 'active',
        lastSeen: new Date().toISOString(),
        platform: 'linux',
        ipAddress: '192.168.1.2',
        version: '1.0.0',
        dataTypes: ['syslog', 'netflow'],
        tenantId: 'default-tenant',
        siteId: 'site-1'
    },
    {
        id: 'agent-3',
        name: 'Data Center Switch Agent',
        policyId: 'policy-1',
        status: 'inactive',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        platform: 'linux',
        ipAddress: '192.168.1.3',
        version: '1.0.0',
        dataTypes: ['snmp', 'syslog'],
        tenantId: 'default-tenant',
        siteId: 'site-2'
    },
    {
        id: 'agent-4',
        name: 'Web Server Agent',
        policyId: 'policy-3',
        status: 'active',
        lastSeen: new Date().toISOString(),
        platform: 'linux',
        ipAddress: '192.168.1.4',
        version: '1.0.0',
        dataTypes: ['snmp', 'syslog'],
        tenantId: 'default-tenant',
        siteId: 'site-1'
    },
    {
        id: 'agent-5',
        name: 'Database Server Agent',
        policyId: 'policy-3',
        status: 'active',
        lastSeen: new Date().toISOString(),
        platform: 'linux',
        ipAddress: '192.168.1.5',
        version: '1.0.0',
        dataTypes: ['snmp', 'syslog'],
        tenantId: 'default-tenant',
        siteId: 'site-2'
    },
    {
        id: 'agent-6',
        name: 'Branch Office Router Agent',
        policyId: 'policy-1',
        status: 'active',
        lastSeen: new Date().toISOString(),
        platform: 'linux',
        ipAddress: '192.168.2.1',
        version: '1.0.0',
        dataTypes: ['snmp', 'syslog'],
        tenantId: 'default-tenant',
        siteId: 'site-2'
    }
];
//# sourceMappingURL=sample-data.js.map