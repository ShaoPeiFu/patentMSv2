const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function sqlCheck() {
  const userId = 9;

  try {
    console.log(`🔍 使用SQL查询检查用户ID ${userId} 的所有引用...`);

    // 获取所有表名
    const tables =
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;

    console.log("📋 检查以下表:");
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.name}`);
    });

    console.log(`\n🔍 检查每个表是否包含用户ID ${userId}...`);

    for (const table of tables) {
      const tableName = table.name;

      try {
        // 获取表结构
        const columns = await prisma.$queryRaw`PRAGMA table_info(${tableName})`;

        // 查找可能引用用户的字段
        const userFields = columns.filter(
          (col) =>
            col.name.toLowerCase().includes("user") ||
            col.name.toLowerCase().includes("created") ||
            col.name.toLowerCase().includes("assignee") ||
            col.name.toLowerCase().includes("owner") ||
            col.name.toLowerCase().includes("delegate") ||
            col.name.toLowerCase().includes("evaluator") ||
            col.name.toLowerCase().includes("assessor")
        );

        if (userFields.length > 0) {
          console.log(`\n🔍 表 ${tableName}:`);
          userFields.forEach((field) => {
            console.log(`  - 字段: ${field.name} (${field.type})`);
          });

          // 检查每个字段是否有数据引用用户ID
          for (const field of userFields) {
            try {
              const result =
                await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName} WHERE ${field.name} = ${userId}`;
              const count = result[0].count;

              if (count > 0) {
                console.log(
                  `    ⚠️  字段 ${field.name} 有 ${count} 条记录引用用户ID ${userId}`
                );

                // 显示前几条记录的ID
                const records =
                  await prisma.$queryRaw`SELECT id FROM ${tableName} WHERE ${field.name} = ${userId} LIMIT 5`;
                const ids = records.map((r) => r.id).join(", ");
                console.log(`      记录ID: ${ids}`);
              }
            } catch (error) {
              // 忽略字段不存在的错误
            }
          }
        }
      } catch (error) {
        console.log(`❌ 检查表 ${tableName} 失败: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ SQL检查失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

sqlCheck();
