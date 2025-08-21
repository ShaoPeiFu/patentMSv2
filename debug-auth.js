import axios from "axios";

const API_BASE = "http://localhost:3000/api";

async function debugAuth() {
  console.log("🔍 开始调试认证系统...\n");

  try {
    // 1. 测试健康检查
    console.log("1️⃣ 测试健康检查...");
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log("✅ 健康检查成功:", healthResponse.status);

    // 2. 测试用户注册
    console.log("\n2️⃣ 测试用户注册...");
    const testUser = {
      username: `debuguser_${Date.now()}`,
      email: `debug_${Date.now()}@example.com`,
      password: "Debug123456",
      realName: "调试用户",
      phone: "13800138000",
      department: "tech",
      role: "user",
    };

    const registerResponse = await axios.post(
      `${API_BASE}/auth/register`,
      testUser
    );
    console.log("✅ 用户注册成功:", registerResponse.data.success);
    const token = registerResponse.data.token;
    console.log("Token长度:", token.length);
    console.log("Token前50字符:", token.substring(0, 50));

    // 3. 测试JWT解码
    console.log("\n3️⃣ 测试JWT解码...");
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      console.log("✅ JWT payload解码成功:", {
        userId: payload.userId,
        username: payload.username,
        exp: payload.exp,
        iat: payload.iat,
      });
    } catch (e) {
      console.log("❌ JWT payload解码失败:", e.message);
    }

    // 4. 测试获取当前用户信息
    console.log("\n4️⃣ 测试获取当前用户信息...");
    const headers = { Authorization: `Bearer ${token}` };
    console.log("请求头:", headers);

    try {
      const userMeResponse = await axios.get(`${API_BASE}/users/me`, {
        headers,
      });
      console.log(
        "✅ 获取用户信息成功:",
        userMeResponse.status,
        userMeResponse.data
      );
    } catch (error) {
      console.log("❌ 获取用户信息失败:");
      console.log("状态码:", error.response?.status);
      console.log("错误信息:", error.response?.data);
      console.log("完整错误:", error.message);
    }

    // 5. 测试无效token
    console.log("\n5️⃣ 测试无效token...");
    try {
      const invalidHeaders = { Authorization: `Bearer invalid.token.here` };
      await axios.get(`${API_BASE}/users/me`, { headers: invalidHeaders });
      console.log("❌ 应该失败但没有失败");
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ 无效token正确被拒绝:", error.response.data.error);
      } else {
        console.log(
          "❌ 无效token处理异常:",
          error.response?.status,
          error.response?.data
        );
      }
    }

    console.log("\n🎉 调试完成！");
  } catch (error) {
    console.error("\n❌ 调试失败:", error.response?.data || error.message);
    if (error.response) {
      console.error("状态码:", error.response.status);
      console.error("响应头:", error.response.headers);
    }
  }
}

debugAuth();
