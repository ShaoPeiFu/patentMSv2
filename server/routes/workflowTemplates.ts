import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// 导出路由工厂函数，接收PrismaClient实例
export default function createWorkflowTemplatesRouter(prisma: PrismaClient) {
  // 获取工作流模板列表
  router.get("/", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { category, status, page = 1, limit = 20 } = req.query;

      const where: any = {};

      if (category) where.category = category;
      if (status) where.status = status;

      // 检查用户角色，admin用户可以看到所有模板
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // admin用户可以看到所有模板，其他用户只能看到自己创建的
      if (user?.role !== "admin") {
        where.createdBy = userId;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [templates, total] = await Promise.all([
        prisma.workflowTemplate.findMany({
          where,
          include: {
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
        prisma.workflowTemplate.count({ where }),
      ]);

      res.json({
        success: true,
        templates: templates.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          steps: JSON.parse(template.steps || "[]"),
          category: template.category,
          status: template.status,
          createdBy: template.createdBy,
          creator: template.user,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("获取工作流模板列表失败:", error);
      res.status(500).json({
        success: false,
        error: "获取工作流模板列表失败",
        details: error.message,
      });
    }
  });

  // 获取工作流模板详情
  router.get("/:id", authenticateToken, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      if (isNaN(templateId)) {
        return res.status(400).json({
          success: false,
          error: "无效的模板ID",
        });
      }

      const template = await prisma.workflowTemplate.findUnique({
        where: { id: templateId },
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

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "工作流模板不存在",
        });
      }

      // 检查用户角色，admin用户可以查看所有模板
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && template.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限查看此模板",
        });
      }

      res.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          steps: JSON.parse(template.steps || "[]"),
          category: template.category,
          status: template.status,
          createdBy: template.createdBy,
          creator: template.user,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      });
    } catch (error) {
      console.error("获取工作流模板详情失败:", error);
      res.status(500).json({
        success: false,
        error: "获取工作流模板详情失败",
        details: error.message,
      });
    }
  });

  // 创建工作流模板
  router.post("/", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const {
        name,
        description,
        steps,
        category,
        status = "active",
      } = req.body;

      if (!name || !steps || !Array.isArray(steps) || !category) {
        return res.status(400).json({
          success: false,
          error: "模板名称、步骤和分类不能为空",
        });
      }

      const newTemplate = await prisma.workflowTemplate.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          steps: JSON.stringify(steps),
          category: category.trim(),
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
        message: "工作流模板创建成功",
        template: {
          id: newTemplate.id,
          name: newTemplate.name,
          description: newTemplate.description,
          steps: JSON.parse(newTemplate.steps || "[]"),
          category: newTemplate.category,
          status: newTemplate.status,
          createdBy: newTemplate.createdBy,
          creator: newTemplate.user,
          createdAt: newTemplate.createdAt,
          updatedAt: newTemplate.updatedAt,
        },
      });
    } catch (error) {
      console.error("创建工作流模板失败:", error);
      res.status(500).json({
        success: false,
        error: "创建工作流模板失败",
        details: error.message,
      });
    }
  });

  // 更新工作流模板
  router.put("/:id", authenticateToken, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const updates = req.body;
      const userId = (req as any).user.id;

      if (isNaN(templateId)) {
        return res.status(400).json({
          success: false,
          error: "无效的模板ID",
        });
      }

      // 检查模板是否存在
      const existingTemplate = await prisma.workflowTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          error: "工作流模板不存在",
        });
      }

      // 检查用户角色，admin用户可以修改所有模板
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && existingTemplate.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限修改此模板",
        });
      }

      const updatedTemplate = await prisma.workflowTemplate.update({
        where: { id: templateId },
        data: {
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.description !== undefined && {
            description: updates.description?.trim(),
          }),
          ...(updates.steps && { steps: JSON.stringify(updates.steps) }),
          ...(updates.category && { category: updates.category.trim() }),
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
        message: "工作流模板更新成功",
        template: {
          id: updatedTemplate.id,
          name: updatedTemplate.name,
          description: updatedTemplate.description,
          steps: JSON.parse(updatedTemplate.steps || "[]"),
          category: updatedTemplate.category,
          status: updatedTemplate.status,
          createdBy: updatedTemplate.createdBy,
          creator: updatedTemplate.user,
          createdAt: updatedTemplate.createdAt,
          updatedAt: updatedTemplate.updatedAt,
        },
      });
    } catch (error) {
      console.error("更新工作流模板失败:", error);
      res.status(500).json({
        success: false,
        error: "更新工作流模板失败",
        details: error.message,
      });
    }
  });

  // 删除工作流模板
  router.delete("/:id", authenticateToken, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      if (isNaN(templateId)) {
        return res.status(400).json({
          success: false,
          error: "无效的模板ID",
        });
      }

      // 检查模板是否存在
      const existingTemplate = await prisma.workflowTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          error: "工作流模板不存在",
        });
      }

      // 检查用户角色，admin用户可以删除所有模板
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && existingTemplate.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限删除此模板",
        });
      }

      await prisma.workflowTemplate.delete({
        where: { id: templateId },
      });

      res.json({
        success: true,
        message: "工作流模板删除成功",
      });
    } catch (error) {
      console.error("删除工作流模板失败:", error);
      res.status(500).json({
        success: false,
        error: "删除工作流模板失败",
        details: error.message,
      });
    }
  });

  // 从模板创建工作流
  router.post("/:id/create-workflow", authenticateToken, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { name, description, customSteps } = req.body;
      const userId = (req as any).user.id;

      if (isNaN(templateId)) {
        return res.status(400).json({
          success: false,
          error: "无效的模板ID",
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          error: "工作流名称不能为空",
        });
      }

      // 获取模板
      const template = await prisma.workflowTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "工作流模板不存在",
        });
      }

      // 检查用户角色，admin用户可以查看所有模板
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // 如果不是admin用户，检查权限
      if (user?.role !== "admin" && template.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "无权限使用此模板",
        });
      }

      // 使用模板步骤或自定义步骤
      const steps = customSteps || JSON.parse(template.steps || "[]");

      // 创建工作流
      const newWorkflow = await prisma.approvalWorkflow.create({
        data: {
          name: name.trim(),
          description: description?.trim() || template.description,
          steps: JSON.stringify(steps),
          status: "active",
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
        message: "从模板创建工作流成功",
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
      console.error("从模板创建工作流失败:", error);
      res.status(500).json({
        success: false,
        error: "从模板创建工作流失败",
        details: error.message,
      });
    }
  });

  return router;
}
