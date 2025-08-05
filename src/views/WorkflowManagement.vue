<template>
  <div class="workflow-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>工作流管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              创建工作流
            </el-button>
            <el-button @click="showTemplateDialog = true">
              <el-icon><DocumentCopy /></el-icon>
              模板管理
            </el-button>
            <el-button @click="showStatisticsDialog = true">
              <el-icon><TrendCharts /></el-icon>
              统计报告
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计概览 -->
      <div class="statistics-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon workflows">
                <el-icon><Folder /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ workflowCount }}</div>
                <div class="stat-label">工作流总数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon active">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ activeWorkflowCount }}</div>
                <div class="stat-label">活跃工作流</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon processes">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ processingCount }}</div>
                <div class="stat-label">进行中流程</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon templates">
                <el-icon><DocumentCopy /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ templateCount }}</div>
                <div class="stat-label">工作流模板</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 工作流列表 -->
      <div class="workflow-list">
        <div class="list-header">
          <h3>工作流列表</h3>
          <div class="list-filters">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索工作流..."
              clearable
              style="width: 200px; margin-right: 12px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="statusFilter"
              placeholder="状态筛选"
              clearable
              style="width: 120px; margin-right: 12px"
            >
              <el-option label="活跃" value="active" />
              <el-option label="非活跃" value="inactive" />
            </el-select>
            <el-select
              v-model="categoryFilter"
              placeholder="分类筛选"
              clearable
              style="width: 120px"
            >
              <el-option label="文档" value="文档" />
              <el-option label="专利" value="专利" />
              <el-option label="合同" value="合同" />
            </el-select>
          </div>
        </div>

        <el-table :data="filteredWorkflows" stripe>
          <el-table-column prop="name" label="工作流名称" min-width="200">
            <template #default="{ row }">
              <div class="workflow-name">
                <strong>{{ row.name }}</strong>
                <div class="workflow-meta">
                  <el-tag size="small" :type="getTypeTagType(row.type)">
                    {{ getTypeText(row.type) }}
                  </el-tag>
                  <el-tag size="small" :type="getPriorityTagType(row.priority)">
                    {{ getPriorityText(row.priority) }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="category" label="分类" width="100" />

          <el-table-column prop="steps" label="步骤数" width="80">
            <template #default="{ row }">
              {{ row.steps.length }}
            </template>
          </el-table-column>

          <el-table-column prop="isActive" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'">
                {{ row.isActive ? "活跃" : "非活跃" }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="version" label="版本" width="80" />

          <el-table-column prop="createdAt" label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewWorkflow(row)">
                详情
              </el-button>
              <el-button size="small" type="primary" @click="editWorkflow(row)">
                编辑
              </el-button>
              <el-button size="small" @click="cloneWorkflow(row)">
                克隆
              </el-button>
              <el-button
                size="small"
                :type="row.isActive ? 'warning' : 'success'"
                @click="toggleWorkflowStatus(row)"
              >
                {{ row.isActive ? "停用" : "启用" }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 创建/编辑工作流对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingWorkflow ? '编辑工作流' : '创建工作流'"
      width="80%"
      top="5vh"
    >
      <WorkflowEditor
        v-if="showCreateDialog"
        :workflow="editingWorkflow"
        @save="handleSaveWorkflow"
        @cancel="handleCancelEdit"
      />
    </el-dialog>

    <!-- 模板管理对话框 -->
    <el-dialog v-model="showTemplateDialog" title="工作流模板管理" width="70%">
      <WorkflowTemplateManager @create-workflow="handleCreateFromTemplate" />
    </el-dialog>

    <!-- 统计报告对话框 -->
    <el-dialog
      v-model="showStatisticsDialog"
      title="工作流统计报告"
      width="80%"
    >
      <WorkflowStatistics />
    </el-dialog>

    <!-- 工作流详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="工作流详情" width="70%">
      <WorkflowDetail v-if="selectedWorkflow" :workflow="selectedWorkflow" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDocumentStore } from "@/stores/document";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  DocumentCopy,
  TrendCharts,
  Folder,
  Check,
  Timer,
  Search,
} from "@element-plus/icons-vue";
import type { ApprovalWorkflow } from "@/types/document";
import WorkflowEditor from "@/components/WorkflowEditor.vue";
import WorkflowTemplateManager from "@/components/WorkflowTemplateManager.vue";
import WorkflowStatistics from "@/components/WorkflowStatistics.vue";
import WorkflowDetail from "@/components/WorkflowDetail.vue";

// Store
const documentStore = useDocumentStore();

// 响应式数据
const showCreateDialog = ref(false);
const showTemplateDialog = ref(false);
const showStatisticsDialog = ref(false);
const showDetailDialog = ref(false);
const editingWorkflow = ref<ApprovalWorkflow | null>(null);
const selectedWorkflow = ref<ApprovalWorkflow | null>(null);

// 筛选条件
const searchKeyword = ref("");
const statusFilter = ref("");
const categoryFilter = ref("");

// 计算属性
const workflowCount = computed(() => documentStore.approvalWorkflows.length);
const activeWorkflowCount = computed(
  () => documentStore.approvalWorkflows.filter((w) => w.isActive).length
);
const processingCount = computed(
  () =>
    documentStore.approvalProcesses.filter((p) => p.status === "pending").length
);
const templateCount = computed(() => documentStore.workflowTemplates.length);

const filteredWorkflows = computed(() => {
  let workflows = documentStore.approvalWorkflows;

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    workflows = workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(keyword) ||
        w.description?.toLowerCase().includes(keyword) ||
        w.category.toLowerCase().includes(keyword)
    );
  }

  // 状态筛选
  if (statusFilter.value) {
    const isActive = statusFilter.value === "active";
    workflows = workflows.filter((w) => w.isActive === isActive);
  }

  // 分类筛选
  if (categoryFilter.value) {
    workflows = workflows.filter((w) => w.category === categoryFilter.value);
  }

  return workflows;
});

// 方法
const viewWorkflow = (workflow: ApprovalWorkflow) => {
  selectedWorkflow.value = workflow;
  showDetailDialog.value = true;
};

const editWorkflow = (workflow: ApprovalWorkflow) => {
  editingWorkflow.value = { ...workflow };
  showCreateDialog.value = true;
};

const cloneWorkflow = async (workflow: ApprovalWorkflow) => {
  try {
    const clonedWorkflow = {
      ...workflow,
      name: `${workflow.name} (副本)`,
      version: "1.0",
      createdAt: new Date().toISOString(),
      steps: workflow.steps.map((step, index) => ({
        ...step,
        id: `cloned-step-${Date.now()}-${index + 1}`,
      })),
    };
    delete (clonedWorkflow as any).id;

    await documentStore.createApprovalWorkflow(clonedWorkflow);
    ElMessage.success("工作流克隆成功");
  } catch (error) {
    ElMessage.error("克隆失败: " + (error as Error).message);
  }
};

const toggleWorkflowStatus = async (workflow: ApprovalWorkflow) => {
  try {
    const action = workflow.isActive ? "停用" : "启用";
    await ElMessageBox.confirm(
      `确定要${action}工作流"${workflow.name}"吗？`,
      `确认${action}`,
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 这里应该调用store方法更新工作流状态
    const index = documentStore.approvalWorkflows.findIndex(
      (w) => w.id === workflow.id
    );
    if (index !== -1) {
      documentStore.approvalWorkflows[index].isActive = !workflow.isActive;
      documentStore.saveToStorage();
      ElMessage.success(`工作流已${action}`);
    }
  } catch {
    // 用户取消操作
  }
};

const handleSaveWorkflow = (workflowData: Partial<ApprovalWorkflow>) => {
  try {
    if (editingWorkflow.value) {
      // 编辑现有工作流
      const index = documentStore.approvalWorkflows.findIndex(
        (w) => w.id === editingWorkflow.value!.id
      );
      if (index !== -1) {
        documentStore.approvalWorkflows[index] = {
          ...documentStore.approvalWorkflows[index],
          ...workflowData,
        };
        documentStore.saveToStorage();
        ElMessage.success("工作流更新成功");
      }
    } else {
      // 创建新工作流
      documentStore.createApprovalWorkflow(
        workflowData as Omit<ApprovalWorkflow, "id" | "createdAt">
      );
      ElMessage.success("工作流创建成功");
    }

    handleCancelEdit();
  } catch (error) {
    ElMessage.error("保存失败: " + (error as Error).message);
  }
};

const handleCancelEdit = () => {
  showCreateDialog.value = false;
  editingWorkflow.value = null;
};

const handleCreateFromTemplate = (templateId: string, customData: any) => {
  try {
    documentStore.createWorkflowFromTemplate(templateId, customData);
    ElMessage.success("基于模板创建工作流成功");
    showTemplateDialog.value = false;
  } catch (error) {
    ElMessage.error("创建失败: " + (error as Error).message);
  }
};

// 辅助函数
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
  // 页面加载时的初始化逻辑
});
</script>

<style scoped>
.workflow-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.statistics-overview {
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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

.stat-icon.workflows {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(45deg, #56ab2f 0%, #a8e6cf 100%);
}

.stat-icon.processes {
  background: linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%);
  color: #d35400;
}

.stat-icon.templates {
  background: linear-gradient(45deg, #a8edea 0%, #fed6e3 100%);
  color: #8e44ad;
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

.workflow-list {
  margin-top: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  color: #2c3e50;
}

.list-filters {
  display: flex;
  align-items: center;
}

.workflow-name {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workflow-meta {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .statistics-overview .el-col {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .list-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .list-filters {
    flex-direction: column;
    gap: 12px;
  }

  .list-filters > * {
    width: 100% !important;
  }
}
</style>
