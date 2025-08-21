const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMeetingCreation() {
  try {
    console.log('🔍 开始调试会议创建问题...\n');

    // 1. 检查数据库连接
    console.log('1️⃣ 检查数据库连接...');
    try {
      await prisma.$connect();
      console.log('✅ 数据库连接正常');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      return;
    }

    // 2. 检查用户数据
    console.log('\n2️⃣ 检查用户数据...');
    try {
      const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, username: true, realName: true }
      });
      console.log('✅ 用户查询成功');
      console.log('  用户数量:', users.length);
      users.forEach(user => {
        console.log(`    - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.realName}`);
      });
    } catch (error) {
      console.error('❌ 用户查询失败:', error.message);
      return;
    }

    // 3. 测试会议创建 - 模拟API路由的逻辑
    console.log('\n3️⃣ 测试会议创建逻辑...');
    
    const testData = {
      title: '调试测试会议',
      description: '用于调试的会议',
      startTime: '2025-08-20T10:00:00Z',
      endTime: '2025-08-20T11:00:00Z',
      platform: 'zoom',
      participantIds: [1],
      agenda: '调试议程'
    };

    console.log('📦 测试数据:', testData);
    console.log('🆔 组织者ID: 1');

    try {
      // 验证时间
      const startDateTime = new Date(testData.startTime);
      const endDateTime = new Date(testData.endTime);
      
      if (endDateTime <= startDateTime) {
        console.log('❌ 时间验证失败: 结束时间必须晚于开始时间');
        return;
      }
      console.log('✅ 时间验证通过');

      // 验证参与者
      if (testData.participantIds && testData.participantIds.length > 0) {
        const existingUsers = await prisma.user.findMany({
          where: { id: { in: testData.participantIds } },
          select: { id: true }
        });

        if (existingUsers.length !== testData.participantIds.length) {
          const existingIds = existingUsers.map(u => u.id);
          const missingIds = testData.participantIds.filter(id => !existingIds.includes(id));
          console.log('❌ 参与者验证失败:', `用户ID ${missingIds.join(', ')} 不存在`);
          return;
        }
        console.log('✅ 参与者验证通过');
      }

      // 生成会议链接
      const generateMeetingUrls = (platform) => {
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const meetingId = Date.now().toString();

        switch (platform) {
          case "zoom":
            return {
              joinUrl: `https://zoom.us/j/${meetingId}`,
              hostUrl: `https://zoom.us/s/${meetingId}?pwd=${Math.random().toString(36).substring(2, 8)}`
            };
          default:
            return {
              joinUrl: `${baseUrl}/meeting/${meetingId}`,
              hostUrl: `${baseUrl}/meeting/${meetingId}/host`
            };
        }
      };

      const { joinUrl, hostUrl } = generateMeetingUrls(testData.platform);
      console.log('✅ 会议链接生成成功');
      console.log('  加入链接:', joinUrl);
      console.log('  主持链接:', hostUrl);

      // 尝试创建会议
      console.log('\n4️⃣ 尝试创建会议...');
      
      const meeting = await prisma.meeting.create({
        data: {
          title: testData.title,
          description: testData.description,
          startTime: new Date(testData.startTime),
          endTime: new Date(testData.endTime),
          duration: Math.ceil((new Date(testData.endTime).getTime() - new Date(testData.startTime).getTime()) / (1000 * 60)),
          platform: testData.platform,
          joinUrl,
          hostUrl,
          status: 'scheduled',
          organizerId: 1,
          agenda: testData.agenda,
          participants: testData.participantIds && testData.participantIds.length > 0 ? {
            create: testData.participantIds.map(participantId => ({
              userId: participantId,
              role: participantId === 1 ? 'organizer' : 'participant',
              status: 'invited',
              response: 'no_response'
            }))
          } : undefined
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  realName: true,
                  email: true
                }
              }
            }
          },
          organizer: {
            select: {
              id: true,
              realName: true,
              email: true
            }
          }
        }
      });

      console.log('✅ 会议创建成功!');
      console.log('  会议ID:', meeting.id);
      console.log('  标题:', meeting.title);
      console.log('  组织者:', meeting.organizer?.realName);
      console.log('  参与者数量:', meeting.participants?.length || 0);

      // 清理测试数据
      console.log('\n5️⃣ 清理测试数据...');
      await prisma.meeting.delete({ where: { id: meeting.id } });
      console.log('✅ 测试会议已清理');

    } catch (error) {
      console.error('❌ 会议创建失败:');
      console.error('  错误类型:', error.name);
      console.error('  错误代码:', error.code);
      console.error('  错误消息:', error.message);
      
      if (error.meta) {
        console.error('  元数据:', error.meta);
      }
      
      // 检查是否是Prisma错误
      if (error.code) {
        console.error('  🔍 这是Prisma错误，代码:', error.code);
        switch (error.code) {
          case 'P2002':
            console.error('    唯一约束违反');
            break;
          case 'P2003':
            console.error('    外键约束违反');
            break;
          case 'P2025':
            console.error('    记录不存在');
            break;
          default:
            console.error('    未知Prisma错误');
        }
      }
    }

    console.log('\n🎯 调试完成！');

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugMeetingCreation();
