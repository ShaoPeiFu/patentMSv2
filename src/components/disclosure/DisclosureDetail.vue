<template>
  <div class="disclosure-detail">
    <div class="detail-content">
      <!-- 基本信息 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>基本信息</h3>
            <div class="status-badge">
              <el-tag :type="getStatusType(disclosure.status)" size="large">
                {{ getStatusLabel(disclosure.status) }}
              </el-tag>
            </div>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="公司案号">
            <span class="file-number">{{ disclosure.companyFileNumber }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(disclosure.submissionDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">
            {{ disclosure.title }}
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            <el-tag size="small">{{
              getDepartmentLabel(disclosure.department)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="技术领域">
            {{ disclosure.technicalField || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="发明人">
            <div class="person-tags">
              <el-tag
                v-for="inventor in getPersonArray(disclosure.inventors)"
                :key="inventor"
                size="small"
                class="person-tag"
              >
                {{ inventor }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            <div class="person-tags">
              <el-tag
                v-for="applicant in getPersonArray(disclosure.applicants)"
                :key="applicant"
                size="small"
                class="person-tag"
                type="info"
              >
                {{ applicant }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="关键词" :span="2">
            <div class="keyword-tags">
              <el-tag
                v-for="keyword in getKeywordArray(disclosure.keywords)"
                :key="keyword"
                size="small"
                class="keyword-tag"
                type="warning"
                effect="plain"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="提交人">
            {{ disclosure.submitter?.realName || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="联系方式">
            {{ disclosure.submitter?.email || "-" }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 技术描述 -->
      <el-card class="description-card" shadow="never">
        <template #header>
          <h3>技术描述</h3>
        </template>
        <div class="description-content">
          {{ disclosure.description }}
        </div>
      </el-card>

      <!-- 附件信息 -->
      <el-card
        v-if="attachments.length > 0"
        class="attachments-card"
        shadow="never"
      >
        <template #header>
          <h3>附件文件</h3>
        </template>
        <div class="attachments-list">
          <div
            v-for="(file, index) in attachments"
            :key="index"
            class="attachment-item"
          >
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-info">
              <div class="file-name">{{ file.originalName }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-type">{{ getFileType(file.mimetype) }}</span>
              </div>
            </div>
            <el-button type="primary" size="small" @click="downloadFile(file)">
              下载
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 评估记录 -->
      <el-card
        v-if="disclosure.evaluations && disclosure.evaluations.length > 0"
        class="evaluations-card"
        shadow="never"
      >
        <template #header>
          <h3>评估记录</h3>
        </template>
        <div class="evaluations-timeline">
          <el-timeline>
            <el-timeline-item
              v-for="evaluation in disclosure.evaluations"
              :key="evaluation.id"
              :timestamp="formatDateTime(evaluation.evaluationDate)"
              placement="top"
            >
              <el-card class="evaluation-item">
                <div class="evaluation-header">
                  <div class="evaluator-info">
                    <span class="evaluator-name">{{
                      evaluation.evaluator?.realName
                    }}</span>
                    <el-tag
                      :type="
                        getEvaluationResultType(evaluation.evaluationResult)
                      "
                      size="small"
                    >
                      {{
                        getEvaluationResultLabel(evaluation.evaluationResult)
                      }}
                    </el-tag>
                  </div>
                  <div class="evaluation-type">
                    <el-tag size="small" type="info">{{
                      getEvaluationTypeLabel(evaluation.evaluationType)
                    }}</el-tag>
                  </div>
                </div>

                <div
                  v-if="evaluation.positiveOpinions"
                  class="evaluation-section"
                >
                  <h4>正面意见</h4>
                  <p>{{ evaluation.positiveOpinions }}</p>
                </div>

                <div
                  v-if="evaluation.negativeOpinions"
                  class="evaluation-section"
                >
                  <h4>负面意见</h4>
                  <p>{{ evaluation.negativeOpinions }}</p>
                </div>

                <div
                  v-if="evaluation.modificationSuggestions"
                  class="evaluation-section"
                >
                  <h4>修改建议</h4>
                  <p>{{ evaluation.modificationSuggestions }}</p>
                </div>

                <div v-if="evaluation.comments" class="evaluation-section">
                  <h4>评估意见</h4>
                  <p>{{ evaluation.comments }}</p>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>

      <!-- 代理分配记录 -->
      <el-card
        v-if="disclosure.agencies && disclosure.agencies.length > 0"
        class="agencies-card"
        shadow="never"
      >
        <template #header>
          <h3>代理分配记录</h3>
        </template>
        <div class="agencies-list">
          <div
            v-for="assignment in disclosure.agencies"
            :key="assignment.id"
            class="agency-item"
          >
            <div class="agency-info">
              <div class="agency-name">{{ assignment.agency?.name }}</div>
              <div class="agency-contact">
                联系人：{{ assignment.agency?.contactPerson }}
              </div>
              <div class="assignment-meta">
                <span>分配人：{{ assignment.assignedByUser?.realName }}</span>
                <span
                  >分配时间：{{
                    formatDateTime(assignment.assignmentDate)
                  }}</span
                >
              </div>
            </div>
            <div class="assignment-status">
              <el-tag :type="getAssignmentStatusType(assignment.status)">
                {{ getAssignmentStatusLabel(assignment.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <el-button @click="$emit('close')">关闭</el-button>
      <el-button
        v-if="canEdit"
        type="primary"
        @click="$emit('edit', disclosure)"
      >
        编辑
      </el-button>
      <el-button
        v-if="canEvaluate"
        type="warning"
        @click="$emit('evaluate', disclosure)"
      >
        评估
      </el-button>
      <el-button
        v-if="canAssign"
        type="success"
        @click="$emit('assign', disclosure)"
      >
        分配代理
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Document } from "@element-plus/icons-vue";
import { useUserStore } from "../../stores/user";
import type { DisclosureDocument } from "../../types/disclosure";

interface Props {
  disclosure: DisclosureDocument;
}

const props = defineProps<Props>();

// const emit = defineEmits<{
//   close: [];
//   edit: [disclosure: DisclosureDocument];
//   evaluate: [disclosure: DisclosureDocument];
//   assign: [disclosure: DisclosureDocument];
// }>();

const userStore = useUserStore();

// 计算属性
const attachments = computed(() => {
  if (!props.disclosure.attachments) return [];
  try {
    return JSON.parse(props.disclosure.attachments);
  } catch {
    return [];
  }
});

const canEdit = computed(() => {
  const user = userStore.currentUser;
  return (
    user && (user.role === "admin" || props.disclosure.submitterId === user.id)
  );
});

const canEvaluate = computed(() => {
  const user = userStore.currentUser;
  return (
    user &&
    ["admin", "reviewer"].includes(user.role) &&
    ["submitted", "under_evaluation"].includes(props.disclosure.status)
  );
});

const canAssign = computed(() => {
  const user = userStore.currentUser;
  return (
    user && user.role === "admin" && props.disclosure.status === "approved"
  );
});

// 工具函数
const departments = [
  { label: "管理部", value: "admin" },
  { label: "研发部", value: "research" },
  { label: "开发部", value: "development" },
  { label: "法务部", value: "legal" },
  { label: "市场部", value: "marketing" },
  { label: "财务部", value: "finance" },
  { label: "人事部", value: "hr" },
];

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

const getEvaluationResultType = (result: string) => {
  const typeMap: Record<string, string> = {
    approved: "success",
    rejected: "danger",
    needs_modification: "warning",
  };
  return typeMap[result] || "";
};

const getEvaluationResultLabel = (result: string) => {
  const labelMap: Record<string, string> = {
    approved: "通过",
    rejected: "驳回",
    needs_modification: "需要修改",
  };
  return labelMap[result] || result;
};

const getEvaluationTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    initial: "初步评估",
    detailed: "详细评估",
    final: "最终评估",
  };
  return labelMap[type] || type;
};

const getAssignmentStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    assigned: "info",
    in_progress: "warning",
    completed: "success",
    cancelled: "danger",
  };
  return typeMap[status] || "";
};

const getAssignmentStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    assigned: "已分配",
    in_progress: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };
  return labelMap[status] || status;
};

const getPersonArray = (persons?: string) => {
  if (!persons) return [];
  return persons
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p);
};

const getKeywordArray = (keywords?: string) => {
  if (!keywords) return [];
  return keywords
    .split(";")
    .map((k) => k.trim())
    .filter((k) => k);
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileType = (mimetype: string) => {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "application/msword": "Word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Word",
    "application/vnd.ms-excel": "Excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "Excel",
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/gif": "GIF",
  };
  return typeMap[mimetype] || "未知";
};

const downloadFile = (file: any) => {
  // TODO: 实现文件下载
  console.log("下载文件:", file);
};
</script>

<style scoped lang="scss">
.disclosure-detail {
  .detail-content {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 8px;

    .info-card,
    .description-card,
    .attachments-card,
    .evaluations-card,
    .agencies-card {
      margin-bottom: 16px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: #303133;
          font-size: 16px;
          font-weight: 600;
        }
      }
    }

    .file-number {
      font-weight: 600;
      color: #409eff;
    }

    .person-tags,
    .keyword-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .person-tag,
      .keyword-tag {
        margin: 0;
      }
    }

    .description-content {
      line-height: 1.6;
      color: #606266;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .attachments-list {
      .attachment-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        margin-bottom: 8px;

        .file-icon {
          font-size: 24px;
          color: #409eff;
          margin-right: 12px;
        }

        .file-info {
          flex: 1;

          .file-name {
            font-weight: 500;
            color: #303133;
            margin-bottom: 4px;
          }

          .file-meta {
            font-size: 12px;
            color: #909399;

            span {
              margin-right: 12px;
            }
          }
        }
      }
    }

    .evaluations-timeline {
      .evaluation-item {
        .evaluation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .evaluator-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .evaluator-name {
              font-weight: 500;
              color: #303133;
            }
          }
        }

        .evaluation-section {
          margin-bottom: 12px;

          h4 {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 500;
            color: #606266;
          }

          p {
            margin: 0;
            line-height: 1.5;
            color: #303133;
          }
        }
      }
    }

    .agencies-list {
      .agency-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        margin-bottom: 8px;

        .agency-info {
          .agency-name {
            font-weight: 500;
            color: #303133;
            margin-bottom: 4px;
          }

          .agency-contact {
            font-size: 14px;
            color: #606266;
            margin-bottom: 4px;
          }

          .assignment-meta {
            font-size: 12px;
            color: #909399;

            span {
              margin-right: 16px;
            }
          }
        }
      }
    }
  }

  .actions-section {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 16px 0;
    border-top: 1px solid #ebeef5;
    margin-top: 16px;
  }
}

// 滚动条样式
.detail-content {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}
</style>
