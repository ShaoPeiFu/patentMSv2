<template>
  <div class="document-approval-flow">
    <el-card>
      <template #header>
        <div class="flow-header">
          <h3>文档审批流程</h3>
          <div class="header-actions">
            <el-button
              v-if="!approvalProcess && canStartApproval"
              type="primary"
              @click="showStartDialog = true"
            >
              <el-icon><VideoPlay /></el-icon>
              启动审批
            </el-button>
            <el-button
              v-if="approvalProcess && canApprove"
              type="success"
              @click="showApprovalDialog = true"
            >
              <el-icon><Check /></el-icon>
              批准
            </el-button>
            <el-button
              v-if="approvalProcess && canApprove"
              type="danger"
              @click="showRejectDialog = true"
            >
              <el-icon><Close /></el-icon>
              拒绝
            </el-button>
          </div>
        </div>
      </template>

      <!-- 当前状态 -->
      <div class="current-status" v-if="documentVersion">
        <el-alert
          :title="getStatusTitle()"
          :type="getStatusType()"
          :description="getStatusDescription()"
          show-icon
          :closable="false"
        />
      </div>

      <!-- 审批流程图 -->
      <div class="approval-flow" v-if="currentWorkflow">
        <h4>审批流程: {{ currentWorkflow.name }}</h4>
        <div class="flow-steps">
          <div
            v-for="(step, index) in currentWorkflow.steps"
            :key="step.id"
            class="flow-step"
            :class="{
              active:
                approvalProcess &&
                approvalProcess.currentStep === step.stepNumber,
              completed:
                approvalProcess &&
                approvalProcess.currentStep > step.stepNumber,
              pending:
                !approvalProcess ||
                approvalProcess.currentStep < step.stepNumber,
            }"
          >
            <div class="step-number">
              <el-icon v-if="isStepCompleted(step.stepNumber)"
                ><Check
              /></el-icon>
              <el-icon v-else-if="isStepActive(step.stepNumber)"
                ><Clock
              /></el-icon>
              <span v-else>{{ step.stepNumber }}</span>
            </div>
            <div class="step-content">
              <div class="step-name">{{ step.name }}</div>
              <div class="step-description">{{ step.description }}</div>
              <div class="step-approvers">
                <el-tag
                  v-for="role in step.approverRoles"
                  :key="role"
                  size="small"
                  type="info"
                >
                  {{ getRoleText(role) }}
                </el-tag>
              </div>
              <div class="step-timing" v-if="step.timeLimit">
                <el-icon><Timer /></el-icon>
                {{ step.timeLimit }}小时内完成
              </div>
            </div>
            <div
              class="step-connector"
              v-if="index < currentWorkflow.steps.length - 1"
            >
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 审批历史 -->
      <div class="approval-history" v-if="approvalProcess">
        <el-divider content-position="left">
          <h4>审批记录</h4>
        </el-divider>

        <!-- 批准记录 -->
        <div
          class="approval-records"
          v-if="approvalProcess.approvals.length > 0"
        >
          <h5>批准记录</h5>
          <div class="record-list">
            <div
              v-for="approval in approvalProcess.approvals"
              :key="approval.id"
              class="record-item approved"
            >
              <div class="record-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="record-content">
                <div class="record-user">{{ approval.approverName }}</div>
                <div class="record-time">
                  {{ formatDate(approval.approvedAt) }}
                </div>
                <div class="record-comment" v-if="approval.comment">
                  {{ approval.comment }}
                </div>
                <div class="record-signature" v-if="approval.signature">
                  <el-tag type="success" size="small">
                    <el-icon><EditPen /></el-icon>
                    已签名
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 拒绝记录 -->
        <div
          class="rejection-records"
          v-if="approvalProcess.rejections.length > 0"
        >
          <h5>拒绝记录</h5>
          <div class="record-list">
            <div
              v-for="rejection in approvalProcess.rejections"
              :key="rejection.id"
              class="record-item rejected"
            >
              <div class="record-icon">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="record-content">
                <div class="record-user">{{ rejection.approverName }}</div>
                <div class="record-time">
                  {{ formatDate(rejection.approvedAt) }}
                </div>
                <div class="record-comment">{{ rejection.comment }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 评论记录 -->
        <div class="comment-records" v-if="approvalProcess.comments.length > 0">
          <h5>评论记录</h5>
          <div class="record-list">
            <div
              v-for="comment in approvalProcess.comments"
              :key="comment.id"
              class="record-item comment"
            >
              <div class="record-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="record-content">
                <div class="record-user">{{ comment.userName }}</div>
                <div class="record-time">
                  {{ formatDate(comment.createdAt) }}
                </div>
                <div class="record-comment">{{ comment.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无审批流程 -->
      <div class="no-approval" v-if="!approvalProcess && !currentWorkflow">
        <el-empty description="暂无审批流程">
          <el-button type="primary" @click="showStartDialog = true">
            启动审批流程
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 启动审批对话框 -->
    <el-dialog v-model="showStartDialog" title="启动审批流程" width="500px">
      <el-form :model="startForm" label-width="80px">
        <el-form-item label="审批流程">
          <el-select v-model="startForm.workflowId" placeholder="选择审批流程">
            <el-option
              v-for="workflow in availableWorkflows"
              :key="workflow.id"
              :label="workflow.name"
              :value="workflow.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="startForm.comment"
            type="textarea"
            rows="3"
            placeholder="可选：添加说明信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStartDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="startApproval"
          :loading="starting"
          :disabled="!startForm.workflowId"
        >
          启动
        </el-button>
      </template>
    </el-dialog>

    <!-- 批准对话框 -->
    <el-dialog v-model="showApprovalDialog" title="批准文档" width="500px">
      <el-form :model="approvalForm" label-width="80px">
        <el-form-item label="批准意见">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            rows="3"
            placeholder="请输入批准意见（可选）"
          />
        </el-form-item>
        <el-form-item label="电子签名">
          <div class="signature-section">
            <el-button @click="showSignatureDialog = true">
              <el-icon><EditPen /></el-icon>
              添加电子签名
            </el-button>
            <div v-if="approvalForm.signature" class="signature-preview">
              <el-tag type="success">已添加签名</el-tag>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApprovalDialog = false">取消</el-button>
        <el-button type="success" @click="performApproval" :loading="approving">
          确认批准
        </el-button>
      </template>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog v-model="showRejectDialog" title="拒绝文档" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.comment"
            type="textarea"
            rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button
          type="danger"
          @click="performRejection"
          :loading="rejecting"
          :disabled="!rejectForm.comment.trim()"
        >
          确认拒绝
        </el-button>
      </template>
    </el-dialog>

    <!-- 电子签名对话框 -->
    <ElectronicSignature
      v-model="showSignatureDialog"
      @signature-created="handleSignatureCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDocumentStore } from "@/stores/document";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import {
  VideoPlay,
  Check,
  Close,
  Clock,
  Timer,
  ArrowRight,
  CircleCheck,
  CircleClose,
  ChatDotRound,
  EditPen,
} from "@element-plus/icons-vue";
import ElectronicSignature from "./ElectronicSignature.vue";
import type {
  DocumentVersion,
  ElectronicSignature as ElectronicSignatureType,
} from "@/types/document";

// Props
interface Props {
  documentVersion: DocumentVersion;
}

const props = defineProps<Props>();

// Store
const documentStore = useDocumentStore();
const userStore = useUserStore();

// 响应式数据
const showStartDialog = ref(false);
const showApprovalDialog = ref(false);
const showRejectDialog = ref(false);
const showSignatureDialog = ref(false);
const starting = ref(false);
const approving = ref(false);
const rejecting = ref(false);

const startForm = ref({
  workflowId: "",
  comment: "",
});

const approvalForm = ref({
  comment: "",
  signature: null as ElectronicSignatureType | null,
});

const rejectForm = ref({
  comment: "",
});

// 计算属性
const approvalProcess = computed(() => {
  return documentStore.approvalProcesses.find(
    (p) => p.documentVersionId === props.documentVersion.id
  );
});

const currentWorkflow = computed(() => {
  if (!approvalProcess.value) return null;
  return documentStore.approvalWorkflows.find(
    (w) => w.id === approvalProcess.value!.workflowId
  );
});

const availableWorkflows = computed(() => {
  return documentStore.approvalWorkflows.filter((w) => w.isActive);
});

const canStartApproval = computed(() => {
  const currentUser = userStore.currentUser;
  if (!currentUser) return false;

  // 只有管理员和审核员可以启动审批
  return (
    ["admin", "reviewer"].includes(currentUser.role) &&
    props.documentVersion.status === "draft"
  );
});

const canApprove = computed(() => {
  const currentUser = userStore.currentUser;
  if (!currentUser || !approvalProcess.value || !currentWorkflow.value) {
    return false;
  }

  if (approvalProcess.value.status !== "pending") {
    return false;
  }

  const currentStep = currentWorkflow.value.steps.find(
    (s) => s.stepNumber === approvalProcess.value!.currentStep
  );

  if (!currentStep) return false;

  // 检查用户是否有权限审批当前步骤
  return (
    currentStep.approverRoles.includes(currentUser.role) ||
    currentStep.approverUsers?.includes(currentUser.id)
  );
});

// 方法
const isStepCompleted = (stepNumber: number) => {
  return (
    approvalProcess.value && approvalProcess.value.currentStep > stepNumber
  );
};

const isStepActive = (stepNumber: number) => {
  return (
    approvalProcess.value && approvalProcess.value.currentStep === stepNumber
  );
};

const getStatusTitle = () => {
  const status = props.documentVersion.status;
  const statusMap = {
    draft: "草稿状态",
    pending: "待审批",
    approved: "已批准",
    rejected: "已拒绝",
    archived: "已归档",
    obsolete: "已过时",
  };
  return statusMap[status] || "未知状态";
};

const getStatusType = () => {
  const status = props.documentVersion.status;
  const typeMap = {
    draft: "info",
    pending: "warning",
    approved: "success",
    rejected: "error",
    archived: "info",
    obsolete: "info",
  } as const;
  return typeMap[status] || "info";
};

const getStatusDescription = () => {
  const status = props.documentVersion.status;
  const process = approvalProcess.value;

  if (status === "pending" && process && currentWorkflow.value) {
    const currentStep = currentWorkflow.value.steps.find(
      (s) => s.stepNumber === process.currentStep
    );
    return `当前处于"${currentStep?.name}"步骤，等待审批`;
  }

  const descMap = {
    draft: "文档处于草稿状态，可以启动审批流程",
    pending: "文档正在审批中",
    approved: "文档已通过所有审批步骤",
    rejected: "文档审批被拒绝",
    archived: "文档已归档",
    obsolete: "文档已过时",
  };
  return descMap[status] || "";
};

const getRoleText = (role: string) => {
  const roleMap = {
    admin: "管理员",
    reviewer: "审核员",
    user: "普通用户",
  };
  return roleMap[role as keyof typeof roleMap] || role;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

const startApproval = async () => {
  if (!startForm.value.workflowId) {
    ElMessage.warning("请选择审批流程");
    return;
  }

  starting.value = true;

  try {
    await documentStore.startApprovalProcess(
      props.documentVersion.id,
      startForm.value.workflowId
    );

    ElMessage.success("审批流程已启动");
    showStartDialog.value = false;
    startForm.value = { workflowId: "", comment: "" };
  } catch (error) {
    ElMessage.error("启动审批失败: " + (error as Error).message);
  } finally {
    starting.value = false;
  }
};

const performApproval = async () => {
  if (!approvalProcess.value) return;

  const currentUser = userStore.currentUser;
  if (!currentUser) {
    ElMessage.error("用户未登录");
    return;
  }

  approving.value = true;

  try {
    await documentStore.approveDocument(
      approvalProcess.value.id,
      currentUser.id,
      approvalForm.value.comment || undefined,
      approvalForm.value.signature || undefined
    );

    ElMessage.success("文档已批准");
    showApprovalDialog.value = false;
    approvalForm.value = { comment: "", signature: null };
  } catch (error) {
    ElMessage.error("批准失败: " + (error as Error).message);
  } finally {
    approving.value = false;
  }
};

const performRejection = async () => {
  if (!approvalProcess.value) return;

  const currentUser = userStore.currentUser;
  if (!currentUser) {
    ElMessage.error("用户未登录");
    return;
  }

  rejecting.value = true;

  try {
    await documentStore.rejectDocument(
      approvalProcess.value.id,
      currentUser.id,
      rejectForm.value.comment
    );

    ElMessage.success("文档已拒绝");
    showRejectDialog.value = false;
    rejectForm.value = { comment: "" };
  } catch (error) {
    ElMessage.error("拒绝失败: " + (error as Error).message);
  } finally {
    rejecting.value = false;
  }
};

const handleSignatureCreated = (signature: ElectronicSignatureType) => {
  approvalForm.value.signature = signature;
  ElMessage.success("电子签名已添加");
};

// 生命周期
onMounted(() => {
  // 可以在这里添加初始化逻辑
});
</script>

<style scoped>
.document-approval-flow {
  margin-bottom: 20px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.flow-header h3 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.current-status {
  margin-bottom: 24px;
}

.approval-flow h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.flow-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
  overflow-x: auto;
  padding: 20px 0;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
  position: relative;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 12px;
  background: #f0f0f0;
  color: #909399;
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
}

.flow-step.active .step-number {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.flow-step.completed .step-number {
  background: #67c23a;
  color: white;
  border-color: #67c23a;
}

.step-content {
  text-align: center;
  max-width: 180px;
}

.step-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.step-description {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.step-approvers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.step-timing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #e6a23c;
}

.step-connector {
  position: absolute;
  top: 20px;
  right: -20px;
  color: #e4e7ed;
  font-size: 18px;
}

.flow-step.completed .step-connector {
  color: #67c23a;
}

.approval-history {
  margin-top: 24px;
}

.approval-records h5,
.rejection-records h5,
.comment-records h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.record-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.record-item.approved {
  background: rgba(103, 194, 58, 0.05);
  border-color: #67c23a;
}

.record-item.rejected {
  background: rgba(245, 108, 108, 0.05);
  border-color: #f56c6c;
}

.record-item.comment {
  background: rgba(64, 158, 255, 0.05);
  border-color: #409eff;
}

.record-icon {
  flex-shrink: 0;
  color: inherit;
}

.record-item.approved .record-icon {
  color: #67c23a;
}

.record-item.rejected .record-icon {
  color: #f56c6c;
}

.record-item.comment .record-icon {
  color: #409eff;
}

.record-content {
  flex: 1;
}

.record-user {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.record-comment {
  color: #606266;
  line-height: 1.4;
  margin-bottom: 4px;
}

.record-signature {
  margin-top: 4px;
}

.no-approval {
  text-align: center;
  padding: 40px;
}

.signature-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.signature-preview {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .flow-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .flow-steps {
    flex-direction: column;
    align-items: stretch;
  }

  .flow-step {
    flex-direction: row;
    min-width: auto;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .step-number {
    margin-right: 12px;
    margin-bottom: 0;
  }

  .step-content {
    text-align: left;
    max-width: none;
    flex: 1;
  }

  .step-connector {
    display: none;
  }
}
</style>
