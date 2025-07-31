// 专利状态枚举
export type PatentStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'maintained'

// 专利类型枚举
export type PatentType = 'invention' | 'utility_model' | 'design' | 'software'

// 专利分类
export interface PatentCategory {
  id: number
  name: string
  description?: string
  parentId?: number
  createdAt: string
  updatedAt: string
}

// 专利实体
export interface Patent {
  id: number
  title: string
  description: string
  patentNumber: string
  applicationNumber: string
  applicationDate: string
  publicationDate?: string
  grantDate?: string
  expirationDate?: string
  status: PatentStatus
  type: PatentType
  categoryId: number
  category?: PatentCategory
  
  // 申请人信息
  applicants: string[]
  inventors: string[]
  
  // 法律信息
  priorityDate?: string
  priorityCountry?: string
  legalStatus: string
  
  // 技术信息
  abstract: string
  claims: string[]
  technicalField: string
  keywords: string[]
  
  // 文件信息
  documents: PatentDocument[]
  
  // 费用信息
  fees: PatentFee[]
  
  // 时间线
  timeline: PatentEvent[]
  
  // 元数据
  createdAt: string
  updatedAt: string
  createdBy: number
  updatedBy: number
}

// 专利文档
export interface PatentDocument {
  id: number
  patentId: number
  name: string
  type: 'application' | 'publication' | 'grant' | 'amendment' | 'other'
  fileUrl: string
  fileSize: number
  uploadedAt: string
  uploadedBy: number
}

// 专利费用
export interface PatentFee {
  id: number
  patentId: number
  type: 'application' | 'examination' | 'grant' | 'maintenance' | 'other'
  amount: number
  currency: string
  dueDate: string
  paidDate?: string
  status: 'pending' | 'paid' | 'overdue'
  description?: string
}

// 专利事件
export interface PatentEvent {
  id: number
  patentId: number
  type: 'application' | 'publication' | 'examination' | 'grant' | 'maintenance' | 'amendment'
  title: string
  description: string
  date: string
  documents?: PatentDocument[]
}

// 专利搜索参数
export interface PatentSearchParams {
  keyword?: string
  status?: PatentStatus[]
  type?: PatentType[]
  categoryId?: number[]
  dateRange?: {
    start: string
    end: string
  }
  applicants?: string[]
  inventors?: string[]
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 专利统计
export interface PatentStatistics {
  total: number
  byStatus: Record<PatentStatus, number>
  byType: Record<PatentType, number>
  byCategory: Record<number, number>
  byYear: Record<string, number>
  recentApplications: number
  expiringSoon: number
  maintenanceDue: number
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
} 

// Element Plus 表格相关类型
export interface PatentTableSelection {
  id: number
  title: string
  patentNumber: string
  status: PatentStatus
  type: PatentType
  applicationDate: string
}

// 快速操作接口
export interface QuickAction {
  icon: string
  title: string
  description: string
  action: () => void
}

// 菜单项接口
export interface MenuItem {
  path: string
  title: string
  icon: any // Vue组件类型
  exact: boolean
}

// 文件上传相关
export interface UploadFile {
  name: string
  file: File | null
  type: string
  description: string
}

// 验证规则
export interface ValidationRule {
  required?: boolean
  message?: string
  trigger?: string
  validator?: (rule: any, value: any, callback: (error?: Error) => void) => void
  min?: number
  max?: number
  pattern?: RegExp
}

// API响应包装
export interface ApiResult<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
} 