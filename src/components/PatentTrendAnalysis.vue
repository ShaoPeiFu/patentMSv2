<template>
  <div class="trend-analysis">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>专利趋势分析</h3>
          <div class="header-actions">
            <el-select
              v-model="selectedPeriod"
              @change="updateTrend"
              size="small"
            >
              <el-option label="按月" value="month" />
              <el-option label="按季度" value="quarter" />
              <el-option label="按年" value="year" />
            </el-select>
            <el-button size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <!-- 趋势图表 -->
      <div class="chart-container">
        <div class="chart-wrapper" ref="trendChartRef"></div>
      </div>

      <!-- 关键指标 -->
      <div class="metrics-grid">
        <div
          class="metric-card"
          v-for="metric in trendMetrics"
          :key="metric.key"
        >
          <div class="metric-icon" :class="metric.type">
            <el-icon><component :is="metric.icon" /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-trend" :class="metric.trend">
              <el-icon><component :is="metric.trendIcon" /></el-icon>
              <span>{{ metric.trendValue }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 趋势分析洞察 -->
      <div class="insights-section">
        <h4>趋势洞察</h4>
        <div class="insights-list">
          <div
            class="insight-item"
            v-for="(insight, index) in insights"
            :key="index"
          >
            <el-icon class="insight-icon"><InfoFilled /></el-icon>
            <span>{{ insight }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useAnalyticsStore } from "@/stores/analytics";
import { ElMessage } from "element-plus";
import {
  Refresh,

  InfoFilled,

} from "@element-plus/icons-vue";

// 导入图表库
declare const echarts: any;

const analyticsStore = useAnalyticsStore();

// 响应式数据
const selectedPeriod = ref<"month" | "quarter" | "year">("month");
const trendChartRef = ref<HTMLDivElement>();
const chartInstance = ref<any>(null);

// 计算属性
const trendData = computed(() => {
  return analyticsStore.generatePatentTrend(selectedPeriod.value);
});

const trendMetrics = computed(() => {
  const data = trendData.value;
  return [
    {
      key: "applications",
      icon: "DocumentAdd",
      label: "申请量增长",
      value: `+${data.growth.applications}%`,
      type: "applications",
      trend: data.growth.applications > 0 ? "up" : "down",
      trendIcon: data.growth.applications > 0 ? "ArrowUp" : "ArrowDown",
      trendValue: Math.abs(data.growth.applications),
    },
    {
      key: "approvals",
      icon: "SuccessFilled",
      label: "授权量增长",
      value: `+${data.growth.approvals}%`,
      type: "approvals",
      trend: data.growth.approvals > 0 ? "up" : "down",
      trendIcon: data.growth.approvals > 0 ? "ArrowUp" : "ArrowDown",
      trendValue: Math.abs(data.growth.approvals),
    },
    {
      key: "rejections",
      icon: "WarningFilled",
      label: "拒绝量变化",
      value: `${data.growth.rejections}%`,
      type: "rejections",
      trend: data.growth.rejections < 0 ? "up" : "down",
      trendIcon: data.growth.rejections < 0 ? "ArrowUp" : "ArrowDown",
      trendValue: Math.abs(data.growth.rejections),
    },
  ];
});

const insights = computed(() => {
  const data = trendData.value;
  const insights = [];

  if (data.growth.applications > 10) {
    insights.push("专利申请量呈现强劲增长趋势，表明研发活动活跃");
  } else if (data.growth.applications < 0) {
    insights.push("专利申请量出现下降，建议加强技术创新投入");
  }

  if (data.growth.approvals > data.growth.applications) {
    insights.push("专利授权效率提升，审查周期可能缩短");
  }

  if (data.growth.rejections < -10) {
    insights.push("专利拒绝率显著下降，申请质量明显提升");
  }

  if (selectedPeriod.value === "month") {
    insights.push("建议关注季节性波动，制定相应的申请策略");
  }

  if (insights.length === 0) {
    insights.push("趋势相对平稳，建议保持当前申请节奏");
  }

  return insights;
});

// 方法
const initChart = () => {
  if (!trendChartRef.value || typeof echarts === "undefined") return;

  chartInstance.value = echarts.init(trendChartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chartInstance.value) return;

  const data = trendData.value;
  const labels = data.applications.map((item) => item.label);

  const option = {
    title: {
      text: "专利申请趋势",
      left: "left",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      formatter: function (params: any) {
        let content = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          content += `
            <div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
              <span style="flex: 1;">${param.seriesName}</span>
              <span style="font-weight: bold;">${param.value}</span>
            </div>
          `;
        });
        return content;
      },
    },
    legend: {
      top: 30,
      data: ["申请量", "授权量", "拒绝量"],
    },
    grid: {
      top: 80,
      left: 50,
      right: 30,
      bottom: 50,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        rotate: 0,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}",
      },
    },
    series: [
      {
        name: "申请量",
        type: "line",
        data: data.applications.map((item) => item.value),
        smooth: true,
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          color: "#409EFF",
        },
        areaStyle: {
          opacity: 0.1,
          color: "#409EFF",
        },
      },
      {
        name: "授权量",
        type: "line",
        data: data.approvals.map((item) => item.value),
        smooth: true,
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          color: "#67C23A",
        },
        areaStyle: {
          opacity: 0.1,
          color: "#67C23A",
        },
      },
      {
        name: "拒绝量",
        type: "line",
        data: data.rejections.map((item) => item.value),
        smooth: true,
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          color: "#F56C6C",
        },
        areaStyle: {
          opacity: 0.1,
          color: "#F56C6C",
        },
      },
    ],
  };

  chartInstance.value.setOption(option);
};

const updateTrend = () => {
  nextTick(() => {
    updateChart();
  });
};

const refreshData = () => {
  updateChart();
  ElMessage.success("趋势数据已刷新");
};

const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  }
};

// 生命周期
onMounted(async () => {
  // 动态加载 ECharts
  if (typeof echarts === "undefined") {
    try {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js";
      script.onload = () => {
        initChart();
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error("加载 ECharts 失败:", error);
      ElMessage.error("图表组件加载失败");
    }
  } else {
    initChart();
  }

  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.trend-analysis {
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

.chart-container {
  margin: 20px 0;
}

.chart-wrapper {
  width: 100%;
  height: 400px;
  min-height: 300px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.metric-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.metric-icon.applications {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.metric-icon.approvals {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.metric-icon.rejections {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}

.metric-trend.up {
  color: #67c23a;
}

.metric-trend.down {
  color: #f56c6c;
}

.insights-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.insights-section h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
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
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.insight-icon {
  color: #409eff;
  margin-top: 2px;
  flex-shrink: 0;
}

.insight-item span {
  color: #555;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    height: 300px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
