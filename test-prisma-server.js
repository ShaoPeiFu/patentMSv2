import { PrismaClient } from '@prisma/client';

async function testPrismaServer() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 测试Prisma服务器连接...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ Prisma连接成功');
    
    // 测试查询用户
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });
    console.log('👤 用户查询成功:', user?.username);
    
    // 测试查询任务
    const tasks = await prisma.task.findMany({
      take: 5
    });
    console.log('📋 任务查询成功，数量:', tasks.length);
    
    // 测试创建任务 - 使用与服务器相同的数据结构
    console.log('📝 尝试创建任务（服务器模式）...');
    const newTask = await prisma.task.create({
      data: {
        title: '服务器模式测试任务',
        description: '这是一个测试任务',
        assigneeId: 1,
        priority: 'high',
        createdBy: 1
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });
    console.log('✅ 任务创建成功:', newTask.id);
    console.log('📊 任务详情:', {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      assigneeId: newTask.assigneeId,
      assigneeName: newTask.assignee?.realName || newTask.assignee?.username,
      dueDate: newTask.dueDate,
      status: newTask.status,
      priority: newTask.priority,
      createdAt: newTask.createdAt,
      updatedAt: newTask.updatedAt,
    });
    
    // 删除测试任务
    await prisma.task.delete({
      where: { id: newTask.id }
    });
    console.log('🗑️ 测试任务已删除');
    
  } catch (error) {
    console.error('❌ Prisma测试失败:', error);
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Prisma连接已关闭');
  }
}

testPrismaServer();
