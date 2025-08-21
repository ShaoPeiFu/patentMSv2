import { PrismaClient } from "@prisma/client";
import type { ApprovalWorkflow, ApprovalProcess } from "@prisma/client";

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  required: boolean;
  assigneeRole?: string;
  estimatedTime?: number;
  conditions?: any[];
  actions?: any[];
}

export interface WorkflowExecutionContext {
  workflowId: number;
  processId: number;
  currentStep: number;
  userId: number;
  data: any;
  metadata: any;
}

export interface WorkflowAction {
  type: string;
  target: string;
  parameters: any;
  conditions?: any[];
}

export class WorkflowEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 启动工作流执行
   */
  async startWorkflow(
    workflowId: number,
    documentId: string,
    userId: number,
    initialData?: any
  ): Promise<ApprovalProcess> {
    try {
      // 获取工作流定义
      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new Error("工作流不存在");
      }

      if (workflow.status !== "active") {
        throw new Error("工作流未激活");
      }

      // 解析工作流步骤
      const steps: WorkflowStep[] = JSON.parse(workflow.steps || "[]");
      if (steps.length === 0) {
        throw new Error("工作流步骤为空");
      }

      // 创建审批流程
      const process = await this.prisma.approvalProcess.create({
        data: {
          workflowId,
          documentId,
          currentStep: 1,
          status: "pending",
          startedBy: userId,
          startedAt: new Date(),
          metadata: JSON.stringify({
            steps: steps.length,
            currentStep: 1,
            initialData,
            executionHistory: [],
          }),
        },
      });

      // 执行第一个步骤
      await this.executeStep(process.id, steps[0], {
        workflowId,
        processId: process.id,
        currentStep: 1,
        userId,
        data: initialData || {},
        metadata: { step: 1, totalSteps: steps.length },
      });

      return process;
    } catch (error) {
      console.error("启动工作流失败:", error);
      throw error;
    }
  }

  /**
   * 执行工作流步骤
   */
  async executeStep(
    processId: number,
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<void> {
    try {
      console.log(`🔄 执行工作流步骤: ${step.name} (步骤 ${step.stepNumber})`);

      // 更新流程元数据
      await this.updateProcessMetadata(processId, {
        currentStep: step.stepNumber,
        stepName: step.name,
        stepStartedAt: new Date().toISOString(),
        status: "processing",
      });

      // 检查步骤条件
      if (step.conditions && step.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(
          step.conditions,
          context
        );
        if (!conditionsMet) {
          console.log(`⚠️  步骤条件不满足，跳过步骤: ${step.name}`);
          await this.skipStep(processId, step, context);
          return;
        }
      }

      // 执行步骤动作
      if (step.actions && step.actions.length > 0) {
        await this.executeActions(step.actions, context);
      }

      // 记录步骤执行历史
      await this.recordStepExecution(processId, step, context, "completed");

      console.log(`✅ 步骤执行完成: ${step.name}`);
    } catch (error) {
      console.error(`❌ 步骤执行失败: ${step.name}`, error);
      await this.recordStepExecution(
        processId,
        step,
        context,
        "failed",
        error.message
      );
      throw error;
    }
  }

  /**
   * 评估步骤条件
   */
  private async evaluateConditions(
    conditions: any[],
    context: WorkflowExecutionContext
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  /**
   * 评估单个条件
   */
  private async evaluateCondition(
    condition: any,
    context: WorkflowExecutionContext
  ): Promise<boolean> {
    const { type, field, operator, value } = condition;

    switch (type) {
      case "field_equals":
        return context.data[field] === value;
      case "field_not_equals":
        return context.data[field] !== value;
      case "field_contains":
        return String(context.data[field]).includes(value);
      case "field_greater_than":
        return Number(context.data[field]) > Number(value);
      case "field_less_than":
        return Number(context.data[field]) < Number(value);
      case "user_role":
        const user = await this.prisma.user.findUnique({
          where: { id: context.userId },
          select: { role: true },
        });
        return user?.role === value;
      case "custom":
        // 自定义条件评估逻辑
        return await this.evaluateCustomCondition(condition, context);
      default:
        console.warn(`未知的条件类型: ${type}`);
        return true;
    }
  }

  /**
   * 评估自定义条件
   */
  private async evaluateCustomCondition(
    condition: any,
    context: WorkflowExecutionContext
  ): Promise<boolean> {
    // 这里可以实现复杂的自定义条件逻辑
    // 例如：数据库查询、外部API调用等
    return true;
  }

  /**
   * 执行步骤动作
   */
  private async executeActions(
    actions: any[],
    context: WorkflowExecutionContext
  ): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action, context);
    }
  }

  /**
   * 执行单个动作
   */
  private async executeAction(
    action: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const { type, target, parameters } = action;

    switch (type) {
      case "send_notification":
        await this.sendNotification(target, parameters, context);
        break;
      case "update_document":
        await this.updateDocument(target, parameters, context);
        break;
      case "create_task":
        await this.createTask(target, parameters, context);
        break;
      case "call_webhook":
        await this.callWebhook(target, parameters, context);
        break;
      case "wait":
        await this.wait(parameters.duration);
        break;
      default:
        console.warn(`未知的动作类型: ${type}`);
    }
  }

  /**
   * 发送通知
   */
  private async sendNotification(
    target: string,
    parameters: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // 这里集成通知系统
    console.log(`📧 发送通知到: ${target}`, parameters);
  }

  /**
   * 更新文档
   */
  private async updateDocument(
    target: string,
    parameters: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // 这里实现文档更新逻辑
    console.log(`📄 更新文档: ${target}`, parameters);
  }

  /**
   * 创建任务
   */
  private async createTask(
    target: string,
    parameters: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // 这里实现任务创建逻辑
    console.log(`📋 创建任务: ${target}`, parameters);
  }

  /**
   * 调用Webhook
   */
  private async callWebhook(
    target: string,
    parameters: any,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // 这里实现Webhook调用逻辑
    console.log(`🌐 调用Webhook: ${target}`, parameters);
  }

  /**
   * 等待指定时间
   */
  private async wait(duration: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  /**
   * 跳过步骤
   */
  private async skipStep(
    processId: number,
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<void> {
    await this.recordStepExecution(processId, step, context, "skipped");
    await this.moveToNextStep(processId, context);
  }

  /**
   * 移动到下一步
   */
  async moveToNextStep(
    processId: number,
    context: WorkflowExecutionContext
  ): Promise<void> {
    try {
      const process = await this.prisma.approvalProcess.findUnique({
        where: { id: processId },
        include: {
          workflow: true,
        },
      });

      if (!process) {
        throw new Error("审批流程不存在");
      }

      const steps: WorkflowStep[] = JSON.parse(process.workflow.steps || "[]");
      const nextStepNumber = context.currentStep + 1;

      if (nextStepNumber > steps.length) {
        // 工作流完成
        await this.completeWorkflow(processId, context);
        return;
      }

      const nextStep = steps.find((s) => s.stepNumber === nextStepNumber);
      if (!nextStep) {
        throw new Error(`找不到步骤 ${nextStepNumber}`);
      }

      // 更新流程状态
      await this.prisma.approvalProcess.update({
        where: { id: processId },
        data: {
          currentStep: nextStepNumber,
          metadata: JSON.stringify({
            ...JSON.parse(process.metadata || "{}"),
            currentStep: nextStepNumber,
            lastStepCompletedAt: new Date().toISOString(),
          }),
        },
      });

      // 执行下一步
      await this.executeStep(processId, nextStep, {
        ...context,
        currentStep: nextStepNumber,
      });
    } catch (error) {
      console.error("移动到下一步失败:", error);
      throw error;
    }
  }

  /**
   * 完成工作流
   */
  private async completeWorkflow(
    processId: number,
    context: WorkflowExecutionContext
  ): Promise<void> {
    try {
      await this.prisma.approvalProcess.update({
        where: { id: processId },
        data: {
          status: "completed",
          completedAt: new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(context.metadata || "{}"),
            completedAt: new Date().toISOString(),
            finalStatus: "completed",
          }),
        },
      });

      console.log(`🎉 工作流执行完成: 流程ID ${processId}`);
    } catch (error) {
      console.error("完成工作流失败:", error);
      throw error;
    }
  }

  /**
   * 更新流程元数据
   */
  private async updateProcessMetadata(
    processId: number,
    updates: any
  ): Promise<void> {
    const process = await this.prisma.approvalProcess.findUnique({
      where: { id: processId },
    });

    if (!process) {
      throw new Error("审批流程不存在");
    }

    const metadata = JSON.parse(process.metadata || "{}");
    const updatedMetadata = { ...metadata, ...updates };

    await this.prisma.approvalProcess.update({
      where: { id: processId },
      data: {
        metadata: JSON.stringify(updatedMetadata),
      },
    });
  }

  /**
   * 记录步骤执行历史
   */
  private async recordStepExecution(
    processId: number,
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    status: "completed" | "failed" | "skipped",
    errorMessage?: string
  ): Promise<void> {
    const metadata = JSON.parse(context.metadata || "{}");
    const executionHistory = metadata.executionHistory || [];

    executionHistory.push({
      stepNumber: step.stepNumber,
      stepName: step.name,
      status,
      executedAt: new Date().toISOString(),
      executedBy: context.userId,
      errorMessage,
      duration:
        Date.now() - new Date(metadata.stepStartedAt || Date.now()).getTime(),
    });

    await this.updateProcessMetadata(processId, {
      executionHistory,
      lastStepStatus: status,
      lastStepCompletedAt: new Date().toISOString(),
    });
  }

  /**
   * 获取工作流执行状态
   */
  async getWorkflowStatus(processId: number): Promise<any> {
    const process = await this.prisma.approvalProcess.findUnique({
      where: { id: processId },
      include: {
        workflow: true,
      },
    });

    if (!process) {
      throw new Error("审批流程不存在");
    }

    const metadata = JSON.parse(process.metadata || "{}");
    const steps: WorkflowStep[] = JSON.parse(process.workflow.steps || "[]");

    return {
      processId: process.id,
      workflowId: process.workflowId,
      status: process.status,
      currentStep: process.currentStep,
      totalSteps: steps.length,
      startedAt: process.startedAt,
      completedAt: process.completedAt,
      executionHistory: metadata.executionHistory || [],
      metadata,
    };
  }

  /**
   * 暂停工作流
   */
  async pauseWorkflow(processId: number, reason?: string): Promise<void> {
    await this.prisma.approvalProcess.update({
      where: { id: processId },
      data: {
        status: "paused",
        metadata: JSON.stringify({
          pausedAt: new Date().toISOString(),
          pauseReason: reason || "手动暂停",
        }),
      },
    });
  }

  /**
   * 恢复工作流
   */
  async resumeWorkflow(processId: number): Promise<void> {
    const process = await this.prisma.approvalProcess.findUnique({
      where: { id: processId },
    });

    if (!process) {
      throw new Error("审批流程不存在");
    }

    if (process.status !== "paused") {
      throw new Error("工作流未处于暂停状态");
    }

    // 继续执行当前步骤
    const steps: WorkflowStep[] = JSON.parse(process.workflow?.steps || "[]");
    const currentStep = steps.find((s) => s.stepNumber === process.currentStep);

    if (currentStep) {
      await this.executeStep(processId, currentStep, {
        workflowId: process.workflowId,
        processId: process.id,
        currentStep: process.currentStep,
        userId: process.startedBy,
        data: {},
        metadata: JSON.parse(process.metadata || "{}"),
      });
    }
  }
}

export default WorkflowEngine;
