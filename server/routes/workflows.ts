import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import WorkflowEngine from "../services/workflowEngine";
import NotificationService from "../services/notificationService";
import AnalyticsService from "../services/analyticsService";

const router = express.Router();

// 导出路由工厂函数，接收PrismaClient实例
export default function createWorkflowsRouter(prisma: PrismaClient) {
  // 初始化服务
  const workflowEngine = new WorkflowEngine(prisma);
  const notificationService = new NotificationService(prisma);
  const analyticsService = new AnalyticsService(prisma);

  // 获取工作流列表
  router.get("/", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};

      if (status) where.status = status;
      // 注意：ApprovalWorkflow模型没有category字段，所以移除category筛选

      // 检查用户角色，admin用户可以看到所有工作流
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // admin用户可以看到所有工作流，其他用户只能看到自己创建的
      if (user?.role !== "admin") {
        where.createdBy = userId;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [workflows, total] = await Promise.all([
        prisma.approvalWorkflow.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            steps: true,
            status: true,
            type: true,
            priority: true,
            category: true,
            version: true,
            isActive: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
              },
            },
          },
          orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
          skip,
          take: parseInt(limit as string),
        }),
        prisma.approvalWorkflow.count({ where }),
      ]);

      res.json({
        success: true,
        workflows: workflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: JSON.parse(workflow.steps || "[]"),
          status: workflow.status,
          type: workflow.type || "sequential",
          priority: workflow.priority || "medium",
          category: workflow.category || "通用",
          version: workflow.version || "1.0",
          isActive: workflow.isActive !== null ? workflow.isActive : true,
          createdBy: workflow.createdBy,
          creator: workflow.user,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("获取工作流列表失败:", error);
      res.status(500).json({
        success: false,
        error: "获取工作流列表失败",
        details: error.message,
      });
    }
  });

  // 获取工作流详情
  router.get("/:id", authenticateToken, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      if (isNaN(workflowId)) {
        return res.status(400).json({
          success: false,
          error: "无效的工作流ID",
        });
      }

      const workflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
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

      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: "工作流不存在",
        });
      }

      // 检查用户角色，admin用户可以查看所有工作流
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && workflow.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限查看此工作流",
        });
      }

      res.json({
        success: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: JSON.parse(workflow.steps || "[]"),
          status: workflow.status,
          createdBy: workflow.createdBy,
          creator: workflow.user,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        },
      });
    } catch (error) {
      console.error("获取工作流详情失败:", error);
      res.status(500).json({
        success: false,
        error: "获取工作流详情失败",
        details: error.message,
      });
    }
  });

  // 创建工作流
  router.post("/", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { name, description, steps, status = "active" } = req.body;

      if (!name || !steps || !Array.isArray(steps)) {
        return res.status(400).json({
          success: false,
          error: "工作流名称和步骤不能为空",
        });
      }

      const newWorkflow = await prisma.approvalWorkflow.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          steps: JSON.stringify(steps),
          status,
          createdBy: userId,
        },
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

      res.status(201).json({
        success: true,
        message: "工作流创建成功",
        workflow: {
          id: newWorkflow.id,
          name: newWorkflow.name,
          description: newWorkflow.description,
          steps: JSON.parse(newWorkflow.steps || "[]"),
          status: newWorkflow.status,
          createdBy: newWorkflow.createdBy,
          creator: newWorkflow.user,
          createdAt: newWorkflow.createdAt,
          updatedAt: newWorkflow.updatedAt,
        },
      });
    } catch (error) {
      console.error("创建工作流失败:", error);
      res.status(500).json({
        success: false,
        error: "创建工作流失败",
        details: error.message,
      });
    }
  });

  // 更新工作流
  router.put("/:id", authenticateToken, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const updates = req.body;
      const userId = (req as any).user.id;

      if (isNaN(workflowId)) {
        return res.status(400).json({
          success: false,
          error: "无效的工作流ID",
        });
      }

      // 检查工作流是否存在
      const existingWorkflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
      });

      if (!existingWorkflow) {
        return res.status(404).json({
          success: false,
          error: "工作流不存在",
        });
      }

      // 检查用户角色，admin用户可以修改所有工作流
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && existingWorkflow.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限修改此工作流",
        });
      }

      const updatedWorkflow = await prisma.approvalWorkflow.update({
        where: { id: workflowId },
        data: {
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.description !== undefined && {
            description: updates.description?.trim(),
          }),
          ...(updates.steps && { steps: JSON.stringify(updates.steps) }),
          ...(updates.status && { status: updates.status }),
          updatedAt: new Date(),
        },
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

      res.json({
        success: true,
        message: "工作流更新成功",
        workflow: {
          id: updatedWorkflow.id,
          name: updatedWorkflow.name,
          description: updatedWorkflow.description,
          steps: JSON.parse(updatedWorkflow.steps || "[]"),
          status: updatedWorkflow.status,
          createdBy: updatedWorkflow.createdBy,
          creator: updatedWorkflow.user,
          createdAt: updatedWorkflow.createdAt,
          updatedAt: updatedWorkflow.updatedAt,
        },
      });
    } catch (error) {
      console.error("更新工作流失败:", error);
      res.status(500).json({
        success: false,
        error: "更新工作流失败",
        details: error.message,
      });
    }
  });

  // 删除工作流
  router.delete("/:id", authenticateToken, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      if (isNaN(workflowId)) {
        return res.status(400).json({
          success: false,
          error: "无效的工作流ID",
        });
      }

      // 检查工作流是否存在
      const existingWorkflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
      });

      if (!existingWorkflow) {
        return res.status(404).json({
          success: false,
          error: "工作流不存在",
        });
      }

      // 检查用户角色，admin用户可以删除所有工作流
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && existingWorkflow.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限删除此工作流",
        });
      }

      // 检查是否有正在进行的审批流程
      const activeProcesses = await prisma.approvalProcess.count({
        where: { workflowId },
      });

      if (activeProcesses > 0) {
        return res.status(400).json({
          success: false,
          error: "无法删除有正在进行的审批流程的工作流",
        });
      }

      await prisma.approvalWorkflow.delete({
        where: { id: workflowId },
      });

      res.json({
        success: true,
        message: "工作流删除成功",
      });
    } catch (error) {
      console.error("删除工作流失败:", error);
      res.status(500).json({
        success: false,
        error: "删除工作流失败",
        details: error.message,
      });
    }
  });

  // 切换工作流状态
  router.patch("/:id/status", authenticateToken, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = (req as any).user.id;

      if (isNaN(workflowId)) {
        return res.status(400).json({
          success: false,
          error: "无效的工作流ID",
        });
      }

      if (!status || !["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "状态值无效，必须是 'active' 或 'inactive'",
        });
      }

      // 检查工作流是否存在
      const existingWorkflow = await prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
      });

      if (!existingWorkflow) {
        return res.status(404).json({
          success: false,
          error: "工作流不存在",
        });
      }

      // 检查用户角色，admin用户可以修改所有工作流
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && existingWorkflow.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限修改此工作流",
        });
      }

      const updatedWorkflow = await prisma.approvalWorkflow.update({
        where: { id: workflowId },
        data: {
          status,
          isActive: status === "active", // 同时更新isActive字段
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          description: true,
          steps: true,
          status: true,
          type: true,
          priority: true,
          category: true,
          version: true,
          isActive: true,
          tags: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: `工作流已${status === "active" ? "启用" : "停用"}`,
        workflow: {
          id: updatedWorkflow.id,
          name: updatedWorkflow.name,
          description: updatedWorkflow.description,
          steps: JSON.parse(updatedWorkflow.steps || "[]"),
          status: updatedWorkflow.status,
          type: updatedWorkflow.type || "sequential",
          priority: updatedWorkflow.priority || "medium",
          category: updatedWorkflow.category || "文档",
          version: updatedWorkflow.version || "1.0",
          isActive:
            updatedWorkflow.isActive !== null ? updatedWorkflow.isActive : true,
          tags: updatedWorkflow.tags ? JSON.parse(updatedWorkflow.tags) : [],
          createdBy: updatedWorkflow.createdBy,
          creator: updatedWorkflow.user,
          createdAt: updatedWorkflow.createdAt,
          updatedAt: updatedWorkflow.updatedAt,
        },
      });
    } catch (error) {
      console.error("切换工作流状态失败:", error);
      res.status(500).json({
        success: false,
        error: "切换工作流状态失败",
        details: error.message,
      });
    }
  });

  // 高级功能端点

  // 启动工作流执行
  router.post("/:id/start", authenticateToken, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const { documentId, initialData } = req.body;
      const userId = (req as any).user.id;

      if (isNaN(workflowId)) {
        return res.status(400).json({
          success: false,
          error: "无效的工作流ID",
        });
      }

      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "文档ID是必需的",
        });
      }

      // 启动工作流
      const process = await workflowEngine.startWorkflow(
        workflowId,
        documentId,
        userId,
        initialData
      );

      // 发送通知
      await notificationService.sendWorkflowNotification(
        userId,
        workflowId,
        process.id,
        1,
        "工作流启动",
        "started"
      );

      res.json({
        success: true,
        message: "工作流启动成功",
        process: {
          id: process.id,
          workflowId: process.workflowId,
          documentId: process.documentId,
          currentStep: process.currentStep,
          status: process.status,
          startedAt: process.startedAt,
        },
      });
    } catch (error) {
      console.error("启动工作流失败:", error);
      res.status(500).json({
        success: false,
        error: "启动工作流失败",
        details: error.message,
      });
    }
  });

  // 获取工作流执行状态
  router.get(
    "/:id/process/:processId/status",
    authenticateToken,
    async (req, res) => {
      try {
        const processId = parseInt(req.params.processId);
        const userId = (req as any).user.id;

        if (isNaN(processId)) {
          return res.status(400).json({
            success: false,
            error: "无效的流程ID",
          });
        }

        // 获取执行状态
        const status = await workflowEngine.getWorkflowStatus(processId);

        res.json({
          success: true,
          status,
        });
      } catch (error) {
        console.error("获取工作流状态失败:", error);
        res.status(500).json({
          success: false,
          error: "获取工作流状态失败",
          details: error.message,
        });
      }
    }
  );

  // 暂停工作流
  router.post(
    "/:id/process/:processId/pause",
    authenticateToken,
    async (req, res) => {
      try {
        const processId = parseInt(req.params.processId);
        const { reason } = req.body;
        const userId = (req as any).user.id;

        if (isNaN(processId)) {
          return res.status(400).json({
            success: false,
            error: "无效的流程ID",
          });
        }

        // 暂停工作流
        await workflowEngine.pauseWorkflow(processId, reason);

        res.json({
          success: true,
          message: "工作流已暂停",
        });
      } catch (error) {
        console.error("暂停工作流失败:", error);
        res.status(500).json({
          success: false,
          error: "暂停工作流失败",
          details: error.message,
        });
      }
    }
  );

  // 恢复工作流
  router.post(
    "/:id/process/:processId/resume",
    authenticateToken,
    async (req, res) => {
      try {
        const processId = parseInt(req.params.processId);
        const userId = (req as any).user.id;

        if (isNaN(processId)) {
          return res.status(400).json({
            success: false,
            error: "无效的流程ID",
          });
        }

        // 恢复工作流
        await workflowEngine.resumeWorkflow(processId);

        res.json({
          success: true,
          message: "工作流已恢复",
        });
      } catch (error) {
        console.error("恢复工作流失败:", error);
        res.status(500).json({
          success: false,
          error: "恢复工作流失败",
          details: error.message,
        });
      }
    }
  );

  // 获取工作流分析报告
  router.get("/analytics/report", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const userId = (req as any).user.id;

      // 检查用户权限
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "无权限访问分析报告",
        });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      // 生成分析报告
      const report = await analyticsService.generateWorkflowPerformanceReport(
        start,
        end
      );

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("获取分析报告失败:", error);
      res.status(500).json({
        success: false,
        error: "获取分析报告失败",
        details: error.message,
      });
    }
  });

  // 获取工作流趋势
  router.get("/analytics/trends", authenticateToken, async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const userId = (req as any).user.id;

      // 检查用户权限
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "无权限访问趋势分析",
        });
      }

      // 获取趋势数据
      const trends = await analyticsService.getWorkflowTrends(
        parseInt(days as string)
      );

      res.json({
        success: true,
        trends,
      });
    } catch (error) {
      console.error("获取趋势分析失败:", error);
      res.status(500).json({
        success: false,
        error: "获取趋势分析失败",
        details: error.message,
      });
    }
  });

  // 获取性能基准
  router.get("/analytics/benchmarks", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;

      // 检查用户权限
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "无权限访问性能基准",
        });
      }

      // 获取性能基准
      const benchmarks = await analyticsService.getPerformanceBenchmarks();

      res.json({
        success: true,
        benchmarks,
      });
    } catch (error) {
      console.error("获取性能基准失败:", error);
      res.status(500).json({
        success: false,
        error: "获取性能基准失败",
        details: error.message,
      });
    }
  });

  // 导出分析报告
  router.get("/analytics/export", authenticateToken, async (req, res) => {
    try {
      const { format = "json", startDate, endDate } = req.query;
      const userId = (req as any).user.id;

      // 检查用户权限
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "无权限导出分析报告",
        });
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      // 导出报告
      const report = await analyticsService.exportAnalyticsReport(
        format as "json" | "csv" | "pdf",
        start,
        end
      );

      // 设置响应头
      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=workflow-analytics.csv"
        );
      } else if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=workflow-analytics.pdf"
        );
      }

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("导出分析报告失败:", error);
      res.status(500).json({
        success: false,
        error: "导出分析报告失败",
        details: error.message,
      });
    }
  });

  return router;
}
