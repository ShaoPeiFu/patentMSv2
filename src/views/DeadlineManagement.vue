<template>
  <div class="deadline-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>期限管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDeadlineDialog = true">
          <el-icon><Plus /></el-icon>
          添加期限
        </el-button>
        <el-button @click="showBatchOperationDialog = true">
          <el-icon><Operation /></el-icon>
          批量操作
        </el-button>
        <el-button @click="showCalendarView = true">
          <el-icon><Calendar /></el-icon>
          日历视图
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics.total }}</div>
                <div class="stat-label">总期限数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics.overdue }}</div>
                <div class="stat-label">已逾期</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ urgentReminders.length }}</div>
                <div class="stat-label">紧急提醒</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" type="card">
        <!-- 期限记录 -->
        <el-tab-pane label="期限记录" name="deadlines">
          <div class="tab-content">
            <!-- 搜索和筛选 -->
            <div class="search-section">
              <el-form :model="searchForm" inline>
                <el-form-item label="专利号">
                  <el-input
                    v-model="searchForm.patentNumber"
                    placeholder="输入专利号"
                    clearable
                  />
                </el-form-item>
                <el-form-item label="期限类型">
                  <el-select
                    v-model="searchForm.deadlineType"
                    placeholder="选择期限类型"
                    clearable
                  >
                    <el-option label="申请期限" value="application" />
                    <el-option label="审查期限" value="examination" />
                    <el-option label="年费期限" value="maintenance" />
                    <el-option label="续展期限" value="renewal" />
                    <el-option label="优先权期限" value="priority" />
                    <el-option label="延期期限" value="extension" />
                    <el-option label="更正期限" value="correction" />
                    <el-option label="异议期限" value="opposition" />
                    <el-option label="上诉期限" value="appeal" />
                    <el-option label="其他期限" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态">
                  <el-select
                    v-model="searchForm.status"
                    placeholder="选择状态"
                    clearable
                  >
                    <el-option label="待处理" value="pending" />
                    <el-option label="已完成" value="completed" />
                    <el-option label="已逾期" value="overdue" />
                    <el-option label="已取消" value="cancelled" />
                    <el-option label="已延期" value="extended" />
                  </el-select>
                </el-form-item>
                <el-form-item label="风险等级">
                  <el-select
                    v-model="searchForm.riskLevel"
                    placeholder="选择风险等级"
                    clearable
                  >
                    <el-option label="低风险" value="low" />
                    <el-option label="中风险" value="medium" />
                    <el-option label="高风险" value="high" />
                    <el-option label="严重风险" value="critical" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSearch"
                    >搜索</el-button
                  >
                  <el-button @click="handleReset">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 期限记录表格 -->
            <el-table
              :data="filteredDeadlines"
              v-loading="loading"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="patentNumber" label="专利号" width="150" />
              <el-table-column
                prop="patentTitle"
                label="专利标题"
                min-width="200"
              />
              <el-table-column prop="deadlineType" label="期限类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getDeadlineTypeTag(row.deadlineType)">
                    {{ getDeadlineTypeText(row.deadlineType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="deadlineDate"
                label="期限日期"
                width="120"
              />
              <el-table-column
                prop="daysUntilDeadline"
                label="剩余天数"
                width="100"
              >
                <template #default="{ row }">
                  <span :class="getDaysClass(calculateDaysUntilDeadline(row.deadlineDate))">
                    {{
                      calculateDaysUntilDeadline(row.deadlineDate) > 0
                        ? `${calculateDaysUntilDeadline(row.deadlineDate)}天`
                        : `逾期${Math.abs(calculateDaysUntilDeadline(row.deadlineDate))}天`
                    }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="riskLevel" label="风险等级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getRiskType(row.riskLevel)">
                    {{ getRiskText(row.riskLevel) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="priority" label="优先级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getPriorityType(row.priority)">
                    {{ getPriorityText(row.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="editDeadline(row)"
                    >编辑</el-button
                  >
                  <el-button
                    size="small"
                    type="success"
                    v-if="row.status === 'pending'"
                    @click="completeDeadline(row.id)"
                  >
                    标记完成
                  </el-button>
                  <el-button
                    size="small"
                    type="warning"
                    v-if="row.status === 'pending'"
                    @click="extendDeadline(row.id)"
                  >
                    延期
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteDeadline(row.id)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 智能提醒 -->
        <el-tab-pane label="智能提醒" name="reminders">
          <div class="tab-content">
            <div class="reminders-header">
              <h3>智能提醒 ({{ urgentReminders.length }} 个紧急提醒)</h3>
              <el-button @click="markAllRemindersAsRead"
                >全部标记为已读</el-button
              >
            </div>

            <div class="reminders-list">
              <el-card
                v-for="reminder in smartReminders"
                :key="reminder.id"
                class="reminder-card"
                :class="reminder.reminderLevel"
              >
                <div class="reminder-content">
                  <div class="reminder-info">
                    <h4>{{ reminder.patentTitle }}</h4>
                    <p class="patent-number">{{ reminder.patentNumber }}</p>
                    <p class="reminder-message">{{ reminder.message }}</p>
                    <p class="scheduled-date">
                      提醒时间: {{ reminder.scheduledDate }}
                      <span
                        class="reminder-status"
                        :class="reminder.reminderLevel"
                      >
                        {{ getReminderLevelText(reminder.reminderLevel) }}
                      </span>
                    </p>
                  </div>
                  <div class="reminder-actions">
                    <el-button
                      size="small"
                      type="primary"
                      @click="handleReminderAction(reminder)"
                    >
                      处理提醒
                    </el-button>
                    <el-button
                      size="small"
                      @click="markReminderAsRead(reminder.id)"
                      v-if="!reminder.isRead"
                    >
                      标记已读
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 批量操作 -->
        <el-tab-pane label="批量操作" name="batch">
          <div class="tab-content">
            <div class="batch-header">
              <h3>批量操作</h3>
              <el-button
                type="primary"
                @click="showBatchOperationDialog = true"
              >
                创建批量操作
              </el-button>
            </div>

            <div class="batch-operations">
              <el-table :data="batchOperations" stripe>
                <el-table-column
                  prop="operationType"
                  label="操作类型"
                  width="120"
                >
                  <template #default="{ row }">
                    <el-tag :type="getBatchOperationType(row.operationType)">
                      {{ getBatchOperationText(row.operationType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getBatchStatusType(row.status)">
                      {{ getBatchStatusText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="progress" label="进度" width="200">
                  <template #default="{ row }">
                    <el-progress :percentage="row.progress" />
                  </template>
                </el-table-column>
                <el-table-column
                  prop="createdAt"
                  label="创建时间"
                  width="150"
                />
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button
                      size="small"
                      @click="executeBatchOperation(row.id)"
                      v-if="row.status === 'pending'"
                    >
                      执行
                    </el-button>
                    <el-button size="small" @click="viewBatchResult(row)"
                      >查看结果</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加期限对话框 -->
    <el-dialog v-model="showAddDeadlineDialog" title="添加期限" width="600px">
      <DeadlineForm
        v-if="showAddDeadlineDialog"
        @submit="handleAddDeadline"
        @cancel="showAddDeadlineDialog = false"
      />
    </el-dialog>

    <!-- 编辑期限对话框 -->
    <el-dialog v-model="showEditDeadlineDialog" title="编辑期限" width="600px">
      <DeadlineForm
        v-if="showEditDeadlineDialog && editingDeadline"
        :initial-data="editingDeadline"
        @submit="handleEditDeadline"
        @cancel="showEditDeadlineDialog = false"
      />
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="showBatchOperationDialog"
      title="批量操作"
      width="500px"
    >
      <BatchOperationForm
        v-if="showBatchOperationDialog"
        @submit="handleBatchOperation"
        @cancel="showBatchOperationDialog = false"
      />
    </el-dialog>

    <!-- 日历视图对话框 -->
    <el-dialog
      v-model="showCalendarView"
      title="日历视图"
      width="80%"
      top="5vh"
    >
      <CalendarView
        v-if="showCalendarView"
        :events="calendarEvents"
        @event-click="handleCalendarEventClick"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDeadlineStore } from "@/stores/deadline";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Operation,
  Calendar,
  Warning,
  Clock,
  Check,
  Bell,
} from "@element-plus/icons-vue";
import type {
  DeadlineRecord,
  SmartReminder,
  CalendarEvent,
  BatchOperation,
} from "@/types/deadline";
import DeadlineForm from "@/components/deadlines/DeadlineForm.vue";
import BatchOperationForm from "@/components/deadlines/BatchOperationForm.vue";

import CalendarView from "@/components/deadlines/CalendarView.vue";

const deadlineStore = useDeadlineStore();

// 响应式数据
const activeTab = ref("deadlines");
const loading = ref(false);
const showAddDeadlineDialog = ref(false);
const showEditDeadlineDialog = ref(false);
const showBatchOperationDialog = ref(false);

const showCalendarView = ref(false);
const editingDeadline = ref<DeadlineRecord | null>(null);

// 搜索表单
const searchForm = ref({
  patentNumber: "",
  deadlineType: "",
  status: "",
  riskLevel: "",
});

// 计算属性
const statistics = computed(() => deadlineStore.statistics);
const deadlineRecords = computed(() => deadlineStore.deadlineRecords);
const smartReminders = computed(() => deadlineStore.smartReminders);
const calendarEvents = computed(() => deadlineStore.calendarEvents);

const batchOperations = computed(() => deadlineStore.batchOperations);
const urgentReminders = computed(() => deadlineStore.urgentReminders);

const filteredDeadlines = computed(() => {
  let filtered = [...deadlineRecords.value];

  if (searchForm.value.patentNumber) {
    filtered = filtered.filter((deadline) =>
      deadline.patentNumber
        .toLowerCase()
        .includes(searchForm.value.patentNumber.toLowerCase())
    );
  }

  if (searchForm.value.deadlineType) {
    filtered = filtered.filter(
      (deadline) => deadline.deadlineType === searchForm.value.deadlineType
    );
  }

  if (searchForm.value.status) {
    filtered = filtered.filter(
      (deadline) => deadline.status === searchForm.value.status
    );
  }

  if (searchForm.value.riskLevel) {
    filtered = filtered.filter(
      (deadline) => deadline.riskLevel === searchForm.value.riskLevel
    );
  }

  return filtered;
});

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const handleReset = () => {
  searchForm.value = {
    patentNumber: "",
    deadlineType: "",
    status: "",
    riskLevel: "",
  };
};

const handleAddDeadline = async (deadlineData: any) => {
  try {
    await deadlineStore.addDeadlineRecord(deadlineData);
    ElMessage.success("期限记录添加成功");
    showAddDeadlineDialog.value = false;
    // 刷新数据
    await deadlineStore.loadDeadlineRecords();
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const editDeadline = (deadline: DeadlineRecord) => {
  console.log("编辑期限数据:", deadline);
  // 自动填充专利信息
  editingDeadline.value = {
    ...deadline,
    patentNumber: deadline.patentNumber,
    patentTitle: deadline.patentTitle,
    deadlineType: deadline.deadlineType,
    deadlineDate: deadline.deadlineDate,
    priority: deadline.priority,
    status: deadline.status,
    riskLevel: deadline.riskLevel,
    description: deadline.description,
    notes: deadline.notes,
  };
  console.log("设置编辑数据:", editingDeadline.value);
  showEditDeadlineDialog.value = true;
};

const handleEditDeadline = async (deadlineData: any) => {
  try {
    if (editingDeadline.value) {
      await deadlineStore.updateDeadlineRecord(
        editingDeadline.value.id,
        deadlineData
      );
      ElMessage.success("期限记录更新成功");
      showEditDeadlineDialog.value = false;
      editingDeadline.value = null;
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

const completeDeadline = async (id: number) => {
  try {
    await deadlineStore.updateDeadlineRecord(id, {
      status: "completed",
      isCompleted: true,
      completedDate: new Date().toISOString(),
    });
    ElMessage.success("期限标记为已完成");
    // 刷新数据
    await deadlineStore.loadDeadlineRecords();
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const extendDeadline = async (id: number) => {
  try {
    const { value: days } = await ElMessageBox.prompt(
      "请输入延期天数",
      "延期期限",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^\d+$/,
        inputErrorMessage: "请输入有效的天数",
      }
    );

    if (days) {
      // 直接调用store的updateDeadlineRecord方法
      const deadline = deadlineStore.deadlineRecords.find((d) => d.id === id);
      if (deadline) {
        const newDate = new Date(deadline.deadlineDate);
        newDate.setDate(newDate.getDate() + parseInt(days));

        await deadlineStore.updateDeadlineRecord(id, {
          deadlineDate: newDate.toISOString().split("T")[0],
          status: "extended",
          daysUntilDeadline: Math.ceil(
            (newDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        });

        ElMessage.success("期限延期成功");
        // 刷新数据
        await deadlineStore.loadDeadlineRecords();
      } else {
        ElMessage.error("未找到指定的期限记录");
      }
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("延期失败:", error);
      ElMessage.error(
        "延期失败: " + (error instanceof Error ? error.message : "未知错误")
      );
    }
  }
};

const deleteDeadline = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个期限吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await deadlineStore.deleteDeadlineRecord(id);
    ElMessage.success("删除成功");
    // 刷新数据
    await deadlineStore.loadDeadlineRecords();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const markAllRemindersAsRead = async () => {
  try {
    for (const reminder of smartReminders.value) {
      if (!reminder.isRead) {
        await deadlineStore.markReminderAsRead(reminder.id);
      }
    }
    ElMessage.success("全部标记为已读");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const handleReminderAction = (reminder: SmartReminder) => {
  // 实现提醒处理逻辑
  console.log("处理提醒:", reminder);
};

const markReminderAsRead = async (id: number) => {
  try {
    await deadlineStore.markReminderAsRead(id);
    ElMessage.success("标记为已读");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

const handleBatchOperation = async (operationData: any) => {
  try {
    const operation = await deadlineStore.createBatchOperation(operationData);
    await deadlineStore.executeBatchOperation(operation.id);
    ElMessage.success("批量操作创建成功");
    showBatchOperationDialog.value = false;
  } catch (error) {
    ElMessage.error("批量操作失败");
  }
};

const executeBatchOperation = async (id: number) => {
  try {
    await deadlineStore.executeBatchOperation(id);
    ElMessage.success("批量操作执行成功");
  } catch (error) {
    ElMessage.error("批量操作执行失败");
  }
};

const viewBatchResult = (operation: BatchOperation) => {
  // 实现查看批量操作结果逻辑
  console.log("查看批量操作结果:", operation);
};

const handleCalendarEventClick = (event: CalendarEvent) => {
  // 实现日历事件点击处理逻辑
  console.log("日历事件点击:", event);
};

// 辅助方法
const getDeadlineTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    application: "primary",
    examination: "warning",
    maintenance: "danger",
    renewal: "success",
    priority: "info",
    extension: "warning",
    correction: "info",
    opposition: "warning",
    appeal: "danger",
    other: "info",
  };
  return tags[type] || "info";
};

const getDeadlineTypeText = (type: string) => {
  const texts: Record<string, string> = {
    application: "申请期限",
    examination: "审查期限",
    maintenance: "年费期限",
    renewal: "续展期限",
    priority: "优先权期限",
    extension: "延期期限",
    correction: "更正期限",
    opposition: "异议期限",
    appeal: "上诉期限",
    other: "其他期限",
  };
  return texts[type] || type;
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "warning",
    completed: "success",
    overdue: "danger",
    cancelled: "info",
    extended: "primary",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待处理",
    completed: "已完成",
    overdue: "已逾期",
    cancelled: "已取消",
    extended: "已延期",
  };
  return texts[status] || status;
};

const getRiskType = (riskLevel: string) => {
  const types: Record<string, string> = {
    low: "success",
    medium: "warning",
    high: "danger",
    critical: "danger",
  };
  return types[riskLevel] || "info";
};

const getRiskText = (riskLevel: string) => {
  const texts: Record<string, string> = {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    critical: "严重风险",
  };
  return texts[riskLevel] || riskLevel;
};

const getPriorityType = (priority: string) => {
  const types: Record<string, string> = {
    high: "danger",
    medium: "warning",
    low: "success",
  };
  return types[priority] || "info";
};

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级",
  };
  return texts[priority] || priority;
};

// 计算剩余天数
const calculateDaysUntilDeadline = (deadlineDate: string) => {
  const today = new Date();
  const deadline = new Date(deadlineDate);
  const diffTime = deadline.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDaysClass = (days: number) => {
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "warning";
  return "normal";
};

const getReminderLevelText = (level: string) => {
  const texts: Record<string, string> = {
    info: "信息提醒",
    warning: "警告提醒",
    urgent: "紧急提醒",
    critical: "严重逾期",
  };
  return texts[level] || level;
};

const getBatchOperationType = (type: string) => {
  const types: Record<string, string> = {
    extend: "warning",
    complete: "success",
    cancel: "danger",
    remind: "info",
  };
  return types[type] || "info";
};

const getBatchOperationText = (type: string) => {
  const texts: Record<string, string> = {
    extend: "批量延期",
    complete: "批量完成",
    cancel: "批量取消",
    remind: "批量提醒",
  };
  return texts[type] || type;
};

const getBatchStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "warning",
    processing: "primary",
    completed: "success",
    failed: "danger",
  };
  return types[status] || "info";
};

const getBatchStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待执行",
    processing: "执行中",
    completed: "已完成",
    failed: "执行失败",
  };
  return texts[status] || status;
};

// 生命周期
onMounted(async () => {
  loading.value = true;
  try {
    await deadlineStore.loadDeadlineRecords();
    await deadlineStore.loadSmartReminders();
    await deadlineStore.loadCalendarEvents();
    await deadlineStore.loadRiskAssessments();
  } catch (error) {
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.deadline-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.8em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

/* 剩余天数样式 */
.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.urgent {
  color: #e6a23c;
  font-weight: bold;
}

.warning {
  color: #f56c6c;
  font-weight: bold;
}

.normal {
  color: #409eff;
  font-weight: bold;
}

.main-content {
  margin-bottom: 20px;
}

.tab-content {
  padding: 20px 0;
}

.search-section {
  margin-bottom: 20px;
}

.reminders-header,
.risks-header,
.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.reminders-header h3,
.risks-header h3,
.batch-header h3 {
  margin: 0;
  color: #2c3e50;
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reminder-card {
  border-left: 4px solid;
}

.reminder-card.info {
  border-left-color: #409eff;
}

.reminder-card.warning {
  border-left-color: #e6a23c;
}

.reminder-card.urgent {
  border-left-color: #f56c6c;
}

.reminder-card.critical {
  border-left-color: #ff0000;
}

.reminder-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reminder-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.patent-number {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 0.9em;
}

.reminder-message {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.scheduled-date {
  margin: 0;
  color: #666;
  font-size: 0.9em;
}

.reminder-status {
  margin-left: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8em;
}

.reminder-status.info {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.reminder-status.warning {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.reminder-status.urgent {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.reminder-status.critical {
  background: rgba(255, 0, 0, 0.1);
  color: #ff0000;
}

.reminder-actions {
  display: flex;
  gap: 10px;
}

.risk-summary {
  margin-bottom: 30px;
}

.risk-card {
  text-align: center;
  padding: 20px;
}

.risk-card.low {
  border-left: 4px solid #67c23a;
}

.risk-card.medium {
  border-left: 4px solid #e6a23c;
}

.risk-card.high {
  border-left: 4px solid #f56c6c;
}

.risk-card.critical {
  border-left: 4px solid #ff0000;
}

.risk-card h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.risk-count {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
}

.risk-assessments h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.batch-operations {
  margin-top: 20px;
}

/* 剩余天数样式 */
.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.urgent {
  color: #e6a23c;
  font-weight: bold;
}

.warning {
  color: #409eff;
  font-weight: bold;
}

.normal {
  color: #67c23a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .reminder-content {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .reminder-actions {
    justify-content: center;
  }
}
</style>
