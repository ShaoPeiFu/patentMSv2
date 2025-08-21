const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkAllTables() {
  const userId = 9;

  try {
    console.log(`🔍 检查数据库中所有表，找出引用用户ID ${userId} 的表...`);

    // 获取数据库中所有表名
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    console.log("📋 数据库中的所有表:");
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.name}`);
    });

    console.log(`\n🔍 检查每个表是否引用用户ID ${userId}...`);

    // 检查每个表是否有引用用户的字段
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
            col.name.toLowerCase().includes("owner")
        );

        if (userFields.length > 0) {
          console.log(`\n🔍 表 ${tableName} 的可能用户相关字段:`);
          userFields.forEach((field) => {
            console.log(`  - ${field.name} (${field.type})`);
          });

          // 尝试检查是否有数据引用用户ID
          for (const field of userFields) {
            try {
              const count =
                await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.raw(
                  tableName
                )} WHERE ${prisma.raw(field.name)} = ${userId}`;

              if (count[0].count > 0) {
                console.log(
                  `    ⚠️  字段 ${field.name} 有 ${count[0].count} 条记录引用用户ID ${userId}`
                );
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
    console.error("❌ 检查所有表失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTables();
