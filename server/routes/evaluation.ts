import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// 获取评估列表
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { disclosureId, evaluatorId } = req.query;

    const where: any = {};
    if (disclosureId) {
      where.disclosureId = parseInt(disclosureId as string);
    }
    if (evaluatorId) {
      where.evaluatorId = parseInt(evaluatorId as string);
    }

    const evaluations = await prisma.disclosureEvaluation.findMany({
      where,
      include: {
        evaluator: {
          select: {
            id: true,
            realName: true,
            email: true,
          },
        },
        disclosure: {
          select: {
            id: true,
            title: true,
            companyFileNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(evaluations);
  } catch (error) {
    console.error("获取评估列表失败:", error);
    res.status(500).json({ error: "获取评估列表失败" });
  }
});

// 获取待评估的交底书
router.get("/pending", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // 检查用户是否有评估权限（顾问或管理员）
    if (!["admin", "reviewer"].includes(user.role)) {
      return res.status(403).json({ error: "没有评估权限" });
    }

    const pendingDisclosures = await prisma.disclosureDocument.findMany({
      where: {
        status: { in: ["submitted", "under_evaluation"] },
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
      },
      orderBy: { submissionDate: "asc" },
    });

    res.json(pendingDisclosures);
  } catch (error) {
    console.error("获取待评估交底书失败:", error);
    res.status(500).json({ error: "获取待评估交底书失败" });
  }
});

// 创建评估
router.post(
  "/:disclosureId/evaluations",
  authenticateToken,
  async (req, res) => {
    try {
      const { disclosureId } = req.params;
      const {
        evaluationType,
        evaluationResult,
        positiveOpinions,
        negativeOpinions,
        modificationSuggestions,
        patentability,
        marketValue,
        technicalAdvantage,
        competitorAnalysis,
        recommendedAction,
        comments,
      } = req.body;

      const user = req.user;

      // 检查用户是否有评估权限
      if (!["admin", "reviewer"].includes(user.role)) {
        return res.status(403).json({ error: "没有评估权限" });
      }

      // 检查交底书是否存在
      const disclosure = await prisma.disclosureDocument.findUnique({
        where: { id: parseInt(disclosureId) },
      });

      if (!disclosure) {
        return res.status(404).json({ error: "交底书不存在" });
      }

      // 创建评估记录
      const evaluation = await prisma.disclosureEvaluation.create({
        data: {
          disclosureId: parseInt(disclosureId),
          evaluatorId: user.id,
          evaluationType,
          evaluationResult,
          positiveOpinions,
          negativeOpinions,
          modificationSuggestions,
          patentability,
          marketValue,
          technicalAdvantage,
          competitorAnalysis,
          recommendedAction,
          comments,
        },
        include: {
          evaluator: {
            select: {
              id: true,
              realName: true,
              email: true,
            },
          },
        },
      });

      // 更新交底书状态
      let newStatus = disclosure.status;
      if (evaluationResult === "approved") {
        newStatus = "approved";
      } else if (evaluationResult === "rejected") {
        newStatus = "rejected";
      } else if (evaluationResult === "needs_modification") {
        newStatus = "under_evaluation";
      }

      if (newStatus !== disclosure.status) {
        await prisma.disclosureDocument.update({
          where: { id: parseInt(disclosureId) },
          data: { status: newStatus },
        });
      }

      res.status(201).json(evaluation);
    } catch (error) {
      console.error("创建评估失败:", error);
      res.status(500).json({ error: "创建评估失败" });
    }
  }
);

// 更新评估
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    // 检查评估是否存在
    const existingEvaluation = await prisma.disclosureEvaluation.findUnique({
      where: { id: parseInt(id) },
      include: {
        disclosure: true,
      },
    });

    if (!existingEvaluation) {
      return res.status(404).json({ error: "评估记录不存在" });
    }

    // 权限检查：只有评估者或管理员可以修改
    if (existingEvaluation.evaluatorId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "没有权限修改此评估" });
    }

    const evaluation = await prisma.disclosureEvaluation.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        evaluator: {
          select: {
            id: true,
            realName: true,
            email: true,
          },
        },
        disclosure: {
          select: {
            id: true,
            title: true,
            companyFileNumber: true,
          },
        },
      },
    });

    // 如果评估结果发生变化，更新交底书状态
    if (
      updateData.evaluationResult &&
      updateData.evaluationResult !== existingEvaluation.evaluationResult
    ) {
      let newStatus = existingEvaluation.disclosure.status;
      if (updateData.evaluationResult === "approved") {
        newStatus = "approved";
      } else if (updateData.evaluationResult === "rejected") {
        newStatus = "rejected";
      } else if (updateData.evaluationResult === "needs_modification") {
        newStatus = "under_evaluation";
      }

      await prisma.disclosureDocument.update({
        where: { id: existingEvaluation.disclosureId },
        data: { status: newStatus },
      });
    }

    res.json(evaluation);
  } catch (error) {
    console.error("更新评估失败:", error);
    res.status(500).json({ error: "更新评估失败" });
  }
});

// 删除评估
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 检查评估是否存在
    const existingEvaluation = await prisma.disclosureEvaluation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEvaluation) {
      return res.status(404).json({ error: "评估记录不存在" });
    }

    // 权限检查：只有评估者或管理员可以删除
    if (existingEvaluation.evaluatorId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "没有权限删除此评估" });
    }

    await prisma.disclosureEvaluation.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "评估记录删除成功" });
  } catch (error) {
    console.error("删除评估失败:", error);
    res.status(500).json({ error: "删除评估失败" });
  }
});

// 获取评估统计信息
router.get("/statistics", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // 基础统计
    const totalEvaluations = await prisma.disclosureEvaluation.count();
    const pendingCount = await prisma.disclosureDocument.count({
      where: { status: { in: ["submitted", "under_evaluation"] } },
    });

    // 按评估结果统计
    const resultStats = await prisma.disclosureEvaluation.groupBy({
      by: ["evaluationResult"],
      _count: true,
    });

    const byResult = resultStats.reduce((acc, item) => {
      acc[item.evaluationResult] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 如果是评估员，获取个人统计
    let personalStats = null;
    if (["admin", "reviewer"].includes(user.role)) {
      const personalEvaluations = await prisma.disclosureEvaluation.count({
        where: { evaluatorId: user.id },
      });

      const personalResultStats = await prisma.disclosureEvaluation.groupBy({
        by: ["evaluationResult"],
        where: { evaluatorId: user.id },
        _count: true,
      });

      const personalByResult = personalResultStats.reduce((acc, item) => {
        acc[item.evaluationResult] = item._count;
        return acc;
      }, {} as Record<string, number>);

      personalStats = {
        total: personalEvaluations,
        byResult: personalByResult,
      };
    }

    // 月度评估趋势
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = (await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', evaluationDate) as month,
        COUNT(*) as count
      FROM disclosure_evaluations 
      WHERE evaluationDate >= ${sixMonthsAgo}
      GROUP BY strftime('%Y-%m', evaluationDate)
      ORDER BY month
    `) as Array<{ month: string; count: number }>;

    // 评估效率：平均处理时间
    const evaluationsWithTiming = await prisma.disclosureEvaluation.findMany({
      include: {
        disclosure: {
          select: {
            submissionDate: true,
          },
        },
      },
      where: {
        evaluationDate: {
          gte: sixMonthsAgo,
        },
      },
    });

    let averageProcessingDays = 0;
    if (evaluationsWithTiming.length > 0) {
      const totalDays = evaluationsWithTiming.reduce((sum, evaluation) => {
        const submissionDate = new Date(evaluation.disclosure.submissionDate);
        const evaluationDate = new Date(evaluation.evaluationDate);
        const diffTime = evaluationDate.getTime() - submissionDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);

      averageProcessingDays = Math.round(
        totalDays / evaluationsWithTiming.length
      );
    }

    const statistics = {
      total: totalEvaluations,
      pending: pendingCount,
      byResult,
      personalStats,
      monthlyTrend: monthlyStats,
      averageProcessingDays,
    };

    res.json(statistics);
  } catch (error) {
    console.error("获取评估统计信息失败:", error);
    res.status(500).json({ error: "获取评估统计信息失败" });
  }
});

export default router;
