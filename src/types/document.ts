export interface DocumentVersion {
  id: string
  documentId: string
  version: string // 版本号，如 "1.0", "1.1", "2.0"
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadedBy: number
  uploadedByName: string
  uploadedAt: string
  description?: string
  changeLog?: string
  status: DocumentVersionStatus
  isLatest: boolean
  parentVersionId?: string // 基于哪个版本创建
  checksum: string // 文件校验和
}

export type DocumentVersionStatus = 
  | 'draft'      // 草稿
  | 'pending'    // 待审批
  | 'approved'   // 已批准
  | 'rejected'   // 已拒绝
  | 'archived'   // 已归档
  | 'obsolete'   // 已过时

export interface DocumentVersionHistory {
  id: string
  documentId: string
  versions: DocumentVersion[]
  createdAt: string
  updatedAt: string
}

export interface DocumentApproval {
  id: string
  documentVersionId: string
  approverUserId: number
  approverName: string
  action: 'approve' | 'reject' | 'request_changes'
  comment?: string
  approvedAt: string
  signature?: ElectronicSignature
}

export interface ApprovalWorkflow {
  id: string
  name: string
  description?: string
  steps: ApprovalStep[]
  isActive: boolean
  createdBy: number
  createdAt: string
  type: 'sequential' | 'parallel' | 'conditional' // 工作流类型
  priority: 'low' | 'medium' | 'high' | 'urgent' // 优先级
  category: string // 分类（如：专利、合同、报告等）
  version: string // 工作流版本
  tags?: string[] // 标签
}

export interface ApprovalStep {
  id: string
  stepNumber: number
  name: string
  description?: string
  approverRoles: string[] // 可以审批的角色
  approverUsers?: number[] // 可以审批的特定用户
  isRequired: boolean
  allowParallel: boolean // 是否允许并行审批
  timeLimit?: number // 审批时间限制（小时）
  minApprovals?: number // 最小审批数量（用于并行审批）
  autoApprove?: boolean // 超时后是否自动批准
  nextStepConditions?: ApprovalCondition[] // 下一步的条件
  delegationAllowed?: boolean // 是否允许委托
}

export interface DocumentApprovalProcess {
  id: string
  documentVersionId: string
  workflowId: string
  currentStep: number
  status: ApprovalProcessStatus
  startedAt: string
  completedAt?: string
  approvals: DocumentApproval[]
  rejections: DocumentApproval[]
  comments: ApprovalComment[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedCompletionTime?: string
  actualCompletionTime?: string
  delegations: ApprovalDelegation[]
  timeouts: ApprovalTimeout[]
  escalations: ApprovalEscalation[]
  lastActivityAt: string
}

// 审批升级
export interface ApprovalEscalation {
  id: string
  processId: string
  fromUserId: number
  toUserId: number
  reason: string
  escalatedAt: string
  resolvedAt?: string
  isResolved: boolean
}

export type ApprovalProcessStatus = 
  | 'pending'    // 进行中
  | 'approved'   // 已批准
  | 'rejected'   // 已拒绝
  | 'cancelled'  // 已取消

export interface ApprovalComment {
  id: string
  processId: string
  userId: number
  userName: string
  content: string
  createdAt: string
  isSystemGenerated?: boolean
}

// 审批条件
export interface ApprovalCondition {
  id: string
  type: 'role' | 'user' | 'count' | 'time' | 'custom'
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_equals'
  value: string | number
  nextStepId?: string // 满足条件时的下一步
}

// 审批委托
export interface ApprovalDelegation {
  id: string
  delegatorId: number // 委托人ID
  delegatorName: string
  delegateeId: number // 被委托人ID
  delegateeName: string
  workflowId?: string // 特定工作流（可选）
  startDate: string
  endDate: string
  reason: string
  isActive: boolean
  createdAt: string
}

// 审批超时处理
export interface ApprovalTimeout {
  id: string
  processId: string
  stepId: string
  expectedCompletionTime: string
  actualTimeoutTime: string
  action: 'auto_approve' | 'auto_reject' | 'escalate' | 'notify'
  escalateToUserId?: number
  notificationsSent: number
  isResolved: boolean
}

// 工作流模板
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  steps: Omit<ApprovalStep, 'id'>[]
  estimatedDuration: number // 预估完成时间（小时）
  complexity: 'simple' | 'medium' | 'complex'
  usage: number // 使用次数
  createdBy: number
  createdAt: string
  updatedAt: string
}

// 审批统计
export interface ApprovalStatistics {
  totalProcesses: number
  pendingProcesses: number
  approvedProcesses: number
  rejectedProcesses: number
  overdueProcesses: number
  averageProcessingTime: number // 平均处理时间（小时）
  byWorkflow: Record<string, {
    total: number
    approved: number
    rejected: number
    pending: number
    averageTime: number
  }>
  byUser: Record<number, {
    processed: number
    pending: number
    averageTime: number
  }>
}

export interface ElectronicSignature {
  id: string
  signerId: number
  signerName: string
  signerEmail: string
  signatureData: string // Base64编码的签名数据
  signatureType: 'digital' | 'drawn' | 'typed' | 'certificate'
  signedAt: string
  ipAddress: string
  userAgent: string
  isValid: boolean
  certificateInfo?: {
    issuer: string
    subject: string
    serialNumber: string
    validFrom: string
    validTo: string
  }
}

export interface DocumentComparison {
  id: string
  documentId: string
  oldVersionId: string
  newVersionId: string
  comparisonType: 'text' | 'binary' | 'metadata'
  differences: DocumentDifference[]
  generatedAt: string
  generatedBy: number
}

export interface DocumentDifference {
  type: 'added' | 'removed' | 'modified' | 'moved'
  location: string // 位置信息
  oldContent?: string
  newContent?: string
  lineNumber?: number
  description: string
}

export interface DocumentVersionComparisonResult {
  identical: boolean
  similarityScore: number // 相似度分数 0-100
  totalChanges: number
  additions: number
  deletions: number
  modifications: number
  differences: DocumentDifference[]
}

export interface DocumentTemplate {
  id: string
  name: string
  description?: string
  category: string
  fileUrl: string
  previewUrl?: string
  fields: TemplateField[]
  isActive: boolean
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface TemplateField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file'
  required: boolean
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    message?: string
  }
}

export interface DocumentRevision {
  id: string
  documentVersionId: string
  revisionNumber: number
  description: string
  changes: string[]
  createdBy: number
  createdByName: string
  createdAt: string
  isMinor: boolean // 是否为小版本修订
}

export interface DocumentAccess {
  id: string
  documentId: string
  userId: number
  userName: string
  accessType: 'view' | 'edit' | 'approve' | 'admin'
  grantedBy: number
  grantedAt: string
  expiresAt?: string
  isActive: boolean
}

export interface DocumentActivityLog {
  id: string
  documentId: string
  documentVersionId?: string
  userId: number
  userName: string
  action: DocumentAction
  description: string
  metadata?: Record<string, any>
  timestamp: string
  ipAddress?: string
}

export type DocumentAction = 
  | 'create'
  | 'upload'
  | 'download'
  | 'view'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'sign'
  | 'share'
  | 'restore'
  | 'archive'

export interface DocumentStats {
  totalDocuments: number
  totalVersions: number
  pendingApprovals: number
  recentActivity: number
  storageUsed: number // bytes
  storageLimit: number // bytes
  byStatus: Record<DocumentVersionStatus, number>
  byType: Record<string, number>
}

// 搜索和筛选相关
export interface DocumentSearchParams {
  query?: string
  documentId?: string
  fileName?: string
  fileType?: string
  status?: DocumentVersionStatus
  uploadedBy?: number
  dateFrom?: string
  dateTo?: string
  tags?: string[]
  hasSignature?: boolean
  approvalStatus?: ApprovalProcessStatus
}

export interface DocumentSearchResult {
  documents: DocumentVersion[]
  total: number
  page: number
  pageSize: number
  facets: {
    fileTypes: Array<{ type: string; count: number }>
    statuses: Array<{ status: string; count: number }>
    uploaders: Array<{ userId: number; name: string; count: number }>
  }
}