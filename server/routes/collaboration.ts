import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有频道
router.get("/channels", authenticateToken, async (req, res) => {
  try {
    const channels = await prisma.collaborationChannel.findMany({
      where: {
        status: "active",
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        status: channel.status,
        createdBy: channel.createdBy,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        creator: channel.user,
        memberCount: channel.members.length,
        members: channel.members.map((member) => ({
          id: member.user.id,
          name: member.user.realName || member.user.username,
          role: member.role,
          joinedAt: member.joinedAt,
        })),
      })),
    });
  } catch (error) {
    console.error("获取频道列表失败:", error);
    res.status(500).json({
      success: false,
      error: "获取频道列表失败",
      details: error.message,
    });
  }
});

// 创建新频道
router.post("/channels", authenticateToken, async (req, res) => {
  try {
    const { name, description, type, memberIds } = req.body;
    const userId = (req as any).user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "频道名称不能为空",
      });
    }

    // 创建频道
    const channel = await prisma.collaborationChannel.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        type: type || "general",
        createdBy: userId,
        members: {
          create: [
            // 创建者自动成为管理员
            {
              userId: userId,
              role: "admin",
            },
            // 添加其他成员
            ...(memberIds || []).map((memberId: number) => ({
              userId: memberId,
              role: "member",
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true,
              },
            },
          },
        },
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
      message: "频道创建成功",
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        status: channel.status,
        createdBy: channel.createdBy,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        creator: channel.user,
        memberCount: channel.members.length,
        members: channel.members.map((member) => ({
          id: member.user.id,
          name: member.user.realName || member.user.username,
          role: member.role,
          joinedAt: member.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error("创建频道失败:", error);
    res.status(500).json({
      success: false,
      error: "创建频道失败",
      details: error.message,
    });
  }
});

// 获取频道消息
router.get(
  "/channels/:channelId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const { page = 1, limit = 50 } = req.query;

      if (isNaN(channelId)) {
        return res.status(400).json({
          success: false,
          error: "无效的频道ID",
        });
      }

      // 检查用户是否是该频道的成员
      const membership = await prisma.collaborationChannelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: channelId,
            userId: (req as any).user.id,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: "您不是该频道的成员",
        });
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const messages = await prisma.collaborationMessage.findMany({
        where: {
          channelId: channelId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: skip,
        take: parseInt(limit as string),
      });

      const total = await prisma.collaborationMessage.count({
        where: {
          channelId: channelId,
        },
      });

      res.json({
        success: true,
        messages: messages.map((message) => ({
          id: message.id,
          channelId: message.channelId,
          authorId: message.userId,
          authorName: message.user.realName || message.user.username,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("获取频道消息失败:", error);
      res.status(500).json({
        success: false,
        error: "获取频道消息失败",
        details: error.message,
      });
    }
  }
);

// 发送消息
router.post(
  "/channels/:channelId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const { content, type = "text", metadata } = req.body;
      const userId = (req as any).user.id;

      if (isNaN(channelId)) {
        return res.status(400).json({
          success: false,
          error: "无效的频道ID",
        });
      }

      if (!content || content.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "消息内容不能为空",
        });
      }

      // 检查用户是否是该频道的成员
      const membership = await prisma.collaborationChannelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: channelId,
            userId: userId,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: "您不是该频道的成员",
        });
      }

      // 创建消息
      const message = await prisma.collaborationMessage.create({
        data: {
          channelId: channelId,
          userId: userId,
          content: content.trim(),
          type: type,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatar: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "消息发送成功",
        data: {
          id: message.id,
          channelId: message.channelId,
          authorId: message.userId,
          authorName: message.user.realName || message.user.username,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        },
      });
    } catch (error) {
      console.error("发送消息失败:", error);
      res.status(500).json({
        success: false,
        error: "发送消息失败",
        details: error.message,
      });
    }
  }
);

// 获取频道成员
router.get(
  "/channels/:channelId/members",
  authenticateToken,
  async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);

      if (isNaN(channelId)) {
        return res.status(400).json({
          success: false,
          error: "无效的频道ID",
        });
      }

      const members = await prisma.collaborationChannelMember.findMany({
        where: {
          channelId: channelId,
          status: "active",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realName: true,
              email: true,
              avatar: true,
              department: true,
              role: true,
            },
          },
        },
        orderBy: [
          { role: "asc" }, // 管理员在前
          { joinedAt: "asc" }, // 按加入时间排序
        ],
      });

      res.json({
        success: true,
        members: members.map((member) => ({
          id: member.user.id,
          name: member.user.realName || member.user.username,
          email: member.user.email,
          role: member.role,
          department: member.user.department,
          joinedAt: member.joinedAt,
          status: member.status,
        })),
      });
    } catch (error) {
      console.error("获取频道成员失败:", error);
      res.status(500).json({
        success: false,
        error: "获取频道成员失败",
        details: error.message,
      });
    }
  }
);

// 添加成员到频道
router.post(
  "/channels/:channelId/members",
  authenticateToken,
  async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const { userIds, role = "member" } = req.body;
      const currentUserId = (req as any).user.id;

      if (isNaN(channelId)) {
        return res.status(400).json({
          success: false,
          error: "无效的频道ID",
        });
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "请选择要添加的成员",
        });
      }

      // 检查当前用户是否有权限添加成员（必须是管理员或创建者）
      const membership = await prisma.collaborationChannelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: channelId,
            userId: currentUserId,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== "admin" && membership.role !== "moderator")
      ) {
        return res.status(403).json({
          success: false,
          error: "您没有权限添加成员",
        });
      }

      // 批量添加成员（使用循环创建替代 createMany）
      let addedCount = 0;
      const errors: string[]=[];

      for (const userId of userIds) {
        try {
          await prisma.collaborationChannelMember.create({
            data: {
              channelId: channelId,
              userId: userId,
              role: role,
            },
          });
          addedCount++;
        } catch (error: any) {
          // 如果是唯一约束冲突，说明用户已经是成员
          if (error.code === "P2002") {
            console.log(`用户 ${userId} 已经是频道成员`);
          } else {
            errors.push(`用户 ${userId}: ${error.message}`);
          }
        }
      }

      res.json({
        success: true,
        message: `成功添加 ${addedCount} 个成员${
          errors.length > 0 ? `，${errors.length} 个失败` : ""
        }`,
        addedCount: addedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("添加成员失败:", error);
      res.status(500).json({
        success: false,
        error: "添加成员失败",
        details: error.message,
      });
    }
  }
);

// 移除频道成员
router.delete(
  "/channels/:channelId/members/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const targetUserId = parseInt(req.params.userId);
      const currentUserId = (req as any).user.id;

      if (isNaN(channelId) || isNaN(targetUserId)) {
        return res.status(400).json({
          success: false,
          error: "无效的频道ID或用户ID",
        });
      }

      // 检查当前用户权限
      const currentUserMembership =
        await prisma.collaborationChannelMember.findUnique({
          where: {
            channelId_userId: {
              channelId: channelId,
              userId: currentUserId,
            },
          },
        });

      // 检查目标用户是否在频道中
      const targetUserMembership =
        await prisma.collaborationChannelMember.findUnique({
          where: {
            channelId_userId: {
              channelId: channelId,
              userId: targetUserId,
            },
          },
        });

      if (!targetUserMembership) {
        return res.status(404).json({
          success: false,
          error: "用户不在此频道中",
        });
      }

      // 权限检查：只有管理员可以移除成员，或者用户可以自己退出
      const canRemove =
        currentUserId === targetUserId || // 用户自己退出
        (currentUserMembership &&
          (currentUserMembership.role === "admin" ||
            currentUserMembership.role === "moderator"));

      if (!canRemove) {
        return res.status(403).json({
          success: false,
          error: "您没有权限移除此成员",
        });
      }

      // 检查是否尝试移除频道创建者
      const channel = await prisma.collaborationChannel.findUnique({
        where: { id: channelId },
        select: { createdBy: true },
      });

      if (
        channel?.createdBy === targetUserId &&
        currentUserId !== targetUserId
      ) {
        return res.status(403).json({
          success: false,
          error: "不能移除频道创建者",
        });
      }

      // 移除成员
      await prisma.collaborationChannelMember.delete({
        where: {
          channelId_userId: {
            channelId: channelId,
            userId: targetUserId,
          },
        },
      });

      // 获取被移除的用户信息
      const removedUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { realName: true, username: true },
      });

      res.json({
        success: true,
        message: `成功移除成员 ${
          removedUser?.realName || removedUser?.username
        }`,
      });
    } catch (error) {
      console.error("移除成员失败:", error);
      res.status(500).json({
        success: false,
        error: "移除成员失败",
        details: error.message,
      });
    }
  }
);

// 获取所有用户（用于添加成员时选择）
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        department: true,
        role: true,
        avatar: true,
      },
      orderBy: {
        realName: "asc",
      },
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      success: false,
      error: "获取用户列表失败",
      details: error.message,
    });
  }
});

// 获取任务列表
router.get("/tasks", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { status, priority, assigneeId, channelId } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = parseInt(assigneeId as string);
    if (channelId) where.channelId = parseInt(channelId as string);

    // 用户只能看到分配给自己的任务或自己创建的任务
    where.OR = [{ assigneeId: userId }, { createdBy: userId }];

    const tasks = await prisma.collaborationTask.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

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
        channelId: task.channelId,
        channelName: task.channel?.name,
        createdBy: task.createdBy,
        creatorName: task.creator.realName || task.creator.username,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
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

// 创建任务
router.post("/tasks", authenticateToken, async (req, res) => {
  try {
    const { title, description, assigneeId, dueDate, priority, channelId } =
      req.body;
    const createdBy = (req as any).user.id;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "任务标题不能为空",
      });
    }

    const task = await prisma.collaborationTask.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "medium",
        channelId: channelId ? parseInt(channelId) : null,
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
        creator: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

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
        channelId: task.channelId,
        channelName: task.channel?.name,
        createdBy: task.createdBy,
        creatorName: task.creator.realName || task.creator.username,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    });
  } catch (error) {
    console.error("创建任务失败:", error);
    res.status(500).json({
      success: false,
      error: "创建任务失败",
      details: error.message,
    });
  }
});

// 更新任务状态
router.patch("/tasks/:taskId", authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { status, priority, assigneeId, dueDate } = req.body;
    const userId = (req as any).user.id;

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: "无效的任务ID",
      });
    }

    // 检查任务是否存在
    const existingTask = await prisma.collaborationTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: "任务不存在",
      });
    }

    // 检查权限：只有任务创建者、分配者或管理员可以更新任务
    if (
      existingTask.createdBy !== userId &&
      existingTask.assigneeId !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: "您没有权限更新此任务",
      });
    }

    const updatedTask = await prisma.collaborationTask.update({
      where: { id: taskId },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId && { assigneeId: parseInt(assigneeId) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
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
        creator: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
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
        channelId: updatedTask.channelId,
        channelName: updatedTask.channel?.name,
        createdBy: updatedTask.createdBy,
        creatorName:
          updatedTask.creator.realName || updatedTask.creator.username,
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

export default router;
