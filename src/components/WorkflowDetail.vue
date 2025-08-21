<template>
  <div class="workflow-detail">
    <!-- 基本信息 -->
    <el-card class="info-card">
      <template #header>
        <h4>基本信息</h4>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="工作流名称">{{
          workflow.name
        }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{
          workflow.category
        }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="getTypeTagType(workflow.type)">{{
            getTypeText(workflow.type)
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityTagType(workflow.priority)">{{
            getPriorityText(workflow.priority)
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本">{{
          workflow.version
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="workflow.isActive ? 'success' : 'info'">
            {{ workflow.isActive ? "活跃" : "非活跃" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{
          formatDate(workflow.createdAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{
          workflow.description || "暂无描述"
        }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag
            v-for="tag in workflow.tags"
            :key="tag"
            size="small"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
          <span
            v-if="!workflow.tags || workflow.tags.length === 0"
            class="text-muted"
            >暂无标签</span
          >
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 审批步骤详情 -->
    <el-card class="steps-card">
      <template #header>
        <h4>审批步骤 ({{ workflow.steps.length }}个)</h4>
      </template>

      <div class="steps-detail">
        <div
          v-for="(step, index) in workflow.steps"
          :key="step.id"
          class="step-detail"
        >
          <div class="step-indicator">
            <div class="step-number">{{ step.stepNumber }}</div>
            <div
              v-if="index < workflow.steps.length - 1"
              class="step-line"
            ></div>
          </div>

          <div class="step-content">
            <el-card class="step-card">
              <template #header>
                <div class="step-header">
                  <span class="step-name">{{ step.name }}</span>
                  <div class="step-badges">
                    <el-tag v-if="step.isRequired" type="danger" size="small"
                      >必需</el-tag
                    >
                    <el-tag
                      v-if="step.allowParallel"
                      type="success"
                      size="small"
                      >并行</el-tag
                    >
                    <el-tag v-if="step.autoApprove" type="warning" size="small"
                      >自动批准</el-tag
                    >
                    <el-tag
                      v-if="step.delegationAllowed"
                      type="info"
                      size="small"
                      >可委托</el-tag
                    >
                  </div>
                </div>
              </template>

              <div class="step-info">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="info-group">
                      <h6>审批设置</h6>
                      <div class="info-item">
                        <span class="label">审批角色:</span>
                        <span class="value">
                          <el-tag
                            v-for="role in step.approverRoles"
                            :key="role"
                            size="small"
                            style="margin-right: 4px"
                          >
                            {{ getRoleText(role) }}
                          </el-tag>
                        </span>
                      </div>
                      <div class="info-item" v-if="step.timeLimit">
                        <span class="label">时间限制:</span>
                        <span class="value">{{ step.timeLimit }}小时</span>
                      </div>
                      <div class="info-item" v-if="step.minApprovals">
                        <span class="label">最小审批数:</span>
                        <span class="value">{{ step.minApprovals }}人</span>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="info-group">
                      <h6>步骤描述</h6>
                      <p class="description">
                        {{ step.description || "暂无描述" }}
                      </p>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 使用统计 -->
    <el-card class="usage-card">
      <template #header>
        <h4>使用统计</h4>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="usage-stat">
            <div class="stat-icon">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ usageStats.totalProcesses }}</div>
              <div class="stat-label">总使用次数</div>
            </div>
          </div>
        </el-col>

        <el-col :span="8">
          <div class="usage-stat">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ usageStats.successRate }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-col>

        <el-col :span="8">
          <div class="usage-stat">
            <div class="stat-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">
                {{ formatHours(usageStats.averageTime) }}
              </div>
              <div class="stat-label">平均耗时</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 相关流程 -->
    <el-card class="processes-card">
      <template #header>
        <div class="card-header">
          <h4>相关流程</h4>
          <el-select
            v-model="processStatusFilter"
            placeholder="状态筛选"
            clearable
            size="small"
            style="width: 120px"
          >
            <el-option label="进行中" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </div>
      </template>

      <el-table :data="filteredProcesses" stripe>
        <el-table-column prop="id" label="流程ID" width="180" />

        <el-table-column prop="currentStep" label="当前步骤" width="100">
          <template #default="{ row }"> 步骤 {{ row.currentStep }} </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getProcessStatusTagType(row.status)">
              {{ getProcessStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="startedAt" label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.startedAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="lastActivityAt" label="最后活动" width="160">
          <template #default="{ row }">
            {{ formatDate(row.lastActivityAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="viewProcess(row)">
                查看详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="filteredProcesses.length === 0" class="no-processes">
        <el-empty description="暂无相关流程" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useDocumentStore } from "@/stores/document";
import { Folder, CircleCheck, Timer } from "@element-plus/icons-vue";
import type {
  ApprovalWorkflow,
  DocumentApprovalProcess,
} from "@/types/document";

// Props
interface Props {
  workflow: ApprovalWorkflow;
}

const props = defineProps<Props>();

// Store
const documentStore = useDocumentStore();

// 响应式数据
const processStatusFilter = ref("");

// 计算属性
const relatedProcesses = computed(() =>
  documentStore.approvalProcesses.filter(
    (p) => p.workflowId === props.workflow.id
  )
);

const filteredProcesses = computed(() => {
  let processes = relatedProcesses.value;

  if (processStatusFilter.value) {
    processes = processes.filter((p) => p.status === processStatusFilter.value);
  }

  return processes.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
});

const usageStats = computed(() => {
  const total = relatedProcesses.value.length;
  const approved = relatedProcesses.value.filter(
    (p) => p.status === "approved"
  ).length;
  const completed = relatedProcesses.value.filter(
    (p) => p.status !== "pending"
  );

  const averageTime =
    completed.length > 0
      ? completed.reduce((total, process) => {
          const startTime = new Date(process.startedAt).getTime();
          const endTime = process.completedAt
            ? new Date(process.completedAt).getTime()
            : new Date().getTime();
          return total + (endTime - startTime) / (1000 * 60 * 60); // 转换为小时
        }, 0) / completed.length
      : 0;

  const successRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return {
    totalProcesses: total,
    successRate,
    averageTime,
  };
});

// 方法
const getTypeText = (type: string) => {
  const typeMap = {
    sequential: "顺序执行",
    parallel: "并行执行",
    conditional: "条件执行",
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getTypeTagType = (type: string) => {
  const typeMap = {
    sequential: "",
    parallel: "success",
    conditional: "warning",
  };
  return typeMap[type as keyof typeof typeMap] || "";
};

const getPriorityText = (priority: string) => {
  const priorityMap = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急",
  };
  return priorityMap[priority as keyof typeof priorityMap] || priority;
};

const getPriorityTagType = (priority: string) => {
  const typeMap = {
    low: "info",
    medium: "",
    high: "warning",
    urgent: "danger",
  };
  return typeMap[priority as keyof typeof typeMap] || "";
};

const getRoleText = (role: string) => {
  const roleMap = {
    admin: "管理员",
    reviewer: "审核员",
    user: "普通用户",
  };
  return roleMap[role as keyof typeof roleMap] || role;
};

const getProcessStatusText = (status: string) => {
  const statusMap = {
    pending: "进行中",
    approved: "已批准",
    rejected: "已拒绝",
    cancelled: "已取消",
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

const getProcessStatusTagType = (status: string) => {
  const typeMap = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    cancelled: "info",
  };
  return typeMap[status as keyof typeof typeMap] || "";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

const formatHours = (hours: number) => {
  if (hours < 1) return "< 1小时";
  if (hours < 24) return `${Math.round(hours)}小时`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
};

const viewProcess = (process: DocumentApprovalProcess) => {
  // 这里可以跳转到流程详情页面或打开详情对话框
  console.log("查看流程详情:", process);
};
</script>

<style scoped>
.workflow-detail {
  padding: 20px;
}

.info-card,
.steps-card,
.usage-card,
.processes-card {
  margin-bottom: 20px;
}

.info-card :deep(.el-card__header),
.steps-card :deep(.el-card__header),
.usage-card :deep(.el-card__header),
.processes-card :deep(.el-card__header) {
  padding: 12px 20px;
  background: #f8f9fa;
}

.info-card h4,
.steps-card h4,
.usage-card h4,
.processes-card h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.text-muted {
  color: #999;
  font-style: italic;
}

/* 步骤详情样式 */
.steps-detail {
  padding: 20px 0;
}

.step-detail {
  display: flex;
  margin-bottom: 30px;
  position: relative;
}

.step-detail:last-child {
  margin-bottom: 0;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.step-line {
  width: 2px;
  height: 50px;
  background: #e4e7ed;
  margin-top: 10px;
}

.step-content {
  flex: 1;
}

.step-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-name {
  font-weight: bold;
  color: #2c3e50;
  font-size: 16px;
}

.step-badges {
  display: flex;
  gap: 6px;
}

.step-info {
  padding: 20px 0;
}

.info-group h6 {
  margin: 0 0 12px 0;
  color: #409eff;
  font-size: 14px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  align-items: flex-start;
  gap: 8px;
}

.info-item .label {
  color: #666;
  min-width: 80px;
  font-size: 14px;
}

.info-item .value {
  flex: 1;
  color: #2c3e50;
  font-size: 14px;
}

.description {
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* 使用统计样式 */
.usage-stat {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.usage-stat .stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  margin-right: 16px;
}

.usage-stat .stat-content {
  flex: 1;
}

.usage-stat .stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.usage-stat .stat-label {
  color: #7f8c8d;
  font-size: 0.9em;
}

/* 相关流程样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no-processes {
  text-align: center;
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-detail {
    padding: 10px;
  }

  .step-detail {
    flex-direction: column;
  }

  .step-indicator {
    flex-direction: row;
    align-items: center;
    margin-right: 0;
    margin-bottom: 16px;
  }

  .step-line {
    width: 50px;
    height: 2px;
    margin-top: 0;
    margin-left: 10px;
  }

  .step-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .step-badges {
    justify-content: flex-start;
  }

  .usage-stat {
    flex-direction: column;
    text-align: center;
  }

  .usage-stat .stat-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
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
