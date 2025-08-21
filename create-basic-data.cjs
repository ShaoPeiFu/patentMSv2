const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createBasicData() {
  try {
    console.log("🚀 开始创建基础测试数据...");

    // 1. 创建用户
    console.log("👤 创建用户...");
    const user = await prisma.user.create({
      data: {
        username: "shaopei",
        email: "7706501124@qq.com",
        realName: "邵培",
        phone: "13800138000",
        department: "legal",
        role: "admin",
        password:
          "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.", // password
      },
    });
    console.log("✅ 用户创建成功:", user.username);

    // 2. 创建专利分类
    console.log("📂 创建专利分类...");
    const categories = await Promise.all([
      prisma.patentCategory.create({
        data: { name: "发明专利", description: "技术方案类专利" },
      }),
      prisma.patentCategory.create({
        data: { name: "实用新型", description: "产品结构类专利" },
      }),
      prisma.patentCategory.create({
        data: { name: "外观设计", description: "产品外观类专利" },
      }),
    ]);
    console.log("✅ 专利分类创建成功:", categories.length, "个");

    // 3. 创建专利
    console.log("📋 创建专利...");
    const patent = await prisma.patent.create({
      data: {
        title: "测试专利",
        patentNumber: "TEST001",
        description: "这是一个测试专利",
        status: "pending",
        type: "invention",
        categoryId: categories[0].id,
        applicationDate: new Date(),
        priority: "high",
        technicalField: "计算机技术",
        userId: user.id,
      },
    });
    console.log("✅ 专利创建成功:", patent.patentNumber);

    // 4. 创建期限
    console.log("⏰ 创建期限...");
    const deadline = await prisma.deadline.create({
      data: {
        patentId: patent.id,
        title: "测试期限",
        description: "这是一个测试期限",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
        type: "maintenance",
        status: "pending",
        priority: "high",
      },
    });
    console.log("✅ 期限创建成功:", deadline.title);

    // 5. 创建会议
    console.log("📅 创建会议...");
    const meeting = await prisma.meeting.create({
      data: {
        title: "测试会议",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 明天+1小时
        duration: 60,
        platform: "zoom",
        joinUrl: "https://zoom.us/j/test",
        hostUrl: "https://zoom.us/host/test",
        status: "scheduled",
        organizerId: user.id,
      },
    });
    console.log("✅ 会议创建成功:", meeting.title);

    console.log("🎉 所有基础数据创建完成！");
    console.log("📊 数据统计:");
    console.log(`   - 用户: ${user.username} (ID: ${user.id})`);
    console.log(`   - 专利分类: ${categories.length} 个`);
    console.log(`   - 专利: ${patent.patentNumber} (ID: ${patent.id})`);
    console.log(`   - 期限: ${deadline.title} (ID: ${deadline.id})`);
    console.log(`   - 会议: ${meeting.title} (ID: ${meeting.id})`);
  } catch (error) {
    console.error("❌ 创建基础数据失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicData();
