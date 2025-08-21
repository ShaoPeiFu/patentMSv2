<template>
  <div class="advanced-file-upload">
    <!-- 文件拖拽区域 -->
    <div
      class="upload-drop-zone"
      :class="{ 'is-dragover': isDragOver, 'is-uploading': isUploading }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
    >
      <div class="upload-content">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">
          <span class="primary-text">{{
            isUploading ? "文件上传中..." : "点击上传或拖拽文件到此处"
          }}</span>
          <span class="secondary-text">支持大文件上传，支持断点续传</span>
        </div>
        <div class="upload-hint">
          <p>支持格式：{{ supportedFormats }}</p>
          <p>单个文件最大：{{ maxFileSize }}MB</p>
          <p>支持断点续传</p>
        </div>
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="accept"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="file-list">
      <div
        v-for="(file, index) in fileList"
        :key="file.uid"
        class="file-item"
        :class="{
          uploading: file.status === 'uploading',
          success: file.status === 'success',
          error: file.status === 'error',
          paused: file.status === 'paused',
        }"
      >
        <!-- 文件信息 -->
        <div class="file-info">
          <div class="file-icon">
            <el-icon v-if="file.status === 'uploading'"><Loading /></el-icon>
            <el-icon v-else-if="file.status === 'success'"
              ><CircleCheck
            /></el-icon>
            <el-icon v-else-if="file.status === 'error'"
              ><CircleClose
            /></el-icon>
            <el-icon v-else-if="file.status === 'paused'"
              ><VideoPause
            /></el-icon>
            <el-icon v-else><Document /></el-icon>
          </div>
          <div class="file-details">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span v-if="file.status === 'uploading'" class="upload-speed">
                {{ formatFileSize(file.uploadSpeed || 0) }}/s
              </span>
            </div>
          </div>
        </div>

        <!-- 上传进度 -->
        <div v-if="file.status === 'uploading'" class="upload-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${file.percentage || 0}%` }"
            ></div>
          </div>
          <div class="progress-text">{{ file.percentage || 0 }}%</div>
        </div>

        <!-- 文件状态 -->
        <div class="file-status">
          <span
            v-if="file.status === 'uploading'"
            class="status-text uploading"
          >
            上传中... {{ file.uploadedChunks }}/{{ file.totalChunks }}
          </span>
          <span
            v-else-if="file.status === 'success'"
            class="status-text success"
          >
            上传完成
          </span>
          <span v-else-if="file.status === 'error'" class="status-text error">
            上传失败
          </span>
          <span v-else-if="file.status === 'paused'" class="status-text paused">
            已暂停
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="file-actions">
          <!-- 上传中 -->
          <template v-if="file.status === 'uploading'">
            <el-button
              size="small"
              @click="pauseUpload(file)"
              :disabled="!file.canPause"
            >
              <el-icon><VideoPause /></el-icon>
              暂停
            </el-button>
            <el-button
              size="small"
              @click="resumeUpload(file)"
              :disabled="!file.canResume"
            >
              <el-icon><VideoPlay /></el-icon>
              继续
            </el-button>
          </template>

          <!-- 暂停状态 -->
          <template v-if="file.status === 'paused'">
            <el-button size="small" type="primary" @click="resumeUpload(file)">
              <el-icon><VideoPlay /></el-icon>
              继续
            </el-button>
          </template>

          <!-- 错误状态 -->
          <template v-if="file.status === 'error'">
            <el-button size="small" type="primary" @click="retryUpload(file)">
              <el-icon><Refresh /></el-icon>
              重试
            </el-button>
          </template>

          <!-- 成功状态 -->
          <template v-if="file.status === 'success'">
            <el-button
              size="small"
              type="success"
              @click="openPreviewDialog(file)"
            >
              <el-icon><View /></el-icon>
              预览
            </el-button>
            <el-button size="small" type="primary" @click="downloadFile(file)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </template>

          <!-- 通用删除按钮 -->
          <el-button
            size="small"
            type="danger"
            @click="removeFile(file, index)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 上传统计 -->
    <div v-if="fileList.length > 0" class="upload-stats">
      <div class="stat-item">
        <span class="stat-label">总文件数：</span>
        <span class="stat-value">{{ fileList.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已完成：</span>
        <span class="stat-value success">{{ completedCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">上传中：</span>
        <span class="stat-value uploading">{{ uploadingCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">失败：</span>
        <span class="stat-value error">{{ errorCount }}</span>
      </div>
    </div>

    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="文件预览"
      width="80%"
      :before-close="closePreviewDialog"
    >
      <div class="file-preview">
        <div v-if="previewFile" class="preview-content">
          <!-- 图片预览 -->
          <img
            v-if="isImageFile(previewFile)"
            :src="previewFile.url"
            :alt="previewFile.name"
            class="preview-image"
          />

          <!-- PDF预览 -->
          <iframe
            v-else-if="isPDFFile(previewFile)"
            :src="previewFile.url"
            class="preview-pdf"
            frameborder="0"
          ></iframe>

          <!-- 其他文件类型 -->
          <div v-else class="preview-other">
            <el-icon class="preview-icon"><Document /></el-icon>
            <p class="preview-text">{{ previewFile.name }}</p>
            <p class="preview-info">
              文件大小：{{ formatFileSize(previewFile.size) }}
            </p>
            <el-button type="primary" @click="downloadFile(previewFile)">
              <el-icon><Download /></el-icon>
              下载文件
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Upload,
  Document,
  Loading,
  CircleCheck,
  CircleClose,
  VideoPause,
  VideoPlay,
  Refresh,
  View,
  Download,
  Delete,
} from "@element-plus/icons-vue";

interface FileChunk {
  index: number;
  start: number;
  end: number;
  blob: Blob;
  uploaded: boolean;
}

interface UploadFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error" | "paused";
  percentage: number;
  uploadedChunks: number;
  totalChunks: number;
  uploadSpeed: number;
  canPause: boolean;
  canResume: boolean;
  url?: string;
  response?: any;
  chunks: FileChunk[];
  controller?: AbortController;
}

interface Props {
  modelValue?: UploadFile[];
  multiple?: boolean;
  accept?: string;
  maxFileSize?: number;
  chunkSize?: number;
  uploadUrl?: string;
  headers?: Record<string, string>;
  data?: Record<string, any>;
  autoUpload?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  multiple: true,
  accept: "*/*",
  maxFileSize: 100, // 100MB
  chunkSize: 1024 * 1024, // 1MB per chunk
  uploadUrl: "/api/upload/chunk",
  headers: () => ({}),
  data: () => ({}),
  autoUpload: true,
});

const emit = defineEmits<{
  "update:modelValue": [files: UploadFile[]];
  "file-uploaded": [file: UploadFile];
  "file-removed": [file: UploadFile, index: number];
  "upload-success": [response: any, file: UploadFile];
  "upload-error": [error: any, file: UploadFile];
  "upload-progress": [file: UploadFile, percentage: number];
}>();

// 响应式数据
const fileList = ref<UploadFile[]>(props.modelValue);
const isDragOver = ref(false);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement>();
const previewDialogVisible = ref(false);
const previewFile = ref<UploadFile | null>(null);

// 计算属性
const supportedFormats = computed(() => {
  if (props.accept === "*/*") return "所有文件类型";
  return props.accept
    .split(",")
    .map((format) => format.trim())
    .join("、");
});

const completedCount = computed(
  () => fileList.value.filter((file) => file.status === "success").length
);

const uploadingCount = computed(
  () => fileList.value.filter((file) => file.status === "uploading").length
);

const errorCount = computed(
  () => fileList.value.filter((file) => file.status === "error").length
);

// 文件拖拽处理
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;

  const files = Array.from(e.dataTransfer?.files || []);
  handleFiles(files);
};

// 文件选择处理
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  handleFiles(files);

  // 清空input值，允许重复选择相同文件
  target.value = "";
};

// 处理选择的文件
const handleFiles = (files: File[]) => {
  files.forEach((file) => {
    // 验证文件大小
    if (file.size > props.maxFileSize * 1024 * 1024) {
      ElMessage.error(
        `文件 ${file.name} 超过最大大小限制 ${props.maxFileSize}MB`
      );
      return;
    }

    // 创建上传文件对象
    const newUploadFile: UploadFile = {
      uid: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
      percentage: 0,
      uploadedChunks: 0,
      totalChunks: Math.ceil(file.size / props.chunkSize),
      uploadSpeed: 0,
      canPause: false,
      canResume: false,
      chunks: createFileChunks(file),
    };

    fileList.value.push(newUploadFile);

    // 自动上传
    if (props.autoUpload) {
      newUploadFile.status = "uploading";
      newUploadFile.canPause = true;
      uploadFile(newUploadFile);
    }
  });

  emit("update:modelValue", fileList.value);
};

// 创建文件分片
const createFileChunks = (file: File): FileChunk[] => {
  const chunks: FileChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < file.size) {
    const end = Math.min(start + props.chunkSize, file.size);
    const blob = file.slice(start, end);

    chunks.push({
      index,
      start,
      end,
      blob,
      uploaded: false,
    });

    start = end;
    index++;
  }

  return chunks;
};

// 上传文件
const uploadFile = async (file: UploadFile) => {
  try {
    isUploading.value = true;
    file.status = "uploading";
    file.canPause = true;
    file.canResume = false;

    // 创建AbortController用于暂停/取消
    file.controller = new AbortController();

    // 上传所有分片
    for (let i = 0; i < file.chunks.length; i++) {
      const chunk = file.chunks[i];

      // 检查是否已暂停
      if (file.status === ("paused" as any)) {
        file.canResume = true;
        return;
      }

      // 跳过已上传的分片
      if (chunk.uploaded) {
        file.uploadedChunks++;
        continue;
      }

      // 上传分片
      await uploadChunk(file, chunk, i);

      // 更新进度
      file.uploadedChunks++;
      file.percentage = Math.round(
        (file.uploadedChunks / file.totalChunks) * 100
      );
      emit("upload-progress", file, file.percentage);
    }

    // 所有分片上传完成，合并文件
    await mergeChunks(file);

    file.status = "success";
    file.canPause = false;
    file.canResume = false;

    emit("file-uploaded", file);
    emit("upload-success", file.response, file);

    ElMessage.success(`${file.name} 上传成功`);
  } catch (error) {
    if (file.status !== "paused") {
      file.status = "error";
      file.canPause = false;
      file.canResume = true;

      emit("upload-error", error, file);
      ElMessage.error(`${file.name} 上传失败`);
    }
  } finally {
    isUploading.value = false;
  }
};

// 上传分片
const uploadChunk = async (
  file: UploadFile,
  chunk: FileChunk,
  index: number
) => {
  const formData = new FormData();
  formData.append("file", chunk.blob);
  formData.append("chunkIndex", index.toString());
  formData.append("totalChunks", file.totalChunks.toString());
  formData.append("fileName", file.name);
  formData.append("fileSize", file.size.toString());
  formData.append("chunkSize", props.chunkSize.toString());

  // 添加额外数据
  Object.entries(props.data).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch(props.uploadUrl, {
    method: "POST",
    headers: props.headers,
    body: formData,
    signal: file.controller?.signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  chunk.uploaded = true;

  return result;
};

// 合并分片
const mergeChunks = async (file: UploadFile) => {
  const response = await fetch("/api/upload/merge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...props.headers,
    },
    body: JSON.stringify({
      fileName: file.name,
      totalChunks: file.totalChunks,
      fileSize: file.size,
      ...props.data,
    }),
  });

  if (!response.ok) {
    throw new Error(`合并文件失败: ${response.status}`);
  }

  const result = await response.json();
  file.url = result.url;
  file.response = result;
};

// 暂停上传
const pauseUpload = (file: UploadFile) => {
  file.status = "paused";
  file.canPause = false;
  file.canResume = true;
  file.controller?.abort();
  ElMessage.info(`${file.name} 上传已暂停`);
};

// 继续上传
const resumeUpload = (file: UploadFile) => {
  uploadFile(file);
};

// 重试上传
const retryUpload = (file: UploadFile) => {
  // 重置分片状态
  file.chunks.forEach((chunk) => {
    chunk.uploaded = false;
  });
  file.uploadedChunks = 0;
  file.percentage = 0;
  file.status = "pending";

  uploadFile(file);
};

// 删除文件
const removeFile = async (file: UploadFile, index: number) => {
  try {
    if (file.status === "uploading") {
      await ElMessageBox.confirm("文件正在上传中，确定要删除吗？", "确认删除", {
        type: "warning",
      });
    }

    // 取消上传
    if (file.controller) {
      file.controller.abort();
    }

    // 从列表中移除
    fileList.value.splice(index, 1);
    emit("update:modelValue", fileList.value);
    emit("file-removed", file, index);

    ElMessage.success(`${file.name} 已删除`);
  } catch {
    // 用户取消删除
  }
};

// 预览文件
const openPreviewDialog = (file: UploadFile) => {
  previewFile.value = file;
  previewDialogVisible.value = true;
};

// 下载文件
const downloadFile = (file: UploadFile) => {
  if (file.url) {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ElMessage.success(`开始下载 ${file.name}`);
  } else {
    ElMessage.error("文件下载链接不存在");
  }
};

// 文件类型判断
const isImageFile = (file: UploadFile): boolean => {
  return file.type.startsWith("image/");
};

const isPDFFile = (file: UploadFile): boolean => {
  return file.type === "application/pdf";
};

// 关闭预览对话框
const closePreviewDialog = () => {
  previewDialogVisible.value = false;
  previewFile.value = null;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// 监听文件列表变化
const watchFileList = () => {
  emit("update:modelValue", fileList.value);
};

// 生命周期
onMounted(() => {
  // 监听文件列表变化
  watchFileList();
});

onBeforeUnmount(() => {
  // 清理所有上传任务
  fileList.value.forEach((file) => {
    if (file.controller) {
      file.controller.abort();
    }
  });
});
</script>

<style scoped>
.advanced-file-upload {
  width: 100%;
}

.upload-drop-zone {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 40px 20px;
  text-align: center;
}

.upload-drop-zone:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-drop-zone.is-dragover {
  border-color: #409eff;
  background: #f0f9ff;
  transform: scale(1.02);
}

.upload-drop-zone.is-uploading {
  border-color: #67c23a;
  background: #f0f9ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary-text {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.secondary-text {
  font-size: 14px;
  color: #909399;
}

.upload-hint {
  font-size: 12px;
  color: #c0c4cc;
  line-height: 1.5;
}

.upload-hint p {
  margin: 2px 0;
}

/* 文件列表 */
.file-list {
  margin-top: 20px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #fff;
  transition: all 0.3s ease;
}

.file-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-item.uploading {
  border-color: #409eff;
  background: #f0f9ff;
}

.file-item.success {
  border-color: #67c23a;
  background: #f0f9ff;
}

.file-item.error {
  border-color: #f56c6c;
  background: #fef0f0;
}

.file-item.paused {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #409eff;
}

.file-icon .el-icon {
  animation: spin 1s linear infinite;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.upload-progress {
  flex: 1;
  margin: 0 20px;
  min-width: 200px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.file-status {
  margin: 0 20px;
  min-width: 120px;
}

.status-text {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-text.uploading {
  color: #409eff;
  background: #ecf5ff;
}

.status-text.success {
  color: #67c23a;
  background: #f0f9ff;
}

.status-text.error {
  color: #f56c6c;
  background: #fef0f0;
}

.status-text.paused {
  color: #e6a23c;
  background: #fdf6ec;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 上传统计 */
.upload-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.uploading {
  color: #409eff;
}

.stat-value.error {
  color: #f56c6c;
}

/* 文件预览 */
.file-preview {
  min-height: 400px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.preview-pdf {
  width: 100%;
  height: 600px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.preview-other {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
}

.preview-icon {
  font-size: 64px;
  color: #c0c4cc;
}

.preview-text {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.preview-info {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .upload-progress {
    margin: 0;
    min-width: auto;
    width: 100%;
  }

  .file-status {
    margin: 0;
    min-width: auto;
  }

  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .upload-stats {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
