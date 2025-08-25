import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// 获取代理机构列表
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { status, serviceLevel } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (serviceLevel) {
      where.serviceLevel = serviceLevel;
    }

    const agencies = await prisma.patentAgency.findMany({
      where,
      orderBy: [
        { rating: "desc" },
        { collaborationCount: "desc" },
        { name: "asc" },
      ],
    });

    res.json(agencies);
  } catch (error) {
    console.error("获取代理机构列表失败:", error);
    res.status(500).json({ error: "获取代理机构列表失败" });
  }
});

// 获取代理机构详情
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const agency = await prisma.patentAgency.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignments: {
          include: {
            disclosure: {
              select: {
                id: true,
                title: true,
                companyFileNumber: true,
                status: true,
              },
            },
            assignedByUser: {
              select: {
                id: true,
                realName: true,
              },
            },
          },
          orderBy: { assignmentDate: "desc" },
          take: 10, // 最近10个分配记录
        },
      },
    });

    if (!agency) {
      return res.status(404).json({ error: "代理机构不存在" });
    }

    res.json(agency);
  } catch (error) {
    console.error("获取代理机构详情失败:", error);
    res.status(500).json({ error: "获取代理机构详情失败" });
  }
});

// 创建代理机构
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      specialties,
      serviceLevel = "standard",
    } = req.body;

    const user = req.user;

    // 检查用户是否有权限创建代理机构（管理员或法务）
    if (!["admin"].includes(user.role)) {
      return res.status(403).json({ error: "没有权限创建代理机构" });
    }

    // 检查代理机构名称是否已存在
    const existingAgency = await prisma.patentAgency.findFirst({
      where: { name },
    });

    if (existingAgency) {
      return res.status(400).json({ error: "代理机构名称已存在" });
    }

    // 处理专业领域
    let specialtiesJson = null;
    if (specialties && Array.isArray(specialties)) {
      specialtiesJson = JSON.stringify(specialties);
    }

    const agency = await prisma.patentAgency.create({
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
        specialties: specialtiesJson,
        serviceLevel,
        status: "active",
      },
    });

    res.status(201).json(agency);
  } catch (error) {
    console.error("创建代理机构失败:", error);
    res.status(500).json({ error: "创建代理机构失败" });
  }
});

// 更新代理机构
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    // 检查用户是否有权限修改代理机构
    if (!["admin"].includes(user.role)) {
      return res.status(403).json({ error: "没有权限修改代理机构" });
    }

    // 检查代理机构是否存在
    const existingAgency = await prisma.patentAgency.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingAgency) {
      return res.status(404).json({ error: "代理机构不存在" });
    }

    // 如果更新名称，检查是否重复
    if (updateData.name && updateData.name !== existingAgency.name) {
      const duplicateAgency = await prisma.patentAgency.findFirst({
        where: {
          name: updateData.name,
          id: { not: parseInt(id) },
        },
      });

      if (duplicateAgency) {
        return res.status(400).json({ error: "代理机构名称已存在" });
      }
    }

    // 处理专业领域
    if (updateData.specialties && Array.isArray(updateData.specialties)) {
      updateData.specialties = JSON.stringify(updateData.specialties);
    }

    const agency = await prisma.patentAgency.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(agency);
  } catch (error) {
    console.error("更新代理机构失败:", error);
    res.status(500).json({ error: "更新代理机构失败" });
  }
});

// 删除代理机构
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 检查用户是否有权限删除代理机构
    if (!["admin"].includes(user.role)) {
      return res.status(403).json({ error: "没有权限删除代理机构" });
    }

    // 检查代理机构是否存在
    const existingAgency = await prisma.patentAgency.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingAgency) {
      return res.status(404).json({ error: "代理机构不存在" });
    }

    // 检查是否有进行中的分配
    const activeAssignments = await prisma.agencyAssignment.count({
      where: {
        agencyId: parseInt(id),
        status: { in: ["assigned", "in_progress"] },
      },
    });

    if (activeAssignments > 0) {
      return res
        .status(400)
        .json({ error: "该代理机构还有进行中的任务，无法删除" });
    }

    await prisma.patentAgency.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "代理机构删除成功" });
  } catch (error) {
    console.error("删除代理机构失败:", error);
    res.status(500).json({ error: "删除代理机构失败" });
  }
});

// 分配代理机构
router.post(
  "/:disclosureId/assign-agency",
  authenticateToken,
  async (req, res) => {
    try {
      const { disclosureId } = req.params;
      const { agencyId, notes, expectedCompletion } = req.body;
      const user = req.user;

      // 检查用户是否有权限分配代理机构（管理员或法务）
      if (!["admin"].includes(user.role)) {
        return res.status(403).json({ error: "没有权限分配代理机构" });
      }

      // 检查交底书是否存在
      const disclosure = await prisma.disclosureDocument.findUnique({
        where: { id: parseInt(disclosureId) },
      });

      if (!disclosure) {
        return res.status(404).json({ error: "交底书不存在" });
      }

      // 检查代理机构是否存在
      const agency = await prisma.patentAgency.findUnique({
        where: { id: parseInt(agencyId) },
      });

      if (!agency) {
        return res.status(404).json({ error: "代理机构不存在" });
      }

      if (agency.status !== "active") {
        return res.status(400).json({ error: "代理机构当前不可用" });
      }

      // 检查是否已经分配过代理机构
      const existingAssignment = await prisma.agencyAssignment.findFirst({
        where: {
          disclosureId: parseInt(disclosureId),
          status: { in: ["assigned", "in_progress"] },
        },
      });

      if (existingAssignment) {
        return res.status(400).json({ error: "该交底书已分配代理机构" });
      }

      // 创建分配记录
      const assignment = await prisma.agencyAssignment.create({
        data: {
          disclosureId: parseInt(disclosureId),
          agencyId: parseInt(agencyId),
          assignedBy: user.id,
          expectedCompletion: expectedCompletion
            ? new Date(expectedCompletion)
            : null,
          notes,
          status: "assigned",
        },
        include: {
          agency: true,
          assignedByUser: {
            select: {
              id: true,
              realName: true,
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

      // 更新代理机构的协作次数
      await prisma.patentAgency.update({
        where: { id: parseInt(agencyId) },
        data: {
          collaborationCount: {
            increment: 1,
          },
        },
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error("分配代理机构失败:", error);
      res.status(500).json({ error: "分配代理机构失败" });
    }
  }
);

// 获取分配记录
router.get("/assignments", authenticateToken, async (req, res) => {
  try {
    const { disclosureId, agencyId, status } = req.query;

    const where: any = {};
    if (disclosureId) {
      where.disclosureId = parseInt(disclosureId as string);
    }
    if (agencyId) {
      where.agencyId = parseInt(agencyId as string);
    }
    if (status) {
      where.status = status;
    }

    const assignments = await prisma.agencyAssignment.findMany({
      where,
      include: {
        agency: true,
        assignedByUser: {
          select: {
            id: true,
            realName: true,
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
      orderBy: { assignmentDate: "desc" },
    });

    res.json(assignments);
  } catch (error) {
    console.error("获取分配记录失败:", error);
    res.status(500).json({ error: "获取分配记录失败" });
  }
});

// 更新分配状态
router.put("/assignments/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const user = req.user;

    // 检查分配记录是否存在
    const existingAssignment = await prisma.agencyAssignment.findUnique({
      where: { id: parseInt(id) },
      include: {
        agency: true,
      },
    });

    if (!existingAssignment) {
      return res.status(404).json({ error: "分配记录不存在" });
    }

    // 权限检查：只有分配者或管理员可以修改
    if (existingAssignment.assignedBy !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "没有权限修改此分配记录" });
    }

    const assignment = await prisma.agencyAssignment.update({
      where: { id: parseInt(id) },
      data: {
        status,
        notes,
        updatedAt: new Date(),
      },
      include: {
        agency: true,
        assignedByUser: {
          select: {
            id: true,
            realName: true,
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

    // 如果任务完成，更新代理机构评分（简单示例）
    if (status === "completed" && existingAssignment.status !== "completed") {
      const completedCount = await prisma.agencyAssignment.count({
        where: {
          agencyId: existingAssignment.agencyId,
          status: "completed",
        },
      });

      // 简单的评分计算：每完成10个任务，评分增加0.1
      const newRating = Math.min(5.0, 3.0 + completedCount * 0.02);

      await prisma.patentAgency.update({
        where: { id: existingAssignment.agencyId },
        data: {
          rating: newRating,
        },
      });
    }

    res.json(assignment);
  } catch (error) {
    console.error("更新分配状态失败:", error);
    res.status(500).json({ error: "更新分配状态失败" });
  }
});

// 获取代理机构统计信息
router.get("/statistics", authenticateToken, async (req, res) => {
  try {
    // 代理机构总数
    const totalAgencies = await prisma.patentAgency.count();

    // 按状态统计
    const statusStats = await prisma.patentAgency.groupBy({
      by: ["status"],
      _count: true,
    });

    const byStatus = statusStats.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 按服务级别统计
    const levelStats = await prisma.patentAgency.groupBy({
      by: ["serviceLevel"],
      _count: true,
    });

    const byServiceLevel = levelStats.reduce((acc, item) => {
      acc[item.serviceLevel] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 分配统计
    const totalAssignments = await prisma.agencyAssignment.count();

    const assignmentStats = await prisma.agencyAssignment.groupBy({
      by: ["status"],
      _count: true,
    });

    const assignmentsByStatus = assignmentStats.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // 热门代理机构（按分配次数）
    const topAgencies = await prisma.patentAgency.findMany({
      select: {
        id: true,
        name: true,
        collaborationCount: true,
        rating: true,
      },
      orderBy: [{ collaborationCount: "desc" }, { rating: "desc" }],
      take: 10,
    });

    // 月度分配趋势
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAssignments = (await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', assignmentDate) as month,
        COUNT(*) as count
      FROM agency_assignments 
      WHERE assignmentDate >= ${sixMonthsAgo}
      GROUP BY strftime('%Y-%m', assignmentDate)
      ORDER BY month
    `) as Array<{ month: string; count: number }>;

    const statistics = {
      totalAgencies,
      byStatus,
      byServiceLevel,
      totalAssignments,
      assignmentsByStatus,
      topAgencies,
      monthlyAssignments,
    };

    res.json(statistics);
  } catch (error) {
    console.error("获取代理机构统计信息失败:", error);
    res.status(500).json({ error: "获取代理机构统计信息失败" });
  }
});

export default router;
