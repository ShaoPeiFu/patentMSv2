const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createUser10() {
  try {
    console.log("🚀 开始创建用户ID为10的用户...\n");

    // 检查用户ID 10是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { id: 10 },
    });

    if (existingUser) {
      console.log("✅ 用户ID 10已存在:", existingUser.username);
      return;
    }

    // 创建用户ID为10的用户
    const hashedPassword = await bcrypt.hash("123456", 10);

    const user = await prisma.user.create({
      data: {
        id: 10, // 强制指定ID
        username: "shaopei10",
        email: "shaopei10@example.com",
        password: hashedPassword,
        realName: "付少培10",
        role: "admin",
        department: "legal",
        phone: "13800138010",
      },
    });

    console.log("✅ 用户ID 10创建成功:");
    console.log(`  用户名: ${user.username}`);
    console.log(`  姓名: ${user.realName}`);
    console.log(`  邮箱: ${user.email}`);
    console.log(`  角色: ${user.role}`);
    console.log(`  部门: ${user.department}`);

    // 验证用户是否创建成功
    const createdUser = await prisma.user.findUnique({
      where: { id: 10 },
    });

    if (createdUser) {
      console.log("\n🎉 用户创建验证成功！");
    } else {
      console.log("\n❌ 用户创建验证失败！");
    }
  } catch (error) {
    console.error("❌ 创建用户失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser10();
