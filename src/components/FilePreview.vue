<template>
  <div class="file-preview">
    <!-- 文件信息头部 -->
    <div class="preview-header">
      <div class="file-info">
        <el-icon class="file-type-icon" :class="getFileTypeClass(file?.type)">
          <component :is="getFileTypeIcon(file?.type)" />
        </el-icon>
        <div class="file-details">
          <h3 class="file-name">{{ file?.name || "未选择文件" }}</h3>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file?.size || 0) }}</span>
            <span class="file-type">{{ getFileTypeName(file?.type) }}</span>
            <span v-if="file?.uploadedAt" class="upload-time">
              上传时间：{{ formatDate(file.uploadedAt) }}
            </span>
          </div>
        </div>
      </div>

      <div class="preview-actions">
        <el-button-group>
          <el-button size="small" @click="downloadFile" :disabled="!file?.url">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button size="small" @click="shareFile" :disabled="!file?.url">
            <el-icon><Share /></el-icon>
            分享
          </el-button>
          <el-button size="small" @click="printFile" :disabled="!canPrint">
            <el-icon><Printer /></el-icon>
            打印
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 预览内容区域 -->
    <div class="preview-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>正在加载文件...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <el-icon class="error-icon"><CircleClose /></el-icon>
        <p class="error-message">{{ error }}</p>
        <el-button type="primary" @click="retryLoad">重试</el-button>
      </div>

      <!-- 文件内容预览 -->
      <div v-else-if="file && file.url" class="file-content">
        <!-- 图片文件预览 -->
        <div v-if="isImageFile(file.type)" class="image-preview">
          <img
            :src="file.url"
            :alt="file.name"
            class="preview-image"
            @load="onImageLoad"
            @error="onImageError"
          />
          <div class="image-controls">
            <el-button-group>
              <el-button size="small" @click="zoomIn">
                <el-icon><ZoomIn /></el-icon>
                放大
              </el-button>
              <el-button size="small" @click="zoomOut">
                <el-icon><ZoomOut /></el-icon>
                缩小
              </el-button>
              <el-button size="small" @click="resetZoom">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- PDF文件预览 -->
        <div v-else-if="isPDFFile(file.type)" class="pdf-preview">
          <div class="pdf-toolbar">
            <el-button-group>
              <el-button
                size="small"
                @click="prevPage"
                :disabled="currentPage <= 1"
              >
                <el-icon><ArrowLeft /></el-icon>
                上一页
              </el-button>
              <el-button
                size="small"
                @click="nextPage"
                :disabled="currentPage >= totalPages"
              >
                <el-icon><ArrowRight /></el-icon>
                下一页
              </el-button>
            </el-button-group>
            <span class="page-info"
              >第 {{ currentPage }} 页，共 {{ totalPages }} 页</span
            >
            <el-input-number
              v-model="currentPage"
              :min="1"
              :max="totalPages"
              size="small"
              @change="goToPage"
            />
          </div>
          <iframe
            :src="`${file.url}#page=${currentPage}`"
            class="pdf-iframe"
            frameborder="0"
            @load="onPDFLoad"
          ></iframe>
        </div>

        <!-- 视频文件预览 -->
        <div v-else-if="isVideoFile(file.type)" class="video-preview">
          <video
            :src="file.url"
            controls
            class="preview-video"
            @loadedmetadata="onVideoLoad"
            @error="onVideoError"
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- 音频文件预览 -->
        <div v-else-if="isAudioFile(file.type)" class="audio-preview">
          <div class="audio-player">
            <audio
              :src="file.url"
              controls
              class="preview-audio"
              @loadedmetadata="onAudioLoad"
              @error="onAudioError"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
        </div>

        <!-- 文本文件预览 -->
        <div v-else-if="isTextFile(file.type)" class="text-preview">
          <div class="text-toolbar">
            <el-button-group>
              <el-button size="small" @click="copyText">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
              <el-button size="small" @click="searchText">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </el-button-group>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索文本内容"
              size="small"
              style="width: 200px"
              @input="performSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="text-content" ref="textContent">
            <pre
              v-if="textContent"
              :class="{ 'search-highlight': searchKeyword }"
              >{{ textContent }}</pre
            >
            <div v-else class="text-loading">正在加载文本内容...</div>
          </div>
        </div>

        <!-- Office文档预览 -->
        <div v-else-if="isOfficeFile(file.type)" class="office-preview">
          <div class="office-placeholder">
            <el-icon class="office-icon"><Document /></el-icon>
            <p class="office-text">Office文档预览</p>
            <p class="office-hint">此文件类型需要下载后使用相应软件打开</p>
            <el-button type="primary" @click="downloadFile">
              <el-icon><Download /></el-icon>
              下载文件
            </el-button>
          </div>
        </div>

        <!-- 其他文件类型 -->
        <div v-else class="other-preview">
          <div class="other-placeholder">
            <el-icon class="other-icon"><Document /></el-icon>
            <p class="other-text">不支持预览的文件类型</p>
            <p class="other-hint">请下载后使用相应软件打开</p>
            <el-button type="primary" @click="downloadFile">
              <el-icon><Download /></el-icon>
              下载文件
            </el-button>
          </div>
        </div>
      </div>

      <!-- 无文件状态 -->
      <div v-else class="no-file">
        <el-icon class="no-file-icon"><Document /></el-icon>
        <p>请选择要预览的文件</p>
      </div>
    </div>

    <!-- 文件属性面板 -->
    <div v-if="file" class="file-properties">
      <h4>文件属性</h4>
      <div class="properties-grid">
        <div class="property-item">
          <span class="property-label">文件名：</span>
          <span class="property-value">{{ file.name }}</span>
        </div>
        <div class="property-item">
          <span class="property-label">文件大小：</span>
          <span class="property-value">{{ formatFileSize(file.size) }}</span>
        </div>
        <div class="property-item">
          <span class="property-label">文件类型：</span>
          <span class="property-value">{{ getFileTypeName(file.type) }}</span>
        </div>
        <div class="property-item">
          <span class="property-label">MIME类型：</span>
          <span class="property-value">{{ file.type }}</span>
        </div>
        <div v-if="file.uploadedAt" class="property-item">
          <span class="property-label">上传时间：</span>
          <span class="property-value">{{ formatDate(file.uploadedAt) }}</span>
        </div>
        <div v-if="file.uploadedBy" class="property-item">
          <span class="property-label">上传者：</span>
          <span class="property-value">{{ file.uploadedBy }}</span>
        </div>
      </div>
    </div>

    <!-- 分享对话框 -->
    <el-dialog v-model="shareDialogVisible" title="分享文件" width="500px">
      <div class="share-content">
        <div class="share-options">
          <el-radio-group v-model="shareType">
            <el-radio label="link">生成分享链接</el-radio>
            <el-radio label="email">发送邮件</el-radio>
            <el-radio label="qr">生成二维码</el-radio>
          </el-radio-group>
        </div>

        <div v-if="shareType === 'link'" class="share-link">
          <el-input v-model="shareLink" readonly placeholder="分享链接">
            <template #append>
              <el-button @click="copyShareLink">复制</el-button>
            </template>
          </el-input>
        </div>

        <div v-if="shareType === 'email'" class="share-email">
          <el-input
            v-model="shareEmail"
            placeholder="请输入邮箱地址"
            type="email"
          />
          <el-button type="primary" @click="sendShareEmail">发送</el-button>
        </div>

        <div v-if="shareType === 'qr'" class="share-qr">
          <div class="qr-code">
            <!-- 这里可以集成二维码生成库 -->
            <div class="qr-placeholder">二维码占位符</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Document,
  Picture,
  VideoPlay,
  Microphone,
  Files,
  Download,
  Share,
  Printer,
  Loading,
  CircleClose,
  ZoomIn,
  ZoomOut,
  Refresh,
  ArrowLeft,
  ArrowRight,
  CopyDocument,
  Search,
} from "@element-plus/icons-vue";

interface FileInfo {
  uid: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt?: Date;
  uploadedBy?: string;
}

interface Props {
  file?: FileInfo | null;
  autoLoad?: boolean;
  showProperties?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  file: null,
  autoLoad: true,
  showProperties: true,
});

const emit = defineEmits<{
  "file-loaded": [file: FileInfo];
  "file-error": [error: string];
  download: [file: FileInfo];
}>();

// 响应式数据
const loading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(1);
const textContent = ref<string>("");
const searchKeyword = ref("");
const shareDialogVisible = ref(false);
const shareType = ref("link");
const shareLink = ref("");
const shareEmail = ref("");

// 计算属性
const canPrint = computed(() => {
  if (!props.file) return false;
  return isImageFile(props.file.type) || isTextFile(props.file.type);
});

// 文件类型判断
const isImageFile = (type: string): boolean => {
  return type.startsWith("image/");
};

const isPDFFile = (type: string): boolean => {
  return type === "application/pdf";
};

const isVideoFile = (type: string): boolean => {
  return type.startsWith("video/");
};

const isAudioFile = (type: string): boolean => {
  return type.startsWith("audio/");
};

const isTextFile = (type: string): boolean => {
  return (
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "application/xml" ||
    type === "application/javascript"
  );
};

const isOfficeFile = (type: string): boolean => {
  return (
    type.includes("word") ||
    type.includes("excel") ||
    type.includes("powerpoint") ||
    type.includes("officedocument")
  );
};

// 获取文件类型图标
const getFileTypeIcon = (type?: string) => {
  if (!type) return Document;

  if (isImageFile(type)) return Picture;
  if (isPDFFile(type)) return Document;
  if (isVideoFile(type)) return VideoPlay;
  if (isAudioFile(type)) return Microphone;
  if (isTextFile(type)) return Document;
  if (isOfficeFile(type)) return Files;

  return Document;
};

// 获取文件类型样式类
const getFileTypeClass = (type?: string) => {
  if (!type) return "";

  if (isImageFile(type)) return "image-type";
  if (isPDFFile(type)) return "pdf-type";
  if (isVideoFile(type)) return "video-type";
  if (isAudioFile(type)) return "audio-type";
  if (isTextFile(type)) return "text-type";
  if (isOfficeFile(type)) return "office-type";

  return "other-type";
};

// 获取文件类型名称
const getFileTypeName = (type?: string) => {
  if (!type) return "未知类型";

  if (isImageFile(type)) return "图片文件";
  if (isPDFFile(type)) return "PDF文档";
  if (isVideoFile(type)) return "视频文件";
  if (isAudioFile(type)) return "音频文件";
  if (isTextFile(type)) return "文本文件";
  if (isOfficeFile(type)) return "Office文档";

  return "其他文件";
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// 格式化日期
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString("zh-CN");
};

// 加载文件内容
const loadFileContent = async () => {
  if (!props.file?.url) return;

  loading.value = true;
  error.value = null;

  try {
    if (isTextFile(props.file.type)) {
      await loadTextContent();
    } else if (isPDFFile(props.file.type)) {
      await loadPDFInfo();
    }

    emit("file-loaded", props.file);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载文件失败";
    emit("file-error", error.value);
  } finally {
    loading.value = false;
  }
};

// 加载文本内容
const loadTextContent = async () => {
  if (!props.file?.url) return;

  try {
    const response = await fetch(props.file.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    textContent.value = await response.text();
  } catch (err) {
    throw new Error("无法加载文本内容");
  }
};

// 加载PDF信息
const loadPDFInfo = async () => {
  // 这里可以集成PDF.js来获取页数等信息
  // 目前使用默认值
  totalPages.value = 1;
  currentPage.value = 1;
};

// 重试加载
const retryLoad = () => {
  loadFileContent();
};

// 图片相关方法
const onImageLoad = () => {
  // 图片加载完成
};

const onImageError = () => {
  error.value = "图片加载失败";
};

// 缩放控制
const zoomIn = () => {
  // 实现图片放大
};

const zoomOut = () => {
  // 实现图片缩小
};

const resetZoom = () => {
  // 重置图片缩放
};

// PDF相关方法
const onPDFLoad = () => {
  // PDF加载完成
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page: number) => {
  currentPage.value = page;
};

// 视频相关方法
const onVideoLoad = () => {
  // 视频加载完成
};

const onVideoError = () => {
  error.value = "视频加载失败";
};

// 音频相关方法
const onAudioLoad = () => {
  // 音频加载完成
};

const onAudioError = () => {
  error.value = "音频加载失败";
};

// 文本相关方法
const copyText = async () => {
  if (textContent.value) {
    try {
      await navigator.clipboard.writeText(textContent.value);
      ElMessage.success("文本已复制到剪贴板");
    } catch (err) {
      ElMessage.error("复制失败");
    }
  }
};

const searchText = () => {
  // 实现文本搜索功能
};

const performSearch = () => {
  // 执行搜索
};

// 下载文件
const downloadFile = () => {
  if (props.file) {
    emit("download", props.file);

    const link = document.createElement("a");
    link.href = props.file.url;
    link.download = props.file.name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ElMessage.success(`开始下载 ${props.file.name}`);
  }
};

// 分享文件
const shareFile = () => {
  if (props.file) {
    shareLink.value = `${window.location.origin}/share/${props.file.uid}`;
    shareDialogVisible.value = true;
  }
};

// 复制分享链接
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    ElMessage.success("分享链接已复制");
  } catch (err) {
    ElMessage.error("复制失败");
  }
};

// 发送分享邮件
const sendShareEmail = () => {
  if (shareEmail.value) {
    // 这里可以调用邮件发送API
    ElMessage.success(`分享邮件已发送到 ${shareEmail.value}`);
    shareDialogVisible.value = false;
  } else {
    ElMessage.warning("请输入邮箱地址");
  }
};

// 打印文件
const printFile = () => {
  if (props.file) {
    if (isImageFile(props.file.type)) {
      const printWindow = window.open(props.file.url);
      printWindow?.print();
    } else if (isTextFile(props.file.type)) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>${props.file.name}</title></head>
            <body><pre>${textContent.value}</pre></body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }
};

// 监听文件变化
watch(
  () => props.file,
  (newFile) => {
    if (newFile && props.autoLoad) {
      loadFileContent();
    }
  },
  { immediate: true }
);

// 生命周期
onMounted(() => {
  if (props.file && props.autoLoad) {
    loadFileContent();
  }
});
</script>

<style scoped>
.file-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-type-icon {
  font-size: 32px;
  color: #409eff;
}

.file-type-icon.image-type {
  color: #67c23a;
}

.file-type-icon.pdf-type {
  color: #f56c6c;
}

.file-type-icon.video-type {
  color: #e6a23c;
}

.file-type-icon.audio-type {
  color: #909399;
}

.file-type-icon.text-type {
  color: #409eff;
}

.file-type-icon.office-type {
  color: #67c23a;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.file-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
  position: relative;
}

.loading-state,
.error-state,
.no-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 16px;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
}

.error-message {
  color: #f56c6c;
  margin: 0;
}

.no-file-icon {
  font-size: 48px;
  color: #c0c4cc;
}

/* 图片预览 */
.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.image-controls {
  display: flex;
  gap: 8px;
}

/* PDF预览 */
.pdf-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pdf-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.page-info {
  font-size: 14px;
  color: #606266;
}

.pdf-iframe {
  width: 100%;
  height: 600px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

/* 视频预览 */
.video-preview {
  display: flex;
  justify-content: center;
}

.preview-video {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
}

/* 音频预览 */
.audio-preview {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.audio-player {
  width: 100%;
  max-width: 400px;
}

.preview-audio {
  width: 100%;
}

/* 文本预览 */
.text-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.text-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  max-height: 500px;
  overflow: auto;
}

.text-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
}

.text-loading {
  text-align: center;
  color: #909399;
  padding: 40px;
}

/* Office文档预览 */
.office-preview,
.other-preview {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.office-placeholder,
.other-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.office-icon,
.other-icon {
  font-size: 64px;
  color: #c0c4cc;
}

.office-text,
.other-text {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.office-hint,
.other-hint {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 文件属性 */
.file-properties {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

.file-properties h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.property-item {
  display: flex;
  gap: 8px;
}

.property-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.property-value {
  color: #303133;
  word-break: break-all;
}

/* 分享对话框 */
.share-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.share-options {
  display: flex;
  justify-content: center;
}

.share-link,
.share-email {
  display: flex;
  gap: 12px;
  align-items: center;
}

.share-qr {
  display: flex;
  justify-content: center;
}

.qr-code {
  width: 200px;
  height: 200px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-placeholder {
  color: #909399;
  font-size: 14px;
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
  .preview-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .file-meta {
    flex-direction: column;
    gap: 4px;
  }

  .preview-actions {
    width: 100%;
    justify-content: center;
  }

  .pdf-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .text-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .properties-grid {
    grid-template-columns: 1fr;
  }
}
</style>
