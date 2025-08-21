import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import type {
  AnalyticsReport,
  PatentTrend,
  TechFieldDistribution,
  CompetitorAnalysis,
  ROIAnalysis,
  AnalyticsConfig,
  KPIMetric,
  ForecastData,
  TrendData,
  TechFieldData,
  CompetitorData,
  ROIData,
  PatentValue,
} from "@/types/analytics";
import { usePatentStore } from "./patent";

export const useAnalyticsStore = defineStore("analytics", () => {
  // 响应式状态
  const currentReport = ref<AnalyticsReport | null>(null);
  const reports = ref<AnalyticsReport[]>([]);
  const loading = ref(false);
  const config = reactive<AnalyticsConfig>({
    timeRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
    granularity: "monthly",
    includeCompetitors: true,
    competitorList: [
      "华为技术",
      "腾讯科技",
      "阿里巴巴",
      "百度在线",
      "京东科技",
    ],
    techFieldCategories: [
      "人工智能",
      "大数据",
      "云计算",
      "物联网",
      "区块链",
      "5G通信",
      "自动驾驶",
      "生物技术",
    ],
    roiCalculationMethod: "npv",
    confidenceLevel: 0.95,
  });

  // 计算属性
  const kpiMetrics = computed((): KPIMetric[] => {
    const patentStore = usePatentStore();
    const stats = patentStore.statistics;

    return [
      {
        name: "专利总数",
        value: stats.total,
        unit: "件",
        trend: "up",
        trendValue: 12.5,
        target: stats.total * 1.2,
        status: "good",
        description: "当前专利组合总数量",
      },
      {
        name: "审批成功率",
        value: Math.round((stats.byStatus.approved / stats.total) * 100),
        unit: "%",
        trend: "up",
        trendValue: 5.2,
        target: 85,
        status: "good",
        description: "专利申请审批通过率",
      },
      {
        name: "平均处理时间",
        value: 126,
        unit: "天",
        trend: "down",
        trendValue: -8.3,
        target: 120,
        status: "good",
        description: "专利申请平均处理周期",
      },
      {
        name: "组合价值",
        value: "2.8",
        unit: "亿元",
        trend: "up",
        trendValue: 15.7,
        target: 3.5,
        status: "good",
        description: "专利组合估算总价值",
      },
      {
        name: "维护成本",
        value: 156,
        unit: "万元",
        trend: "up",
        trendValue: 3.2,
        target: 200,
        status: "warning",
        description: "年度专利维护总成本",
      },
      {
        name: "ROI",
        value: 245,
        unit: "%",
        trend: "up",
        trendValue: 18.9,
        target: 200,
        status: "good",
        description: "专利投资回报率",
      },
    ];
  });

  // 数据持久化
  const saveToStorage = () => {
    try {
      localStorage.setItem("analytics_reports", JSON.stringify(reports.value));
      localStorage.setItem("analytics_config", JSON.stringify(config));
    } catch (error) {
      console.error("保存分析数据失败:", error);
    }
  };

  const loadFromStorage = () => {
    try {
      const savedReports = localStorage.getItem("analytics_reports");
      const savedConfig = localStorage.getItem("analytics_config");

      if (savedReports) {
        reports.value = JSON.parse(savedReports);
      }

      if (savedConfig) {
        Object.assign(config, JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error("加载分析数据失败:", error);
    }
  };

  // 生成专利趋势分析
  const generatePatentTrend = (
    period: "month" | "quarter" | "year" = "month"
  ): PatentTrend => {
    // 根据时间范围生成趋势数据
    const now = new Date();
    const timeUnits = period === "year" ? 5 : period === "quarter" ? 8 : 12;
    const applications: TrendData[] = [];
    const approvals: TrendData[] = [];
    const rejections: TrendData[] = [];

    for (let i = timeUnits - 1; i >= 0; i--) {
      let date: Date;
      let label: string;

      if (period === "year") {
        date = new Date(now.getFullYear() - i, 0, 1);
        label = date.getFullYear().toString();
      } else if (period === "quarter") {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        date = new Date(now.getFullYear(), quarterStart - i * 3, 1);
        label = `${date.getFullYear()}Q${Math.floor(date.getMonth() / 3) + 1}`;
      } else {
        date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      }

      // 模拟数据（实际应用中应从真实数据计算）
      const baseValue = 50 + Math.random() * 30;
      const appCount = Math.floor(baseValue + Math.sin(i * 0.5) * 10);
      const appCount2 = Math.floor(baseValue * 0.8 + Math.sin(i * 0.3) * 8);
      const rejCount = Math.floor(baseValue * 0.2 + Math.sin(i * 0.7) * 3);

      applications.push({
        date: date.toISOString().split("T")[0],
        value: appCount,
        type: "applications",
        label,
      });

      approvals.push({
        date: date.toISOString().split("T")[0],
        value: appCount2,
        type: "approvals",
        label,
      });

      rejections.push({
        date: date.toISOString().split("T")[0],
        value: rejCount,
        type: "rejections",
        label,
      });
    }

    return {
      period,
      applications,
      approvals,
      rejections,
      growth: {
        applications: 12.5,
        approvals: 8.3,
        rejections: -15.2,
      },
    };
  };

  // 生成技术领域分布分析
  const generateTechFieldDistribution = (): TechFieldDistribution => {
    const techFields: TechFieldData[] = [
      {
        field: "人工智能",
        count: 156,
        percentage: 28.5,
        trend: "up",
        avgProcessingTime: 118,
        successRate: 89.2,
      },
      {
        field: "大数据",
        count: 98,
        percentage: 17.9,
        trend: "up",
        avgProcessingTime: 132,
        successRate: 84.7,
      },
      {
        field: "云计算",
        count: 87,
        percentage: 15.9,
        trend: "stable",
        avgProcessingTime: 125,
        successRate: 91.3,
      },
      {
        field: "物联网",
        count: 76,
        percentage: 13.9,
        trend: "up",
        avgProcessingTime: 140,
        successRate: 86.1,
      },
      {
        field: "区块链",
        count: 45,
        percentage: 8.2,
        trend: "down",
        avgProcessingTime: 156,
        successRate: 78.9,
      },
      {
        field: "5G通信",
        count: 32,
        percentage: 5.8,
        trend: "up",
        avgProcessingTime: 145,
        successRate: 88.6,
      },
      {
        field: "自动驾驶",
        count: 28,
        percentage: 5.1,
        trend: "up",
        avgProcessingTime: 162,
        successRate: 82.4,
      },
      {
        field: "生物技术",
        count: 25,
        percentage: 4.6,
        trend: "stable",
        avgProcessingTime: 178,
        successRate: 79.2,
      },
    ];

    const totalPatents = techFields.reduce(
      (sum, field) => sum + field.count,
      0
    );

    return {
      fields: techFields,
      totalPatents,
      topFields: ["人工智能", "大数据", "云计算"],
      emergingFields: ["自动驾驶", "5G通信", "生物技术"],
    };
  };

  // 生成竞争对手分析
  const generateCompetitorAnalysis = (): CompetitorAnalysis => {
    const competitors: CompetitorData[] = [
      {
        name: "华为技术",
        patentCount: 4856,
        marketShare: 22.5,
        avgQuality: 8.9,
        recentActivity: 145,
        techFocus: ["5G通信", "人工智能", "云计算"],
        strengths: ["技术创新能力强", "专利布局全面", "国际化程度高"],
        weaknesses: ["成本控制有待提升", "部分领域竞争激烈"],
      },
      {
        name: "腾讯科技",
        patentCount: 3245,
        marketShare: 15.8,
        avgQuality: 8.4,
        recentActivity: 98,
        techFocus: ["大数据", "人工智能", "游戏技术"],
        strengths: ["用户体验优秀", "生态系统完善"],
        weaknesses: ["硬件技术相对薄弱", "国际市场拓展缓慢"],
      },
      {
        name: "阿里巴巴",
        patentCount: 2987,
        marketShare: 14.2,
        avgQuality: 8.2,
        recentActivity: 87,
        techFocus: ["云计算", "电商技术", "金融科技"],
        strengths: ["商业模式创新", "云服务领先"],
        weaknesses: ["移动端产品相对薄弱"],
      },
      {
        name: "百度在线",
        patentCount: 2156,
        marketShare: 10.9,
        avgQuality: 7.8,
        recentActivity: 76,
        techFocus: ["人工智能", "自动驾驶", "搜索技术"],
        strengths: ["AI技术领先", "搜索算法优秀"],
        weaknesses: ["商业化能力有限", "移动生态薄弱"],
      },
      {
        name: "京东科技",
        patentCount: 1567,
        marketShare: 7.3,
        avgQuality: 7.5,
        recentActivity: 54,
        techFocus: ["物流技术", "电商平台", "供应链"],
        strengths: ["物流体系完善", "供应链管理优秀"],
        weaknesses: ["技术创新相对滞后", "国际化程度低"],
      },
    ];

    return {
      competitors,
      marketPosition: {
        rank: 6,
        percentile: 75,
        category: "challenger",
      },
      competitiveGaps: [
        "5G通信技术专利布局不足",
        "国际专利申请比例偏低",
        "硬件相关专利较少",
      ],
      opportunities: [
        "边缘计算领域潜力巨大",
        "工业互联网刚起步",
        "绿色技术政策支持",
      ],
      threats: ["技术迭代加速", "国际贸易摩擦", "人才竞争激烈"],
    };
  };

  // 生成ROI投资回报分析
  const generateROIAnalysis = (): ROIAnalysis => {
    const yearlyData: ROIData[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const investment = 800000 + Math.random() * 200000;
      const revenue = investment * (1.5 + Math.random() * 0.8);
      const costs = investment * 0.3;
      const patents = Math.floor(30 + Math.random() * 20);
      const roi = ((revenue - costs) / investment) * 100;

      yearlyData.push({
        year,
        investment: Math.round(investment),
        revenue: Math.round(revenue),
        costs: Math.round(costs),
        patents,
        roi: Math.round(roi * 10) / 10,
        cumulative:
          yearlyData.length > 0
            ? yearlyData[yearlyData.length - 1].cumulative + (revenue - costs)
            : revenue - costs,
      });
    }

    const topPatents: PatentValue[] = [
      {
        patentId: 1,
        title: "AI智能推荐算法优化方法",
        estimatedValue: 8500000,
        revenue: 2100000,
        maintenanceCosts: 45000,
        licensingIncome: 1800000,
        litigationCosts: 0,
        netValue: 7955000,
      },
      {
        patentId: 2,
        title: "分布式云存储安全机制",
        estimatedValue: 6200000,
        revenue: 1560000,
        maintenanceCosts: 38000,
        licensingIncome: 980000,
        litigationCosts: 120000,
        netValue: 5682000,
      },
      {
        patentId: 3,
        title: "物联网设备认证协议",
        estimatedValue: 4800000,
        revenue: 1200000,
        maintenanceCosts: 32000,
        licensingIncome: 750000,
        litigationCosts: 0,
        netValue: 4568000,
      },
    ];

    const totalInvestment = yearlyData.reduce(
      (sum, data) => sum + data.investment,
      0
    );
    const totalRevenue = yearlyData.reduce(
      (sum, data) => sum + data.revenue,
      0
    );
    const totalROI = ((totalRevenue - totalInvestment) / totalInvestment) * 100;

    return {
      totalInvestment,
      totalRevenue,
      totalROI: Math.round(totalROI * 10) / 10,
      yearlyData,
      topPatents,
      portfolioValue: topPatents.reduce(
        (sum, patent) => sum + patent.estimatedValue,
        0
      ),
      riskAssessment: {
        level: "medium",
        factors: ["技术更新迭代快", "市场竞争激烈", "法律环境变化"],
        recommendations: [
          "加强核心技术专利布局",
          "建立专利预警机制",
          "制定专利组合优化策略",
        ],
      },
    };
  };

  // 生成预测数据
  const generateForecast = (metric: string): ForecastData => {
    const historical = Array.from(
      { length: 12 },
      (_, i) => 50 + Math.sin(i * 0.5) * 10 + Math.random() * 5
    );

    const predicted = Array.from(
      { length: 6 },
      () => historical[historical.length - 1] * (1.05 + Math.random() * 0.1)
    );

    const confidence = predicted.map(() => 0.85 + Math.random() * 0.1);

    return {
      metric,
      historical,
      predicted,
      confidence,
      accuracy: 0.78,
      method: "ARIMA",
    };
  };

  // 生成完整分析报告
  const generateReport = async (
    title: string = "专利分析报告"
  ): Promise<AnalyticsReport> => {
    loading.value = true;

    try {
      const patentStore = usePatentStore();
      const stats = patentStore.statistics;

      const report: AnalyticsReport = {
        id: Date.now().toString(),
        title,
        generatedAt: new Date().toISOString(),
        period: {
          start: config.timeRange.start,
          end: config.timeRange.end,
        },
        summary: {
          totalPatents: stats.total,
          totalValue: 28000000,
          avgROI: 245.6,
          topTechField: "人工智能",
          marketPosition: "挑战者",
        },
        trends: generatePatentTrend(
          config.granularity === "yearly" ? "year" : "month"
        ),
        techFields: generateTechFieldDistribution(),
        competitors: generateCompetitorAnalysis(),
        roi: generateROIAnalysis(),
        insights: [
          "人工智能领域专利申请量持续增长，占总申请量的28.5%",
          "专利审批成功率达到87.2%，高于行业平均水平",
          "云计算领域专利质量较高，平均处理时间最短",
          "与主要竞争对手相比，在5G通信领域存在技术差距",
          "ROI投资回报率持续提升，达到245.6%",
        ],
        recommendations: [
          "加强5G通信技术专利布局，缩小与领先企业的差距",
          "提高国际专利申请比例，增强全球竞争力",
          "优化专利组合结构，淘汰低价值专利",
          "建立专利预警机制，及时识别侵权风险",
          "加大新兴技术领域的研发投入和专利申请",
        ],
      };

      reports.value.unshift(report);
      currentReport.value = report;
      saveToStorage();

      return report;
    } finally {
      loading.value = false;
    }
  };

  // 更新配置
  const updateConfig = (newConfig: Partial<AnalyticsConfig>) => {
    Object.assign(config, newConfig);
    saveToStorage();
  };

  // 删除报告
  const deleteReport = (reportId: string) => {
    const index = reports.value.findIndex((r) => r.id === reportId);
    if (index !== -1) {
      reports.value.splice(index, 1);
      if (currentReport.value?.id === reportId) {
        currentReport.value = null;
      }
      saveToStorage();
    }
  };

  // 获取报告
  const getReport = (reportId: string) => {
    return reports.value.find((r) => r.id === reportId) || null;
  };

  // 导出报告
  const exportReport = (
    report: AnalyticsReport,
    format: "json" | "csv" | "pdf" = "json"
  ) => {
    const filename = `${report.title}_${
      report.generatedAt.split("T")[0]
    }.${format}`;

    if (format === "json") {
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    // 其他格式的导出可以后续实现
  };

  // 初始化
  loadFromStorage();

  return {
    // 状态
    reports,
    currentReport,
    loading,
    config,

    // 计算属性
    kpiMetrics,

    // 方法
    generateReport,
    generatePatentTrend,
    generateTechFieldDistribution,
    generateCompetitorAnalysis,
    generateROIAnalysis,
    generateForecast,
    updateConfig,
    deleteReport,
    getReport,
    exportReport,
    saveToStorage,
    loadFromStorage,
  };
});
