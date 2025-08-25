<template>
  <div class="disclosure-management">
    <div class="page-header">
      <div class="header-content">
        <h1>专利交底书管理</h1>
        <p class="page-description">
          管理专利交底书的提交、评估和代理分配全流程
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          提交交底书
        </el-button>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="overview-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="overview-card total">
            <div class="card-content">
              <div class="number">{{ statistics?.total || 0 }}</div>
              <div class="label">总交底书数</div>
              <div class="trend">
                <el-icon><TrendCharts /></el-icon>
                <span>较上月 +{{ monthlyGrowth }}%</span>
              </div>
            </div>
            <div class="card-icon">
              <el-icon><Document /></el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card pending">
            <div class="card-content">
              <div class="number">{{ pendingCount }}</div>
              <div class="label">待评估</div>
              <div class="trend">
                <el-icon><Clock /></el-icon>
                <span>平均处理 {{ averageProcessingDays }} 天</span>
              </div>
            </div>
            <div class="card-icon">
              <el-icon><Timer /></el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card approved">
            <div class="card-content">
              <div class="number">
                {{ statistics?.byStatus?.approved || 0 }}
              </div>
              <div class="label">已通过</div>
              <div class="trend">
                <el-icon><Check /></el-icon>
                <span>通过率 {{ approvalRate }}%</span>
              </div>
            </div>
            <div class="card-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card departments">
            <div class="card-content">
              <div class="number">{{ departmentCount }}</div>
              <div class="label">参与部门</div>
              <div class="trend">
                <el-icon><OfficeBuilding /></el-icon>
                <span>活跃部门数</span>
              </div>
            </div>
            <div class="card-icon">
              <el-icon><Collection /></el-icon>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 快速导航 -->
    <div class="quick-nav-section">
      <el-card class="nav-card" shadow="never">
        <template #header>
          <h3>快速操作</h3>
        </template>
        <div class="nav-buttons">
          <el-button
            type="primary"
            size="large"
            @click="showCreateDialog = true"
          >
            <el-icon><EditPen /></el-icon>
            提交交底书
          </el-button>
          <el-button
            type="warning"
            size="large"
            @click="showPendingEvaluations"
            v-if="canEvaluate"
          >
            <el-icon><View /></el-icon>
            待评估列表
          </el-button>
          <el-button
            type="success"
            size="large"
            @click="showAgencyManagement"
            v-if="isAdmin"
          >
            <el-icon><UserFilled /></el-icon>
            代理机构管理
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="交底书列表" name="list">
          <DisclosureList />
        </el-tab-pane>
        <el-tab-pane label="待评估" name="pending" v-if="canEvaluate">
          <PendingEvaluations />
        </el-tab-pane>
        <el-tab-pane label="代理机构" name="agencies" v-if="isAdmin">
          <AgencyManagement />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新建交底书对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="提交交底书"
      width="80%"
      :close-on-click-modal="false"
    >
      <DisclosureForm
        @success="handleCreateSuccess"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus,
  Document,
  Timer,
  CircleCheck,
  Collection,
  EditPen,
  View,
  UserFilled,
  TrendCharts,
  Clock,
  Check,
  OfficeBuilding,
} from "@element-plus/icons-vue";
import { useDisclosureStore } from "../stores/disclosure";
import { useUserStore } from "../stores/user";
import DisclosureList from "../components/disclosure/DisclosureList.vue";
import DisclosureForm from "../components/disclosure/DisclosureForm.vue";
// import PendingEvaluations from '../components/disclosure/PendingEvaluations.vue';
// import AgencyManagement from '../components/disclosure/AgencyManagement.vue';

const disclosureStore = useDisclosureStore();
const userStore = useUserStore();

const showCreateDialog = ref(false);
const activeTab = ref("list");

// 计算属性
const statistics = computed(() => disclosureStore.statistics);

const pendingCount = computed(() => {
  const submitted = statistics.value?.byStatus?.submitted || 0;
  const underEvaluation = statistics.value?.byStatus?.under_evaluation || 0;
  return submitted + underEvaluation;
});

const monthlyGrowth = computed(() => {
  // 简单的月增长计算示例
  const monthlySubmissions = statistics.value?.monthlySubmissions || [];
  if (monthlySubmissions.length >= 2) {
    const current =
      monthlySubmissions[monthlySubmissions.length - 1]?.count || 0;
    const previous =
      monthlySubmissions[monthlySubmissions.length - 2]?.count || 0;
    if (previous > 0) {
      return Math.round(((current - previous) / previous) * 100);
    }
  }
  return 0;
});

const averageProcessingDays = computed(() => {
  return statistics.value?.evaluationEfficiency?.averageDays || 0;
});

const approvalRate = computed(() => {
  const total = statistics.value?.total || 0;
  const approved = statistics.value?.byStatus?.approved || 0;
  if (total > 0) {
    return Math.round((approved / total) * 100);
  }
  return 0;
});

const departmentCount = computed(() => {
  return Object.keys(statistics.value?.byDepartment || {}).length;
});

const canEvaluate = computed(() => {
  const user = userStore.currentUser;
  return user && ["admin", "reviewer"].includes(user.role);
});

const isAdmin = computed(() => {
  const user = userStore.currentUser;
  return user && user.role === "admin";
});

// 方法
const showPendingEvaluations = () => {
  activeTab.value = "pending";
};

const showAgencyManagement = () => {
  activeTab.value = "agencies";
};

const handleCreateSuccess = () => {
  showCreateDialog.value = false;
  ElMessage.success("交底书提交成功");
  // 刷新统计数据
  disclosureStore.fetchStatistics();
};

// 生命周期
onMounted(async () => {
  try {
    await disclosureStore.fetchStatistics();
  } catch (error) {
    console.error("加载统计数据失败:", error);
  }
});
</script>

<style scoped lang="scss">
.disclosure-management {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    .header-content {
      h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 600;
      }

      .page-description {
        margin: 0;
        font-size: 16px;
        opacity: 0.9;
      }
    }

    .header-actions {
      .el-button {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }

  .overview-section {
    margin-bottom: 24px;

    .overview-card {
      position: relative;
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      .card-content {
        position: relative;
        z-index: 2;

        .number {
          font-size: 32px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 8px;
        }

        .label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 12px;
        }

        .trend {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #67c23a;

          .el-icon {
            margin-right: 4px;
          }
        }
      }

      .card-icon {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 48px;
        opacity: 0.1;
        z-index: 1;
      }

      &.total {
        border-left: 4px solid #409eff;
        .card-icon {
          color: #409eff;
        }
      }

      &.pending {
        border-left: 4px solid #e6a23c;
        .card-icon {
          color: #e6a23c;
        }
        .trend {
          color: #e6a23c;
        }
      }

      &.approved {
        border-left: 4px solid #67c23a;
        .card-icon {
          color: #67c23a;
        }
      }

      &.departments {
        border-left: 4px solid #909399;
        .card-icon {
          color: #909399;
        }
        .trend {
          color: #909399;
        }
      }
    }
  }

  .quick-nav-section {
    margin-bottom: 24px;

    .nav-card {
      .nav-buttons {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        .el-button {
          min-width: 140px;
          height: 60px;
          font-size: 16px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 20px;
          }
        }
      }
    }
  }

  .main-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 0;

    :deep(.el-tabs__header) {
      margin: 0;
      padding: 0 24px;
      background: #fafafa;
      border-radius: 12px 12px 0 0;
    }

    :deep(.el-tabs__content) {
      padding: 24px;
    }

    :deep(.el-tab-pane) {
      min-height: 500px;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .disclosure-management {
    .overview-section {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}

@media (max-width: 768px) {
  .disclosure-management {
    padding: 16px;

    .page-header {
      flex-direction: column;
      gap: 16px;
      padding: 24px;

      .header-actions {
        align-self: stretch;
      }
    }

    .quick-nav-section {
      .nav-buttons {
        justify-content: center;

        .el-button {
          flex: 1;
          min-width: auto;
        }
      }
    }

    .main-content {
      :deep(.el-tabs__header) {
        padding: 0 16px;
      }

      :deep(.el-tabs__content) {
        padding: 16px;
      }
    }
  }
}
</style>
