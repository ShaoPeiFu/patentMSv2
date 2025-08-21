const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAllUserReferences() {
  const userId = 9;

  try {
    console.log(`🔍 全面检查用户ID ${userId} 的引用关系...`);

    // 检查所有可能的引用
    const checks = [
      { name: "专利", model: prisma.patent, where: { userId } },
      { name: "活动日志", model: prisma.activityLog, where: { userId } },
      { name: "任务", model: prisma.task, where: { assigneeId: userId } },
      { name: "评论", model: prisma.comment, where: { userId } },
      {
        name: "专利文档",
        model: prisma.patentDocument,
        where: { uploadedBy: userId },
      },
      {
        name: "安全事件日志",
        model: prisma.securityEventLog,
        where: { userId },
      },
      {
        name: "备份记录",
        model: prisma.backupRecord,
        where: { createdBy: userId },
      },
      {
        name: "工作流",
        model: prisma.approvalWorkflow,
        where: { createdBy: userId },
      },
      {
        name: "工作流模板",
        model: prisma.workflowTemplate,
        where: { createdBy: userId },
      },
      {
        name: "协作频道",
        model: prisma.collaborationChannel,
        where: { createdBy: userId },
      },
      {
        name: "协作消息",
        model: prisma.collaborationMessage,
        where: { userId },
      },
      {
        name: "协作任务",
        model: prisma.collaborationTask,
        where: { createdBy: userId },
      },
      {
        name: "文档版本",
        model: prisma.documentVersion,
        where: { createdBy: userId },
      },
      { name: "安全设置", model: prisma.securitySettings, where: { userId } },
    ];

    let totalReferences = 0;

    for (const check of checks) {
      try {
        const count = await check.model.count({ where: check.where });
        if (count > 0) {
          console.log(`⚠️  ${check.name}: ${count} 条记录引用用户ID ${userId}`);
          totalReferences += count;

          // 显示前几条记录的详细信息
          if (count <= 5) {
            const records = await check.model.findMany({
              where: check.where,
              take: 5,
              select: { id: true },
            });
            console.log(`   记录ID: ${records.map((r) => r.id).join(", ")}`);
          } else {
            console.log(
              `   前5条记录ID: ${(
                await check.model.findMany({
                  where: check.where,
                  take: 5,
                  select: { id: true },
                })
              )
                .map((r) => r.id)
                .join(", ")}`
            );
          }
        } else {
          console.log(`✅ ${check.name}: 无引用`);
        }
      } catch (error) {
        if (error.code === "P2025") {
          console.log(`❌ ${check.name}: 模型不存在`);
        } else {
          console.log(`❌ ${check.name}: 检查失败 - ${error.message}`);
        }
      }
    }

    console.log(
      `\n📊 总结: 用户ID ${userId} 总共被 ${totalReferences} 条记录引用`
    );

    if (totalReferences > 0) {
      console.log("\n💡 建议:");
      console.log("1. 先删除所有引用记录");
      console.log("2. 然后删除用户");
      console.log("3. 或者考虑软删除（标记为已删除而不是物理删除）");
    }
  } catch (error) {
    console.error("❌ 检查用户引用失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUserReferences();
