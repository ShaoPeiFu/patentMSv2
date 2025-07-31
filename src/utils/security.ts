// 安全工具函数

// 简单的加密解密工具（仅用于演示，生产环境应使用更强的加密）
export class SimpleCrypto {
  private static readonly key = 'patent-ms-2024'
  
  // 简单的异或加密
  static encrypt(text: string): string {
    let result = ''
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
      )
    }
    return btoa(result)
  }
  
  // 简单的异或解密
  static decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText)
      let result = ''
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        )
      }
      return result
    } catch {
      return ''
    }
  }
}

// 密码强度检查
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) {
    score += 2
  } else {
    feedback.push('密码至少需要8个字符')
  }
  
  if (password.length >= 12) {
    score += 1
  }
  
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含小写字母')
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含大写字母')
  }
  
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含数字')
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2
  } else {
    feedback.push('建议包含特殊字符')
  }
  
  // 检查连续字符
  if (!/(.)\1{2,}/.test(password)) {
    score += 1
  } else {
    feedback.push('避免使用连续相同字符')
  }
  
  const isStrong = score >= 6
  
  return {
    score: Math.min(score, 10),
    feedback,
    isStrong
  }
}

// 输入过滤和清理
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // 移除尖括号
    .replace(/javascript:/gi, '') // 移除javascript:协议
    .replace(/on\w+\s*=/gi, '') // 移除事件处理器
    .trim()
}

// HTML实体编码
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (match) => map[match])
}

// 验证邮箱格式
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证手机号格式
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证身份证号格式
export function validateIdCard(idCard: string): boolean {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return idCardRegex.test(idCard)
}

// 生成随机字符串
export function generateRandomString(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

// 生成安全的token
export function generateSecureToken(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = generateRandomString(16)
  return `${timestamp}.${randomPart}`
}

// 验证文件类型
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

// 验证文件大小
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

// 安全的本地存储
export class SecureStorage {
  private static encryptData = true // 在生产环境中应该始终为true
  
  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value)
      const data = this.encryptData ? SimpleCrypto.encrypt(serialized) : serialized
      localStorage.setItem(key, data)
    } catch (error) {
      console.error('存储数据失败:', error)
    }
  }
  
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key)
      if (!data) return defaultValue
      
      const serialized = this.encryptData ? SimpleCrypto.decrypt(data) : data
      if (!serialized) return defaultValue
      
      return JSON.parse(serialized)
    } catch (error) {
      console.error('读取数据失败:', error)
      return defaultValue
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(key)
  }
  
  static clear(): void {
    localStorage.clear()
  }
}

// 权限检查
export function checkPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    'user': 1,
    'reviewer': 2,
    'admin': 3
  }
  
  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

// 脱敏处理
export function maskSensitiveData(data: string, type: 'phone' | 'email' | 'idCard' | 'name'): string {
  if (!data) return ''
  
  switch (type) {
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    case 'email':
      const [username, domain] = data.split('@')
      if (!domain) return data
      const maskedUsername = username.length > 2 
        ? username.substring(0, 2) + '***' + username.substring(username.length - 1)
        : username
      return `${maskedUsername}@${domain}`
    case 'idCard':
      return data.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
    case 'name':
      if (data.length <= 2) return data
      return data.substring(0, 1) + '*'.repeat(data.length - 2) + data.substring(data.length - 1)
    default:
      return data
  }
} 