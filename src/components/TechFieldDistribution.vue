<template>
  <div class="tech-field-distribution">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>技术领域分布</h3>
          <div class="header-actions">
            <el-button-group size="small">
              <el-button
                :type="viewMode === 'chart' ? 'primary' : ''"
                @click="viewMode = 'chart'"
              >
                <el-icon><Operation /></el-icon>
                图表
              </el-button>
              <el-button
                :type="viewMode === 'table' ? 'primary' : ''"
                @click="viewMode = 'table'"
              >
                <el-icon><List /></el-icon>
                列表
              </el-button>
            </el-button-group>
            <el-button size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <!-- 概览指标 -->
      <div class="overview-metrics">
        <div class="metric-item">
          <div class="metric-value">{{ distributionData.totalPatents }}</div>
          <div class="metric-label">总专利数</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ distributionData.fields.length }}</div>
          <div class="metric-label">技术领域</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">
            {{ distributionData.topFields.length }}
          </div>
          <div class="metric-label">主要领域</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">
            {{ distributionData.emergingFields.length }}
          </div>
          <div class="metric-label">新兴领域</div>
        </div>
      </div>

      <!-- 图表视图 -->
      <div v-if="viewMode === 'chart'" class="chart-view">
        <div class="charts-grid">
          <!-- 饼图 -->
          <div class="chart-container">
            <h4>技术领域占比</h4>
            <div class="chart-wrapper" ref="pieChartRef"></div>
          </div>

          <!-- 柱状图 -->
          <div class="chart-container">
            <h4>专利数量排名</h4>
            <div class="chart-wrapper" ref="barChartRef"></div>
          </div>
        </div>

        <!-- 趋势雷达图 -->
        <div class="radar-container">
          <h4>技术领域综合评估</h4>
          <div class="chart-wrapper" ref="radarChartRef"></div>
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <el-table
          :data="distributionData.fields"
          stripe
          :row-class-name="getRowClassName"
          :cell-class-name="getCellClassName"
        >
          <el-table-column prop="field" label="技术领域" width="180">
            <template #default="{ row }">
              <div class="field-name">
                <span
                  class="field-dot"
                  :style="{ backgroundColor: getFieldColor(row.field) }"
                ></span>
                <span class="field-text">{{ row.field }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="count" label="专利数量" width="120" sortable>
            <template #default="{ row }">
              <strong>{{ row.count }}</strong>
            </template>
          </el-table-column>

          <el-table-column prop="percentage" label="占比" width="100" sortable>
            <template #default="{ row }">
              <el-tag size="small">{{ row.percentage }}%</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="trend" label="趋势" width="120">
            <template #default="{ row }">
              <div class="trend-display">
                <el-icon
                  :class="[
                    'trend-icon',
                    row.trend === 'up'
                      ? 'trend-up'
                      : row.trend === 'down'
                      ? 'trend-down'
                      : 'trend-stable',
                  ]"
                >
                  <ArrowUp v-if="row.trend === 'up'" />
                  <ArrowDown v-else-if="row.trend === 'down'" />
                  <Minus v-else />
                </el-icon>
                <span :class="getTrendClass(row.trend)">
                  {{ getTrendText(row.trend) }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="avgProcessingTime"
            label="平均处理时间"
            width="140"
            sortable
          >
            <template #default="{ row }">
              {{ row.avgProcessingTime }} 天
            </template>
          </el-table-column>

          <el-table-column
            prop="successRate"
            label="成功率"
            width="100"
            sortable
          >
            <template #default="{ row }">
              <el-progress
                :percentage="row.successRate"
                :show-text="false"
                :stroke-width="8"
                :color="getSuccessRateColor(row.successRate)"
              />
              <div class="success-rate-text">{{ row.successRate }}%</div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button size="small" @click="viewFieldDetail(row.field)">
                  详情
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 关键洞察 -->
      <div class="insights-section">
        <h4>关键洞察</h4>
        <div class="insights-grid">
          <div class="insight-card top-fields">
            <div class="insight-header">
              <el-icon><Trophy /></el-icon>
              <span>主要技术领域</span>
            </div>
            <div class="insight-content">
              <div
                v-for="field in distributionData.topFields"
                :key="field"
                class="field-tag"
              >
                {{ field }}
              </div>
            </div>
          </div>

          <div class="insight-card emerging-fields">
            <div class="insight-header">
              <el-icon><Lightning /></el-icon>
              <span>新兴技术领域</span>
            </div>
            <div class="insight-content">
              <div
                v-for="field in distributionData.emergingFields"
                :key="field"
                class="field-tag emerging"
              >
                {{ field }}
              </div>
            </div>
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
  Operation,
  List,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Lightning,
} from "@element-plus/icons-vue";

// 导入图表库
declare const echarts: any;

const analyticsStore = useAnalyticsStore();

// 响应式数据
const viewMode = ref<"chart" | "table">("chart");
const pieChartRef = ref<HTMLDivElement>();
const barChartRef = ref<HTMLDivElement>();
const radarChartRef = ref<HTMLDivElement>();
const pieChartInstance = ref<any>(null);
const barChartInstance = ref<any>(null);
const radarChartInstance = ref<any>(null);

// 计算属性
const distributionData = computed(() => {
  return analyticsStore.generateTechFieldDistribution();
});

// 颜色配置
const fieldColors = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#FF7F50",
  "#87CEEB",
  "#DDA0DD",
  "#98FB98",
  "#F0E68C",
  "#FFB6C1",
  "#20B2AA",
];

// 方法
const getFieldColor = (field: string) => {
  const index = distributionData.value.fields.findIndex(
    (f) => f.field === field
  );
  return fieldColors[index % fieldColors.length];
};

const getTrendClass = (trend: string) => {
  switch (trend) {
    case "up":
      return "trend-up";
    case "down":
      return "trend-down";
    default:
      return "trend-stable";
  }
};

const getTrendText = (trend: string) => {
  switch (trend) {
    case "up":
      return "上升";
    case "down":
      return "下降";
    default:
      return "稳定";
  }
};

const getSuccessRateColor = (rate: number) => {
  if (rate >= 90) return "#67C23A";
  if (rate >= 80) return "#E6A23C";
  return "#F56C6C";
};

const getRowClassName = ({
  row: _row,
  rowIndex: _rowIndex,
}: {
  row: any;
  rowIndex: number;
}) => {
  return "table-row-spaced";
};

const getCellClassName = ({ column }: { column: any }) => {
  if (column.property === "trend") {
    return "trend-cell";
  }
  return "";
};

const initCharts = () => {
  if (typeof echarts === "undefined") return;

  initPieChart();
  initBarChart();
  initRadarChart();
};

const initPieChart = () => {
  if (!pieChartRef.value) return;

  pieChartInstance.value = echarts.init(pieChartRef.value);

  const data = distributionData.value.fields.map((field, index) => ({
    name: field.field,
    value: field.count,
    itemStyle: {
      color: fieldColors[index % fieldColors.length],
    },
  }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      type: "scroll",
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        name: "技术领域",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
  };

  pieChartInstance.value.setOption(option);
};

const initBarChart = () => {
  if (!barChartRef.value) return;

  barChartInstance.value = echarts.init(barChartRef.value);

  const data = distributionData.value.fields;
  const categories = data.map((field) => field.field);
  const values = data.map((field) => field.count);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: "category",
      data: categories,
      axisLabel: {
        interval: 0,
        fontSize: 10,
      },
    },
    series: [
      {
        name: "专利数量",
        type: "bar",
        data: values.map((value, index) => ({
          value,
          itemStyle: {
            color: fieldColors[index % fieldColors.length],
          },
        })),
        barWidth: "60%",
      },
    ],
  };

  barChartInstance.value.setOption(option);
};

const initRadarChart = () => {
  if (!radarChartRef.value) return;

  radarChartInstance.value = echarts.init(radarChartRef.value);

  const topFields = distributionData.value.fields.slice(0, 6);

  const indicators = [
    { name: "专利数量", max: Math.max(...topFields.map((f) => f.count)) },
    { name: "市场占比", max: 100 },
    { name: "成功率", max: 100 },
    { name: "处理效率", max: 200 },
    { name: "增长趋势", max: 100 },
    { name: "技术创新", max: 100 },
  ];

  const data = topFields.map((field, index) => ({
    name: field.field,
    value: [
      field.count,
      field.percentage,
      field.successRate,
      200 - field.avgProcessingTime, // 处理效率（时间越短效率越高）
      field.trend === "up" ? 80 : field.trend === "down" ? 30 : 60,
      70 + Math.random() * 30, // 模拟技术创新指数
    ],
    itemStyle: {
      color: fieldColors[index % fieldColors.length],
    },
    areaStyle: {
      opacity: 0.1,
    },
  }));

  const option = {
    tooltip: {
      trigger: "item",
    },
    legend: {
      type: "scroll",
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
    },
    radar: {
      indicator: indicators,
      center: ["50%", "50%"],
      radius: "65%",
    },
    series: [
      {
        name: "技术领域评估",
        type: "radar",
        data: data,
      },
    ],
  };

  radarChartInstance.value.setOption(option);
};

const viewFieldDetail = (field: string) => {
  ElMessage.info(`查看 ${field} 领域详细信息`);
  // 这里可以跳转到详细页面或打开详情对话框
};

const refreshData = () => {
  nextTick(() => {
    if (viewMode.value === "chart") {
      initCharts();
    }
  });
  ElMessage.success("技术领域数据已刷新");
};

const handleResize = () => {
  if (pieChartInstance.value) {
    pieChartInstance.value.resize();
  }
  if (barChartInstance.value) {
    barChartInstance.value.resize();
  }
  if (radarChartInstance.value) {
    radarChartInstance.value.resize();
  }
};

// 监听视图模式变化
const onViewModeChange = () => {
  if (viewMode.value === "chart") {
    nextTick(() => {
      initCharts();
    });
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
        if (viewMode.value === "chart") {
          initCharts();
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error("加载 ECharts 失败:", error);
      ElMessage.error("图表组件加载失败");
    }
  } else {
    if (viewMode.value === "chart") {
      initCharts();
    }
  }

  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  if (pieChartInstance.value) {
    pieChartInstance.value.dispose();
  }
  if (barChartInstance.value) {
    barChartInstance.value.dispose();
  }
  if (radarChartInstance.value) {
    radarChartInstance.value.dispose();
  }
  window.removeEventListener("resize", handleResize);
});

// 监听视图模式变化
import { watch } from "vue";
watch(viewMode, onViewModeChange);
</script>

<style scoped>
.tech-field-distribution {
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

.overview-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
}

.metric-item {
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.chart-view {
  margin: 20px 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.chart-container h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.chart-wrapper {
  width: 100%;
  height: 300px;
}

.radar-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.radar-container h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.radar-container .chart-wrapper {
  height: 400px;
}

.table-view {
  margin: 20px 0;
}

.table-row-spaced {
  height: 60px;
}

.trend-cell {
  padding: 8px 12px !important;
}

.table-view .el-table {
  border-radius: 8px;
  overflow: hidden;
}

.table-view .el-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  padding: 16px 12px;
}

.table-view .el-table td {
  padding: 12px;
  vertical-align: middle;
}

.field-name {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.field-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.field-text {
  font-weight: 500;
  color: #2c3e50;
}

.trend-icon {
  margin-right: 4px;
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

.trend-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.trend-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.success-rate-text {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 4px;
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

.insights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.insight-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.insight-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-tag {
  background: #409eff;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.field-tag.emerging {
  background: #67c23a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .overview-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}

.action-buttons .el-button {
  margin: 0;
  flex-shrink: 0;
}

.action-buttons .el-button + .el-button {
  margin-left: 0;
}
</style>
