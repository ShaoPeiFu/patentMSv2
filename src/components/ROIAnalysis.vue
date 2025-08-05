<template>
  <div class="roi-analysis">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>ROI投资回报分析</h3>
          <div class="header-actions">
            <el-select
              v-model="selectedMethod"
              @change="updateAnalysis"
              size="small"
            >
              <el-option label="净现值(NPV)" value="npv" />
              <el-option label="内部收益率(IRR)" value="irr" />
              <el-option label="简单ROI" value="simple" />
            </el-select>
            <el-button size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <!-- 核心指标概览 -->
      <div class="roi-overview">
        <div class="overview-grid">
          <div class="metric-card total-investment">
            <div class="metric-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">
                ¥{{ formatCurrency(roiData.totalInvestment) }}
              </div>
              <div class="metric-label">总投资</div>
              <div class="metric-period">过去5年</div>
            </div>
          </div>

          <div class="metric-card total-revenue">
            <div class="metric-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">
                ¥{{ formatCurrency(roiData.totalRevenue) }}
              </div>
              <div class="metric-label">总收益</div>
              <div class="metric-period">累计收入</div>
            </div>
          </div>

          <div class="metric-card total-roi">
            <div class="metric-icon">
              <el-icon><TrophyBase /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ roiData.totalROI }}%</div>
              <div class="metric-label">总ROI</div>
              <div class="metric-trend positive">
                <el-icon><ArrowUp /></el-icon>
                <span>+18.9%</span>
              </div>
            </div>
          </div>

          <div class="metric-card portfolio-value">
            <div class="metric-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">
                ¥{{ formatCurrency(roiData.portfolioValue) }}
              </div>
              <div class="metric-label">组合价值</div>
              <div class="metric-period">当前估值</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ROI趋势图表 -->
      <div class="roi-charts">
        <div class="chart-section">
          <h4>投资回报趋势</h4>
          <div class="chart-wrapper" ref="roiTrendChartRef"></div>
        </div>

        <div class="chart-section">
          <h4>投资收益构成</h4>
          <div class="chart-wrapper" ref="revenueCompositionRef"></div>
        </div>
      </div>

      <!-- 年度数据表格 -->
      <div class="yearly-data">
        <h4>年度投资回报详情</h4>
        <el-table :data="roiData.yearlyData" stripe>
          <el-table-column prop="year" label="年份" width="80" />
          <el-table-column prop="investment" label="投资金额" width="120">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.investment) }}
            </template>
          </el-table-column>
          <el-table-column prop="revenue" label="收入" width="120">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.revenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="costs" label="成本" width="120">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.costs) }}
            </template>
          </el-table-column>
          <el-table-column prop="patents" label="专利数量" width="100" />
          <el-table-column prop="roi" label="ROI" width="100">
            <template #default="{ row }">
              <el-tag :type="getROIType(row.roi)">{{ row.roi }}%</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cumulative" label="累计净收益" width="140">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.cumulative) }}
            </template>
          </el-table-column>
          <el-table-column label="趋势" width="80">
            <template #default="{ row, $index }">
              <el-icon
                v-if="$index > 0"
                :class="
                  getTrendClass(row.roi, roiData.yearlyData[$index - 1].roi)
                "
              >
                <component
                  :is="
                    getTrendIcon(row.roi, roiData.yearlyData[$index - 1].roi)
                  "
                />
              </el-icon>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 高价值专利排行 -->
      <div class="top-patents">
        <h4>高价值专利TOP排行</h4>
        <div class="patents-grid">
          <div
            v-for="(patent, index) in roiData.topPatents"
            :key="patent.patentId"
            class="patent-card"
          >
            <div class="patent-rank">
              <span class="rank-number">{{ index + 1 }}</span>
              <el-icon v-if="index < 3" class="rank-icon">
                <component :is="getRankIcon(index)" />
              </el-icon>
            </div>

            <div class="patent-info">
              <h5>{{ patent.title }}</h5>
              <div class="patent-metrics">
                <div class="metric-item">
                  <span class="label">估算价值:</span>
                  <span class="value"
                    >¥{{ formatCurrency(patent.estimatedValue) }}</span
                  >
                </div>
                <div class="metric-item">
                  <span class="label">累计收入:</span>
                  <span class="value"
                    >¥{{ formatCurrency(patent.revenue) }}</span
                  >
                </div>
                <div class="metric-item">
                  <span class="label">许可收入:</span>
                  <span class="value"
                    >¥{{ formatCurrency(patent.licensingIncome) }}</span
                  >
                </div>
                <div class="metric-item">
                  <span class="label">净价值:</span>
                  <span class="value highlight"
                    >¥{{ formatCurrency(patent.netValue) }}</span
                  >
                </div>
              </div>
            </div>

            <div class="patent-actions">
              <el-button
                size="small"
                @click="viewPatentDetail(patent.patentId)"
              >
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险评估 -->
      <div class="risk-assessment">
        <h4>投资风险评估</h4>
        <div class="risk-content">
          <div class="risk-level">
            <div class="risk-indicator" :class="roiData.riskAssessment.level">
              <div class="risk-circle">
                <span>{{
                  getRiskLevelText(roiData.riskAssessment.level)
                }}</span>
              </div>
            </div>
            <div class="risk-description">
              <h5>
                风险等级: {{ getRiskLevelText(roiData.riskAssessment.level) }}
              </h5>
              <p>
                当前专利组合投资风险处于{{
                  getRiskLevelText(roiData.riskAssessment.level)
                }}水平
              </p>
            </div>
          </div>

          <div class="risk-factors">
            <div class="factors-section">
              <h5>
                <el-icon><WarningFilled /></el-icon>
                风险因素
              </h5>
              <ul class="factors-list">
                <li
                  v-for="factor in roiData.riskAssessment.factors"
                  :key="factor"
                >
                  {{ factor }}
                </li>
              </ul>
            </div>

            <div class="recommendations-section">
              <h5>
                <el-icon><InfoFilled /></el-icon>
                建议措施
              </h5>
              <ul class="recommendations-list">
                <li
                  v-for="recommendation in roiData.riskAssessment
                    .recommendations"
                  :key="recommendation"
                >
                  {{ recommendation }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 预测分析 -->
      <div class="forecast-section">
        <h4>未来投资回报预测</h4>
        <div class="forecast-content">
          <div class="forecast-chart">
            <div class="chart-wrapper" ref="forecastChartRef"></div>
          </div>
          <div class="forecast-insights">
            <h5>预测洞察</h5>
            <div class="insights-list">
              <div class="insight-item">
                <el-icon><TrendCharts /></el-icon>
                <span>预计未来3年ROI将保持15-20%增长</span>
              </div>
              <div class="insight-item">
                <el-icon><Star /></el-icon>
                <span>核心技术专利将在明年进入收获期</span>
              </div>
              <div class="insight-item">
                <el-icon><Warning /></el-icon>
                <span>建议优化低价值专利，减少维护成本</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { useAnalyticsStore } from "@/stores/analytics";
import { ElMessage } from "element-plus";
import {
  Refresh,
  Wallet,
  TrendCharts,
  Star,
  ArrowUp,
  WarningFilled,
  InfoFilled,
  Warning,
} from "@element-plus/icons-vue";

// 补充缺失的图标
const TrophyBase = Star; // 使用 Star 作为奖杯的替代

// 导入图表库
declare const echarts: any;

const analyticsStore = useAnalyticsStore();

// 响应式数据
const selectedMethod = ref<"npv" | "irr" | "simple">("npv");
const roiTrendChartRef = ref<HTMLDivElement>();
const revenueCompositionRef = ref<HTMLDivElement>();
const forecastChartRef = ref<HTMLDivElement>();
const roiTrendChartInstance = ref<any>(null);
const revenueCompositionInstance = ref<any>(null);
const forecastChartInstance = ref<any>(null);

// 计算属性
const roiData = computed(() => {
  return analyticsStore.generateROIAnalysis();
});

// 方法
const formatCurrency = (value: number) => {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(1) + "亿";
  } else if (value >= 10000) {
    return (value / 10000).toFixed(0) + "万";
  } else {
    return value.toLocaleString();
  }
};

const getROIType = (roi: number) => {
  if (roi >= 20) return "success";
  if (roi >= 10) return "warning";
  if (roi >= 0) return "info";
  return "danger";
};

const getTrendClass = (current: number, previous: number) => {
  if (current > previous) return "trend-up";
  if (current < previous) return "trend-down";
  return "trend-stable";
};

const getTrendIcon = (current: number, previous: number) => {
  if (current > previous) return "ArrowUp";
  if (current < previous) return "ArrowDown";
  return "Minus";
};

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return "Star";
    case 1:
      return "Star";
    case 2:
      return "TrendCharts";
    default:
      return "Star";
  }
};

const getRiskLevelText = (level: string) => {
  const texts: Record<string, string> = {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
  };
  return texts[level] || level;
};

const initCharts = () => {
  if (typeof echarts === "undefined") return;

  // 确保数据已经生成
  if (
    !roiData.value ||
    !roiData.value.yearlyData ||
    roiData.value.yearlyData.length === 0
  ) {
    console.log("ROI data not ready, generating...");
    analyticsStore.generateROIAnalysis();
    // 延迟重新初始化
    setTimeout(() => {
      initCharts();
    }, 100);
    return;
  }

  // 检查容器是否可用且有尺寸
  if (
    roiTrendChartRef.value &&
    revenueCompositionRef.value &&
    forecastChartRef.value
  ) {
    // 检查元素是否有尺寸
    const trendRect = roiTrendChartRef.value.getBoundingClientRect();
    const compositionRect = revenueCompositionRef.value.getBoundingClientRect();
    const forecastRect = forecastChartRef.value.getBoundingClientRect();

    if (
      trendRect.width > 0 &&
      trendRect.height > 0 &&
      compositionRect.width > 0 &&
      compositionRect.height > 0 &&
      forecastRect.width > 0 &&
      forecastRect.height > 0
    ) {
      console.log(
        "Initializing ROI charts with data length:",
        roiData.value.yearlyData.length
      );
      initROITrendChart();
      initRevenueCompositionChart();
      initForecastChart();
    } else {
      console.warn("Chart containers not properly sized, retrying...");
      setTimeout(() => initCharts(), 100);
    }
  } else {
    console.warn("Chart refs not available, retrying...");
    setTimeout(() => initCharts(), 100);
  }
};

const initROITrendChart = () => {
  if (!roiTrendChartRef.value) {
    setTimeout(() => {
      if (roiTrendChartRef.value) {
        initROITrendChart();
      }
    }, 100);
    return;
  }

  // 检查容器尺寸
  const rect = roiTrendChartRef.value.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn("ROI trend chart container not sized, retrying...");
    setTimeout(() => {
      initROITrendChart();
    }, 100);
    return;
  }

  // 检查数据是否完整
  const data = roiData.value.yearlyData;
  if (!data || data.length === 0) {
    console.log("ROI data not ready, retrying...");
    setTimeout(() => {
      initROITrendChart();
    }, 100);
    return;
  }

  // 确保数据包含多个年份
  if (data.length < 2) {
    console.log("ROI data incomplete, retrying...");
    setTimeout(() => {
      initROITrendChart();
    }, 100);
    return;
  }

  if (roiTrendChartInstance.value) {
    roiTrendChartInstance.value.dispose();
  }

  roiTrendChartInstance.value = echarts.init(roiTrendChartRef.value);

  const years = data.map((item) => item.year.toString());
  const investments = data.map((item) => item.investment / 10000); // 转换为万元
  const revenues = data.map((item) => item.revenue / 10000);
  const rois = data.map((item) => item.roi);

  console.log("ROI chart data:", { years, investments, revenues, rois });

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      backgroundColor: "rgba(50, 50, 50, 0.9)",
      borderColor: "#333",
      textStyle: {
        color: "#fff",
      },
    },
    legend: {
      data: ["投资", "收益", "ROI"],
      textStyle: {
        fontSize: 12,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: years,
      axisLine: {
        lineStyle: {
          color: "#ddd",
        },
      },
      axisLabel: {
        color: "#666",
      },
    },
    yAxis: [
      {
        type: "value",
        name: "金额(万元)",
        position: "left",
        axisLine: {
          lineStyle: {
            color: "#ddd",
          },
        },
        axisLabel: {
          color: "#666",
        },
        splitLine: {
          lineStyle: {
            color: "#f0f0f0",
          },
        },
      },
      {
        type: "value",
        name: "ROI(%)",
        position: "right",
        axisLine: {
          lineStyle: {
            color: "#ddd",
          },
        },
        axisLabel: {
          color: "#666",
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: "投资",
        type: "bar",
        data: investments,
        itemStyle: {
          color: "#F56C6C",
        },
        animation: true,
        animationDuration: 1000,
      },
      {
        name: "收益",
        type: "bar",
        data: revenues,
        itemStyle: {
          color: "#67C23A",
        },
        animation: true,
        animationDuration: 1000,
      },
      {
        name: "ROI",
        type: "line",
        yAxisIndex: 1,
        data: rois,
        lineStyle: {
          color: "#409EFF",
          width: 3,
        },
        itemStyle: {
          color: "#409EFF",
        },
        animation: true,
        animationDuration: 1000,
        smooth: true,
      },
    ],
  };

  roiTrendChartInstance.value.setOption(option);
  console.log("ROI trend chart initialized with data length:", data.length);
};

const initRevenueCompositionChart = () => {
  if (!revenueCompositionRef.value) {
    setTimeout(() => {
      if (revenueCompositionRef.value) {
        initRevenueCompositionChart();
      }
    }, 100);
    return;
  }

  // 检查容器尺寸
  const rect = revenueCompositionRef.value.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn("Revenue composition chart container not sized, retrying...");
    setTimeout(() => {
      initRevenueCompositionChart();
    }, 100);
    return;
  }

  // 检查数据是否完整
  const patents = roiData.value.topPatents;
  if (!patents || patents.length === 0) {
    console.log("ROI patents data not ready, retrying...");
    setTimeout(() => {
      initRevenueCompositionChart();
    }, 100);
    return;
  }

  if (revenueCompositionInstance.value) {
    revenueCompositionInstance.value.dispose();
  }

  revenueCompositionInstance.value = echarts.init(revenueCompositionRef.value);

  const totalRevenue = patents.reduce((sum, p) => sum + p.revenue, 0);

  const data = patents.map((patent, index) => ({
    name:
      patent.title.length > 20
        ? patent.title.substring(0, 20) + "..."
        : patent.title,
    value: patent.revenue,
    percentage: ((patent.revenue / totalRevenue) * 100).toFixed(1),
    itemStyle: {
      color: getPatentColor(index),
    },
  }));

  console.log("Revenue composition data:", data);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: function (params: any) {
        return `${params.name}<br/>收入: ¥${formatCurrency(
          params.value
        )}<br/>占比: ${params.data.percentage}%`;
      },
    },
    legend: {
      type: "scroll",
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        name: "收益构成",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  revenueCompositionInstance.value.setOption(option);
  console.log(
    "Revenue composition chart initialized with data length:",
    patents.length
  );
};

const initForecastChart = () => {
  if (!forecastChartRef.value) {
    setTimeout(() => {
      if (forecastChartRef.value) {
        initForecastChart();
      }
    }, 100);
    return;
  }

  // 检查容器尺寸
  const rect = forecastChartRef.value.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn("Forecast chart container not sized, retrying...");
    setTimeout(() => {
      initForecastChart();
    }, 100);
    return;
  }

  // 检查数据是否完整
  const data = roiData.value.yearlyData;
  if (!data || data.length === 0) {
    console.log("ROI forecast data not ready, retrying...");
    setTimeout(() => {
      initForecastChart();
    }, 100);
    return;
  }

  if (forecastChartInstance.value) {
    forecastChartInstance.value.dispose();
  }

  forecastChartInstance.value = echarts.init(forecastChartRef.value);

  const currentYear = new Date().getFullYear();
  const historicalYears = Array.from(
    { length: 5 },
    (_, i) => currentYear - 4 + i
  );
  const forecastYears = Array.from(
    { length: 3 },
    (_, i) => currentYear + 1 + i
  );

  const historicalROI = data.map((item) => item.roi);
  const forecastROI = [
    historicalROI[historicalROI.length - 1] * 1.08,
    historicalROI[historicalROI.length - 1] * 1.15,
    historicalROI[historicalROI.length - 1] * 1.22,
  ];

  console.log("Forecast chart data:", { historicalROI, forecastROI });

  const option = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["历史ROI", "预测ROI", "置信区间"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [...historicalYears, ...forecastYears].map((y) => y.toString()),
    },
    yAxis: {
      type: "value",
      name: "ROI(%)",
    },
    series: [
      {
        name: "历史ROI",
        type: "line",
        data: [...historicalROI, ...Array(3).fill(null)],
        lineStyle: {
          color: "#409EFF",
          width: 3,
        },
        itemStyle: {
          color: "#409EFF",
        },
      },
      {
        name: "预测ROI",
        type: "line",
        data: [...Array(5).fill(null), ...forecastROI],
        lineStyle: {
          color: "#67C23A",
          width: 3,
          type: "dashed",
        },
        itemStyle: {
          color: "#67C23A",
        },
      },
      {
        name: "置信区间",
        type: "line",
        data: [...Array(5).fill(null), ...forecastROI.map((roi) => roi * 0.9)],
        lineStyle: {
          color: "#E6A23C",
          width: 1,
          opacity: 0.5,
        },
        itemStyle: {
          color: "#E6A23C",
        },
        areaStyle: {
          color: "rgba(230, 162, 60, 0.1)",
        },
      },
    ],
  };

  forecastChartInstance.value.setOption(option);
  console.log("Forecast chart initialized with data length:", data.length);
};

const getPatentColor = (index: number) => {
  const colors = [
    "#409EFF",
    "#67C23A",
    "#E6A23C",
    "#F56C6C",
    "#909399",
    "#FF7F50",
    "#87CEEB",
    "#DDA0DD",
  ];
  return colors[index % colors.length];
};

const viewPatentDetail = (patentId: number) => {
  ElMessage.info(`查看专利 ${patentId} 的详细信息`);
  // 这里可以跳转到专利详情页面
};

const updateAnalysis = () => {
  // 更新分析方法
  analyticsStore.updateConfig({ roiCalculationMethod: selectedMethod.value });

  // 添加延迟确保数据更新和DOM重渲染完成
  setTimeout(() => {
    nextTick(() => {
      initCharts();
    });
  }, 100);
};

const refreshData = () => {
  console.log("Refreshing ROI data...");

  // 强制重新生成数据
  analyticsStore.generateROIAnalysis();

  // 清除现有图表实例
  if (roiTrendChartInstance.value) {
    roiTrendChartInstance.value.dispose();
    roiTrendChartInstance.value = null;
  }
  if (revenueCompositionInstance.value) {
    revenueCompositionInstance.value.dispose();
    revenueCompositionInstance.value = null;
  }
  if (forecastChartInstance.value) {
    forecastChartInstance.value.dispose();
    forecastChartInstance.value = null;
  }

  // 添加延迟确保数据更新完成
  setTimeout(() => {
    nextTick(() => {
      console.log("Reinitializing charts after refresh...");
      initCharts();
      ElMessage.success("ROI数据已刷新");
    });
  }, 200);
};

const handleResize = () => {
  try {
    if (roiTrendChartInstance.value) {
      roiTrendChartInstance.value.resize();
    }
    if (revenueCompositionInstance.value) {
      revenueCompositionInstance.value.resize();
    }
    if (forecastChartInstance.value) {
      forecastChartInstance.value.resize();
    }
  } catch (error) {
    console.warn("Error resizing charts:", error);
  }
};

// 生命周期
onMounted(async () => {
  console.log("ROI Analysis component mounted");

  // 确保ROI数据已经生成
  if (
    !roiData.value ||
    !roiData.value.yearlyData ||
    roiData.value.yearlyData.length === 0
  ) {
    console.log("Generating initial ROI data...");
    analyticsStore.generateROIAnalysis();
  }

  // 强制重新调整大小
  setTimeout(() => {
    if (roiTrendChartInstance.value) {
      roiTrendChartInstance.value.resize();
    }
    if (revenueCompositionInstance.value) {
      revenueCompositionInstance.value.resize();
    }
    if (forecastChartInstance.value) {
      forecastChartInstance.value.resize();
    }
  }, 500);

  // 延迟初始化图表，确保DOM完全准备好
  setTimeout(() => {
    console.log("Delayed chart initialization...");
    initCharts();
  }, 300);

  // 动态加载 ECharts
  if (typeof echarts === "undefined") {
    try {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js";
      script.onload = () => {
        // 多次尝试初始化，直到DOM准备好
        const attemptInit = (retries = 10) => {
          if (retries <= 0) {
            console.error(
              "Failed to initialize ROI charts after multiple attempts"
            );
            return;
          }
          nextTick(() => {
            if (
              roiTrendChartRef.value &&
              revenueCompositionRef.value &&
              forecastChartRef.value
            ) {
              initCharts();
            } else {
              setTimeout(() => attemptInit(retries - 1), 100);
            }
          });
        };
        attemptInit();
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error("加载 ECharts 失败:", error);
      ElMessage.error("图表组件加载失败");
    }
  } else {
    // 多次尝试初始化，直到DOM准备好
    const attemptInit = (retries = 10) => {
      if (retries <= 0) {
        console.error(
          "Failed to initialize ROI charts after multiple attempts"
        );
        return;
      }
      nextTick(() => {
        if (
          roiTrendChartRef.value &&
          revenueCompositionRef.value &&
          forecastChartRef.value
        ) {
          initCharts();
        } else {
          setTimeout(() => attemptInit(retries - 1), 100);
        }
      });
    };
    attemptInit();
  }

  window.addEventListener("resize", handleResize);
});

// 监听方法切换，防止布局跳动
watch(selectedMethod, () => {
  // 延迟更新以确保布局稳定
  setTimeout(() => {
    nextTick(() => {
      initCharts();
    });
  }, 100);
});

// 监听ROI数据变化，确保图表正确更新
watch(
  roiData,
  () => {
    console.log("ROI data changed, reinitializing charts...");
    setTimeout(() => {
      nextTick(() => {
        initCharts();
      });
    }, 100);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (roiTrendChartInstance.value) {
    roiTrendChartInstance.value.dispose();
  }
  if (revenueCompositionInstance.value) {
    revenueCompositionInstance.value.dispose();
  }
  if (forecastChartInstance.value) {
    forecastChartInstance.value.dispose();
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.roi-analysis {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.roi-overview {
  margin: 20px 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.total-investment .metric-icon {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.total-revenue .metric-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.total-roi .metric-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.portfolio-value .metric-icon {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.metric-period {
  font-size: 12px;
  color: #999;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.metric-trend.positive {
  color: #67c23a;
}

.roi-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0;
}

.chart-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.chart-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.chart-wrapper {
  width: 100%;
  height: 300px;
}

.yearly-data {
  margin: 24px 0;
}

.yearly-data h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-stable {
  color: #909399;
}

.top-patents {
  margin: 24px 0;
}

.top-patents h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.patents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  /* 防止布局跳动 */
  align-items: start;
  min-height: 200px;
  transition: all 0.3s ease;
}

.patent-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.3s ease;
  /* 固定卡片高度防止跳动 */
  min-height: 180px;
  position: relative;
}

.patent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.patent-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rank-number {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.rank-icon {
  color: #e6a23c;
  font-size: 20px;
}

.patent-info {
  flex: 1;
}

.patent-info h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
}

.patent-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.metric-item .label {
  color: #666;
}

.metric-item .value {
  font-weight: 600;
  color: #2c3e50;
}

.metric-item .value.highlight {
  color: #409eff;
}

.patent-actions {
  flex-shrink: 0;
}

.risk-assessment {
  margin: 24px 0;
}

.risk-assessment h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.risk-content {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.risk-level {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.risk-indicator {
  flex-shrink: 0;
}

.risk-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 12px;
}

.risk-indicator.low .risk-circle {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.risk-indicator.medium .risk-circle {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.risk-indicator.high .risk-circle {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.risk-description h5 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.risk-description p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.risk-factors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.factors-section h5,
.recommendations-section h5 {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.factors-list,
.recommendations-list {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.factors-list li,
.recommendations-list li {
  color: #555;
  margin-bottom: 8px;
  position: relative;
  line-height: 1.4;
  font-size: 13px;
}

.factors-list li::before {
  content: "⚠";
  position: absolute;
  left: -16px;
  color: #f56c6c;
}

.recommendations-list li::before {
  content: "💡";
  position: absolute;
  left: -16px;
}

.forecast-section {
  margin: 24px 0;
}

.forecast-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.forecast-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.forecast-chart {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.forecast-insights {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.forecast-insights h5 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.insight-item span {
  color: #555;
  line-height: 1.4;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .roi-charts {
    grid-template-columns: 1fr;
  }

  .patents-grid {
    grid-template-columns: 1fr;
  }

  .risk-factors {
    grid-template-columns: 1fr;
  }

  .forecast-content {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
