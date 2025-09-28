export interface Policy {
  id: string;
  name: string;
  description: string;
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

export interface CreatePolicyDto {
  name: string;
  description: string;
  dataTypes: Policy['dataTypes'];
}

export interface UpdatePolicyDto extends CreatePolicyDto {
  id: string;
} 