const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createSamplePatents() {
  console.log("🌱 开始创建示例专利数据...");

  try {
    // 检查用户是否存在
    const adminUser = await prisma.user.findFirst({
      where: { username: "admin" },
    });

    if (!adminUser) {
      console.log("❌ 未找到admin用户，请先运行种子脚本");
      return;
    }

    // 创建示例专利
    const samplePatents = [
      {
        title: "智能语音识别系统及其方法",
        patentNumber: "CN202310001234.X",
        applicationNumber: "CN202310001234",
        description:
          "本发明涉及一种智能语音识别系统，能够高效准确地识别多种语言和方言。",
        status: "pending",
        type: "invention",
        applicationDate: new Date("2023-01-15"),
        publicationDate: new Date("2023-07-15"),
        technicalField: "人工智能",
        keywords: JSON.stringify([
          "语音识别",
          "人工智能",
          "机器学习",
          "自然语言处理",
        ]),
        applicants: JSON.stringify(["北京科技有限公司", "清华大学"]),
        inventors: JSON.stringify(["张三", "李四", "王五"]),
        abstract:
          "本发明提供了一种基于深度学习的智能语音识别系统，通过多层神经网络实现高精度语音识别。",
        claims: JSON.stringify([
          "一种智能语音识别系统，包括音频采集模块、预处理模块和识别模块",
          "根据权利要求1所述的系统，其中预处理模块包括降噪和特征提取功能",
          "根据权利要求1所述的系统，其中识别模块采用LSTM神经网络架构",
        ]),
        userId: adminUser.id,
        priority: "high",
      },
      {
        title: "新型锂电池充电管理系统",
        patentNumber: "CN202310005678.X",
        applicationNumber: "CN202310005678",
        description: "一种用于电动汽车的高效锂电池充电管理系统。",
        status: "approved",
        type: "invention",
        applicationDate: new Date("2023-02-10"),
        publicationDate: new Date("2023-08-10"),
        grantDate: new Date("2023-12-01"),
        technicalField: "电池技术",
        keywords: JSON.stringify([
          "锂电池",
          "充电管理",
          "电动汽车",
          "能源管理",
        ]),
        applicants: JSON.stringify(["上海新能源科技股份有限公司"]),
        inventors: JSON.stringify(["陈明", "刘华", "赵磊"]),
        abstract:
          "本发明涉及一种智能锂电池充电管理系统，能够根据电池状态自动调节充电策略。",
        claims: JSON.stringify([
          "一种锂电池充电管理系统，包括监测模块、控制模块和保护模块",
          "根据权利要求1所述的系统，其中监测模块实时检测电池温度、电压和电流",
          "根据权利要求1所述的系统，其中控制模块根据电池状态调整充电参数",
        ]),
        userId: adminUser.id,
        priority: "medium",
      },
      {
        title: "基于区块链的数据安全存储方法",
        patentNumber: "CN202310009012.X",
        applicationNumber: "CN202310009012",
        description: "一种利用区块链技术实现数据安全存储的创新方法。",
        status: "under_review",
        type: "invention",
        applicationDate: new Date("2023-03-20"),
        publicationDate: new Date("2023-09-20"),
        technicalField: "区块链技术",
        keywords: JSON.stringify([
          "区块链",
          "数据安全",
          "分布式存储",
          "加密技术",
        ]),
        applicants: JSON.stringify(["深圳区块链研究院", "腾讯科技有限公司"]),
        inventors: JSON.stringify(["周杰", "吴强", "孙丽"]),
        abstract:
          "本发明提供了一种基于区块链的数据安全存储方法，确保数据的完整性和不可篡改性。",
        claims: JSON.stringify([
          "一种基于区块链的数据安全存储方法，包括数据加密、区块生成和链式存储步骤",
          "根据权利要求1所述的方法，其中数据加密采用AES-256加密算法",
          "根据权利要求1所述的方法，其中区块生成包括哈希计算和数字签名",
        ]),
        userId: adminUser.id,
        priority: "high",
      },
      {
        title: "智能家居控制系统",
        patentNumber: "CN202310012345.X",
        applicationNumber: "CN202310012345",
        description: "一种基于物联网技术的智能家居控制系统。",
        status: "pending",
        type: "utility_model",
        applicationDate: new Date("2023-04-05"),
        technicalField: "物联网",
        keywords: JSON.stringify(["智能家居", "物联网", "远程控制", "自动化"]),
        applicants: JSON.stringify(["小米科技有限公司"]),
        inventors: JSON.stringify(["雷军", "林斌"]),
        abstract:
          "本实用新型涉及一种智能家居控制系统，能够实现对家电设备的远程智能控制。",
        claims: JSON.stringify([
          "一种智能家居控制系统，包括中央控制器、传感器网络和执行器",
          "根据权利要求1所述的系统，其中传感器网络包括温度、湿度、光照传感器",
          "根据权利要求1所述的系统，其中执行器控制照明、空调、安防设备",
        ]),
        userId: adminUser.id,
        priority: "medium",
      },
      {
        title: "可折叠手机屏幕结构设计",
        patentNumber: "CN202330067890.X",
        applicationNumber: "CN202330067890",
        description: "一种创新的可折叠手机屏幕结构设计。",
        status: "approved",
        type: "design",
        applicationDate: new Date("2023-05-12"),
        publicationDate: new Date("2023-11-12"),
        grantDate: new Date("2023-12-20"),
        technicalField: "电子产品设计",
        keywords: JSON.stringify([
          "可折叠屏幕",
          "手机设计",
          "柔性显示",
          "工业设计",
        ]),
        applicants: JSON.stringify(["华为技术有限公司"]),
        inventors: JSON.stringify(["任正非", "余承东", "何刚"]),
        abstract:
          "本外观设计涉及一种可折叠手机屏幕结构，具有美观实用的外观特征。",
        userId: adminUser.id,
        priority: "high",
      },
    ];

    // 创建专利
    for (const patentData of samplePatents) {
      const patent = await prisma.patent.create({
        data: patentData,
      });
      console.log(`✅ 创建专利: ${patent.title}`);
    }

    console.log("🎉 示例专利数据创建完成！");
  } catch (error) {
    console.error("❌ 创建示例数据失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePatents();
