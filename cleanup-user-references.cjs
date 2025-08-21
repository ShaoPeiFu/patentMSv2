const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupUserReferences() {
  const userId = 9;

  try {
    console.log(`🧹 清理用户ID ${userId} 的所有引用记录...`);

    // 1. 删除活动日志
    console.log("1️⃣ 删除活动日志...");
    const activityLogsDeleted = await prisma.activityLog.deleteMany({
      where: { userId },
    });
    console.log(`✅ 已删除 ${activityLogsDeleted.count} 条活动日志`);

    // 2. 删除任务
    console.log("2️⃣ 删除任务...");
    const tasksDeleted = await prisma.task.deleteMany({
      where: { assigneeId: userId },
    });
    console.log(`✅ 已删除 ${tasksDeleted.count} 条任务`);

    // 3. 验证引用是否已清理
    console.log("3️⃣ 验证引用是否已清理...");
    const remainingActivityLogs = await prisma.activityLog.count({
      where: { userId },
    });
    const remainingTasks = await prisma.task.count({
      where: { assigneeId: userId },
    });

    if (remainingActivityLogs === 0 && remainingTasks === 0) {
      console.log("✅ 所有引用记录已清理完成");
      console.log("💡 现在可以尝试删除用户了");
    } else {
      console.log("❌ 仍有引用记录未清理:");
      console.log(`   活动日志: ${remainingActivityLogs} 条`);
      console.log(`   任务: ${remainingTasks} 条`);
    }
  } catch (error) {
    console.error("❌ 清理用户引用失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUserReferences();
