import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface LogConfig {
  level: LogLevel;
  retentionDays: number;
  maxFileSize: number; // MB
  maxFiles: number;
  enableConsole: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
  logDirectory: string;
}

export class LoggingService {
  private prisma: PrismaClient;
  private config: LogConfig;
  private currentLogFile: string;
  private currentFileSize: number = 0;
  private logStream: fs.WriteStream | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = {
      level: LogLevel.INFO,
      retentionDays: 90,
      maxFileSize: 10, // 10MB
      maxFiles: 5,
      enableConsole: true,
      enableFile: true,
      enableDatabase: true,
      logDirectory: process.env.LOG_DIR || path.join(process.cwd(), 'logs')
    };

    // 确保日志目录存在
    this.ensureLogDirectory();
    
    // 初始化当前日志文件
    this.currentLogFile = this.getLogFileName();
    this.initializeLogFile();
    
    console.log('📝 日志服务已初始化');
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
      console.log(`📁 创建日志目录: ${this.config.logDirectory}`);
    }
  }

  /**
   * 获取日志文件名
   */
  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.config.logDirectory, `app-${date}.log`);
  }

  /**
   * 初始化日志文件
   */
  private initializeLogFile(): void {
    try {
      if (this.logStream) {
        this.logStream.end();
      }

      this.currentLogFile = this.getLogFileName();
      this.currentFileSize = fs.existsSync(this.currentLogFile) 
        ? fs.statSync(this.currentLogFile).size 
        : 0;

      this.logStream = fs.createWriteStream(this.currentLogFile, { 
        flags: 'a',
        encoding: 'utf8'
      });

      // 写入日志文件头
      const header = `\n=== 日志文件开始: ${new Date().toISOString()} ===\n`;
      this.logStream.write(header);
      this.currentFileSize += header.length;

    } catch (error) {
      console.error('初始化日志文件失败:', error);
    }
  }

  /**
   * 检查是否需要轮转日志文件
   */
  private checkLogRotation(): void {
    const maxSizeBytes = this.config.maxFileSize * 1024 * 1024;
    
    if (this.currentFileSize >= maxSizeBytes) {
      this.rotateLogFile();
    }
  }

  /**
   * 轮转日志文件
   */
  private rotateLogFile(): void {
    try {
      if (this.logStream) {
        this.logStream.end();
        this.logStream = null;
      }

      // 重命名当前日志文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
      fs.renameSync(this.currentLogFile, rotatedFile);

      // 清理旧日志文件
      this.cleanupOldLogFiles();

      // 初始化新的日志文件
      this.initializeLogFile();

      console.log(`🔄 日志文件已轮转: ${rotatedFile}`);

    } catch (error) {
      console.error('轮转日志文件失败:', error);
    }
  }

  /**
   * 清理旧日志文件
   */
  private cleanupOldLogFiles(): void {
    try {
      const files = fs.readdirSync(this.config.logDirectory)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDirectory, file),
          stats: fs.statSync(path.join(this.config.logDirectory, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // 保留最新的maxFiles个文件
      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          console.log(`🧹 删除旧日志文件: ${file.name}`);
        }
      }

    } catch (error) {
      console.error('清理旧日志文件失败:', error);
    }
  }

  /**
   * 记录日志
   */
  async log(entry: LogEntry): Promise<void> {
    // 检查日志级别
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const logMessage = this.formatLogMessage(entry);

    // 控制台输出
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // 文件输出
    if (this.config.enableFile) {
      this.logToFile(logMessage);
    }

    // 数据库输出
    if (this.config.enableDatabase) {
      await this.logToDatabase(entry);
    }
  }

  /**
   * 检查是否应该记录此级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.config.level);
    const entryLevelIndex = levels.indexOf(level);
    
    return entryLevelIndex >= currentLevelIndex;
  }

  /**
   * 格式化日志消息
   */
  private formatLogMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(7);
    const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    const user = entry.userId ? ` | User: ${entry.userId}` : '';
    const request = entry.requestId ? ` | Request: ${entry.requestId}` : '';
    
    return `[${timestamp}] ${level} | ${entry.message}${context}${user}${request}\n`;
  }

  /**
   * 控制台输出
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m',   // 青色
      [LogLevel.INFO]: '\x1b[32m',    // 绿色
      [LogLevel.WARN]: '\x1b[33m',    // 黄色
      [LogLevel.ERROR]: '\x1b[31m',   // 红色
      [LogLevel.CRITICAL]: '\x1b[35m' // 紫色
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level] || '';
    
    console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`);
    
    if (entry.context) {
      console.log(`${color}Context:${reset}`, entry.context);
    }
  }

  /**
   * 文件输出
   */
  private logToFile(message: string): void {
    try {
      if (this.logStream && this.logStream.writable) {
        this.logStream.write(message);
        this.currentFileSize += message.length;
        this.checkLogRotation();
      }
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  /**
   * 数据库输出
   */
  private async logToDatabase(entry: LogEntry): Promise<void> {
    try {
      await this.prisma.securityEventLog.create({
        data: {
          userId: entry.userId || 1, // 如果没有用户ID，使用系统用户
          eventType: `log_${entry.level}`,
          description: entry.message,
          severity: entry.level,
          metadata: JSON.stringify({
            context: entry.context,
            requestId: entry.requestId,
            timestamp: entry.timestamp.toISOString()
          }),
          ipAddress: entry.ipAddress || 'system',
          userAgent: entry.userAgent || 'LoggingService'
        }
      });
    } catch (error) {
      console.error('写入日志到数据库失败:', error);
    }
  }

  /**
   * 记录调试日志
   */
  async debug(message: string, context?: Record<string, any>, userId?: number): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      context,
      userId
    });
  }

  /**
   * 记录信息日志
   */
  async info(message: string, context?: Record<string, any>, userId?: number): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      context,
      userId
    });
  }

  /**
   * 记录警告日志
   */
  async warn(message: string, context?: Record<string, any>, userId?: number): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      context,
      userId
    });
  }

  /**
   * 记录错误日志
   */
  async error(message: string, context?: Record<string, any>, userId?: number): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      context,
      userId
    });
  }

  /**
   * 记录严重错误日志
   */
  async critical(message: string, context?: Record<string, any>, userId?: number): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: LogLevel.CRITICAL,
      message,
      context,
      userId
    });
  }

  /**
   * 记录HTTP请求日志
   */
  async logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const level = statusCode >= 400 ? LogLevel.ERROR : 
                  statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;

    await this.log({
      timestamp: new Date(),
      level,
      message: `${method} ${url} - ${statusCode} (${duration}ms)`,
      context: {
        method,
        url,
        statusCode,
        duration,
        type: 'http_request'
      },
      userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * 记录数据库操作日志
   */
  async logDatabaseOperation(
    operation: string,
    table: string,
    recordId?: number,
    userId?: number,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message: `Database ${operation} on ${table}${recordId ? ` (ID: ${recordId})` : ''}`,
      context: {
        operation,
        table,
        recordId,
        type: 'database_operation',
        ...details
      },
      userId
    });
  }

  /**
   * 记录安全事件
   */
  async logSecurityEvent(
    eventType: string,
    description: string,
    severity: LogLevel,
    userId?: number,
    ipAddress?: string,
    userAgent?: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      level: severity,
      message: `Security Event: ${description}`,
      context: {
        eventType,
        type: 'security_event',
        ...context
      },
      userId,
      ipAddress,
      userAgent
    });
  }

  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      // 清理文件系统中的旧日志
      let fileCleanupCount = 0;
      const files = fs.readdirSync(this.config.logDirectory)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDirectory, file),
          stats: fs.statSync(path.join(this.config.logDirectory, file))
        }));

      for (const file of files) {
        if (file.stats.mtime < cutoffDate) {
          fs.unlinkSync(file.path);
          fileCleanupCount++;
        }
      }

      // 清理数据库中的旧日志
      const dbCleanupCount = await this.prisma.securityEventLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      const totalCleaned = fileCleanupCount + dbCleanupCount.count;
      
      if (totalCleaned > 0) {
        console.log(`🧹 清理了 ${totalCleaned} 个过期日志 (文件: ${fileCleanupCount}, 数据库: ${dbCleanupCount.count})`);
      }

      return totalCleaned;

    } catch (error) {
      console.error('清理过期日志失败:', error);
      return 0;
    }
  }

  /**
   * 获取日志统计信息
   */
  async getLogStatistics(): Promise<{
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByDate: Record<string, number>;
    averageLogSize: number;
  }> {
    try {
      // 获取数据库日志统计
      const totalLogs = await this.prisma.securityEventLog.count();
      
      const logsByLevel = await this.prisma.securityEventLog.groupBy({
        by: ['severity'],
        _count: { severity: true }
      });

      const logsByDate = await this.prisma.securityEventLog.groupBy({
        by: ['timestamp'],
        _count: { timestamp: true },
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
          }
        }
      });

      // 获取文件日志统计
      const logFiles = fs.readdirSync(this.config.logDirectory)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => path.join(this.config.logDirectory, file));

      let totalFileSize = 0;
      for (const file of logFiles) {
        if (fs.existsSync(file)) {
          totalFileSize += fs.statSync(file).size;
        }
      }

      const averageLogSize = logFiles.length > 0 ? totalFileSize / logFiles.length : 0;

      return {
        totalLogs,
        logsByLevel: logsByLevel.reduce((acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        }, {} as Record<string, number>),
        logsByDate: logsByDate.reduce((acc, item) => {
          const date = item.timestamp.toISOString().split('T')[0];
          acc[date] = item._count.timestamp;
          return acc;
        }, {} as Record<string, number>),
        averageLogSize
      };

    } catch (error) {
      console.error('获取日志统计信息失败:', error);
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsByDate: {},
        averageLogSize: 0
      };
    }
  }

  /**
   * 关闭日志服务
   */
  async shutdown(): Promise<void> {
    try {
      if (this.logStream) {
        this.logStream.end();
        this.logStream = null;
      }
      
      console.log('📝 日志服务已关闭');
    } catch (error) {
      console.error('关闭日志服务失败:', error);
    }
  }
}


