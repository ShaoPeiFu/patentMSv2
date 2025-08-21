const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log("🔧 重置admin用户密码...");

    // 查找所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
      },
    });

    console.log("📊 数据库中的用户:");
    users.forEach((user) => {
      console.log(
        `  - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.realName}`
      );
    });

    // 选择第一个用户重置密码
    if (users.length === 0) {
      console.log("❌ 数据库中没有用户");
      return;
    }

    const targetUser = users[0];
    console.log(`\n🔧 重置用户 '${targetUser.username}' 的密码...`);

    // 重置密码为123456
    const newPassword = "123456";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { password: hashedPassword },
    });

    console.log("✅ 用户密码重置成功！");
    console.log(`📝 用户名: ${targetUser.username}, 新密码: 123456`);
  } catch (error) {
    console.error("❌ 重置密码失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
