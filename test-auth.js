const axios = require("axios");

const API_BASE = "http://localhost:3000/api";

async function testAuth() {
  console.log("🧪 测试认证系统...\n");

  try {
    // 1. 测试健康检查
    console.log("1️⃣ 测试健康检查...");
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log("✅ 健康检查成功:", healthResponse.data);

    // 2. 测试用户注册
    console.log("\n2️⃣ 测试用户注册...");
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: "Test123456",
      realName: "测试用户",
      phone: "13800138000",
      department: "tech",
      role: "user"
    };

    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log("✅ 用户注册成功:", registerResponse.data.success);
    const token = registerResponse.data.token;
    console.log("Token:", token.substring(0, 50) + "...");

    // 3. 测试获取当前用户信息
    console.log("\n3️⃣ 测试获取当前用户信息...");
    const headers = { Authorization: `Bearer ${token}` };
    const userMeResponse = await axios.get(`${API_BASE}/users/me`, { headers });
    console.log("✅ 获取用户信息成功:", userMeResponse.data);

    // 4. 测试无效token
    console.log("\n4️⃣ 测试无效token...");
    try {
      const invalidToken = "invalid.token.here";
      const invalidHeaders = { Authorization: `Bearer ${invalidToken}` };
      await axios.get(`${API_BASE}/users/me`, { headers: invalidHeaders });
      console.log("❌ 应该失败但没有失败");
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ 无效token正确被拒绝:", error.response.data.error);
      } else {
        console.log("❌ 无效token处理异常:", error.response?.status);
      }
    }

    // 5. 测试无token
    console.log("\n5️⃣ 测试无token...");
    try {
      await axios.get(`${API_BASE}/users/me`);
      console.log("❌ 应该失败但没有失败");
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ 无token正确被拒绝:", error.response.data.error);
      } else {
        console.log("❌ 无token处理异常:", error.response?.status);
      }
    }

    console.log("\n🎉 认证系统测试完成！");

  } catch (error) {
    console.error("\n❌ 测试失败:", error.response?.data || error.message);
    if (error.response) {
      console.error("状态码:", error.response.status);
      console.error("响应头:", error.response.headers);
    }
  }
}

testAuth();
