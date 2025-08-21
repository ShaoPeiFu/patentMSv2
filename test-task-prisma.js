import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTaskCreation() {
  try {
    console.log('🔍 测试Prisma连接...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ Prisma连接成功');
    
    // 测试用户查询
    const user = await prisma.user.findFirst();
    console.log('✅ 用户查询成功:', user?.username);
    
    // 测试任务创建
    const task = await prisma.task.create({
      data: {
        title: '测试任务',
        description: '这是一个测试任务',
        priority: 'medium',
        createdBy: user.id,
      },
    });
    
    console.log('✅ 任务创建成功:', task);
    
    // 清理测试数据
    await prisma.task.delete({
      where: { id: task.id }
    });
    console.log('✅ 测试数据清理完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
  } finally {
    await prisma.$disconnect();
  }
}

testTaskCreation();
