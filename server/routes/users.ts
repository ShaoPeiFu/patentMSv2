import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 获取用户活动记录
router.get("/:id/activities", authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "无效的用户ID" });
    }

    // 从数据库获取用户活动记录
    // 这里可以根据实际需求查询不同的活动类型
    const activities = await prisma.activityLog.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 20, // 限制返回最近20条记录
      select: {
        id: true,
        type: true,
        title: true,
        timestamp: true,
        details: true,
        ipAddress: true,
        userAgent: true,
      },
    });

    // 如果没有找到活动记录，返回空数组
    if (!activities || activities.length === 0) {
      return res.json({
        activities: [],
        message: "暂无活动记录",
      });
    }

    // 格式化活动记录
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type || "general",
      title: activity.title || "用户活动",
      timestamp: activity.timestamp,
      status: "success",
      details: activity.details || "",
    }));

    res.json({
      activities: formattedActivities,
      total: formattedActivities.length,
    });
  } catch (error) {
    console.error("获取用户活动记录失败:", error);
    res.status(500).json({
      error: "获取用户活动记录失败",
      details: error.message,
    });
  }
});

// 创建用户活动记录
router.post("/:id/activities", authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { type, title, status, details } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "无效的用户ID" });
    }

    if (!type || !title) {
      return res.status(400).json({ error: "活动类型和标题不能为空" });
    }

    // 创建新的活动记录
    const newActivity = await prisma.activityLog.create({
      data: {
        userId: userId,
        type: type,
        title: title,
        details: details || "",
        ipAddress: req.ip || req.connection.remoteAddress || "",
        userAgent: req.get("User-Agent") || "",
      },
    });

    res.status(201).json({
      message: "活动记录创建成功",
      activity: newActivity,
    });
  } catch (error) {
    console.error("创建用户活动记录失败:", error);
    res.status(500).json({
      error: "创建用户活动记录失败",
      details: error.message,
    });
  }
});

// 获取用户基本信息
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "无效的用户ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        department: true,
        role: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    res.json({ user });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({
      error: "获取用户信息失败",
      details: error.message,
    });
  }
});

// 更新用户信息
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { realName, email, phone, department } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "无效的用户ID" });
    }

    // 验证必填字段
    if (!realName || !email || !phone || !department) {
      return res.status(400).json({
        error: "所有字段都是必填的",
        missing: {
          realName: !realName,
          email: !email,
          phone: !phone,
          department: !department,
        },
      });
    }

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: userId }, // 排除当前用户
        },
      });

      if (existingUser) {
        return res.status(400).json({
          error: "该邮箱地址已被其他用户使用",
          existingUser: {
            id: existingUser.id,
            username: existingUser.username,
          },
        });
      }
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "邮箱格式不正确" });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "手机号格式不正确" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        realName: realName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department: department.trim(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        department: true,
        role: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "用户信息更新成功",
      user: updatedUser,
    });
  } catch (error) {
    console.error("更新用户信息失败:", error);

    // 处理Prisma错误
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      if (field === "email") {
        return res.status(400).json({
          error: "该邮箱地址已被其他用户使用",
          field: "email",
        });
      } else if (field === "username") {
        return res.status(400).json({
          error: "该用户名已被其他用户使用",
          field: "username",
        });
      }
    }

    res.status(500).json({
      error: "更新用户信息失败",
      details: error.message,
    });
  }
});

export default router;
