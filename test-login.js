const axios = require("axios");

const API_BASE = "http://localhost:3000/api";

async function testLogin() {
  try {
    console.log("🧪 开始测试登录流程...");

    // 1. 测试登录
    console.log("\n📝 测试用户登录...");
    const loginData = {
      username: "shaopei",
      password: "123456",
    };

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log("✅ 登录成功:", {
      user: loginResponse.data.user.username,
      token: loginResponse.data.token ? "已获取" : "未获取",
    });

    const token = loginResponse.data.token;

    if (!token) {
      console.log("❌ 登录成功但没有获取到token");
      return;
    }

    // 2. 测试获取用户信息
    console.log("\n🔍 测试获取用户信息...");
    const userResponse = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("✅ 用户信息获取成功:", {
      id: userResponse.data.id,
      username: userResponse.data.username,
      realName: userResponse.data.realName,
    });

    // 3. 测试创建会议
    console.log("\n📅 测试创建会议...");
    const meetingData = {
      title: "测试会议 - 专利管理系统",
      description: "这是一个测试会议，用于验证会议创建功能",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
      endTime: new Date(
        Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000
      ).toISOString(), // 明天+1小时
      platform: "zoom",
      participantIds: [userResponse.data.id], // 使用当前用户ID
      agenda: "1. 讨论专利管理系统功能\n2. 测试会议链接功能\n3. 验证API集成",
    };

    const meetingResponse = await axios.post(
      `${API_BASE}/meetings`,
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ 会议创建成功:", {
      id: meetingResponse.data.id,
      title: meetingResponse.data.title,
      joinUrl: meetingResponse.data.joinUrl,
      hostUrl: meetingResponse.data.hostUrl,
    });

    console.log("\n🎉 所有测试通过！认证和会议创建功能工作正常。");
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log("💡 提示：请确保用户 'shaopei' 存在且密码正确");
    }
  }
}

// 运行测试
testLogin();
