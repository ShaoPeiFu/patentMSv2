const { PrismaClient } = require("@prisma/client");
const path = require("path");

const dbPath = path.join(__dirname, "prisma", "dev.db");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

async function testFeeData() {
  try {
    console.log("🧪 测试费用数据结构...");

    // 查询所有费用记录
    const fees = await prisma.fee.findMany({
      include: {
        patent: {
          select: {
            id: true,
            title: true,
            patentNumber: true,
          },
        },
      },
    });

    console.log("✅ 查询到费用记录数量:", fees.length);

    if (fees.length > 0) {
      console.log("\n📋 第一个费用记录的完整结构:");
      console.log(JSON.stringify(fees[0], null, 2));

      console.log("\n🔍 关键字段检查:");
      console.log("patentNumber:", fees[0].patentNumber);
      console.log("patentTitle:", fees[0].patentTitle);
      console.log("type:", fees[0].type);
      console.log("feeType:", fees[0].feeType);
      console.log("amount:", fees[0].amount);
      console.log("status:", fees[0].status);
    }
  } catch (error) {
    console.error("❌ 测试失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeeData();
