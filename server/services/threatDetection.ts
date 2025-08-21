import { PrismaClient } from "@prisma/client";
import { LoggingService, LogLevel } from "./logging";

export interface ThreatIndicator {
  id: string;
  type:
    | "authentication"
    | "data_access"
    | "system_operation"
    | "network"
    | "file_operation";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface ThreatScore {
  userId: number;
  score: number; // 0-100
  level: "safe" | "low_risk" | "medium_risk" | "high_risk" | "critical";
  factors: string[];
  lastUpdated: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: "threshold" | "pattern" | "anomaly" | "compliance";
  conditions: Record<string, any>;
  actions: string[];
  enabled: boolean;
  priority: number;
}

export class ThreatDetectionService {
  private prisma: PrismaClient;
  private loggingService: LoggingService;
  private rules: SecurityRule[] = [];
  private threatScores: Map<number, ThreatScore> = new Map();

  constructor(prisma: PrismaClient, loggingService: LoggingService) {
    this.prisma = prisma;
    this.loggingService = loggingService;
    this.initializeDefaultRules();
    console.log("🛡️ 威胁检测服务已初始化");
  }

  /**
   * 初始化默认安全规则
   */
  private initializeDefaultRules() {
    this.rules = [
      {
        id: "auth_failure_threshold",
        name: "认证失败阈值检测",
        description: "检测短时间内多次认证失败",
        type: "threshold",
        conditions: { maxFailures: 5, timeWindow: 300000 }, // 5分钟内5次失败
        actions: ["block_user", "alert_admin", "log_event"],
        enabled: true,
        priority: 1,
      },
      {
        id: "unusual_access_pattern",
        name: "异常访问模式检测",
        description: "检测非正常时间的系统访问",
        type: "pattern",
        conditions: {
          normalHours: { start: 8, end: 18 },
          timezone: "Asia/Shanghai",
        },
        actions: ["alert_admin", "log_event"],
        enabled: true,
        priority: 2,
      },
      {
        id: "data_export_anomaly",
        name: "数据导出异常检测",
        description: "检测异常大量的数据导出操作",
        type: "anomaly",
        conditions: {
          maxExportSize: 1000000, // 1MB
          maxExportFrequency: 10, // 每小时最多10次
        },
        actions: ["block_operation", "alert_admin", "log_event"],
        enabled: true,
        priority: 3,
      },
      {
        id: "privilege_escalation",
        name: "权限提升检测",
        description: "检测用户权限的异常提升",
        type: "compliance",
        conditions: {
          requireApproval: true,
          maxPrivilegeLevel: "admin",
        },
        actions: ["require_approval", "alert_admin", "log_event"],
        enabled: true,
        priority: 4,
      },
    ];
  }

  /**
   * 分析安全事件并检测威胁
   */
  async analyzeSecurityEvent(
    userId: number,
    eventType: string,
    metadata: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ThreatIndicator[]> {
    const threats: ThreatIndicator[] = [];
    const timestamp = new Date();

    try {
      // 1. 认证失败检测
      if (eventType === "login_failed") {
        const authThreats = await this.detectAuthenticationThreats(
          userId,
          metadata,
          timestamp
        );
        threats.push(...authThreats);
      }

      // 2. 数据访问异常检测
      if (eventType === "data_access") {
        const accessThreats = await this.detectDataAccessThreats(
          userId,
          metadata,
          timestamp
        );
        threats.push(...accessThreats);
      }

      // 3. 系统操作异常检测
      if (eventType === "system_operation") {
        const systemThreats = await this.detectSystemOperationThreats(
          userId,
          metadata,
          timestamp
        );
        threats.push(...systemThreats);
      }

      // 4. 网络异常检测
      if (ipAddress) {
        const networkThreats = await this.detectNetworkThreats(
          userId,
          ipAddress,
          timestamp
        );
        threats.push(...networkThreats);
      }

      // 5. 更新威胁评分
      await this.updateThreatScore(userId, threats);

      // 6. 记录威胁事件
      for (const threat of threats) {
        await this.loggingService.logSecurityEvent(
          "threat_detected",
          threat.description,
          this.mapSeverityToLogLevel(threat.severity),
          userId,
          ipAddress,
          userAgent,
          threat.metadata
        );
      }

      return threats;
    } catch (error) {
      console.error("威胁检测分析失败:", error);
      await this.loggingService.error("威胁检测分析失败", error);
      return threats;
    }
  }

  /**
   * 检测认证相关威胁
   */
  private async detectAuthenticationThreats(
    userId: number,
    metadata: Record<string, any>,
    timestamp: Date
  ): Promise<ThreatIndicator[]> {
    const threats: ThreatIndicator[] = [];

    try {
      // 检查短时间内的认证失败次数
      const recentFailures = await this.prisma.securityEventLog.count({
        where: {
          userId,
          eventType: "login_failed",
          timestamp: {
            gte: new Date(timestamp.getTime() - 5 * 60 * 1000), // 5分钟内
          },
        },
      });

      if (recentFailures >= 5) {
        threats.push({
          id: `auth_failure_${Date.now()}`,
          type: "authentication",
          severity: "high",
          description: `检测到短时间内多次认证失败 (${recentFailures}次)`,
          metadata: { failureCount: recentFailures, timeWindow: "5分钟" },
          timestamp,
        });
      }

      // 检查异常登录时间
      const hour = timestamp.getHours();
      if (hour < 6 || hour > 22) {
        threats.push({
          id: `unusual_time_${Date.now()}`,
          type: "authentication",
          severity: "medium",
          description: `检测到非正常时间的登录尝试 (${hour}:00)`,
          metadata: { loginHour: hour, normalHours: "6:00-22:00" },
          timestamp,
        });
      }

      return threats;
    } catch (error) {
      console.error("认证威胁检测失败:", error);
      return threats;
    }
  }

  /**
   * 检测数据访问威胁
   */
  private async detectDataAccessThreats(
    userId: number,
    metadata: Record<string, any>,
    timestamp: Date
  ): Promise<ThreatIndicator[]> {
    const threats: ThreatIndicator[] = [];

    try {
      // 检查数据导出频率
      if (metadata.operation === "export") {
        const recentExports = await this.prisma.securityEventLog.count({
          where: {
            userId,
            eventType: "data_export",
            timestamp: {
              gte: new Date(timestamp.getTime() - 60 * 60 * 1000), // 1小时内
            },
          },
        });

        if (recentExports >= 10) {
          threats.push({
            id: `export_frequency_${Date.now()}`,
            type: "data_access",
            severity: "medium",
            description: `检测到异常频繁的数据导出操作 (${recentExports}次/小时)`,
            metadata: { exportCount: recentExports, timeWindow: "1小时" },
            timestamp,
          });
        }
      }

      // 检查敏感数据访问
      if (metadata.sensitiveData && metadata.dataType) {
        threats.push({
          id: `sensitive_access_${Date.now()}`,
          type: "data_access",
          severity: "low",
          description: `检测到敏感数据访问: ${metadata.dataType}`,
          metadata: {
            dataType: metadata.dataType,
            accessMethod: metadata.operation,
          },
          timestamp,
        });
      }

      return threats;
    } catch (error) {
      console.error("数据访问威胁检测失败:", error);
      return threats;
    }
  }

  /**
   * 检测系统操作威胁
   */
  private async detectSystemOperationThreats(
    userId: number,
    metadata: Record<string, any>,
    timestamp: Date
  ): Promise<ThreatIndicator[]> {
    const threats: ThreatIndicator[] = [];

    try {
      // 检查权限提升操作
      if (
        metadata.operation === "role_change" ||
        metadata.operation === "permission_grant"
      ) {
        threats.push({
          id: `privilege_change_${Date.now()}`,
          type: "system_operation",
          severity: "high",
          description: `检测到权限变更操作: ${metadata.operation}`,
          metadata: {
            operation: metadata.operation,
            targetUser: metadata.targetUser,
            newRole: metadata.newRole,
          },
          timestamp,
        });
      }

      // 检查系统配置变更
      if (metadata.operation === "config_change") {
        threats.push({
          id: `config_change_${Date.now()}`,
          type: "system_operation",
          severity: "medium",
          description: `检测到系统配置变更: ${metadata.configKey}`,
          metadata: {
            configKey: metadata.configKey,
            oldValue: metadata.oldValue,
            newValue: metadata.newValue,
          },
          timestamp,
        });
      }

      return threats;
    } catch (error) {
      console.error("系统操作威胁检测失败:", error);
      return threats;
    }
  }

  /**
   * 检测网络威胁
   */
  private async detectNetworkThreats(
    userId: number,
    ipAddress: string,
    timestamp: Date
  ): Promise<ThreatIndicator[]> {
    const threats: ThreatIndicator[] = [];

    try {
      // 检查IP地址异常
      if (ipAddress && ipAddress !== "unknown") {
        // 检查是否来自已知的可疑IP范围
        const suspiciousIPs = ["192.168.1.100", "10.0.0.50"]; // 示例可疑IP
        if (suspiciousIPs.includes(ipAddress)) {
          threats.push({
            id: `suspicious_ip_${Date.now()}`,
            type: "network",
            severity: "medium",
            description: `检测到来自可疑IP地址的访问: ${ipAddress}`,
            metadata: { ipAddress, riskLevel: "medium" },
            timestamp,
          });
        }

        // 检查IP地址变化频率
        const recentIPs = await this.prisma.securityEventLog.findMany({
          where: {
            userId,
            timestamp: {
              gte: new Date(timestamp.getTime() - 24 * 60 * 60 * 1000), // 24小时内
            },
          },
          select: { ipAddress: true },
          distinct: ["ipAddress"],
        });

        if (recentIPs.length > 3) {
          threats.push({
            id: `ip_hopping_${Date.now()}`,
            type: "network",
            severity: "low",
            description: `检测到用户IP地址频繁变化 (${recentIPs.length}个不同IP)`,
            metadata: { ipCount: recentIPs.length, timeWindow: "24小时" },
            timestamp,
          });
        }
      }

      return threats;
    } catch (error) {
      console.error("网络威胁检测失败:", error);
      return threats;
    }
  }

  /**
   * 更新用户威胁评分
   */
  private async updateThreatScore(
    userId: number,
    threats: ThreatIndicator[]
  ): Promise<void> {
    try {
      let currentScore = this.threatScores.get(userId)?.score || 0;
      let factors: string[] = this.threatScores.get(userId)?.factors || [];

      // 根据威胁严重程度调整评分
      for (const threat of threats) {
        switch (threat.severity) {
          case "critical":
            currentScore += 25;
            factors.push(`严重威胁: ${threat.description}`);
            break;
          case "high":
            currentScore += 15;
            factors.push(`高风险威胁: ${threat.description}`);
            break;
          case "medium":
            currentScore += 10;
            factors.push(`中等风险威胁: ${threat.description}`);
            break;
          case "low":
            currentScore += 5;
            factors.push(`低风险威胁: ${threat.description}`);
            break;
        }
      }

      // 评分衰减（每小时减少1分）
      const lastUpdate = this.threatScores.get(userId)?.lastUpdated;
      if (lastUpdate) {
        const hoursSinceUpdate =
          (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        currentScore = Math.max(0, currentScore - Math.floor(hoursSinceUpdate));
      }

      // 限制评分范围
      currentScore = Math.min(100, Math.max(0, currentScore));

      // 确定风险等级
      let level: ThreatScore["level"];
      if (currentScore >= 80) level = "critical";
      else if (currentScore >= 60) level = "high_risk";
      else if (currentScore >= 40) level = "medium_risk";
      else if (currentScore >= 20) level = "low_risk";
      else level = "safe";

      // 更新威胁评分
      this.threatScores.set(userId, {
        userId,
        score: currentScore,
        level,
        factors: factors.slice(-10), // 保留最近10个因素
        lastUpdated: new Date(),
      });

      // 记录威胁评分更新
      await this.loggingService.logSecurityEvent(
        "threat_score_updated",
        `用户威胁评分已更新: ${currentScore} (${level})`,
        LogLevel.INFO,
        userId,
        undefined,
        undefined,
        { score: currentScore, level, factorCount: factors.length }
      );
    } catch (error) {
      console.error("更新威胁评分失败:", error);
    }
  }

  /**
   * 获取用户威胁评分
   */
  getThreatScore(userId: number): ThreatScore | null {
    return this.threatScores.get(userId) || null;
  }

  /**
   * 获取所有威胁评分
   */
  getAllThreatScores(): ThreatScore[] {
    return Array.from(this.threatScores.values());
  }

  /**
   * 获取安全规则
   */
  getSecurityRules(): SecurityRule[] {
    return this.rules;
  }

  /**
   * 添加安全规则
   */
  addSecurityRule(rule: SecurityRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 更新安全规则
   */
  updateSecurityRule(ruleId: string, updates: Partial<SecurityRule>): boolean {
    const index = this.rules.findIndex((rule) => rule.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      this.rules.sort((a, b) => a.priority - b.priority);
      return true;
    }
    return false;
  }

  /**
   * 删除安全规则
   */
  deleteSecurityRule(ruleId: string): boolean {
    const index = this.rules.findIndex((rule) => rule.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 将威胁严重程度映射到日志级别
   */
  private mapSeverityToLogLevel(
    severity: ThreatIndicator["severity"]
  ): LogLevel {
    switch (severity) {
      case "critical":
        return LogLevel.CRITICAL;
      case "high":
        return LogLevel.ERROR;
      case "medium":
        return LogLevel.WARN;
      case "low":
        return LogLevel.INFO;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * 生成威胁报告
   */
  async generateThreatReport(
    startDate: Date,
    endDate: Date,
    userId?: number
  ): Promise<{
    summary: {
      totalThreats: number;
      criticalThreats: number;
      highThreats: number;
      mediumThreats: number;
      lowThreats: number;
    };
    topThreats: ThreatIndicator[];
    userRiskProfile: Array<{
      userId: number;
      username: string;
      threatScore: number;
      riskLevel: string;
      threatCount: number;
    }>;
  }> {
    try {
      // 获取时间范围内的威胁事件
      const whereClause: any = {
        eventType: "threat_detected",
        timestamp: { gte: startDate, lte: endDate },
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const threatEvents = await this.prisma.securityEventLog.findMany({
        where: whereClause,
        include: { user: { select: { username: true } } },
        orderBy: { timestamp: "desc" },
      });

      // 统计威胁严重程度
      const summary = {
        totalThreats: threatEvents.length,
        criticalThreats: 0,
        highThreats: 0,
        mediumThreats: 0,
        lowThreats: 0,
      };

      // 分析威胁事件
      const threatIndicators: ThreatIndicator[] = [];
      for (const event of threatEvents) {
        try {
          const metadata = JSON.parse(event.metadata || "{}");
          const severity = metadata.severity || "low";

          summary[`${severity}Threats` as keyof typeof summary]++;

          threatIndicators.push({
            id: `threat_${event.id}`,
            type: metadata.type || "system_operation",
            severity: severity as ThreatIndicator["severity"],
            description: event.description,
            metadata: metadata,
            timestamp: event.timestamp,
          });
        } catch (error) {
          console.error("解析威胁事件元数据失败:", error);
        }
      }

      // 获取用户风险画像
      const userRiskProfile = Array.from(this.threatScores.values()).map(
        (score) => ({
          userId: score.userId,
          username: "Unknown", // 这里可以进一步查询用户名
          threatScore: score.score,
          riskLevel: score.level,
          threatCount: score.factors.length,
        })
      );

      return {
        summary,
        topThreats: threatIndicators.slice(0, 10), // 前10个威胁
        userRiskProfile,
      };
    } catch (error) {
      console.error("生成威胁报告失败:", error);
      throw error;
    }
  }
}

export default ThreatDetectionService;
