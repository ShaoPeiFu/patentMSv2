const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugMeetingDatabase() {
  try {
    console.log("🔍 开始调试会议管理数据库问题...\n");

    // 1. 检查数据库表结构
    console.log("1️⃣ 检查数据库表结构...");

    // 检查会议表
    try {
      const meetings = await prisma.meeting.findMany({
        take: 5,
        include: {
          organizer: {
            select: { id: true, username: true, realName: true },
          },
          participants: {
            include: {
              user: { select: { id: true, username: true } },
            },
          },
        },
      });
      console.log("✅ 会议表查询成功");
      console.log(`  会议数量: ${meetings.length}`);

      if (meetings.length > 0) {
        meetings.forEach((meeting) => {
          console.log(`    - ID: ${meeting.id}, 标题: ${meeting.title}`);
          console.log(
            `      组织者: ${meeting.organizer?.username} (ID: ${meeting.organizer?.id})`
          );
          console.log(`      参与者数量: ${meeting.participants?.length || 0}`);
        });
      }
    } catch (error) {
      console.error("❌ 会议表查询失败:", error.message);
      console.error("  错误代码:", error.code);
      console.error("  错误详情:", error.meta);
    }

    // 2. 检查会议参与者表
    console.log("\n2️⃣ 检查会议参与者表...");
    try {
      const participants = await prisma.meetingParticipant.findMany({
        take: 5,
        include: {
          meeting: { select: { id: true, title: true } },
          user: { select: { id: true, username: true } },
        },
      });
      console.log("✅ 会议参与者表查询成功");
      console.log(`  参与者记录数量: ${participants.length}`);

      if (participants.length > 0) {
        participants.forEach((participant) => {
          console.log(
            `    - 会议: ${participant.meeting?.title} (ID: ${participant.meeting?.id})`
          );
          console.log(
            `      用户: ${participant.user?.username} (ID: ${participant.user?.id})`
          );
          console.log(
            `      角色: ${participant.role}, 状态: ${participant.status}`
          );
        });
      }
    } catch (error) {
      console.error("❌ 会议参与者表查询失败:", error.message);
      console.error("  错误代码:", error.code);
    }

    // 3. 检查用户表
    console.log("\n3️⃣ 检查用户表...");
    try {
      const users = await prisma.user.findMany({
        take: 10,
        select: { id: true, username: true, realName: true, role: true },
      });
      console.log("✅ 用户表查询成功");
      console.log(`  用户数量: ${users.length}`);

      users.forEach((user) => {
        console.log(
          `    - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.realName}, 角色: ${user.role}`
        );
      });
    } catch (error) {
      console.error("❌ 用户表查询失败:", error.message);
    }

    // 4. 测试会议创建的数据验证
    console.log("\n4️⃣ 测试会议创建数据验证...");

    // 测试数据
    const testMeetingData = {
      title: "数据库测试会议",
      description: "用于测试数据库约束的会议",
      startTime: new Date("2025-08-20T10:00:00Z"),
      endTime: new Date("2025-08-20T11:00:00Z"),
      duration: 60,
      platform: "zoom",
      joinUrl: "https://zoom.us/j/test123",
      hostUrl: "https://zoom.us/s/test123",
      status: "scheduled",
      organizerId: 1,
      agenda: "测试议程",
    };

    console.log("📦 测试数据:", JSON.stringify(testMeetingData, null, 2));

    try {
      // 先检查组织者是否存在
      const organizer = await prisma.user.findUnique({
        where: { id: testMeetingData.organizerId },
      });

      if (!organizer) {
        console.log("❌ 组织者不存在，ID:", testMeetingData.organizerId);
        return;
      }

      console.log("✅ 组织者验证通过:", organizer.username);

      // 尝试创建会议（不包含参与者）
      const meeting = await prisma.meeting.create({
        data: testMeetingData,
        include: {
          organizer: { select: { username: true } },
        },
      });

      console.log("✅ 会议创建成功!");
      console.log("  会议ID:", meeting.id);
      console.log("  标题:", meeting.title);
      console.log("  组织者:", meeting.organizer?.username);

      // 清理测试数据
      await prisma.meeting.delete({ where: { id: meeting.id } });
      console.log("  🗑️ 测试会议已清理");
    } catch (error) {
      console.error("❌ 会议创建失败:");
      console.error("  错误类型:", error.name);
      console.error("  错误代码:", error.code);
      console.error("  错误消息:", error.message);

      if (error.meta) {
        console.error("  元数据:", error.meta);
      }
    }

    // 5. 检查数据库约束
    console.log("\n5️⃣ 检查数据库约束...");

    // 检查外键约束
    try {
      // 检查会议表的外键约束
      const meetingConstraints = await prisma.$queryRaw`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'meetings';
      `;

      console.log("✅ 外键约束查询成功");
      console.log("  约束数量:", meetingConstraints.length);

      meetingConstraints.forEach((constraint) => {
        console.log(
          `    - 表: ${constraint.table_name}, 列: ${constraint.column_name}`
        );
        console.log(
          `      引用: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`
        );
      });
    } catch (error) {
      console.error("❌ 外键约束查询失败:", error.message);
    }

    console.log("\n🎯 数据库调试完成！");
  } catch (error) {
    console.error("❌ 调试失败:", error.message);
    console.error("错误堆栈:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugMeetingDatabase();
