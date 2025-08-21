const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("🔍 检查数据库中的用户信息...");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        realName: true,
        createdAt: true,
      },
    });

    console.log("📋 用户列表:");
    users.forEach((user) => {
      console.log(
        `  ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 姓名: ${user.realName}`
      );
    });

    // 检查是否有管理员用户
    const adminUsers = users.filter((u) => u.role === "admin");
    console.log(`\n👑 管理员用户数量: ${adminUsers.length}`);

    if (adminUsers.length > 0) {
      console.log("管理员用户:");
      adminUsers.forEach((user) => {
        console.log(`  - ${user.username} (${user.realName})`);
      });
    }
  } catch (error) {
    console.error("❌ 检查用户失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
