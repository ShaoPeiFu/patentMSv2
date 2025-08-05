<template>
  <div class="competitor-analysis">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>竞争对手分析</h3>
          <div class="header-actions">
            <el-button-group size="small">
              <el-button
                :type="viewMode === 'overview' ? 'primary' : ''"
                @click="viewMode = 'overview'"
              >
                <el-icon><DataBoard /></el-icon>
                概览
              </el-button>
              <el-button
                :type="viewMode === 'detailed' ? 'primary' : ''"
                @click="viewMode = 'detailed'"
              >
                <el-icon><List /></el-icon>
                详细
              </el-button>
              <el-button
                :type="viewMode === 'comparison' ? 'primary' : ''"
                @click="viewMode = 'comparison'"
              >
                <el-icon><TrendCharts /></el-icon>
                对比
              </el-button>
            </el-button-group>
            <el-button size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <!-- 市场地位概览 -->
      <div class="market-position">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="position-card">
              <div class="position-rank">
                {{ analysisData.marketPosition.rank }}
              </div>
              <div class="position-label">市场排名</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="position-card">
              <div class="position-rank">
                {{ analysisData.marketPosition.percentile }}%
              </div>
              <div class="position-label">超越对手</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="position-card">
              <div class="position-rank category">
                {{ getCategoryText(analysisData.marketPosition.category) }}
              </div>
              <div class="position-label">竞争地位</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="position-card">
              <div class="position-rank">
                {{ analysisData.competitors.length }}
              </div>
              <div class="position-label">主要竞争对手</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 概览视图 -->
      <div v-if="viewMode === 'overview'" class="overview-view">
        <!-- 竞争力雷达图 -->
        <div class="radar-section">
          <h4>竞争力对比雷达图</h4>
          <div class="chart-wrapper" ref="radarChartRef"></div>
        </div>

        <!-- 市场份额分布 -->
        <div class="market-share-section">
          <h4>市场份额分布</h4>
          <div class="chart-wrapper" ref="marketShareChartRef"></div>
        </div>
      </div>

      <!-- 详细视图 -->
      <div v-if="viewMode === 'detailed'" class="detailed-view">
        <div class="competitors-grid">
          <div
            v-for="competitor in analysisData.competitors"
            :key="competitor.name"
            class="competitor-card"
          >
            <div class="competitor-header">
              <h4>{{ competitor.name }}</h4>
              <el-tag
                :type="getCompetitorType(competitor.marketShare)"
                size="small"
              >
                {{ getCompetitorLevel(competitor.marketShare) }}
              </el-tag>
            </div>

            <div class="competitor-metrics">
              <div class="metric-row">
                <span class="metric-label">专利数量:</span>
                <span class="metric-value">{{
                  competitor.patentCount.toLocaleString()
                }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">市场份额:</span>
                <span class="metric-value">{{ competitor.marketShare }}%</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">平均质量:</span>
                <span class="metric-value">{{ competitor.avgQuality }}/10</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">近期活跃度:</span>
                <span class="metric-value">{{
                  competitor.recentActivity
                }}</span>
              </div>
            </div>

            <div class="tech-focus">
              <div class="section-title">技术重点</div>
              <div class="tech-tags">
                <el-tag
                  v-for="tech in competitor.techFocus"
                  :key="tech"
                  size="small"
                  class="tech-tag"
                >
                  {{ tech }}
                </el-tag>
              </div>
            </div>

            <div class="swot-analysis">
              <div class="strengths">
                <div class="swot-title">
                  <el-icon><Check /></el-icon>
                  优势
                </div>
                <ul class="swot-list">
                  <li v-for="strength in competitor.strengths" :key="strength">
                    {{ strength }}
                  </li>
                </ul>
              </div>

              <div class="weaknesses">
                <div class="swot-title">
                  <el-icon><Close /></el-icon>
                  劣势
                </div>
                <ul class="swot-list">
                  <li v-for="weakness in competitor.weaknesses" :key="weakness">
                    {{ weakness }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 对比视图 -->
      <div v-if="viewMode === 'comparison'" class="comparison-view">
        <!-- 选择对比对象 -->
        <div class="comparison-selector">
          <el-select
            v-model="selectedCompetitors"
            multiple
            placeholder="选择要对比的竞争对手"
            style="width: 100%"
          >
            <el-option
              v-for="competitor in analysisData.competitors"
              :key="competitor.name"
              :label="competitor.name"
              :value="competitor.name"
            />
          </el-select>
        </div>

        <!-- 对比图表 -->
        <div v-if="selectedCompetitors.length > 0" class="comparison-charts">
          <div class="comparison-chart">
            <h4>专利数量对比</h4>
            <div class="chart-wrapper" ref="patentComparisonRef"></div>
          </div>

          <div class="comparison-chart">
            <h4>综合实力对比</h4>
            <div class="chart-wrapper" ref="strengthComparisonRef"></div>
          </div>
        </div>

        <!-- 对比表格 -->
        <div v-if="selectedCompetitors.length > 0" class="comparison-table">
          <el-table :data="selectedCompetitorData" stripe>
            <el-table-column
              prop="name"
              label="公司名称"
              width="120"
              fixed="left"
            />
            <el-table-column
              prop="patentCount"
              label="专利数量"
              width="120"
              sortable
            />
            <el-table-column
              prop="marketShare"
              label="市场份额"
              width="120"
              sortable
            >
              <template #default="{ row }">{{ row.marketShare }}%</template>
            </el-table-column>
            <el-table-column
              prop="avgQuality"
              label="平均质量"
              width="120"
              sortable
            >
              <template #default="{ row }">{{ row.avgQuality }}/10</template>
            </el-table-column>
            <el-table-column
              prop="recentActivity"
              label="近期活跃度"
              width="120"
              sortable
            />
            <el-table-column prop="techFocus" label="技术重点" min-width="200">
              <template #default="{ row }">
                <el-tag
                  v-for="tech in row.techFocus"
                  :key="tech"
                  size="small"
                  style="margin: 2px"
                >
                  {{ tech }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 战略分析 -->
      <div class="strategic-analysis">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="analysis-section gaps">
              <h4>
                <el-icon><Warning /></el-icon>
                竞争差距
              </h4>
              <ul class="analysis-list">
                <li v-for="gap in analysisData.competitiveGaps" :key="gap">
                  {{ gap }}
                </li>
              </ul>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="analysis-section opportunities">
              <h4>
                <el-icon><Opportunity /></el-icon>
                发展机遇
              </h4>
              <ul class="analysis-list">
                <li
                  v-for="opportunity in analysisData.opportunities"
                  :key="opportunity"
                >
                  {{ opportunity }}
                </li>
              </ul>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="analysis-section threats">
              <h4>
                <el-icon><Warning /></el-icon>
                潜在威胁
              </h4>
              <ul class="analysis-list">
                <li v-for="threat in analysisData.threats" :key="threat">
                  {{ threat }}
                </li>
              </ul>
            </div>
          </el-col>
        </el-row>
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
  DataBoard,
  List,
  TrendCharts,
  Check,
  Close,
  Warning,
  Lock,
} from "@element-plus/icons-vue";

// 添加缺失的图标
const Opportunity = Lock; // 使用 Lock 作为机遇图标的替代

// 导入图表库
declare const echarts: any;

const analyticsStore = useAnalyticsStore();

// 响应式数据
const viewMode = ref<"overview" | "detailed" | "comparison">("overview");
const selectedCompetitors = ref<string[]>([]);
const radarChartRef = ref<HTMLDivElement>();
const marketShareChartRef = ref<HTMLDivElement>();
const patentComparisonRef = ref<HTMLDivElement>();
const strengthComparisonRef = ref<HTMLDivElement>();
const radarChartInstance = ref<any>(null);
const marketShareChartInstance = ref<any>(null);
const patentComparisonInstance = ref<any>(null);
const strengthComparisonInstance = ref<any>(null);

// 计算属性
const analysisData = computed(() => {
  return analyticsStore.generateCompetitorAnalysis();
});

const selectedCompetitorData = computed(() => {
  return analysisData.value.competitors.filter((c) =>
    selectedCompetitors.value.includes(c.name)
  );
});

// 方法
const getCategoryText = (category: string) => {
  const texts: Record<string, string> = {
    leader: "领导者",
    challenger: "挑战者",
    follower: "追随者",
    niche: "利基专家",
  };
  return texts[category] || category;
};

const getCompetitorType = (marketShare: number) => {
  if (marketShare >= 20) return "danger";
  if (marketShare >= 15) return "warning";
  if (marketShare >= 10) return "primary";
  return "info";
};

const getCompetitorLevel = (marketShare: number) => {
  if (marketShare >= 20) return "领导者";
  if (marketShare >= 15) return "主要竞争者";
  if (marketShare >= 10) return "重要竞争者";
  return "一般竞争者";
};

const initCharts = () => {
  if (typeof echarts === "undefined") {
    console.warn("ECharts not loaded yet");
    return;
  }

  // 确保DOM元素存在且可见
  if (viewMode.value === "overview") {
    if (radarChartRef.value && marketShareChartRef.value) {
      // 检查元素是否有尺寸
      const radarRect = radarChartRef.value.getBoundingClientRect();
      const marketRect = marketShareChartRef.value.getBoundingClientRect();

      if (
        radarRect.width > 0 &&
        radarRect.height > 0 &&
        marketRect.width > 0 &&
        marketRect.height > 0
      ) {
        initRadarChart();
        initMarketShareChart();
      } else {
        console.warn("Chart containers not properly sized, retrying...");
        setTimeout(() => initCharts(), 100);
      }
    } else {
      console.warn("Chart refs not available, retrying...");
      setTimeout(() => initCharts(), 100);
    }
  } else if (
    viewMode.value === "comparison" &&
    selectedCompetitors.value.length > 0
  ) {
    initComparisonCharts();
  }
};

const initRadarChart = () => {
  if (!radarChartRef.value) {
    console.warn("radarChartRef.value is null, retrying...");
    setTimeout(() => {
      if (radarChartRef.value) {
        initRadarChart();
      }
    }, 100);
    return;
  }

  radarChartInstance.value = echarts.init(radarChartRef.value);

  const competitors = analysisData.value.competitors.slice(0, 5); // 取前5个竞争对手

  const indicators = [
    {
      name: "专利数量",
      max: Math.max(...competitors.map((c) => c.patentCount), 5000),
    },
    { name: "市场份额", max: 30 },
    { name: "技术质量", max: 10 },
    { name: "创新活跃度", max: 200 },
    { name: "品牌影响力", max: 100 },
    { name: "资源实力", max: 100 },
  ];

  const data = competitors.map((competitor, index) => ({
    name: competitor.name,
    value: [
      competitor.patentCount,
      competitor.marketShare,
      competitor.avgQuality,
      competitor.recentActivity,
      80 + Math.random() * 20, // 模拟品牌影响力
      70 + Math.random() * 30, // 模拟资源实力
    ],
    itemStyle: {
      color: getCompetitorColor(index),
    },
    areaStyle: {
      opacity: 0.1,
    },
  }));

  const option = {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(50, 50, 50, 0.9)",
      borderColor: "#333",
      textStyle: {
        color: "#fff",
      },
    },
    legend: {
      type: "scroll",
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
      },
    },
    radar: {
      indicator: indicators,
      center: ["50%", "50%"],
      radius: "65%",
      axisName: {
        color: "#666",
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: "#ddd",
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ["rgba(250, 250, 250, 0.3)", "rgba(200, 200, 200, 0.3)"],
        },
      },
    },
    series: [
      {
        name: "竞争力对比",
        type: "radar",
        data: data,
        animation: true,
        animationDuration: 1000,
        animationEasing: "cubicOut",
      },
    ],
  };

  radarChartInstance.value.setOption(option);
};

const initMarketShareChart = () => {
  if (!marketShareChartRef.value) {
    console.warn("marketShareChartRef.value is null, retrying...");
    setTimeout(() => {
      if (marketShareChartRef.value) {
        initMarketShareChart();
      }
    }, 100);
    return;
  }

  marketShareChartInstance.value = echarts.init(marketShareChartRef.value);

  const competitors = analysisData.value.competitors;
  const othersShare =
    100 - competitors.reduce((sum, c) => sum + c.marketShare, 0);

  const data = [
    ...competitors.map((competitor, index) => ({
      name: competitor.name,
      value: competitor.marketShare,
      itemStyle: {
        color: getCompetitorColor(index),
      },
    })),
    {
      name: "其他",
      value: Math.max(0, othersShare),
      itemStyle: {
        color: "#E4E7ED",
      },
    },
  ];

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c}% ({d}%)",
    },
    legend: {
      type: "scroll",
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        name: "市场份额",
        type: "pie",
        radius: ["30%", "70%"],
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

  marketShareChartInstance.value.setOption(option);
};

const initComparisonCharts = () => {
  initPatentComparison();
  initStrengthComparison();
};

const initPatentComparison = () => {
  if (!patentComparisonRef.value) return;

  patentComparisonInstance.value = echarts.init(patentComparisonRef.value);

  const data = selectedCompetitorData.value;
  const categories = data.map((c) => c.name);
  const values = data.map((c) => c.patentCount);

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
      type: "category",
      data: categories,
      axisLabel: {
        interval: 0,
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "专利数量",
        type: "bar",
        data: values.map((value, index) => ({
          value,
          itemStyle: {
            color: getCompetitorColor(index),
          },
        })),
        barWidth: "60%",
      },
    ],
  };

  patentComparisonInstance.value.setOption(option);
};

const initStrengthComparison = () => {
  if (!strengthComparisonRef.value) return;

  strengthComparisonInstance.value = echarts.init(strengthComparisonRef.value);

  const data = selectedCompetitorData.value;

  const option = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["市场份额", "技术质量", "活跃度"],
    },
    radar: {
      indicator: [
        { name: "市场份额", max: 30 },
        { name: "技术质量", max: 10 },
        { name: "活跃度", max: 200 },
      ],
    },
    series: [
      {
        name: "综合实力",
        type: "radar",
        data: data.map((competitor, index) => ({
          name: competitor.name,
          value: [
            competitor.marketShare,
            competitor.avgQuality,
            competitor.recentActivity,
          ],
          itemStyle: {
            color: getCompetitorColor(index),
          },
        })),
      },
    ],
  };

  strengthComparisonInstance.value.setOption(option);
};

const getCompetitorColor = (index: number) => {
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

const refreshData = () => {
  // 强制重新生成数据
  analyticsStore.generateCompetitorAnalysis();

  // 清除现有图表实例
  if (radarChartInstance.value) {
    radarChartInstance.value.dispose();
    radarChartInstance.value = null;
  }
  if (marketShareChartInstance.value) {
    marketShareChartInstance.value.dispose();
    marketShareChartInstance.value = null;
  }

  // 添加延迟确保数据更新完成
  setTimeout(() => {
    nextTick(() => {
      initCharts();
    });
  }, 100);
  ElMessage.success("竞争对手数据已刷新");
};

const handleResize = () => {
  if (radarChartInstance.value) {
    radarChartInstance.value.resize();
  }
  if (marketShareChartInstance.value) {
    marketShareChartInstance.value.resize();
  }
  if (patentComparisonInstance.value) {
    patentComparisonInstance.value.resize();
  }
  if (strengthComparisonInstance.value) {
    strengthComparisonInstance.value.resize();
  }
};

// 监听视图模式和选择变化
watch(
  [viewMode, selectedCompetitors],
  () => {
    // 添加延迟确保DOM完全更新
    setTimeout(() => {
      nextTick(() => {
        initCharts();
      });
    }, 100);
  },
  { deep: true }
);

// 生命周期
onMounted(async () => {
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
              "Failed to initialize charts after multiple attempts"
            );
            return;
          }
          nextTick(() => {
            if (radarChartRef.value && marketShareChartRef.value) {
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
        console.error("Failed to initialize charts after multiple attempts");
        return;
      }
      nextTick(() => {
        if (radarChartRef.value && marketShareChartRef.value) {
          initCharts();
        } else {
          setTimeout(() => attemptInit(retries - 1), 100);
        }
      });
    };
    attemptInit();
  }

  // 默认选择前3个竞争对手进行对比
  selectedCompetitors.value = analysisData.value.competitors
    .slice(0, 3)
    .map((c) => c.name);

  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  if (radarChartInstance.value) {
    radarChartInstance.value.dispose();
  }
  if (marketShareChartInstance.value) {
    marketShareChartInstance.value.dispose();
  }
  if (patentComparisonInstance.value) {
    patentComparisonInstance.value.dispose();
  }
  if (strengthComparisonInstance.value) {
    strengthComparisonInstance.value.dispose();
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.competitor-analysis {
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

.market-position {
  margin: 20px 0;
}

.position-card {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.position-rank {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 8px;
}

.position-rank.category {
  font-size: 20px;
}

.position-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.overview-view {
  margin: 24px 0;
}

.radar-section,
.market-share-section {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.radar-section h4,
.market-share-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.chart-wrapper {
  width: 100%;
  height: 400px;
}

.detailed-view {
  margin: 20px 0;
}

.competitors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.competitor-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.competitor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.competitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.competitor-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.competitor-metrics {
  margin-bottom: 16px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-label {
  color: #666;
  font-size: 14px;
}

.metric-value {
  font-weight: 600;
  color: #2c3e50;
}

.tech-focus {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tech-tag {
  background: #409eff !important;
  border-color: #409eff !important;
}

.swot-analysis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.swot-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.strengths .swot-title {
  color: #67c23a;
}

.weaknesses .swot-title {
  color: #f56c6c;
}

.swot-list {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.swot-list li {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  position: relative;
}

.swot-list li::before {
  content: "•";
  position: absolute;
  left: -12px;
  color: #409eff;
}

.comparison-view {
  margin: 20px 0;
}

.comparison-selector {
  margin-bottom: 20px;
}

.comparison-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.comparison-chart {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.comparison-chart h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.comparison-chart .chart-wrapper {
  height: 300px;
}

.comparison-table {
  margin-top: 20px;
}

.strategic-analysis {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.analysis-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  height: 100%;
}

.analysis-section h4 {
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.analysis-section.gaps h4 {
  color: #f56c6c;
}

.analysis-section.opportunities h4 {
  color: #67c23a;
}

.analysis-section.threats h4 {
  color: #e6a23c;
}

.analysis-list {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.analysis-list li {
  color: #555;
  margin-bottom: 8px;
  position: relative;
  line-height: 1.5;
}

.analysis-list li::before {
  content: "▸";
  position: absolute;
  left: -12px;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .competitors-grid {
    grid-template-columns: 1fr;
  }

  .comparison-charts {
    grid-template-columns: 1fr;
  }

  .swot-analysis {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
