import { PrismaClient } from "@prisma/client";
import { LoggingService, LogLevel } from "./logging";

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulation: "GDPR" | "CCPA" | "SOX" | "HIPAA" | "ISO27001" | "CUSTOM";
  category:
    | "data_protection"
    | "access_control"
    | "audit_trail"
    | "encryption"
    | "retention";
  requirements: string[];
  checkInterval: "realtime" | "hourly" | "daily" | "weekly" | "monthly";
  enabled: boolean;
  priority: number;
}

export interface ComplianceCheck {
  id: string;
  ruleId: string;
  status: "pass" | "fail" | "warning" | "pending";
  details: string;
  violations: string[];
  recommendations: string[];
  timestamp: Date;
  nextCheck: Date;
}

export interface ComplianceReport {
  id: string;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  startDate: Date;
  endDate: Date;
  overallScore: number; // 0-100
  complianceLevel: "compliant" | "partially_compliant" | "non_compliant";
  summary: {
    totalRules: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    pendingChecks: number;
  };
  ruleResults: Array<{
    ruleId: string;
    ruleName: string;
    regulation: string;
    status: string;
    violations: string[];
    recommendations: string[];
  }>;
  generatedAt: Date;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: number; // 天数
  retentionUnit: "days" | "months" | "years";
  disposalMethod: "delete" | "archive" | "anonymize";
  legalBasis: string;
  enabled: boolean;
}

export class ComplianceService {
  private prisma: PrismaClient;
  private loggingService: LoggingService;
  private rules: ComplianceRule[] = [];
  private retentionPolicies: DataRetentionPolicy[] = [];

  constructor(prisma: PrismaClient, loggingService: LoggingService) {
    this.prisma = prisma;
    this.loggingService = loggingService;
    this.initializeDefaultRules();
    this.initializeRetentionPolicies();
    console.log("📋 合规性检查服务已初始化");
  }

  /**
   * 初始化默认合规规则
   */
  private initializeDefaultRules() {
    this.rules = [
      // GDPR 相关规则
      {
        id: "gdpr_data_minimization",
        name: "数据最小化原则",
        description: "确保只收集和处理必要的数据",
        regulation: "GDPR",
        category: "data_protection",
        requirements: ["数据收集目的明确", "数据量最小化", "数据保留期限合理"],
        checkInterval: "daily",
        enabled: true,
        priority: 1,
      },
      {
        id: "gdpr_consent_management",
        name: "同意管理",
        description: "确保用户同意记录完整且有效",
        regulation: "GDPR",
        category: "data_protection",
        requirements: ["明确同意记录", "同意时间戳", "同意撤销机制"],
        checkInterval: "realtime",
        enabled: true,
        priority: 2,
      },
      {
        id: "gdpr_right_to_access",
        name: "访问权",
        description: "确保用户能够访问自己的数据",
        regulation: "GDPR",
        category: "access_control",
        requirements: ["数据访问接口", "数据导出功能", "访问日志记录"],
        checkInterval: "weekly",
        enabled: true,
        priority: 3,
      },

      // 数据安全规则
      {
        id: "encryption_requirement",
        name: "数据加密要求",
        description: "敏感数据必须加密存储和传输",
        regulation: "ISO27001",
        category: "encryption",
        requirements: ["静态数据加密", "传输数据加密", "密钥管理"],
        checkInterval: "daily",
        enabled: true,
        priority: 4,
      },
      {
        id: "access_logging",
        name: "访问日志记录",
        description: "所有数据访问必须记录日志",
        regulation: "SOX",
        category: "audit_trail",
        requirements: [
          "访问时间记录",
          "用户身份记录",
          "操作类型记录",
          "数据范围记录",
        ],
        checkInterval: "realtime",
        enabled: true,
        priority: 5,
      },
      {
        id: "data_retention",
        name: "数据保留策略",
        description: "数据保留必须符合法规要求",
        regulation: "CUSTOM",
        category: "retention",
        requirements: ["保留期限合规", "过期数据清理", "保留策略文档"],
        checkInterval: "weekly",
        enabled: true,
        priority: 6,
      },
    ];
  }

  /**
   * 初始化数据保留策略
   */
  private initializeRetentionPolicies() {
    this.retentionPolicies = [
      {
        id: "user_data_retention",
        dataType: "user_profile",
        retentionPeriod: 7,
        retentionUnit: "years",
        disposalMethod: "anonymize",
        legalBasis: "GDPR Article 5(1)(e)",
        enabled: true,
      },
      {
        id: "audit_log_retention",
        dataType: "audit_logs",
        retentionPeriod: 2,
        retentionUnit: "years",
        disposalMethod: "archive",
        legalBasis: "SOX Section 103",
        enabled: true,
      },
      {
        id: "backup_data_retention",
        dataType: "backup_files",
        retentionPeriod: 1,
        retentionUnit: "years",
        disposalMethod: "delete",
        legalBasis: "Business Continuity",
        enabled: true,
      },
    ];
  }

  /**
   * 执行合规性检查
   */
  async performComplianceCheck(ruleId?: string): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    const timestamp = new Date();

    try {
      const rulesToCheck = ruleId
        ? this.rules.filter((rule) => rule.id === ruleId)
        : this.rules.filter((rule) => rule.enabled);

      for (const rule of rulesToCheck) {
        const check = await this.checkComplianceRule(rule, timestamp);
        checks.push(check);

        // 记录合规检查结果
        await this.loggingService.logSecurityEvent(
          "compliance_check",
          `合规性检查完成: ${rule.name} - ${check.status}`,
          check.status === "pass" ? LogLevel.INFO : LogLevel.WARN,
          1, // 系统用户ID
          undefined,
          undefined,
          {
            ruleId: rule.id,
            status: check.status,
            violations: check.violations,
          }
        );
      }

      return checks;
    } catch (error) {
      console.error("执行合规性检查失败:", error);
      await this.loggingService.error("执行合规性检查失败", error);
      return checks;
    }
  }

  /**
   * 检查单个合规规则
   */
  private async checkComplianceRule(
    rule: ComplianceRule,
    timestamp: Date
  ): Promise<ComplianceCheck> {
    const check: ComplianceCheck = {
      id: `check_${rule.id}_${Date.now()}`,
      ruleId: rule.id,
      status: "pending",
      details: "",
      violations: [],
      recommendations: [],
      timestamp,
      nextCheck: this.calculateNextCheck(rule.checkInterval, timestamp),
    };

    try {
      switch (rule.id) {
        case "gdpr_data_minimization":
          await this.checkDataMinimization(rule, check);
          break;
        case "gdpr_consent_management":
          await this.checkConsentManagement(rule, check);
          break;
        case "gdpr_right_to_access":
          await this.checkRightToAccess(rule, check);
          break;
        case "encryption_requirement":
          await this.checkEncryptionRequirement(rule, check);
          break;
        case "access_logging":
          await this.checkAccessLogging(rule, check);
          break;
        case "data_retention":
          await this.checkDataRetention(rule, check);
          break;
        default:
          check.status = "warning";
          check.details = "未知的合规规则";
          check.recommendations.push("请检查规则配置");
      }
    } catch (error) {
      check.status = "fail";
      check.details = `检查过程中发生错误: ${
        error instanceof Error ? error.message : "未知错误"
      }`;
      check.violations.push("系统错误");
      check.recommendations.push("请联系系统管理员");
    }

    return check;
  }

  /**
   * 检查数据最小化原则
   */
  private async checkDataMinimization(
    rule: ComplianceRule,
    check: ComplianceCheck
  ): Promise<void> {
    try {
      // 检查用户表是否包含不必要的字段
      const userFields = (await this.prisma.$queryRaw`
        PRAGMA table_info(users)
      `) as any[];

      const unnecessaryFields = userFields
        .filter((field) => ["fakeName", "testField"].includes(field.name))
        .map((field) => field.name);

      if (unnecessaryFields.length > 0) {
        check.status = "fail";
        check.violations.push(
          `发现不必要的用户字段: ${unnecessaryFields.join(", ")}`
        );
        check.recommendations.push("移除不必要的用户字段");
        check.recommendations.push("审查数据收集的必要性");
      } else {
        check.status = "pass";
        check.details = "用户数据字段符合最小化原则";
      }
    } catch (error) {
      throw new Error(
        `数据最小化检查失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  }

  /**
   * 检查同意管理
   */
  private async checkConsentManagement(
    rule: ComplianceRule,
    check: ComplianceCheck
  ): Promise<void> {
    try {
      // 检查是否有同意管理相关的表结构
      const consentTableExists = (await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='user_consents'
      `) as any[];

      if (consentTableExists.length === 0) {
        check.status = "fail";
        check.violations.push("缺少用户同意管理表");
        check.recommendations.push("创建用户同意管理表");
        check.recommendations.push("实现同意记录和撤销机制");
      } else {
        // 检查同意记录是否完整
        const consentCount = (await this.prisma.$queryRaw`
          SELECT COUNT(*) as count FROM user_consents
        `) as any[];

        if (consentCount[0].count === 0) {
          check.status = "warning";
          check.violations.push("同意管理表为空");
          check.recommendations.push("开始记录用户同意");
        } else {
          check.status = "pass";
          check.details = "同意管理系统正常运行";
        }
      }
    } catch (error) {
      throw new Error(
        `同意管理检查失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  }

  /**
   * 检查访问权
   */
  private async checkRightToAccess(
    rule: ComplianceRule,
    check: ComplianceCheck
  ): Promise<void> {
    try {
      // 检查是否有数据导出功能
      const hasExportAPI = (await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='data_exports'
      `) as any[];

      if (hasExportAPI.length === 0) {
        check.status = "fail";
        check.violations.push("缺少数据导出功能");
        check.recommendations.push("实现数据导出API");
        check.recommendations.push("创建数据导出记录表");
      } else {
        check.status = "pass";
        check.details = "数据导出功能已实现";
      }
    } catch (error) {
      throw new Error(
        `访问权检查失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 检查加密要求
   */
  private async checkEncryptionRequirement(
    rule: ComplianceRule,
    check: ComplianceCheck
  ): Promise<void> {
    try {
      // 检查敏感数据是否加密
      const sensitiveFields = (await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='security_settings'
      `) as any[];

      if (sensitiveFields.length === 0) {
        check.status = "fail";
        check.violations.push("缺少安全设置表");
        check.recommendations.push("创建安全设置表");
        check.recommendations.push("实现数据加密功能");
      } else {
        // 检查加密配置
        const encryptionSettings = await this.prisma.securitySettings.findFirst(
          {
            where: { category: "encryption" },
          }
        );

        if (!encryptionSettings) {
          check.status = "warning";
          check.violations.push("缺少加密配置");
          check.recommendations.push("配置数据加密设置");
        } else {
          check.status = "pass";
          check.details = "数据加密配置完整";
        }
      }
    } catch (error) {
      throw new Error(
        `加密要求检查失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  }

  /**
   * 检查访问日志记录
   */
  private async checkAccessLogging(
    rule: ComplianceRule,
    check: ComplianceCheck
  ): Promise<void> {
    try {
      // 检查安全事件日志表
      const logTableExists = (await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='security_event_logs'
      `) as any[];

      if (logTableExists.length === 0) {
        check.status = "fail";
        check.violations.push("缺少安全事件日志表");
        check.recommendations.push("创建安全事件日志表");
        check.recommendations.push("实现访问日志记录");
      } else {
        // 检查日志记录是否完整
        const logCount = await this.prisma.securityEventLog.count();

        if (logCount === 0) {
          check.status = "warning";
          check.violations.push("安全事件日志为空");
          check.recommendations.push("开始记录安全事件");
        } else {
          check.status = "pass";
          check.details = `安全事件日志记录正常，共${logCount}条记录`;
        }
      }
    } catch (error) {
      throw new Error(
        `访问日志检查失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  }

  /**
   * 检查数据保留策略
   */
  private async checkDataRetention(
    rule: ComplianceRule,
    check: ComplianceCheck
  ): Promise<void> {
    try {
      // 检查备份记录表
      const backupTableExists = (await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name='backup_records'
      `) as any[];

      if (backupTableExists.length === 0) {
        check.status = "fail";
        check.violations.push("缺少备份记录表");
        check.recommendations.push("创建备份记录表");
        check.recommendations.push("实现数据保留策略");
      } else {
        // 检查备份记录
        const backupCount = await this.prisma.backupRecord.count();

        if (backupCount === 0) {
          check.status = "warning";
          check.violations.push("备份记录为空");
          check.recommendations.push("开始执行数据备份");
        } else {
          // 检查是否有过期的备份需要清理
          const expiredBackups = await this.prisma.backupRecord.findMany({
            where: {
              startedAt: {
                lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1年前
              },
            },
          });

          if (expiredBackups.length > 0) {
            check.status = "warning";
            check.violations.push(
              `发现${expiredBackups.length}个过期备份需要清理`
            );
            check.recommendations.push("清理过期备份数据");
            check.recommendations.push("检查数据保留策略");
          } else {
            check.status = "pass";
            check.details = `数据保留策略执行正常，共${backupCount}个备份`;
          }
        }
      }
    } catch (error) {
      throw new Error(
        `数据保留检查失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
    }
  }

  /**
   * 计算下次检查时间
   */
  private calculateNextCheck(interval: string, currentTime: Date): Date {
    const nextCheck = new Date(currentTime);

    switch (interval) {
      case "realtime":
        nextCheck.setMinutes(nextCheck.getMinutes() + 5); // 5分钟后
        break;
      case "hourly":
        nextCheck.setHours(nextCheck.getHours() + 1);
        break;
      case "daily":
        nextCheck.setDate(nextCheck.getDate() + 1);
        break;
      case "weekly":
        nextCheck.setDate(nextCheck.getDate() + 7);
        break;
      case "monthly":
        nextCheck.setMonth(nextCheck.getMonth() + 1);
        break;
      default:
        nextCheck.setDate(nextCheck.getDate() + 1);
    }

    return nextCheck;
  }

  /**
   * 生成合规报告
   */
  async generateComplianceReport(
    period: ComplianceReport["period"],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    try {
      // 执行合规性检查
      const checks = await this.performComplianceCheck();

      // 计算总体评分
      const totalChecks = checks.length;
      const passedChecks = checks.filter(
        (check) => check.status === "pass"
      ).length;
      const failedChecks = checks.filter(
        (check) => check.status === "fail"
      ).length;
      const warningChecks = checks.filter(
        (check) => check.status === "warning"
      ).length;
      const pendingChecks = checks.filter(
        (check) => check.status === "pending"
      ).length;

      const overallScore = Math.round((passedChecks / totalChecks) * 100);

      // 确定合规级别
      let complianceLevel: ComplianceReport["complianceLevel"];
      if (overallScore >= 90) complianceLevel = "compliant";
      else if (overallScore >= 70) complianceLevel = "partially_compliant";
      else complianceLevel = "non_compliant";

      // 构建规则结果
      const ruleResults = checks.map((check) => {
        const rule = this.rules.find((r) => r.id === check.ruleId);
        return {
          ruleId: check.ruleId,
          ruleName: rule?.name || "未知规则",
          regulation: rule?.regulation || "UNKNOWN",
          status: check.status,
          violations: check.violations,
          recommendations: check.recommendations,
        };
      });

      const report: ComplianceReport = {
        id: `report_${period}_${Date.now()}`,
        period,
        startDate,
        endDate,
        overallScore,
        complianceLevel,
        summary: {
          totalRules: totalChecks,
          passedChecks,
          failedChecks,
          warningChecks,
          pendingChecks,
        },
        ruleResults,
        generatedAt: new Date(),
      };

      // 记录报告生成事件
      await this.loggingService.logSecurityEvent(
        "compliance_report_generated",
        `合规性报告已生成: ${period} - 评分: ${overallScore} (${complianceLevel})`,
        LogLevel.INFO,
        1, // 系统用户ID
        undefined,
        undefined,
        { period, overallScore, complianceLevel, totalChecks }
      );

      return report;
    } catch (error) {
      console.error("生成合规性报告失败:", error);
      throw error;
    }
  }

  /**
   * 获取合规规则
   */
  getComplianceRules(): ComplianceRule[] {
    return this.rules;
  }

  /**
   * 添加合规规则
   */
  addComplianceRule(rule: ComplianceRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 更新合规规则
   */
  updateComplianceRule(
    ruleId: string,
    updates: Partial<ComplianceRule>
  ): boolean {
    const index = this.rules.findIndex((rule) => rule.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      this.rules.sort((a, b) => a.priority - b.priority);
      return true;
    }
    return false;
  }

  /**
   * 删除合规规则
   */
  deleteComplianceRule(ruleId: string): boolean {
    const index = this.rules.findIndex((rule) => rule.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取数据保留策略
   */
  getRetentionPolicies(): DataRetentionPolicy[] {
    return this.retentionPolicies;
  }

  /**
   * 添加数据保留策略
   */
  addRetentionPolicy(policy: DataRetentionPolicy): void {
    this.retentionPolicies.push(policy);
  }

  /**
   * 更新数据保留策略
   */
  updateRetentionPolicy(
    policyId: string,
    updates: Partial<DataRetentionPolicy>
  ): boolean {
    const index = this.retentionPolicies.findIndex(
      (policy) => policy.id === policyId
    );
    if (index !== -1) {
      this.retentionPolicies[index] = {
        ...this.retentionPolicies[index],
        ...updates,
      };
      return true;
    }
    return false;
  }

  /**
   * 删除数据保留策略
   */
  deleteRetentionPolicy(policyId: string): boolean {
    const index = this.retentionPolicies.findIndex(
      (policy) => policy.id === policyId
    );
    if (index !== -1) {
      this.retentionPolicies.splice(index, 1);
      return true;
    }
    return false;
  }
}

export default ComplianceService;
