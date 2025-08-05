<template>
  <div class="document-management-demo">
    <div class="page-header">
      <h1>文档版本管理功能演示</h1>
      <p>体验文档版本控制、版本对比、审批流程、电子签名等功能</p>
    </div>

    <!-- 功能介绍 -->
    <el-card class="feature-intro">
      <template #header>
        <h2>✨ 新功能亮点</h2>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><DocumentIcon /></el-icon>
            <h3>版本控制</h3>
            <p>完整的文档版本管理，支持版本历史、版本恢复、版本对比</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><DocumentCopy /></el-icon>
            <h3>版本对比</h3>
            <p>直观的版本差异对比，支持文件内容、元数据等多维度对比</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><CircleCheck /></el-icon>
            <h3>审批流程</h3>
            <p>可配置的审批工作流，支持多级审批、并行审批、时间限制</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><EditPen /></el-icon>
            <h3>电子签名</h3>
            <p>多种签名方式：手绘签名、文字签名、数字证书签名</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 演示区域 -->
    <el-card class="demo-area">
      <template #header>
        <h2>🎯 功能演示</h2>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <!-- 版本管理演示 -->
        <el-tab-pane label="版本管理" name="version">
          <div class="demo-section">
            <h3>1. 文档版本管理</h3>
            <p>展示完整的文档版本管理功能，包括上传、下载、恢复等操作：</p>
            <DocumentVersionManager :document-id="demoDocumentId" />
          </div>
        </el-tab-pane>

        <!-- 版本对比演示 -->
        <el-tab-pane label="版本对比" name="compare">
          <div class="demo-section">
            <h3>2. 版本对比功能</h3>
            <p>选择两个版本进行详细对比，查看差异和相似度：</p>
            <DocumentVersionCompare :document-id="demoDocumentId" />
          </div>
        </el-tab-pane>

        <!-- 审批流程演示 -->
        <el-tab-pane label="审批流程" name="approval">
          <div class="demo-section">
            <h3>3. 审批流程管理</h3>
            <p>体验完整的文档审批流程，包括启动审批、批准、拒绝等操作：</p>
            <div v-if="demoVersion">
              <DocumentApprovalFlow :document-version="demoVersion" />
            </div>
            <div v-else class="no-version">
              <el-empty description="请先上传文档版本以体验审批流程" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 电子签名演示 -->
        <el-tab-pane label="电子签名" name="signature">
          <div class="demo-section">
            <h3>4. 电子签名功能</h3>
            <p>体验多种电子签名方式：</p>
            <div class="signature-demo">
              <el-button type="primary" @click="showSignatureDialog = true">
                <el-icon><EditPen /></el-icon>
                创建电子签名
              </el-button>

              <div v-if="demoSignatures.length > 0" class="signatures-list">
                <h4>已创建的签名：</h4>
                <div
                  v-for="signature in demoSignatures"
                  :key="signature.id"
                  class="signature-item"
                >
                  <div class="signature-info">
                    <div>
                      <strong>签名者:</strong> {{ signature.signerName }}
                    </div>
                    <div>
                      <strong>签名类型:</strong>
                      {{ getSignatureTypeText(signature.signatureType) }}
                    </div>
                    <div>
                      <strong>签名时间:</strong>
                      {{ formatDate(signature.signedAt) }}
                    </div>
                  </div>
                  <div class="signature-preview">
                    <img
                      v-if="signature.signatureData.startsWith('data:image')"
                      :src="signature.signatureData"
                      alt="签名预览"
                      style="max-width: 200px; max-height: 60px"
                    />
                    <div v-else class="text-signature">
                      {{ signature.signerName }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 工作流配置演示 -->
        <el-tab-pane label="工作流配置" name="workflow">
          <div class="demo-section">
            <h3>5. 审批工作流配置</h3>
            <p>查看和配置审批工作流：</p>
            <div class="workflow-demo">
              <div class="workflow-list">
                <h4>可用的工作流：</h4>
                <div
                  v-for="workflow in availableWorkflows"
                  :key="workflow.id"
                  class="workflow-item"
                >
                  <div class="workflow-header">
                    <h5>{{ workflow.name }}</h5>
                    <el-tag :type="workflow.isActive ? 'success' : 'info'">
                      {{ workflow.isActive ? "启用" : "禁用" }}
                    </el-tag>
                  </div>
                  <p>{{ workflow.description }}</p>
                  <div class="workflow-steps">
                    <div
                      v-for="step in workflow.steps"
                      :key="step.id"
                      class="step-item"
                    >
                      <div class="step-number">{{ step.stepNumber }}</div>
                      <div class="step-info">
                        <div class="step-name">{{ step.name }}</div>
                        <div class="step-roles">
                          <el-tag
                            v-for="role in step.approverRoles"
                            :key="role"
                            size="small"
                          >
                            {{ getRoleText(role) }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <el-button type="primary" @click="createCustomWorkflow">
                <el-icon><Plus /></el-icon>
                创建自定义工作流
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 系统统计 -->
    <el-card class="stats-section">
      <template #header>
        <h2>📊 系统统计</h2>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-number">{{ documentStats.totalVersions }}</div>
            <div class="stat-label">文档版本数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-number">{{ documentStats.pendingApprovals }}</div>
            <div class="stat-label">待审批</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-number">
              {{ formatFileSize(documentStats.storageUsed) }}
            </div>
            <div class="stat-label">存储使用</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-number">{{ documentStats.recentActivity }}</div>
            <div class="stat-label">近期活动</div>
          </div>
        </el-col>
      </el-row>

      <!-- 状态分布 -->
      <div class="status-distribution">
        <h4>文档状态分布：</h4>
        <el-row :gutter="12">
          <el-col
            v-for="(count, status) in documentStats.byStatus"
            :key="status"
            :span="4"
          >
            <div class="status-card">
              <div class="status-count">{{ count }}</div>
              <div class="status-name">{{ getStatusText(status) }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 测试功能 -->
    <el-card class="test-section">
      <template #header>
        <h2>🧪 测试功能</h2>
      </template>
      <div class="test-actions">
        <el-button @click="addTestDocumentVersions">
          添加测试文档版本
        </el-button>
        <el-button @click="clearAllData" type="danger">
          清空所有数据
        </el-button>
        <el-button @click="exportDocumentData"> 导出文档数据 </el-button>
        <el-button @click="showImportDialog = true"> 导入文档数据 </el-button>
      </div>
    </el-card>

    <!-- 电子签名对话框 -->
    <ElectronicSignature
      v-model="showSignatureDialog"
      @signature-created="handleSignatureCreated"
    />

    <!-- 导入对话框 -->
    <el-dialog v-model="showImportDialog" title="导入文档数据" width="500px">
      <el-input
        v-model="importData"
        type="textarea"
        rows="10"
        placeholder="请粘贴导出的JSON数据"
      />
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importDocumentData">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDocumentStore } from "@/stores/document";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Document,
  DocumentCopy,
  CircleCheck,
  EditPen,
  Plus,
} from "@element-plus/icons-vue";
import DocumentVersionManager from "@/components/DocumentVersionManager.vue";
import DocumentVersionCompare from "@/components/DocumentVersionCompare.vue";
import DocumentApprovalFlow from "@/components/DocumentApprovalFlow.vue";
import ElectronicSignature from "@/components/ElectronicSignature.vue";
import type { ElectronicSignature as ElectronicSignatureType } from "@/types/document";

// Store
const documentStore = useDocumentStore();
const userStore = useUserStore();

// 响应式数据
const activeTab = ref("version");
const demoDocumentId = ref("demo-document-001");
const showSignatureDialog = ref(false);
const showImportDialog = ref(false);
const importData = ref("");
const demoSignatures = ref<ElectronicSignatureType[]>([]);

// 计算属性
const documentStats = computed(() => documentStore.documentStats);
const availableWorkflows = computed(() => documentStore.approvalWorkflows);

const demoVersion = computed(() => {
  const versions = documentStore.documentVersions.filter(
    (v) => v.documentId === demoDocumentId.value
  );
  return versions.find((v) => v.isLatest) || versions[0] || null;
});

// 方法
const handleSignatureCreated = (signature: ElectronicSignatureType) => {
  demoSignatures.value.push(signature);
  ElMessage.success("电子签名创建成功");
};

const getSignatureTypeText = (type: string) => {
  const typeMap = {
    drawn: "手绘签名",
    typed: "文字签名",
    digital: "数字证书",
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getRoleText = (role: string) => {
  const roleMap = {
    admin: "管理员",
    reviewer: "审核员",
    user: "普通用户",
  };
  return roleMap[role as keyof typeof roleMap] || role;
};

const getStatusText = (status: string) => {
  const statusMap = {
    draft: "草稿",
    pending: "待审批",
    approved: "已批准",
    rejected: "已拒绝",
    archived: "已归档",
    obsolete: "已过时",
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const addTestDocumentVersions = async () => {
  try {
    // 创建模拟文件
    const testFiles = [
      { name: "专利申请书.pdf", size: 1024 * 500, type: "application/pdf" },
      {
        name: "技术说明书.docx",
        size: 1024 * 300,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      { name: "权利要求书.pdf", size: 1024 * 200, type: "application/pdf" },
      { name: "修改说明.txt", size: 1024 * 50, type: "text/plain" },
    ];

    for (let i = 0; i < testFiles.length; i++) {
      const fileInfo = testFiles[i];

      // 创建模拟File对象
      const blob = new Blob(["测试文档内容".repeat(fileInfo.size / 20)], {
        type: fileInfo.type,
      });
      const file = new File([blob], fileInfo.name, { type: fileInfo.type });

      await documentStore.uploadDocumentVersion(
        demoDocumentId.value,
        file,
        `这是第${i + 1}个测试文档版本`,
        i > 0 ? `基于版本${i}的更新` : "初始版本"
      );
    }

    ElMessage.success("测试文档版本添加完成");
  } catch (error) {
    ElMessage.error("添加测试数据失败: " + (error as Error).message);
  }
};

const clearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有文档数据吗？此操作不可恢复。",
      "确认清空",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    documentStore.documentVersions.splice(0);
    documentStore.versionHistories.splice(0);
    documentStore.approvalProcesses.splice(0);
    documentStore.signatures.splice(0);
    documentStore.activityLogs.splice(0);
    demoSignatures.value = [];

    documentStore.saveToStorage();
    ElMessage.success("所有数据已清空");
  } catch {
    // 用户取消
  }
};

const exportDocumentData = () => {
  const data = {
    documentVersions: documentStore.documentVersions,
    versionHistories: documentStore.versionHistories,
    approvalWorkflows: documentStore.approvalWorkflows,
    approvalProcesses: documentStore.approvalProcesses,
    signatures: documentStore.signatures,
    activityLogs: documentStore.activityLogs,
    demoSignatures: demoSignatures.value,
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `document-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success("文档数据已导出");
};

const importDocumentData = () => {
  if (!importData.value.trim()) {
    ElMessage.warning("请输入要导入的数据");
    return;
  }

  try {
    const data = JSON.parse(importData.value);

    if (data.documentVersions) {
      documentStore.documentVersions.splice(
        0,
        documentStore.documentVersions.length,
        ...data.documentVersions
      );
    }
    if (data.versionHistories) {
      documentStore.versionHistories.splice(
        0,
        documentStore.versionHistories.length,
        ...data.versionHistories
      );
    }
    if (data.approvalProcesses) {
      documentStore.approvalProcesses.splice(
        0,
        documentStore.approvalProcesses.length,
        ...data.approvalProcesses
      );
    }
    if (data.signatures) {
      documentStore.signatures.splice(
        0,
        documentStore.signatures.length,
        ...data.signatures
      );
    }
    if (data.activityLogs) {
      documentStore.activityLogs.splice(
        0,
        documentStore.activityLogs.length,
        ...data.activityLogs
      );
    }
    if (data.demoSignatures) {
      demoSignatures.value = data.demoSignatures;
    }

    documentStore.saveToStorage();

    ElMessage.success("文档数据导入成功");
    showImportDialog.value = false;
    importData.value = "";
  } catch (error) {
    ElMessage.error("导入失败，请检查数据格式");
  }
};

const createCustomWorkflow = () => {
  const customWorkflow = documentStore.createApprovalWorkflow({
    type: "sequential",
    category: "patent",
    priority: "medium",
    version: "1.0",
    name: "自定义审批流程",
    description: "这是一个自定义的审批工作流程",
    steps: [
      {
        id: "custom-step-1",
        stepNumber: 1,
        name: "初步审查",
        description: "文档初步审查和格式检查",
        approverRoles: ["reviewer"],
        isRequired: true,
        allowParallel: false,
        timeLimit: 24,
      },
      {
        id: "custom-step-2",
        stepNumber: 2,
        name: "技术审查",
        description: "技术内容审查和验证",
        approverRoles: ["reviewer", "admin"],
        isRequired: true,
        allowParallel: true,
        timeLimit: 48,
      },
      {
        id: "custom-step-3",
        stepNumber: 3,
        name: "最终批准",
        description: "最终审批和签发",
        approverRoles: ["admin"],
        isRequired: true,
        allowParallel: false,
        timeLimit: 72,
      },
    ],
    isActive: true,
    createdBy: userStore.currentUser?.id || 1,
  });

  ElMessage.success(`自定义工作流 "${customWorkflow.name}" 创建成功`);
};

// 生命周期
onMounted(() => {
  // 初始化演示数据
  if (documentStore.documentVersions.length === 0) {
    ElMessage.info('检测到没有文档数据，可以点击"添加测试文档版本"来体验功能');
  }
});
</script>

<style scoped>
.document-management-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.feature-intro,
.demo-area,
.stats-section,
.test-section {
  margin-bottom: 30px;
}

.feature-item {
  text-align: center;
  padding: 20px;
}

.feature-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 12px;
}

.feature-item h3 {
  margin: 12px 0 8px 0;
  color: #2c3e50;
}

.feature-item p {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.demo-section {
  margin-bottom: 30px;
}

.demo-section h3 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.demo-section p {
  color: #666;
  margin-bottom: 16px;
}

.signature-demo {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.signatures-list {
  margin-top: 20px;
}

.signatures-list h4 {
  margin-bottom: 12px;
  color: #2c3e50;
}

.signature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.signature-info {
  flex: 1;
  font-size: 14px;
}

.signature-preview {
  margin-left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  min-height: 60px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.text-signature {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.workflow-demo {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.workflow-list h4 {
  margin-bottom: 16px;
  color: #2c3e50;
}

.workflow-item {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.workflow-header h5 {
  margin: 0;
  color: #2c3e50;
}

.workflow-steps {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  overflow-x: auto;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.step-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-name {
  font-weight: 500;
  font-size: 12px;
  color: #2c3e50;
  margin-bottom: 4px;
}

.step-roles {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.status-distribution {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.status-distribution h4 {
  margin-bottom: 16px;
  color: #2c3e50;
}

.status-card {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.status-count {
  font-size: 1.5em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.status-name {
  font-size: 12px;
  color: #666;
}

.test-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.no-version {
  padding: 40px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .document-management-demo {
    padding: 16px;
  }

  .workflow-steps {
    flex-direction: column;
  }

  .test-actions {
    flex-direction: column;
  }

  .signature-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .signature-preview {
    margin-left: 0;
  }
}
</style>
