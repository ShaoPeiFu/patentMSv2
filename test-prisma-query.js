import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testPrismaQuery = async () => {
  try {
    console.log('🔍 测试Prisma查询用户ID 4...');
    
    const user = await prisma.user.findUnique({
      where: { id: 4 },
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    });
    
    if (user) {
      console.log('✅ 查询成功:', user);
    } else {
      console.log('❌ 查询失败: 用户不存在');
    }
    
  } catch (error) {
    console.error('❌ Prisma查询失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
    });
  } finally {
    await prisma.$disconnect();
  }
};

testPrismaQuery();
