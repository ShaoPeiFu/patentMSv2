<template>
  <div class="file-upload">
    <el-upload
      :action="uploadAction"
      :headers="uploadHeaders"
      :data="uploadData"
      :before-upload="beforeUpload"
      :on-success="onSuccess"
      :on-error="onError"
      :on-progress="onProgress"
      :file-list="fileList"
      :multiple="multiple"
      :accept="accept"
      :limit="limit"
      :drag="drag"
      :show-file-list="showFileList"
      :disabled="disabled"
      class="upload-area"
    >
      <div class="upload-content">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">
          <span>点击上传</span>
          <span class="upload-tip">或将文件拖拽到此处</span>
        </div>
        <div class="upload-hint">{{ hint }}</div>
      </div>

      <template #tip>
        <div class="upload-tips">
          <p>支持的文件格式：{{ supportedFormats }}</p>
          <p>单个文件大小不超过 {{ maxSize }}MB</p>
        </div>
      </template>
    </el-upload>

    <!-- 文件列表 -->
    <div v-if="showFileList && fileList.length > 0" class="file-list">
      <div
        v-for="(file, index) in fileList"
        :key="file.uid || index"
        class="file-item"
      >
        <div class="file-info">
          <el-icon class="file-icon"><Document /></el-icon>
          <div class="file-details">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
          </div>
        </div>
        <div class="file-actions">
          <el-button
            v-if="file.status === 'success'"
            size="small"
            type="primary"
            @click="downloadFile(file)"
          >
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="removeFile(file, index)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
        <div v-if="file.status === 'uploading'" class="upload-progress">
          <el-progress :percentage="file.percentage || 0" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { Upload, Document, Download, Delete } from "@element-plus/icons-vue";

interface FileItem {
  uid?: string;
  name: string;
  size: number;
  status: "uploading" | "success" | "error";
  percentage?: number;
  url?: string;
  response?: any;
}

interface Props {
  modelValue?: FileItem[];
  multiple?: boolean;
  accept?: string;
  limit?: number;
  drag?: boolean;
  showFileList?: boolean;
  disabled?: boolean;
  hint?: string;
  maxSize?: number;
  uploadAction?: string;
  uploadHeaders?: Record<string, string>;
  uploadData?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  multiple: true,
  accept: ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
  limit: 10,
  drag: true,
  showFileList: true,
  disabled: false,
  hint: "请选择要上传的文件",
  maxSize: 10,
  uploadAction: "#", // 使用本地处理，不调用API
  uploadHeaders: () => ({}),
  uploadData: () => ({}),
});

const emit = defineEmits<{
  "update:modelValue": [files: FileItem[]];
  "file-uploaded": [file: FileItem];
  "file-removed": [file: FileItem, index: number];
  "upload-success": [response: any, file: FileItem];
  "upload-error": [error: any, file: FileItem];
}>();

const fileList = ref<FileItem[]>(props.modelValue);

// 计算属性
const supportedFormats = computed(() => {
  return props.accept
    .split(",")
    .map((format) => format.trim())
    .join("、");
});

// 文件上传前验证
const beforeUpload = (file: File) => {
  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB!`);
    return false;
  }

  // 检查文件类型
  const isValidType = props.accept.split(",").some((type) => {
    const cleanType = type.trim().toLowerCase();
    if (cleanType.startsWith(".")) {
      return file.name.toLowerCase().endsWith(cleanType);
    }
    return file.type === cleanType;
  });

  if (!isValidType) {
    ElMessage.error(
      `不支持的文件类型，请上传 ${supportedFormats.value} 格式的文件`
    );
    return false;
  }

  // 本地处理文件上传
  handleLocalUpload(file);
  return false; // 阻止默认上传行为
};

// 本地文件处理
const handleLocalUpload = (file: File) => {
  const fileItem: FileItem = {
    uid: Date.now().toString(),
    name: file.name,
    size: file.size,
    status: "success",
    url: URL.createObjectURL(file),
    response: { url: URL.createObjectURL(file) },
  };

  fileList.value.push(fileItem);
  emit("update:modelValue", fileList.value);
  emit("file-uploaded", fileItem);
  emit("upload-success", { url: fileItem.url }, fileItem);

  ElMessage.success(`${file.name} 上传成功`);
};

// 上传成功回调
const onSuccess = (response: any, file: any) => {
  const fileItem: FileItem = {
    uid: file.uid,
    name: file.name,
    size: file.size,
    status: "success",
    url: response.url || file.url || URL.createObjectURL(file.raw),
    response,
  };

  // 更新文件列表
  const index = fileList.value.findIndex((f) => f.uid === file.uid);
  if (index !== -1) {
    fileList.value[index] = fileItem;
  } else {
    fileList.value.push(fileItem);
  }

  emit("update:modelValue", fileList.value);
  emit("file-uploaded", fileItem);
  emit("upload-success", response, fileItem);

  ElMessage.success(`${file.name} 上传成功`);
};

// 上传失败回调
const onError = (error: any, file: any) => {
  const fileItem: FileItem = {
    uid: file.uid,
    name: file.name,
    size: file.size,
    status: "error",
  };

  // 更新文件列表
  const index = fileList.value.findIndex((f) => f.uid === file.uid);
  if (index !== -1) {
    fileList.value[index] = fileItem;
  }

  emit("update:modelValue", fileList.value);
  emit("upload-error", error, fileItem);

  ElMessage.error(`${file.name} 上传失败`);
};

// 上传进度回调
const onProgress = (event: any, file: any) => {
  const fileItem: FileItem = {
    uid: file.uid,
    name: file.name,
    size: file.size,
    status: "uploading",
    percentage: Math.round(event.percent),
  };

  // 更新文件列表
  const index = fileList.value.findIndex((f) => f.uid === file.uid);
  if (index !== -1) {
    fileList.value[index] = fileItem;
  } else {
    fileList.value.push(fileItem);
  }

  emit("update:modelValue", fileList.value);
};

// 删除文件
const removeFile = (file: FileItem, index: number) => {
  fileList.value.splice(index, 1);
  emit("update:modelValue", fileList.value);
  emit("file-removed", file, index);
  ElMessage.success(`${file.name} 已删除`);
};

// 下载文件
const downloadFile = (file: FileItem) => {
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

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-area {
  width: 100%;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-tip {
  font-size: 14px;
  color: #c0c4cc;
  margin-top: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 8px;
}

.upload-tips {
  margin-top: 16px;
  text-align: center;
}

.upload-tips p {
  margin: 4px 0;
  font-size: 12px;
  color: #909399;
}

.file-list {
  margin-top: 20px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fafafa;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.file-icon {
  font-size: 20px;
  color: #409eff;
  margin-right: 12px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.upload-progress {
  width: 100%;
  margin-top: 8px;
}

/* 拖拽样式 */
:deep(.el-upload-dragger) {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: #f0f9ff;
}

:deep(.el-upload-dragger.is-dragover) {
  border-color: #409eff;
  background: #f0f9ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .file-actions {
    margin-left: 0;
    margin-top: 12px;
    width: 100%;
  }
}
</style>
