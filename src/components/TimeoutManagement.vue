<template>
  <div class="timeout-management">
    <!-- 操作头部 -->
    <div class="management-header">
      <h3>审批超时管理</h3>
      <div class="header-actions">
        <el-button type="warning" @click="checkAllTimeouts">
          <el-icon><Timer /></el-icon>
          检查超时
        </el-button>
        <el-button @click="refreshTimeouts">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 超时统计 -->
    <el-row :gutter="20" class="timeout-stats">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon unresolved">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ unresolvedTimeouts.length }}</div>
            <div class="stat-label">未解决超时</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon auto-approve">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ autoApproveTimeouts.length }}</div>
            <div class="stat-label">自动批准</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon escalated">
            <el-icon><Top /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ escalatedTimeouts.length }}</div>
            <div class="stat-label">已升级</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon notified">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ notifiedTimeouts.length }}</div>
            <div class="stat-label">已通知</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="解决状态">
          <el-select
            v-model="filterForm.resolved"
            placeholder="选择状态"
            clearable
          >
            <el-option label="未解决" value="false" />
            <el-option label="已解决" value="true" />
          </el-select>
        </el-form-item>

        <el-form-item label="处理动作">
          <el-select
            v-model="filterForm.action"
            placeholder="选择动作"
            clearable
          >
            <el-option label="自动批准" value="auto_approve" />
            <el-option label="自动拒绝" value="auto_reject" />
            <el-option label="升级处理" value="escalate" />
            <el-option label="通知提醒" value="notify" />
          </el-select>
        </el-form-item>

        <el-form-item label="超时时间">
          <el-date-picker
            v-model="filterForm.timeoutDateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item>
          <el-button @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 超时列表 -->
    <el-card class="timeout-list">
      <template #header>
        <div class="list-header">
          <span>超时记录 ({{ filteredTimeouts.length }})</span>
          <div class="batch-actions">
            <el-button
              size="small"
              :disabled="selectedTimeouts.length === 0"
              @click="batchResolve"
            >
              批量解决
            </el-button>
            <el-button
              size="small"
              :disabled="selectedTimeouts.length === 0"
              @click="batchNotify"
            >
              批量通知
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredTimeouts"
        stripe
        @selection-change="handleSelectionChange"
        class="timeout-table"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          prop="processId"
          label="流程ID"
          width="180"
          align="center"
        />

        <el-table-column label="工作流" width="150" align="center">
          <template #default="{ row }">
            {{ getProcessWorkflowName(row.processId) }}
          </template>
        </el-table-column>

        <el-table-column label="当前步骤" width="120" align="center">
          <template #default="{ row }">
            {{ getStepName(row.stepId) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="expectedCompletionTime"
          label="预期完成时间"
          width="160"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDate(row.expectedCompletionTime) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="actualTimeoutTime"
          label="实际超时时间"
          width="160"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDate(row.actualTimeoutTime) }}
          </template>
        </el-table-column>

        <el-table-column label="超时时长" width="100">
          <template #default="{ row }">
            <el-tag :type="getTimeoutSeverityType(row)">
              {{ getTimeoutDuration(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="action" label="处理动作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)" size="small">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="notificationsSent"
          label="通知次数"
          width="100"
        />

        <el-table-column prop="isResolved" label="解决状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isResolved ? 'success' : 'warning'" size="small">
              {{ row.isResolved ? "已解决" : "未解决" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="!row.isResolved"
                size="small"
                @click="sendNotification(row)"
              >
                发送通知
              </el-button>
              <div v-else class="action-placeholder"></div>

              <el-button
                v-if="!row.isResolved && row.action === 'escalate'"
                size="small"
                type="warning"
                @click="escalateProcess(row)"
              >
                升级处理
              </el-button>
              <div v-else class="action-placeholder"></div>

              <el-button
                v-if="!row.isResolved"
                size="small"
                type="success"
                @click="resolveTimeout(row)"
              >
                标记解决
              </el-button>
              <div v-else class="action-placeholder"></div>

              <el-button size="small" @click="viewTimeoutDetail(row)">
                查看详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="filteredTimeouts.length === 0" class="empty-state">
        <el-empty description="暂无超时记录">
          <template #description>
            <span>暂无超时记录</span>
            <br />
            <small style="color: #909399"
              >点击"检查超时"按钮来检查是否有新的超时流程</small
            >
          </template>
          <el-button type="primary" @click="checkAllTimeouts">
            检查超时
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 超时详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="超时详情" width="700px">
      <div v-if="selectedTimeout" class="timeout-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="流程ID">{{
            selectedTimeout.processId
          }}</el-descriptions-item>
          <el-descriptions-item label="步骤ID">{{
            selectedTimeout.stepId
          }}</el-descriptions-item>
          <el-descriptions-item label="预期完成时间">{{
            formatDate(selectedTimeout.expectedCompletionTime)
          }}</el-descriptions-item>
          <el-descriptions-item label="实际超时时间">{{
            formatDate(selectedTimeout.actualTimeoutTime)
          }}</el-descriptions-item>
          <el-descriptions-item label="处理动作">{{
            getActionText(selectedTimeout.action)
          }}</el-descriptions-item>
          <el-descriptions-item label="通知次数">{{
            selectedTimeout.notificationsSent
          }}</el-descriptions-item>
          <el-descriptions-item label="解决状态" :span="2">
            <el-tag :type="selectedTimeout.isResolved ? 'success' : 'warning'">
              {{ selectedTimeout.isResolved ? "已解决" : "未解决" }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="timeout-actions">
          <h4>可执行操作：</h4>
          <div class="action-buttons">
            <el-button
              v-if="!selectedTimeout.isResolved"
              type="primary"
              @click="sendNotification(selectedTimeout)"
            >
              发送通知
            </el-button>

            <el-button
              v-if="
                !selectedTimeout.isResolved &&
                selectedTimeout.action === 'escalate'
              "
              type="warning"
              @click="escalateProcess(selectedTimeout)"
            >
              升级处理
            </el-button>

            <el-button
              v-if="!selectedTimeout.isResolved"
              type="success"
              @click="resolveTimeout(selectedTimeout)"
            >
              标记解决
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 升级处理对话框 -->
    <el-dialog v-model="showEscalateDialog" title="升级处理" width="500px">
      <el-form
        ref="escalateFormRef"
        :model="escalateForm"
        :rules="escalateRules"
        label-width="120px"
      >
        <el-form-item label="升级对象" prop="toUserId">
          <el-select
            v-model="escalateForm.toUserId"
            placeholder="选择升级对象"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="升级原因" prop="reason">
          <el-input
            v-model="escalateForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入升级原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEscalateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEscalate">确认升级</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useDocumentStore } from "@/stores/document";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Timer,
  Refresh,
  Warning,
  CircleCheck,
  Top,
  Bell,
} from "@element-plus/icons-vue";
import type { ApprovalTimeout } from "@/types/document";

// Store
const documentStore = useDocumentStore();
const userStore = useUserStore();

// 响应式数据
const showDetailDialog = ref(false);
const showEscalateDialog = ref(false);
const selectedTimeout = ref<ApprovalTimeout | null>(null);
const selectedTimeouts = ref<ApprovalTimeout[]>([]);
const escalateFormRef = ref();

// 筛选表单
const filterForm = reactive({
  resolved: "",
  action: "",
  timeoutDateRange: null as [string, string] | null,
});

// 升级表单
const escalateForm = reactive({
  toUserId: "",
  reason: "",
});

// 升级表单验证规则
const escalateRules = {
  toUserId: [{ required: true, message: "请选择升级对象", trigger: "change" }],
  reason: [{ required: true, message: "请输入升级原因", trigger: "blur" }],
};

// 计算属性
const filteredTimeouts = computed(() => {
  let timeouts = documentStore.approvalTimeouts;

  // 解决状态筛选
  if (filterForm.resolved) {
    const isResolved = filterForm.resolved === "true";
    timeouts = timeouts.filter((t) => t.isResolved === isResolved);
  }

  // 处理动作筛选
  if (filterForm.action) {
    timeouts = timeouts.filter((t) => t.action === filterForm.action);
  }

  // 时间范围筛选
  if (filterForm.timeoutDateRange) {
    const [startDate, endDate] = filterForm.timeoutDateRange;
    timeouts = timeouts.filter((t) => {
      const timeoutTime = new Date(t.actualTimeoutTime);
      return (
        timeoutTime >= new Date(startDate) && timeoutTime <= new Date(endDate)
      );
    });
  }

  return timeouts.sort(
    (a, b) =>
      new Date(b.actualTimeoutTime).getTime() -
      new Date(a.actualTimeoutTime).getTime()
  );
});

const unresolvedTimeouts = computed(() =>
  documentStore.approvalTimeouts.filter((t) => !t.isResolved)
);

const autoApproveTimeouts = computed(() =>
  documentStore.approvalTimeouts.filter((t) => t.action === "auto_approve")
);

const escalatedTimeouts = computed(() =>
  documentStore.approvalTimeouts.filter((t) => t.action === "escalate")
);

const notifiedTimeouts = computed(() =>
  documentStore.approvalTimeouts.filter((t) => t.action === "notify")
);

const availableUsers = computed(() => {
  const users = userStore.users;
  if (!Array.isArray(users)) {
    console.warn("users不是数组:", users);
    return [];
  }
  return users.filter((u) => u.role === "admin" || u.role === "reviewer");
});

// 方法
const checkAllTimeouts = () => {
  try {
    const overdueProcesses = documentStore.checkOverdueProcesses();
    if (overdueProcesses.length > 0) {
      ElMessage.info(`检查完成，发现 ${overdueProcesses.length} 个超时流程`);
    } else {
      ElMessage.success("检查完成，没有发现超时流程");
    }
  } catch (error) {
    console.error("检查超时流程失败:", error);
    ElMessage.error("检查超时流程失败");
  }
};

const refreshTimeouts = () => {
  ElMessage.success("超时记录已刷新");
};

const applyFilters = () => {
  ElMessage.success(`筛选完成，找到 ${filteredTimeouts.value.length} 条记录`);
};

const resetFilters = () => {
  Object.assign(filterForm, {
    resolved: "",
    action: "",
    timeoutDateRange: null,
  });
  ElMessage.success("筛选条件已重置");
};

const handleSelectionChange = (selection: ApprovalTimeout[]) => {
  selectedTimeouts.value = selection;
};

const batchResolve = () => {
  ElMessageBox.confirm(
    `确定要将选中的 ${selectedTimeouts.value.length} 个超时记录标记为已解决吗？`,
    "批量解决",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      selectedTimeouts.value.forEach((timeout) => {
        documentStore.resolveTimeout(timeout.id);
      });
      ElMessage.success(`已解决 ${selectedTimeouts.value.length} 个超时记录`);
      selectedTimeouts.value = [];
    })
    .catch(() => {
      // 用户取消
    });
};

const batchNotify = () => {
  const unnotifiedCount = selectedTimeouts.value.filter(
    (t) => t.notificationsSent === 0
  ).length;

  ElMessageBox.confirm(
    `确定要向选中的 ${selectedTimeouts.value.length} 个超时记录发送通知吗？其中 ${unnotifiedCount} 个是首次通知。`,
    "批量通知",
    {
      confirmButtonText: "发送",
      cancelButtonText: "取消",
      type: "info",
    }
  )
    .then(() => {
      // 这里应该调用实际的通知发送逻辑
      ElMessage.success(`已发送 ${selectedTimeouts.value.length} 个通知`);
      selectedTimeouts.value = [];
    })
    .catch(() => {
      // 用户取消
    });
};

const sendNotification = (_timeout: ApprovalTimeout) => {
  ElMessageBox.confirm("确定要发送超时通知吗？", "发送通知", {
    confirmButtonText: "发送",
    cancelButtonText: "取消",
    type: "info",
  })
    .then(() => {
      // 这里应该调用实际的通知发送逻辑
      // 更新通知次数
      // documentStore.updateTimeout(timeout.id, {
      //   ...timeout,
      //   notificationsSent: timeout.notificationsSent + 1,
      // });
      ElMessage.success("通知已发送");
    })
    .catch(() => {
      // 用户取消
    });
};

const escalateProcess = (timeout: ApprovalTimeout) => {
  selectedTimeout.value = timeout;
  escalateForm.reason = `流程超时 ${getTimeoutDuration(timeout)}，需要升级处理`;
  showEscalateDialog.value = true;
};

const handleEscalate = async () => {
  try {
    const valid = await escalateFormRef.value?.validate();
    if (!valid) return;

    const targetUser = availableUsers.value.find(
      (u) => u.id === parseInt(escalateForm.toUserId)
    );
    if (!targetUser) {
      ElMessage.error("升级对象不存在");
      return;
    }

    // 调用升级方法
    documentStore.escalateApproval(
      selectedTimeout.value!.processId,
      1, // 这里应该是当前用户ID
      parseInt(escalateForm.toUserId),
      escalateForm.reason
    );

    // 标记超时为已解决
    documentStore.resolveTimeout(selectedTimeout.value!.id);

    ElMessage.success(`已升级至 ${targetUser.realName}`);
    showEscalateDialog.value = false;

    // 重置表单
    Object.assign(escalateForm, {
      toUserId: "",
      reason: "",
    });
  } catch (error) {
    ElMessage.error("升级失败: " + (error as Error).message);
  }
};

const resolveTimeout = (timeout: ApprovalTimeout) => {
  ElMessageBox.confirm("确定要将此超时记录标记为已解决吗？", "标记解决", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "success",
  })
    .then(() => {
      documentStore.resolveTimeout(timeout.id);
      ElMessage.success("已标记为解决");
    })
    .catch(() => {
      // 用户取消
    });
};

const viewTimeoutDetail = (timeout: ApprovalTimeout) => {
  selectedTimeout.value = timeout;
  showDetailDialog.value = true;
};

// 辅助函数
const getProcessWorkflowName = (processId: string) => {
  const process = documentStore.approvalProcesses.find(
    (p) => p.id === processId
  );
  if (!process) return "未知流程";

  const workflow = documentStore.approvalWorkflows.find(
    (w) => w.id === process.workflowId
  );
  return workflow?.name || "未知工作流";
};

const getStepName = (stepId: string) => {
  for (const workflow of documentStore.approvalWorkflows) {
    const step = workflow.steps.find((s) => s.id === stepId);
    if (step) return step.name;
  }
  return "未知步骤";
};

const getTimeoutDuration = (timeout: ApprovalTimeout) => {
  const expected = new Date(timeout.expectedCompletionTime);
  const actual = new Date(timeout.actualTimeoutTime);
  const diffHours = (actual.getTime() - expected.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) return `${Math.round(diffHours)}小时`;

  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = Math.round(diffHours % 24);

  return remainingHours > 0
    ? `${diffDays}天${remainingHours}小时`
    : `${diffDays}天`;
};

const getTimeoutSeverityType = (timeout: ApprovalTimeout) => {
  const expected = new Date(timeout.expectedCompletionTime);
  const actual = new Date(timeout.actualTimeoutTime);
  const diffHours = (actual.getTime() - expected.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 24) return "warning";
  if (diffHours <= 72) return "danger";
  return "info";
};

const getActionText = (action: string) => {
  const actionMap = {
    auto_approve: "自动批准",
    auto_reject: "自动拒绝",
    escalate: "升级处理",
    notify: "通知提醒",
  };
  return actionMap[action as keyof typeof actionMap] || action;
};

const getActionTagType = (action: string) => {
  const typeMap = {
    auto_approve: "success",
    auto_reject: "danger",
    escalate: "warning",
    notify: "info",
  };
  return typeMap[action as keyof typeof typeMap] || "";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
  // 页面加载时检查超时
  checkAllTimeouts();

  // 如果没有数据，尝试初始化
  if (documentStore.approvalTimeouts.length === 0) {
    console.log("没有超时数据，尝试初始化示例数据");
    // 这里可以调用store的初始化方法
  }
});
</script>

<style scoped>
.timeout-management {
  padding: 20px;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.management-header h3 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.timeout-stats {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  height: 100%;
  min-height: 120px;
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
  flex-shrink: 0;
}

.stat-icon.unresolved {
  background: linear-gradient(45deg, #ff6b6b 0%, #ee5a24 100%);
}

.stat-icon.auto-approve {
  background: linear-gradient(45deg, #56ab2f 0%, #a8e6cf 100%);
}

.stat-icon.escalated {
  background: linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%);
}

.stat-icon.notified {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
  text-align: left;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9em;
  font-weight: 500;
  text-align: left;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-card .el-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-card .el-form-item {
  margin-bottom: 0;
  margin-right: 0;
}

.filter-card .el-form-item__label {
  font-weight: 500;
  color: #606266;
}

.timeout-table {
  width: 100%;
}

.timeout-table .el-table__header-wrapper {
  background-color: #f5f7fa;
}

.timeout-table .el-table__header th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  text-align: center;
}

.timeout-table .el-table__body td {
  text-align: center;
  vertical-align: middle;
}

.timeout-table .el-table__body td:first-child {
  text-align: center;
}

.timeout-table .el-table__body td:last-child {
  text-align: center;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.batch-actions .el-button {
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background-color: #fafafa;
  border-radius: 8px;
  margin: 20px 0;
}

.empty-state .el-empty__description {
  margin-top: 16px;
}

.timeout-detail {
  padding: 20px 0;
}

.timeout-actions {
  margin-top: 30px;
}

.timeout-actions h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
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

.action-buttons-container {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

.action-btn {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 8px 12px !important;
  box-sizing: border-box !important;
  flex-shrink: 0 !important;
}

/* 占位符样式，保持布局一致 */
.action-placeholder {
  height: 32px;
  width: 100%;
  flex-shrink: 0;
}

/* 强制覆盖Element Plus的默认样式 */
.el-table .el-table__cell .action-buttons-container,
.el-table .el-table__cell .action-buttons-container * {
  box-sizing: border-box !important;
}

/* 确保操作列内容不会溢出 */
.el-table .el-table__cell .action-buttons-container {
  max-width: 100% !important;
  overflow: hidden !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .timeout-stats .el-col {
    margin-bottom: 16px;
  }

  .stat-card {
    min-height: 100px;
  }

  .stat-number {
    font-size: 2em;
  }
}

@media (max-width: 768px) {
  .timeout-stats .el-col {
    margin-bottom: 12px;
  }

  .stat-card {
    padding: 16px;
    min-height: 90px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
    margin-right: 12px;
  }

  .stat-number {
    font-size: 1.8em;
  }

  .filter-card .el-form {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-card .el-form-item {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .timeout-management {
    padding: 10px;
  }

  .management-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .batch-actions {
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons-container {
    gap: 6px;
  }

  .action-btn {
    font-size: 12px;
    padding: 6px 8px;
  }
}
</style>
