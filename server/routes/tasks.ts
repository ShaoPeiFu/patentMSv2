import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// 导出路由工厂函数，接收PrismaClient实例
export default function createTasksRouter(prisma: PrismaClient) {
  // 获取任务列表
  router.get("/", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { status, priority, assigneeId, page = 1, limit = 20 } = req.query;

      const where: any = {};

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assigneeId) where.assigneeId = parseInt(assigneeId as string);

      // 检查用户角色，admin用户可以看到所有任务
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // admin用户可以看到所有任务，其他用户只能看到分配给自己的任务或自己创建的任务
      if (user?.role !== "admin") {
        where.OR = [{ assigneeId: userId }, { createdBy: userId }];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignee: {
              select: {
                id: true,
                username: true,
                realName: true,
              },
            },
          },
          orderBy: [
            { priority: "desc" },
            { dueDate: "asc" },
            { createdAt: "desc" },
          ],
          skip,
          take: parseInt(limit as string),
        }),
        prisma.task.count({ where }),
      ]);

      res.json({
        success: true,
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          assigneeName: task.assignee?.realName || task.assignee?.username,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("获取任务列表失败:", error);
      res.status(500).json({
        success: false,
        error: "获取任务列表失败",
        details: error.message,
      });
    }
  });

  // 获取任务详情
  router.get("/:id", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          error: "无效的任务ID",
        });
      }

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          OR: [{ assigneeId: userId }, { createdBy: userId }],
        },
        include: {
          assignee: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "任务不存在或无权限访问",
        });
      }

      res.json({
        success: true,
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          assigneeName: task.assignee?.realName || task.assignee?.username,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    } catch (error) {
      console.error("获取任务详情失败:", error);
      res.status(500).json({
        success: false,
        error: "获取任务详情失败",
        details: error.message,
      });
    }
  });

  // 创建任务
  router.post("/", authenticateToken, async (req, res) => {
    try {
      const { title, description, assigneeId, dueDate, priority } = req.body;
      const createdBy = (req as any).user.id;

      console.log("📝 创建任务请求数据:", req.body);
      console.log("👤 创建者ID:", createdBy);
      console.log("🔍 请求头:", req.headers);

      if (!title || title.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "任务标题不能为空",
        });
      }

      console.log("✅ 数据验证通过，准备创建任务...");

      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description?.trim(),
          assigneeId: assigneeId ? parseInt(assigneeId) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || "medium",
          createdBy: createdBy,
        },
        include: {
          assignee: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      });

      console.log("✅ 任务创建成功:", task);

      res.status(201).json({
        success: true,
        message: "任务创建成功",
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          assigneeName: task.assignee?.realName || task.assignee?.username,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    } catch (error) {
      console.error("❌ 创建任务失败 - 错误类型:", error.constructor.name);
      console.error("❌ 创建任务失败 - 错误消息:", error.message);
      console.error("❌ 创建任务失败 - 错误堆栈:", error.stack);
      console.error("❌ 创建任务失败 - 完整错误对象:", error);

      res.status(500).json({
        success: false,
        error: "创建任务失败",
        details: error.message,
      });
    }
  });

  // 更新任务
  router.put("/:id", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      const userId = (req as any).user.id;

      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          error: "无效的任务ID",
        });
      }

      // 检查任务是否存在
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          error: "任务不存在",
        });
      }

      // 检查用户角色，admin用户可以修改所有任务
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin") {
        const hasPermission =
          existingTask.assigneeId === userId ||
          existingTask.createdBy === userId;
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: "无权限修改此任务",
          });
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...(updates.title && { title: updates.title.trim() }),
          ...(updates.description !== undefined && {
            description: updates.description?.trim(),
          }),
          ...(updates.assigneeId !== undefined && {
            assigneeId: updates.assigneeId
              ? parseInt(updates.assigneeId)
              : null,
          }),
          ...(updates.dueDate !== undefined && {
            dueDate: updates.dueDate ? new Date(updates.dueDate) : null,
          }),
          ...(updates.status && { status: updates.status }),
          ...(updates.priority && { priority: updates.priority }),
          updatedAt: new Date(),
        },
        include: {
          assignee: {
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
        message: "任务更新成功",
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          assigneeId: updatedTask.assigneeId,
          assigneeName:
            updatedTask.assignee?.realName || updatedTask.assignee?.username,
          dueDate: updatedTask.dueDate,
          status: updatedTask.status,
          priority: updatedTask.priority,
          createdAt: updatedTask.createdAt,
          updatedAt: updatedTask.updatedAt,
        },
      });
    } catch (error) {
      console.error("更新任务失败:", error);
      res.status(500).json({
        success: false,
        error: "更新任务失败",
        details: error.message,
      });
    }
  });

  // 删除任务
  router.delete("/:id", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          error: "无效的任务ID",
        });
      }

      // 检查任务是否存在
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          error: "任务不存在",
        });
      }

      // 检查用户角色，admin用户可以删除所有任务
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin") {
        const hasPermission =
          existingTask.assigneeId === userId ||
          existingTask.createdBy === userId;
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: "无权限删除此任务",
          });
        }
      }

      await prisma.task.delete({
        where: { id: taskId },
      });

      res.json({
        success: true,
        message: "任务删除成功",
      });
    } catch (error) {
      console.error("删除任务失败:", error);
      res.status(500).json({
        success: false,
        error: "删除任务失败",
        details: error.message,
      });
    }
  });

  // 更新任务状态
  router.patch("/:id/status", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { status, assigneeId } = req.body;
      const userId = (req as any).user.id;

      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          error: "无效的任务ID",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          error: "状态不能为空",
        });
      }

      // 检查任务是否存在
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          error: "任务不存在",
        });
      }

      // 检查用户角色，admin用户可以修改所有任务
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin") {
        const hasPermission =
          existingTask.assigneeId === userId ||
          existingTask.createdBy === userId;
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: "无权限修改此任务",
          });
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          status,
          ...(assigneeId !== undefined && {
            assigneeId: assigneeId ? parseInt(assigneeId) : null,
          }),
          updatedAt: new Date(),
        },
        include: {
          assignee: {
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
        message: "任务状态更新成功",
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description,
          assigneeId: updatedTask.assigneeId,
          assigneeName:
            updatedTask.assignee?.realName || updatedTask.assignee?.username,
          dueDate: updatedTask.dueDate,
          status: updatedTask.status,
          priority: updatedTask.priority,
          createdAt: updatedTask.createdAt,
          updatedAt: updatedTask.updatedAt,
        },
      });
    } catch (error) {
      console.error("更新任务状态失败:", error);
      res.status(500).json({
        success: false,
        error: "更新任务状态失败",
        details: error.message,
      });
    }
  });

  return router;
}
