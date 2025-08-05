import { ElMessage, ElMessageBox } from 'element-plus'

// 错误类型常量
export const ErrorType = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

// 自定义错误类
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code?: string
  public readonly details?: any

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    details?: any
  ) {
    super(message)
    this.type = type
    this.code = code
    this.details = details
    this.name = 'AppError'
  }
}

// 错误消息映射
const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络连接失败，请检查网络设置',
  [ErrorType.VALIDATION]: '输入数据不符合要求',
  [ErrorType.AUTHENTICATION]: '身份验证失败，请重新登录',
  [ErrorType.AUTHORIZATION]: '权限不足，无法执行此操作',
  [ErrorType.NOT_FOUND]: '请求的资源不存在',
  [ErrorType.SERVER_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorType.UNKNOWN]: '发生未知错误'
}

// 统一错误处理函数
export function handleError(error: unknown, showMessage: boolean = true): AppError {
  let appError: AppError

  if (error instanceof AppError) {
    appError = error
  } else if (error instanceof Error) {
    appError = new AppError(error.message, ErrorType.UNKNOWN)
  } else if (typeof error === 'string') {
    appError = new AppError(error, ErrorType.UNKNOWN)
  } else {
    appError = new AppError('发生未知错误', ErrorType.UNKNOWN)
  }

  // 记录错误到控制台
  console.error('应用错误:', appError)

  // 显示用户友好的错误消息
  if (showMessage) {
    const message = appError.message || errorMessages[appError.type]
    ElMessage.error(message)
  }

  return appError
}

// 创建特定类型的错误
export function createValidationError(message: string, details?: any): AppError {
  return new AppError(message, ErrorType.VALIDATION, undefined, details)
}

export function createNetworkError(message?: string): AppError {
  return new AppError(message || errorMessages[ErrorType.NETWORK], ErrorType.NETWORK)
}

export function createAuthError(message?: string): AppError {
  return new AppError(message || errorMessages[ErrorType.AUTHENTICATION], ErrorType.AUTHENTICATION)
}

export function createNotFoundError(message?: string): AppError {
  return new AppError(message || errorMessages[ErrorType.NOT_FOUND], ErrorType.NOT_FOUND)
}

// 异步操作包装器
export async function withErrorHandler<T>(
  operation: () => Promise<T>,
  showError: boolean = true
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    handleError(error, showError)
    return null
  }
}

// 确认对话框包装器
export async function confirmAction(
  message: string,
  title: string = '确认操作',
  type: 'warning' | 'info' | 'success' | 'error' = 'warning'
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type,
    })
    return true
  } catch {
    return false
  }
}

// 重试机制
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries) {
        throw error
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }

  throw lastError
} 