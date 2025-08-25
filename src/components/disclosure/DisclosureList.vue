<template>
  <div class="disclosure-list">
    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="never">
      <div class="search-section">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索标题、案号、发明人"
              prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="searchForm.status"
              placeholder="状态"
              clearable
              @change="handleSearch"
            >
              <el-option label="已提交" value="submitted" />
              <el-option label="评估中" value="under_evaluation" />
              <el-option label="已通过" value="approved" />
              <el-option label="已驳回" value="rejected" />
              <el-option label="已归档" value="archived" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="searchForm.department"
              placeholder="部门"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-input
              v-model="searchForm.technicalField"
              placeholder="技术领域"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <div class="search-actions">
              <el-button
                type="primary"
                @click="handleSearch"
                :loading="loading"
              >
                搜索
              </el-button>
              <el-button @click="handleReset">重置</el-button>
              <el-button type="success" @click="showCreateDialog = true">
                <el-icon><Plus /></el-icon>
                提交交底书
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics?.total || 0 }}</div>
              <div class="stat-label">总数</div>
            </div>
            <el-icon class="stat-icon"><Document /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card pending">
            <div class="stat-content">
              <div class="stat-number">{{ pendingCount }}</div>
              <div class="stat-label">待评估</div>
            </div>
            <el-icon class="stat-icon"><Clock /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card approved">
            <div class="stat-content">
              <div class="stat-number">
                {{ statistics?.byStatus?.approved || 0 }}
              </div>
              <div class="stat-label">已通过</div>
            </div>
            <el-icon class="stat-icon"><Check /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card rejected">
            <div class="stat-content">
              <div class="stat-number">
                {{ statistics?.byStatus?.rejected || 0 }}
              </div>
              <div class="stat-label">已驳回</div>
            </div>
            <el-icon class="stat-icon"><Close /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 交底书列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <h3>交底书列表</h3>
          <div class="header-actions">
            <el-button @click="refreshList" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="disclosures"
        v-loading="loading"
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column
          prop="companyFileNumber"
          label="公司案号"
          width="150"
        />
        <el-table-column
          prop="title"
          label="标题"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="department" label="部门" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{
              getDepartmentLabel(row.department)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="technicalField"
          label="技术领域"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          prop="inventors"
          label="发明人"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submissionDate" label="提交时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.submissionDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="submitter" label="提交人" width="100">
          <template #default="{ row }">
            {{ row.submitter?.realName || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click.stop="viewDisclosure(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="canEdit(row)"
              size="small"
              @click.stop="editDisclosure(row)"
            >
              编辑
            </el-button>
            <el-dropdown
              @command="(command) => handleCommand(command, row)"
              trigger="click"
            >
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="evaluate" v-if="canEvaluate(row)">
                    评估
                  </el-dropdown-item>
                  <el-dropdown-item command="assign" v-if="canAssign(row)">
                    分配代理
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    v-if="canDelete(row)"
                    divided
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingDisclosure ? '编辑交底书' : '提交交底书'"
      width="80%"
      :close-on-click-modal="false"
    >
      <DisclosureForm
        :initial-data="editingDisclosure"
        @success="handleFormSuccess"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="交底书详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <DisclosureDetail
        v-if="selectedDisclosure"
        :disclosure="selectedDisclosure"
        @close="showDetailDialog = false"
        @edit="handleEditFromDetail"
        @evaluate="handleEvaluateFromDetail"
        @assign="handleAssignFromDetail"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Search,
  Refresh,
  Document,
  Clock,
  Check,
  Close,
  ArrowDown,
} from "@element-plus/icons-vue";
import { useDisclosureStore } from "../../stores/disclosure";
import { useUserStore } from "../../stores/user";
import DisclosureForm from "./DisclosureForm.vue";
import DisclosureDetail from "./DisclosureDetail.vue";
import type { DisclosureDocument } from "../../types/disclosure";

const disclosureStore = useDisclosureStore();
const userStore = useUserStore();

const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const editingDisclosure = ref<DisclosureDocument | null>(null);
const selectedDisclosure = ref<DisclosureDocument | null>(null);

// 搜索表单
const searchForm = reactive({
  keyword: "",
  status: "",
  department: "",
  technicalField: "",
});

// 部门选项
const departments = [
  { label: "管理部", value: "admin" },
  { label: "研发部", value: "research" },
  { label: "开发部", value: "development" },
  { label: "法务部", value: "legal" },
  { label: "市场部", value: "marketing" },
  { label: "财务部", value: "finance" },
  { label: "人事部", value: "hr" },
];

// 计算属性
const disclosures = computed(() => disclosureStore.disclosures);
const loading = computed(() => disclosureStore.loading);
const total = computed(() => disclosureStore.total);
const currentPage = computed({
  get: () => disclosureStore.currentPage,
  set: (value) => disclosureStore.setPage(value),
});
const pageSize = computed({
  get: () => disclosureStore.pageSize,
  set: (value) => disclosureStore.setPageSize(value),
});
const statistics = computed(() => disclosureStore.statistics);

const pendingCount = computed(() => {
  const submitted = statistics.value?.byStatus?.submitted || 0;
  const underEvaluation = statistics.value?.byStatus?.under_evaluation || 0;
  return submitted + underEvaluation;
});

// 权限检查
const canEdit = (disclosure: DisclosureDocument) => {
  const user = userStore.currentUser;
  return user && (user.role === "admin" || disclosure.submitterId === user.id);
};

const canEvaluate = (disclosure: DisclosureDocument) => {
  const user = userStore.currentUser;
  return (
    user &&
    ["admin", "reviewer"].includes(user.role) &&
    ["submitted", "under_evaluation"].includes(disclosure.status)
  );
};

const canAssign = (disclosure: DisclosureDocument) => {
  const user = userStore.currentUser;
  return user && user.role === "admin" && disclosure.status === "approved";
};

const canDelete = (disclosure: DisclosureDocument) => {
  const user = userStore.currentUser;
  return (
    user &&
    (user.role === "admin" ||
      (disclosure.submitterId === user.id && disclosure.status === "submitted"))
  );
};

// 工具函数
const getDepartmentLabel = (value: string) => {
  const dept = departments.find((d) => d.value === value);
  return dept?.label || value;
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    submitted: "",
    under_evaluation: "warning",
    approved: "success",
    rejected: "danger",
    archived: "info",
  };
  return typeMap[status] || "";
};

const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    submitted: "已提交",
    under_evaluation: "评估中",
    approved: "已通过",
    rejected: "已驳回",
    archived: "已归档",
  };
  return labelMap[status] || status;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

// 事件处理
const handleSearch = async () => {
  await disclosureStore.search(searchForm);
};

const handleReset = async () => {
  Object.assign(searchForm, {
    keyword: "",
    status: "",
    department: "",
    technicalField: "",
  });
  await disclosureStore.resetSearch();
};

const refreshList = async () => {
  await disclosureStore.fetchDisclosures(searchForm);
  await disclosureStore.fetchStatistics();
};

const handlePageChange = (page: number) => {
  disclosureStore.setPage(page);
};

const handleSizeChange = (size: number) => {
  disclosureStore.setPageSize(size);
};

const handleRowClick = (row: DisclosureDocument, column: any, event: Event) => {
  // 检查点击的目标元素，如果是操作按钮或下拉菜单，则不触发详情页面
  const target = event.target as HTMLElement;
  if (target.closest(".el-button") || target.closest(".el-dropdown")) {
    return;
  }
  viewDisclosure(row);
};

const viewDisclosure = async (disclosure: DisclosureDocument) => {
  try {
    selectedDisclosure.value = await disclosureStore.fetchDisclosure(
      disclosure.id
    );
    showDetailDialog.value = true;
  } catch (error) {
    ElMessage.error("加载交底书详情失败");
  }
};

const editDisclosure = (disclosure: DisclosureDocument) => {
  editingDisclosure.value = disclosure;
  showCreateDialog.value = true;
};

const handleCommand = async (
  command: string,
  disclosure: DisclosureDocument
) => {
  switch (command) {
    case "evaluate":
      // TODO: 打开评估对话框
      ElMessage.info("评估功能开发中");
      break;
    case "assign":
      // TODO: 打开代理分配对话框
      ElMessage.info("代理分配功能开发中");
      break;
    case "delete":
      await handleDelete(disclosure);
      break;
  }
};

const handleDelete = async (disclosure: DisclosureDocument) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除交底书"${disclosure.title}"吗？此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await disclosureStore.deleteDisclosure(disclosure.id);
    ElMessage.success("删除成功");
    await refreshList();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleFormSuccess = async () => {
  showCreateDialog.value = false;
  editingDisclosure.value = null;
  await refreshList();
};

const handleEditFromDetail = (disclosure: DisclosureDocument) => {
  showDetailDialog.value = false;
  editDisclosure(disclosure);
};

const handleEvaluateFromDetail = (disclosure: DisclosureDocument) => {
  showDetailDialog.value = false;
  // TODO: 打开评估对话框
  ElMessage.info("评估功能开发中");
};

const handleAssignFromDetail = (disclosure: DisclosureDocument) => {
  showDetailDialog.value = false;
  // TODO: 打开代理分配对话框
  ElMessage.info("代理分配功能开发中");
};

// 生命周期
onMounted(async () => {
  await Promise.all([
    disclosureStore.fetchDisclosures(),
    disclosureStore.fetchStatistics(),
  ]);
});
</script>

<style scoped lang="scss">
.disclosure-list {
  padding: 24px;

  .search-card {
    margin-bottom: 16px;

    .search-section {
      .search-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .stats-section {
    margin-bottom: 16px;

    .stat-card {
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-content {
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }

      .stat-icon {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 24px;
        color: #409eff;
      }

      &.pending .stat-icon {
        color: #e6a23c;
      }

      &.approved .stat-icon {
        color: #67c23a;
      }

      &.rejected .stat-icon {
        color: #f56c6c;
      }
    }
  }

  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: #303133;
        font-size: 16px;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .pagination-section {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .disclosure-list {
    padding: 16px;

    .search-section {
      .el-row {
        .el-col {
          margin-bottom: 12px;
        }
      }

      .search-actions {
        justify-content: flex-start;
      }
    }

    .table-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
  }
}
</style>
