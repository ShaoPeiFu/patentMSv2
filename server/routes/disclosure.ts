import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "disclosures");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件类型"));
    }
  },
});

// 生成公司案号的函数
function generateCompanyFileNumber(department: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");

  // 部门简称映射
  const deptMap: Record<string, string> = {
    admin: "AD",
    research: "RD",
    development: "DEV",
    legal: "LEG",
    marketing: "MKT",
    finance: "FIN",
    hr: "HR",
  };

  const deptCode =
    deptMap[department.toLowerCase()] ||
    department.substring(0, 3).toUpperCase();
  const timeCode = `${year}${month}${date}`;
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${deptCode}-${timeCode}-${random}`;
}

// 获取交底书列表
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      keyword,
      status,
      department,
      technicalField,
      submissionDateStart,
      submissionDateEnd,
      evaluatorId,
    } = req.query;

    const where: any = {};

    // 构建查询条件
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
        { companyFileNumber: { contains: keyword, mode: "insensitive" } },
        { inventors: { contains: keyword, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    if (technicalField) {
      where.technicalField = { contains: technicalField, mode: "insensitive" };
    }

    if (submissionDateStart || submissionDateEnd) {
      where.submissionDate = {};
      if (submissionDateStart) {
        where.submissionDate.gte = new Date(submissionDateStart);
      }
      if (submissionDateEnd) {
        where.submissionDate.lte = new Date(submissionDateEnd);
      }
    }

    if (evaluatorId) {
      where.evaluations = {
        some: {
          evaluatorId: parseInt(evaluatorId as string),
        },
      };
    }

    const [disclosures, total] = await Promise.all([
      prisma.disclosureDocument.findMany({
        where,
        include: {
          submitter: {
            select: {
              id: true,
              realName: true,
              department: true,
              email: true,
            },
          },
          evaluations: {
            include: {
              evaluator: {
                select: {
                  id: true,
                  realName: true,
                  email: true,
                },
              },
            },
          },
          agencies: {
            include: {
              agency: true,
              assignedByUser: {
                select: {
                  id: true,
                  realName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.disclosureDocument.count({ where }),
    ]);

    res.json({
      data: disclosures,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("获取交底书列表失败:", error);
    res.status(500).json({ error: "获取交底书列表失败" });
  }
});

// 获取统计信息
router.get("/statistics", authenticateToken, async (req, res) => {
  try {
    // 总数统计
    const total = await prisma.disclosureDocument.count();

    // 按状态统计
    const statusStats = await prisma.disclosureDocument.groupBy({
      by: ["status"],
      _count: true,
    });

    const byStatus = statusStats.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 按部门统计
    const deptStats = await prisma.disclosureDocument.groupBy({
      by: ["department"],
      _count: true,
    });

    const byDepartment = deptStats.reduce((acc, item) => {
      acc[item.department] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 按技术领域统计
    const techFieldStats = await prisma.disclosureDocument.groupBy({
      by: ["technicalField"],
      _count: true,
      where: {
        technicalField: {
          not: null,
        },
      },
    });

    const byTechnicalField = techFieldStats.reduce((acc, item) => {
      if (item.technicalField) {
        acc[item.technicalField] = item._count;
      }
      return acc;
    }, {} as Record<string, number>);

    // 月度提交统计
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = (await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', submissionDate) as month,
        CAST(COUNT(*) AS INTEGER) as count
      FROM disclosure_documents 
      WHERE submissionDate >= ${sixMonthsAgo.toISOString()}
      GROUP BY strftime('%Y-%m', submissionDate)
      ORDER BY month
    `) as Array<{ month: string; count: number }>;

    // 评估效率统计
    const pendingEvaluations = await prisma.disclosureDocument.count({
      where: { status: "under_evaluation" },
    });

    // 计算平均评估天数
    const completedEvaluations = await prisma.disclosureEvaluation.findMany({
      where: {
        evaluationResult: { in: ["approved", "rejected"] },
      },
      include: {
        disclosure: {
          select: {
            submissionDate: true,
          },
        },
      },
    });

    let averageDays = 0;
    if (completedEvaluations.length > 0) {
      const totalDays = completedEvaluations.reduce((sum, evaluation) => {
        const submissionDate = new Date(evaluation.disclosure.submissionDate);
        const evaluationDate = new Date(evaluation.evaluationDate);
        const diffTime = evaluationDate.getTime() - submissionDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);

      averageDays = Math.round(totalDays / completedEvaluations.length);
    }

    const statistics = {
      total,
      byStatus,
      byDepartment,
      byTechnicalField,
      monthlySubmissions: monthlyStats,
      evaluationEfficiency: {
        averageDays,
        pendingCount: pendingEvaluations,
      },
    };

    res.json(statistics);
  } catch (error) {
    console.error("获取统计信息失败:", error);
    res.status(500).json({ error: "获取统计信息失败" });
  }
});

// 获取交底书详情
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const disclosure = await prisma.disclosureDocument.findUnique({
      where: { id: parseInt(id) },
      include: {
        submitter: {
          select: {
            id: true,
            realName: true,
            department: true,
            email: true,
            phone: true,
          },
        },
        evaluations: {
          include: {
            evaluator: {
              select: {
                id: true,
                realName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        agencies: {
          include: {
            agency: true,
            assignedByUser: {
              select: {
                id: true,
                realName: true,
              },
            },
          },
          orderBy: { assignmentDate: "desc" },
        },
      },
    });

    if (!disclosure) {
      return res.status(404).json({ error: "交底书不存在" });
    }

    res.json(disclosure);
  } catch (error) {
    console.error("获取交底书详情失败:", error);
    res.status(500).json({ error: "获取交底书详情失败" });
  }
});

// 创建交底书
router.post(
  "/",
  authenticateToken,
  upload.array("attachments", 10),
  async (req, res) => {
    try {
      const {
        title,
        department,
        technicalField,
        description,
        keywords,
        inventors,
        applicants,
      } = req.body;

      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "用户未认证" });
      }

      // 生成公司案号
      const companyFileNumber = generateCompanyFileNumber(department);

      // 处理附件信息
      let attachments = null;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const fileInfos = req.files.map((file) => ({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
        }));
        attachments = JSON.stringify(fileInfos);
      }

      const disclosure = await prisma.disclosureDocument.create({
        data: {
          companyFileNumber,
          title,
          submitterId: user.id,
          department,
          technicalField,
          description,
          keywords,
          inventors,
          applicants,
          attachments,
          status: "submitted",
        },
        include: {
          submitter: {
            select: {
              id: true,
              realName: true,
              department: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(disclosure);
    } catch (error) {
      console.error("创建交底书失败:", error);
      res.status(500).json({ error: "创建交底书失败" });
    }
  }
);

// 更新交底书
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    // 检查交底书是否存在
    const existingDisclosure = await prisma.disclosureDocument.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingDisclosure) {
      return res.status(404).json({ error: "交底书不存在" });
    }

    // 权限检查：只有提交者或管理员可以修改
    if (existingDisclosure.submitterId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "没有权限修改此交底书" });
    }

    const disclosure = await prisma.disclosureDocument.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        submitter: {
          select: {
            id: true,
            realName: true,
            department: true,
            email: true,
          },
        },
        evaluations: {
          include: {
            evaluator: {
              select: {
                id: true,
                realName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(disclosure);
  } catch (error) {
    console.error("更新交底书失败:", error);
    res.status(500).json({ error: "更新交底书失败" });
  }
});

// 删除交底书
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 检查交底书是否存在
    const existingDisclosure = await prisma.disclosureDocument.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingDisclosure) {
      return res.status(404).json({ error: "交底书不存在" });
    }

    // 权限检查：只有提交者或管理员可以删除
    if (existingDisclosure.submitterId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "没有权限删除此交底书" });
    }

    // 删除关联的附件文件
    if (existingDisclosure.attachments) {
      try {
        const attachments = JSON.parse(existingDisclosure.attachments);
        attachments.forEach((file: any) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      } catch (error) {
        console.error("删除附件文件失败:", error);
      }
    }

    await prisma.disclosureDocument.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "交底书删除成功" });
  } catch (error) {
    console.error("删除交底书失败:", error);
    res.status(500).json({ error: "删除交底书失败" });
  }
});

// 生成公司案号
router.post("/generate-file-number", authenticateToken, async (req, res) => {
  try {
    const { department } = req.body;

    if (!department) {
      return res.status(400).json({ error: "部门不能为空" });
    }

    const fileNumber = generateCompanyFileNumber(department);
    res.json({ fileNumber });
  } catch (error) {
    console.error("生成公司案号失败:", error);
    res.status(500).json({ error: "生成公司案号失败" });
  }
});

export default router;
