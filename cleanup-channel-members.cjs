const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupChannelMembers() {
  const userId = 9;

  try {
    console.log(`🧹 清理用户ID ${userId} 的协作频道成员引用...`);

    // 1. 检查协作频道成员引用
    console.log("1️⃣ 检查协作频道成员引用...");
    const channelMembers = await prisma.collaborationChannelMember.findMany({
      where: { userId },
    });

    console.log(`发现 ${channelMembers.length} 条协作频道成员记录`);

    if (channelMembers.length > 0) {
      channelMembers.forEach((member, index) => {
        console.log(
          `  ${index + 1}. 频道ID: ${member.channelId}, 角色: ${member.role}`
        );
      });
    }

    // 2. 删除协作频道成员引用
    console.log("2️⃣ 删除协作频道成员引用...");
    const deletedMembers = await prisma.collaborationChannelMember.deleteMany({
      where: { userId },
    });

    console.log(`✅ 已删除 ${deletedMembers.count} 条协作频道成员记录`);

    // 3. 验证是否清理完成
    console.log("3️⃣ 验证清理结果...");
    const remainingMembers = await prisma.collaborationChannelMember.count({
      where: { userId },
    });

    if (remainingMembers === 0) {
      console.log("✅ 协作频道成员引用已清理完成");
    } else {
      console.log(`❌ 仍有 ${remainingMembers} 条记录未清理`);
    }
  } catch (error) {
    console.error("❌ 清理协作频道成员失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupChannelMembers();
