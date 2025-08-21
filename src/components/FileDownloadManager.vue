<template>
  <div class="file-download-manager">
    <!-- 下载队列头部 -->
    <div class="download-header">
      <div class="header-info">
        <h3>下载管理器</h3>
        <div class="download-stats">
          <span class="stat-item">
            <el-icon><Download /></el-icon>
            活跃下载：{{ activeDownloads }}
          </span>
          <span class="stat-item">
            <el-icon><Check /></el-icon>
            已完成：{{ completedDownloads }}
          </span>
          <span class="stat-item">
            <el-icon><Clock /></el-icon>
            等待中：{{ queuedDownloads }}
          </span>
        </div>
      </div>

      <div class="header-actions">
        <el-button-group>
          <el-button
            size="small"
            @click="pauseAllDownloads"
            :disabled="activeDownloads === 0"
          >
            <el-icon><VideoPause /></el-icon>
            暂停全部
          </el-button>
          <el-button
            size="small"
            @click="resumeAllDownloads"
            :disabled="pausedDownloads === 0"
          >
            <el-icon><VideoPlay /></el-icon>
            继续全部
          </el-button>
          <el-button
            size="small"
            @click="clearCompleted"
            :disabled="completedDownloads === 0"
          >
            <el-icon><Delete /></el-icon>
            清空已完成
          </el-button>
        </el-button-group>

        <el-button type="primary" @click="addDownload" size="small">
          <el-icon><Plus /></el-icon>
          添加下载
        </el-button>
      </div>
    </div>

    <!-- 下载队列 -->
    <div class="download-queue">
      <div
        v-for="(download, index) in downloadQueue"
        :key="download.id"
        class="download-item"
        :class="{
          downloading: download.status === 'downloading',
          paused: download.status === 'paused',
          completed: download.status === 'completed',
          error: download.status === 'error',
          queued: download.status === 'queued',
        }"
      >
        <!-- 文件信息 -->
        <div class="file-info">
          <div class="file-icon">
            <el-icon v-if="download.status === 'downloading'"
              ><Loading
            /></el-icon>
            <el-icon v-else-if="download.status === 'completed'"
              ><CircleCheck
            /></el-icon>
            <el-icon v-else-if="download.status === 'error'"
              ><CircleClose
            /></el-icon>
            <el-icon v-else-if="download.status === 'paused'"
              ><VideoPause
            /></el-icon>
            <el-icon v-else><Clock /></el-icon>
          </div>

          <div class="file-details">
            <div class="file-name" :title="download.fileName">
              {{ download.fileName }}
            </div>
            <div class="file-meta">
              <span class="file-size">{{
                formatFileSize(download.fileSize)
              }}</span>
              <span
                class="download-speed"
                v-if="download.status === 'downloading'"
              >
                {{ formatFileSize(download.downloadSpeed || 0) }}/s
              </span>
              <span
                class="eta"
                v-if="download.status === 'downloading' && download.eta"
              >
                剩余时间：{{ formatTime(download.eta) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 下载进度 -->
        <div class="download-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${download.progress || 0}%` }"
            ></div>
          </div>
          <div class="progress-text">{{ download.progress || 0 }}%</div>
        </div>

        <!-- 下载状态 -->
        <div class="download-status">
          <span class="status-text" :class="download.status">
            {{ getStatusText(download.status) }}
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="download-actions">
          <!-- 下载中 -->
          <template v-if="download.status === 'downloading'">
            <el-button size="small" @click="pauseDownload(download)">
              <el-icon><VideoPause /></el-icon>
              暂停
            </el-button>
          </template>

          <!-- 暂停状态 -->
          <template v-if="download.status === 'paused'">
            <el-button
              size="small"
              type="primary"
              @click="resumeDownload(download)"
            >
              <el-icon><VideoPlay /></el-icon>
              继续
            </el-button>
          </template>

          <!-- 错误状态 -->
          <template v-if="download.status === 'error'">
            <el-button
              size="small"
              type="primary"
              @click="retryDownload(download)"
            >
              <el-icon><Refresh /></el-icon>
              重试
            </el-button>
          </template>

          <!-- 完成状态 -->
          <template v-if="download.status === 'completed'">
            <el-button size="small" type="success" @click="openFile(download)">
              <el-icon><View /></el-icon>
              打开
            </el-button>
            <el-button size="small" @click="openFileLocation(download)">
              <el-icon><FolderOpened /></el-icon>
              位置
            </el-button>
          </template>

          <!-- 通用操作 -->
          <el-button
            size="small"
            type="danger"
            @click="removeDownload(download, index)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="downloadQueue.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Download /></el-icon>
      <p>暂无下载任务</p>
      <el-button type="primary" @click="addDownload">添加下载</el-button>
    </div>

    <!-- 添加下载对话框 -->
    <el-dialog
      v-model="addDownloadDialogVisible"
      title="添加下载任务"
      width="500px"
    >
      <div class="add-download-form">
        <el-form :model="newDownload" label-width="80px">
          <el-form-item label="文件URL">
            <el-input
              v-model="newDownload.url"
              placeholder="请输入文件下载链接"
              clearable
            />
          </el-form-item>

          <el-form-item label="文件名">
            <el-input
              v-model="newDownload.fileName"
              placeholder="请输入文件名（可选）"
              clearable
            />
          </el-form-item>

          <el-form-item label="保存路径">
            <el-input
              v-model="newDownload.savePath"
              placeholder="请输入保存路径（可选）"
              clearable
            />
          </el-form-item>

          <el-form-item label="下载设置">
            <el-checkbox v-model="newDownload.autoStart"
              >立即开始下载</el-checkbox
            >
            <el-checkbox v-model="newDownload.overwrite"
              >覆盖同名文件</el-checkbox
            >
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="addDownloadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmAddDownload"
          :disabled="!newDownload.url"
        >
          添加下载
        </el-button>
      </template>
    </el-dialog>

    <!-- 下载设置对话框 -->
    <el-dialog v-model="settingsDialogVisible" title="下载设置" width="600px">
      <div class="download-settings">
        <el-form :model="downloadSettings" label-width="120px">
          <el-form-item label="最大并发下载数">
            <el-input-number
              v-model="downloadSettings.maxConcurrent"
              :min="1"
              :max="10"
              size="small"
            />
            <span class="setting-hint">同时进行的最大下载任务数</span>
          </el-form-item>

          <el-form-item label="下载速度限制">
            <el-input-number
              v-model="downloadSettings.speedLimit"
              :min="0"
              :max="100"
              size="small"
            />
            <span class="setting-hint">MB/s，0表示不限制</span>
          </el-form-item>

          <el-form-item label="默认保存路径">
            <el-input
              v-model="downloadSettings.defaultPath"
              placeholder="请输入默认保存路径"
            />
          </el-form-item>

          <el-form-item label="自动下载">
            <el-checkbox v-model="downloadSettings.autoDownload"
              >添加任务后自动开始下载</el-checkbox
            >
          </el-form-item>

          <el-form-item label="下载完成通知">
            <el-checkbox v-model="downloadSettings.notifyComplete"
              >下载完成后显示通知</el-checkbox
            >
          </el-form-item>

          <el-form-item label="下载完成动作">
            <el-select v-model="downloadSettings.completeAction" size="small">
              <el-option label="无" value="none" />
              <el-option label="打开文件" value="open" />
              <el-option label="打开文件夹" value="openFolder" />
              <el-option label="播放提示音" value="playSound" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="settingsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDownloadSettings"
          >保存设置</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Download,
  Check,
  Clock,
  Loading,
  CircleCheck,
  CircleClose,
  VideoPause,
  VideoPlay,
  Refresh,
  View,
  FolderOpened,
  Delete,
  Plus,
} from "@element-plus/icons-vue";

interface DownloadTask {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  savePath: string;
  status: "queued" | "downloading" | "paused" | "completed" | "error";
  progress: number;
  downloadSpeed: number;
  eta: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  controller?: AbortController;
}

interface DownloadSettings {
  maxConcurrent: number;
  speedLimit: number;
  defaultPath: string;
  autoDownload: boolean;
  notifyComplete: boolean;
  completeAction: string;
}

interface NewDownload {
  url: string;
  fileName: string;
  savePath: string;
  autoStart: boolean;
  overwrite: boolean;
}

// 响应式数据
const downloadQueue = ref<DownloadTask[]>([]);
const addDownloadDialogVisible = ref(false);
const settingsDialogVisible = ref(false);
const newDownload = ref<NewDownload>({
  url: "",
  fileName: "",
  savePath: "",
  autoStart: true,
  overwrite: false,
});

const downloadSettings = ref<DownloadSettings>({
  maxConcurrent: 3,
  speedLimit: 0,
  defaultPath: "",
  autoDownload: true,
  notifyComplete: true,
  completeAction: "none",
});

// 计算属性
const activeDownloads = computed(
  () => downloadQueue.value.filter((d) => d.status === "downloading").length
);

const completedDownloads = computed(
  () => downloadQueue.value.filter((d) => d.status === "completed").length
);

const queuedDownloads = computed(
  () => downloadQueue.value.filter((d) => d.status === "queued").length
);

const pausedDownloads = computed(
  () => downloadQueue.value.filter((d) => d.status === "paused").length
);

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    queued: "等待中",
    downloading: "下载中",
    paused: "已暂停",
    completed: "已完成",
    error: "下载失败",
  };
  return statusMap[status] || "未知状态";
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// 格式化时间
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  return `${Math.floor(seconds / 3600)}小时${Math.floor(
    (seconds % 3600) / 60
  )}分钟`;
};

// 添加下载
const addDownload = () => {
  addDownloadDialogVisible.value = true;
  newDownload.value = {
    url: "",
    fileName: "",
    savePath: "",
    autoStart: true,
    overwrite: false,
  };
};

// 确认添加下载
const confirmAddDownload = () => {
  if (!newDownload.value.url) {
    ElMessage.warning("请输入文件URL");
    return;
  }

  // 从URL中提取文件名
  let fileName = newDownload.value.fileName;
  if (!fileName) {
    try {
      const url = new URL(newDownload.value.url);
      fileName = url.pathname.split("/").pop() || "unknown_file";
    } catch {
      fileName = "unknown_file";
    }
  }

  const downloadTask: DownloadTask = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    url: newDownload.value.url,
    fileName,
    fileSize: 0,
    savePath: newDownload.value.savePath || downloadSettings.value.defaultPath,
    status: "queued",
    progress: 0,
    downloadSpeed: 0,
    eta: 0,
    startTime: new Date(),
  };

  downloadQueue.value.push(downloadTask);
  addDownloadDialogVisible.value = false;

  if (newDownload.value.autoStart) {
    startDownload(downloadTask);
  }

  ElMessage.success("下载任务已添加");
};

// 开始下载
const startDownload = async (download: DownloadTask) => {
  if (activeDownloads.value >= downloadSettings.value.maxConcurrent) {
    return; // 达到最大并发数
  }

  download.status = "downloading";
  download.controller = new AbortController();

  try {
    // 获取文件信息
    const response = await fetch(download.url, {
      method: "HEAD",
      signal: download.controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    download.fileSize = parseInt(response.headers.get("content-length") || "0");

    // 开始下载
    await performDownload(download);

    download.status = "completed";
    download.progress = 100;
    download.endTime = new Date();

    // 下载完成后的动作
    handleDownloadComplete(download);

    ElMessage.success(`${download.fileName} 下载完成`);
  } catch (error) {
    if (download.status !== ("paused" as any)) {
      download.status = "error";
      download.error = error instanceof Error ? error.message : "下载失败";
      ElMessage.error(`${download.fileName} 下载失败`);
    }
  } finally {
    // 检查是否有等待中的下载任务
    checkQueuedDownloads();
  }
};

// 执行下载
const performDownload = async (download: DownloadTask) => {
  const response = await fetch(download.url, {
    signal: download.controller?.signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }

  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    // 更新进度
    if (download.fileSize > 0) {
      download.progress = Math.round(
        (receivedLength / download.fileSize) * 100
      );
    }

    // 计算下载速度
    const now = Date.now();
    const timeDiff = (now - download.startTime.getTime()) / 1000;
    if (timeDiff > 0) {
      download.downloadSpeed = receivedLength / timeDiff;

      // 计算剩余时间
      if (download.downloadSpeed > 0) {
        download.eta =
          (download.fileSize - receivedLength) / download.downloadSpeed;
      }
    }
  }

  // 合并文件块
  const blob = new Blob(chunks);

  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = download.fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 清理URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// 暂停下载
const pauseDownload = (download: DownloadTask) => {
  download.status = "paused";
  download.controller?.abort();
  ElMessage.info(`${download.fileName} 已暂停`);
};

// 继续下载
const resumeDownload = (download: DownloadTask) => {
  startDownload(download);
};

// 重试下载
const retryDownload = (download: DownloadTask) => {
  download.status = "queued";
  download.progress = 0;
  download.error = undefined;
  startDownload(download);
};

// 删除下载
const removeDownload = async (download: DownloadTask, index: number) => {
  try {
    if (download.status === "downloading") {
      await ElMessageBox.confirm(
        "下载任务正在进行中，确定要删除吗？",
        "确认删除",
        { type: "warning" }
      );
    }

    // 取消下载
    download.controller?.abort();

    // 从队列中移除
    downloadQueue.value.splice(index, 1);

    ElMessage.success("下载任务已删除");
  } catch {
    // 用户取消删除
  }
};

// 暂停所有下载
const pauseAllDownloads = () => {
  downloadQueue.value.forEach((download) => {
    if (download.status === "downloading") {
      pauseDownload(download);
    }
  });
  ElMessage.info("已暂停所有下载任务");
};

// 继续所有下载
const resumeAllDownloads = () => {
  downloadQueue.value.forEach((download) => {
    if (download.status === "paused") {
      resumeDownload(download);
    }
  });
  ElMessage.info("已继续所有下载任务");
};

// 清空已完成
const clearCompleted = () => {
  downloadQueue.value = downloadQueue.value.filter(
    (download) => download.status !== "completed"
  );
  ElMessage.success("已清空所有已完成的下载任务");
};

// 检查等待中的下载
const checkQueuedDownloads = () => {
  const queued = downloadQueue.value.filter((d) => d.status === "queued");
  const active = downloadQueue.value.filter((d) => d.status === "downloading");

  if (
    queued.length > 0 &&
    active.length < downloadSettings.value.maxConcurrent
  ) {
    const nextDownload = queued[0];
    startDownload(nextDownload);
  }
};

// 处理下载完成
const handleDownloadComplete = (download: DownloadTask) => {
  if (downloadSettings.value.notifyComplete) {
    // 显示通知
    ElMessage.success(`${download.fileName} 下载完成`);
  }

  switch (downloadSettings.value.completeAction) {
    case "open":
      openFile(download);
      break;
    case "openFolder":
      openFileLocation(download);
      break;
    case "playSound":
      playNotificationSound();
      break;
  }
};

// 打开文件
const openFile = (download: DownloadTask) => {
  // 这里可以实现文件打开逻辑
  ElMessage.info(`打开文件: ${download.fileName}`);
};

// 打开文件位置
const openFileLocation = (download: DownloadTask) => {
  // 这里可以实现打开文件位置逻辑
  ElMessage.info(`打开文件位置: ${download.savePath}`);
};

// 播放提示音
const playNotificationSound = () => {
  // 这里可以实现播放提示音逻辑
  console.log("播放下载完成提示音");
};

// 保存下载设置
const saveDownloadSettings = () => {
  // 这里可以保存设置到本地存储或后端
  localStorage.setItem(
    "downloadSettings",
    JSON.stringify(downloadSettings.value)
  );
  ElMessage.success("下载设置已保存");
  settingsDialogVisible.value = false;
};

// 加载下载设置
const loadDownloadSettings = () => {
  try {
    const saved = localStorage.getItem("downloadSettings");
    if (saved) {
      downloadSettings.value = {
        ...downloadSettings.value,
        ...JSON.parse(saved),
      };
    }
  } catch (error) {
    console.error("加载下载设置失败:", error);
  }
};

// 生命周期
onMounted(() => {
  loadDownloadSettings();
});

onBeforeUnmount(() => {
  // 清理所有下载任务
  downloadQueue.value.forEach((download) => {
    if (download.controller) {
      download.controller.abort();
    }
  });
});
</script>

<style scoped>
.file-download-manager {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.download-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.header-info h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #303133;
}

.download-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 下载队列 */
.download-queue {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.download-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s ease;
}

.download-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.download-item.downloading {
  border-color: #409eff;
  background: #f0f9ff;
}

.download-item.paused {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.download-item.completed {
  border-color: #67c23a;
  background: #f0f9ff;
}

.download-item.error {
  border-color: #f56c6c;
  background: #fef0f0;
}

.download-item.queued {
  border-color: #909399;
  background: #f8f9fa;
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

.download-progress {
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

.download-status {
  margin: 0 20px;
  min-width: 80px;
}

.status-text {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-text.queued {
  color: #909399;
  background: #f8f9fa;
}

.status-text.downloading {
  color: #409eff;
  background: #ecf5ff;
}

.status-text.paused {
  color: #e6a23c;
  background: #fdf6ec;
}

.status-text.completed {
  color: #67c23a;
  background: #f0f9ff;
}

.status-text.error {
  color: #f56c6c;
  background: #fef0f0;
}

.download-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-state p {
  color: #909399;
  margin: 0 0 20px 0;
}

/* 添加下载表单 */
.add-download-form {
  padding: 20px 0;
}

.setting-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

/* 下载设置 */
.download-settings {
  padding: 20px 0;
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
  .download-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .download-stats {
    flex-direction: column;
    gap: 8px;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .download-item {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .download-progress {
    margin: 0;
    min-width: auto;
    width: 100%;
  }

  .download-status {
    margin: 0;
    min-width: auto;
  }

  .download-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
