import axios from "axios";

const testPatentAPI = async () => {
  try {
    console.log("🔐 测试登录获取token...");

    // 登录获取token
    const loginResponse = await axios.post(
      "http://localhost:3000/api/auth/login",
      {
        username: "aaa",
        password: "admin123",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ 登录成功，获取到token");

    // 设置请求头
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    console.log("\n📄 测试获取专利列表（无状态限制）...");
    const patentsResponse = await axios.get(
      "http://localhost:3000/api/patents?limit=1000",
      { headers }
    );
    console.log("✅ 获取专利列表成功:");
    console.log(`   总数量: ${patentsResponse.data.patents?.length || 0}`);

    if (
      patentsResponse.data.patents &&
      patentsResponse.data.patents.length > 0
    ) {
      patentsResponse.data.patents.forEach((patent, index) => {
        console.log(`   ${index + 1}. ID: ${patent.id}`);
        console.log(`      标题: ${patent.title}`);
        console.log(`      专利号: ${patent.patentNumber}`);
        console.log(`      状态: ${patent.status}`);
        console.log(`      类型: ${patent.type}`);
        console.log(
          `      申请人: ${
            patent.user?.realName || patent.user?.username || "未知"
          }`
        );
        console.log(`      分类: ${patent.category?.name || "未分类"}`);
        console.log("      ---");
      });
    } else {
      console.log("   ❌ 没有获取到专利数据");
    }

    console.log("\n📂 测试获取专利分类...");
    const categoriesResponse = await axios.get(
      "http://localhost:3000/api/patent-categories",
      { headers }
    );
    console.log("✅ 获取专利分类成功:");
    console.log(`   总数量: ${categoriesResponse.data.length || 0}`);

    if (categoriesResponse.data && categoriesResponse.data.length > 0) {
      categoriesResponse.data.forEach((category, index) => {
        console.log(
          `   ${index + 1}. ID: ${category.id}, 名称: ${
            category.name
          }, 专利数量: ${category._count?.patents || 0}`
        );
      });
    }

    // 测试不同状态的筛选
    console.log("\n🔍 测试状态筛选...");
    const statuses = [
      "pending",
      "approved",
      "rejected",
      "expired",
      "maintained",
    ];

    for (const status of statuses) {
      try {
        const filteredResponse = await axios.get(
          `http://localhost:3000/api/patents?status=${status}&limit=100`,
          { headers }
        );
        const count = filteredResponse.data.patents?.length || 0;
        console.log(`   状态 ${status}: ${count} 个专利`);
      } catch (error) {
        console.log(
          `   状态 ${status}: 获取失败 - ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);
  }
};

testPatentAPI();
