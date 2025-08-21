const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDirectDelete() {
  const userId = 9;

  try {
    console.log(`🧪 直接使用Prisma删除用户ID ${userId}...`);

    // 1. 检查用户是否存在
    console.log("1️⃣ 检查用户是否存在...");
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("❌ 用户不存在");
      return;
    }

    console.log("✅ 用户存在:", {
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // 2. 再次检查是否有引用
    console.log("2️⃣ 再次检查引用...");
    const activityLogs = await prisma.activityLog.count({ where: { userId } });
    const tasks = await prisma.task.count({ where: { assigneeId: userId } });

    console.log(`活动日志: ${activityLogs} 条`);
    console.log(`任务: ${tasks} 条`);

    if (activityLogs > 0 || tasks > 0) {
      console.log("❌ 仍有引用记录，无法删除");
      return;
    }

    // 3. 尝试删除用户
    console.log("3️⃣ 尝试删除用户...");
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    console.log("✅ 用户删除成功:", deletedUser);
  } catch (error) {
    console.error("❌ 删除用户失败:", error);

    if (error.code === "P2003") {
      console.log("🔍 外键约束错误，仍有引用未清理");
    } else if (error.code === "P2025") {
      console.log("🔍 记录不存在");
    } else {
      console.log("🔍 其他错误:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDirectDelete();
