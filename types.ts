
export enum ComplianceStandard {
  INFO_SEC = 'Information Security Policy',
  ACCESS_CONTROL = 'Access Control Policy',
  PASSWORD_AUTH = 'Password and Authentication Policy',
  DATA_CLASS = 'Data Classification Policy',
  DATA_PRIVACY = 'Data Protection and Privacy Policy',
  ACCEPTABLE_USE = 'Acceptable Use Policy',
  NETWORK_SEC = 'Network Security Policy',
  ENDPOINT_SEC = 'Endpoint Security Policy',
  INCIDENT_RESPONSE = 'Incident Response Policy',
  BACKUP_DR = 'Backup and Disaster Recovery Policy',
  PATCH_MGMT = 'Patch Management Policy',
  VULNERABILITY_MGMT = 'Vulnerability Management Policy',
  VENDOR_SEC = 'Third-Party / Vendor Security Policy',
  LOGGING_MONITORING = 'Logging and Monitoring Policy',
  EMAIL_COMM = 'Email and Communication Security Policy',
  MOBILE_BYOD = 'Mobile Device and BYOD Policy',
  AWARENESS_TRAINING = 'Security Awareness and Training Policy',
  PHYSICAL_SEC = 'Physical Security Policy',
  CHANGE_MGMT = 'Change Management Policy',
  BUSINESS_CONTINUITY = 'Business Continuity Policy'
}

export interface AuditResult {
  overallScore: number;
  status: 'Compliant' | 'Partial' | 'Non-Compliant';
  violations: Violation[];
  recommendations: string[];
  dataFlow?: DataFlowGraph;
}

export interface Violation {
  standard: string;
  clause: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  sourceRef?: string;
}

export interface DataFlowNode {
  id: string;
  label: string;
  type: 'collection' | 'processing' | 'storage' | 'third-party' | 'user';
  riskLevel?: 'high' | 'medium' | 'low';
}

export interface DataFlowEdge {
  source: string;
  target: string;
  label?: string;
  dataType?: string;
}

export interface DataFlowGraph {
  nodes: DataFlowNode[];
  edges: DataFlowEdge[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  id: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  policyPreview: string;
  codePreview: string;
  result: AuditResult;
  metadata?: {
    duration: number;
    engineSignature: string;
    environment: string;
    driveFileId?: string;
  };
}

export interface UserAccount {
  name: string;
  company: string;
  email: string;
  role: string;
  history: HistoryItem[];
  isDriveConnected: boolean;
  lastDriveSync?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSyncDrive: boolean;
  };
}

export interface CommitScan {
  id: string;
  commitHash: string;
  author: string;
  timestamp: string;
  status: 'Pass' | 'Fail' | 'Warning';
  issuesCount: number;
  summary: string;
  details: string;
  diff?: string;
}

export interface GitRepo {
  id: string;
  url: string;
  name: string;
  branch: string;
  isActive: boolean;
  lastScanAt?: string;
}
