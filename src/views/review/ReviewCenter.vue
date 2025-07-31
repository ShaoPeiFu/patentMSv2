<template>
  <div class="review-center">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>审核中心</h1>
      <div class="header-actions">
        <el-button @click="handleRefresh">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.pending }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.approved }}</div>
              <div class="stat-label">已通过</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.rejected }}</div>
              <div class="stat-label">已拒绝</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.today }}</div>
              <div class="stat-label">今日审核</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-card>
        <el-form :model="filterForm" inline>
          <el-form-item label="审核状态">
            <el-select
              v-model="filterForm.status"
              placeholder="选择状态"
              clearable
            >
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-form-item>

          <el-form-item label="专利类型">
            <el-select
              v-model="filterForm.type"
              placeholder="选择类型"
              clearable
            >
              <el-option label="发明专利" value="invention" />
              <el-option label="实用新型" value="utility_model" />
              <el-option label="外观设计" value="design" />
              <el-option label="软件专利" value="software" />
            </el-select>
          </el-form-item>

          <el-form-item label="提交日期">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleFilter"> 筛选 </el-button>
            <el-button @click="handleResetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 审核列表 -->
    <div class="list-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>审核列表 (共 {{ filteredReviews.length }} 条记录)</span>
          </div>
        </template>

        <el-table
          :data="filteredReviews"
          v-loading="loading"
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column prop="patentNumber" label="专利号" width="150" />

          <el-table-column prop="title" label="专利标题" min-width="200">
            <template #default="{ row }">
              <el-link @click="viewPatent(row.patentId)">{{
                row.title
              }}</el-link>
            </template>
          </el-table-column>

          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="applicant" label="申请人" width="120" />

          <el-table-column prop="submitDate" label="提交日期" width="120" />

          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewReview(row.id)">
                查看详情
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                size="small"
                type="success"
                @click="approveReview(row.id)"
              >
                通过
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                size="small"
                type="danger"
                @click="rejectReview(row.id)"
              >
                拒绝
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 审核详情对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="审核详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReview" class="review-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="专利号">
            {{ currentReview.patentNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="专利标题">
            {{ currentReview.title }}
          </el-descriptions-item>
          <el-descriptions-item label="专利类型">
            {{ getTypeText(currentReview.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ currentReview.applicant }}
          </el-descriptions-item>
          <el-descriptions-item label="提交日期">
            {{ currentReview.submitDate }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentReview.status)">
              {{ getStatusText(currentReview.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="review-form" v-if="currentReview.status === 'pending'">
          <h3>审核意见</h3>
          <el-form :model="reviewForm" label-width="100px">
            <el-form-item label="审核结果">
              <el-radio-group v-model="reviewForm.result">
                <el-radio value="approved">通过</el-radio>
                <el-radio value="rejected">拒绝</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="审核意见">
              <el-input
                v-model="reviewForm.comment"
                type="textarea"
                :rows="4"
                placeholder="请输入审核意见..."
              />
            </el-form-item>
          </el-form>
        </div>

        <div
          v-if="currentReview.reviewHistory.length > 0"
          class="review-history"
        >
          <h3>审核历史</h3>
          <el-timeline>
            <el-timeline-item
              v-for="item in currentReview.reviewHistory"
              :key="item.id"
              :timestamp="item.time"
              :type="getTimelineType(item.action)"
            >
              <div class="timeline-content">
                <p>
                  <strong>{{ item.reviewer }}</strong> {{ item.action }}
                </p>
                <p v-if="item.comment" class="comment">{{ item.comment }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">关闭</el-button>
          <el-button
            v-if="currentReview?.status === 'pending'"
            type="primary"
            :loading="submitting"
            @click="submitReview"
          >
            提交审核
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/user";
import { usePatentStore } from "@/stores/patent";
import { hasPermission } from "@/utils/permissions";

// 审核记录接口
interface ReviewItem {
  id: number;
  patentId: number;
  patentNumber: string;
  title: string;
  type: string;
  applicant: string;
  submitDate: string;
  status: "pending" | "approved" | "rejected";
  priority: "high" | "medium" | "low";
  reviewHistory: ReviewHistoryItem[];
}

interface ReviewHistoryItem {
  id: number;
  reviewer: string;
  action: string;
  comment?: string;
  time: string;
}

const router = useRouter();
const userStore = useUserStore();
const patentStore = usePatentStore();

// 权限检查
const canReview = computed(() => {
  return hasPermission(
    userStore.currentUser?.role || "user",
    "canAccessReviewCenter"
  );
});

// 响应式数据
const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedReviews = ref<number[]>([]);
const reviewDialogVisible = ref(false);
const currentReview = ref<ReviewItem | null>(null);

// 筛选表单
const filterForm = reactive({
  status: "",
  type: "",
  dateRange: null as [string, string] | null,
});

// 审核表单
const reviewForm = reactive({
  result: "approved" as "approved" | "rejected",
  comment: "",
});

// 使用真实的专利申请数据
const reviews = computed(() => {
  return patentStore.getApplications().map((app) => ({
    id: app.id,
    patentId: app.patentId,
    patentNumber: app.patentNumber,
    title: app.title,
    type: app.type,
    applicant: app.applicant,
    submitDate: app.submitDate,
    status: app.status,
    priority: app.priority,
    reviewHistory: app.reviewHistory,
  }));
});

// 统计信息
const statistics = computed(() => {
  const pending = reviews.value.filter((r) => r.status === "pending").length;
  const approved = reviews.value.filter((r) => r.status === "approved").length;
  const rejected = reviews.value.filter((r) => r.status === "rejected").length;
  const today = reviews.value.filter((r) => {
    const today = new Date().toISOString().split("T")[0];
    return r.submitDate === today;
  }).length;

  return { pending, approved, rejected, today };
});

// 筛选后的审核列表
const filteredReviews = computed(() => {
  let filtered = [...reviews.value];

  if (filterForm.status) {
    filtered = filtered.filter((r) => r.status === filterForm.status);
  }

  if (filterForm.type) {
    filtered = filtered.filter((r) => r.type === filterForm.type);
  }

  if (filterForm.dateRange) {
    const [start, end] = filterForm.dateRange;
    filtered = filtered.filter(
      (r) => r.submitDate >= start && r.submitDate <= end
    );
  }

  total.value = filtered.length;
  return filtered;
});

// 方法
const handleFilter = () => {
  currentPage.value = 1;
  ElMessage.success(`筛选完成，找到 ${filteredReviews.value.length} 条记录`);
};

const handleResetFilter = () => {
  Object.assign(filterForm, {
    status: "",
    type: "",
    dateRange: null,
  });
  currentPage.value = 1;
  ElMessage.success("已重置筛选条件");
};

const handleRefresh = () => {
  ElMessage.success("数据已刷新");
};

const handleSelectionChange = (selection: ReviewItem[]) => {
  selectedReviews.value = selection.map((item) => item.id);
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const viewPatent = (patentId: number) => {
  router.push(`/dashboard/patents/${patentId}`);
};

const viewReview = (reviewId: number) => {
  const review = reviews.value.find((r) => r.id === reviewId);
  if (review) {
    currentReview.value = review;
    reviewForm.result = "approved";
    reviewForm.comment = "";
    reviewDialogVisible.value = true;
  }
};

const approveReview = async (reviewId: number) => {
  try {
    await ElMessageBox.confirm("确定要通过这个专利申请吗？", "确认审核", {
      confirmButtonText: "通过",
      cancelButtonText: "取消",
      type: "success",
    });

    await patentStore.reviewApplication(reviewId, "approved");
    ElMessage.success("审核通过，专利申请已转为正式专利");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("审核失败");
    }
  }
};

const rejectReview = async (reviewId: number) => {
  try {
    const { value } = await ElMessageBox.prompt("请输入拒绝理由", "确认拒绝", {
      confirmButtonText: "拒绝",
      cancelButtonText: "取消",
      inputType: "textarea",
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return "请输入拒绝理由";
        }
        return true;
      },
    });

    await patentStore.reviewApplication(reviewId, "rejected", value);
    ElMessage.success("已拒绝申请");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("审核失败");
    }
  }
};

const submitReview = async () => {
  if (!currentReview.value) return;

  try {
    submitting.value = true;

    // 调用真实的审核API
    await patentStore.reviewApplication(
      currentReview.value.id,
      reviewForm.result,
      reviewForm.comment
    );

    ElMessage.success(
      reviewForm.result === "approved"
        ? "审核通过，专利申请已转为正式专利"
        : "已拒绝申请"
    );
    reviewDialogVisible.value = false;
  } catch (error) {
    ElMessage.error("审核失败");
  } finally {
    submitting.value = false;
  }
};

// 工具函数
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
  };
  return texts[status] || status;
};

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    invention: "发明专利",
    utility_model: "实用新型",
    design: "外观设计",
    software: "软件专利",
  };
  return texts[type] || type;
};

const getPriorityType = (priority: string) => {
  const types: Record<string, string> = {
    high: "danger",
    medium: "warning",
    low: "info",
  };
  return types[priority] || "info";
};

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: "高",
    medium: "中",
    low: "低",
  };
  return texts[priority] || priority;
};

const getTimelineType = (action: string) => {
  if (action.includes("通过")) return "success";
  if (action.includes("拒绝")) return "danger";
  return "primary";
};

// 权限检查
onMounted(() => {
  if (!canReview.value) {
    ElMessage.error("您没有访问审核中心的权限");
    router.push("/dashboard");
  }
});
</script>

<style scoped>
.review-center {
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
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

.filter-section {
  margin-bottom: 20px;
}

.list-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.review-detail {
  max-height: 600px;
  overflow-y: auto;
}

.review-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.review-history {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.timeline-content .comment {
  color: #666;
  font-size: 0.9em;
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
