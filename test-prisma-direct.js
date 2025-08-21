import { PrismaClient } from '@prisma/client';

async function testPrismaDirect() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 测试Prisma客户端连接...');
    
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
    
    // 测试创建任务
    console.log('📝 尝试创建任务...');
    const newTask = await prisma.task.create({
      data: {
        title: 'Prisma直接测试任务',
        description: '这是一个直接使用Prisma客户端创建的测试任务',
        assigneeId: 1,
        priority: 'medium',
        createdBy: 1
      }
    });
    console.log('✅ 任务创建成功:', newTask.id);
    
    // 删除测试任务
    await prisma.task.delete({
      where: { id: newTask.id }
    });
    console.log('🗑️ 测试任务已删除');
    
  } catch (error) {
    console.error('❌ Prisma测试失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Prisma连接已关闭');
  }
}

testPrismaDirect();
