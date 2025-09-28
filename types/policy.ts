export interface Policy {
  id: string;
  name: string;
  description: string;
  platform?: 'windows' | 'mac' | 'linux';
  dataTypes: {
    snmp?: {
      enabled: boolean;
      metrics: string[];
      interval: number;
    };
    syslog?: {
      enabled: boolean;
      facilities: string[];
      severities: string[];
    };
    netflow?: {
      enabled: boolean;
      samplingRate: number;
      template: string;
    };
  };
} 