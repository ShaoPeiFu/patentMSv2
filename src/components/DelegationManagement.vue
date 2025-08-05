<template>
  <div class="delegation-management">
    <!-- 操作头部 -->
    <div class="management-header">
      <h3>审批委托管理</h3>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        创建委托
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="委托状态">
          <el-select
            v-model="filterForm.status"
            placeholder="选择状态"
            clearable
          >
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
          </el-select>
        </el-form-item>

        <el-form-item label="委托人">
          <el-input
            v-model="filterForm.delegator"
            placeholder="输入委托人姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="被委托人">
          <el-input
            v-model="filterForm.delegatee"
            placeholder="输入被委托人姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item>
          <el-button @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 委托列表 -->
    <el-card class="delegation-list">
      <template #header>
        <div class="list-header">
          <span>委托列表 ({{ filteredDelegations.length }})</span>
          <div class="header-actions">
            <el-button size="small" @click="checkExpiredDelegations">
              <el-icon><Timer /></el-icon>
              检查过期
            </el-button>
            <el-button size="small" @click="refreshDelegations">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredDelegations" stripe>
        <el-table-column prop="delegatorName" label="委托人" width="120" />

        <el-table-column prop="delegateeName" label="被委托人" width="120" />

        <el-table-column prop="workflowId" label="工作流" width="150">
          <template #default="{ row }">
            {{ getWorkflowName(row.workflowId) || "所有工作流" }}
          </template>
        </el-table-column>

        <el-table-column
          prop="reason"
          label="委托原因"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            <div class="date-range">
              <span>{{ formatDate(row.startDate) }}</span>
              <el-icon><ArrowRight /></el-icon>
              <span>{{ formatDate(row.endDate) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getDelegationStatusType(row)">
              {{ getDelegationStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editDelegation(row)">
              编辑
            </el-button>
            <el-button
              size="small"
              :type="row.isActive ? 'warning' : 'success'"
              @click="toggleDelegationStatus(row)"
            >
              {{ row.isActive ? "停用" : "启用" }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteDelegation(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="filteredDelegations.length === 0" class="empty-state">
        <el-empty description="暂无委托记录">
          <el-button type="primary" @click="showCreateDialog = true">
            创建第一个委托
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 创建/编辑委托对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingDelegation ? '编辑委托' : '创建委托'"
      width="600px"
    >
      <el-form
        ref="delegationFormRef"
        :model="delegationForm"
        :rules="delegationRules"
        label-width="120px"
      >
        <el-form-item label="委托人" prop="delegatorId">
          <el-select
            v-model="delegationForm.delegatorId"
            placeholder="选择委托人"
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

        <el-form-item label="被委托人" prop="delegateeId">
          <el-select
            v-model="delegationForm.delegateeId"
            placeholder="选择被委托人"
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

        <el-form-item label="适用工作流">
          <el-select
            v-model="delegationForm.workflowId"
            placeholder="选择工作流(不选择表示所有工作流)"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="workflow in availableWorkflows"
              :key="workflow.id"
              :label="workflow.name"
              :value="workflow.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="有效期" prop="dateRange">
          <el-date-picker
            v-model="delegationForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="委托原因" prop="reason">
          <el-input
            v-model="delegationForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入委托原因"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="delegationForm.isActive"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancelEdit">取消</el-button>
        <el-button type="primary" @click="handleSaveDelegation">
          {{ editingDelegation ? "更新" : "创建" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useDocumentStore } from "@/stores/document";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Timer, Refresh, ArrowRight } from "@element-plus/icons-vue";
import type { ApprovalDelegation } from "@/types/document";

// Store
const documentStore = useDocumentStore();
const userStore = useUserStore();

// 响应式数据
const showCreateDialog = ref(false);
const editingDelegation = ref<ApprovalDelegation | null>(null);
const delegationFormRef = ref();

// 筛选表单
const filterForm = reactive({
  status: "",
  delegator: "",
  delegatee: "",
});

// 委托表单
const delegationForm = reactive({
  delegatorId: "",
  delegateeId: "",
  workflowId: "",
  dateRange: null as [string, string] | null,
  reason: "",
  isActive: true,
});

// 表单验证规则
const delegationRules = {
  delegatorId: [{ required: true, message: "请选择委托人", trigger: "change" }],
  delegateeId: [
    { required: true, message: "请选择被委托人", trigger: "change" },
  ],
  dateRange: [{ required: true, message: "请选择有效期", trigger: "change" }],
  reason: [{ required: true, message: "请输入委托原因", trigger: "blur" }],
};

// 计算属性
const filteredDelegations = computed(() => {
  let delegations = documentStore.approvalDelegations;

  // 状态筛选
  if (filterForm.status) {
    const isActive = filterForm.status === "active";
    delegations = delegations.filter((d) => d.isActive === isActive);
  }

  // 委托人筛选
  if (filterForm.delegator) {
    const keyword = filterForm.delegator.toLowerCase();
    delegations = delegations.filter((d) =>
      d.delegatorName.toLowerCase().includes(keyword)
    );
  }

  // 被委托人筛选
  if (filterForm.delegatee) {
    const keyword = filterForm.delegatee.toLowerCase();
    delegations = delegations.filter((d) =>
      d.delegateeName.toLowerCase().includes(keyword)
    );
  }

  return delegations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const availableUsers = computed(() => userStore.users);

const availableWorkflows = computed(() =>
  documentStore.approvalWorkflows.filter((w) => w.isActive)
);

// 方法
const applyFilters = () => {
  // 筛选逻辑已在computed中处理
  ElMessage.success(
    `筛选完成，找到 ${filteredDelegations.value.length} 条记录`
  );
};

const resetFilters = () => {
  Object.assign(filterForm, {
    status: "",
    delegator: "",
    delegatee: "",
  });
  ElMessage.success("筛选条件已重置");
};

const refreshDelegations = () => {
  // 刷新数据
  ElMessage.success("委托列表已刷新");
};

const checkExpiredDelegations = () => {
  const now = new Date();
  const expiredDelegations = documentStore.approvalDelegations.filter(
    (d) => d.isActive && new Date(d.endDate) < now
  );

  if (expiredDelegations.length > 0) {
    ElMessageBox.confirm(
      `发现 ${expiredDelegations.length} 个过期委托，是否自动停用？`,
      "过期委托提醒",
      {
        confirmButtonText: "停用",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        expiredDelegations.forEach((delegation) => {
          documentStore.updateDelegation(delegation.id, { isActive: false });
        });
        ElMessage.success(`已停用 ${expiredDelegations.length} 个过期委托`);
      })
      .catch(() => {
        // 用户取消
      });
  } else {
    ElMessage.info("暂无过期委托");
  }
};

const editDelegation = (delegation: ApprovalDelegation) => {
  editingDelegation.value = delegation;
  Object.assign(delegationForm, {
    delegatorId: delegation.delegatorId,
    delegateeId: delegation.delegateeId,
    workflowId: delegation.workflowId || "",
    dateRange: [delegation.startDate, delegation.endDate],
    reason: delegation.reason,
    isActive: delegation.isActive,
  });
  showCreateDialog.value = true;
};

const toggleDelegationStatus = (delegation: ApprovalDelegation) => {
  const action = delegation.isActive ? "停用" : "启用";
  ElMessageBox.confirm(`确定要${action}此委托吗？`, `确认${action}`, {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      documentStore.updateDelegation(delegation.id, {
        isActive: !delegation.isActive,
      });
      ElMessage.success(`委托已${action}`);
    })
    .catch(() => {
      // 用户取消
    });
};

const deleteDelegation = (delegation: ApprovalDelegation) => {
  ElMessageBox.confirm("确定要删除此委托吗？此操作不可恢复。", "确认删除", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      documentStore.deleteDelegation(delegation.id);
      ElMessage.success("委托已删除");
    })
    .catch(() => {
      // 用户取消
    });
};

const handleSaveDelegation = async () => {
  try {
    const valid = await delegationFormRef.value?.validate();
    if (!valid) return;

    if (delegationForm.delegatorId === delegationForm.delegateeId) {
      ElMessage.warning("委托人和被委托人不能是同一人");
      return;
    }

    const delegatorUser = availableUsers.value.find(
      (u) => u.id === parseInt(delegationForm.delegatorId)
    );
    const delegateeUser = availableUsers.value.find(
      (u) => u.id === parseInt(delegationForm.delegateeId)
    );

    if (!delegatorUser || !delegateeUser) {
      ElMessage.error("用户信息不存在");
      return;
    }

    const delegationData = {
      delegatorId: delegationForm.delegatorId,
      delegatorName: delegatorUser.realName,
      delegateeId: delegationForm.delegateeId,
      delegateeName: delegateeUser.realName,
      workflowId: delegationForm.workflowId || undefined,
      startDate: delegationForm.dateRange![0],
      endDate: delegationForm.dateRange![1],
      reason: delegationForm.reason,
      isActive: delegationForm.isActive,
    };

    if (editingDelegation.value) {
      documentStore.updateDelegation(editingDelegation.value.id, {
        ...delegationData,
        delegatorId: parseInt(delegationData.delegatorId),
        delegateeId: parseInt(delegationData.delegateeId),
      });
      ElMessage.success("委托更新成功");
    } else {
      documentStore.createDelegation({
        ...delegationData,
        delegatorId: parseInt(delegationData.delegatorId),
        delegateeId: parseInt(delegationData.delegateeId),
      });
      ElMessage.success("委托创建成功");
    }

    handleCancelEdit();
  } catch (error) {
    ElMessage.error("操作失败: " + (error as Error).message);
  }
};

const handleCancelEdit = () => {
  showCreateDialog.value = false;
  editingDelegation.value = null;

  // 重置表单
  Object.assign(delegationForm, {
    delegatorId: "",
    delegateeId: "",
    workflowId: "",
    dateRange: null,
    reason: "",
    isActive: true,
  });
};

// 辅助函数
const getWorkflowName = (workflowId?: string) => {
  if (!workflowId) return null;
  const workflow = documentStore.approvalWorkflows.find(
    (w) => w.id === workflowId
  );
  return workflow?.name;
};

const getDelegationStatusType = (delegation: ApprovalDelegation) => {
  if (!delegation.isActive) return "info";

  const now = new Date();
  const endDate = new Date(delegation.endDate);

  if (endDate < now) return "danger"; // 已过期

  const daysDiff = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 3) return "warning"; // 即将过期

  return "success"; // 正常
};

const getDelegationStatusText = (delegation: ApprovalDelegation) => {
  if (!delegation.isActive) return "已停用";

  const now = new Date();
  const endDate = new Date(delegation.endDate);

  if (endDate < now) return "已过期";

  const daysDiff = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 3) return `${daysDiff}天后到期`;

  return "正常";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
  // 初始化
});
</script>

<style scoped>
.delegation-management {
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

.filter-card,
.delegation-list {
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .delegation-management {
    padding: 10px;
  }

  .management-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .date-range {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
