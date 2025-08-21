import { PrismaClient } from "@prisma/client";

export interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "in_app";
  subject?: string;
  content: string;
  variables: string[];
}

export interface NotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  metadata?: any;
  expiresAt?: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "in_app";
  config: any;
  enabled: boolean;
}

export class NotificationService {
  private prisma: PrismaClient;
  private channels: Map<string, NotificationChannel> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeChannels();
  }

  /**
   * 初始化通知渠道
   */
  private initializeChannels(): void {
    // 内置通知渠道
    this.channels.set("email", {
      id: "email",
      name: "邮件通知",
      type: "email",
      config: {
        smtp: {
          host: process.env.SMTP_HOST || "localhost",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      },
      enabled: true,
    });

    this.channels.set("in_app", {
      id: "in_app",
      name: "应用内通知",
      type: "in_app",
      config: {},
      enabled: true,
    });

    this.channels.set("webhook", {
      id: "webhook",
      name: "Webhook通知",
      type: "webhook",
      config: {
        endpoints: process.env.WEBHOOK_ENDPOINTS?.split(",") || [],
      },
      enabled: true,
    });
  }

  /**
   * 发送工作流通知
   */
  async sendWorkflowNotification(
    userId: number,
    workflowId: number,
    processId: number,
    stepNumber: number,
    stepName: string,
    action: "started" | "completed" | "failed" | "paused" | "resumed"
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, realName: true, email: true },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      const workflow = await this.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        select: { name: true, description: true },
      });

      if (!workflow) {
        throw new Error("工作流不存在");
      }

      // 构建通知内容
      const notificationData = this.buildWorkflowNotification(
        user,
        workflow,
        stepNumber,
        stepName,
        action
      );

      // 发送通知
      await this.sendNotification(notificationData);

      // 记录通知历史
      await this.recordNotification({
        userId,
        type: "workflow",
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority,
        category: "workflow",
        metadata: {
          workflowId,
          processId,
          stepNumber,
          stepName,
          action,
        },
      });

      console.log(
        `📧 工作流通知已发送: 用户 ${user.username}, 工作流 ${workflow.name}`
      );
    } catch (error) {
      console.error("发送工作流通知失败:", error);
      throw error;
    }
  }

  /**
   * 构建工作流通知内容
   */
  private buildWorkflowNotification(
    user: any,
    workflow: any,
    stepNumber: number,
    stepName: string,
    action: string
  ): NotificationData {
    const actionMap = {
      started: "已启动",
      completed: "已完成",
      failed: "执行失败",
      paused: "已暂停",
      resumed: "已恢复",
    };

    const priorityMap = {
      started: "medium",
      completed: "low",
      failed: "high",
      paused: "medium",
      resumed: "medium",
    };

    const title = `工作流通知 - ${workflow.name}`;
    const message = `您好 ${user.realName || user.username}，工作流"${
      workflow.name
    }"的步骤"${stepName}"${actionMap[action as keyof typeof actionMap]}。`;

    return {
      userId: user.id,
      type: "workflow",
      title,
      message,
      priority: priorityMap[action as keyof typeof priorityMap] as any,
      category: "workflow",
      metadata: {
        workflowName: workflow.name,
        stepNumber,
        stepName,
        action,
      },
    };
  }

  /**
   * 发送通用通知
   */
  async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      // 根据用户偏好选择通知渠道
      const channels = await this.getUserNotificationChannels(
        notificationData.userId
      );

      for (const channel of channels) {
        if (channel.enabled) {
          await this.sendToChannel(channel, notificationData);
        }
      }
    } catch (error) {
      console.error("发送通知失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户通知渠道偏好
   */
  private async getUserNotificationChannels(
    userId: number
  ): Promise<NotificationChannel[]> {
    // 这里可以从用户设置中获取通知偏好
    // 暂时返回默认渠道
    return [this.channels.get("in_app")!, this.channels.get("email")!].filter(
      Boolean
    );
  }

  /**
   * 发送通知到指定渠道
   */
  private async sendToChannel(
    channel: NotificationChannel,
    notificationData: NotificationData
  ): Promise<void> {
    try {
      switch (channel.type) {
        case "email":
          await this.sendEmail(channel, notificationData);
          break;
        case "in_app":
          await this.sendInAppNotification(channel, notificationData);
          break;
        case "webhook":
          await this.sendWebhook(channel, notificationData);
          break;
        default:
          console.warn(`未知的通知渠道类型: ${channel.type}`);
      }
    } catch (error) {
      console.error(`发送通知到渠道 ${channel.name} 失败:`, error);
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmail(
    channel: NotificationChannel,
    notificationData: NotificationData
  ): Promise<void> {
    // 这里集成邮件发送服务
    // 例如：Nodemailer, SendGrid等
    console.log(`📧 发送邮件通知: ${notificationData.title}`);
    console.log(`   收件人: ${notificationData.userId}`);
    console.log(`   内容: ${notificationData.message}`);
  }

  /**
   * 发送应用内通知
   */
  private async sendInAppNotification(
    channel: NotificationChannel,
    notificationData: NotificationData
  ): Promise<void> {
    // 这里实现应用内通知逻辑
    // 例如：WebSocket推送、数据库存储等
    console.log(`📱 发送应用内通知: ${notificationData.title}`);
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhook(
    channel: NotificationChannel,
    notificationData: NotificationData
  ): Promise<void> {
    // 这里实现Webhook调用逻辑
    console.log(`🌐 发送Webhook通知: ${notificationData.title}`);
  }

  /**
   * 记录通知历史
   */
  private async recordNotification(
    notificationData: Omit<NotificationData, "type">
  ): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: notificationData.userId,
          type: "notification",
          title: notificationData.title,
          status: "success",
          details: notificationData.message,
          metadata: JSON.stringify(notificationData.metadata),
        },
      });
    } catch (error) {
      console.error("记录通知历史失败:", error);
    }
  }

  /**
   * 发送批量通知
   */
  async sendBulkNotifications(
    userIds: number[],
    notificationData: Omit<NotificationData, "userId">
  ): Promise<void> {
    try {
      const promises = userIds.map((userId) =>
        this.sendNotification({
          ...notificationData,
          userId,
        })
      );

      await Promise.all(promises);
      console.log(`📧 批量通知已发送: ${userIds.length} 个用户`);
    } catch (error) {
      console.error("发送批量通知失败:", error);
      throw error;
    }
  }

  /**
   * 发送定时通知
   */
  async scheduleNotification(
    notificationData: NotificationData,
    scheduledAt: Date
  ): Promise<void> {
    try {
      // 这里实现定时通知逻辑
      // 例如：使用定时任务队列、数据库定时器等
      console.log(`⏰ 定时通知已安排: ${scheduledAt.toISOString()}`);

      // 记录定时通知
      await this.recordNotification({
        ...notificationData,
        metadata: {
          ...notificationData.metadata,
          scheduledAt: scheduledAt.toISOString(),
          isScheduled: true,
        },
      });
    } catch (error) {
      console.error("安排定时通知失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户未读通知
   */
  async getUserUnreadNotifications(
    userId: number,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const notifications = await this.prisma.activityLog.findMany({
        where: {
          userId,
          type: "notification",
          status: "success",
          // 这里可以添加未读状态检查
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.details,
        timestamp: notification.timestamp,
        metadata: JSON.parse(notification.metadata || "{}"),
      }));
    } catch (error) {
      console.error("获取用户未读通知失败:", error);
      return [];
    }
  }

  /**
   * 标记通知为已读
   */
  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await this.prisma.activityLog.update({
        where: { id: notificationId },
        data: {
          metadata: JSON.stringify({
            readAt: new Date().toISOString(),
            isRead: true,
          }),
        },
      });
    } catch (error) {
      console.error("标记通知为已读失败:", error);
      throw error;
    }
  }

  /**
   * 清理过期通知
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await this.prisma.activityLog.deleteMany({
        where: {
          type: "notification",
          timestamp: {
            lt: thirtyDaysAgo,
          },
        },
      });

      console.log(`🧹 清理过期通知完成: 删除 ${deletedCount.count} 条记录`);
    } catch (error) {
      console.error("清理过期通知失败:", error);
    }
  }
}

export default NotificationService;
