const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function softDeleteUser() {
  const userId = 9;

  try {
    console.log(`🔄 尝试软删除用户ID ${userId}...`);

    // 1. 检查用户是否存在
    console.log("1️⃣ 检查用户是否存在...");
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("❌ 用户不存在");
      return;
    }

    console.log("✅ 用户存在:", {
      id: user.id,
      username: user.username,
      role: user.role,
      realName: user.realName,
    });

    // 2. 软删除：将用户标记为已删除
    console.log("2️⃣ 执行软删除...");

    // 方案1：添加deleted字段（如果schema支持）
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          // 尝试添加软删除标记
          username: `deleted_${user.username}_${Date.now()}`,
          email: `deleted_${user.email}`,
          realName: `已删除用户_${user.realName}`,
          role: "deleted",
          // 添加删除时间戳
          updatedAt: new Date(),
        },
      });

      console.log("✅ 软删除成功:", {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        realName: updatedUser.realName,
      });

      console.log("\n💡 软删除完成！");
      console.log("   - 用户已被标记为已删除");
      console.log("   - 用户名和邮箱已修改");
      console.log('   - 角色已改为"deleted"');
      console.log("   - 原始数据已保留，但不可用");
    } catch (error) {
      console.log("❌ 软删除失败，尝试其他方案...");

      // 方案2：如果schema不支持软删除字段，则禁用用户
      try {
        const disabledUser = await prisma.user.update({
          where: { id: userId },
          data: {
            username: `disabled_${user.username}`,
            email: `disabled_${user.email}`,
            role: "disabled",
            updatedAt: new Date(),
          },
        });

        console.log("✅ 用户禁用成功:", {
          id: disabledUser.id,
          username: disabledUser.username,
          role: disabledUser.role,
        });

        console.log("\n💡 用户已被禁用！");
        console.log("   - 用户名和邮箱已修改");
        console.log('   - 角色已改为"disabled"');
        console.log("   - 用户无法登录但数据保留");
      } catch (disableError) {
        console.error("❌ 所有软删除方案都失败:", disableError.message);
        console.log("\n🔍 建议:");
        console.log("1. 检查Prisma schema是否支持软删除字段");
        console.log("2. 或者手动清理所有引用后重试物理删除");
        console.log("3. 或者联系数据库管理员协助");
      }
    }
  } catch (error) {
    console.error("❌ 软删除用户失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

softDeleteUser();
