const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createPatentCategories() {
  try {
    console.log("🚀 开始创建专利分类...");

    // 检查是否已有分类
    const existingCategories = await prisma.patentCategory.findMany();
    if (existingCategories.length > 0) {
      console.log("✅ 专利分类已存在，跳过创建");
      console.log(
        "现有分类:",
        existingCategories.map((c) => ({ id: c.id, name: c.name }))
      );
      return;
    }

    // 创建默认分类
    const categories = [
      {
        name: "发明专利",
        description: "对产品、方法或者其改进所提出的新的技术方案",
      },
      {
        name: "实用新型",
        description:
          "对产品的形状、构造或者其结合所提出的适于实用的新的技术方案",
      },
      {
        name: "外观设计",
        description:
          "对产品的形状、图案或者其结合以及色彩与形状、图案的结合所作出的富有美感并适于工业应用的新设计",
      },
      {
        name: "计算机软件",
        description: "计算机程序及其有关文档",
      },
      {
        name: "生物技术",
        description: "生物技术领域的发明创造",
      },
      {
        name: "化学",
        description: "化学领域的发明创造",
      },
      {
        name: "机械",
        description: "机械领域的发明创造",
      },
      {
        name: "电子",
        description: "电子领域的发明创造",
      },
      {
        name: "通信",
        description: "通信领域的发明创造",
      },
      {
        name: "其他",
        description: "其他技术领域的发明创造",
      },
    ];

    for (const category of categories) {
      const created = await prisma.patentCategory.create({
        data: category,
      });
      console.log(`✅ 创建分类: ${created.name} (ID: ${created.id})`);
    }

    console.log("\n🎉 所有专利分类创建完成！");

    // 显示创建的分类
    const allCategories = await prisma.patentCategory.findMany();
    console.log("\n📋 所有专利分类:");
    allCategories.forEach((cat) => {
      console.log(`  ${cat.id}. ${cat.name} - ${cat.description}`);
    });
  } catch (error) {
    console.error("❌ 创建专利分类失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createPatentCategories();
