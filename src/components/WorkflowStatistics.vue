<template>
  <div class="workflow-statistics">
    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon total">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.totalProcesses }}</div>
            <div class="stat-label">总流程数</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.pendingProcesses }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon approved">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.approvedProcesses }}</div>
            <div class="stat-label">已批准</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon overdue">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.overdueProcesses }}</div>
            <div class="stat-label">超时流程</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 详细统计 -->
    <el-row :gutter="20" class="detailed-stats">
      <!-- 工作流效率分析 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>工作流效率分析</h4>
          </template>

          <div class="efficiency-stats">
            <div class="efficiency-item">
              <span class="label">平均处理时间:</span>
              <span class="value">{{
                formatHours(statistics.averageProcessingTime)
              }}</span>
            </div>

            <div class="efficiency-breakdown">
              <h5>各工作流平均耗时</h5>
              <div
                v-for="(workflowStat, workflowId) in statistics.byWorkflow"
                :key="workflowId"
                class="workflow-stat"
              >
                <div class="workflow-name">
                  {{ getWorkflowName(workflowId) }}
                </div>
                <div class="workflow-metrics">
                  <el-progress
                    :percentage="
                      getEfficiencyPercentage(workflowStat.averageTime)
                    "
                    :color="getEfficiencyColor(workflowStat.averageTime)"
                    :show-text="false"
                    :stroke-width="8"
                  />
                  <span class="time-label">{{
                    formatHours(workflowStat.averageTime)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 工作流成功率 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>工作流成功率</h4>
          </template>

          <div class="success-stats">
            <div
              v-for="(workflowStat, workflowId) in statistics.byWorkflow"
              :key="workflowId"
              class="success-item"
            >
              <div class="workflow-header">
                <span class="workflow-name">{{
                  getWorkflowName(workflowId)
                }}</span>
                <span class="success-rate"
                  >{{ getSuccessRate(workflowStat) }}%</span
                >
              </div>

              <div class="process-breakdown">
                <div class="breakdown-item approved">
                  <span class="count">{{ workflowStat.approved }}</span>
                  <span class="label">已批准</span>
                </div>
                <div class="breakdown-item rejected">
                  <span class="count">{{ workflowStat.rejected }}</span>
                  <span class="label">已拒绝</span>
                </div>
                <div class="breakdown-item pending">
                  <span class="count">{{ workflowStat.pending }}</span>
                  <span class="label">进行中</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 时间趋势分析 -->
    <el-row :gutter="20" class="trend-analysis">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h4>流程趋势分析</h4>
          </template>

          <div class="trend-content">
            <!-- 这里可以添加图表组件，目前用简单的表格展示 -->
            <el-table :data="trendData" stripe>
              <el-table-column prop="period" label="时间段" width="120" />
              <el-table-column prop="started" label="启动流程" width="100" />
              <el-table-column prop="completed" label="完成流程" width="100" />
              <el-table-column prop="averageTime" label="平均耗时" width="120">
                <template #default="{ row }">
                  {{ formatHours(row.averageTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="successRate" label="成功率" width="100">
                <template #default="{ row }"> {{ row.successRate }}% </template>
              </el-table-column>
              <el-table-column
                prop="bottlenecks"
                label="瓶颈步骤"
                min-width="200"
              />
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 委托和超时统计 -->
    <el-row :gutter="20" class="delegation-timeout-stats">
      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>委托统计</h4>
          </template>

          <div class="delegation-stats">
            <div class="stat-summary">
              <div class="summary-item">
                <span class="number">{{ activeDelegations.length }}</span>
                <span class="label">活跃委托</span>
              </div>
              <div class="summary-item">
                <span class="number">{{ totalDelegations.length }}</span>
                <span class="label">总委托数</span>
              </div>
            </div>

            <div class="delegation-list">
              <div
                v-for="delegation in recentDelegations"
                :key="delegation.id"
                class="delegation-item"
              >
                <div class="delegation-info">
                  <span class="delegator">{{ delegation.delegatorName }}</span>
                  <el-icon><ArrowRight /></el-icon>
                  <span class="delegatee">{{ delegation.delegateeName }}</span>
                </div>
                <div class="delegation-period">
                  {{
                    formatDateRange(delegation.startDate, delegation.endDate)
                  }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>超时统计</h4>
          </template>

          <div class="timeout-stats">
            <div class="stat-summary">
              <div class="summary-item">
                <span class="number">{{ unresolvedTimeouts.length }}</span>
                <span class="label">未解决超时</span>
              </div>
              <div class="summary-item">
                <span class="number">{{ totalTimeouts.length }}</span>
                <span class="label">总超时数</span>
              </div>
            </div>

            <div class="timeout-actions">
              <div class="action-breakdown">
                <div class="action-item">
                  <span class="action-type">自动批准:</span>
                  <span class="count">{{
                    getTimeoutsByAction("auto_approve").length
                  }}</span>
                </div>
                <div class="action-item">
                  <span class="action-type">通知提醒:</span>
                  <span class="count">{{
                    getTimeoutsByAction("notify").length
                  }}</span>
                </div>
                <div class="action-item">
                  <span class="action-type">升级处理:</span>
                  <span class="count">{{
                    getTimeoutsByAction("escalate").length
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作按钮 -->
    <div class="actions">
      <el-button @click="refreshStatistics">
        <el-icon><Refresh /></el-icon>
        刷新统计
      </el-button>
      <el-button @click="exportStatistics">
        <el-icon><Download /></el-icon>
        导出报告
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDocumentStore } from "@/stores/document";
import { ElMessage } from "element-plus";
import {
  Folder,
  Clock,
  CircleCheck,
  Warning,
  ArrowRight,
  Refresh,
  Download,
} from "@element-plus/icons-vue";
import type { ApprovalStatistics } from "@/types/document";

// Store
const documentStore = useDocumentStore();

// 响应式数据
const statistics = ref<ApprovalStatistics>({
  totalProcesses: 0,
  pendingProcesses: 0,
  approvedProcesses: 0,
  rejectedProcesses: 0,
  overdueProcesses: 0,
  averageProcessingTime: 0,
  byWorkflow: {},
  byUser: {},
});

// 模拟趋势数据
const trendData = ref([
  {
    period: "本周",
    started: 15,
    completed: 12,
    averageTime: 36,
    successRate: 80,
    bottlenecks: "第二步审核",
  },
  {
    period: "上周",
    started: 18,
    completed: 16,
    averageTime: 42,
    successRate: 89,
    bottlenecks: "最终审批",
  },
  {
    period: "本月",
    started: 65,
    completed: 58,
    averageTime: 38,
    successRate: 85,
    bottlenecks: "初审",
  },
]);

// 计算属性
const activeDelegations = computed(() =>
  documentStore.approvalDelegations.filter((d) => d.isActive)
);

const totalDelegations = computed(() => documentStore.approvalDelegations);

const recentDelegations = computed(() =>
  documentStore.approvalDelegations
    .slice(0, 5)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
);

const unresolvedTimeouts = computed(() =>
  documentStore.approvalTimeouts.filter((t) => !t.isResolved)
);

const totalTimeouts = computed(() => documentStore.approvalTimeouts);

// 方法
const refreshStatistics = () => {
  statistics.value = documentStore.getApprovalStatistics();
  ElMessage.success("统计数据已刷新");
};

const getWorkflowName = (workflowId: string) => {
  const workflow = documentStore.approvalWorkflows.find(
    (w) => w.id === workflowId
  );
  return workflow?.name || "未知工作流";
};

const getSuccessRate = (workflowStat: any) => {
  const total = workflowStat.approved + workflowStat.rejected;
  return total > 0 ? Math.round((workflowStat.approved / total) * 100) : 0;
};

const getEfficiencyPercentage = (averageTime: number) => {
  // 假设最理想时间是24小时，最长时间是168小时(一周)
  const idealTime = 24;
  const maxTime = 168;
  const efficiency = Math.max(
    0,
    Math.min(100, ((maxTime - averageTime) / (maxTime - idealTime)) * 100)
  );
  return Math.round(efficiency);
};

const getEfficiencyColor = (averageTime: number) => {
  if (averageTime <= 24) return "#67c23a"; // 绿色
  if (averageTime <= 48) return "#e6a23c"; // 黄色
  return "#f56c6c"; // 红色
};

const getTimeoutsByAction = (action: string) => {
  return documentStore.approvalTimeouts.filter((t) => t.action === action);
};

const formatHours = (hours: number) => {
  if (hours < 1) return "< 1小时";
  if (hours < 24) return `${Math.round(hours)}小时`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
};

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate).toLocaleDateString("zh-CN");
  const end = new Date(endDate).toLocaleDateString("zh-CN");
  return `${start} - ${end}`;
};

const exportStatistics = () => {
  const reportData = {
    summary: statistics.value,
    trends: trendData.value,
    delegations: {
      active: activeDelegations.value.length,
      total: totalDelegations.value.length,
      recent: recentDelegations.value,
    },
    timeouts: {
      unresolved: unresolvedTimeouts.value.length,
      total: totalTimeouts.value.length,
      byAction: {
        autoApprove: getTimeoutsByAction("auto_approve").length,
        notify: getTimeoutsByAction("notify").length,
        escalate: getTimeoutsByAction("escalate").length,
      },
    },
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `workflow-statistics-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success("统计报告已导出");
};

// 生命周期
onMounted(() => {
  refreshStatistics();
});
</script>

<style scoped>
.workflow-statistics {
  padding: 20px;
}

.stats-overview {
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%);
}

.stat-icon.approved {
  background: linear-gradient(45deg, #56ab2f 0%, #a8e6cf 100%);
}

.stat-icon.overdue {
  background: linear-gradient(45deg, #ff6b6b 0%, #ee5a24 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9em;
  font-weight: 500;
}

.detailed-stats,
.trend-analysis,
.delegation-timeout-stats {
  margin-bottom: 30px;
}

.detailed-stats .el-card,
.trend-analysis .el-card,
.delegation-timeout-stats .el-card {
  height: 100%;
}

.efficiency-stats .efficiency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.efficiency-item .label {
  color: #666;
}

.efficiency-item .value {
  font-weight: bold;
  color: #2c3e50;
}

.efficiency-breakdown {
  margin-top: 20px;
}

.efficiency-breakdown h5 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 14px;
}

.workflow-stat {
  margin-bottom: 16px;
}

.workflow-name {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 8px;
}

.workflow-metrics {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-label {
  font-size: 12px;
  color: #666;
  min-width: 60px;
}

.success-stats .success-item {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.success-stats .success-item:last-child {
  border-bottom: none;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.workflow-header .workflow-name {
  font-weight: bold;
  color: #2c3e50;
}

.success-rate {
  font-size: 18px;
  font-weight: bold;
  color: #67c23a;
}

.process-breakdown {
  display: flex;
  gap: 16px;
}

.breakdown-item {
  text-align: center;
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 60px;
}

.breakdown-item.approved {
  background: #f0f9ff;
  color: #67c23a;
}

.breakdown-item.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.breakdown-item.pending {
  background: #fefcf0;
  color: #e6a23c;
}

.breakdown-item .count {
  display: block;
  font-size: 18px;
  font-weight: bold;
}

.breakdown-item .label {
  display: block;
  font-size: 12px;
  margin-top: 4px;
}

.stat-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
}

.summary-item .number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.summary-item .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.delegation-list {
  max-height: 200px;
  overflow-y: auto;
}

.delegation-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.delegation-item:last-child {
  border-bottom: none;
}

.delegation-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.delegator,
.delegatee {
  font-weight: 500;
  color: #2c3e50;
}

.delegation-period {
  font-size: 12px;
  color: #999;
}

.timeout-actions {
  margin-top: 16px;
}

.action-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.action-type {
  color: #666;
  font-size: 14px;
}

.count {
  font-weight: bold;
  color: #2c3e50;
}

.actions {
  text-align: center;
  margin-top: 30px;
}

.actions .el-button {
  margin: 0 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-overview .el-col {
    margin-bottom: 16px;
  }

  .detailed-stats .el-col,
  .delegation-timeout-stats .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .workflow-statistics {
    padding: 10px;
  }

  .process-breakdown {
    flex-direction: column;
    gap: 8px;
  }

  .stat-summary {
    flex-direction: column;
    gap: 12px;
  }

  .actions {
    text-align: left;
  }

  .actions .el-button {
    display: block;
    width: 100%;
    margin: 8px 0;
  }
}
</style>
