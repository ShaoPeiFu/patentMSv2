import express from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 验证模式
const createDeadlineSchema = z.object({
  patentId: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(), // 修改：移除.datetime()限制，支持 YYYY-MM-DD 格式
  deadlineDate: z.string().optional(), // 兼容前端字段名
  type: z.string().optional(),
  deadlineType: z.string().optional(), // 兼容前端字段名
  status: z.string().default("pending"),
  priority: z.string().default("medium"),
  riskLevel: z.string().optional(),
  notes: z.string().optional(),
  patentNumber: z.string().optional(),
  patentTitle: z.string().optional(),
  // 添加前端可能发送的额外字段
  daysUntilDeadline: z.number().optional(),
  isCompleted: z.boolean().optional(),
  reminderLevel: z.string().optional(),
});

const updateDeadlineSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(), // 修改：移除.datetime()限制，支持 YYYY-MM-DD 格式
  deadlineDate: z.string().optional(), // 兼容前端字段名
  type: z.string().optional(),
  deadlineType: z.string().optional(), // 兼容前端字段名
  status: z.string().optional(),
  priority: z.string().optional(),
  riskLevel: z.string().optional(),
  notes: z.string().optional(),
  patentNumber: z.string().optional(),
  patentTitle: z.string().optional(),
});

const deadlineQuerySchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("20"),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

// 智能提醒验证模式
const createSmartReminderSchema = z.object({
  deadlineId: z.number(),
  patentId: z.number(),
  reminderType: z.string().default("notification"),
  reminderLevel: z.string().default("info"),
  message: z.string(),
  scheduledDate: z.string().datetime(),
});

// 日历事件验证模式
const createCalendarEventSchema = z.object({
  deadlineId: z.number(),
  patentId: z.number(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  allDay: z.boolean().default(false),
  color: z.string().default("#409EFF"),
  type: z.string().default("deadline"),
  priority: z.string().default("medium"),
});

// 风险评估验证模式
const createRiskAssessmentSchema = z.object({
  patentId: z.number(),
  riskLevel: z.string().default("medium"),
  riskScore: z.number().min(0).max(100).default(50),
  riskFactors: z.string().optional(),
  mitigationActions: z.string().optional(),
  nextAssessmentDate: z.string().datetime(),
  assessedBy: z.string(),
  notes: z.string().optional(),
});

interface ExtendedDeadline {
  id: number;
  patentId: number;
  title: string;
  description: string | null;
  dueDate: Date;
  type: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  // 扩展字段
  deadlineType?: string;
  deadlineDate?: Date;
  riskLevel?: string;
  reminderLevel?: string;
  isCompleted?: boolean;
  completedDate?: Date;
  notes?: string;
}

// 获取期限列表
router.get("/", authenticateToken, async (req, res) => {
  try {
    const query = deadlineQuerySchema.parse(req.query);
    const { page, limit, type, status, priority } = query;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [deadlines, total] = await Promise.all([
      prisma.deadline.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: "asc" },
      }),
      prisma.deadline.count({ where }),
    ]);

    // 计算剩余天数
    const deadlinesWithDays = deadlines.map((deadline) => {
      const today = new Date();
      const dueDate = new Date(deadline.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: deadline.id,
        patentId: deadline.patentId,
        patentNumber: deadline.patentNumber || `CN${deadline.patentId}`,
        patentTitle: deadline.patentTitle || deadline.title,
        title: deadline.title,
        deadlineType: deadline.deadlineType || deadline.type,
        deadlineDate: deadline.deadlineDate || deadline.dueDate,
        dueDate: deadline.dueDate,
        status: deadline.status,
        description: deadline.description || "",
        priority: deadline.priority,
        riskLevel: deadline.riskLevel || "medium",
        reminderLevel: deadline.reminderLevel || "info",
        daysUntilDeadline: diffDays,
        isCompleted: deadline.isCompleted || false,
        completedDate: deadline.completedDate,
        notes: deadline.notes || "",
        createdAt: deadline.createdAt,
        updatedAt: deadline.updatedAt,
      };
    });

    res.json({
      deadlines: deadlinesWithDays,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("获取期限列表失败:", error);
    res.status(500).json({ error: "获取期限列表失败" });
  }
});

// 获取统计信息
router.get("/statistics", authenticateToken, async (req, res) => {
  try {
    const [total, pending, completed, overdue] = await Promise.all([
      prisma.deadline.count(),
      prisma.deadline.count({ where: { status: "pending" } }),
      prisma.deadline.count({ where: { status: "completed" } }),
      prisma.deadline.count({ where: { status: "overdue" } }),
    ]);

    // 按类型统计
    const byType = await prisma.deadline.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    // 按优先级统计
    const byPriority = await prisma.deadline.groupBy({
      by: ["priority"],
      _count: { id: true },
    });

    res.json({
      total,
      pending,
      completed,
      overdue,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      byPriority: byPriority.map((item) => ({
        priority: item.priority,
        count: item._count.id,
      })),
    });
  } catch (error) {
    console.error("获取统计信息失败:", error);
    res.status(500).json({ error: "获取统计信息失败" });
  }
});

// ==================== 智能提醒管理 ====================

// 获取智能提醒列表
router.get("/reminders", authenticateToken, async (req, res) => {
  try {
    const { isRead, level } = req.query;
    const where: any = {};

    if (isRead !== undefined) {
      where.isRead = isRead === "true";
    }
    if (level) {
      where.reminderLevel = level;
    }

    console.log("🔍 查询智能提醒，条件:", where);

    const reminders = await prisma.smartReminder.findMany({
      where,
      include: {
        deadline: {
          include: {
            patent: {
              select: {
                id: true,
                title: true,
                patentNumber: true,
              },
            },
          },
        },
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    console.log("✅ 查询到智能提醒数量:", reminders.length);
    res.json(reminders);
  } catch (error) {
    console.error("获取智能提醒失败:", error);
    console.error("错误详情:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    res.status(500).json({
      error: "获取智能提醒失败",
      details: error.message,
      code: error.code,
    });
  }
});

// 创建智能提醒
router.post("/reminders", authenticateToken, async (req, res) => {
  try {
    const data = createSmartReminderSchema.parse(req.body);

    const reminder = await prisma.smartReminder.create({
      data: {
        ...data,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        deadline: {
          include: {
            patent: {
              select: {
                id: true,
                title: true,
                patentNumber: true,
              },
            },
          },
        },
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error("创建智能提醒失败:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "数据验证失败", details: error.errors });
    } else {
      res.status(500).json({ error: "创建智能提醒失败" });
    }
  }
});

// 更新智能提醒
router.put("/reminders/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const reminder = await prisma.smartReminder.update({
      where: { id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate
          ? new Date(data.scheduledDate)
          : undefined,
      },
      include: {
        deadline: {
          include: {
            patent: {
              select: {
                id: true,
                title: true,
                patentNumber: true,
              },
            },
          },
        },
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    res.json(reminder);
  } catch (error) {
    console.error("更新智能提醒失败:", error);
    res.status(500).json({ error: "更新智能提醒失败" });
  }
});

// 删除智能提醒
router.delete("/reminders/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.smartReminder.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("删除智能提醒失败:", error);
    res.status(500).json({ error: "删除智能提醒失败" });
  }
});

// 标记提醒为已读
router.put("/reminders/:id/read", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const reminder = await prisma.smartReminder.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(reminder);
  } catch (error) {
    console.error("标记提醒为已读失败:", error);
    res.status(500).json({ error: "标记提醒为已读失败" });
  }
});

// 标记所有提醒为已读
router.put("/reminders/read-all", authenticateToken, async (req, res) => {
  try {
    await prisma.smartReminder.updateMany({
      data: { isRead: true },
    });

    res.json({ message: "所有提醒已标记为已读" });
  } catch (error) {
    console.error("标记所有提醒为已读失败:", error);
    res.status(500).json({ error: "标记所有提醒为已读失败" });
  }
});

// ==================== 日历事件管理 ====================

// 获取日历事件列表
router.get("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        deadline: {
          include: {
            patent: {
              select: {
                id: true,
                title: true,
                patentNumber: true,
              },
            },
          },
        },
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    res.json(events);
  } catch (error) {
    console.error("获取日历事件失败:", error);
    res.status(500).json({ error: "获取日历事件失败" });
  }
});

// 创建日历事件
router.post("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const data = createCalendarEventSchema.parse(req.body);

    const event = await prisma.calendarEvent.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: {
        deadline: {
          include: {
            patent: {
              select: {
                id: true,
                title: true,
                patentNumber: true,
              },
            },
          },
        },
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("创建日历事件失败:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "数据验证失败", details: error.errors });
    } else {
      res.status(500).json({ error: "创建日历事件失败" });
    }
  }
});

// 更新日历事件
router.put("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        deadline: {
          include: {
            patent: {
              select: {
                id: true,
                title: true,
                patentNumber: true,
              },
            },
          },
        },
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    res.json(event);
  } catch (error) {
    console.error("更新日历事件失败:", error);
    res.status(500).json({ error: "更新日历事件失败" });
  }
});

// 删除日历事件
router.delete("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.calendarEvent.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("删除日历事件失败:", error);
    res.status(500).json({ error: "删除日历事件失败" });
  }
});

// ==================== 风险评估管理 ====================

// 获取风险评估列表
router.get("/risk-assessments", authenticateToken, async (req, res) => {
  try {
    const { riskLevel } = req.query;
    const where: any = {};

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    const assessments = await prisma.riskAssessment.findMany({
      where,
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
      orderBy: { assessmentDate: "desc" },
    });

    res.json(assessments);
  } catch (error) {
    console.error("获取风险评估失败:", error);
    res.status(500).json({ error: "获取风险评估失败" });
  }
});

// 创建风险评估
router.post("/risk-assessments", authenticateToken, async (req, res) => {
  try {
    const data = createRiskAssessmentSchema.parse(req.body);

    const assessment = await prisma.riskAssessment.create({
      data: {
        ...data,
        nextAssessmentDate: new Date(data.nextAssessmentDate),
      },
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error("创建风险评估失败:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "数据验证失败", details: error.errors });
    } else {
      res.status(500).json({ error: "创建风险评估失败" });
    }
  }
});

// 更新风险评估
router.put("/risk-assessments/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const assessment = await prisma.riskAssessment.update({
      where: { id },
      data: {
        ...data,
        nextAssessmentDate: data.nextAssessmentDate
          ? new Date(data.nextAssessmentDate)
          : undefined,
      },
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    res.json(assessment);
  } catch (error) {
    console.error("更新风险评估失败:", error);
    res.status(500).json({ error: "更新风险评估失败" });
  }
});

// 删除风险评估
router.delete("/risk-assessments/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.riskAssessment.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error("删除风险评估失败:", error);
    res.status(500).json({ error: "删除风险评估失败" });
  }
});

// ==================== 批量操作管理 ====================

// 获取批量操作列表
router.get("/batch-operations", authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const operations = await prisma.batchOperation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(operations);
  } catch (error) {
    console.error("获取批量操作失败:", error);
    res.status(500).json({ error: "获取批量操作失败" });
  }
});

// 创建批量操作
router.post("/batch-operations", authenticateToken, async (req, res) => {
  try {
    const { operationType, targetDeadlines, parameters } = req.body;

    const operation = await prisma.batchOperation.create({
      data: {
        operationType,
        targetDeadlines: JSON.stringify(targetDeadlines),
        parameters: parameters ? JSON.stringify(parameters) : null,
        status: "pending",
        progress: 0,
      },
    });

    res.status(201).json(operation);
  } catch (error) {
    console.error("创建批量操作失败:", error);
    res.status(500).json({ error: "创建批量操作失败" });
  }
});

// 执行批量操作
router.post(
  "/batch-operations/:id/execute",
  authenticateToken,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const operation = await prisma.batchOperation.update({
        where: { id },
        data: {
          status: "processing",
          progress: 0,
        },
      });

      // 这里可以实现具体的批量操作逻辑
      // 暂时返回更新后的操作记录
      res.json(operation);
    } catch (error) {
      console.error("执行批量操作失败:", error);
      res.status(500).json({ error: "执行批量操作失败" });
    }
  }
);

// ==================== 其他功能 ====================

// 期限延期
router.post("/:id/extend", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { days, reason } = req.body;

    const deadline = await prisma.deadline.findUnique({
      where: { id },
    });

    if (!deadline) {
      return res.status(404).json({ error: "期限记录不存在" });
    }

    const newDueDate = new Date(deadline.dueDate);
    newDueDate.setDate(newDueDate.getDate() + days);

    const updatedDeadline = await prisma.deadline.update({
      where: { id },
      data: {
        dueDate: newDueDate,
        deadlineDate: newDueDate, // 同时更新deadlineDate字段
        status: "extended",
        description: reason
          ? `${deadline.description || ""}\n\n延期原因: ${reason}`
          : deadline.description,
      },
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    // 计算新的剩余天数
    const today = new Date();
    const diffTime = newDueDate.getTime() - today.getTime();
    const newDaysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 返回扩展的期限数据，包含计算后的剩余天数
    const extendedDeadline = {
      ...updatedDeadline,
      deadlineType: updatedDeadline.type,
      deadlineDate: updatedDeadline.dueDate,
      daysUntilDeadline: newDaysUntilDeadline,
      patentNumber: updatedDeadline.patent?.patentNumber,
      patentTitle: updatedDeadline.patent?.title,
    };

    res.json(extendedDeadline);
  } catch (error) {
    console.error("期限延期失败:", error);
    res.status(500).json({ error: "期限延期失败" });
  }
});

// 标记期限为已完成
router.put("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { completionNotes } = req.body;

    // 先获取现有期限信息
    const existingDeadline = await prisma.deadline.findUnique({
      where: { id },
    });

    if (!existingDeadline) {
      return res.status(404).json({ error: "期限记录不存在" });
    }

    const updatedDeadline = await prisma.deadline.update({
      where: { id },
      data: {
        status: "completed",
        description: completionNotes
          ? `${
              existingDeadline.description || ""
            }\n\n完成说明: ${completionNotes}`
          : existingDeadline.description,
      },
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    res.json(updatedDeadline);
  } catch (error) {
    console.error("标记期限为已完成失败:", error);
    res.status(500).json({ error: "标记期限为已完成失败" });
  }
});

// 获取风险预警
router.get("/risk-warnings", authenticateToken, async (req, res) => {
  try {
    const [critical, high, medium, low] = await Promise.all([
      prisma.deadline.findMany({
        where: {
          status: "pending",
          priority: "high",
          dueDate: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }, // 3天内到期
        },
        include: {
          patent: {
            select: {
              id: true,
              title: true,
              patentNumber: true,
            },
          },
        },
      }),
      prisma.deadline.findMany({
        where: {
          status: "pending",
          priority: "high",
          dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7天内到期
        },
        include: {
          patent: {
            select: {
              id: true,
              title: true,
              patentNumber: true,
            },
          },
        },
      }),
      prisma.deadline.findMany({
        where: {
          status: "pending",
          priority: "medium",
          dueDate: { lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14天内到期
        },
        include: {
          patent: {
            select: {
              id: true,
              title: true,
              patentNumber: true,
            },
          },
        },
      }),
      prisma.deadline.findMany({
        where: {
          status: "pending",
          priority: "low",
          dueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30天内到期
        },
        include: {
          patent: {
            select: {
              id: true,
              title: true,
              patentNumber: true,
            },
          },
        },
      }),
    ]);

    res.json({
      critical,
      high,
      medium,
      low,
    });
  } catch (error) {
    console.error("获取风险预警失败:", error);
    res.status(500).json({ error: "获取风险预警失败" });
  }
});

// 创建期限记录
router.post("/", authenticateToken, async (req, res) => {
  try {
    const data = createDeadlineSchema.parse(req.body);

    // 获取专利信息
    const patent = await prisma.patent.findUnique({
      where: { id: data.patentId },
      select: { patentNumber: true, title: true },
    });

    if (!patent) {
      return res.status(404).json({ error: "专利不存在" });
    }

    // 计算剩余天数
    const dueDate = data.deadlineDate
      ? new Date(data.deadlineDate)
      : data.dueDate
      ? new Date(data.dueDate)
      : new Date();
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 创建期限记录
    const deadline = await prisma.deadline.create({
      data: {
        patentId: data.patentId,
        patentNumber: patent.patentNumber,
        patentTitle: patent.title,
        title:
          data.title ||
          `${data.deadlineType || data.type || "期限"} - ${
            patent.patentNumber
          }`,
        description: data.description || "",
        dueDate: dueDate,
        deadlineDate: dueDate,
        type: data.type || data.deadlineType || "other",
        deadlineType: data.deadlineType || data.type || "other",
        status: data.status || "pending",
        priority: data.priority || "medium",
        riskLevel: data.riskLevel || "medium",
        reminderLevel: "info",
        daysUntilDeadline: daysUntilDeadline,
        isCompleted: false,
        notes: data.notes || "",
      },
      include: {
        patent: {
          select: {
            id: true,
            patentNumber: true,
            title: true,
          },
        },
      },
    });

    res.status(201).json(deadline);
  } catch (error) {
    console.error("创建期限记录失败:", error);
    res.status(500).json({ error: "创建期限记录失败" });
  }
});

// 更新期限
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = updateDeadlineSchema.parse(req.body);

    // 处理日期字段
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // 处理日期字段 - 同时更新 dueDate 和 deadlineDate
    if (data.deadlineDate) {
      const newDate = new Date(data.deadlineDate);
      updateData.dueDate = newDate;
      updateData.deadlineDate = newDate; // 同时更新 deadlineDate 字段
    } else if (data.dueDate) {
      const newDate = new Date(data.dueDate);
      updateData.dueDate = newDate;
      updateData.deadlineDate = newDate; // 同时更新 deadlineDate 字段
    }

    // 处理 type 字段
    if (data.deadlineType) {
      updateData.type = data.deadlineType;
    }

    // 移除前端特有的字段，避免数据库错误
    delete updateData.patentNumber;
    delete updateData.patentTitle;

    const deadline = await prisma.deadline.update({
      where: { id },
      data: updateData,
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    // 计算剩余天数
    const today = new Date();
    const dueDate = new Date(deadline.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 返回扩展的期限数据
    const extendedDeadline = {
      ...deadline,
      deadlineType: deadline.type,
      deadlineDate: deadline.dueDate,
      daysUntilDeadline: diffDays,
      patentNumber: deadline.patent?.patentNumber,
      patentTitle: deadline.patent?.title,
    };

    res.json(extendedDeadline);
  } catch (error) {
    console.error("更新期限失败:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "数据验证失败", details: error.errors });
    } else {
      res.status(500).json({ error: "更新期限失败" });
    }
  }
});

// 删除期限
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // 级联删除关联数据
    await prisma.$transaction(async (tx) => {
      // 1. 删除关联的日历事件
      await tx.calendarEvent.deleteMany({
        where: { deadlineId: id },
      });

      // 2. 删除关联的智能提醒
      await tx.smartReminder.deleteMany({
        where: { deadlineId: id },
      });

      // 3. 删除期限记录
      await tx.deadline.delete({ where: { id } });
    });

    console.log(`✅ 期限 ${id} 及其关联数据删除成功`);
    res.status(204).send();
  } catch (error) {
    console.error("删除期限失败:", error);
    res.status(500).json({ error: "删除期限失败" });
  }
});

// 获取单个期限
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deadline = await prisma.deadline.findUnique({
      where: { id },
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    if (!deadline) {
      return res.status(404).json({ error: "期限记录不存在" });
    }

    // 计算剩余天数
    const today = new Date();
    const dueDate = new Date(deadline.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    res.json({
      ...deadline,
      daysUntilDeadline: diffDays,
    });
  } catch (error) {
    console.error("获取期限详情失败:", error);
    res.status(500).json({ error: "获取期限详情失败" });
  }
});

export default router;
