const axios = require("axios");

const BASE_URL = "http://localhost:3000";
const TEST_USER_ID = 9; // 要删除的用户ID

async function testDeleteUser() {
  try {
    console.log("🧪 开始测试删除用户功能...");

    // 1. 首先尝试登录获取token
    console.log("1️⃣ 尝试登录获取token...");

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "testadmin",
      password: "test123",
    });

    const token = loginResponse.data.token;
    console.log("✅ 登录成功，获取到token");

    // 2. 检查用户是否存在
    console.log("2️⃣ 检查用户是否存在...");
    try {
      const userResponse = await axios.get(
        `${BASE_URL}/api/users/${TEST_USER_ID}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ 用户存在:", userResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("❌ 用户不存在，无法测试删除");
        return;
      }
      throw error;
    }

    // 3. 尝试删除用户
    console.log("3️⃣ 尝试删除用户...");
    const deleteResponse = await axios.delete(
      `${BASE_URL}/api/users/${TEST_USER_ID}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ 删除用户成功:", deleteResponse.data);

    // 4. 验证用户是否已被删除
    console.log("4️⃣ 验证用户是否已被删除...");
    try {
      await axios.get(`${BASE_URL}/api/users/${TEST_USER_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("❌ 用户仍然存在，删除可能失败");
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("✅ 用户已被成功删除");
      } else {
        console.log("❌ 验证删除时出现错误:", error.response?.data);
      }
    }
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);

    if (error.response?.status === 500) {
      console.log("🔍 服务器内部错误，检查服务器日志");
    } else if (error.response?.status === 403) {
      console.log("🚫 权限不足，需要管理员权限");
    } else if (error.response?.status === 401) {
      console.log("🔑 认证失败，token无效");
    }
  }
}

// 运行测试
testDeleteUser();
