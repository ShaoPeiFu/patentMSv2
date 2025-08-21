const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function simpleCheck() {
  const userId = 9;

  try {
    console.log(`🔍 简单检查用户ID ${userId} 的可能遗漏引用...`);

    // 检查一些可能遗漏的表
    const checks = [
      {
        name: "会议参与者",
        model: prisma.meetingParticipant,
        where: { userId },
      },
      { name: "会议", model: prisma.meeting, where: { createdBy: userId } },
      { name: "合同", model: prisma.contract, where: { createdBy: userId } },
      {
        name: "合同模板",
        model: prisma.contractTemplate,
        where: { createdBy: userId },
      },
      { name: "文档访问", model: prisma.documentAccess, where: { userId } },
      {
        name: "文档模板",
        model: prisma.documentTemplate,
        where: { createdBy: userId },
      },
      {
        name: "电子签名",
        model: prisma.electronicSignature,
        where: { userId },
      },
      {
        name: "费用协议",
        model: prisma.feeAgreement,
        where: { createdBy: userId },
      },
      { name: "费用", model: prisma.fee, where: { createdBy: userId } },
      {
        name: "律师事务所",
        model: prisma.lawFirm,
        where: { createdBy: userId },
      },
      {
        name: "服务评估",
        model: prisma.serviceEvaluation,
        where: { evaluatedBy: userId },
      },
      {
        name: "智能提醒",
        model: prisma.smartReminder,
        where: { createdBy: userId },
      },
      {
        name: "风险评估",
        model: prisma.riskAssessment,
        where: { assessedBy: userId },
      },
      {
        name: "审批委托",
        model: prisma.approvalDelegation,
        where: { delegatedTo: userId },
      },
      {
        name: "审批升级",
        model: prisma.approvalEscalation,
        where: { toUserId: userId },
      },
      {
        name: "审批流程",
        model: prisma.approvalProcess,
        where: { createdBy: userId },
      },
      {
        name: "审批超时",
        model: prisma.approvalTimeout,
        where: { createdBy: userId },
      },
    ];

    let foundReferences = [];

    for (const check of checks) {
      try {
        const count = await check.model.count({ where: check.where });
        if (count > 0) {
          console.log(`⚠️  ${check.name}: ${count} 条记录引用用户ID ${userId}`);
          foundReferences.push({ name: check.name, count });
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

    if (foundReferences.length > 0) {
      console.log("\n🔍 发现的引用:");
      foundReferences.forEach((ref) => {
        console.log(`  - ${ref.name}: ${ref.count} 条`);
      });
    } else {
      console.log("\n✅ 没有发现新的引用");
    }
  } catch (error) {
    console.error("❌ 简单检查失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCheck();
