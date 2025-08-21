const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUserReferences() {
  const userId = 9;

  try {
    console.log(`🔍 检查用户ID ${userId} 的引用关系...`);

    // 检查各种可能的引用
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
      {
        name: "期限管理",
        model: prisma.deadline,
        where: { createdBy: userId },
      },
    ];

    for (const check of checks) {
      try {
        const count = await check.model.count({ where: check.where });
        if (count > 0) {
          console.log(`⚠️  ${check.name}: ${count} 条记录引用用户ID ${userId}`);
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
  } catch (error) {
    console.error("❌ 检查用户引用失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserReferences();
