import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  authenticateToken,
  requireRole,
  AuthenticatedRequest,
} from "./middleware/auth";
import deadlinesRouter from "./routes/deadlines";
import usersRouter from "./routes/users";
import collaborationRouter from "./routes/collaboration";
import createTasksRouter from "./routes/tasks";
import { encryptionService } from "./services/encryption";
import { BackupService } from "./services/backup";
import { LoggingService, LogLevel } from "./services/logging";
import ThreatDetectionService from "./services/threatDetection";
import ComplianceService from "./services/compliance";
import SecurityAuditService from "./services/securityAudit";

// 加载环境变量
dotenv.config();

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        realName: string;
        role: string;
        department: string;
      };
    }
  }
}

const app = express();
const prisma = new PrismaClient();

// 初始化服务
const backupService = new BackupService(prisma);
const loggingService = new LoggingService(prisma);
const threatDetectionService = new ThreatDetectionService(
  prisma,
  loggingService
);
const complianceService = new ComplianceService(prisma, loggingService);
const securityAuditService = new SecurityAuditService(prisma, loggingService);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 全局请求日志中间件
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log(`📦 请求体:`, req.body);
  console.log(`🔑 请求头:`, req.headers);

  // 检查是否是用户更新请求
  if (req.method === "PUT" && req.url.match(/^\/api\/users\/\d+$/)) {
    console.log(`🎯 检测到用户更新请求: ${req.url}`);
  }

  next();
});

// JWT密钥
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    version: "1.0.0",
  });
});

// 测试认证中间件接口已删除

// 用户认证路由 - 公开注册（无需认证）
app.post("/api/auth/register", async (req: AuthenticatedRequest, res) => {
  try {
    const { username, email, password, realName, phone, department, role } =
      req.body;

    // 验证输入
    const userSchema = z.object({
      username: z.string().min(3).max(20),
      email: z.string().email(),
      password: z.string().min(6),
      realName: z.string().min(2),
      phone: z.string().optional(),
      department: z.string(),
      role: z.enum(["user", "admin", "reviewer"]).default("user"),
    });

    const validatedData = userSchema.parse(req.body);

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validatedData.username },
          { email: validatedData.email },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "用户名或邮箱已存在" });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        realName: validatedData.realName,
        phone: validatedData.phone,
        department: validatedData.department,
        role: validatedData.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    // 生成JWT令牌
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        role: user.role,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ error: "注册失败" });
  }
});

// 管理员创建用户 - 需要管理员权限
app.post(
  "/api/auth/create-user",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { username, email, password, realName, phone, department, role } =
        req.body;

      // 验证输入
      const userSchema = z.object({
        username: z.string().min(3).max(20),
        email: z.string().email(),
        password: z.string().min(6),
        realName: z.string().min(2),
        phone: z.string().optional(),
        department: z.string(),
        role: z.enum(["user", "admin", "reviewer"]).default("user"),
      });

      const validatedData = userSchema.parse(req.body);

      // 检查用户是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: validatedData.username },
            { email: validatedData.email },
          ],
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: "用户名或邮箱已存在" });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          username: validatedData.username,
          email: validatedData.email,
          password: hashedPassword,
          realName: validatedData.realName,
          phone: validatedData.phone,
          department: validatedData.department,
          role: validatedData.role,
        },
        select: {
          id: true,
          username: true,
          email: true,
          realName: true,
          role: true,
          department: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        user,
        message: "用户创建成功",
      });
    } catch (error) {
      console.error("创建用户错误:", error);
      res.status(500).json({ error: "创建用户失败" });
    }
  }
);

app.post("/api/auth/login", async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 生成JWT令牌
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        role: user.role,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        role: user.role,
        department: user.department,
      },
      token,
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ error: "登录失败" });
  }
});

// 检查用户名是否存在（无需认证）
app.get(
  "/api/auth/check-username/:username",
  async (req: AuthenticatedRequest, res) => {
    try {
      const { username } = req.params;

      const existingUser = await prisma.user.findFirst({
        where: { username },
        select: { id: true },
      });

      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error("检查用户名失败:", error);
      res.status(500).json({ error: "检查失败" });
    }
  }
);

// 检查邮箱是否存在（无需认证）
app.get(
  "/api/auth/check-email/:email",
  async (req: AuthenticatedRequest, res) => {
    try {
      const { email } = req.params;

      const existingUser = await prisma.user.findFirst({
        where: { email },
        select: { id: true },
      });

      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error("检查邮箱失败:", error);
      res.status(500).json({ error: "检查失败" });
    }
  }
);

// 用户路由
app.get(
  "/api/users",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, role, search, department } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // 构建查询条件
      const where: any = {};
      if (role) where.role = role;
      if (department) where.department = department;
      if (search) {
        where.OR = [
          { username: { contains: search as string } },
          { realName: { contains: search as string } },
          { email: { contains: search as string } },
        ];
      }

      // 获取用户总数
      const total = await prisma.user.count({ where });

      // 获取用户列表
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          realName: true,
          phone: true,
          role: true,
          department: true,
          createdAt: true,
          lastLoginAt: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      });

      res.json({
        users,
        total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error("获取用户列表失败:", error);
      res.status(500).json({ error: "获取用户列表失败" });
    }
  }
);

// 获取当前用户信息
app.get(
  "/api/users/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    // 认证中间件已经验证了token，req.user 一定存在
    if (!req.user) {
      return res.status(401).json({ error: "用户未认证" });
    }

    // 直接返回认证中间件设置的用户信息
    res.json(req.user);
  }
);

app.get(
  "/api/users/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          realName: true,
          phone: true,
          role: true,
          department: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "用户不存在" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "获取用户信息失败" });
    }
  }
);

// 旧的用户更新路由已删除，使用新的路由逻辑

// 创建新用户
app.post(
  "/api/users",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { username, email, password, realName, phone, department, role } =
        req.body;

      // 验证输入
      if (
        !username ||
        !email ||
        !password ||
        !realName ||
        !department ||
        !role
      ) {
        return res.status(400).json({ error: "必填字段不能为空" });
      }

      // 检查用户名是否已存在
      const existingUsername = await prisma.user.findFirst({
        where: { username },
      });

      if (existingUsername) {
        return res.status(400).json({ error: "用户名已存在" });
      }

      // 检查邮箱是否已存在
      const existingEmail = await prisma.user.findFirst({
        where: { email },
      });

      if (existingEmail) {
        return res.status(400).json({ error: "邮箱已存在" });
      }
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          realName,
          phone,
          department,
          role,
        },
        select: {
          id: true,
          username: true,
          email: true,
          realName: true,
          phone: true,
          role: true,
          department: true,
          createdAt: true,
        },
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("创建用户失败:", error);
      res.status(500).json({ error: "创建用户失败" });
    }
  }
);

// 删除用户
app.delete(
  "/api/users/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "用户不存在" });
      }

      // 检查是否为最后一个管理员
      if (user.role === "admin") {
        const adminCount = await prisma.user.count({
          where: { role: "admin" },
        });
        if (adminCount <= 1) {
          return res.status(400).json({ error: "不能删除最后一个管理员" });
        }
      }

      // 删除用户（使用事务确保数据一致性）
      await prisma.$transaction(async (tx) => {
        try {
          // 删除用户相关的所有数据（只删除确实存在的模型）
          await tx.patent.deleteMany({ where: { userId } });
          await tx.activity.deleteMany({ where: { userId } });
          await tx.task.deleteMany({ where: { assigneeId: userId } });
          await tx.comment.deleteMany({ where: { userId } });

          await tx.patentDocument.deleteMany({ where: { uploadedBy: userId } });

          // 最后删除用户
          await tx.user.delete({ where: { id: userId } });
        } catch (error) {
          console.error("删除用户关联数据失败:", error);
          throw new Error("删除用户关联数据失败");
        }
      });

      res.json({ success: true, message: "用户删除成功" });
    } catch (error) {
      console.error("删除用户失败:", error);
      res.status(500).json({ error: "删除用户失败" });
    }
  }
);

// 修改密码
app.put(
  "/api/users/:id/password",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { oldPassword, newPassword } = req.body;

      // 验证输入
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "旧密码和新密码不能为空" });
      }

      // 验证新密码长度
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "新密码长度不能少于6位" });
      }

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, role: true },
      });

      if (!user) {
        return res.status(404).json({ error: "用户不存在" });
      }

      // 检查权限：只能修改自己的密码，或者管理员可以修改任何用户的密码
      if (req.user!.id !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "权限不足" });
      }

      // 验证旧密码
      const isValidOldPassword = await bcrypt.compare(
        oldPassword,
        user.password
      );
      if (!isValidOldPassword) {
        return res.status(400).json({ error: "旧密码不正确" });
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      res.json({ success: true, message: "密码修改成功" });
    } catch (error) {
      console.error("修改密码失败:", error);
      res.status(500).json({ error: "修改密码失败" });
    }
  }
);

// 专利路由
app.get(
  "/api/patents",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        categoryId,
        search,
      } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};

      if (status) where.status = status;
      if (type) where.type = type;
      if (categoryId) where.categoryId = parseInt(categoryId as string);
      if (search) {
        where.OR = [
          { title: { contains: search as string } },
          { patentNumber: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [patents, total] = await Promise.all([
        prisma.patent.findMany({
          where,
          include: {
            user: {
              select: { id: true, realName: true, username: true },
            },
            category: {
              select: { id: true, name: true, description: true },
            },
            documents: true, // 添加文档信息
            fees: true, // 添加费用信息
            deadlines: true, // 添加截止日期信息
          },
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.patent.count({ where }),
      ]);

      res.json({
        patents,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取专利列表失败" });
    }
  }
);

app.post(
  "/api/patents",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const patentData = {
        ...req.body,
        userId: req.user.id,
        applicationDate: new Date(req.body.applicationDate),
        keywords: req.body.keywords ? JSON.stringify(req.body.keywords) : null,
        applicants: req.body.applicants
          ? JSON.stringify(req.body.applicants)
          : null,
        inventors: req.body.inventors
          ? JSON.stringify(req.body.inventors)
          : null,
        drawings: req.body.drawings ? JSON.stringify(req.body.drawings) : null,
      };

      // 移除不存在的字段
      delete patentData.documents;

      const patent = await prisma.patent.create({
        data: patentData,
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
          category: {
            select: { id: true, name: true, description: true },
          },
        },
      });

      res.json(patent);
    } catch (error) {
      console.error("创建专利失败:", error);
      res.status(500).json({
        error: "创建专利失败",
        details: error.message,
        code: error.code,
      });
    }
  }
);

app.get(
  "/api/patents/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const patent = await prisma.patent.findUnique({
        where: { id: patentId },
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
          fees: true,
          deadlines: true,
          documents: true, // 添加文档关联
        },
      });

      if (!patent) {
        return res.status(404).json({ error: "专利不存在" });
      }

      res.json(patent);
    } catch (error) {
      res.status(500).json({ error: "获取专利详情失败" });
    }
  }
);

app.put(
  "/api/patents/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 只允许更新 schema 中存在的字段
      const allowedFields = [
        "title",
        "description",
        "patentNumber",
        "status",
        "type",
        "categoryId",
        "applicationDate",
        "publicationDate",
        "grantDate",
        "expirationDate",
        "priority",
        "technicalField",
        "keywords",
        "applicants",
        "inventors",
        "abstract",
        "claims",
        "drawings",
        "familyId",
      ];

      const updateData: any = {};

      // 只处理允许的字段
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (
            ["keywords", "applicants", "inventors", "drawings"].includes(field)
          ) {
            updateData[field] = JSON.stringify(req.body[field]);
          } else if (field === "claims") {
            // claims 字段需要特殊处理，确保是字符串类型
            if (Array.isArray(req.body[field])) {
              updateData[field] = req.body[field].join(", ");
            } else {
              updateData[field] = req.body[field];
            }
          } else {
            updateData[field] = req.body[field];
          }
        }
      });

      // 自动更新 updatedAt 字段
      updateData.updatedAt = new Date();

      const patent = await prisma.patent.update({
        where: { id: patentId },
        data: updateData,
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(patent);
    } catch (error) {
      console.error("更新专利失败:", error);
      res.status(500).json({ error: "更新专利失败" });
    }
  }
);

app.delete(
  "/api/patents/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 检查专利是否存在
      const patent = await prisma.patent.findUnique({
        where: { id: patentId },
      });

      if (!patent) {
        return res.status(404).json({ error: "专利不存在" });
      }

      // 使用事务删除专利及其所有关联数据
      await prisma.$transaction(async (tx) => {
        // 先删除所有关联记录
        await tx.patentDocument.deleteMany({
          where: { patentId },
        });

        await tx.fee.deleteMany({
          where: { patentId },
        });

        await tx.deadline.deleteMany({
          where: { patentId },
        });

        await tx.smartReminder.deleteMany({
          where: { patentId },
        });

        await tx.calendarEvent.deleteMany({
          where: { patentId },
        });

        await tx.riskAssessment.deleteMany({
          where: { patentId },
        });

        await tx.patentEvaluation.deleteMany({
          where: { patentId },
        });

        await tx.patentCitation.deleteMany({
          where: {
            OR: [{ citingPatentId: patentId }, { citedPatentId: patentId }],
          },
        });

        // 最后删除专利
        await tx.patent.delete({
          where: { id: patentId },
        });
      });

      res.json({ success: true, message: "专利删除成功" });
    } catch (error) {
      console.error("删除专利失败:", error);
      res.status(500).json({ error: "删除专利失败", details: error.message });
    }
  }
);

// 专利族管理API
app.get(
  "/api/patents/:id/family",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const patent = await prisma.patent.findUnique({
        where: { id: patentId },
        include: {
          family: true,
        },
      });

      if (!patent) {
        return res.status(404).json({ error: "专利不存在" });
      }

      res.json(patent.family);
    } catch (error) {
      res.status(500).json({ error: "获取专利族失败" });
    }
  }
);

app.post(
  "/api/patent-families",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, patentIds } = req.body;

      const family = await prisma.patentFamily.create({
        data: {
          name,
          description,
          patents: {
            connect: patentIds.map((id: number) => ({ id })),
          },
        },
        include: {
          patents: true,
        },
      });

      res.json(family);
    } catch (error) {
      res.status(500).json({ error: "创建专利族失败" });
    }
  }
);

app.put(
  "/api/patent-families/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const familyId = parseInt(req.params.id);
      const { name, description, patentIds } = req.body;

      const family = await prisma.patentFamily.update({
        where: { id: familyId },
        data: {
          name,
          description,
          patents: {
            set: patentIds.map((id: number) => ({ id })),
          },
        },
        include: {
          patents: true,
        },
      });

      res.json(family);
    } catch (error) {
      res.status(500).json({ error: "更新专利族失败" });
    }
  }
);

app.delete(
  "/api/patent-families/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const familyId = parseInt(req.params.id);

      await prisma.patentFamily.delete({
        where: { id: familyId },
      });

      res.json({ message: "专利族删除成功" });
    } catch (error) {
      res.status(500).json({ error: "删除专利族失败" });
    }
  }
);

// 专利评估API
app.get(
  "/api/patents/:id/evaluations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      const evaluations = await prisma.patentEvaluation.findMany({
        where: { patentId },
        include: {
          evaluator: {
            select: { id: true, realName: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ error: "获取专利评估失败" });
    }
  }
);

app.post(
  "/api/patents/:id/evaluations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const { score, criteria, comments, recommendations } = req.body;

      const evaluation = await prisma.patentEvaluation.create({
        data: {
          patentId,
          evaluatorId: req.user!.id,
          score: parseFloat(score),
          criteria: JSON.stringify(criteria),
          comments,
          recommendations: JSON.stringify(recommendations),
        },
        include: {
          evaluator: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ error: "创建专利评估失败" });
    }
  }
);

app.get(
  "/api/patents/:id/evaluations/stats",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      const evaluations = await prisma.patentEvaluation.findMany({
        where: { patentId },
      });

      const stats = {
        totalEvaluations: evaluations.length,
        averageScore:
          evaluations.length > 0
            ? evaluations.reduce((sum, e) => sum + e.score, 0) /
              evaluations.length
            : 0,
        scoreDistribution: {
          excellent: evaluations.filter((e) => e.score >= 90).length,
          good: evaluations.filter((e) => e.score >= 70 && e.score < 90).length,
          fair: evaluations.filter((e) => e.score >= 50 && e.score < 70).length,
          poor: evaluations.filter((e) => e.score < 50).length,
        },
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "获取评估统计失败" });
    }
  }
);

// 专利引用关系API
app.get(
  "/api/patents/:id/citations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      const citations = await prisma.patentCitation.findMany({
        where: {
          OR: [{ citingPatentId: patentId }, { citedPatentId: patentId }],
        },
        include: {
          citingPatent: true,
          citedPatent: true,
        },
      });

      res.json(citations);
    } catch (error) {
      res.status(500).json({ error: "获取引用关系失败" });
    }
  }
);

// 获取被引用专利
app.get(
  "/api/patents/:id/cited-by",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      const citedBy = await prisma.patentCitation.findMany({
        where: {
          citedPatentId: patentId,
        },
        include: {
          citingPatent: true,
        },
      });

      res.json(citedBy);
    } catch (error) {
      res.status(500).json({ error: "获取被引用专利失败" });
    }
  }
);

app.post(
  "/api/patents/:id/citations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const citingPatentId = parseInt(req.params.id);
      const { citedPatentId, citationType, notes } = req.body;

      const citation = await prisma.patentCitation.create({
        data: {
          citingPatentId,
          citedPatentId,
          citationType,
          notes,
        },
        include: {
          citingPatent: true,
          citedPatent: true,
        },
      });

      res.json(citation);
    } catch (error) {
      res.status(500).json({ error: "添加引用关系失败" });
    }
  }
);

app.delete(
  "/api/patents/:id/citations/:citationId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const citationId = parseInt(req.params.citationId);

      await prisma.patentCitation.delete({
        where: { id: citationId },
      });

      res.json({ message: "引用关系删除成功" });
    } catch (error) {
      res.status(500).json({ error: "删除引用关系失败" });
    }
  }
);

// 专利族统计API
app.get(
  "/api/patent-families/:id/statistics",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const familyId = parseInt(req.params.id);

      const family = await prisma.patentFamily.findUnique({
        where: { id: familyId },
        include: {
          patents: true,
        },
      });

      if (!family) {
        return res.status(404).json({ error: "专利族不存在" });
      }

      const statistics = {
        totalPatents: family.patents.length,
        statuses: Array.from(new Set(family.patents.map((p) => p.status))),
        types: Array.from(new Set(family.patents.map((p) => p.type))),
        averagePatents: family.patents.length,
      };

      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: "获取统计信息失败" });
    }
  }
);

// 专利监控API
app.post(
  "/api/patents/:id/monitor",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const { monitorType, frequency, alertEmail } = req.body;

      // 模拟创建监控
      const monitor = {
        id: Date.now(),
        patentId,
        monitorType,
        frequency,
        alertEmail,
        status: "active",
        createdAt: new Date(),
      };

      res.json(monitor);
    } catch (error) {
      res.status(500).json({ error: "创建监控失败" });
    }
  }
);

app.get(
  "/api/patents/:id/monitor",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 模拟获取监控信息
      const monitors = [
        {
          id: 1,
          patentId,
          monitorType: "status_change",
          frequency: "daily",
          alertEmail: "user@example.com",
          status: "active",
          createdAt: new Date(),
        },
      ];

      res.json(monitors);
    } catch (error) {
      res.status(500).json({ error: "获取监控信息失败" });
    }
  }
);

// 专利预警API
app.get(
  "/api/patents/alerts",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { type, severity } = req.query;

      // 模拟获取预警信息
      const alerts = [
        {
          id: 1,
          type: "deadline_approaching",
          severity: "high",
          title: "专利费用即将到期",
          description: "专利CN123456789的费用将在3天后到期",
          patentId: 1,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: 2,
          type: "status_change",
          severity: "medium",
          title: "专利状态变更",
          description: "专利CN987654321的状态已更新为已授权",
          patentId: 2,
          createdAt: new Date(),
        },
      ];

      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "获取预警信息失败" });
    }
  }
);

// 专利质量评估API
app.post(
  "/api/patents/:id/quality-assessment",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 模拟质量评估
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const assessment = {
        id: Date.now(),
        patentId,
        status: "completed",
        results: {
          overallScore: Math.random() * 100,
          technicalQuality: Math.random() * 100,
          legalQuality: Math.random() * 100,
          commercialQuality: Math.random() * 100,
          strengths: ["技术方案清晰", "权利要求撰写规范", "实施例充分"],
          weaknesses: ["背景技术描述不够详细", "附图说明可以更清晰"],
          recommendations: [
            "补充背景技术信息",
            "优化附图说明",
            "加强权利要求保护范围",
          ],
        },
        createdAt: new Date(),
      };

      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "质量评估失败" });
    }
  }
);

// 高级检索API
app.post(
  "/api/patents/advanced-search",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        keywords,
        technicalField,
        applicant,
        inventor,
        dateRange,
        status,
        type,
        categoryId,
      } = req.body;

      // 构建查询条件
      const where: any = {};

      if (keywords) {
        where.OR = [
          { title: { contains: keywords } },
          { description: { contains: keywords } },
          { abstract: { contains: keywords } },
        ];
      }

      if (technicalField) where.technicalField = { contains: technicalField };
      if (status) where.status = status;
      if (type) where.type = type;
      if (categoryId) where.categoryId = parseInt(categoryId);

      if (dateRange) {
        if (dateRange.start) {
          where.applicationDate = { gte: new Date(dateRange.start) };
        }
        if (dateRange.end) {
          where.applicationDate = {
            ...where.applicationDate,
            lte: new Date(dateRange.end),
          };
        }
      }

      const patents = await prisma.patent.findMany({
        where,
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
          category: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(patents);
    } catch (error) {
      res.status(500).json({ error: "高级检索失败" });
    }
  }
);

// 专利统计API
app.get(
  "/api/patents/statistics",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { timeRange = "year" } = req.query;

      // 从数据库获取真实统计数据
      const [
        totalPatents,
        pendingPatents,
        approvedPatents,
        rejectedPatents,
        expiredPatents,
        patentsByType,
        patentsByStatus,
      ] = await Promise.all([
        // 总专利数
        prisma.patent.count(),

        // 待审核专利数
        prisma.patent.count({
          where: { status: "pending" },
        }),

        // 已授权专利数
        prisma.patent.count({
          where: { status: "approved" },
        }),

        // 被拒绝专利数
        prisma.patent.count({
          where: { status: "rejected" },
        }),

        // 过期专利数
        prisma.patent.count({
          where: { status: "expired" },
        }),

        // 按类型统计
        prisma.patent.groupBy({
          by: ["type"],
          _count: { type: true },
        }),

        // 按状态统计
        prisma.patent.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
      ]);

      // 构建统计数据
      const statistics = {
        totalPatents,
        pendingPatents,
        approvedPatents,
        rejectedPatents,
        expiredPatents,
        patentsByType: patentsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        patentsByStatus: patentsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        // 生成最近6个月的申请数据
        monthlyApplications: await generateMonthlyApplications(
          timeRange as string
        ),
      };

      res.json(statistics);
    } catch (error) {
      console.error("获取专利统计数据失败:", error);
      res.status(500).json({ error: "获取统计数据失败" });
    }
  }
);

// 生成月度申请数据的辅助函数
async function generateMonthlyApplications(timeRange: string) {
  const months: { month: string; count: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 7);

    // 统计该月的专利申请数
    const count = await prisma.patent.count({
      where: {
        applicationDate: {
          gte: date,
          lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        },
      },
    });

    months.push({
      month: monthStr,
      count,
    });
  }

  return months;
}

// 专利交易API
app.post(
  "/api/patents/:id/transactions",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const { transactionType, amount, currency, buyer, seller, terms } =
        req.body;

      // 模拟创建交易记录
      const transaction = {
        id: Date.now(),
        patentId,
        transactionType,
        amount,
        currency,
        buyer,
        seller,
        terms,
        status: "pending",
        createdAt: new Date(),
      };

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "创建交易记录失败" });
    }
  }
);

app.get(
  "/api/patents/:id/transactions",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 模拟获取交易记录
      const transactions = [
        {
          id: 1,
          patentId,
          transactionType: "sale",
          amount: 500000,
          currency: "CNY",
          buyer: "公司A",
          seller: "公司B",
          status: "completed",
          createdAt: new Date(),
        },
      ];

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "获取交易记录失败" });
    }
  }
);

// 专利诉讼API
app.post(
  "/api/patents/:id/litigations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const { caseNumber, court, plaintiff, defendant, caseType, description } =
        req.body;

      // 模拟创建诉讼记录
      const litigation = {
        id: Date.now(),
        patentId,
        caseNumber,
        court,
        plaintiff,
        defendant,
        caseType,
        description,
        status: "active",
        createdAt: new Date(),
      };

      res.json(litigation);
    } catch (error) {
      res.status(500).json({ error: "创建诉讼记录失败" });
    }
  }
);

app.get(
  "/api/patents/:id/litigations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 模拟获取诉讼记录
      const litigations = [
        {
          id: 1,
          patentId,
          caseNumber: "2024-001",
          court: "北京知识产权法院",
          plaintiff: "专利权人A",
          defendant: "侵权方B",
          caseType: "专利侵权",
          status: "active",
          createdAt: new Date(),
        },
      ];

      res.json(litigations);
    } catch (error) {
      res.status(500).json({ error: "获取诉讼记录失败" });
    }
  }
);

// 专利许可API
app.post(
  "/api/patents/:id/licenses",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const { licensee, licenseType, territory, duration, royalty, terms } =
        req.body;

      // 模拟创建许可记录
      const license = {
        id: Date.now(),
        patentId,
        licensee,
        licenseType,
        territory,
        duration,
        royalty,
        terms,
        status: "active",
        createdAt: new Date(),
      };

      res.json(license);
    } catch (error) {
      res.status(500).json({ error: "创建许可记录失败" });
    }
  }
);

app.get(
  "/api/patents/:id/licenses",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 模拟获取许可记录
      const licenses = [
        {
          id: 1,
          patentId,
          licensee: "公司C",
          licenseType: "独占许可",
          territory: "中国",
          duration: "5年",
          royalty: "5%",
          status: "active",
          createdAt: new Date(),
        },
      ];

      res.json(licenses);
    } catch (error) {
      res.status(500).json({ error: "获取许可记录失败" });
    }
  }
);

// 任务路由已移至 server/routes/tasks.ts 中处理

// 费用路由
app.get(
  "/api/patents/:patentId/fees",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.patentId);
      const fees = await prisma.fee.findMany({
        where: { patentId },
        orderBy: { dueDate: "asc" },
      });
      res.json(fees);
    } catch (error) {
      res.status(500).json({ error: "获取费用列表失败" });
    }
  }
);

app.post(
  "/api/patents/:patentId/fees",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.patentId);
      const feeData = {
        ...req.body,
        patentId,
        dueDate: new Date(req.body.dueDate),
      };

      const fee = await prisma.fee.create({
        data: feeData,
      });

      res.json(fee);
    } catch (error) {
      res.status(500).json({ error: "创建费用失败" });
    }
  }
);

// 截止日期路由
app.get(
  "/api/patents/:patentId/deadlines",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.patentId);
      const deadlines = await prisma.deadline.findMany({
        where: { patentId },
        orderBy: { dueDate: "asc" },
      });
      res.json(deadlines);
    } catch (error) {
      res.status(500).json({ error: "获取截止日期列表失败" });
    }
  }
);

app.post(
  "/api/patents/:patentId/deadlines",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.patentId);
      const deadlineData = {
        ...req.body,
        patentId,
        dueDate: new Date(req.body.dueDate),
      };

      const deadline = await prisma.deadline.create({
        data: deadlineData,
      });

      res.json(deadline);
    } catch (error) {
      res.status(500).json({ error: "创建截止日期失败" });
    }
  }
);

// 统计路由
app.get(
  "/api/stats",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const [
        totalPatents,
        pendingPatents,
        approvedPatents,
        totalUsers,
        totalTasks,
        pendingTasks,
      ] = await Promise.all([
        prisma.patent.count(),
        prisma.patent.count({ where: { status: "pending" } }),
        prisma.patent.count({ where: { status: "approved" } }),
        prisma.user.count(),
        prisma.task.count(),
        prisma.task.count({ where: { status: "todo" } }),
      ]);

      res.json({
        patents: {
          total: totalPatents,
          pending: pendingPatents,
          approved: approvedPatents,
        },
        users: {
          total: totalUsers,
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取统计数据失败" });
    }
  }
);

// 活动记录路由
app.get(
  "/api/activities",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, userId, type } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (userId) where.userId = parseInt(userId as string);
      if (type) where.type = type;

      const [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          include: {
            user: {
              select: { id: true, realName: true, username: true },
            },
          },
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.activity.count({ where }),
      ]);

      res.json({
        activities,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取活动记录失败" });
    }
  }
);

app.post(
  "/api/activities",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      // 映射前端字段到后端字段
      const activityData = {
        type: req.body.type,
        title: req.body.title,
        description: req.body.description,
        targetId: req.body.targetId,
        targetName: req.body.targetName,
        status: req.body.status || "success",
        statusText: req.body.statusText,
        metadata: req.body.metadata ? JSON.stringify(req.body.metadata) : null,
        userId: req.user.id,
      };

      const activity = await prisma.activity.create({
        data: activityData,
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      // 返回前端期望的格式
      const response = {
        ...activity,
        timestamp: activity.createdAt,
        userName: req.user.realName,
      };

      res.json(response);
    } catch (error) {
      console.error("创建活动记录失败:", error);
      res.status(500).json({ error: "创建活动记录失败" });
    }
  }
);

// 评论路由
app.get(
  "/api/comments",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { targetId, targetType, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (targetId) where.targetId = parseInt(targetId as string);
      if (targetType) where.targetType = targetType;

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                realName: true,
                username: true,
                avatar: true,
              },
            },
          },
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.comment.count({ where }),
      ]);

      res.json({
        comments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取评论失败" });
    }
  }
);

app.post(
  "/api/comments",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const commentData = {
        ...req.body,
        userId: req.user.id,
      };

      const comment = await prisma.comment.create({
        data: commentData,
        include: {
          user: {
            select: { id: true, realName: true, username: true, avatar: true },
          },
        },
      });

      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: "创建评论失败" });
    }
  }
);

app.put(
  "/api/comments/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { content } = req.body;

      // 检查权限：只能编辑自己的评论
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return res.status(404).json({ error: "评论不存在" });
      }

      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      if (comment.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "只能编辑自己的评论" });
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
          user: {
            select: { id: true, realName: true, username: true, avatar: true },
          },
        },
      });

      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ error: "更新评论失败" });
    }
  }
);

app.delete(
  "/api/comments/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const commentId = parseInt(req.params.id);

      // 检查权限：只能删除自己的评论或管理员
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return res.status(404).json({ error: "评论不存在" });
      }

      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      if (comment.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "只能删除自己的评论" });
      }

      await prisma.comment.delete({
        where: { id: commentId },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "删除评论失败" });
    }
  }
);

// 合同路由
app.get(
  "/api/contracts",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;

      const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.contract.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          contracts,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取合同列表失败" });
    }
  }
);

app.post(
  "/api/contracts",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log("🔍 创建合同请求数据:", req.body);

      // 只提取数据库中存在的字段
      const contractData = {
        title: req.body.title,
        contractNumber: req.body.contractNumber,
        type: req.body.type,
        status: req.body.status || "draft",
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        amount: req.body.amount || null,
        currency: req.body.currency || "CNY",
        description: req.body.description || null,
        terms: req.body.terms || null,
        parties: req.body.parties
          ? Array.isArray(req.body.parties)
            ? JSON.stringify(req.body.parties)
            : req.body.parties
          : null,
        documents: req.body.documents
          ? Array.isArray(req.body.documents)
            ? JSON.stringify(req.body.documents)
            : req.body.documents
          : null,
      };

      console.log("🔄 处理后的合同数据:", contractData);

      const contract = await prisma.contract.create({
        data: contractData,
      });

      console.log("✅ 合同创建成功:", contract.id);
      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      console.error("❌ 创建合同失败:", error);
      console.error("错误详情:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });

      if (error.code === "P2002") {
        res.status(400).json({
          error: "合同编号已存在",
          details: "请使用不同的合同编号",
        });
      } else {
        res.status(500).json({
          error: "创建合同失败",
          details: error.message,
        });
      }
    }
  }
);

app.put(
  "/api/contracts/:id",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log("🔍 更新合同请求数据:", { id, data: req.body });

      // 检查合同是否存在
      const existingContract = await prisma.contract.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingContract) {
        return res.status(404).json({
          error: "合同不存在",
          details: `合同ID ${id} 不存在`,
        });
      }

      // 只提取数据库中存在的字段进行更新
      const updateData = {
        title: req.body.title || existingContract.title,
        contractNumber:
          req.body.contractNumber || existingContract.contractNumber,
        type: req.body.type || existingContract.type,
        status: req.body.status || existingContract.status,
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : existingContract.startDate,
        endDate: req.body.endDate
          ? new Date(req.body.endDate)
          : existingContract.endDate,
        amount:
          req.body.amount !== undefined
            ? req.body.amount
            : existingContract.amount,
        currency: req.body.currency || existingContract.currency,
        description:
          req.body.description !== undefined
            ? req.body.description
            : existingContract.description,
        terms:
          req.body.terms !== undefined
            ? req.body.terms
            : existingContract.terms,
        parties: req.body.parties
          ? Array.isArray(req.body.parties)
            ? JSON.stringify(req.body.parties)
            : req.body.parties
          : existingContract.parties,
        documents: req.body.documents
          ? Array.isArray(req.body.documents)
            ? JSON.stringify(req.body.documents)
            : req.body.documents
          : existingContract.documents,
        updatedAt: new Date(),
      };

      console.log("🔄 处理后的更新数据:", updateData);

      const contract = await prisma.contract.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      console.log("✅ 合同更新成功:", contract.id);
      res.json({ success: true, data: contract });
    } catch (error) {
      console.error("❌ 更新合同失败:", error);
      console.error("错误详情:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });

      if (error.code === "P2025") {
        res.status(404).json({
          error: "合同不存在",
          details: error.message,
        });
      } else if (error.code === "P2002") {
        res.status(400).json({
          error: "合同编号已存在",
          details: "请使用不同的合同编号",
        });
      } else {
        res.status(500).json({
          error: "更新合同失败",
          details: error.message,
        });
      }
    }
  }
);

app.delete(
  "/api/contracts/:id",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log("🔍 删除合同请求:", { id });

      await prisma.contract.delete({
        where: { id: parseInt(id) },
      });

      console.log("✅ 合同删除成功:", id);
      res.json({ success: true, data: null });
    } catch (error) {
      console.error("❌ 删除合同失败:", error);
      if (error.code === "P2025") {
        res.status(404).json({
          error: "合同不存在",
          details: error.message,
        });
      } else {
        res.status(500).json({
          error: "删除合同失败",
          details: error.message,
        });
      }
    }
  }
);

// 律师事务所路由
app.get(
  "/api/law-firms",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { contactPerson: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [lawFirms, total] = await Promise.all([
        prisma.lawFirm.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { name: "asc" },
        }),
        prisma.lawFirm.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          lawFirms,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取律师事务所列表失败" });
    }
  }
);

app.post(
  "/api/law-firms",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log("🔍 律师事务所创建请求数据:", req.body);

      // 处理specialties字段，将数组转换为JSON字符串
      const data = { ...req.body };
      if (data.specialties && Array.isArray(data.specialties)) {
        data.specialties = JSON.stringify(data.specialties);
      }

      console.log("🔄 处理后的数据:", data);

      const lawFirm = await prisma.lawFirm.create({
        data,
      });

      console.log("✅ 律师事务所创建成功:", lawFirm.id);

      res.json({ success: true, data: lawFirm });
    } catch (error) {
      console.error("❌ 创建律师事务所失败:", error);
      console.error("错误详情:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      res.status(500).json({ error: "创建律师事务所失败" });
    }
  }
);

app.put(
  "/api/law-firms/:id",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      // 处理specialties字段，将数组转换为JSON字符串
      const data = { ...req.body };
      if (data.specialties && Array.isArray(data.specialties)) {
        data.specialties = JSON.stringify(data.specialties);
      }

      const lawFirm = await prisma.lawFirm.update({
        where: { id: parseInt(id) },
        data,
      });

      res.json({ success: true, data: lawFirm });
    } catch (error) {
      res.status(500).json({ error: "更新律师事务所失败" });
    }
  }
);

app.delete(
  "/api/law-firms/:id",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await prisma.lawFirm.delete({
        where: { id: parseInt(id) },
      });

      res.json({ success: true, data: null });
    } catch (error) {
      res.status(500).json({ error: "删除律师事务所失败" });
    }
  }
);

// 合同模板路由
app.get(
  "/api/contract-templates",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { description: { contains: search as string } },
          { content: { contains: search as string } },
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.contractTemplate.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { name: "asc" },
        }),
        prisma.contractTemplate.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      console.error("❌ 获取合同模板列表失败:", error);
      res.status(500).json({
        error: "获取合同模板列表失败",
        details: error.message,
      });
    }
  }
);

app.post(
  "/api/contract-templates",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log("🔍 创建合同模板请求数据:", req.body);

      // 数据验证和转换
      const data = {
        ...req.body,
        // 确保必填字段存在
        name: req.body.name || "未命名模板",
        type: req.body.type || "custom",
        content: req.body.content || "",
        variables: req.body.variables
          ? JSON.stringify(req.body.variables)
          : "[]",
        status: req.body.status || "draft",
        version: req.body.version || "1.0",
        createdBy: req.user?.id || 1, // 从认证用户获取，默认为1
      };

      console.log("🔄 处理后的数据:", data);

      const template = await prisma.contractTemplate.create({
        data,
      });

      console.log("✅ 合同模板创建成功:", template.id);
      res.json({ success: true, data: template });
    } catch (error) {
      console.error("❌ 创建合同模板失败:", error);
      console.error("错误详情:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      res.status(500).json({
        error: "创建合同模板失败",
        details: error.message,
      });
    }
  }
);

app.put(
  "/api/contract-templates/:id",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log("🔍 更新合同模板请求数据:", { id, data: req.body });

      // 检查模板是否存在
      const existingTemplate = await prisma.contractTemplate.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingTemplate) {
        return res.status(404).json({
          error: "合同模板不存在",
          details: `模板ID ${id} 不存在`,
        });
      }

      // 数据验证和转换
      const updateData = {
        ...req.body,
        // 处理variables字段
        variables: req.body.variables
          ? Array.isArray(req.body.variables)
            ? JSON.stringify(req.body.variables)
            : req.body.variables
          : existingTemplate.variables,
        updatedAt: new Date(),
      };

      // 移除不应该更新的字段
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.createdBy;

      console.log("🔄 处理后的更新数据:", updateData);

      const template = await prisma.contractTemplate.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      console.log("✅ 合同模板更新成功:", template.id);
      res.json({ success: true, data: template });
    } catch (error) {
      console.error("❌ 更新合同模板失败:", error);
      console.error("错误详情:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });

      if (error.code === "P2025") {
        res.status(404).json({
          error: "合同模板不存在",
          details: error.message,
        });
      } else {
        res.status(500).json({
          error: "更新合同模板失败",
          details: error.message,
        });
      }
    }
  }
);

app.delete(
  "/api/contract-templates/:id",
  authenticateToken,
  // requireRole(["admin"]), // 临时注释掉权限检查
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log("🔍 删除合同模板请求:", { id });

      await prisma.contractTemplate.delete({
        where: { id: parseInt(id) },
      });

      console.log("✅ 合同模板删除成功:", id);
      res.json({ success: true, data: null });
    } catch (error) {
      console.error("❌ 删除合同模板失败:", error);
      res.status(500).json({
        error: "删除合同模板失败",
        details: error.message,
      });
    }
  }
);

// 搜索路由
app.get(
  "/api/search",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { q, type, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      if (!q) {
        return res.status(400).json({ error: "搜索关键词不能为空" });
      }

      let results: any[] = [];
      let total = 0;

      if (!type || type === "patents") {
        // 搜索专利
        const patents = await prisma.patent.findMany({
          where: {
            OR: [
              { title: { contains: q as string } },
              { description: { contains: q as string } },
              { patentNumber: { contains: q as string } },
              { abstract: { contains: q as string } },
            ],
          },
          include: {
            user: {
              select: { id: true, realName: true, username: true },
            },
            category: true,
          },
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        });

        results.push(...patents.map((p) => ({ ...p, resultType: "patent" })));
        total += patents.length;
      }

      if (!type || type === "users") {
        // 搜索用户
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: q as string } },
              { realName: { contains: q as string } },
              { email: { contains: q as string } },
            ],
          },
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
            department: true,
            role: true,
          },
          skip,
          take: parseInt(limit as string),
        });

        results.push(...users.map((u) => ({ ...u, resultType: "user" })));
        total += users.length;
      }

      res.json({
        results,
        total,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "搜索失败" });
    }
  }
);

// 批量操作路由
app.post(
  "/api/patents/batch",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { action, patentIds, data } = req.body;

      if (!action || !patentIds || !Array.isArray(patentIds)) {
        return res.status(400).json({ error: "参数错误" });
      }

      let result;

      switch (action) {
        case "update":
          result = await prisma.patent.updateMany({
            where: { id: { in: patentIds } },
            data,
          });
          break;
        case "delete":
          result = await prisma.patent.deleteMany({
            where: { id: { in: patentIds } },
          });
          break;
        case "export":
          // 导出功能
          const patents = await prisma.patent.findMany({
            where: { id: { in: patentIds } },
            include: {
              user: { select: { realName: true } },
              category: { select: { name: true } },
            },
          });
          result = { patents, count: patents.length };
          break;
        default:
          return res.status(400).json({ error: "不支持的操作" });
      }

      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: "批量操作失败" });
    }
  }
);

// 用户搜索路由
app.get(
  "/api/users/search",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: "搜索关键词不能为空" });
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q as string } },
            { realName: { contains: q as string } },
            { email: { contains: q as string } },
          ],
        },
        select: {
          id: true,
          username: true,
          realName: true,
          email: true,
          department: true,
          role: true,
          avatar: true,
        },
        take: 20, // 限制搜索结果数量
      });

      res.json(users);
    } catch (error) {
      console.error("用户搜索失败:", error);
      res.status(500).json({ error: "用户搜索失败" });
    }
  }
);

// 用户头像更新路由
app.put(
  "/api/users/:id/avatar",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = parseInt(req.params.id);
      const { avatar } = req.body;

      // 检查权限：只能更新自己的头像或管理员
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "只能更新自己的头像" });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatar },
        select: {
          id: true,
          username: true,
          email: true,
          realName: true,
          role: true,
          department: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "更新头像失败" });
    }
  }
);

// 专利费用状态更新路由
app.put(
  "/api/patents/:patentId/fees/:feeId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.patentId);
      const feeId = parseInt(req.params.feeId);
      const { status } = req.body;

      const fee = await prisma.fee.update({
        where: { id: feeId, patentId },
        data: {
          status,
        },
      });

      res.json(fee);
    } catch (error) {
      res.status(500).json({ error: "更新费用状态失败" });
    }
  }
);

// 专利截止日期状态更新路由
app.put(
  "/api/patents/:patentId/deadlines/:deadlineId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.patentId);
      const deadlineId = parseInt(req.params.deadlineId);
      const { status } = req.body;

      const deadline = await prisma.deadline.update({
        where: { id: deadlineId, patentId },
        data: {
          status,
        },
      });

      res.json(deadline);
    } catch (error) {
      res.status(500).json({ error: "更新截止日期状态失败" });
    }
  }
);

// 任务状态更新路由
app.put(
  "/api/tasks/:id/status",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { status, assigneeId } = req.body;

      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          status,
          assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
        },
        include: {
          assignee: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "更新任务状态失败" });
    }
  }
);

// 通知系统路由（使用内存存储模拟）
const notificationStore = new Map<number, any[]>();

app.get(
  "/api/notifications",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { page = 1, limit = 20, unread } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // 从内存存储获取通知
      const userNotifications = notificationStore.get(req.user.id) || [];
      let filteredNotifications = userNotifications;

      if (unread === "true") {
        filteredNotifications = userNotifications.filter((n) => !n.read);
      }

      const total = filteredNotifications.length;
      const notifications = filteredNotifications.slice(
        skip,
        skip + parseInt(limit as string)
      );

      res.json({
        notifications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取通知列表失败" });
    }
  }
);

app.post(
  "/api/notifications",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const notificationData = {
        ...req.body,
        id: Date.now(),
        userId: req.user.id,
        createdAt: new Date(),
        read: false,
      };

      // 存储到内存
      const userNotifications = notificationStore.get(req.user.id) || [];
      userNotifications.unshift(notificationData);
      notificationStore.set(req.user.id, userNotifications);

      res.json(notificationData);
    } catch (error) {
      res.status(500).json({ error: "创建通知失败" });
    }
  }
);

app.put(
  "/api/notifications/:id/read",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const notificationId = parseInt(req.params.id);
      const userNotifications = notificationStore.get(req.user.id) || [];
      const notification = userNotifications.find(
        (n) => n.id === notificationId
      );

      if (notification) {
        notification.read = true;
        notificationStore.set(req.user.id, userNotifications);
      }

      res.json(notification || { error: "通知不存在" });
    } catch (error) {
      res.status(500).json({ error: "标记通知为已读失败" });
    }
  }
);

app.put(
  "/api/notifications/read-all",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userNotifications = notificationStore.get(req.user.id) || [];
      userNotifications.forEach((n) => (n.read = true));
      notificationStore.set(req.user.id, userNotifications);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "标记所有通知为已读失败" });
    }
  }
);

// 文件上传路由（简化版，实际项目中应该使用专业的文件上传服务）
app.post(
  "/api/upload",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { fileName, fileType, fileSize, patentId } = req.body;

      // 这里应该实现实际的文件上传逻辑
      // 目前只是返回一个模拟的文件记录
      const fileRecord = {
        id: Date.now(),
        fileName,
        fileType,
        fileSize: parseInt(fileSize),
        patentId: patentId ? parseInt(patentId) : null,
        uploadUrl: `/uploads/${Date.now()}_${fileName}`,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
      };

      res.json(fileRecord);
    } catch (error) {
      res.status(500).json({ error: "文件上传失败" });
    }
  }
);

// 分片上传API - 上传文件分片
app.post(
  "/api/upload/chunk",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      // 这里应该使用 multer 或其他文件上传中间件处理文件
      // 目前返回模拟响应
      const { chunkIndex, totalChunks, fileName, fileSize, chunkSize } =
        req.body;

      // 模拟分片上传成功
      const chunkResponse = {
        success: true,
        chunkIndex: parseInt(chunkIndex),
        totalChunks: parseInt(totalChunks),
        fileName,
        fileSize: parseInt(fileSize),
        chunkSize: parseInt(chunkSize),
        message: `分片 ${chunkIndex + 1}/${totalChunks} 上传成功`,
      };

      res.json(chunkResponse);
    } catch (error) {
      res.status(500).json({ error: "分片上传失败" });
    }
  }
);

// 分片上传API - 合并文件
app.post(
  "/api/upload/merge",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { fileName, totalChunks, fileSize } = req.body;

      // 这里应该实现实际的文件合并逻辑
      // 将之前上传的分片合并成完整文件
      const mergeResponse = {
        success: true,
        fileName,
        totalChunks: parseInt(totalChunks),
        fileSize: parseInt(fileSize),
        fileUrl: `/uploads/${Date.now()}_${fileName}`,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        message: "文件合并成功",
      };

      res.json(mergeResponse);
    } catch (error) {
      res.status(500).json({ error: "文件合并失败" });
    }
  }
);

// 文件下载API
app.get(
  "/api/download/:fileId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const fileId = req.params.fileId;

      // 这里应该从数据库获取文件信息并验证权限
      // 目前返回模拟数据
      const fileInfo = {
        id: fileId,
        fileName: `file_${fileId}.pdf`,
        fileSize: 1024000,
        fileType: "application/pdf",
        fileUrl: `/uploads/file_${fileId}.pdf`,
      };

      // 设置下载头
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileInfo.fileName}"`
      );
      res.setHeader("Content-Type", fileInfo.fileType);
      res.setHeader("Content-Length", fileInfo.fileSize);

      // 这里应该实现实际的文件流传输
      // 目前返回模拟响应
      res.json({
        success: true,
        message: "文件下载开始",
        fileInfo,
      });
    } catch (error) {
      res.status(500).json({ error: "文件下载失败" });
    }
  }
);

// 文件预览API
app.get(
  "/api/preview/:fileId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const fileId = req.params.fileId;

      // 这里应该从数据库获取文件信息并验证权限
      const fileInfo = {
        id: fileId,
        fileName: `file_${fileId}.pdf`,
        fileSize: 1024000,
        fileType: "application/pdf",
        fileUrl: `/uploads/file_${fileId}.pdf`,
        canPreview: true,
        previewUrl: `/preview/file_${fileId}.pdf`,
      };

      res.json(fileInfo);
    } catch (error) {
      res.status(500).json({ error: "获取文件预览信息失败" });
    }
  }
);

// 文件信息API
app.get(
  "/api/files/:fileId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const fileId = req.params.fileId;

      // 这里应该从数据库获取文件信息
      const fileInfo = {
        id: fileId,
        fileName: `file_${fileId}.pdf`,
        fileSize: 1024000,
        fileType: "application/pdf",
        fileUrl: `/uploads/file_${fileId}.pdf`,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        lastModified: new Date(),
        permissions: {
          canRead: true,
          canWrite: req.user.role === "admin",
          canDelete: req.user.role === "admin",
        },
      };

      res.json(fileInfo);
    } catch (error) {
      res.status(500).json({ error: "获取文件信息失败" });
    }
  }
);

// 文件列表API
app.get(
  "/api/files",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { page = 1, limit = 20, type, search } = req.query;

      // 这里应该从数据库获取文件列表
      // 目前返回模拟数据
      const files = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        fileName: `file_${i + 1}.pdf`,
        fileSize: 1024000 + i * 1000,
        fileType: "application/pdf",
        fileUrl: `/uploads/file_${i + 1}.pdf`,
        uploadedBy: req.user!.id,
        uploadedAt: new Date(Date.now() - i * 86400000),
        lastModified: new Date(Date.now() - i * 86400000),
      }));

      const total = 100; // 总文件数

      res.json({
        files,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取文件列表失败" });
    }
  }
);

// 删除文件API
app.delete(
  "/api/files/:fileId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const fileId = req.params.fileId;

      // 这里应该验证文件权限并删除文件
      // 目前返回模拟响应
      res.json({
        success: true,
        message: `文件 ${fileId} 删除成功`,
      });
    } catch (error) {
      res.status(500).json({ error: "删除文件失败" });
    }
  }
);

// 文件分享API
app.post(
  "/api/files/:fileId/share",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const fileId = req.params.fileId;
      const { shareType, shareData } = req.body;

      // 这里应该实现文件分享逻辑
      let shareResult;
      switch (shareType) {
        case "link":
          shareResult = {
            type: "link",
            shareUrl: `${req.protocol}://${req.get("host")}/share/${fileId}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
          };
          break;
        case "email":
          shareResult = {
            type: "email",
            email: shareData.email,
            sent: true,
            message: "分享邮件已发送",
          };
          break;
        case "qr":
          shareResult = {
            type: "qr",
            qrCode: `data:image/png;base64,${Buffer.from(
              "mock_qr_code"
            ).toString("base64")}`,
          };
          break;
        default:
          return res.status(400).json({ error: "不支持的分享类型" });
      }

      res.json({
        success: true,
        shareResult,
        message: "文件分享成功",
      });
    } catch (error) {
      res.status(500).json({ error: "文件分享失败" });
    }
  }
);

// 文件搜索API
app.get(
  "/api/files/search",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { q, type, size, date } = req.query;

      // 这里应该实现文件搜索逻辑
      // 目前返回模拟搜索结果
      const searchResults = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        fileName: `search_result_${i + 1}.pdf`,
        fileSize: 1024000 + i * 1000,
        fileType: "application/pdf",
        fileUrl: `/uploads/search_result_${i + 1}.pdf`,
        uploadedBy: req.user!.id,
        uploadedAt: new Date(Date.now() - i * 86400000),
        relevance: 0.9 - i * 0.1, // 相关性评分
      }));

      res.json({
        success: true,
        query: q,
        results: searchResults,
        total: searchResults.length,
      });
    } catch (error) {
      res.status(500).json({ error: "文件搜索失败" });
    }
  }
);

// 专利文档管理路由
app.get(
  "/api/patents/:patentId/documents",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const patentId = parseInt(req.params.patentId);

      // 这里应该从文件存储系统获取文档列表
      // 目前返回模拟数据
      const documents = [
        {
          id: 1,
          patentId,
          name: "说明书",
          type: "application",
          fileUrl: `/documents/${patentId}/specification.pdf`,
          fileSize: 1024000,
          uploadedAt: new Date(),
          uploadedBy: req.user.id,
        },
      ];

      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "获取专利文档失败" });
    }
  }
);

// 系统设置路由
app.get(
  "/api/settings",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      // 这里应该从数据库获取系统设置
      const settings = {
        systemName: "专利管理系统",
        version: "1.0.0",
        maintenanceMode: false,
        allowRegistration: true,
        maxFileSize: 10485760, // 10MB
        supportedFileTypes: [".pdf", ".doc", ".docx", ".jpg", ".png"],
      };

      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "获取系统设置失败" });
    }
  }
);

app.put(
  "/api/settings",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { maintenanceMode, allowRegistration, maxFileSize } = req.body;

      // 这里应该更新数据库中的系统设置
      const updatedSettings = {
        maintenanceMode: maintenanceMode || false,
        allowRegistration:
          allowRegistration !== undefined ? allowRegistration : true,
        maxFileSize: maxFileSize || 10485760,
      };

      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      res.status(500).json({ error: "更新系统设置失败" });
    }
  }
);

// 数据安全相关API
app.get(
  "/api/data-security/settings",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = req.user.id;

      // 从数据库获取数据安全设置
      const securitySettings = await prisma.securitySettings.findMany({
        where: { userId },
        orderBy: { category: "asc" },
      });

      // 构建默认设置
      const defaultSettings = {
        encryption: {
          algorithm: "aes256",
          keyRotationDays: 90,
          sensitiveDataEncryption: true,
          lastKeyRotation: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
        logging: {
          level: "info",
          retentionDays: 90,
          realTimeMonitoring: true,
          auditTrail: true,
        },
        backup: {
          frequency: "daily",
          location: "cloud",
          incrementalBackup: true,
          lastBackup: new Date(Date.now() - 12 * 60 * 60 * 1000),
          nextBackup: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
        recovery: {
          rtoHours: 4,
          rpoMinutes: 60,
          autoRecovery: true,
          lastRecoveryTest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      };

      // 合并数据库设置和默认设置
      securitySettings.forEach((setting) => {
        const category = setting.category as keyof typeof defaultSettings;
        if (category in defaultSettings) {
          const parsedSettings = JSON.parse(setting.settings);
          // 确保数据库设置完全覆盖默认设置，而不是部分合并
          defaultSettings[category] = {
            ...defaultSettings[category],
            ...parsedSettings,
          };
        }
      });

      res.json(defaultSettings);
    } catch (error) {
      console.error("获取数据安全设置失败:", error);
      res.status(500).json({ error: "获取数据安全设置失败" });
    }
  }
);

app.put(
  "/api/data-security/settings",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = req.user.id;
      const { encryption, logging, backup, recovery } = req.body;

      // 使用事务更新所有设置
      await prisma.$transaction(async (tx) => {
        // 更新加密设置
        if (encryption) {
          await tx.securitySettings.upsert({
            where: { userId_category: { userId, category: "encryption" } },
            update: { settings: JSON.stringify(encryption) },
            create: {
              userId,
              category: "encryption",
              settings: JSON.stringify(encryption),
            },
          });
        }

        // 更新日志设置
        if (logging) {
          await tx.securitySettings.upsert({
            where: { userId_category: { userId, category: "logging" } },
            update: { settings: JSON.stringify(logging) },
            create: {
              userId,
              category: "logging",
              settings: JSON.stringify(logging),
            },
          });
        }

        // 更新备份设置
        if (backup) {
          await tx.securitySettings.upsert({
            where: { userId_category: { userId, category: "backup" } },
            update: { settings: JSON.stringify(backup) },
            create: {
              userId,
              category: "backup",
              settings: JSON.stringify(backup),
            },
          });
        }

        // 更新恢复设置
        if (recovery) {
          await tx.securitySettings.upsert({
            where: { userId_category: { userId, category: "recovery" } },
            update: { settings: JSON.stringify(recovery) },
            create: {
              userId,
              category: "recovery",
              settings: JSON.stringify(recovery),
            },
          });
        }
      });

      // 记录安全事件日志
      await prisma.securityEventLog.create({
        data: {
          userId,
          eventType: "settings_updated",
          description: "数据安全设置已更新",
          severity: "low",
          metadata: JSON.stringify({ encryption, logging, backup, recovery }),
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });

      res.json({ success: true, message: "数据安全设置更新成功" });
    } catch (error) {
      console.error("更新数据安全设置失败:", error);
      res.status(500).json({ error: "更新数据安全设置失败" });
    }
  }
);

app.post(
  "/api/data-security/backup",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = req.user.id;
      const { backupType = "full", location = "cloud" } = req.body;

      // 创建备份记录
      const backupRecord = await prisma.backupRecord.create({
        data: {
          backupType,
          location,
          size: 0, // 初始大小为0
          status: "running",
          createdBy: userId,
          metadata: JSON.stringify({
            startedBy: req.user.username,
            ipAddress: req.ip || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
          }),
        },
      });

      // 记录安全事件日志
      await prisma.securityEventLog.create({
        data: {
          userId,
          eventType: "backup_started",
          description: `数据备份已启动 - 类型: ${backupType}, 位置: ${location}`,
          severity: "medium",
          metadata: JSON.stringify({
            backupId: backupRecord.id,
            backupType,
            location,
          }),
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });

      // 启动异步备份过程
      setTimeout(async () => {
        try {
          // 使用真实的备份服务
          let backupResult;

          if (backupType === "full") {
            backupResult = await backupService.performFullBackup(
              userId,
              location
            );
          } else {
            backupResult = await backupService.performIncrementalBackup(
              userId,
              location
            );
          }

          if (backupResult.success) {
            // 记录备份完成事件
            await loggingService.logSecurityEvent(
              "backup_completed",
              `数据备份完成 - 大小: ${(backupResult.size / 1024 / 1024).toFixed(
                2
              )} MB`,
              LogLevel.INFO,
              userId,
              req.ip || "unknown",
              req.headers["user-agent"] || "unknown",
              { backupId: backupRecord.id, size: backupResult.size }
            );
          } else {
            throw new Error(backupResult.error || "备份失败");
          }
        } catch (error) {
          console.error("备份过程失败:", error);

          await prisma.backupRecord.update({
            where: { id: backupRecord.id },
            data: {
              status: "failed",
              error: error instanceof Error ? error.message : "未知错误",
              completedAt: new Date(),
            },
          });

          // 记录备份失败事件
          await loggingService.logSecurityEvent(
            "backup_failed",
            "数据备份失败",
            LogLevel.ERROR,
            userId,
            req.ip || "unknown",
            req.headers["user-agent"] || "unknown",
            {
              backupId: backupRecord.id,
              error: error instanceof Error ? error.message : "未知错误",
            }
          );
        }
      }, 1000); // 1秒后开始

      res.json({
        success: true,
        message: "数据备份已启动",
        backupId: backupRecord.id,
        estimatedTime: "3-5分钟",
      });
    } catch (error) {
      console.error("启动数据备份失败:", error);
      res.status(500).json({ error: "启动数据备份失败" });
    }
  }
);

app.post(
  "/api/data-security/recovery-test",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = req.user.id;

      // 记录恢复测试开始事件
      await prisma.securityEventLog.create({
        data: {
          userId,
          eventType: "recovery_test_started",
          description: "数据恢复测试已启动",
          severity: "medium",
          metadata: JSON.stringify({
            startedBy: req.user.username,
            ipAddress: req.ip || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
          }),
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });

      // 启动异步恢复测试过程
      setTimeout(async () => {
        try {
          // 模拟恢复测试过程（这里应该实现真实的恢复测试逻辑）
          const success = Math.random() > 0.1; // 90%成功率
          const testResult = success ? "passed" : "failed";
          const message = success
            ? "恢复测试通过"
            : "恢复测试失败，需要检查配置";

          // 记录恢复测试完成事件
          await prisma.securityEventLog.create({
            data: {
              userId,
              eventType: success
                ? "recovery_test_passed"
                : "recovery_test_failed",
              description: `数据恢复测试${success ? "通过" : "失败"}`,
              severity: success ? "low" : "high",
              metadata: JSON.stringify({
                testResult,
                message,
                completedAt: new Date().toISOString(),
              }),
              ipAddress: req.ip || "unknown",
              userAgent: req.headers["user-agent"] || "unknown",
            },
          });
        } catch (error) {
          console.error("恢复测试过程失败:", error);

          // 记录恢复测试失败事件
          await prisma.securityEventLog.create({
            data: {
              userId,
              eventType: "recovery_test_error",
              description: "数据恢复测试过程出错",
              severity: "critical",
              metadata: JSON.stringify({
                error: error instanceof Error ? error.message : "未知错误",
                completedAt: new Date().toISOString(),
              }),
              ipAddress: req.ip || "unknown",
              userAgent: req.headers["user-agent"] || "unknown",
            },
          });
        }
      }, 5000); // 5秒后完成

      res.json({
        success: true,
        message: "数据恢复测试已启动",
        testId: Date.now(),
        estimatedTime: "5-10分钟",
      });
    } catch (error) {
      console.error("启动恢复测试失败:", error);
      res.status(500).json({ error: "启动恢复测试失败" });
    }
  }
);

// 获取安全事件日志
app.get(
  "/api/data-security/events",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = req.user.id;
      const { page = 1, limit = 50, severity, eventType } = req.query;

      const where: any = { userId };
      if (severity) where.severity = severity;
      if (eventType) where.eventType = eventType;

      const events = await prisma.securityEventLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
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

      const total = await prisma.securityEventLog.count({ where });

      // 确保时间戳格式正确
      const formattedEvents = events.map((event) => ({
        ...event,
        timestamp: new Date(event.timestamp).toISOString(),
      }));

      res.json({
        events: formattedEvents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("获取安全事件日志失败:", error);
      res.status(500).json({ error: "获取安全事件日志失败" });
    }
  }
);

// 获取备份记录
app.get(
  "/api/data-security/backups",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = req.user.id;
      const { page = 1, limit = 20, status, backupType } = req.query;

      const where: any = { createdBy: userId };
      if (status) where.status = status;
      if (backupType) where.backupType = backupType;

      const backups = await prisma.backupRecord.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
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

      const total = await prisma.backupRecord.count({ where });

      // 确保时间戳格式正确
      const formattedBackups = backups.map((backup) => ({
        ...backup,
        startedAt: new Date(backup.startedAt).toISOString(),
        completedAt: backup.completedAt
          ? new Date(backup.completedAt).toISOString()
          : null,
      }));

      res.json({
        backups: formattedBackups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("获取备份记录失败:", error);
      res.status(500).json({ error: "获取备份记录失败" });
    }
  }
);

// 删除备份记录
app.delete(
  "/api/data-security/backups/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const userId = req.user.id;
      const backupId = parseInt(req.params.id);

      if (isNaN(backupId)) {
        return res.status(400).json({ error: "无效的备份ID" });
      }

      // 查找备份记录
      const backup = await prisma.backupRecord.findFirst({
        where: {
          id: backupId,
          createdBy: userId,
        },
      });

      if (!backup) {
        return res.status(404).json({ error: "备份记录不存在" });
      }

      // 删除备份记录
      await prisma.backupRecord.delete({
        where: { id: backupId },
      });

      // 记录删除事件
      await prisma.securityEventLog.create({
        data: {
          userId,
          eventType: "backup_deleted",
          description: `备份记录已删除 - ID: ${backupId}`,
          severity: "medium",
          metadata: JSON.stringify({
            backupId,
            backupType: backup.backupType,
            location: backup.location,
          }),
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });

      res.json({ success: true, message: "备份记录已删除" });
    } catch (error) {
      console.error("删除备份记录失败:", error);
      res.status(500).json({ error: "删除备份记录失败" });
    }
  }
);

// 加密管理API
app.get(
  "/api/data-security/encryption/keys",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const keys = encryptionService.getAllKeys();
      res.json({ keys });
    } catch (error) {
      console.error("获取加密密钥失败:", error);
      res.status(500).json({ error: "获取加密密钥失败" });
    }
  }
);

app.post(
  "/api/data-security/encryption/rotate",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { oldKeyId, newAlgorithm } = req.body;

      if (!oldKeyId || !newAlgorithm) {
        return res.status(400).json({ error: "缺少必要参数" });
      }

      const newKey = encryptionService.rotateKey(oldKeyId, newAlgorithm);

      // 记录密钥轮换事件
      await loggingService.logSecurityEvent(
        "key_rotated",
        `加密密钥已轮换: ${oldKeyId} -> ${newKey.id}`,
        LogLevel.INFO,
        req.user?.id,
        req.ip || "unknown",
        req.headers["user-agent"] || "unknown",
        { oldKeyId, newKeyId: newKey.id, algorithm: newKey.algorithm }
      );

      res.json({ success: true, newKey });
    } catch (error) {
      console.error("轮换加密密钥失败:", error);
      res.status(500).json({ error: "轮换加密密钥失败" });
    }
  }
);

app.post(
  "/api/data-security/encryption/encrypt",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { data, algorithm = "AES-256" } = req.body;

      if (!data) {
        return res.status(400).json({ error: "缺少要加密的数据" });
      }

      const encrypted = encryptionService.encryptSensitiveField(
        data,
        algorithm
      );

      res.json({ success: true, encrypted });
    } catch (error) {
      console.error("加密数据失败:", error);
      res.status(500).json({ error: "加密数据失败" });
    }
  }
);

app.post(
  "/api/data-security/encryption/decrypt",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { encrypted } = req.body;

      if (!encrypted) {
        return res.status(400).json({ error: "缺少要解密的数据" });
      }

      const decrypted = encryptionService.decryptSensitiveField(encrypted);

      res.json({ success: true, decrypted });
    } catch (error) {
      console.error("解密数据失败:", error);
      res.status(500).json({ error: "解密数据失败" });
    }
  }
);

// 日志管理API
app.get(
  "/api/data-security/logging/statistics",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await loggingService.getLogStatistics();
      res.json(stats);
    } catch (error) {
      console.error("获取日志统计失败:", error);
      res.status(500).json({ error: "获取日志统计失败" });
    }
  }
);

// 获取系统日志
app.get(
  "/api/data-security/logs",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        level,
        module,
        startDate,
        endDate,
        keyword,
      } = req.query;

      // 构建查询条件
      const where: any = {};

      if (level) {
        where.severity =
          level === "ERROR" ? "critical" : level === "WARN" ? "medium" : "low";
      }

      if (module) {
        where.eventType = module;
      }

      if (startDate && endDate) {
        where.timestamp = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      if (keyword) {
        where.OR = [
          { description: { contains: keyword as string } },
          { ipAddress: { contains: keyword as string } },
        ];
      }

      // 获取日志数据（这里使用安全事件日志作为系统日志的替代）
      const logs = await prisma.securityEventLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
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

      const total = await prisma.securityEventLog.count({ where });

      // 转换为系统日志格式
      const systemLogs = logs.map((log) => ({
        id: log.id,
        timestamp: new Date(log.timestamp).toISOString(), // 确保返回标准ISO格式
        level:
          log.severity === "critical"
            ? "ERROR"
            : log.severity === "high"
            ? "ERROR"
            : log.severity === "medium"
            ? "WARN"
            : "INFO",
        module:
          log.eventType === "unauthorized_access"
            ? "安全"
            : log.eventType === "data_access_violation"
            ? "安全"
            : log.eventType === "backup_completed" ||
              log.eventType === "backup_failed"
            ? "备份"
            : log.eventType === "settings_updated"
            ? "系统"
            : log.eventType === "key_rotated"
            ? "安全"
            : "系统",
        message: log.description,
        user: log.user?.username || `user${log.userId}`,
        ip: log.ipAddress || "127.0.0.1",
        sessionId: `sess_${log.id}`,
        details: log.metadata ? JSON.parse(log.metadata) : {},
        stackTrace:
          log.severity === "critical"
            ? `Error: ${log.description}\n    at SecurityModule.processEvent\n    at EventController.handleEvent`
            : null,
      }));

      res.json({
        logs: systemLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("获取系统日志失败:", error);
      res.status(500).json({ error: "获取系统日志失败" });
    }
  }
);

app.post(
  "/api/data-security/logs/cleanup",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { beforeDate, level, module } = req.body;

      let where: any = {};

      if (beforeDate) {
        where.timestamp = {
          lt: new Date(beforeDate),
        };
      }

      if (level) {
        where.severity =
          level === "ERROR" ? "critical" : level === "WARN" ? "medium" : "low";
      }

      if (module) {
        where.eventType = module;
      }

      // 删除符合条件的日志
      const deletedCount = await prisma.securityEventLog.deleteMany({
        where,
      });

      res.json({
        success: true,
        cleanedCount: deletedCount.count,
        message: `已清理 ${deletedCount.count} 条日志记录`,
      });
    } catch (error) {
      console.error("清理日志失败:", error);
      res.status(500).json({ error: "清理日志失败" });
    }
  }
);

app.post(
  "/api/data-security/logging/cleanup",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const cleanedCount = await loggingService.cleanupExpiredLogs();
      res.json({ success: true, cleanedCount });
    } catch (error) {
      console.error("清理过期日志失败:", error);
      res.status(500).json({ error: "清理过期日志失败" });
    }
  }
);

// 合规性管理API
app.get(
  "/api/compliance/rules",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const complianceRules = [
        {
          id: 1,
          name: "数据保护法规",
          category: "privacy",
          status: "active",
          description: "符合GDPR和本地数据保护法规要求",
          lastReview: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          name: "知识产权保护",
          category: "intellectual_property",
          status: "active",
          description: "确保专利信息的完整性和保密性",
          lastReview: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          name: "审计追踪",
          category: "audit",
          status: "active",
          description: "记录所有系统操作和访问日志",
          lastReview: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

      res.json(complianceRules);
    } catch (error) {
      res.status(500).json({ error: "获取合规性规则失败" });
    }
  }
);

app.post(
  "/api/compliance/audit",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { action, targetType, targetId, details } = req.body;

      // 记录审计日志
      const auditLog = {
        id: Date.now(),
        userId: req.user.id,
        username: req.user.username,
        action,
        targetType,
        targetId,
        details,
        timestamp: new Date(),
        ipAddress: req.ip || "unknown",
      };

      res.json({ success: true, auditLog });
    } catch (error) {
      res.status(500).json({ error: "记录审计日志失败" });
    }
  }
);

// 获取法规列表
app.get(
  "/api/compliance/regulations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const regulations = [
        {
          id: 1,
          name: "专利法",
          category: "patent_law",
          status: "active",
          description: "中华人民共和国专利法",
          version: "2020版",
          effectiveDate: "2020-10-17",
          lastReview: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          name: "专利法实施细则",
          category: "patent_implementation",
          status: "active",
          description: "中华人民共和国专利法实施细则",
          version: "2020版",
          effectiveDate: "2020-10-17",
          lastReview: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          name: "数据安全法",
          category: "data_security",
          status: "active",
          description: "中华人民共和国数据安全法",
          version: "2021版",
          effectiveDate: "2021-09-01",
          lastReview: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      ];

      res.json({ success: true, data: regulations });
    } catch (error) {
      res.status(500).json({ error: "获取法规列表失败" });
    }
  }
);

// 添加新法规
app.post(
  "/api/compliance/regulations",
  authenticateToken,
  requireRole(["admin", "compliance_manager"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, category, description, version, effectiveDate } = req.body;

      const newRegulation = {
        id: Date.now(),
        name,
        category,
        status: "active",
        description,
        version,
        effectiveDate,
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json({ success: true, data: newRegulation });
    } catch (error) {
      res.status(500).json({ error: "添加法规失败" });
    }
  }
);

// 更新法规
app.put(
  "/api/compliance/regulations/:id",
  authenticateToken,
  requireRole(["admin", "compliance_manager"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const regulationId = parseInt(req.params.id);
      const updateData = req.body;

      const updatedRegulation = {
        id: regulationId,
        ...updateData,
        updatedAt: new Date(),
      };

      res.json({ success: true, data: updatedRegulation });
    } catch (error) {
      res.status(500).json({ error: "更新法规失败" });
    }
  }
);

// 获取检查清单
app.get(
  "/api/compliance/checklists",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const checklists = [
        {
          id: 1,
          name: "专利申请合规检查",
          category: "patent_application",
          status: "active",
          items: [
            {
              id: 1,
              description: "检查申请文件完整性",
              required: true,
              completed: false,
            },
            {
              id: 2,
              description: "验证发明人信息",
              required: true,
              completed: false,
            },
            {
              id: 3,
              description: "确认优先权声明",
              required: false,
              completed: false,
            },
            {
              id: 4,
              description: "检查附图质量",
              required: true,
              completed: false,
            },
          ],
          lastReview: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          name: "专利维护合规检查",
          category: "patent_maintenance",
          status: "active",
          items: [
            {
              id: 1,
              description: "检查年费缴纳状态",
              required: true,
              completed: false,
            },
            {
              id: 2,
              description: "验证专利权人变更",
              required: false,
              completed: false,
            },
            {
              id: 3,
              description: "确认专利状态",
              required: true,
              completed: false,
            },
          ],
          lastReview: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

      res.json({ success: true, data: checklists });
    } catch (error) {
      res.status(500).json({ error: "获取检查清单失败" });
    }
  }
);

// 添加检查清单
app.post(
  "/api/compliance/checklists",
  authenticateToken,
  requireRole(["admin", "compliance_manager"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, category, items } = req.body;

      const newChecklist = {
        id: Date.now(),
        name,
        category,
        status: "active",
        items: items.map((item: any, index: number) => ({
          id: index + 1,
          description: item.description,
          required: item.required,
          completed: false,
        })),
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json({ success: true, data: newChecklist });
    } catch (error) {
      res.status(500).json({ error: "添加检查清单失败" });
    }
  }
);

// 更新检查清单
app.put(
  "/api/compliance/checklists/:id",
  authenticateToken,
  requireRole(["admin", "compliance_manager"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const checklistId = parseInt(req.params.id);
      const updateData = req.body;

      const updatedChecklist = {
        id: checklistId,
        ...updateData,
        updatedAt: new Date(),
      };

      res.json({ success: true, data: updatedChecklist });
    } catch (error) {
      res.status(500).json({ error: "更新检查清单失败" });
    }
  }
);

// 更新检查清单状态
app.patch(
  "/api/compliance/checklists/:id/status",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const checklistId = parseInt(req.params.id);
      const { status } = req.body;

      const updatedChecklist = {
        id: checklistId,
        status,
        updatedAt: new Date(),
      };

      res.json({ success: true, data: updatedChecklist });
    } catch (error) {
      res.status(500).json({ error: "更新检查清单状态失败" });
    }
  }
);

// 获取审计追踪
app.get(
  "/api/compliance/audit-trails",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const auditTrails = [
        {
          id: 1,
          userId: 1,
          username: "admin",
          action: "查看专利详情",
          targetType: "patent",
          targetId: 123,
          details: "用户查看了专利ID为123的详细信息",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          ipAddress: "192.168.1.100",
        },
        {
          id: 2,
          userId: 2,
          username: "user1",
          action: "更新专利状态",
          targetType: "patent",
          targetId: 456,
          details: "用户将专利状态从'申请中'更新为'已授权'",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          ipAddress: "192.168.1.101",
        },
      ];

      res.json({ success: true, data: auditTrails });
    } catch (error) {
      res.status(500).json({ error: "获取审计追踪失败" });
    }
  }
);

// 添加审计追踪
app.post(
  "/api/compliance/audit-trails",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { action, targetType, targetId, details } = req.body;

      const newAuditTrail = {
        id: Date.now(),
        userId: req.user.id,
        username: req.user.username,
        action,
        targetType,
        targetId,
        details,
        timestamp: new Date(),
        ipAddress: req.ip || "unknown",
      };

      res.json({ success: true, data: newAuditTrail });
    } catch (error) {
      res.status(500).json({ error: "添加审计追踪失败" });
    }
  }
);

// 获取隐私事件
app.get(
  "/api/compliance/privacy-events",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const privacyEvents = [
        {
          id: 1,
          type: "data_access",
          description: "用户访问个人数据",
          severity: "low",
          status: "resolved",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          resolution: "正常访问，符合权限要求",
        },
        {
          id: 2,
          type: "data_export",
          description: "用户导出专利数据",
          severity: "medium",
          status: "pending",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          resolution: "等待管理员审批",
        },
      ];

      res.json({ success: true, data: privacyEvents });
    } catch (error) {
      res.status(500).json({ error: "获取隐私事件失败" });
    }
  }
);

// 添加隐私事件
app.post(
  "/api/compliance/privacy-events",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { type, description, severity } = req.body;

      const newPrivacyEvent = {
        id: Date.now(),
        type,
        description,
        severity,
        status: "pending",
        timestamp: new Date(),
        resolution: "",
      };

      res.json({ success: true, data: newPrivacyEvent });
    } catch (error) {
      res.status(500).json({ error: "添加隐私事件失败" });
    }
  }
);

// 更新隐私事件状态
app.patch(
  "/api/compliance/privacy-events/:timestamp/status",
  authenticateToken,
  requireRole(["admin", "compliance_manager"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const timestamp = req.params.timestamp;
      const { status, resolution } = req.body;

      const updatedPrivacyEvent = {
        timestamp,
        status,
        resolution,
        updatedAt: new Date(),
      };

      res.json({ success: true, data: updatedPrivacyEvent });
    } catch (error) {
      res.status(500).json({ error: "更新隐私事件状态失败" });
    }
  }
);

// 清除审计追踪
app.delete(
  "/api/compliance/audit-trails",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { days } = req.query;
      const daysToKeep = days ? parseInt(days as string) : 90;

      res.json({
        success: true,
        message: `已清除${daysToKeep}天前的审计追踪记录`,
        clearedCount: Math.floor(Math.random() * 1000), // 模拟清除的记录数量
      });
    } catch (error) {
      res.status(500).json({ error: "清除审计追踪失败" });
    }
  }
);

// AI知识图谱生成API

// 个性化设置API
app.get(
  "/api/personalization/settings/:userId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // 检查权限：只能获取自己的设置或管理员
      if (req.user!.id !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "权限不足" });
      }

      const personalizationSettings = {
        userId,
        theme: "light",
        language: "zh-CN",
        dashboard: {
          widgets: [
            "patent-overview",
            "recent-activities",
            "upcoming-deadlines",
          ],
          layout: "grid",
          refreshInterval: 300,
        },
        notifications: {
          email: true,
          push: true,
          sms: false,
          frequency: "realtime",
        },
        preferences: {
          defaultView: "list",
          itemsPerPage: 20,
          autoSave: true,
          showTutorials: true,
        },
      };

      res.json(personalizationSettings);
    } catch (error) {
      res.status(500).json({ error: "获取个性化设置失败" });
    }
  }
);

app.put(
  "/api/personalization/settings/:userId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // 检查权限：只能更新自己的设置或管理员
      if (req.user!.id !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "权限不足" });
      }

      const updatedSettings = req.body;

      // 这里应该更新数据库中的个性化设置
      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      res.status(500).json({ error: "更新个性化设置失败" });
    }
  }
);

// 集成管理API
app.get(
  "/api/integrations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const integrations = [
        {
          id: 1,
          name: "专利数据库",
          type: "external_api",
          status: "connected",
          description: "连接外部专利数据库进行检索",
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
          config: {
            apiKey: "***",
            endpoint: "https://api.patentdb.com",
            syncInterval: 3600,
          },
        },
        {
          id: 2,
          name: "邮件系统",
          type: "email",
          status: "connected",
          description: "集成企业邮件系统发送通知",
          lastSync: new Date(Date.now() - 5 * 60 * 1000),
          config: {
            smtpServer: "smtp.company.com",
            port: 587,
            secure: true,
          },
        },
        {
          id: 3,
          name: "日历系统",
          type: "calendar",
          status: "disconnected",
          description: "同步截止日期到企业日历",
          lastSync: null,
          config: {
            provider: "outlook",
            syncDeadlines: true,
          },
        },
      ];

      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "获取集成列表失败" });
    }
  }
);

app.post(
  "/api/integrations/:id/connect",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { config } = req.body;

      // 模拟连接集成
      await new Promise((resolve) => setTimeout(resolve, 2000));

      res.json({
        success: true,
        message: "集成连接成功",
        status: "connected",
        lastSync: new Date(),
      });
    } catch (error) {
      res.status(500).json({ error: "连接集成失败" });
    }
  }
);

app.post(
  "/api/integrations/:id/disconnect",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const integrationId = parseInt(req.params.id);

      // 模拟断开集成
      await new Promise((resolve) => setTimeout(resolve, 1000));

      res.json({
        success: true,
        message: "集成已断开",
        status: "disconnected",
      });
    } catch (error) {
      res.status(500).json({ error: "断开集成失败" });
    }
  }
);

// 文档管理增强API
app.post(
  "/api/documents/analyze",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { documentId, analysisType } = req.body;

      // 模拟文档分析
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const analysisResult = {
        id: Date.now(),
        documentId,
        analysisType,
        status: "completed",
        results: {
          wordCount: Math.floor(Math.random() * 5000) + 1000,
          readability: Math.random() * 100,
          technicalTerms: Math.floor(Math.random() * 50) + 10,
          suggestions: [
            "建议增加图表说明",
            "技术术语需要统一",
            "建议补充背景技术",
          ],
        },
        createdAt: new Date(),
      };

      res.json(analysisResult);
    } catch (error) {
      res.status(500).json({ error: "文档分析失败" });
    }
  }
);

app.get(
  "/api/documents/templates",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const templates = [
        {
          id: 1,
          name: "发明专利申请书",
          type: "patent_application",
          description: "标准发明专利申请书模板",
          category: "invention",
          fileUrl: "/templates/invention_application.docx",
          version: "1.2",
          lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          name: "实用新型申请书",
          type: "patent_application",
          description: "标准实用新型申请书模板",
          category: "utility",
          fileUrl: "/templates/utility_application.docx",
          version: "1.1",
          lastUpdated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
        {
          id: 3,
          name: "外观设计申请书",
          type: "patent_application",
          description: "标准外观设计申请书模板",
          category: "design",
          fileUrl: "/templates/design_application.docx",
          version: "1.0",
          lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      ];

      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "获取文档模板失败" });
    }
  }
);

// 工作流管理API已移至 server/routes/workflows.ts 中处理

// 数据导入导出API
app.post(
  "/api/data/import",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { type, fileUrl, options } = req.body;

      // 模拟数据导入过程
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const importResult = {
        id: Date.now(),
        type,
        fileUrl,
        status: "completed",
        recordsImported: Math.floor(Math.random() * 1000) + 100,
        recordsFailed: Math.floor(Math.random() * 10),
        errors: [],
        importedAt: new Date(),
        importedBy: req.user!.id,
      };

      res.json(importResult);
    } catch (error) {
      res.status(500).json({ error: "数据导入失败" });
    }
  }
);

app.post(
  "/api/data/export",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { type, filters, format = "excel" } = req.body;

      // 模拟数据导出过程
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const exportResult = {
        id: Date.now(),
        type,
        filters,
        format,
        status: "completed",
        downloadUrl: `/exports/${Date.now()}_${type}.${format}`,
        recordCount: Math.floor(Math.random() * 10000) + 1000,
        exportedAt: new Date(),
        exportedBy: req.user!.id,
      };

      res.json(exportResult);
    } catch (error) {
      res.status(500).json({ error: "数据导出失败" });
    }
  }
);

// 系统监控API
app.get(
  "/api/monitoring/system",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const systemMetrics = {
        cpu: {
          usage: Math.random() * 100,
          cores: 8,
          temperature: 45 + Math.random() * 20,
        },
        memory: {
          total: 16384, // 16GB
          used: Math.floor(Math.random() * 12000) + 4000,
          available: Math.floor(Math.random() * 8000) + 2000,
        },
        disk: {
          total: 1000000, // 1TB
          used: Math.floor(Math.random() * 600000) + 200000,
          available: Math.floor(Math.random() * 400000) + 100000,
        },
        network: {
          upload: Math.random() * 100,
          download: Math.random() * 1000,
          connections: Math.floor(Math.random() * 1000) + 100,
        },
        uptime:
          Math.floor(Math.random() * 30 * 24 * 60 * 60) + 7 * 24 * 60 * 60, // 7-37天
        lastUpdate: new Date(),
      };

      res.json(systemMetrics);
    } catch (error) {
      res.status(500).json({ error: "获取系统监控数据失败" });
    }
  }
);

app.get(
  "/api/monitoring/performance",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { period = "24h" } = req.query;

      // 模拟性能监控数据
      const performanceData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
        responseTime: Math.random() * 200 + 50,
        requestsPerSecond: Math.random() * 100 + 50,
        errorRate: Math.random() * 5,
        activeUsers: Math.floor(Math.random() * 1000) + 100,
      }));

      res.json(performanceData);
    } catch (error) {
      res.status(500).json({ error: "获取性能监控数据失败" });
    }
  }
);

// 知识库管理API
app.get(
  "/api/knowledge-base",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, category, search } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // 模拟知识库数据
      const knowledgeArticles = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `专利管理知识文章 ${i + 1}`,
        content: `这是第 ${i + 1} 篇专利管理相关的知识文章内容...`,
        category: ["专利申请", "专利维护", "法律知识", "技术文档"][
          Math.floor(Math.random() * 4)
        ],
        tags: ["专利", "管理", "法律"],
        author: `作者 ${Math.floor(Math.random() * 10) + 1}`,
        viewCount: Math.floor(Math.random() * 1000),
        rating: Math.random() * 5,
        createdAt: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ),
        updatedAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
      }));

      let filteredArticles = knowledgeArticles;
      if (category) {
        filteredArticles = filteredArticles.filter(
          (a) => a.category === category
        );
      }
      if (search) {
        filteredArticles = filteredArticles.filter(
          (a) =>
            a.title.includes(search as string) ||
            a.content.includes(search as string)
        );
      }

      const total = filteredArticles.length;
      const paginatedArticles = filteredArticles.slice(
        skip,
        skip + parseInt(limit as string)
      );

      res.json({
        articles: paginatedArticles,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取知识库文章失败" });
    }
  }
);

app.post(
  "/api/knowledge-base",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { title, content, category, tags } = req.body;

      const newArticle = {
        id: Date.now(),
        title,
        content,
        category,
        tags: tags || [],
        author: req.user!.realName,
        viewCount: 0,
        rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.json(newArticle);
    } catch (error) {
      res.status(500).json({ error: "创建知识库文章失败" });
    }
  }
);

// 专利申请相关API
app.post(
  "/api/patent-applications",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log("🔍 专利申请请求数据:", req.body);

      const {
        title,
        description,
        patentNumber,
        applicationDate,
        applicationNumber, // 前端字段
        submitDate, // 前端字段
        type,
        categoryId,
        applicants,
        applicant, // 前端字段
        inventors,
        technicalField,
        keywords,
        priority,
      } = req.body;

      // 数据验证
      if (!title || !patentNumber || !type) {
        return res.status(400).json({
          error: "缺少必需字段",
          details: "专利标题、专利号和类型为必填项",
        });
      }

      // 验证分类ID是否存在（如果提供了的话）
      if (categoryId) {
        const category = await prisma.patentCategory.findUnique({
          where: { id: parseInt(categoryId) },
        });

        if (!category) {
          return res.status(400).json({
            error: "分类不存在",
            details: `分类ID ${categoryId} 在数据库中不存在`,
            suggestion: "请使用有效的分类ID，或留空分类字段",
          });
        }
      }

      // 验证用户ID是否存在
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(400).json({
          error: "用户不存在",
          details: `用户ID ${req.user!.id} 在数据库中不存在`,
          suggestion: "请重新登录或联系管理员",
        });
      }

      // 处理前端数据格式，转换为后端期望的格式
      const patentData = {
        title,
        description: description || "",
        patentNumber,
        status: "pending", // 待审核状态
        type,
        categoryId: categoryId ? parseInt(categoryId) : null,
        applicationDate: applicationDate
          ? new Date(applicationDate)
          : submitDate
          ? new Date(submitDate)
          : new Date(),
        priority: priority || "medium",
        technicalField: technicalField || "",
        keywords: keywords ? JSON.stringify(keywords) : null,
        applicants: applicants
          ? JSON.stringify(applicants)
          : applicant
          ? JSON.stringify([applicant])
          : null,
        inventors: inventors ? JSON.stringify(inventors) : null,
        userId: req.user!.id,
      };

      console.log("🔍 处理后的专利数据:", patentData);

      // 创建专利申请（状态为pending）
      const patent = await prisma.patent.create({
        data: patentData,
        include: {
          user: { select: { realName: true, username: true } },
          category: { select: { name: true } },
        },
      });

      console.log("✅ 专利申请创建成功:", patent.id);
      res.json({ success: true, patent });
    } catch (error) {
      console.error("创建专利申请失败:", error);
      console.error("错误详情:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });

      if (error.code === "P2002") {
        res.status(400).json({
          error: "专利号已存在",
          details: "请使用不同的专利号",
        });
      } else if (error.code === "P2003") {
        res.status(400).json({
          error: "外键约束违反",
          details: "分类ID或用户ID不存在",
        });
      } else {
        res.status(500).json({ error: "创建专利申请失败" });
      }
    }
  }
);

// 获取专利申请列表（用于审核）
app.get(
  "/api/patent-applications",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (status) {
        where.status = status;
      }

      // 只获取待审核的专利申请
      if (!status) {
        where.status = "pending";
      }

      const [applications, total] = await Promise.all([
        prisma.patent.findMany({
          where,
          include: {
            user: { select: { realName: true, username: true } },
            category: { select: { name: true } },
          },
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.patent.count({ where }),
      ]);

      res.json({
        applications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("获取专利申请列表失败:", error);
      res.status(500).json({ error: "获取专利申请列表失败" });
    }
  }
);

// 审核专利申请
app.put(
  "/api/patent-applications/:id/review",
  authenticateToken,
  requireRole(["admin", "reviewer"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status, comment } = req.body; // status: "approved" | "rejected"

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "状态值无效" });
      }

      const patent = await prisma.patent.update({
        where: { id: parseInt(id) },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          user: { select: { realName: true, username: true } },
          category: { select: { name: true } },
        },
      });

      // 记录审核活动
      await prisma.activity.create({
        data: {
          type: status === "approved" ? "patent_approve" : "patent_reject",
          title: `专利申请${status === "approved" ? "通过" : "驳回"}`,
          description: `专利"${patent.title}"${
            status === "approved" ? "审核通过" : "审核驳回"
          }`,
          userId: req.user!.id,
          targetId: patent.id,
          targetName: patent.title,
          status: "success",
          statusText: status === "approved" ? "审核通过" : "审核驳回",
        },
      });

      res.json({ success: true, patent });
    } catch (error) {
      console.error("审核专利申请失败:", error);
      res.status(500).json({ error: "审核专利申请失败" });
    }
  }
);

// 独立费用管理API路由
app.get(
  "/api/fees",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = "1", limit = "10", status, type } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;

      const [fees, total] = await Promise.all([
        prisma.fee.findMany({
          where,
          include: {
            patent: { select: { title: true, patentNumber: true } },
          },
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.fee.count({ where }),
      ]);

      res.json({
        fees,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("获取费用列表失败:", error);
      res.status(500).json({ error: "获取费用列表失败" });
    }
  }
);

app.post(
  "/api/fees",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        patentId,
        type,
        feeType,
        amount,
        currency,
        dueDate,
        description,
        notes,
      } = req.body;
      console.log("创建费用请求数据:", {
        patentId,
        type,
        feeType,
        amount,
        currency,
        dueDate,
        description,
        notes,
      });

      // 验证输入
      if (!patentId || !type || !amount || !dueDate) {
        console.log("缺少必要字段:", { patentId, type, amount, dueDate });
        return res.status(400).json({
          error: "缺少必要字段",
          details: {
            patentId: !patentId ? "专利ID缺失" : null,
            type: !type ? "费用类型缺失" : null,
            amount: !amount ? "金额缺失" : null,
            dueDate: !dueDate ? "到期日期缺失" : null,
          },
        });
      }

      // 验证专利是否存在
      const patent = await prisma.patent.findUnique({
        where: { id: parseInt(patentId) },
        select: { id: true, title: true, patentNumber: true },
      });

      if (!patent) {
        console.log(`指定的专利不存在，ID: ${patentId}`);
        return res.status(400).json({ error: "指定的专利不存在" });
      }

      console.log("找到专利:", patent);

      const fee = await prisma.fee.create({
        data: {
          patentId: parseInt(patentId),
          patentNumber: patent.patentNumber,
          patentTitle: patent.title,
          type,
          feeType: feeType || type, // 兼容前端字段名
          amount: parseFloat(amount),
          currency: currency || "CNY",
          dueDate: new Date(dueDate),
          description: description || "",
          notes: notes || "",
          status: "pending",
        } as any,
        include: {
          patent: { select: { title: true, patentNumber: true } },
        },
      });

      // 构造返回数据，包含专利信息
      const feeWithPatent = {
        ...fee,
        patentNumber: patent.patentNumber,
        patentTitle: patent.title,
      };

      console.log("费用创建成功:", feeWithPatent);
      res.status(201).json(feeWithPatent);
    } catch (error) {
      console.error("创建费用失败:", error);
      res.status(500).json({ error: "创建费用失败" });
    }
  }
);

app.get(
  "/api/fees/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const feeId = parseInt(req.params.id);
      const fee = await prisma.fee.findUnique({
        where: { id: feeId },
        include: {
          patent: { select: { title: true, patentNumber: true } },
        },
      });

      if (!fee) {
        return res.status(404).json({ error: "费用记录不存在" });
      }

      res.json(fee);
    } catch (error) {
      console.error("获取费用详情失败:", error);
      res.status(500).json({ error: "获取费用详情失败" });
    }
  }
);

app.put(
  "/api/fees/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const feeId = parseInt(req.params.id);
      const { type, amount, currency, dueDate, status, description } = req.body;

      const fee = await prisma.fee.update({
        where: { id: feeId },
        data: {
          type,
          amount: amount ? parseFloat(amount) : undefined,
          currency,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          status,
          description,
          updatedAt: new Date(),
        },
        include: {
          patent: { select: { title: true, patentNumber: true } },
        },
      });

      res.json(fee);
    } catch (error) {
      console.error("更新费用失败:", error);
      res.status(500).json({ error: "更新费用失败" });
    }
  }
);

app.delete(
  "/api/fees/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const feeId = parseInt(req.params.id);
      console.log(`尝试删除费用记录，ID: ${feeId}`);

      // 首先检查费用记录是否存在
      const existingFee = await prisma.fee.findUnique({
        where: { id: feeId },
      });

      if (!existingFee) {
        console.log(`费用记录不存在，ID: ${feeId}`);
        return res.status(404).json({ error: "费用记录不存在" });
      }

      console.log(`找到费用记录:`, existingFee);

      // 尝试删除费用记录
      await prisma.fee.delete({
        where: { id: feeId },
      });

      console.log(`费用记录删除成功，ID: ${feeId}`);
      res.json({ success: true, message: "费用记录已删除" });
    } catch (error) {
      console.error("删除费用失败，详细错误:", error);

      // 提供更详细的错误信息
      if (error.code === "P2025") {
        res.status(404).json({ error: "费用记录不存在" });
      } else if (error.code === "P2003") {
        res.status(400).json({ error: "无法删除费用记录，可能存在关联数据" });
      } else {
        res.status(500).json({
          error: "删除费用失败",
          details: error.message || "未知错误",
        });
      }
    }
  }
);

// 费用分类管理API
// 获取专利分类
app.get(
  "/api/patent-categories",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await prisma.patentCategory.findMany({
        orderBy: { name: "asc" },
      });
      res.json({ categories });
    } catch (error) {
      console.error("获取专利分类失败:", error);
      res.status(500).json({ error: "获取专利分类失败" });
    }
  }
);

app.get(
  "/api/fee-categories",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await prisma.feeCategory.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(categories);
    } catch (error) {
      console.error("获取费用分类失败:", error);
      res.status(500).json({ error: "获取费用分类失败" });
    }
  }
);

app.post(
  "/api/fee-categories",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, color } = req.body;

      if (!name) {
        return res.status(400).json({ error: "分类名称是必填字段" });
      }

      const category = await prisma.feeCategory.create({
        data: {
          name,
          description,
          color: color || "#409EFF",
        },
      });

      res.status(201).json(category);
    } catch (error) {
      console.error("创建费用分类失败:", error);
      if (error.code === "P2002") {
        res.status(400).json({ error: "分类名称已存在" });
      } else {
        res.status(500).json({ error: "创建费用分类失败" });
      }
    }
  }
);

app.put(
  "/api/fee-categories/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { name, description, color } = req.body;

      if (!name) {
        return res.status(400).json({ error: "分类名称是必填字段" });
      }

      const category = await prisma.feeCategory.update({
        where: { id: categoryId },
        data: {
          name,
          description,
          color,
          updatedAt: new Date(),
        },
      });

      res.json(category);
    } catch (error) {
      console.error("更新费用分类失败:", error);
      if (error.code === "P2025") {
        res.status(404).json({ error: "费用分类不存在" });
      } else if (error.code === "P2002") {
        res.status(400).json({ error: "分类名称已存在" });
      } else {
        res.status(500).json({ error: "更新费用分类失败" });
      }
    }
  }
);

app.delete(
  "/api/fee-categories/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);

      // 检查是否有费用使用此分类
      const feesUsingCategory = await prisma.fee.findFirst({
        where: { categoryId },
      });

      if (feesUsingCategory) {
        return res.status(400).json({
          error: "无法删除费用分类，仍有费用记录使用此分类",
        });
      }

      await prisma.feeCategory.delete({
        where: { id: categoryId },
      });

      res.json({ success: true, message: "费用分类已删除" });
    } catch (error) {
      console.error("删除费用分类失败:", error);
      if (error.code === "P2025") {
        res.status(404).json({ error: "费用分类不存在" });
      } else {
        res.status(500).json({ error: "删除费用分类失败" });
      }
    }
  }
);

// 费用状态更新API
app.put(
  "/api/fees/:id/status",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const feeId = parseInt(req.params.id);
      const { status } = req.body;

      if (
        !status ||
        !["pending", "paid", "overdue", "waived", "refunded"].includes(status)
      ) {
        return res.status(400).json({ error: "无效的状态值" });
      }

      const fee = await prisma.fee.update({
        where: { id: feeId },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          patent: { select: { title: true, patentNumber: true } },
        },
      });

      res.json(fee);
    } catch (error) {
      console.error("更新费用状态失败:", error);
      if (error.code === "P2025") {
        res.status(404).json({ error: "费用记录不存在" });
      } else {
        res.status(500).json({ error: "更新费用状态失败" });
      }
    }
  }
);

// 可视化相关API

// 期限管理路由
app.use("/api/deadlines", deadlinesRouter);

// 用户管理路由
app.use("/api/users", usersRouter);

// 协作空间路由
app.use("/api/collaboration", collaborationRouter);

// 任务管理路由
app.use("/api/tasks", createTasksRouter(prisma));

// 工作流管理路由
import createWorkflowsRouter from "./routes/workflows";
import createWorkflowTemplatesRouter from "./routes/workflowTemplates";
app.use("/api/workflows", createWorkflowsRouter(prisma));
app.use("/api/workflow-templates", createWorkflowTemplatesRouter(prisma));

// 用户更新路由已移至 server/routes/users.ts 中处理

// 启动代码已移动到文件末尾

// 文档管理API
app.get(
  "/api/documents/versions",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const versions = await prisma.documentVersion.findMany({
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(versions);
    } catch (error) {
      console.error("获取文档版本失败:", error);
      res.status(500).json({ error: "获取文档版本失败" });
    }
  }
);

app.post(
  "/api/documents/versions",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { documentId, version, content, changes } = req.body;

      const versionRecord = await prisma.documentVersion.create({
        data: {
          documentId,
          version,
          content,
          changes: changes ? JSON.stringify(changes) : null,
          createdBy: req.user!.id,
        },
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(versionRecord);
    } catch (error) {
      console.error("创建文档版本失败:", error);
      res.status(500).json({ error: "创建文档版本失败" });
    }
  }
);

app.get(
  "/api/documents/workflows",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const workflows = await prisma.approvalWorkflow.findMany({
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(workflows);
    } catch (error) {
      console.error("获取审批工作流失败:", error);
      res.status(500).json({ error: "获取审批工作流失败" });
    }
  }
);

app.post(
  "/api/documents/workflows",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, steps } = req.body;

      const workflow = await prisma.approvalWorkflow.create({
        data: {
          name,
          description,
          steps: JSON.stringify(steps),
          createdBy: req.user!.id,
        },
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(workflow);
    } catch (error) {
      console.error("创建审批工作流失败:", error);
      res.status(500).json({ error: "创建审批工作流失败" });
    }
  }
);

app.get(
  "/api/documents/templates",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const templates = await prisma.documentTemplate.findMany({
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(templates);
    } catch (error) {
      console.error("获取文档模板失败:", error);
      res.status(500).json({ error: "获取文档模板失败" });
    }
  }
);

app.post(
  "/api/documents/templates",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, type, content, variables } = req.body;

      const template = await prisma.documentTemplate.create({
        data: {
          name,
          type,
          content,
          variables: variables ? JSON.stringify(variables) : null,
          createdBy: req.user!.id,
        },
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(template);
    } catch (error) {
      console.error("创建文档模板失败:", error);
      res.status(500).json({ error: "创建文档模板失败" });
    }
  }
);

app.get(
  "/api/documents/access",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const access = await prisma.documentAccess.findMany({
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
          granter: {
            select: { id: true, realName: true, username: true },
          },
        },
        orderBy: { grantedAt: "desc" },
      });

      res.json(access);
    } catch (error) {
      console.error("获取文档访问控制失败:", error);
      res.status(500).json({ error: "获取文档访问控制失败" });
    }
  }
);

app.post(
  "/api/documents/access",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { documentId, userId, permission, expiresAt } = req.body;

      const access = await prisma.documentAccess.create({
        data: {
          documentId,
          userId,
          permission,
          grantedBy: req.user!.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
          granter: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(access);
    } catch (error) {
      console.error("创建文档访问控制失败:", error);
      res.status(500).json({ error: "创建文档访问控制失败" });
    }
  }
);

app.get(
  "/api/documents/activity-logs",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const logs = await prisma.activityLog.findMany({
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      res.json(logs);
    } catch (error) {
      console.error("获取活动日志失败:", error);
      res.status(500).json({ error: "获取活动日志失败" });
    }
  }
);

app.post(
  "/api/documents/activity-logs",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { action, targetType, targetId, details, ipAddress, userAgent } =
        req.body;

      const log = await prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          type: action,
          title: `${targetType} ${action}`,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent,
        },
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(log);
    } catch (error) {
      console.error("创建活动日志失败:", error);
      res.status(500).json({ error: "创建活动日志失败" });
    }
  }
);

app.get(
  "/api/documents/signatures",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const signatures = await prisma.electronicSignature.findMany({
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
        orderBy: { signedAt: "desc" },
      });

      res.json(signatures);
    } catch (error) {
      console.error("获取电子签名失败:", error);
      res.status(500).json({ error: "获取电子签名失败" });
    }
  }
);

app.post(
  "/api/documents/signatures",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { documentId, signature, expiresAt } = req.body;

      const signatureRecord = await prisma.electronicSignature.create({
        data: {
          documentId,
          userId: req.user!.id,
          signature,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: {
          user: {
            select: { id: true, realName: true, username: true },
          },
        },
      });

      res.json(signatureRecord);
    } catch (error) {
      console.error("创建电子签名失败:", error);
      res.status(500).json({ error: "创建电子签名失败" });
    }
  }
);

// 专利文档管理
app.post(
  "/api/patents/:id/documents",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);
      const { name, type, fileUrl, fileSize } = req.body;

      // 验证专利是否存在
      const patent = await prisma.patent.findUnique({
        where: { id: patentId },
      });

      if (!patent) {
        return res.status(404).json({ error: "专利不存在" });
      }

      // 创建文档记录
      const document = await prisma.patentDocument.create({
        data: {
          patentId,
          name,
          type,
          fileUrl,
          fileSize: fileSize || 0,
          uploadedBy: req.user!.id,
        },
      });

      res.json(document);
    } catch (error) {
      console.error("创建专利文档失败:", error);
      res.status(500).json({ error: "创建专利文档失败" });
    }
  }
);

app.delete(
  "/api/patents/:id/documents/:documentId",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id: patentId, documentId } = req.params;
      const patentIdNum = parseInt(patentId);
      const documentIdNum = parseInt(documentId);

      // 验证专利是否存在
      const patent = await prisma.patent.findUnique({
        where: { id: patentIdNum },
      });

      if (!patent) {
        return res.status(404).json({ error: "专利不存在" });
      }

      // 删除文档记录
      await prisma.patentDocument.delete({
        where: { id: documentIdNum },
      });

      res.json({ message: "文档删除成功" });
    } catch (error) {
      console.error("删除专利文档失败:", error);
      res.status(500).json({ error: "删除专利文档失败" });
    }
  }
);

app.get(
  "/api/patents/:id/documents",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const patentId = parseInt(req.params.id);

      // 验证专利是否存在
      const patent = await prisma.patent.findUnique({
        where: { id: patentId },
      });

      if (!patent) {
        return res.status(404).json({ error: "专利不存在" });
      }

      // 获取专利文档列表
      const documents = await prisma.patentDocument.findMany({
        where: { patentId },
        orderBy: { uploadedAt: "desc" },
      });

      res.json(documents);
    } catch (error) {
      console.error("获取专利文档失败:", error);
      res.status(500).json({ error: "获取专利文档失败" });
    }
  }
);

// 用户管理API
// 获取用户列表
app.get(
  "/api/users",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      // 检查权限：只有管理员可以获取用户列表
      if (req.user!.role !== "admin") {
        return res.status(403).json({ error: "权限不足" });
      }

      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          realName: true,
          role: true,
          department: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ users });
    } catch (error) {
      console.error("获取用户列表失败:", error);
      res.status(500).json({ error: "获取用户列表失败" });
    }
  }
);

// 重复的GET路由已删除，使用第517行的路由

// 测试路由已删除

// 用户更新PUT路由已移动到通配符中间件之前

// 修改密码
app.put(
  "/api/users/:id/password",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { oldPassword, newPassword } = req.body;

      // 检查权限：只能修改自己的密码
      if (req.user!.id !== userId) {
        return res.status(403).json({ error: "权限不足" });
      }

      // 验证用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "用户不存在" });
      }

      // 验证原密码
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "原密码不正确" });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.json({ success: true, message: "密码修改成功" });
    } catch (error) {
      console.error("修改密码失败:", error);
      res.status(500).json({ error: "修改密码失败" });
    }
  }
);

// 费用协议管理API
app.get(
  "/api/fee-agreements",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, status, lawFirmId } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (status) where.status = status;
      if (lawFirmId) where.lawFirmId = parseInt(lawFirmId as string);

      const [agreements, total] = await Promise.all([
        prisma.feeAgreement.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.feeAgreement.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          feeAgreements: agreements,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取费用协议列表失败" });
    }
  }
);

app.post(
  "/api/fee-agreements",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const agreementData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        lastPaymentDate: req.body.lastPaymentDate
          ? new Date(req.body.lastPaymentDate)
          : null,
        nextPaymentDate: req.body.nextPaymentDate
          ? new Date(req.body.nextPaymentDate)
          : null,
      };

      const agreement = await prisma.feeAgreement.create({
        data: agreementData,
      });

      res.status(201).json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      res.status(500).json({ error: "创建费用协议失败" });
    }
  }
);

app.put(
  "/api/fee-agreements/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        lastPaymentDate: req.body.lastPaymentDate
          ? new Date(req.body.lastPaymentDate)
          : undefined,
        nextPaymentDate: req.body.nextPaymentDate
          ? new Date(req.body.nextPaymentDate)
          : undefined,
      };

      const agreement = await prisma.feeAgreement.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      res.json(agreement);
    } catch (error) {
      res.status(500).json({ error: "更新费用协议失败" });
    }
  }
);

app.delete(
  "/api/fee-agreements/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await prisma.feeAgreement.delete({
        where: { id: parseInt(id) },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "删除费用协议失败" });
    }
  }
);

// 服务质量评估管理API
app.get(
  "/api/service-evaluations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, status, lawFirmId } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (status) where.status = status;
      if (lawFirmId) where.lawFirmId = parseInt(lawFirmId as string);

      const [evaluations, total] = await Promise.all([
        prisma.serviceEvaluation.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
        }),
        prisma.serviceEvaluation.count({ where }),
      ]);

      // 处理criteria字段，将JSON字符串解析为对象
      const processedEvaluations = evaluations.map((evaluation) => ({
        ...evaluation,
        criteria: evaluation.criteria ? JSON.parse(evaluation.criteria) : null,
      }));

      res.json({
        success: true,
        data: {
          serviceEvaluations: processedEvaluations,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: "获取服务质量评估列表失败" });
    }
  }
);

app.post(
  "/api/service-evaluations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const evaluationData = {
        ...req.body,
        evaluationDate: req.body.evaluationDate
          ? new Date(req.body.evaluationDate)
          : new Date(),
        criteria: req.body.criteria ? JSON.stringify(req.body.criteria) : null,
      };

      const evaluation = await prisma.serviceEvaluation.create({
        data: evaluationData,
      });

      // 处理criteria字段，将JSON字符串解析为对象
      const processedEvaluation = {
        ...evaluation,
        criteria: evaluation.criteria ? JSON.parse(evaluation.criteria) : null,
      };

      res.status(201).json({
        success: true,
        data: processedEvaluation,
      });
    } catch (error) {
      res.status(500).json({ error: "创建服务质量评估失败" });
    }
  }
);

app.put(
  "/api/service-evaluations/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        evaluationDate: req.body.evaluationDate
          ? new Date(req.body.evaluationDate)
          : undefined,
        criteria: req.body.criteria
          ? JSON.stringify(req.body.criteria)
          : undefined,
      };

      const evaluation = await prisma.serviceEvaluation.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      // 处理criteria字段，将JSON字符串解析为对象
      const processedEvaluation = {
        ...evaluation,
        criteria: evaluation.criteria ? JSON.parse(evaluation.criteria) : null,
      };

      res.json({
        success: true,
        data: processedEvaluation,
      });
    } catch (error) {
      res.status(500).json({ error: "更新服务质量评估失败" });
    }
  }
);

app.delete(
  "/api/service-evaluations/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await prisma.serviceEvaluation.delete({
        where: { id: parseInt(id) },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "删除服务质量评估失败" });
    }
  }
);

// ==================== 第三阶段：高级数据安全功能 ====================

// 威胁检测相关API
app.get(
  "/api/threat-detection/rules",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const rules = threatDetectionService.getSecurityRules();
      res.json({ success: true, rules });
    } catch (error) {
      console.error("获取安全规则失败:", error);
      res.status(500).json({ error: "获取安全规则失败" });
    }
  }
);

app.post(
  "/api/threat-detection/rules",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const rule = req.body;
      threatDetectionService.addSecurityRule(rule);
      res.json({ success: true, message: "安全规则添加成功" });
    } catch (error) {
      console.error("添加安全规则失败:", error);
      res.status(500).json({ error: "添加安全规则失败" });
    }
  }
);

app.get(
  "/api/threat-detection/scores",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const scores = threatDetectionService.getAllThreatScores();
      res.json({ success: true, scores });
    } catch (error) {
      console.error("获取威胁评分失败:", error);
      res.status(500).json({ error: "获取威胁评分失败" });
    }
  }
);

app.get(
  "/api/threat-detection/scores/:userId",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const score = threatDetectionService.getThreatScore(userId);
      res.json({ success: true, score });
    } catch (error) {
      console.error("获取用户威胁评分失败:", error);
      res.status(500).json({ error: "获取用户威胁评分失败" });
    }
  }
);

app.post(
  "/api/threat-detection/analyze",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { eventType, metadata } = req.body;
      const threats = await threatDetectionService.analyzeSecurityEvent(
        req.user.id,
        eventType,
        metadata,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ success: true, threats });
    } catch (error) {
      console.error("威胁分析失败:", error);
      res.status(500).json({ error: "威胁分析失败" });
    }
  }
);

app.get(
  "/api/threat-detection/report",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { startDate, endDate, userId } = req.query;
      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      const userIdNum = userId ? parseInt(userId as string) : undefined;

      const report = await threatDetectionService.generateThreatReport(
        start,
        end,
        userIdNum
      );
      res.json({ success: true, report });
    } catch (error) {
      console.error("生成威胁报告失败:", error);
      res.status(500).json({ error: "生成威胁报告失败" });
    }
  }
);

// 合规性检查相关API
app.get(
  "/api/compliance/rules",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const rules = complianceService.getComplianceRules();
      res.json({ success: true, rules });
    } catch (error) {
      console.error("获取合规规则失败:", error);
      res.status(500).json({ error: "获取合规规则失败" });
    }
  }
);

app.post(
  "/api/compliance/check",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { ruleId } = req.body;
      const checks = await complianceService.performComplianceCheck(ruleId);
      res.json({ success: true, checks });
    } catch (error) {
      console.error("执行合规检查失败:", error);
      res.status(500).json({ error: "执行合规检查失败" });
    }
  }
);

app.get(
  "/api/compliance/report",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { period, startDate, endDate } = req.query;
      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const report = await complianceService.generateComplianceReport(
        (period as any) || "monthly",
        start,
        end
      );
      res.json({ success: true, report });
    } catch (error) {
      console.error("生成合规报告失败:", error);
      res.status(500).json({ error: "生成合规报告失败" });
    }
  }
);

app.get(
  "/api/compliance/policies",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const policies = complianceService.getRetentionPolicies();
      res.json({ success: true, policies });
    } catch (error) {
      console.error("获取数据保留策略失败:", error);
      res.status(500).json({ error: "获取数据保留策略失败" });
    }
  }
);

// 安全审计相关API
app.post(
  "/api/audit/event",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      const { action, resource, resourceId, details } = req.body;
      await securityAuditService.recordAuditEvent(
        req.user.id,
        action,
        resource,
        resourceId,
        details,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ success: true, message: "审计事件记录成功" });
    } catch (error) {
      console.error("记录审计事件失败:", error);
      res.status(500).json({ error: "记录审计事件失败" });
    }
  }
);

app.get(
  "/api/audit/trails",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, startDate, endDate, limit } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : undefined;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const limitNum = limit ? parseInt(limit as string) : 100;

      const trails = securityAuditService.getAuditTrails(
        userIdNum,
        start,
        end,
        limitNum
      );
      res.json({ success: true, trails });
    } catch (error) {
      console.error("获取审计跟踪失败:", error);
      res.status(500).json({ error: "获取审计跟踪失败" });
    }
  }
);

app.get(
  "/api/audit/metrics",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { category, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const metrics = securityAuditService.getSecurityMetrics(
        category as any,
        start,
        end
      );
      res.json({ success: true, metrics });
    } catch (error) {
      console.error("获取安全指标失败:", error);
      res.status(500).json({ error: "获取安全指标失败" });
    }
  }
);

app.get(
  "/api/audit/risks",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const risks = securityAuditService.getAllRiskAssessments();
      res.json({ success: true, risks });
    } catch (error) {
      console.error("获取风险评估失败:", error);
      res.status(500).json({ error: "获取风险评估失败" });
    }
  }
);

app.get(
  "/api/audit/risks/:userId",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const risk = securityAuditService.getUserRiskAssessment(userId);
      res.json({ success: true, risk });
    } catch (error) {
      console.error("获取用户风险评估失败:", error);
      res.status(500).json({ error: "获取用户风险评估失败" });
    }
  }
);

app.get(
  "/api/audit/dashboard",
  authenticateToken,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const dashboard = await securityAuditService.generateSecurityDashboard();
      res.json({ success: true, dashboard });
    } catch (error) {
      console.error("生成安全仪表板失败:", error);
      res.status(500).json({ error: "生成安全仪表板失败" });
    }
  }
);

// 404处理 - 必须在所有路由之后，错误处理中间件之前
app.use("*", (req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

// 错误处理中间件 - 必须在所有路由之后
app.use((error: any, req: any, res: any, next: any) => {
  console.error("服务器错误:", error);
  res.status(500).json({ error: "服务器内部错误" });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});
