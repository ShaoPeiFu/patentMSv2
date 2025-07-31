// 统一的标签类型处理工具

// Element Plus el-tag 允许的类型
export type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

// 安全的类型转换函数
export function safeTagType(type: string | undefined | null): TagType {
  const validTypes: TagType[] = ['primary', 'success', 'info', 'warning', 'danger']
  
  if (type && validTypes.includes(type as TagType)) {
    return type as TagType
  }
  
  return 'info' // 默认类型
}

// 用户角色类型映射
export function getRoleTagType(role?: string): TagType {
  const roleTypeMap: Record<string, TagType> = {
    user: 'info',
    admin: 'danger', 
    reviewer: 'warning'
  }
  
  return roleTypeMap[role || ''] || 'info'
}

// 专利状态类型映射
export function getPatentStatusTagType(status?: string): TagType {
  const statusTypeMap: Record<string, TagType> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    expired: 'info',
    maintained: 'primary'
  }
  
  return statusTypeMap[status || ''] || 'info'
}

// 费用状态类型映射
export function getFeeStatusTagType(status?: string): TagType {
  const feeStatusTypeMap: Record<string, TagType> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'danger'
  }
  
  return feeStatusTypeMap[status || ''] || 'info'
}

// 活动状态类型映射
export function getActivityStatusTagType(status?: string): TagType {
  const activityStatusTypeMap: Record<string, TagType> = {
    success: 'success',
    pending: 'warning',
    warning: 'warning',
    info: 'info',
    error: 'danger'
  }
  
  return activityStatusTypeMap[status || ''] || 'info'
}

// 通用状态类型映射
export function getGenericStatusTagType(status?: string): TagType {
  const genericStatusTypeMap: Record<string, TagType> = {
    active: 'success',
    inactive: 'info',
    disabled: 'danger',
    enabled: 'success',
    online: 'success',
    offline: 'info',
    connected: 'success',
    disconnected: 'warning'
  }
  
  return genericStatusTypeMap[status || ''] || 'info'
}

// 优先级类型映射  
export function getPriorityTagType(priority?: string | number): TagType {
  const priorityTypeMap: Record<string, TagType> = {
    high: 'danger',
    medium: 'warning', 
    low: 'info',
    urgent: 'danger',
    normal: 'info',
    '1': 'danger',  // 高优先级
    '2': 'warning', // 中优先级
    '3': 'info'     // 低优先级
  }
  
  return priorityTypeMap[String(priority || '')] || 'info'
} 