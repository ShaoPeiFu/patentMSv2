const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkTestAdmin() {
  try {
    console.log("🔍 检查测试管理员用户...");

    const testAdmin = await prisma.user.findUnique({
      where: { username: "testadmin" },
    });

    if (testAdmin) {
      console.log("✅ 测试管理员用户存在:", {
        id: testAdmin.id,
        username: testAdmin.username,
        role: testAdmin.role,
        email: testAdmin.email,
      });
    } else {
      console.log("❌ 测试管理员用户不存在");

      // 创建测试管理员用户
      console.log("🔧 创建测试管理员用户...");
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("test123", 10);

      const newAdmin = await prisma.user.create({
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
        id: newAdmin.id,
        username: newAdmin.username,
        role: newAdmin.role,
      });
      console.log("📝 登录信息: 用户名: testadmin, 密码: test123");
    }
  } catch (error) {
    console.error("❌ 检查测试管理员用户失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestAdmin();
