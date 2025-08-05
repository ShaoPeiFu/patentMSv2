<template>
  <div class="advanced-analytics">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1>高级统计分析</h1>
        <p>专利数据深度分析与智能洞察</p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          @click="generateReport"
          :loading="analyticsStore.loading"
        >
          <el-icon><DocumentIcon /></el-icon>
          生成分析报告
        </el-button>
        <el-dropdown @command="handleExport">
          <el-button>
            <el-icon><Download /></el-icon>
            导出数据
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">JSON格式</el-dropdown-item>
              <el-dropdown-item command="csv">CSV格式</el-dropdown-item>
              <el-dropdown-item command="pdf">PDF报告</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- KPI指标概览 -->
    <div class="kpi-section">
      <h2 class="section-title">关键绩效指标</h2>
      <div class="kpi-grid">
        <div
          v-for="metric in analyticsStore.kpiMetrics"
          :key="metric.name"
          class="kpi-card"
        >
          <div class="kpi-header">
            <span class="kpi-name">{{ metric.name }}</span>
            <el-tag
              :type="
                metric.status === 'good'
                  ? 'success'
                  : metric.status === 'warning'
                  ? 'warning'
                  : 'danger'
              "
              size="small"
            >
              {{ getStatusText(metric.status) }}
            </el-tag>
          </div>

          <div class="kpi-content">
            <div class="kpi-value">
              {{ metric.value }}
              <span class="kpi-unit">{{ metric.unit }}</span>
            </div>

            <div class="kpi-trend" :class="metric.trend">
              <el-icon>
                <component
                  :is="
                    metric.trend === 'up'
                      ? 'ArrowUp'
                      : metric.trend === 'down'
                      ? 'ArrowDown'
                      : 'Minus'
                  "
                />
              </el-icon>
              <span>{{ metric.trendValue }}%</span>
            </div>
          </div>

          <div class="kpi-progress" v-if="metric.target">
            <el-progress
              :percentage="getProgressPercentage(metric.value, metric.target)"
              :show-text="false"
              :stroke-width="4"
              :color="getProgressColor(metric.status)"
            />
            <div class="progress-text">
              目标: {{ metric.target }}{{ metric.unit }}
            </div>
          </div>

          <div class="kpi-description">
            {{ metric.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 分析模块切换 -->
    <div class="analysis-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="专利趋势分析" name="trend">
          <PatentTrendAnalysis />
        </el-tab-pane>

        <el-tab-pane label="技术领域分布" name="tech-field">
          <TechFieldDistribution />
        </el-tab-pane>

        <el-tab-pane label="竞争对手分析" name="competitor">
          <CompetitorAnalysis />
        </el-tab-pane>

        <el-tab-pane label="ROI投资回报" name="roi">
          <ROIAnalysis />
        </el-tab-pane>

        <el-tab-pane label="预测模型" name="forecast">
          <div class="forecast-panel">
            <ForecastPanel />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 分析配置 -->
    <div class="config-section" v-if="showConfig">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>分析配置</h3>
            <el-button size="small" @click="showConfig = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </template>

        <el-form :model="configForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="updateDateRange"
                />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="数据粒度">
                <el-select
                  v-model="configForm.granularity"
                  @change="updateConfig"
                >
                  <el-option label="日" value="daily" />
                  <el-option label="周" value="weekly" />
                  <el-option label="月" value="monthly" />
                  <el-option label="季度" value="quarterly" />
                  <el-option label="年" value="yearly" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="ROI计算方法">
                <el-select
                  v-model="configForm.roiCalculationMethod"
                  @change="updateConfig"
                >
                  <el-option label="简单ROI" value="simple" />
                  <el-option label="净现值(NPV)" value="npv" />
                  <el-option label="内部收益率(IRR)" value="irr" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="置信水平">
                <el-slider
                  v-model="confidenceLevel"
                  :min="80"
                  :max="99"
                  :step="1"
                  :format-tooltip="formatConfidence"
                  @change="updateConfidence"
                />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="竞争对手">
                <el-select
                  v-model="configForm.competitorList"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或添加竞争对手"
                  style="width: 100%"
                  @change="updateConfig"
                >
                  <el-option
                    v-for="competitor in defaultCompetitors"
                    :key="competitor"
                    :label="competitor"
                    :value="competitor"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="技术领域">
                <el-checkbox-group
                  v-model="configForm.techFieldCategories"
                  @change="updateConfig"
                >
                  <el-checkbox
                    v-for="field in defaultTechFields"
                    :key="field"
                    :label="field"
                  >
                    {{ field }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 报告历史 -->
    <div class="reports-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>分析报告历史</h3>
            <div class="header-actions">
              <el-button size="small" @click="showConfig = !showConfig">
                <el-icon><Setting /></el-icon>
                配置
              </el-button>
              <el-button size="small" @click="refreshReports">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="analyticsStore.reports"
          v-loading="analyticsStore.loading"
        >
          <el-table-column prop="title" label="报告标题" min-width="200" />
          <el-table-column prop="generatedAt" label="生成时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.generatedAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="period" label="分析周期" width="200">
            <template #default="{ row }">
              {{ row.period.start }} 至 {{ row.period.end }}
            </template>
          </el-table-column>
          <el-table-column prop="summary" label="总专利数" width="120">
            <template #default="{ row }">
              {{ row.summary.totalPatents }}
            </template>
          </el-table-column>
          <el-table-column prop="summary" label="总价值" width="120">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.summary.totalValue) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewReport(row)">
                查看
              </el-button>
              <el-button size="small" @click="exportReport(row)">
                导出
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteReport(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 报告查看对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="分析报告详情"
      width="80%"
      :show-close="true"
    >
      <div v-if="currentReport" class="report-content">
        <!-- 报告摘要 -->
        <div class="report-summary">
          <h3>{{ currentReport.title }}</h3>
          <p>生成时间: {{ formatDateTime(currentReport.generatedAt) }}</p>
          <p>
            分析周期: {{ currentReport.period.start }} 至
            {{ currentReport.period.end }}
          </p>
        </div>

        <!-- 关键指标 -->
        <div class="report-metrics">
          <h4>关键指标</h4>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="summary-metric">
                <div class="metric-value">
                  {{ currentReport.summary.totalPatents }}
                </div>
                <div class="metric-label">总专利数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-metric">
                <div class="metric-value">
                  ¥{{ formatCurrency(currentReport.summary.totalValue) }}
                </div>
                <div class="metric-label">总价值</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-metric">
                <div class="metric-value">
                  {{ currentReport.summary.avgROI }}%
                </div>
                <div class="metric-label">平均ROI</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-metric">
                <div class="metric-value">
                  {{ currentReport.summary.topTechField }}
                </div>
                <div class="metric-label">主要技术领域</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 洞察和建议 -->
        <div class="report-insights">
          <el-row :gutter="20">
            <el-col :span="12">
              <h4>关键洞察</h4>
              <ul class="insights-list">
                <li v-for="insight in currentReport.insights" :key="insight">
                  {{ insight }}
                </li>
              </ul>
            </el-col>
            <el-col :span="12">
              <h4>建议措施</h4>
              <ul class="recommendations-list">
                <li
                  v-for="recommendation in currentReport.recommendations"
                  :key="recommendation"
                >
                  {{ recommendation }}
                </li>
              </ul>
            </el-col>
          </el-row>
        </div>
      </div>

      <template #footer>
        <el-button @click="reportDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportReport(currentReport)">
          导出报告
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useAnalyticsStore } from "@/stores/analytics";
import { ElMessage, ElMessageBox } from "element-plus";
import type { AnalyticsReport } from "@/types/analytics";
import {
  Document,
  Download,
  ArrowDown,
  Close,
  Setting,
  Refresh,
} from "@element-plus/icons-vue";

// 导入分析组件
import PatentTrendAnalysis from "@/components/PatentTrendAnalysis.vue";
import TechFieldDistribution from "@/components/TechFieldDistribution.vue";
import CompetitorAnalysis from "@/components/CompetitorAnalysis.vue";
import ROIAnalysis from "@/components/ROIAnalysis.vue";

// 预测面板组件（简化版）
const ForecastPanel = {
  template: `
    <div class="forecast-panel">
      <el-alert title="预测功能开发中" type="info" show-icon :closable="false">
        <p>基于历史数据和机器学习算法的专利趋势预测功能正在开发中，敬请期待。</p>
        <p>将提供以下预测能力：</p>
        <ul>
          <li>专利申请量预测</li>
          <li>技术发展趋势预测</li>
          <li>市场价值预测</li>
          <li>风险评估预测</li>
        </ul>
      </el-alert>
    </div>
  `,
};

const analyticsStore = useAnalyticsStore();

// 响应式数据
const activeTab = ref("trend");
const showConfig = ref(false);
const reportDialogVisible = ref(false);
const currentReport = ref<AnalyticsReport | null>(null);

const dateRange = ref<[string, string]>([
  analyticsStore.config.timeRange.start,
  analyticsStore.config.timeRange.end,
]);

const confidenceLevel = ref(
  Math.round(analyticsStore.config.confidenceLevel * 100)
);

const configForm = reactive({
  granularity: analyticsStore.config.granularity,
  roiCalculationMethod: analyticsStore.config.roiCalculationMethod,
  competitorList: [...analyticsStore.config.competitorList],
  techFieldCategories: [...analyticsStore.config.techFieldCategories],
});

// 默认选项
const defaultCompetitors = [
  "华为技术",
  "腾讯科技",
  "阿里巴巴",
  "百度在线",
  "京东科技",
  "字节跳动",
  "小米科技",
  "美团",
  "滴滴出行",
  "蚂蚁集团",
];

const defaultTechFields = [
  "人工智能",
  "大数据",
  "云计算",
  "物联网",
  "区块链",
  "5G通信",
  "自动驾驶",
  "生物技术",
  "新能源",
  "量子计算",
];

// 方法
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    good: "良好",
    warning: "警告",
    danger: "危险",
  };
  return texts[status] || status;
};

const getProgressPercentage = (
  value: number | string,
  target: number | string
) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const numTarget = typeof target === "string" ? parseFloat(target) : target;

  if (isNaN(numValue) || isNaN(numTarget) || numTarget === 0) return 0;
  return Math.min(100, Math.round((numValue / numTarget) * 100));
};

const getProgressColor = (status: string) => {
  const colors: Record<string, string> = {
    good: "#67C23A",
    warning: "#E6A23C",
    danger: "#F56C6C",
  };
  return colors[status] || "#409EFF";
};

const formatCurrency = (value: number) => {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(1) + "亿";
  } else if (value >= 10000) {
    return (value / 10000).toFixed(0) + "万";
  } else {
    return value.toLocaleString();
  }
};

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString("zh-CN");
};

const formatConfidence = (value: number) => {
  return `${value}%`;
};

const generateReport = async () => {
  try {
    const title = `专利分析报告_${new Date().toLocaleDateString("zh-CN")}`;
    await analyticsStore.generateReport(title);
    ElMessage.success("分析报告生成成功");
  } catch (error) {
    ElMessage.error("生成报告失败");
  }
};

const handleExport = (command: string) => {
  ElMessage.info(`导出${command.toUpperCase()}格式功能开发中`);
};

const handleTabChange = (tabName: string) => {
  console.log("切换到标签页:", tabName);
};

const updateDateRange = (range: [string, string] | null) => {
  if (range) {
    analyticsStore.updateConfig({
      timeRange: {
        start: range[0],
        end: range[1],
      },
    });
  }
};

const updateConfig = () => {
  analyticsStore.updateConfig({
    granularity: configForm.granularity,
    roiCalculationMethod: configForm.roiCalculationMethod,
    competitorList: configForm.competitorList,
    techFieldCategories: configForm.techFieldCategories,
  });
  ElMessage.success("配置已更新");
};

const updateConfidence = (value: number) => {
  analyticsStore.updateConfig({
    confidenceLevel: value / 100,
  });
};

const refreshReports = () => {
  analyticsStore.loadFromStorage();
  ElMessage.success("报告列表已刷新");
};

const viewReport = (report: AnalyticsReport) => {
  currentReport.value = report;
  reportDialogVisible.value = true;
};

const exportReport = (report: AnalyticsReport | null) => {
  if (report) {
    analyticsStore.exportReport(report, "json");
    ElMessage.success("报告导出成功");
  }
};

const deleteReport = async (reportId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个分析报告吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    analyticsStore.deleteReport(reportId);
    ElMessage.success("报告删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

// 生命周期
onMounted(() => {
  // 初始化数据
  analyticsStore.loadFromStorage();
});
</script>

<style scoped>
.advanced-analytics {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
}

.header-content p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.kpi-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: "";
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.kpi-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.kpi-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.kpi-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
}

.kpi-unit {
  font-size: 16px;
  color: #666;
  margin-left: 4px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.kpi-trend.up {
  color: #67c23a;
}

.kpi-trend.down {
  color: #f56c6c;
}

.kpi-trend.stable {
  color: #909399;
}

.kpi-progress {
  margin-bottom: 12px;
}

.progress-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.kpi-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.analysis-tabs {
  margin-bottom: 30px;
}

.forecast-panel {
  padding: 20px;
}

.config-section {
  margin-bottom: 30px;
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

.config-section .header-actions {
  display: flex;
  gap: 8px;
}

.reports-section {
  margin-bottom: 30px;
}

.report-content {
  max-height: 60vh;
  overflow-y: auto;
}

.report-summary {
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.report-summary h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.report-summary p {
  margin: 4px 0;
  color: #666;
}

.report-metrics {
  margin-bottom: 24px;
}

.report-metrics h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.summary-metric {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.summary-metric .metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 4px;
}

.summary-metric .metric-label {
  font-size: 14px;
  color: #666;
}

.report-insights h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.insights-list,
.recommendations-list {
  margin: 0;
  padding-left: 20px;
}

.insights-list li,
.recommendations-list li {
  margin-bottom: 8px;
  color: #555;
  line-height: 1.5;
}

/* 全局样式覆盖 */
:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e4e7ed;
}

:deep(.el-tabs__active-bar) {
  background-color: #667eea;
}

:deep(.el-tabs__item.is-active) {
  color: #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
