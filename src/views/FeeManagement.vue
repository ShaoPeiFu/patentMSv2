<template>
  <div class="fee-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>费用管理</h1>
      <div class="header-actions">
        <el-button
          type="primary"
          @click="showAddFeeDialog = true"
          v-if="canEdit"
        >
          <el-icon><Plus /></el-icon>
          添加费用
        </el-button>
        <el-button @click="activeTab = 'budgets'">
          <el-icon><Money /></el-icon>
          预算管理
        </el-button>
        <el-button @click="activeTab = 'reconciliation'">
          <el-icon><DocumentIcon /></el-icon>
          财务对账
        </el-button>
      </div>
    </div>

    <!-- 权限提示 -->
    <div v-if="!canEdit" class="permission-notice">
      <el-alert
        title="权限提示"
        type="info"
        description="您当前为普通用户，只能查看费用记录。编辑、添加和标记已缴费等操作需要管理员权限。"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics.totalFees }}</div>
                <div class="stat-label">总费用记录</div>
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
                <div class="stat-number">{{ statistics.paidFees }}</div>
                <div class="stat-label">已缴费</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ statistics.pendingFees }}</div>
                <div class="stat-label">待缴费</div>
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
                <div class="stat-number">{{ statistics.overdueFees }}</div>
                <div class="stat-label">逾期费用</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" type="card">
        <!-- 费用记录 -->
        <el-tab-pane label="费用记录" name="records">
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
                <el-form-item label="费用类型">
                  <el-select
                    v-model="searchForm.feeType"
                    placeholder="选择费用类型"
                    clearable
                  >
                    <el-option label="申请费" value="application" />
                    <el-option label="审查费" value="examination" />
                    <el-option label="年费" value="maintenance" />
                    <el-option label="续展费" value="renewal" />
                    <el-option label="优先权费" value="priority" />
                    <el-option label="延期费" value="extension" />
                    <el-option label="更正费" value="correction" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态">
                  <el-select
                    v-model="searchForm.status"
                    placeholder="选择状态"
                    clearable
                  >
                    <el-option label="待缴费" value="pending" />
                    <el-option label="已缴费" value="paid" />
                    <el-option label="逾期" value="overdue" />
                    <el-option label="减免" value="waived" />
                    <el-option label="已退款" value="refunded" />
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

            <!-- 费用记录表格 -->
            <el-table
              :data="filteredFeeRecords"
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
              <el-table-column prop="feeType" label="费用类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getFeeTypeTag(row.feeType)">
                    {{ getFeeTypeText(row.feeType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="120">
                <template #default="{ row }"> ¥{{ row.amount }} </template>
              </el-table-column>
              <el-table-column prop="dueDate" label="到期日期" width="120" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    @click="editFeeRecord(row)"
                    v-if="canEdit"
                    >编辑</el-button
                  >
                  <el-button
                    size="small"
                    type="success"
                    v-if="row.status === 'pending' && canMarkAsPaid"
                    @click="markAsPaid(row)"
                  >
                    标记已缴费
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteFeeRecord(row.id)"
                    v-if="canEdit"
                  >
                    删除
                  </el-button>
                  <el-tag v-if="!canEdit" type="info" size="small"
                    >仅管理员可操作</el-tag
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 缴费提醒 -->
        <el-tab-pane label="缴费提醒" name="reminders">
          <div class="tab-content">
            <div class="reminders-header">
              <h3>缴费提醒 ({{ overdueReminders.length }} 个紧急提醒)</h3>
              <el-button @click="markAllAsRead">全部标记为已读</el-button>
            </div>

            <div class="reminders-list">
              <el-card
                v-for="reminder in feeReminders"
                :key="reminder.id"
                class="reminder-card"
                :class="reminder.level"
              >
                <div class="reminder-content">
                  <div class="reminder-info">
                    <h4>{{ reminder.patentTitle }}</h4>
                    <p class="patent-number">{{ reminder.patentNumber }}</p>
                    <p class="fee-info">
                      {{ getFeeTypeText(reminder.feeType) }} - ¥{{
                        reminder.amount
                      }}
                    </p>
                    <p class="due-info">
                      到期日期: {{ reminder.dueDate }}
                      <span class="days-left" :class="reminder.level">
                        {{
                          reminder.daysUntilDue > 0
                            ? `还有 ${reminder.daysUntilDue} 天`
                            : `已逾期 ${Math.abs(reminder.daysUntilDue)} 天`
                        }}
                      </span>
                    </p>
                  </div>
                  <div class="reminder-actions">
                    <el-button
                      size="small"
                      type="primary"
                      @click="markAsPaidFromReminder(reminder)"
                      v-if="canMarkAsPaid"
                    >
                      标记已缴费
                    </el-button>
                    <el-button
                      size="small"
                      @click="markReminderAsRead(reminder.id)"
                      v-if="!reminder.isRead"
                    >
                      标记已读
                    </el-button>
                    <el-tag v-if="!canMarkAsPaid" type="info" size="small"
                      >仅管理员可操作</el-tag
                    >
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 预算管理 -->
        <el-tab-pane label="预算管理" name="budgets">
          <div class="tab-content">
            <div class="budgets-header">
              <h3>费用预算</h3>
              <el-button
                type="primary"
                @click="showAddBudgetDialog = true"
                v-if="canEdit"
              >
                添加预算
              </el-button>
            </div>

            <div class="budgets-grid">
              <el-card
                v-for="budget in activeBudgets"
                :key="budget.id"
                class="budget-card"
                v-loading="loading"
              >
                <div class="budget-header">
                  <h4>{{ budget.name }}</h4>
                  <el-tag :type="budget.isActive ? 'success' : 'info'">
                    {{ budget.isActive ? "活跃" : "非活跃" }}
                  </el-tag>
                </div>
                <div class="budget-info">
                  <p class="budget-period">
                    {{ budget.startDate }} 至 {{ budget.endDate }}
                  </p>
                  <p class="budget-description">{{ budget.description }}</p>
                </div>
                <div class="budget-progress">
                  <div class="budget-amounts">
                    <span>总预算: ¥{{ budget.amount }}</span>
                    <span>已使用: ¥{{ budget.spentAmount }}</span>
                    <span>剩余: ¥{{ budget.remainingAmount }}</span>
                  </div>
                  <el-progress
                    :percentage="(budget.spentAmount / budget.amount) * 100"
                    :color="
                      getProgressColor(budget.spentAmount / budget.amount)
                    "
                  />
                </div>
                <div class="budget-actions">
                  <el-button
                    size="small"
                    @click="editBudget(budget)"
                    v-if="canEdit"
                    >编辑</el-button
                  >
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteBudget(budget.id)"
                    v-if="canEdit"
                  >
                    删除
                  </el-button>
                  <el-tag v-if="!canEdit" type="info" size="small"
                    >仅管理员可操作</el-tag
                  >
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 财务对账 -->
        <el-tab-pane label="财务对账" name="reconciliation">
          <div class="tab-content">
            <div class="reconciliation-header">
              <h3>财务对账记录</h3>
              <el-button
                type="primary"
                @click="showAddReconciliationDialog = true"
                v-if="canEdit"
              >
                添加对账记录
              </el-button>
            </div>

            <el-table
              :data="reconciliationRecords"
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
              <el-table-column prop="feeType" label="费用类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getFeeTypeTag(row.feeType)">
                    {{ getFeeTypeText(row.feeType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="预期金额" width="120">
                <template #default="{ row }">
                  ¥{{ row.expectedAmount }}
                </template>
              </el-table-column>
              <el-table-column label="实际金额" width="120">
                <template #default="{ row }">
                  ¥{{ row.actualAmount }}
                </template>
              </el-table-column>
              <el-table-column label="差异" width="120">
                <template #default="{ row }">
                  <span :class="row.difference >= 0 ? 'positive' : 'negative'">
                    {{ row.difference >= 0 ? "+" : "" }}¥{{ row.difference }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getReconciliationStatusType(row.status)">
                    {{ getReconciliationStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    @click="editReconciliation(row)"
                    v-if="canEdit"
                    >编辑</el-button
                  >
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteReconciliation(row.id)"
                    v-if="canEdit"
                  >
                    删除
                  </el-button>
                  <el-tag v-if="!canEdit" type="info" size="small"
                    >仅管理员可操作</el-tag
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加费用对话框 -->
    <el-dialog v-model="showAddFeeDialog" title="添加费用记录" width="600px">
      <FeeForm
        v-if="showAddFeeDialog"
        @submit="handleAddFee"
        @cancel="showAddFeeDialog = false"
      />
    </el-dialog>

    <!-- 编辑费用对话框 -->
    <el-dialog v-model="showEditFeeDialog" title="编辑费用记录" width="600px">
      <FeeForm
        v-if="showEditFeeDialog && editingFee"
        :initial-data="editingFee"
        @submit="handleEditFee"
        @cancel="showEditFeeDialog = false"
      />
    </el-dialog>

    <!-- 添加预算对话框 -->
    <el-dialog v-model="showAddBudgetDialog" title="添加预算" width="500px">
      <BudgetForm
        v-if="showAddBudgetDialog"
        @submit="handleAddBudget"
        @cancel="showAddBudgetDialog = false"
      />
    </el-dialog>

    <!-- 添加对账记录对话框 -->
    <el-dialog
      v-model="showAddReconciliationDialog"
      title="添加对账记录"
      width="600px"
    >
      <ReconciliationForm
        v-if="showAddReconciliationDialog"
        @submit="handleAddReconciliation"
        @cancel="showAddReconciliationDialog = false"
      />
    </el-dialog>

    <!-- 编辑预算对话框 -->
    <el-dialog v-model="showEditBudgetDialog" title="编辑预算" width="500px">
      <BudgetForm
        v-if="showEditBudgetDialog && editingBudget"
        :initial-data="editingBudget"
        @submit="handleEditBudget"
        @cancel="showEditBudgetDialog = false"
      />
    </el-dialog>

    <!-- 编辑对账记录对话框 -->
    <el-dialog
      v-model="showEditReconciliationDialog"
      title="编辑对账记录"
      width="600px"
    >
      <ReconciliationForm
        v-if="showEditReconciliationDialog && editingReconciliation"
        :initial-data="editingReconciliation"
        @submit="handleEditReconciliation"
        @cancel="showEditReconciliationDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFeeStore } from "@/stores/fee";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Money,
  Document,
  Check,
  Clock,
  Warning,
} from "@element-plus/icons-vue";
import type {
  FeeRecord,
  FeeReminder,
  FeeBudget,
  ReconciliationRecord,
} from "@/types/fee";
import FeeForm from "@/components/fees/FeeForm.vue";
import BudgetForm from "@/components/fees/BudgetForm.vue";
import ReconciliationForm from "@/components/fees/ReconciliationForm.vue";

const feeStore = useFeeStore();
const userStore = useUserStore();

// 权限检查
const isAdmin = computed(() => userStore.currentUser?.role === "admin");
const canEdit = computed(() => isAdmin.value);
const canMarkAsPaid = computed(() => isAdmin.value);

// 响应式数据
const activeTab = ref("records");
const loading = ref(false);
const showAddFeeDialog = ref(false);
const showEditFeeDialog = ref(false);
const showAddBudgetDialog = ref(false);
const showEditBudgetDialog = ref(false);
const showAddReconciliationDialog = ref(false);
const showEditReconciliationDialog = ref(false);
const editingFee = ref<FeeRecord | null>(null);
const editingBudget = ref<FeeBudget | null>(null);
const editingReconciliation = ref<ReconciliationRecord | null>(null);

// 搜索表单
const searchForm = ref({
  patentNumber: "",
  feeType: "",
  status: "",
});

// 计算属性
const statistics = computed(
  () =>
    feeStore.statistics || {
      totalFees: 0,
      paidFees: 0,
      pendingFees: 0,
      overdueFees: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    }
);
const feeRecords = computed(() => feeStore.feeRecords || []);
const feeReminders = computed(() => feeStore.feeReminders || []);
const activeBudgets = computed(() => feeStore.activeBudgets || []);
const reconciliationRecords = computed(
  () => feeStore.reconciliationRecords || []
);
const overdueReminders = computed(() => feeStore.overdueReminders || []);

const filteredFeeRecords = computed(() => {
  let filtered = [...feeRecords.value];

  if (searchForm.value.patentNumber) {
    filtered = filtered.filter((record) =>
      record.patentNumber
        .toLowerCase()
        .includes(searchForm.value.patentNumber.toLowerCase())
    );
  }

  if (searchForm.value.feeType) {
    filtered = filtered.filter(
      (record) => record.feeType === searchForm.value.feeType
    );
  }

  if (searchForm.value.status) {
    filtered = filtered.filter(
      (record) => record.status === searchForm.value.status
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
    feeType: "",
    status: "",
  };
};

const handleAddFee = async (feeData: any) => {
  try {
    await feeStore.addFeeRecord(feeData);
    ElMessage.success("费用记录添加成功");
    showAddFeeDialog.value = false;
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const handleEditFee = async (feeData: any) => {
  try {
    if (editingFee.value) {
      await feeStore.updateFeeRecord(editingFee.value.id, feeData);
      ElMessage.success("费用记录更新成功");
      showEditFeeDialog.value = false;
      editingFee.value = null;
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

const handleAddBudget = async (budgetData: any) => {
  try {
    await feeStore.addBudget(budgetData);
    ElMessage.success("预算添加成功");
    showAddBudgetDialog.value = false;
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const handleAddReconciliation = async (reconciliationData: any) => {
  try {
    await feeStore.addReconciliationRecord(reconciliationData);
    ElMessage.success("对账记录添加成功");
    showAddReconciliationDialog.value = false;
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const editFeeRecord = (record: FeeRecord) => {
  editingFee.value = { ...record };
  showEditFeeDialog.value = true;
};

const markAsPaid = async (record: FeeRecord) => {
  try {
    await ElMessageBox.confirm("确认将此费用标记为已缴费？", "确认操作");
    await feeStore.updateFeeRecord(record.id, {
      status: "paid",
      paidDate: new Date().toISOString(),
    });
    ElMessage.success("费用状态已更新");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

const deleteFeeRecord = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除此费用记录？", "确认删除");
    await feeStore.deleteFeeRecord(id);
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const markAsPaidFromReminder = async (reminder: FeeReminder) => {
  try {
    await ElMessageBox.confirm("确认将此费用标记为已缴费？", "确认操作");
    // 找到对应的费用记录并更新
    const feeRecord = feeRecords.value.find(
      (fee) =>
        fee.patentId === reminder.patentId && fee.feeType === reminder.feeType
    );
    if (feeRecord) {
      await feeStore.updateFeeRecord(feeRecord.id, {
        status: "paid",
        paidDate: new Date().toISOString(),
      });
      // 移除对应的提醒
      await feeStore.markReminderAsPaid(reminder.patentId);
      ElMessage.success("费用状态已更新，提醒已移除");
    } else {
      // 如果没有找到对应的费用记录，直接移除提醒
      await feeStore.markReminderAsPaid(reminder.patentId);
      ElMessage.success("提醒已移除");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败");
    }
  }
};

const markReminderAsRead = async (id: number) => {
  await feeStore.markReminderAsRead(id);
  ElMessage.success("提醒已标记为已读");
};

const markAllAsRead = async () => {
  for (const reminder of feeReminders.value) {
    if (!reminder.isRead) {
      await feeStore.markReminderAsRead(reminder.id);
    }
  }
  ElMessage.success("所有提醒已标记为已读");
};

const editBudget = (budget: FeeBudget) => {
  editingBudget.value = { ...budget };
  showEditBudgetDialog.value = true;
};

const handleEditBudget = async (budgetData: any) => {
  try {
    if (editingBudget.value) {
      await feeStore.updateBudget(editingBudget.value.id, budgetData);
      ElMessage.success("预算更新成功");
      showEditBudgetDialog.value = false;
      editingBudget.value = null;
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

const deleteBudget = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认删除此预算？", "确认删除");
    await feeStore.deleteBudget(id);
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const editReconciliation = (record: ReconciliationRecord) => {
  editingReconciliation.value = { ...record };
  showEditReconciliationDialog.value = true;
};

const handleEditReconciliation = async (reconciliationData: any) => {
  try {
    if (editingReconciliation.value) {
      // 这里需要在store中添加更新对账记录的方法
      await feeStore.updateReconciliationRecord(
        editingReconciliation.value.id,
        reconciliationData
      );
      ElMessage.success("对账记录更新成功");
      showEditReconciliationDialog.value = false;
      editingReconciliation.value = null;
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

const deleteReconciliation = async (_id: number) => {
  try {
    await ElMessageBox.confirm("确认删除此对账记录？", "确认删除");
    // 这里需要在对账store中添加删除方法
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 辅助方法
const getFeeTypeText = (type: string) => {
  const texts: Record<string, string> = {
    application: "申请费",
    examination: "审查费",
    maintenance: "年费",
    renewal: "续展费",
    priority: "优先权费",
    extension: "延期费",
    correction: "更正费",
    other: "其他",
  };
  return texts[type] || type;
};

const getFeeTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    application: "primary",
    examination: "success",
    maintenance: "warning",
    renewal: "info",
    priority: "danger",
    extension: "warning",
    correction: "info",
    other: "",
  };
  return tags[type] || "";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待缴费",
    paid: "已缴费",
    overdue: "逾期",
    waived: "减免",
    refunded: "已退款",
  };
  return texts[status] || status;
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "warning",
    paid: "success",
    overdue: "danger",
    waived: "info",
    refunded: "info",
  };
  return types[status] || "info";
};

const getReconciliationStatusText = (status: string) => {
  const texts: Record<string, string> = {
    matched: "已匹配",
    unmatched: "不匹配",
    pending: "待处理",
  };
  return texts[status] || status;
};

const getReconciliationStatusType = (status: string) => {
  const types: Record<string, string> = {
    matched: "success",
    unmatched: "danger",
    pending: "warning",
  };
  return types[status] || "info";
};

const getProgressColor = (percentage: number) => {
  if (percentage < 0.6) return "#67c23a";
  if (percentage < 0.8) return "#e6a23c";
  return "#f56c6c";
};

// 生命周期
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      feeStore.loadFeeRecords(),
      feeStore.loadFeeReminders(),
      feeStore.loadFeeBudgets(),
      feeStore.loadReconciliationRecords(),
    ]);
  } catch (error) {
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.fee-management {
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
  margin-bottom: 30px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
  height: 100%;
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

.main-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.tab-content {
  padding: 20px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.reminders-header,
.budgets-header,
.reconciliation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.reminders-header h3,
.budgets-header h3,
.reconciliation-header h3 {
  margin: 0;
  color: #2c3e50;
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reminder-card {
  border-left: 4px solid #e6a23c;
}

.reminder-card.critical {
  border-left-color: #f56c6c;
}

.reminder-card.urgent {
  border-left-color: #e6a23c;
}

.reminder-card.warning {
  border-left-color: #409eff;
}

.reminder-card.info {
  border-left-color: #909399;
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

.fee-info {
  margin: 0 0 5px 0;
  color: #409eff;
  font-weight: 500;
}

.due-info {
  margin: 0;
  color: #666;
  font-size: 0.9em;
}

.days-left {
  margin-left: 10px;
  font-weight: 500;
}

.days-left.critical {
  color: #f56c6c;
}

.days-left.urgent {
  color: #e6a23c;
}

.days-left.warning {
  color: #409eff;
}

.days-left.info {
  color: #909399;
}

.reminder-actions {
  display: flex;
  gap: 10px;
}

.permission-notice {
  margin-bottom: 20px;
}

.budgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.budget-card {
  min-height: 200px;
  height: auto;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.budget-header h4 {
  margin: 0;
  color: #2c3e50;
}

.budget-info {
  margin-bottom: 20px;
}

.budget-period {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 0.9em;
}

.budget-description {
  margin: 0;
  color: #666;
  font-size: 0.9em;
}

.budget-progress {
  margin-bottom: 20px;
}

.budget-amounts {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #666;
}

.budget-actions {
  display: flex;
  gap: 10px;
}

.positive {
  color: #67c23a;
  font-weight: 500;
}

.negative {
  color: #f56c6c;
  font-weight: 500;
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

  .budgets-grid {
    grid-template-columns: 1fr;
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
