import axios from "axios";

const testPatentList = async () => {
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

    console.log("\n📄 测试获取专利列表...");
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
      const patents = patentsResponse.data.patents;

      // 计算统计数据
      const total = patents.length;
      const byStatus = patents.reduce((acc, patent) => {
        acc[patent.status] = (acc[patent.status] || 0) + 1;
        return acc;
      }, {});

      const byType = patents.reduce((acc, patent) => {
        acc[patent.type] = (acc[patent.type] || 0) + 1;
        return acc;
      }, {});

      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const sixMonthsFromNow = new Date(
        now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000
      );

      const expiringSoon = patents.filter((patent) => {
        if (!patent.expirationDate) return false;
        const expirationDate = new Date(patent.expirationDate);
        return expirationDate <= thirtyDaysFromNow && expirationDate > now;
      }).length;

      const maintenanceDue = patents.filter((patent) => {
        if (!patent.fees || !Array.isArray(patent.fees)) return false;
        const hasMaintenanceFee = patent.fees.some((fee) => {
          const dueDate = new Date(fee.dueDate);
          return (
            dueDate <= sixMonthsFromNow &&
            dueDate > now &&
            fee.type === "maintenance"
          );
        });
        return hasMaintenanceFee;
      }).length;

      console.log("\n📊 统计数据:");
      console.log(`   总数: ${total}`);
      console.log(`   按状态:`, byStatus);
      console.log(`   按类型:`, byType);
      console.log(`   即将过期: ${expiringSoon}`);
      console.log(`   维护费到期: ${maintenanceDue}`);

      // 显示专利详情
      console.log("\n📋 专利详情:");
      patents.forEach((patent, index) => {
        console.log(`   ${index + 1}. ID: ${patent.id}`);
        console.log(`      标题: ${patent.title}`);
        console.log(`      专利号: ${patent.patentNumber}`);
        console.log(`      状态: ${patent.status}`);
        console.log(`      类型: ${patent.type}`);
        console.log(`      申请日期: ${patent.applicationDate}`);
        console.log(`      到期日期: ${patent.expirationDate || "未设置"}`);
        console.log(`      费用数量: ${patent.fees ? patent.fees.length : 0}`);
        console.log("      ---");
      });
    }

    console.log("\n✨ 测试完成！");
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);
  }
};

testPatentList();
