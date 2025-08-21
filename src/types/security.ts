// 数据安全相关类型定义

// 加密算法类型
export type EncryptionAlgorithm =
  | "AES-256-GCM"
  | "AES-256-CBC"
  | "ChaCha20-Poly1305"
  | "RSA-OAEP";

// 哈希算法类型
export type HashAlgorithm = "SHA-256" | "SHA-512" | "bcrypt" | "argon2";

// 访问级别类型
export type AccessLevel =
  | "public"
  | "internal"
  | "confidential"
  | "secret"
  | "top-secret";

// 数据分类类型
export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "classified";

// 安全事件类型
export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_change"
  | "permission_granted"
  | "permission_revoked"
  | "data_access"
  | "data_modification"
  | "data_deletion"
  | "export_attempt"
  | "backup_created"
  | "backup_restored"
  | "encryption_enabled"
  | "encryption_disabled"
  | "audit_log_accessed"
  | "security_alert";

// 安全事件级别
export type SecurityEventLevel = "info" | "warning" | "error" | "critical";

// 加密配置接口
export interface EncryptionConfig {
  algorithm: EncryptionAlgorithm;
  keySize: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
  keyDerivationFunction: "PBKDF2" | "Argon2" | "bcrypt";
  enabled: boolean;
  lastKeyRotation: string;
  nextKeyRotation: string;
}

// 数据加密记录接口
export interface DataEncryptionRecord {
  id: string;
  dataType: string;
  dataId: string;
  originalHash: string;
  encryptedHash: string;
  algorithm: EncryptionAlgorithm;
  keyId: string;
  encryptedAt: string;
  encryptedBy: string;
  status: "encrypted" | "decrypted" | "key_rotated";
}

// 访问日志记录接口
export interface AccessLogRecord {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  resource: string;
  resourceType: string;
  accessLevel: AccessLevel;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  timestamp: string;
  success: boolean;
  failureReason?: string;
  duration: number; // 毫秒
  dataAccessed?: string;
  dataModified?: boolean;
}

// 安全事件记录接口
export interface SecurityEventRecord {
  id: string;
  type: SecurityEventType;
  level: SecurityEventLevel;
  userId?: string;
  username?: string;
  description: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

// 数据备份记录接口
export interface BackupRecord {
  id: string;
  name: string;
  description: string;
  type: "full" | "incremental" | "differential";
  size: number; // 字节
  compressionRatio: number;
  encryptionEnabled: boolean;
  encryptionAlgorithm?: EncryptionAlgorithm;
  backupLocation: string;
  backupFormat: "sql" | "json" | "binary" | "archive";
  createdAt: string;
  createdBy: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "restored";
  completedAt?: string;
  duration: number; // 秒
  checksum: string;
  verified: boolean;
  retentionDays: number;
  expiresAt: string;
}

// 灾难恢复计划接口
export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  version: string;
  lastUpdated: string;
  updatedBy: string;
  status: "draft" | "active" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  rto: number; // Recovery Time Objective (小时)
  rpo: number; // Recovery Point Objective (小时)
  steps: DisasterRecoveryStep[];
  contacts: DisasterRecoveryContact[];
  resources: DisasterRecoveryResource[];
  testingSchedule: string;
  lastTested?: string;
  nextTestDate: string;
}

// 灾难恢复步骤接口
export interface DisasterRecoveryStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: "preparation" | "detection" | "response" | "recovery" | "validation";
  estimatedDuration: number; // 分钟
  dependencies: string[]; // 依赖的步骤ID
  responsiblePerson: string;
  contactInfo: string;
  automated: boolean;
  scriptPath?: string;
  manualInstructions?: string;
  successCriteria: string;
  rollbackPlan?: string;
}

// 灾难恢复联系人接口
export interface DisasterRecoveryContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  backupContact?: string;
  availability: string;
  escalationLevel: number;
}

// 灾难恢复资源接口
export interface DisasterRecoveryResource {
  id: string;
  name: string;
  type:
    | "server"
    | "database"
    | "storage"
    | "network"
    | "application"
    | "service";
  description: string;
  location: string;
  specifications: string;
  status: "available" | "in_use" | "maintenance" | "failed";
  backupLocation?: string;
  recoveryTime: number; // 分钟
  dependencies: string[]; // 依赖的资源ID
}

// 数据分类策略接口
export interface DataClassificationPolicy {
  id: string;
  name: string;
  description: string;
  classification: DataClassification;
  criteria: string[];
  encryptionRequired: boolean;
  accessControls: string[];
  retentionPolicy: string;
  auditRequired: boolean;
  exportRestrictions: string[];
  createdAt: string;
  createdBy: string;
  lastUpdated: string;
  updatedBy: string;
  status: "active" | "inactive" | "archived";
}

// 密钥管理记录接口
export interface KeyManagementRecord {
  id: string;
  keyId: string;
  keyType: "encryption" | "signing" | "authentication";
  algorithm: EncryptionAlgorithm;
  keySize: number;
  status: "active" | "inactive" | "expired" | "compromised";
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  lastUsed?: string;
  usageCount: number;
  rotationSchedule: string;
  nextRotation: string;
  backupLocation: string;
  metadata: Record<string, any>;
}

// 安全配置接口
export interface SecurityConfig {
  id: string;
  encryption: EncryptionConfig;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // 天
    preventReuse: number; // 防止重复使用的密码数量
  };
  sessionPolicy: {
    maxSessionDuration: number; // 分钟
    idleTimeout: number; // 分钟
    maxConcurrentSessions: number;
    requireReauthForSensitiveActions: boolean;
  };
  auditPolicy: {
    enabled: boolean;
    retentionDays: number;
    logLevel: "minimal" | "standard" | "detailed";
    includeSensitiveData: boolean;
    realTimeAlerts: boolean;
  };
  backupPolicy: {
    enabled: boolean;
    schedule: string; // cron表达式
    retentionDays: number;
    encryptionRequired: boolean;
    compressionEnabled: boolean;
    verificationRequired: boolean;
  };
  accessControlPolicy: {
    enabled: boolean;
    defaultAccessLevel: AccessLevel;
    requireMFA: boolean;
    ipWhitelist: string[];
    ipBlacklist: string[];
    timeRestrictions: {
      enabled: boolean;
      allowedHours: { start: number; end: number };
      allowedDays: number[]; // 0-6, 0=Sunday
    };
  };
}

// 安全统计接口
export interface SecurityStatistics {
  totalAccessLogs: number;
  totalSecurityEvents: number;
  totalBackups: number;
  totalEncryptedRecords: number;
  failedLoginAttempts: number;
  successfulLogins: number;
  dataAccessCount: number;
  dataModificationCount: number;
  backupSuccessRate: number;
  encryptionCoverage: number;
  averageResponseTime: number; // 毫秒
  securityScore: number; // 0-100
  lastSecurityAudit: string;
  nextSecurityAudit: string;
  criticalAlerts: number;
  resolvedIncidents: number;
  openIncidents: number;
}

// 查询条件类型
export interface SecurityQueryCondition {
  userId?: string;
  eventType?: SecurityEventType;
  level?: SecurityEventLevel;
  dateRange?: { start: string; end: string };
  resourceType?: string;
  success?: boolean;
  ipAddress?: string;
  classification?: DataClassification;
  accessLevel?: AccessLevel;
}

// 导出选项类型
export interface SecurityExportOptions {
  format: "json" | "csv" | "pdf";
  includeSensitiveData: boolean;
  dateRange?: { start: string; end: string };
  eventTypes?: SecurityEventType[];
  encryptionRequired: boolean;
}
