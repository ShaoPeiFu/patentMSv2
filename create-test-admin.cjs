const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    console.log("🔧 创建测试管理员用户...");

    // 检查是否已存在测试用户
    const existingUser = await prisma.user.findUnique({
      where: { username: "testadmin" },
    });

    if (existingUser) {
      console.log("✅ 测试管理员用户已存在");
      return;
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash("test123", 10);

    const newUser = await prisma.user.create({
      data: {
        username: "testadmin",
        email: "testadmin@test.com",
        password: hashedPassword,
        realName: "测试管理员",
        phone: "13800000000",
        department: "技术部",
        role: "admin",
      },
    });

    console.log("✅ 测试管理员用户创建成功:", {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });
    console.log("📝 登录信息:");
    console.log("  用户名: testadmin");
    console.log("  密码: test123");
  } catch (error) {
    console.error("❌ 创建测试管理员用户失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();
