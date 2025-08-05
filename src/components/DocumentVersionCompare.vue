<template>
  <div class="document-version-compare">
    <el-card>
      <template #header>
        <div class="compare-header">
          <h3>文档版本对比</h3>
          <div class="version-selectors">
            <el-select
              v-model="selectedOldVersion"
              placeholder="选择旧版本"
              @change="handleVersionChange"
            >
              <el-option
                v-for="version in availableVersions"
                :key="version.id"
                :label="`${version.version} (${formatDate(
                  version.uploadedAt
                )})`"
                :value="version.id"
              />
            </el-select>
            <el-icon class="compare-icon"><ArrowRight /></el-icon>
            <el-select
              v-model="selectedNewVersion"
              placeholder="选择新版本"
              @change="handleVersionChange"
            >
              <el-option
                v-for="version in availableVersions"
                :key="version.id"
                :label="`${version.version} (${formatDate(
                  version.uploadedAt
                )})`"
                :value="version.id"
              />
            </el-select>
            <el-button
              type="primary"
              @click="performComparison"
              :disabled="!canCompare"
              :loading="comparing"
            >
              <el-icon><DocumentIcon /></el-icon>
              对比
            </el-button>
          </div>
        </div>
      </template>

      <!-- 版本信息对比 -->
      <div class="version-info" v-if="oldVersionInfo && newVersionInfo">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="version-card old-version">
              <h4>{{ oldVersionInfo.version }} (旧版本)</h4>
              <div class="version-details">
                <div class="detail-item">
                  <strong>文件名:</strong> {{ oldVersionInfo.fileName }}
                </div>
                <div class="detail-item">
                  <strong>大小:</strong>
                  {{ formatFileSize(oldVersionInfo.fileSize) }}
                </div>
                <div class="detail-item">
                  <strong>上传者:</strong> {{ oldVersionInfo.uploadedByName }}
                </div>
                <div class="detail-item">
                  <strong>上传时间:</strong>
                  {{ formatDate(oldVersionInfo.uploadedAt) }}
                </div>
                <div class="detail-item" v-if="oldVersionInfo.description">
                  <strong>描述:</strong> {{ oldVersionInfo.description }}
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="version-card new-version">
              <h4>{{ newVersionInfo.version }} (新版本)</h4>
              <div class="version-details">
                <div class="detail-item">
                  <strong>文件名:</strong> {{ newVersionInfo.fileName }}
                  <el-tag
                    v-if="newVersionInfo.fileName !== oldVersionInfo.fileName"
                    type="warning"
                    size="small"
                  >
                    已更改
                  </el-tag>
                </div>
                <div class="detail-item">
                  <strong>大小:</strong>
                  {{ formatFileSize(newVersionInfo.fileSize) }}
                  <el-tag
                    v-if="newVersionInfo.fileSize !== oldVersionInfo.fileSize"
                    type="warning"
                    size="small"
                  >
                    已更改
                  </el-tag>
                </div>
                <div class="detail-item">
                  <strong>上传者:</strong> {{ newVersionInfo.uploadedByName }}
                </div>
                <div class="detail-item">
                  <strong>上传时间:</strong>
                  {{ formatDate(newVersionInfo.uploadedAt) }}
                </div>
                <div class="detail-item" v-if="newVersionInfo.description">
                  <strong>描述:</strong> {{ newVersionInfo.description }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 对比结果 -->
      <div class="comparison-result" v-if="comparisonResult">
        <el-divider content-position="left">
          <h4>对比结果</h4>
        </el-divider>

        <!-- 相似度指标 -->
        <div class="similarity-metrics">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="metric-card">
                <div
                  class="metric-value"
                  :class="{ identical: comparisonResult.identical }"
                >
                  {{ comparisonResult.similarityScore }}%
                </div>
                <div class="metric-label">相似度</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-card">
                <div class="metric-value">
                  {{ comparisonResult.totalChanges }}
                </div>
                <div class="metric-label">总变更数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-card">
                <div class="metric-value additions">
                  {{ comparisonResult.additions }}
                </div>
                <div class="metric-label">新增</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-card">
                <div class="metric-value deletions">
                  {{ comparisonResult.deletions }}
                </div>
                <div class="metric-label">删除</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 详细差异 -->
        <div
          class="differences-section"
          v-if="comparisonResult.differences.length > 0"
        >
          <h5>详细差异</h5>
          <div class="differences-list">
            <div
              v-for="(diff, index) in comparisonResult.differences"
              :key="index"
              class="difference-item"
              :class="diff.type"
            >
              <div class="diff-type">
                <el-tag :type="getDiffTagType(diff.type)" size="small">
                  {{ getDiffTypeText(diff.type) }}
                </el-tag>
              </div>
              <div class="diff-content">
                <div class="diff-location">{{ diff.location }}</div>
                <div class="diff-description">{{ diff.description }}</div>
                <div
                  class="diff-changes"
                  v-if="diff.oldContent || diff.newContent"
                >
                  <div class="old-content" v-if="diff.oldContent">
                    <strong>旧内容:</strong> {{ diff.oldContent }}
                  </div>
                  <div class="new-content" v-if="diff.newContent">
                    <strong>新内容:</strong> {{ diff.newContent }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无差异提示 -->
        <div class="no-differences" v-else>
          <el-result
            icon="success"
            title="文档完全相同"
            sub-title="这两个版本的文档内容完全一致"
          />
        </div>
      </div>

      <!-- 对比操作 -->
      <div class="comparison-actions" v-if="comparisonResult">
        <el-button @click="exportComparison">
          <el-icon><Download /></el-icon>
          导出对比报告
        </el-button>
        <el-button @click="shareComparison">
          <el-icon><Share /></el-icon>
          分享对比结果
        </el-button>
        <el-button @click="clearComparison">
          <el-icon><Refresh /></el-icon>
          清除对比
        </el-button>
      </div>
    </el-card>

    <!-- 文件预览对比 -->
    <el-card
      class="preview-compare"
      v-if="showPreview && oldVersionInfo && newVersionInfo"
    >
      <template #header>
        <h4>文件预览对比</h4>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="preview-panel">
            <h5>{{ oldVersionInfo.version }} (旧版本)</h5>
            <div class="preview-content">
              <el-image
                v-if="isImageFile(oldVersionInfo.fileType)"
                :src="oldVersionInfo.fileUrl"
                fit="contain"
                style="width: 100%; height: 300px"
              />
              <div v-else class="file-placeholder">
                <el-icon size="48"><DocumentIcon /></el-icon>
                <p>{{ oldVersionInfo.fileName }}</p>
                <el-button size="small" @click="downloadFile(oldVersionInfo)">
                  <el-icon><Download /></el-icon>
                  下载查看
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="preview-panel">
            <h5>{{ newVersionInfo.version }} (新版本)</h5>
            <div class="preview-content">
              <el-image
                v-if="isImageFile(newVersionInfo.fileType)"
                :src="newVersionInfo.fileUrl"
                fit="contain"
                style="width: 100%; height: 300px"
              />
              <div v-else class="file-placeholder">
                <el-icon size="48"><DocumentIcon /></el-icon>
                <p>{{ newVersionInfo.fileName }}</p>
                <el-button size="small" @click="downloadFile(newVersionInfo)">
                  <el-icon><Download /></el-icon>
                  下载查看
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDocumentStore } from "@/stores/document";
import { ElMessage } from "element-plus";
import {
  ArrowRight,
  Document as DocumentIcon,
  Download,
  Share,
  Refresh,
} from "@element-plus/icons-vue";
import type {
  DocumentVersion,
  DocumentVersionComparisonResult,
  DocumentDifference,
} from "@/types/document";

// Props
interface Props {
  documentId: string;
  showPreview?: boolean;
  initialOldVersion?: string;
  initialNewVersion?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true,
});

// Store
const documentStore = useDocumentStore();

// 响应式数据
const selectedOldVersion = ref(props.initialOldVersion || "");
const selectedNewVersion = ref(props.initialNewVersion || "");
const comparing = ref(false);
const comparisonResult = ref<DocumentVersionComparisonResult | null>(null);

// 计算属性
const availableVersions = computed(() => {
  return documentStore.documentVersions
    .filter((v) => v.documentId === props.documentId)
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
});

const oldVersionInfo = computed(() => {
  return availableVersions.value.find((v) => v.id === selectedOldVersion.value);
});

const newVersionInfo = computed(() => {
  return availableVersions.value.find((v) => v.id === selectedNewVersion.value);
});

const canCompare = computed(() => {
  return (
    selectedOldVersion.value &&
    selectedNewVersion.value &&
    selectedOldVersion.value !== selectedNewVersion.value
  );
});

// 监听版本选择变化
watch([selectedOldVersion, selectedNewVersion], () => {
  if (comparisonResult.value) {
    comparisonResult.value = null;
  }
});

// 方法
const handleVersionChange = () => {
  // 可以在这里添加版本选择变化的逻辑
};

const performComparison = async () => {
  if (!canCompare.value) {
    ElMessage.warning("请选择两个不同的版本进行对比");
    return;
  }

  comparing.value = true;

  try {
    const result = await documentStore.compareVersions(
      props.documentId,
      selectedOldVersion.value,
      selectedNewVersion.value
    );

    comparisonResult.value = result;
    ElMessage.success("版本对比完成");
  } catch (error) {
    ElMessage.error("版本对比失败: " + (error as Error).message);
  } finally {
    comparing.value = false;
  }
};

const getDiffTagType = (type: DocumentDifference["type"]) => {
  const typeMap = {
    added: "success",
    removed: "danger",
    modified: "warning",
    moved: "info",
  } as const;
  return typeMap[type];
};

const getDiffTypeText = (type: DocumentDifference["type"]) => {
  const textMap = {
    added: "新增",
    removed: "删除",
    modified: "修改",
    moved: "移动",
  };
  return textMap[type];
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

const isImageFile = (fileType: string) => {
  return fileType.startsWith("image/");
};

const downloadFile = (version: DocumentVersion) => {
  const link = document.createElement("a");
  link.href = version.fileUrl;
  link.download = version.fileName;
  link.click();
};

const exportComparison = () => {
  if (
    !comparisonResult.value ||
    !oldVersionInfo.value ||
    !newVersionInfo.value
  ) {
    return;
  }

  const report = {
    documentId: props.documentId,
    oldVersion: {
      id: oldVersionInfo.value.id,
      version: oldVersionInfo.value.version,
      fileName: oldVersionInfo.value.fileName,
      uploadedAt: oldVersionInfo.value.uploadedAt,
    },
    newVersion: {
      id: newVersionInfo.value.id,
      version: newVersionInfo.value.version,
      fileName: newVersionInfo.value.fileName,
      uploadedAt: newVersionInfo.value.uploadedAt,
    },
    comparisonResult: comparisonResult.value,
    generatedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `version-comparison-${oldVersionInfo.value.version}-vs-${newVersionInfo.value.version}.json`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success("对比报告已导出");
};

const shareComparison = () => {
  if (!comparisonResult.value) return;

  const shareText = `文档版本对比结果：相似度 ${comparisonResult.value.similarityScore}%，共 ${comparisonResult.value.totalChanges} 项变更`;

  if (navigator.share) {
    navigator.share({
      title: "文档版本对比",
      text: shareText,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      ElMessage.success("对比结果已复制到剪贴板");
    });
  }
};

const clearComparison = () => {
  comparisonResult.value = null;
  selectedOldVersion.value = "";
  selectedNewVersion.value = "";
  ElMessage.success("已清除对比结果");
};

// 初始化
if (
  availableVersions.value.length >= 2 &&
  !props.initialOldVersion &&
  !props.initialNewVersion
) {
  // 自动选择最新的两个版本
  selectedNewVersion.value = availableVersions.value[0].id;
  selectedOldVersion.value = availableVersions.value[1].id;
}
</script>

<style scoped>
.document-version-compare {
  margin-bottom: 20px;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.compare-header h3 {
  margin: 0;
  color: #2c3e50;
}

.version-selectors {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.compare-icon {
  color: #409eff;
  font-size: 18px;
}

.version-info {
  margin-bottom: 24px;
}

.version-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.version-card.old-version {
  border-left: 4px solid #909399;
}

.version-card.new-version {
  border-left: 4px solid #409eff;
}

.version-card h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.version-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.detail-item strong {
  min-width: 80px;
  color: #606266;
}

.similarity-metrics {
  margin-bottom: 24px;
}

.metric-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-value {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.metric-value.identical {
  color: #67c23a;
}

.metric-value.additions {
  color: #67c23a;
}

.metric-value.deletions {
  color: #f56c6c;
}

.metric-label {
  font-size: 14px;
  color: #606266;
}

.differences-section h5 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.differences-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.difference-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.difference-item.added {
  background: rgba(103, 194, 58, 0.05);
  border-color: #67c23a;
}

.difference-item.removed {
  background: rgba(245, 108, 108, 0.05);
  border-color: #f56c6c;
}

.difference-item.modified {
  background: rgba(230, 162, 60, 0.05);
  border-color: #e6a23c;
}

.difference-item.moved {
  background: rgba(64, 158, 255, 0.05);
  border-color: #409eff;
}

.diff-type {
  flex-shrink: 0;
}

.diff-content {
  flex: 1;
}

.diff-location {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.diff-description {
  color: #606266;
  margin-bottom: 8px;
}

.diff-changes {
  font-size: 12px;
}

.old-content {
  color: #f56c6c;
  margin-bottom: 4px;
}

.new-content {
  color: #67c23a;
}

.comparison-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.no-differences {
  text-align: center;
  padding: 40px;
}

.preview-compare {
  margin-top: 20px;
}

.preview-panel {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.preview-panel h5 {
  margin: 0;
  padding: 12px 16px;
  background: #f8f9fa;
  color: #2c3e50;
  border-bottom: 1px solid #e4e7ed;
}

.preview-content {
  padding: 16px;
}

.file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
  text-align: center;
}

.file-placeholder p {
  margin: 12px 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .compare-header {
    flex-direction: column;
    align-items: stretch;
  }

  .version-selectors {
    flex-direction: column;
  }

  .comparison-actions {
    flex-direction: column;
  }

  .metric-card {
    margin-bottom: 12px;
  }
}
</style>
