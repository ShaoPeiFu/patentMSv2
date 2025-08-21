import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const checkUser4 = async () => {
  try {
    console.log('🔍 检查数据库中ID为4的用户...');
    
    const user = await prisma.user.findUnique({
      where: { id: 4 },
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (user) {
      console.log('✅ 找到用户:', user);
    } else {
      console.log('❌ 用户ID 4不存在');
    }
    
    console.log('\n📊 检查所有用户...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
      },
    });
    
    console.log('所有用户:', allUsers);
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
};

checkUser4();
