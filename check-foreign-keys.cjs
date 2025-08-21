const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkForeignKeys() {
  try {
    console.log("🔍 检查数据库中的外键约束...");

    // 获取所有外键约束
    const foreignKeys = await prisma.$queryRaw`PRAGMA foreign_key_list`;

    console.log("📋 外键约束列表:");
    foreignKeys.forEach((fk, index) => {
      console.log(
        `  ${index + 1}. 表: ${fk.table}, 字段: ${fk.from}, 引用: ${
          fk.references_table
        }.${fk.to}`
      );
    });

    // 检查是否有表引用users表
    console.log("\n🔍 检查引用users表的外键约束...");
    const userReferences = foreignKeys.filter(
      (fk) => fk.references_table === "users"
    );

    if (userReferences.length > 0) {
      console.log("⚠️  发现引用users表的外键约束:");
      userReferences.forEach((ref, index) => {
        console.log(`  ${index + 1}. 表: ${ref.table}, 字段: ${ref.from}`);
      });
    } else {
      console.log("✅ 没有发现引用users表的外键约束");
    }
  } catch (error) {
    console.error("❌ 检查外键约束失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForeignKeys();
