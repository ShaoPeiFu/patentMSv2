// Simple Prisma seed for SQLite
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始数据库种子数据初始化...");

  // 创建默认用户
  const defaultUsers = [
    {
      username: "admin",
      email: "admin@patentms.com",
      realName: "系统管理员",
      phone: "13800000000",
      department: "tech",
      role: "admin",
      password: "123456",
    },
    {
      username: "reviewer",
      email: "reviewer@patentms.com",
      realName: "专利审核员",
      phone: "13800000001",
      department: "legal",
      role: "reviewer",
      password: "123456",
    },
    {
      username: "user",
      email: "user@patentms.com",
      realName: "普通用户",
      phone: "13800000002",
      department: "other",
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

  // 创建默认费用分类
  const defaultFeeCategories = [
    {
      name: "申请费",
      description: "专利申请相关费用",
      color: "#409EFF",
    },
    {
      name: "审查费",
      description: "专利审查相关费用",
      color: "#67C23A",
    },
    {
      name: "维持费",
      description: "专利维持相关费用",
      color: "#E6A23C",
    },
    {
      name: "续展费",
      description: "专利续展相关费用",
      color: "#F56C6C",
    },
    {
      name: "优先权费",
      description: "优先权相关费用",
      color: "#909399",
    },
    {
      name: "延期费",
      description: "延期相关费用",
      color: "#9C27B0",
    },
    {
      name: "更正费",
      description: "更正相关费用",
      color: "#FF9800",
    },
    {
      name: "其他费用",
      description: "其他相关费用",
      color: "#607D8B",
    },
  ];

  for (const categoryData of defaultFeeCategories) {
    const existingCategory = await prisma.feeCategory.findFirst({
      where: {
        name: categoryData.name,
      },
    });

    if (!existingCategory) {
      console.log(`📝 创建默认费用分类: ${categoryData.name}...`);
      await prisma.feeCategory.create({
        data: categoryData,
      });
      console.log(`✅ ${categoryData.name} 费用分类创建成功!`);
    } else {
      console.log(`ℹ️  ${categoryData.name} 费用分类已存在`);
    }
  }

  // 创建示例任务
  const count = await prisma.task.count();
  if (count === 0) {
    console.log("📝 创建示例任务...");
    await prisma.task.createMany({
      data: [
        {
          title: "示例任务A",
          description: "初始化任务",
          status: "todo",
          priority: "medium",
        },
        {
          title: "示例任务B",
          description: "初始化任务",
          status: "in_progress",
          priority: "high",
        },
      ],
    });
    console.log("✅ 示例任务创建成功!");
  }

  console.log("🎉 数据库种子数据初始化完成!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 种子数据初始化失败:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
