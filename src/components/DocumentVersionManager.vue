<template>
  <div class="document-version-manager">
    <el-card>
      <template #header>
        <div class="manager-header">
          <h3>文档版本管理</h3>
          <div class="header-actions">
            <el-button @click="showUploadDialog = true">
              <el-icon><Upload /></el-icon>
              上传文档
            </el-button>
            <el-button @click="refreshVersions">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button
              @click="showCompareDialog = true"
              :disabled="selectedVersions.length !== 2"
            >
              <el-icon><DocumentCopy /></el-icon>
              版本对比
            </el-button>
          </div>
        </div>
      </template>

      <!-- 文档统计 -->
      <div class="document-stats" v-if="documentStats">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ documentStats.totalVersions }}</div>
              <div class="stat-label">总版本数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">
                {{ documentStats.pendingApprovals }}
              </div>
              <div class="stat-label">待审批</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">
                {{ formatFileSize(documentStats.storageUsed) }}
              </div>
              <div class="stat-label">存储使用</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ documentStats.recentActivity }}</div>
              <div class="stat-label">近期活动</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选和搜索 -->
      <div class="filters-section">
        <el-form :model="filters" inline>
          <el-form-item label="状态">
            <el-select
              v-model="filters.status"
              placeholder="选择状态"
              clearable
            >
              <el-option label="草稿" value="draft" />
              <el-option label="待审批" value="pending" />
              <el-option label="已批准" value="approved" />
              <el-option label="已拒绝" value="rejected" />
              <el-option label="已归档" value="archived" />
            </el-select>
          </el-form-item>
          <el-form-item label="文件类型">
            <el-select
              v-model="filters.fileType"
              placeholder="选择类型"
              clearable
            >
              <el-option
                v-for="type in fileTypes"
                :key="type"
                :label="type"
                :value="type"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上传者">
            <el-select
              v-model="filters.uploadedBy"
              placeholder="选择上传者"
              clearable
            >
              <el-option
                v-for="user in uploaders"
                :key="user.userId"
                :label="user.name"
                :value="user.userId"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilters">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 版本列表 -->
      <div class="versions-list">
        <el-table
          :data="filteredVersions"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          row-key="id"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column label="版本号" width="100">
            <template #default="{ row }">
              <div class="version-cell">
                {{ row.version }}
                <el-tag v-if="row.isLatest" type="success" size="small"
                  >最新</el-tag
                >
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="fileName" label="文件名" min-width="200">
            <template #default="{ row }">
              <div class="file-cell">
                <el-icon><DocumentIcon /></el-icon>
                <span>{{ row.fileName }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="fileSize" label="大小" width="100">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>

          <el-table-column prop="uploadedByName" label="上传者" width="120" />

          <el-table-column prop="uploadedAt" label="上传时间" width="150">
            <template #default="{ row }">
              {{ formatDate(row.uploadedAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button size="small" @click="downloadVersion(row)">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
                <el-button size="small" @click="viewVersion(row)">
                  <el-icon><View /></el-icon>
                  查看
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  @click="restoreVersion(row)"
                  :disabled="row.isLatest"
                >
                  <el-icon><RefreshRight /></el-icon>
                  恢复
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteVersion(row)"
                  :disabled="row.isLatest"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalVersions"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 上传新版本对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传文档" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="文件">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :show-file-list="false"
            @change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击选择文件</em>
            </div>
          </el-upload>
          <div v-if="uploadForm.file" class="selected-file">
            <el-icon><DocumentIcon /></el-icon>
            <span>{{ uploadForm.file.name }}</span>
            <el-button size="small" @click="clearSelectedFile">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="版本描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入版本描述（可选）"
          />
        </el-form-item>
        <el-form-item label="变更说明">
          <el-input
            v-model="uploadForm.changeLog"
            type="textarea"
            rows="3"
            placeholder="请输入变更说明（可选）"
          />
          <div class="change-log-tips">
            <el-text size="small" type="info">
              提示：在变更说明中添加 [major] 标记表示主版本更新
            </el-text>
          </div>
        </el-form-item>
        <el-form-item label="基于版本">
          <el-select
            v-model="uploadForm.parentVersionId"
            placeholder="选择基于的版本"
          >
            <el-option
              v-for="version in availableVersionsForParent"
              :key="version.id"
              :label="`${version.version} - ${version.fileName}`"
              :value="version.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="performUpload"
          :loading="uploading"
          :disabled="!uploadForm.file"
        >
          上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 版本对比对话框 -->
    <el-dialog
      v-model="showCompareDialog"
      title="版本对比"
      width="80%"
      top="5vh"
    >
      <DocumentVersionCompare
        v-if="showCompareDialog && documentId"
        :document-id="documentId"
        :initial-old-version="selectedVersions[1]?.id"
        :initial-new-version="selectedVersions[0]?.id"
      />
    </el-dialog>

    <!-- 版本详情对话框 -->
    <el-dialog v-model="showVersionDialog" title="版本详情" width="600px">
      <div v-if="selectedVersion" class="version-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本号">
            {{ selectedVersion.version }}
            <el-tag v-if="selectedVersion.isLatest" type="success" size="small"
              >最新</el-tag
            >
          </el-descriptions-item>
          <el-descriptions-item label="文件名">
            {{ selectedVersion.fileName }}
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatFileSize(selectedVersion.fileSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="文件类型">
            {{ selectedVersion.fileType }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedVersion.status)">
              {{ getStatusText(selectedVersion.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="校验和">
            {{ selectedVersion.checksum }}
          </el-descriptions-item>
          <el-descriptions-item label="上传者">
            {{ selectedVersion.uploadedByName }}
          </el-descriptions-item>
          <el-descriptions-item label="上传时间">
            {{ formatDate(selectedVersion.uploadedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ selectedVersion.description || "无" }}
          </el-descriptions-item>
          <el-descriptions-item label="变更说明" :span="2">
            {{ selectedVersion.changeLog || "无" }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 审批流程 -->
        <div class="approval-section" v-if="selectedVersion">
          <el-divider content-position="left">审批流程</el-divider>
          <DocumentApprovalFlow :document-version="selectedVersion" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDocumentStore } from "@/stores/document";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Upload,
  Refresh,
  DocumentCopy,
  Search,
  Document as DocumentIcon,
  Download,
  View,
  RefreshRight,
  Delete,
  UploadFilled,
  Close,
} from "@element-plus/icons-vue";
import DocumentVersionCompare from "./DocumentVersionCompare.vue";
import DocumentApprovalFlow from "./DocumentApprovalFlow.vue";
import type {
  DocumentVersion,
  DocumentSearchParams,
  DocumentVersionStatus,
} from "@/types/document";

// Props
interface Props {
  documentId: string;
}

const props = defineProps<Props>();

// Store
const documentStore = useDocumentStore();

// 响应式数据
const loading = ref(false);
const showUploadDialog = ref(false);
const showCompareDialog = ref(false);
const showVersionDialog = ref(false);
const uploading = ref(false);
const selectedVersions = ref<DocumentVersion[]>([]);
const selectedVersion = ref<DocumentVersion | null>(null);
const currentPage = ref(1);
const pageSize = ref(20);

const filters = ref({
  status: "",
  fileType: "",
  uploadedBy: undefined as number | undefined,
});

const uploadForm = ref({
  file: null as File | null,
  description: "",
  changeLog: "",
  parentVersionId: "",
});

// 计算属性
const documentVersions = computed(() => {
  return documentStore.documentVersions.filter(
    (v) => v.documentId === props.documentId
  );
});

const documentStats = computed(() => documentStore.documentStats);

const searchResult = computed(() => {
  const params: DocumentSearchParams = {
    documentId: props.documentId,
    status: filters.value.status as DocumentVersionStatus | undefined,
    fileType: filters.value.fileType,
    uploadedBy: filters.value.uploadedBy,
  };
  return documentStore.searchDocuments(params);
});

const filteredVersions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return searchResult.value.documents.slice(start, end);
});

const totalVersions = computed(() => searchResult.value.total);

const fileTypes = computed(() => {
  return Array.from(new Set(documentVersions.value.map((v) => v.fileType)));
});

const uploaders = computed(() => {
  return searchResult.value.facets.uploaders;
});


const availableVersionsForParent = computed(() => {
  return documentVersions.value.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
});

// 方法
const refreshVersions = () => {
  // 刷新版本列表
  ElMessage.success("版本列表已刷新");
};

const handleSelectionChange = (selection: DocumentVersion[]) => {
  selectedVersions.value = selection;
};

const applyFilters = () => {
  currentPage.value = 1;
  ElMessage.success(`筛选完成，找到 ${totalVersions.value} 个版本`);
};

const resetFilters = () => {
  filters.value = {
    status: "",
    fileType: "",
    uploadedBy: undefined,
  };
  currentPage.value = 1;
  ElMessage.success("筛选条件已重置");
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const handleFileChange = (file: any) => {
  uploadForm.value.file = file.raw;
};

const clearSelectedFile = () => {
  uploadForm.value.file = null;
};

const performUpload = async () => {
  if (!uploadForm.value.file) {
    ElMessage.warning("请选择要上传的文件");
    return;
  }

  uploading.value = true;

  try {
    await documentStore.uploadDocumentVersion(
      props.documentId,
      uploadForm.value.file,
      uploadForm.value.description || undefined,
      uploadForm.value.changeLog || undefined,
      uploadForm.value.parentVersionId || undefined
    );

    ElMessage.success("新版本上传成功");
    showUploadDialog.value = false;
    uploadForm.value = {
      file: null,
      description: "",
      changeLog: "",
      parentVersionId: "",
    };
  } catch (error) {
    ElMessage.error("上传失败: " + (error as Error).message);
  } finally {
    uploading.value = false;
  }
};

const downloadVersion = (version: DocumentVersion) => {
  const link = document.createElement("a");
  link.href = version.fileUrl;
  link.download = version.fileName;
  link.click();
  ElMessage.success("开始下载");
};

const viewVersion = (version: DocumentVersion) => {
  selectedVersion.value = version;
  showVersionDialog.value = true;
};

const restoreVersion = async (version: DocumentVersion) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到版本 ${version.version} 吗？这将创建一个新的版本。`,
      "确认恢复",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await documentStore.restoreVersion(version.id);
    ElMessage.success("版本恢复成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("恢复失败: " + (error as Error).message);
    }
  }
};

const deleteVersion = async (version: DocumentVersion) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除版本 ${version.version} 吗？此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await documentStore.deleteVersion(version.id);
    ElMessage.success("版本删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败: " + (error as Error).message);
    }
  }
};

const getStatusTagType = (status: string) => {
  const typeMap = {
    draft: "info",
    pending: "warning",
    approved: "success",
    rejected: "danger",
    archived: "info",
    obsolete: "info",
  } as const;
  return typeMap[status as keyof typeof typeMap] || "info";
};

const getStatusText = (status: string) => {
  const textMap = {
    draft: "草稿",
    pending: "待审批",
    approved: "已批准",
    rejected: "已拒绝",
    archived: "已归档",
    obsolete: "已过时",
  };
  return textMap[status as keyof typeof textMap] || status;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
  // 初始化时设置默认的父版本
  if (documentVersions.value.length > 0) {
    const latestVersion = documentVersions.value.find((v) => v.isLatest);
    if (latestVersion) {
      uploadForm.value.parentVersionId = latestVersion.id;
    }
  }
});
</script>

<style scoped>
.document-version-manager {
  margin-bottom: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.manager-header h3 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.document-stats {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 1.8em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.filters-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.versions-list {
  margin-bottom: 20px;
}

.version-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.upload-demo {
  width: 100%;
}

.selected-file {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
}

.change-log-tips {
  margin-top: 4px;
}

.version-details {
  margin-bottom: 20px;
}

.approval-section {
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .stat-card {
    margin-bottom: 12px;
  }
}
</style>
