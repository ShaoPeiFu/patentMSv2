const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        realName: true,
      },
    });

    console.log("数据库中的用户:");
    console.log(JSON.stringify(users, null, 2));

    // 检查admin用户
    const adminUser = await prisma.user.findFirst({
      where: { username: "admin" },
    });

    if (adminUser) {
      console.log("\nAdmin用户详情:");
      console.log("ID:", adminUser.id);
      console.log("用户名:", adminUser.username);
      console.log("邮箱:", adminUser.email);
      console.log("角色:", adminUser.role);
      console.log("真实姓名:", adminUser.realName);
    } else {
      console.log("\n未找到admin用户");
    }
  } catch (error) {
    console.error("查询失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
