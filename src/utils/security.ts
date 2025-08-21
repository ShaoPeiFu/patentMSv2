// 安全工具函数

// Web Crypto API 加密工具
export class CryptoUtils {
  private static readonly algorithm = "AES-GCM";
  private static readonly keyLength = 256;

  // 生成加密密钥
  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // 加密数据
  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv,
      },
      key,
      encodedData
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  // 解密数据
  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encryptedArray = combined.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        encryptedArray
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error("解密失败:", error);
      return "";
    }
  }

  // 生成密钥对
  static async generateKeyPair(): Promise<{
    publicKey: CryptoKey;
    privateKey: CryptoKey;
  }> {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  }
}

// 简单的加密解密工具（仅用于演示，生产环境应使用更强的加密）
export class SimpleCrypto {
  private static readonly key = "patent-ms-2024";

  // 简单的异或加密
  static encrypt(text: string): string {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
      );
    }
    // 使用 encodeURIComponent 处理 Unicode 字符
    return btoa(encodeURIComponent(result));
  }

  // 简单的异或解密
  static decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText);
      const decodedText = decodeURIComponent(decoded);
      let result = "";
      for (let i = 0; i < decodedText.length; i++) {
        result += String.fromCharCode(
          decodedText.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        );
      }
      return result;
    } catch {
      return "";
    }
  }
}

// 日志记录工具
export class LoggingUtils {
  private static readonly logPrefix = "[PatentMS]";
  private static readonly maxLogSize = 1000; // 最大日志条数
  private static logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    details?: any;
  }> = [];

  // 添加日志
  static log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    details?: any
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `${this.logPrefix} ${message}`,
      details,
    };

    this.logs.unshift(logEntry);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(0, this.maxLogSize);
    }

    // 控制台输出
    const consoleMethod =
      level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[consoleMethod](logEntry.message, details || "");

    // 保存到本地存储
    this.saveLogs();
  }

  // 获取日志
  static getLogs(level?: string, limit?: number) {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(0, limit);
    }

    return filteredLogs;
  }

  // 清理日志
  static clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  // 导出日志
  static exportLogs(format: "json" | "csv" = "json") {
    if (format === "csv") {
      const headers = ["时间", "级别", "消息"];
      const rows = this.logs.map((log) => [
        log.timestamp,
        log.level,
        log.message,
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      return csvContent;
    } else {
      return JSON.stringify(this.logs, null, 2);
    }
  }

  // 保存日志到本地存储
  private static saveLogs() {
    try {
      // 创建一个安全的日志副本，避免循环引用
      const safeLogs = this.logs.map((log) => ({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        details: log.details ? this.sanitizeObject(log.details) : undefined,
      }));

      localStorage.setItem("patent-ms-logs", JSON.stringify(safeLogs));
    } catch (error) {
      console.error("保存日志失败:", error);
    }
  }

  // 清理对象，移除循环引用
  private static sanitizeObject(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (seen.has(obj)) {
      return "[Circular Reference]";
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, seen));
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeObject(obj[key], seen);
      }
    }

    return sanitized;
  }

  // 从本地存储加载日志
  static loadLogs() {
    try {
      const savedLogs = localStorage.getItem("patent-ms-logs");
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error("加载日志失败:", error);
    }
  }
}

// 备份工具
export class BackupUtils {
  private static readonly backupPrefix = "patent-ms-backup";
  private static readonly maxBackups = 10;

  // 创建备份
  static async createBackup(data: any, name?: string): Promise<string> {
    try {
      const backupData = {
        id: this.generateBackupId(),
        name: name || `备份_${new Date().toISOString().slice(0, 19)}`,
        timestamp: new Date().toISOString(),
        data: this.sanitizeBackupData(data),
        version: "1.0",
        checksum: this.calculateChecksum(
          JSON.stringify(this.sanitizeBackupData(data))
        ),
      };

      const backupKey = `${this.backupPrefix}_${backupData.id}`;
      const encryptedData = SimpleCrypto.encrypt(JSON.stringify(backupData));

      localStorage.setItem(backupKey, encryptedData);

      // 更新备份列表
      this.updateBackupList(backupData);

      LoggingUtils.log("info", `备份已创建: ${backupData.name}`, {
        id: backupData.id,
        name: backupData.name,
        timestamp: backupData.timestamp,
        version: backupData.version,
      });

      return backupData.id;
    } catch (error) {
      LoggingUtils.log("error", "创建备份失败", error);
      throw error;
    }
  }

  // 恢复备份
  static async restoreBackup(backupId: string): Promise<any> {
    try {
      const backupKey = `${this.backupPrefix}_${backupId}`;
      const encryptedData = localStorage.getItem(backupKey);

      if (!encryptedData) {
        throw new Error("备份不存在");
      }

      const decryptedData = SimpleCrypto.decrypt(encryptedData);
      const backupData = JSON.parse(decryptedData);

      // 验证校验和
      const currentChecksum = this.calculateChecksum(
        JSON.stringify(backupData.data)
      );
      if (currentChecksum !== backupData.checksum) {
        throw new Error("备份数据已损坏");
      }

      LoggingUtils.log("info", `备份已恢复: ${backupData.name}`, backupData);

      return backupData.data;
    } catch (error) {
      LoggingUtils.log("error", "恢复备份失败", error);
      throw error;
    }
  }

  // 获取备份列表
  static getBackupList(): Array<{
    id: string;
    name: string;
    timestamp: string;
    size: number;
  }> {
    try {
      const backupList = localStorage.getItem(`${this.backupPrefix}_list`);
      return backupList ? JSON.parse(backupList) : [];
    } catch (error) {
      LoggingUtils.log("error", "获取备份列表失败", error);
      return [];
    }
  }

  // 删除备份
  static deleteBackup(backupId: string): boolean {
    try {
      const backupKey = `${this.backupPrefix}_${backupId}`;
      localStorage.removeItem(backupKey);

      // 从备份列表中移除
      const backupList = this.getBackupList();
      const updatedList = backupList.filter((backup) => backup.id !== backupId);
      localStorage.setItem(
        `${this.backupPrefix}_list`,
        JSON.stringify(updatedList)
      );

      LoggingUtils.log("info", `备份已删除: ${backupId}`);
      return true;
    } catch (error) {
      LoggingUtils.log("error", "删除备份失败", error);
      return false;
    }
  }

  // 生成备份ID
  private static generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 计算校验和
  private static calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }

  // 更新备份列表
  private static updateBackupList(backupData: any) {
    try {
      const backupList = this.getBackupList();
      const newEntry = {
        id: backupData.id,
        name: backupData.name,
        timestamp: backupData.timestamp,
        size: JSON.stringify(backupData).length,
      };

      backupList.unshift(newEntry);

      // 保持备份数量在限制内
      if (backupList.length > this.maxBackups) {
        backupList.splice(this.maxBackups);
      }

      localStorage.setItem(
        `${this.backupPrefix}_list`,
        JSON.stringify(backupList)
      );
    } catch (error) {
      LoggingUtils.log("error", "更新备份列表失败", error);
    }
  }

  // 清理备份数据，移除循环引用
  private static sanitizeBackupData(data: any, seen = new WeakSet()): any {
    if (data === null || typeof data !== "object") {
      return data;
    }

    if (seen.has(data)) {
      return "[Circular Reference]";
    }

    seen.add(data);

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeBackupData(item, seen));
    }

    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeBackupData(data[key], seen);
      }
    }

    return sanitized;
  }
}

// 安全监控工具
export class SecurityMonitor {
  private static events: Array<{
    id: string;
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    timestamp: string;
    resolved: boolean;
  }> = [];

  // 添加安全事件
  static addEvent(
    type: string,
    severity: "low" | "medium" | "high" | "critical",
    description: string
  ) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      description,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.events.unshift(event);

    // 保持最近1000条事件
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }

    // 记录到日志
    LoggingUtils.log("info", `安全事件: ${description}`, event);

    return event.id;
  }

  // 获取安全事件
  static getEvents(type?: string, severity?: string, limit?: number) {
    let filteredEvents = this.events;

    if (type) {
      filteredEvents = filteredEvents.filter((event) => event.type === type);
    }

    if (severity) {
      filteredEvents = filteredEvents.filter(
        (event) => event.severity === severity
      );
    }

    if (limit) {
      filteredEvents = filteredEvents.slice(0, limit);
    }

    return filteredEvents;
  }

  // 解决事件
  static resolveEvent(eventId: string): boolean {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.resolved = true;
      LoggingUtils.log("info", `安全事件已解决: ${event.description}`);
      return true;
    }
    return false;
  }

  // 获取安全统计
  static getSecurityStats() {
    const totalEvents = this.events.length;
    const criticalEvents = this.events.filter(
      (e) => e.severity === "critical"
    ).length;
    const resolvedEvents = this.events.filter((e) => e.resolved).length;
    const todayEvents = this.events.filter((e) => {
      const eventDate = new Date(e.timestamp);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length;

    return {
      totalEvents,
      criticalEvents,
      resolvedEvents,
      todayEvents,
      unresolvedEvents: totalEvents - resolvedEvents,
    };
  }
}

// 密码强度检查
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 2;
  } else {
    feedback.push("密码至少需要8个字符");
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("需要包含小写字母");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("需要包含大写字母");
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("需要包含数字");
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2;
  } else {
    feedback.push("建议包含特殊字符");
  }

  // 检查连续字符
  if (!/(.)\1{2,}/.test(password)) {
    score += 1;
  } else {
    feedback.push("避免使用连续相同字符");
  }

  const isStrong = score >= 6;

  return {
    score: Math.min(score, 10),
    feedback,
    isStrong,
  };
}

// 输入过滤和清理
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/[<>]/g, "") // 移除尖括号
    .replace(/javascript:/gi, "") // 移除javascript:协议
    .replace(/on\w+\s*=/gi, "") // 移除事件处理器
    .trim();
}

// HTML实体编码
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (match) => map[match]);
}

// 验证邮箱格式
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证手机号格式
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 验证身份证号格式
export function validateIdCard(idCard: string): boolean {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return idCardRegex.test(idCard);
}

// 生成随机字符串
export function generateRandomString(length: number = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// 生成安全的token
export function generateSecureToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateRandomString(16);
  return `${timestamp}.${randomPart}`;
}

// 验证文件类型
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// 验证文件大小
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// 安全的本地存储
export class SecureStorage {
  private static encryptData = true; // 在生产环境中应该始终为true

  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const data = this.encryptData
        ? SimpleCrypto.encrypt(serialized)
        : serialized;
      localStorage.setItem(key, data);
    } catch (error) {
      console.error("存储数据失败:", error);
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;

      const serialized = this.encryptData ? SimpleCrypto.decrypt(data) : data;
      if (!serialized) return defaultValue;

      return JSON.parse(serialized);
    } catch (error) {
      console.error("读取数据失败:", error);
      return defaultValue;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

// 权限检查
export function checkPermission(
  userRole: string,
  requiredRole: string
): boolean {
  const roleHierarchy: Record<string, number> = {
    user: 1,
    reviewer: 2,
    admin: 3,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

// 脱敏处理
export function maskSensitiveData(
  data: string,
  type: "phone" | "email" | "idCard" | "name"
): string {
  if (!data) return "";

  switch (type) {
    case "phone":
      return data.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
    case "email":
      const [username, domain] = data.split("@");
      if (!domain) return data;
      const maskedUsername =
        username.length > 2
          ? username.substring(0, 2) +
            "***" +
            username.substring(username.length - 1)
          : username;
      return `${maskedUsername}@${domain}`;
    case "idCard":
      return data.replace(/(\d{6})\d{8}(\d{4})/, "$1********$2");
    case "name":
      if (data.length <= 2) return data;
      return (
        data.substring(0, 1) +
        "*".repeat(data.length - 2) +
        data.substring(data.length - 1)
      );
    default:
      return data;
  }
}

// 初始化安全模块
export function initializeSecurity() {
  // 加载日志
  LoggingUtils.loadLogs();

  // 记录初始化事件
  LoggingUtils.log("info", "安全模块已初始化");
  SecurityMonitor.addEvent("system", "low", "安全模块初始化完成");

  // 创建初始备份（避免循环引用）
  const initialData = {
    settings: {},
    logs: LoggingUtils.getLogs().map((log) => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
    })),
    events: SecurityMonitor.getEvents().map((event) => ({
      id: event.id,
      type: event.type,
      severity: event.severity,
      description: event.description,
      timestamp: event.timestamp,
      resolved: event.resolved,
    })),
  };

  BackupUtils.createBackup(initialData, "系统初始化备份");
}
