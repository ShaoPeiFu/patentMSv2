const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testDeleteSimpleUser() {
  try {
    console.log("🧪 测试删除简单用户（无引用）...");

    // 1. 登录获取token
    console.log("1️⃣ 登录获取token...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "testadmin",
      password: "test123",
    });

    const token = loginResponse.data.token;
    console.log("✅ 登录成功");

    // 2. 先创建一个简单的测试用户
    console.log("2️⃣ 创建测试用户...");
    const createResponse = await axios.post(
      `${BASE_URL}/api/users`,
      {
        username: "simpleuser",
        email: "simple@test.com",
        password: "123456",
        realName: "简单用户",
        phone: "13900000000",
        department: "测试部",
        role: "user",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const newUserId = createResponse.data.id;
    console.log(`✅ 创建测试用户成功，ID: ${newUserId}`);

    // 3. 立即删除这个用户
    console.log("3️⃣ 删除测试用户...");
    const deleteResponse = await axios.delete(
      `${BASE_URL}/api/users/${newUserId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ 删除测试用户成功:", deleteResponse.data);

    // 4. 验证用户是否已被删除
    console.log("4️⃣ 验证用户是否已被删除...");
    try {
      await axios.get(`${BASE_URL}/api/users/${newUserId}`, {
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
    }
  }
}

// 运行测试
testDeleteSimpleUser();
