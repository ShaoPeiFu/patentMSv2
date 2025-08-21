const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function fixUserPassword() {
  try {
    console.log("🔧 修复用户密码...");

    // 生成新的密码哈希
    const password = "123456";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("🔑 新密码哈希:", hashedPassword);

    // 更新用户密码
    const updatedUser = await prisma.user.update({
      where: { username: "shaopei" },
      data: { password: hashedPassword },
    });

    console.log("✅ 用户密码更新成功:", updatedUser.username);
    console.log("🔑 新密码:", password);

    // 验证密码
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log("✅ 密码验证:", isValid ? "通过" : "失败");
  } catch (error) {
    console.error("❌ 修复密码失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserPassword();
