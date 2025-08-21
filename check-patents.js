import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const checkPatents = async () => {
  try {
    console.log("🔍 检查数据库中的专利数据...\n");

    // 1. 检查专利表
    console.log("📄 专利表 (patents):");
    const patents = await prisma.patent.findMany({
      include: {
        user: {
          select: { id: true, username: true, realName: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(`   总数量: ${patents.length}`);
    if (patents.length > 0) {
      patents.forEach((patent) => {
        console.log(`   - ID: ${patent.id}`);
        console.log(`     标题: ${patent.title}`);
        console.log(`     专利号: ${patent.patentNumber}`);
        console.log(`     状态: ${patent.status}`);
        console.log(`     类型: ${patent.type}`);
        console.log(
          `     申请人: ${
            patent.user?.realName || patent.user?.username || "未知"
          } (ID: ${patent.userId})`
        );
        console.log(
          `     分类: ${patent.category?.name || "未分类"} (ID: ${
            patent.categoryId
          })`
        );
        console.log(`     申请日期: ${patent.applicationDate}`);
        console.log(`     创建时间: ${patent.createdAt}`);
        console.log("     ---");
      });
    } else {
      console.log("   ❌ 没有找到专利数据");
    }

    // 2. 检查用户表
    console.log("\n👥 用户表 (users):");
    const users = await prisma.user.findMany({
      select: { id: true, username: true, realName: true, role: true },
    });

    console.log(`   总数量: ${users.length}`);
    if (users.length > 0) {
      users.forEach((user) => {
        console.log(
          `   - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.realName}, 角色: ${user.role}`
        );
      });
    }

    // 3. 检查专利分类表
    console.log("\n📂 专利分类表 (patent_categories):");
    const categories = await prisma.patentCategory.findMany({
      include: {
        _count: {
          select: { patents: true },
        },
      },
    });

    console.log(`   总数量: ${categories.length}`);
    if (categories.length > 0) {
      categories.forEach((cat) => {
        console.log(
          `   - ID: ${cat.id}, 名称: ${cat.name}, 专利数量: ${cat._count.patents}`
        );
      });
    }

    // 4. 检查是否有外键约束问题
    console.log("\n🔗 检查外键关系...");

    // 检查专利表中的用户ID是否有效
    const invalidUserIds = patents.filter(
      (p) => !users.find((u) => u.id === p.userId)
    );
    if (invalidUserIds.length > 0) {
      console.log("   ⚠️ 发现无效的用户ID:");
      invalidUserIds.forEach((p) => {
        console.log(`     - 专利ID ${p.id} 引用了不存在的用户ID ${p.userId}`);
      });
    }

    // 检查专利表中的分类ID是否有效
    const invalidCategoryIds = patents.filter(
      (p) => p.categoryId && !categories.find((c) => c.id === p.categoryId)
    );
    if (invalidCategoryIds.length > 0) {
      console.log("   ⚠️ 发现无效的分类ID:");
      invalidCategoryIds.forEach((p) => {
        console.log(
          `     - 专利ID ${p.id} 引用了不存在的分类ID ${p.categoryId}`
        );
      });
    }

    console.log("\n✨ 检查完成！");
  } catch (error) {
    console.error("❌ 检查失败:", error);
  } finally {
    await prisma.$disconnect();
  }
};

checkPatents();
