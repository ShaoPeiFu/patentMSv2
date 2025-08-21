const axios = require("axios");

async function debugMeeting() {
  try {
    // 1. 登录获取token
    console.log("🔑 登录获取token...");
    const loginResponse = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        username: "shaopei",
        password: "123456",
      }
    );
    const token = loginResponse.data.token;
    console.log("✅ 登录成功，用户ID:", loginResponse.data.user.id);

    // 2. 测试会议创建 - 使用最简单的数据
    console.log("\n📅 测试会议创建（最小数据）...");
    const simpleMeetingData = {
      title: "简单测试会议",
      startTime: "2025-08-20T10:00:00Z",
      endTime: "2025-08-20T11:00:00Z",
      platform: "zoom",
      // 不包含participantIds，看看是否是这个字段导致的问题
    };

    console.log("📦 发送数据:", simpleMeetingData);

    try {
      const meetingResponse = await axios.post(
        "http://localhost:3000/api/meetings",
        simpleMeetingData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ 会议创建成功:", meetingResponse.data);
    } catch (error) {
      console.error(
        "❌ 简单会议创建失败:",
        error.response?.data || error.message
      );
    }

    // 3. 测试会议创建 - 包含参与者
    console.log("\n📅 测试会议创建（包含参与者）...");
    const meetingWithParticipantsData = {
      title: "参与者测试会议",
      startTime: "2025-08-20T10:00:00Z",
      endTime: "2025-08-20T11:00:00Z",
      platform: "zoom",
      participantIds: [1], // 使用用户ID 1
    };

    console.log("📦 发送数据:", meetingWithParticipantsData);

    try {
      const meetingResponse = await axios.post(
        "http://localhost:3000/api/meetings",
        meetingWithParticipantsData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ 会议创建成功:", meetingResponse.data);
    } catch (error) {
      console.error(
        "❌ 参与者会议创建失败:",
        error.response?.data || error.message
      );
    }

    // 4. 检查用户是否存在
    console.log("\n👤 检查用户数据...");
    try {
      const usersResponse = await axios.get("http://localhost:3000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(
        "✅ 用户列表获取成功，用户数量:",
        usersResponse.data.users?.length || 0
      );
      if (usersResponse.data.users) {
        usersResponse.data.users.slice(0, 3).forEach((user) => {
          console.log(
            `  - ID: ${user.id}, 姓名: ${user.realName}, 用户名: ${user.username}`
          );
        });
      }
    } catch (error) {
      console.error(
        "❌ 获取用户列表失败:",
        error.response?.data || error.message
      );
    }
  } catch (error) {
    console.error("❌ 调试失败:", error.message);
    if (error.response) {
      console.error("状态码:", error.response.status);
      console.error("错误信息:", error.response.data);
    }
  }
}

debugMeeting();
