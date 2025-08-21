const axios = require("axios");

const API_BASE = "http://localhost:3000/api";

// 测试数据
const testMeeting = {
  title: "测试会议 - 专利管理系统",
  description: "这是一个测试会议，用于验证会议创建功能",
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
  endTime: new Date(
    Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000
  ).toISOString(), // 明天+1小时
  platform: "zoom",
  participantIds: [1, 2], // 假设用户ID 1和2存在
  agenda: "1. 讨论专利管理系统功能\n2. 测试会议链接功能\n3. 验证API集成",
};

async function testMeetingAPI() {
  try {
    console.log("🧪 开始测试会议API...");

    // 1. 测试创建会议
    console.log("\n📝 测试创建会议...");
    const createResponse = await axios.post(
      `${API_BASE}/meetings`,
      testMeeting
    );
    console.log("✅ 会议创建成功:", {
      id: createResponse.data.id,
      title: createResponse.data.title,
      joinUrl: createResponse.data.joinUrl,
      hostUrl: createResponse.data.hostUrl,
    });

    const meetingId = createResponse.data.id;

    // 2. 测试获取会议详情
    console.log("\n🔍 测试获取会议详情...");
    const detailResponse = await axios.get(`${API_BASE}/meetings/${meetingId}`);
    console.log("✅ 会议详情获取成功:", {
      id: detailResponse.data.id,
      title: detailResponse.data.title,
      joinUrl: detailResponse.data.joinUrl,
      hostUrl: detailResponse.data.hostUrl,
      participants: detailResponse.data.participants.length,
    });

    // 3. 测试获取会议列表
    console.log("\n📋 测试获取会议列表...");
    const listResponse = await axios.get(`${API_BASE}/meetings`);
    console.log("✅ 会议列表获取成功:", {
      total: listResponse.data.total,
      meetings: listResponse.data.meetings.length,
    });

    // 4. 测试会议统计
    console.log("\n📊 测试会议统计...");
    const statsResponse = await axios.get(`${API_BASE}/meetings/stats`);
    console.log("✅ 会议统计获取成功:", statsResponse.data);

    console.log("\n🎉 所有测试通过！会议API工作正常。");
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);
  }
}

// 运行测试
testMeetingAPI();
