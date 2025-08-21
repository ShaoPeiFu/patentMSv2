import { PrismaClient } from "@prisma/client";
import { LoggingService, LogLevel } from "./logging";

export interface AuditTrail {
  id: string;
  userId: number;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category:
    | "authentication"
    | "data_access"
    | "system_security"
    | "compliance"
    | "threats";
  timestamp: Date;
  trend: "increasing" | "decreasing" | "stable";
  threshold?: number;
  status: "normal" | "warning" | "critical";
}

export interface RiskAssessment {
  id: string;
  userId: number;
  username: string;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: Array<{
    factor: string;
    weight: number;
    score: number;
    description: string;
  }>;
  recommendations: string[];
  lastAssessment: Date;
  nextAssessment: Date;
}

export interface SecurityDashboard {
  overview: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    totalThreats: number;
    criticalThreats: number;
    complianceScore: number;
  };
  recentActivity: AuditTrail[];
  topRisks: RiskAssessment[];
  securityMetrics: SecurityMetric[];
  alerts: Array<{
    id: string;
    type: "threat" | "compliance" | "system" | "user";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    timestamp: Date;
    status: "new" | "acknowledged" | "resolved";
  }>;
}

export class SecurityAuditService {
  private prisma: PrismaClient;
  private loggingService: LoggingService;
  private auditTrails: AuditTrail[] = [];
  private securityMetrics: SecurityMetric[] = [];
  private riskAssessments: Map<number, RiskAssessment> = new Map();

  constructor(prisma: PrismaClient, loggingService: LoggingService) {
    this.prisma = prisma;
    this.loggingService = loggingService;
    console.log("🔍 安全审计服务已初始化");
  }

  /**
   * 记录审计事件
   */
  async recordAuditEvent(
    userId: number,
    action: string,
    resource: string,
    resourceId?: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // 获取用户名
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      // 评估风险等级
      const riskLevel = this.assessActionRisk(action, resource, details);

      const auditTrail: AuditTrail = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        username: user?.username || "Unknown",
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        riskLevel,
      };

      // 添加到内存中的审计跟踪
      this.auditTrails.push(auditTrail);

      // 保持最近1000条记录
      if (this.auditTrails.length > 1000) {
        this.auditTrails = this.auditTrails.slice(-1000);
      }

      // 记录到日志系统
      await this.loggingService.logSecurityEvent(
        "audit_event",
        `审计事件: ${action} on ${resource}`,
        this.mapRiskLevelToLogLevel(riskLevel),
        userId,
        ipAddress,
        userAgent,
        details
      );

      // 更新安全指标
      await this.updateSecurityMetrics(action, resource, riskLevel);

      // 更新用户风险评估
      await this.updateUserRiskAssessment(userId, action, resource, riskLevel);
    } catch (error) {
      console.error("记录审计事件失败:", error);
      await this.loggingService.error("记录审计事件失败", error);
    }
  }

  /**
   * 评估操作风险等级
   */
  private assessActionRisk(
    action: string,
    resource: string,
    details: Record<string, any>
  ): AuditTrail["riskLevel"] {
    let riskScore = 0;

    // 基于操作类型评估风险
    switch (action.toLowerCase()) {
      case "login":
        riskScore += 1;
        break;
      case "logout":
        riskScore += 0;
        break;
      case "create":
        riskScore += 3;
        break;
      case "update":
        riskScore += 2;
        break;
      case "delete":
        riskScore += 5;
        break;
      case "export":
        riskScore += 4;
        break;
      case "import":
        riskScore += 4;
        break;
      case "download":
        riskScore += 3;
        break;
      case "upload":
        riskScore += 4;
        break;
      default:
        riskScore += 1;
    }

    // 基于资源类型评估风险
    switch (resource.toLowerCase()) {
      case "user":
        riskScore += 2;
        break;
      case "patent":
        riskScore += 1;
        break;
      case "deadline":
        riskScore += 1;
        break;
      case "contract":
        riskScore += 3;
        break;
      case "backup":
        riskScore += 4;
        break;
      case "security":
        riskScore += 5;
        break;
      case "system":
        riskScore += 5;
        break;
      default:
        riskScore += 1;
    }

    // 基于详细信息评估风险
    if (details.sensitiveData) riskScore += 3;
    if (details.bulkOperation) riskScore += 2;
    if (details.privilegedAccess) riskScore += 4;
    if (details.externalAccess) riskScore += 3;

    // 确定风险等级
    if (riskScore >= 8) return "critical";
    if (riskScore >= 6) return "high";
    if (riskScore >= 4) return "medium";
    return "low";
  }

  /**
   * 更新安全指标
   */
  private async updateSecurityMetrics(
    action: string,
    resource: string,
    riskLevel: AuditTrail["riskLevel"]
  ): Promise<void> {
    try {
      const timestamp = new Date();
      const category = this.categorizeAction(action, resource);

      // 更新或创建指标
      const existingMetric = this.securityMetrics.find(
        (m) =>
          m.name === `${category}_${action}` &&
          m.timestamp.getDate() === timestamp.getDate()
      );

      if (existingMetric) {
        existingMetric.value++;

        // 更新趋势
        const previousValue = existingMetric.value - 1;
        if (existingMetric.value > previousValue) {
          existingMetric.trend = "increasing";
        } else if (existingMetric.value < previousValue) {
          existingMetric.trend = "decreasing";
        } else {
          existingMetric.trend = "stable";
        }

        // 更新状态
        if (existingMetric.threshold) {
          if (existingMetric.value >= existingMetric.threshold) {
            existingMetric.status = "critical";
          } else if (existingMetric.value >= existingMetric.threshold * 0.8) {
            existingMetric.status = "warning";
          } else {
            existingMetric.status = "normal";
          }
        }
      } else {
        const newMetric: SecurityMetric = {
          id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${category}_${action}`,
          value: 1,
          unit: "count",
          category,
          timestamp,
          trend: "stable",
          threshold: this.getDefaultThreshold(category, action),
          status: "normal",
        };

        this.securityMetrics.push(newMetric);
      }

      // 保持最近1000个指标
      if (this.securityMetrics.length > 1000) {
        this.securityMetrics = this.securityMetrics.slice(-1000);
      }
    } catch (error) {
      console.error("更新安全指标失败:", error);
    }
  }

  /**
   * 分类操作
   */
  private categorizeAction(
    action: string,
    resource: string
  ): SecurityMetric["category"] {
    if (["login", "logout", "password_change"].includes(action)) {
      return "authentication";
    } else if (
      ["create", "read", "update", "delete", "export", "import"].includes(
        action
      )
    ) {
      return "data_access";
    } else if (["backup", "restore", "config_change"].includes(action)) {
      return "system_security";
    } else if (["compliance_check", "audit"].includes(action)) {
      return "compliance";
    } else if (["threat_detected", "blocked"].includes(action)) {
      return "threats";
    } else {
      return "data_access";
    }
  }

  /**
   * 获取默认阈值
   */
  private getDefaultThreshold(
    category: SecurityMetric["category"],
    action: string
  ): number {
    switch (category) {
      case "authentication":
        return action === "login_failed" ? 5 : 100;
      case "data_access":
        return action === "export" ? 10 : 50;
      case "system_security":
        return 20;
      case "compliance":
        return 5;
      case "threats":
        return 3;
      default:
        return 50;
    }
  }

  /**
   * 更新用户风险评估
   */
  private async updateUserRiskAssessment(
    userId: number,
    action: string,
    resource: string,
    riskLevel: AuditTrail["riskLevel"]
  ): Promise<void> {
    try {
      let assessment = this.riskAssessments.get(userId);

      if (!assessment) {
        assessment = {
          id: `risk_${userId}_${Date.now()}`,
          userId,
          username: "Unknown",
          riskScore: 0,
          riskLevel: "low",
          factors: [],
          recommendations: [],
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
        };
      }

      // 更新风险评分
      let riskScore = assessment.riskScore;

      switch (riskLevel) {
        case "critical":
          riskScore += 10;
          break;
        case "high":
          riskScore += 7;
          break;
        case "medium":
          riskScore += 4;
          break;
        case "low":
          riskScore += 1;
          break;
      }

      // 风险评分衰减（每小时减少1分）
      const hoursSinceLastAssessment =
        (Date.now() - assessment.lastAssessment.getTime()) / (1000 * 60 * 60);
      riskScore = Math.max(0, riskScore - Math.floor(hoursSinceLastAssessment));

      // 限制评分范围
      riskScore = Math.min(100, Math.max(0, riskScore));

      // 确定风险等级
      let newRiskLevel: RiskAssessment["riskLevel"];
      if (riskScore >= 80) newRiskLevel = "critical";
      else if (riskScore >= 60) newRiskLevel = "high";
      else if (riskScore >= 40) newRiskLevel = "medium";
      else newRiskLevel = "low";

      // 更新因素
      const factor = {
        factor: `${action} on ${resource}`,
        weight: this.getRiskWeight(riskLevel),
        score: this.getRiskScore(riskLevel),
        description: `用户执行了${action}操作，涉及${resource}资源`,
      };

      assessment.factors.push(factor);
      assessment.factors = assessment.factors.slice(-10); // 保留最近10个因素

      // 更新风险评估
      assessment.riskScore = riskScore;
      assessment.riskLevel = newRiskLevel;
      assessment.lastAssessment = new Date();
      assessment.nextAssessment = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // 生成建议
      assessment.recommendations = this.generateRiskRecommendations(assessment);

      // 保存风险评估
      this.riskAssessments.set(userId, assessment);
    } catch (error) {
      console.error("更新用户风险评估失败:", error);
    }
  }

  /**
   * 获取风险权重
   */
  private getRiskWeight(riskLevel: AuditTrail["riskLevel"]): number {
    switch (riskLevel) {
      case "critical":
        return 1.0;
      case "high":
        return 0.8;
      case "medium":
        return 0.6;
      case "low":
        return 0.3;
      default:
        return 0.5;
    }
  }

  /**
   * 获取风险评分
   */
  private getRiskScore(riskLevel: AuditTrail["riskLevel"]): number {
    switch (riskLevel) {
      case "critical":
        return 10;
      case "high":
        return 7;
      case "medium":
        return 4;
      case "low":
        return 1;
      default:
        return 1;
    }
  }

  /**
   * 生成风险建议
   */
  private generateRiskRecommendations(assessment: RiskAssessment): string[] {
    const recommendations: string[] = [];

    if (assessment.riskLevel === "critical") {
      recommendations.push("立即暂停用户账户");
      recommendations.push("进行安全调查");
      recommendations.push("通知安全团队");
    } else if (assessment.riskLevel === "high") {
      recommendations.push("增加用户监控");
      recommendations.push("限制敏感操作权限");
      recommendations.push("要求额外身份验证");
    } else if (assessment.riskLevel === "medium") {
      recommendations.push("定期审查用户活动");
      recommendations.push("加强访问控制");
    } else {
      recommendations.push("继续监控用户活动");
    }

    return recommendations;
  }

  /**
   * 获取审计跟踪
   */
  getAuditTrails(
    userId?: number,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): AuditTrail[] {
    let filteredTrails = this.auditTrails;

    if (userId) {
      filteredTrails = filteredTrails.filter(
        (trail) => trail.userId === userId
      );
    }

    if (startDate) {
      filteredTrails = filteredTrails.filter(
        (trail) => trail.timestamp >= startDate
      );
    }

    if (endDate) {
      filteredTrails = filteredTrails.filter(
        (trail) => trail.timestamp <= endDate
      );
    }

    return filteredTrails
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 获取安全指标
   */
  getSecurityMetrics(
    category?: SecurityMetric["category"],
    startDate?: Date,
    endDate?: Date
  ): SecurityMetric[] {
    let filteredMetrics = this.securityMetrics;

    if (category) {
      filteredMetrics = filteredMetrics.filter(
        (metric) => metric.category === category
      );
    }

    if (startDate) {
      filteredMetrics = filteredMetrics.filter(
        (metric) => metric.timestamp >= startDate
      );
    }

    if (endDate) {
      filteredMetrics = filteredMetrics.filter(
        (metric) => metric.timestamp <= endDate
      );
    }

    return filteredMetrics.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * 获取用户风险评估
   */
  getUserRiskAssessment(userId: number): RiskAssessment | null {
    return this.riskAssessments.get(userId) || null;
  }

  /**
   * 获取所有风险评估
   */
  getAllRiskAssessments(): RiskAssessment[] {
    return Array.from(this.riskAssessments.values());
  }

  /**
   * 生成安全仪表板
   */
  async generateSecurityDashboard(): Promise<SecurityDashboard> {
    try {
      // 获取用户统计
      const totalUsers = await this.prisma.user.count();
      const activeUsers = await this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天内
          },
        },
      });

      // 获取威胁统计
      const totalThreats = await this.prisma.securityEventLog.count({
        where: { eventType: "threat_detected" },
      });
      const criticalThreats = await this.prisma.securityEventLog.count({
        where: {
          eventType: "threat_detected",
          severity: "critical",
        },
      });

      // 获取合规评分（这里简化处理，实际应该调用合规服务）
      const complianceScore = 85; // 示例值

      // 获取最近活动
      const recentActivity = this.getAuditTrails(
        undefined,
        undefined,
        undefined,
        20
      );

      // 获取高风险用户
      const topRisks = this.getAllRiskAssessments()
        .filter(
          (assessment) =>
            assessment.riskLevel === "high" ||
            assessment.riskLevel === "critical"
        )
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      // 获取安全指标
      const securityMetrics = this.getSecurityMetrics(
        undefined,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
      );

      // 生成警报
      const alerts = this.generateSecurityAlerts();

      return {
        overview: {
          totalUsers,
          activeUsers,
          blockedUsers: 0, // 这里可以扩展实现
          totalThreats,
          criticalThreats,
          complianceScore,
        },
        recentActivity,
        topRisks,
        securityMetrics,
        alerts,
      };
    } catch (error) {
      console.error("生成安全仪表板失败:", error);
      throw error;
    }
  }

  /**
   * 生成安全警报
   */
  private generateSecurityAlerts(): SecurityDashboard["alerts"] {
    const alerts: SecurityDashboard["alerts"] = [];

    // 检查高风险用户
    const highRiskUsers = this.getAllRiskAssessments().filter(
      (assessment) =>
        assessment.riskLevel === "high" || assessment.riskLevel === "critical"
    );

    highRiskUsers.forEach((assessment) => {
      alerts.push({
        id: `alert_risk_${assessment.userId}`,
        type: "user",
        severity: assessment.riskLevel === "critical" ? "critical" : "high",
        message: `用户 ${assessment.username} 风险等级: ${assessment.riskLevel}`,
        timestamp: new Date(),
        status: "new",
      });
    });

    // 检查异常指标
    const criticalMetrics = this.securityMetrics.filter(
      (metric) => metric.status === "critical"
    );
    criticalMetrics.forEach((metric) => {
      alerts.push({
        id: `alert_metric_${metric.id}`,
        type: "system",
        severity: "high",
        message: `安全指标异常: ${metric.name} = ${metric.value} ${metric.unit}`,
        timestamp: new Date(),
        status: "new",
      });
    });

    return alerts.slice(0, 20); // 最多20个警报
  }

  /**
   * 将风险等级映射到日志级别
   */
  private mapRiskLevelToLogLevel(riskLevel: AuditTrail["riskLevel"]): LogLevel {
    switch (riskLevel) {
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
   * 清理过期数据
   */
  cleanupOldData(maxAge: number = 90): void {
    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);

    // 清理审计跟踪
    this.auditTrails = this.auditTrails.filter(
      (trail) => trail.timestamp >= cutoffDate
    );

    // 清理安全指标
    this.securityMetrics = this.securityMetrics.filter(
      (metric) => metric.timestamp >= cutoffDate
    );

    console.log(`🧹 清理了 ${maxAge} 天前的审计数据`);
  }
}

export default SecurityAuditService;
