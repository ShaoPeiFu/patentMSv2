const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

async function debugMeetingCreation() {
  try {
    console.log("🔍 详细调试会议创建...\n");

    // 1. 登录获取token
    console.log("🔐 步骤1: 登录获取token...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: "shaopei",
      password: "123456",
    });

    const token = loginResponse.data.token;
    console.log("✅ 登录成功，用户ID:", loginResponse.data.user.id);
    console.log("🔑 Token:", token.substring(0, 50) + "...");

    // 2. 测试会议创建
    console.log("\n📅 步骤2: 测试会议创建...");

    const meetingData = {
      title: "调试测试会议",
      startTime: "2025-08-20T10:00:00Z",
      endTime: "2025-08-20T11:00:00Z",
      platform: "zoom",
    };

    console.log("📦 发送的会议数据:", JSON.stringify(meetingData, null, 2));

    try {
      const createResponse = await axios.post(
        `${BASE_URL}/meetings`,
        meetingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      console.log("✅ 会议创建成功!");
      console.log("📊 响应数据:", JSON.stringify(createResponse.data, null, 2));
    } catch (createError) {
      console.error("❌ 会议创建失败!");
      console.error("错误状态码:", createError.response?.status);
      console.error("错误响应:", createError.response?.data);
      console.error("错误详情:", createError.message);

      if (createError.response?.data?.details) {
        console.error("详细错误信息:", createError.response.data.details);
      }

      if (createError.response?.data?.code) {
        console.error("错误代码:", createError.response.data.code);
      }
    }

    // 3. 测试获取会议列表
    console.log("\n📋 步骤3: 测试获取会议列表...");
    try {
      const listResponse = await axios.get(`${BASE_URL}/meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ 获取会议列表成功!");
      console.log("📊 会议数量:", listResponse.data.meetings?.length || 0);
      console.log("📊 总数量:", listResponse.data.total || 0);
    } catch (listError) {
      console.error(
        "❌ 获取会议列表失败:",
        listError.response?.data || listError.message
      );
    }
  } catch (error) {
    console.error("❌ 调试过程失败:", error.message);
  }
}

debugMeetingCreation();
