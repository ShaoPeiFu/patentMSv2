const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔑 开始重置付少培用户密码...");
    
    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        username: "shaopei"
      }
    });

    if (!user) {
      console.log("❌ 用户不存在");
      return;
    }

    console.log(`👤 找到用户: ${user.realName} (${user.username})`);
    
    // 生成新密码哈希
    const newPassword = "123456";
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    console.log("✅ 密码重置成功！新密码: 123456");
    
  } catch (error) {
    console.error("❌ 重置密码失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
