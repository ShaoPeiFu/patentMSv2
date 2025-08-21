const axios = require("axios");

const BASE_URL = "http://localhost:3000";
const TEST_USER_ID = 9; // 要删除的用户ID

async function testDeleteUserDetailed() {
  try {
    console.log("🧪 开始详细测试删除用户功能...");

    // 1. 登录获取token
    console.log("1️⃣ 登录获取token...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "testadmin",
      password: "test123",
    });

    const token = loginResponse.data.token;
    console.log("✅ 登录成功");

    // 2. 检查用户是否存在
    console.log("2️⃣ 检查用户是否存在...");
    const userResponse = await axios.get(
      `${BASE_URL}/api/users/${TEST_USER_ID}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("✅ 用户存在:", userResponse.data);

    // 3. 尝试删除用户
    console.log("3️⃣ 尝试删除用户...");
    try {
      const deleteResponse = await axios.delete(
        `${BASE_URL}/api/users/${TEST_USER_ID}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ 删除用户成功:", deleteResponse.data);
    } catch (deleteError) {
      console.error("❌ 删除用户失败:");
      console.error("  状态码:", deleteError.response?.status);
      console.error("  错误信息:", deleteError.response?.data);
      console.error("  完整错误:", deleteError.message);

      if (deleteError.response?.status === 500) {
        console.log("🔍 服务器内部错误，可能的原因:");
        console.log("  - 数据库连接问题");
        console.log("  - 外键约束问题");
        console.log("  - 模型不存在");
        console.log("  - 事务失败");
      }

      throw deleteError;
    }
  } catch (error) {
    console.error("❌ 测试完全失败:", error.message);

    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", error.response.data);
      console.error("响应头:", error.response.headers);
    }
  }
}

// 运行测试
testDeleteUserDetailed();
