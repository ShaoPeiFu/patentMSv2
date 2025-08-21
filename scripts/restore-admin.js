const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 检查数据库中的用户...");

    // 检查现有用户
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`📊 当前数据库中有 ${existingUsers.length} 个用户:`);
    existingUsers.forEach((user) => {
      console.log(
        `  - ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 创建时间: ${user.createdAt}`
      );
    });

    // 检查是否存在admin用户
    const adminUser = await prisma.user.findFirst({
      where: {
        username: "admin",
      },
    });

    if (adminUser) {
      console.log("✅ admin用户已存在，无需创建");
      console.log(`   用户名: ${adminUser.username}, 角色: ${adminUser.role}`);
    } else {
      console.log("❌ admin用户不存在，正在创建...");

      // 创建admin用户
      const hashedPassword = await bcrypt.hash("123456", 10);

      const newAdminUser = await prisma.user.create({
        data: {
          username: "admin",
          email: "admin@patentms.com",
          realName: "系统管理员",
          phone: "13800000000",
          department: "技术部",
          role: "admin",
          password: hashedPassword,
        },
      });

      console.log("✅ admin用户创建成功!");
      console.log(`   用户名: ${newAdminUser.username}`);
      console.log(`   邮箱: ${newAdminUser.email}`);
      console.log(`   角色: ${newAdminUser.role}`);
      console.log(`   密码: 123456`);
    }

    // 检查是否需要创建其他默认用户
    const defaultUsers = [
      {
        username: "reviewer",
        email: "reviewer@patentms.com",
        realName: "专利审核员",
        phone: "13800000001",
        department: "审核部",
        role: "reviewer",
        password: "123456",
      },
      {
        username: "user",
        email: "user@patentms.com",
        realName: "普通用户",
        phone: "13800000002",
        department: "业务部",
        role: "user",
        password: "123456",
      },
    ];

    for (const userData of defaultUsers) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: userData.username,
        },
      });

      if (!existingUser) {
        console.log(`📝 创建默认用户: ${userData.username}...`);
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
        });

        console.log(`✅ ${userData.username} 用户创建成功!`);
      } else {
        console.log(`ℹ️  ${userData.username} 用户已存在`);
      }
    }

    // 最终用户列表
    console.log("\n📋 最终用户列表:");
    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        realName: true,
        department: true,
      },
    });

    finalUsers.forEach((user) => {
      console.log(
        `  - ${user.username} (${user.realName}) - ${user.role} - ${user.department}`
      );
    });
  } catch (error) {
    console.error("❌ 脚本执行失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
