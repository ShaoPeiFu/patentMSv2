// 测试可视化API的简单脚本
const testVisualizationAPI = async () => {
  try {
    console.log("🧪 测试可视化API...");

    // 测试时间轴API
    console.log("📅 测试时间轴API...");
    const timelineResponse = await fetch(
      "http://localhost:3000/api/visualization/timeline",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (timelineResponse.ok) {
      const timelineData = await timelineResponse.json();
      console.log("✅ 时间轴API测试成功:", timelineData);
    } else {
      console.log(
        "❌ 时间轴API测试失败:",
        timelineResponse.status,
        timelineResponse.statusText
      );
    }

    // 测试技术族谱API
    console.log("🌳 测试技术族谱API...");
    const techTreeResponse = await fetch(
      "http://localhost:3000/api/visualization/tech-tree",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (techTreeResponse.ok) {
      const techTreeData = await techTreeResponse.json();
      console.log("✅ 技术族谱API测试成功:", techTreeData);
    } else {
      console.log(
        "❌ 技术族谱API测试失败:",
        techTreeResponse.status,
        techTreeResponse.statusText
      );
    }
  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error);
  }
};

// 运行测试
testVisualizationAPI();
