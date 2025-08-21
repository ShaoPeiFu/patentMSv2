const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function deepCheckReferences() {
  const userId = 9;

  try {
    console.log(`🔍 深度检查用户ID ${userId} 的所有可能引用...`);

    // 检查所有可能的引用，包括可能遗漏的
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
      // 检查可能遗漏的引用
      {
        name: "协作频道成员",
        model: prisma.collaborationChannelMember,
        where: { userId },
      },
      {
        name: "专利评估",
        model: prisma.patentEvaluation,
        where: { evaluatedBy: userId },
      },
      {
        name: "专利引用",
        model: prisma.patentCitation,
        where: { citedBy: userId },
      },
      {
        name: "专利族",
        model: prisma.patentFamily,
        where: { createdBy: userId },
      },
      {
        name: "专利分类",
        model: prisma.patentCategory,
        where: { createdBy: userId },
      },
    ];

    let totalReferences = 0;
    const foundReferences = [];

    for (const check of checks) {
      try {
        const count = await check.model.count({ where: check.where });
        if (count > 0) {
          console.log(`⚠️  ${check.name}: ${count} 条记录引用用户ID ${userId}`);
          totalReferences += count;
          foundReferences.push({ name: check.name, count, where: check.where });

          // 显示记录详情
          const records = await check.model.findMany({
            where: check.where,
            take: 3,
            select: { id: true },
          });
          console.log(`   记录ID: ${records.map((r) => r.id).join(", ")}`);
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

    if (foundReferences.length > 0) {
      console.log("\n🔍 发现的引用:");
      foundReferences.forEach((ref) => {
        console.log(`  - ${ref.name}: ${ref.count} 条`);
      });

      console.log("\n💡 需要清理这些引用才能删除用户");
    }
  } catch (error) {
    console.error("❌ 深度检查失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deepCheckReferences();
