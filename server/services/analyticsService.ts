import { PrismaClient } from "@prisma/client";

export interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  successRate: number;
}

export interface StepMetrics {
  stepNumber: number;
  stepName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
}

export interface UserMetrics {
  userId: number;
  username: string;
  realName: string;
  totalWorkflowsStarted: number;
  totalWorkflowsCompleted: number;
  averageExecutionTime: number;
  successRate: number;
}

export interface TimeSeriesData {
  date: string;
  workflowsStarted: number;
  workflowsCompleted: number;
  workflowsFailed: number;
  averageExecutionTime: number;
}

export interface WorkflowPerformanceReport {
  summary: WorkflowMetrics;
  stepAnalysis: StepMetrics[];
  userPerformance: UserMetrics[];
  timeSeries: TimeSeriesData[];
  recommendations: string[];
}

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 生成工作流性能报告
   */
  async generateWorkflowPerformanceReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<WorkflowPerformanceReport> {
    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      const [summary, stepAnalysis, userPerformance, timeSeries] =
        await Promise.all([
          this.getWorkflowSummary(dateFilter),
          this.getStepAnalysis(dateFilter),
          this.getUserPerformance(dateFilter),
          this.getTimeSeriesData(dateFilter),
        ]);

      const recommendations = this.generateRecommendations(
        summary,
        stepAnalysis,
        userPerformance
      );

      return {
        summary,
        stepAnalysis,
        userPerformance,
        timeSeries,
        recommendations,
      };
    } catch (error) {
      console.error("生成工作流性能报告失败:", error);
      throw error;
    }
  }

  /**
   * 获取工作流汇总指标
   */
  private async getWorkflowSummary(dateFilter: any): Promise<WorkflowMetrics> {
    const [
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
      failedWorkflows,
      executionTimeData,
    ] = await Promise.all([
      this.prisma.approvalProcess.count({ where: dateFilter }),
      this.prisma.approvalProcess.count({
        where: { ...dateFilter, status: "pending" },
      }),
      this.prisma.approvalProcess.count({
        where: { ...dateFilter, status: "completed" },
      }),
      this.prisma.approvalProcess.count({
        where: { ...dateFilter, status: "failed" },
      }),
      this.prisma.approvalProcess.findMany({
        where: { ...dateFilter, completedAt: { not: null } },
        select: {
          startedAt: true,
          completedAt: true,
        },
      }),
    ]);

    const averageExecutionTime =
      executionTimeData.length > 0
        ? executionTimeData.reduce((total, process) => {
            const duration =
              process.completedAt!.getTime() - process.startedAt.getTime();
            return total + duration;
          }, 0) /
          executionTimeData.length /
          (1000 * 60 * 60) // 转换为小时
        : 0;

    const successRate =
      totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
      failedWorkflows,
      averageExecutionTime,
      successRate,
    };
  }

  /**
   * 获取步骤分析数据
   */
  private async getStepAnalysis(dateFilter: any): Promise<StepMetrics[]> {
    const processes = await this.prisma.approvalProcess.findMany({
      where: dateFilter,
      include: {
        workflow: true,
      },
    });

    const stepMetricsMap = new Map<number, StepMetrics>();

    for (const process of processes) {
      try {
        const metadata = JSON.parse(process.metadata || "{}");
        const executionHistory = metadata.executionHistory || [];

        for (const execution of executionHistory) {
          const stepNumber = execution.stepNumber;
          const existing = stepMetricsMap.get(stepNumber);

          if (existing) {
            existing.totalExecutions++;
            if (execution.status === "completed") {
              existing.successfulExecutions++;
            } else if (execution.status === "failed") {
              existing.failedExecutions++;
            }

            if (execution.duration) {
              existing.averageExecutionTime =
                (existing.averageExecutionTime + execution.duration) / 2;
            }
          } else {
            stepMetricsMap.set(stepNumber, {
              stepNumber,
              stepName: execution.stepName || `步骤 ${stepNumber}`,
              totalExecutions: 1,
              successfulExecutions: execution.status === "completed" ? 1 : 0,
              failedExecutions: execution.status === "failed" ? 1 : 0,
              averageExecutionTime: execution.duration || 0,
              successRate: execution.status === "completed" ? 100 : 0,
            });
          }
        }
      } catch (error) {
        console.warn(`解析流程 ${process.id} 元数据失败:`, error);
      }
    }

    // 计算成功率
    for (const metrics of stepMetricsMap.values()) {
      metrics.successRate =
        (metrics.successfulExecutions / metrics.totalExecutions) * 100;
    }

    return Array.from(stepMetricsMap.values()).sort(
      (a, b) => a.stepNumber - b.stepNumber
    );
  }

  /**
   * 获取用户性能数据
   */
  private async getUserPerformance(dateFilter: any): Promise<UserMetrics[]> {
    const processes = await this.prisma.approvalProcess.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    const userMetricsMap = new Map<number, UserMetrics>();

    for (const process of processes) {
      const userId = process.startedBy;
      const existing = userMetricsMap.get(userId);

      if (existing) {
        existing.totalWorkflowsStarted++;
        if (process.status === "completed") {
          existing.totalWorkflowsCompleted++;
        }

        if (process.completedAt) {
          const duration =
            process.completedAt.getTime() - process.startedAt.getTime();
          existing.averageExecutionTime =
            (existing.averageExecutionTime + duration) / 2;
        }
      } else {
        const user = process.user;
        userMetricsMap.set(userId, {
          userId,
          username: user?.username || `用户${userId}`,
          realName: user?.realName || `用户${userId}`,
          totalWorkflowsStarted: 1,
          totalWorkflowsCompleted: process.status === "completed" ? 1 : 0,
          averageExecutionTime: process.completedAt
            ? process.completedAt.getTime() - process.startedAt.getTime()
            : 0,
          successRate: 0,
        });
      }
    }

    // 计算成功率
    for (const metrics of userMetricsMap.values()) {
      metrics.successRate =
        (metrics.totalWorkflowsCompleted / metrics.totalWorkflowsStarted) * 100;
      metrics.averageExecutionTime =
        metrics.averageExecutionTime / (1000 * 60 * 60); // 转换为小时
    }

    return Array.from(userMetricsMap.values()).sort(
      (a, b) => b.successRate - a.successRate
    );
  }

  /**
   * 获取时间序列数据
   */
  private async getTimeSeriesData(dateFilter: any): Promise<TimeSeriesData[]> {
    const processes = await this.prisma.approvalProcess.findMany({
      where: dateFilter,
      select: {
        startedAt: true,
        completedAt: true,
        status: true,
      },
      orderBy: { startedAt: "asc" },
    });

    const dateMap = new Map<string, TimeSeriesData>();

    for (const process of processes) {
      const date = process.startedAt.toISOString().split("T")[0];
      const existing = dateMap.get(date);

      if (existing) {
        existing.workflowsStarted++;
        if (process.status === "completed") {
          existing.workflowsCompleted++;
        } else if (process.status === "failed") {
          existing.workflowsFailed++;
        }

        if (process.completedAt) {
          const duration =
            process.completedAt.getTime() - process.startedAt.getTime();
          existing.averageExecutionTime =
            (existing.averageExecutionTime + duration) / 2;
        }
      } else {
        dateMap.set(date, {
          date,
          workflowsStarted: 1,
          workflowsCompleted: process.status === "completed" ? 1 : 0,
          workflowsFailed: process.status === "failed" ? 1 : 0,
          averageExecutionTime: process.completedAt
            ? process.completedAt.getTime() - process.startedAt.getTime()
            : 0,
        });
      }
    }

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((data) => ({
        ...data,
        averageExecutionTime: data.averageExecutionTime / (1000 * 60 * 60), // 转换为小时
      }));
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(
    summary: WorkflowMetrics,
    stepAnalysis: StepMetrics[],
    userPerformance: UserMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    // 基于成功率的建议
    if (summary.successRate < 80) {
      recommendations.push("工作流成功率较低，建议检查失败原因并优化流程设计");
    }

    // 基于执行时间的建议
    if (summary.averageExecutionTime > 24) {
      recommendations.push(
        "工作流平均执行时间较长，建议优化审批流程或增加并行处理"
      );
    }

    // 基于步骤分析的建议
    const problematicSteps = stepAnalysis.filter(
      (step) => step.successRate < 90
    );
    if (problematicSteps.length > 0) {
      const stepNames = problematicSteps
        .map((step) => step.stepName)
        .join("、");
      recommendations.push(
        `步骤"${stepNames}"的成功率较低，建议检查步骤配置和审批人员安排`
      );
    }

    // 基于用户性能的建议
    const lowPerformanceUsers = userPerformance.filter(
      (user) => user.successRate < 70
    );
    if (lowPerformanceUsers.length > 0) {
      const userNames = lowPerformanceUsers
        .map((user) => user.realName || user.username)
        .join("、");
      recommendations.push(
        `用户"${userNames}"的工作流成功率较低，建议提供培训或调整工作分配`
      );
    }

    // 基于工作流数量的建议
    if (summary.activeWorkflows > summary.totalWorkflows * 0.3) {
      recommendations.push("活跃工作流比例较高，建议及时处理积压的审批任务");
    }

    if (recommendations.length === 0) {
      recommendations.push("工作流运行状况良好，继续保持当前的管理水平");
    }

    return recommendations;
  }

  /**
   * 构建日期过滤器
   */
  private buildDateFilter(startDate?: Date, endDate?: Date): any {
    const filter: any = {};

    if (startDate || endDate) {
      filter.startedAt = {};
      if (startDate) filter.startedAt.gte = startDate;
      if (endDate) filter.startedAt.lte = endDate;
    }

    return filter;
  }

  /**
   * 获取工作流趋势分析
   */
  async getWorkflowTrends(days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const processes = await this.prisma.approvalProcess.findMany({
        where: {
          startedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          startedAt: true,
          status: true,
          workflowId: true,
        },
      });

      // 按工作流分组统计
      const workflowStats = new Map<
        number,
        { started: number; completed: number; failed: number }
      >();

      for (const process of processes) {
        const existing = workflowStats.get(process.workflowId);
        if (existing) {
          existing.started++;
          if (process.status === "completed") existing.completed++;
          else if (process.status === "failed") existing.failed++;
        } else {
          workflowStats.set(process.workflowId, {
            started: 1,
            completed: process.status === "completed" ? 1 : 0,
            failed: process.status === "failed" ? 1 : 0,
          });
        }
      }

      return Array.from(workflowStats.entries()).map(([workflowId, stats]) => ({
        workflowId,
        ...stats,
        successRate: (stats.completed / stats.started) * 100,
      }));
    } catch (error) {
      console.error("获取工作流趋势分析失败:", error);
      return [];
    }
  }

  /**
   * 获取性能基准数据
   */
  async getPerformanceBenchmarks(): Promise<any> {
    try {
      const allProcesses = await this.prisma.approvalProcess.findMany({
        where: {
          completedAt: { not: null },
        },
        select: {
          startedAt: true,
          completedAt: true,
          status: true,
        },
      });

      const executionTimes = allProcesses
        .filter((process) => process.completedAt)
        .map(
          (process) =>
            process.completedAt!.getTime() - process.startedAt.getTime()
        );

      if (executionTimes.length === 0) {
        return {
          min: 0,
          max: 0,
          average: 0,
          median: 0,
          percentile95: 0,
        };
      }

      executionTimes.sort((a, b) => a - b);

      const min = executionTimes[0];
      const max = executionTimes[executionTimes.length - 1];
      const average =
        executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      const median = executionTimes[Math.floor(executionTimes.length / 2)];
      const percentile95 =
        executionTimes[Math.floor(executionTimes.length * 0.95)];

      return {
        min: min / (1000 * 60 * 60), // 转换为小时
        max: max / (1000 * 60 * 60),
        average: average / (1000 * 60 * 60),
        median: median / (1000 * 60 * 60),
        percentile95: percentile95 / (1000 * 60 * 60),
      };
    } catch (error) {
      console.error("获取性能基准数据失败:", error);
      return {};
    }
  }

  /**
   * 导出分析报告
   */
  async exportAnalyticsReport(
    format: "json" | "csv" | "pdf" = "json",
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const report = await this.generateWorkflowPerformanceReport(
        startDate,
        endDate
      );

      switch (format) {
        case "json":
          return report;
        case "csv":
          return this.convertToCSV(report);
        case "pdf":
          return this.convertToPDF(report);
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }
    } catch (error) {
      console.error("导出分析报告失败:", error);
      throw error;
    }
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(report: WorkflowPerformanceReport): string {
    // 这里实现CSV转换逻辑
    return "CSV格式的报告内容";
  }

  /**
   * 转换为PDF格式
   */
  private convertToPDF(report: WorkflowPerformanceReport): Buffer {
    // 这里实现PDF转换逻辑
    return Buffer.from("PDF格式的报告内容");
  }
}

export default AnalyticsService;
