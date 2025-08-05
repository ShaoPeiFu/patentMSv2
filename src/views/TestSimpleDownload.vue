<template>
  <div class="test-simple-download">
    <h1>简单下载测试</h1>

    <el-card class="test-section">
      <template #header>
        <h3>文件上传测试</h3>
      </template>

      <FileUpload
        v-model="uploadedFiles"
        :multiple="false"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        :max-size="20"
        hint="请选择要上传的测试文件"
        @file-uploaded="handleFileUploaded"
      />
    </el-card>

    <el-card class="test-section">
      <template #header>
        <h3>下载测试</h3>
      </template>

      <div v-if="testDocument" class="document-info">
        <div class="document-item">
          <el-icon class="document-icon"><DocumentIcon /></el-icon>
          <div class="document-details">
            <div class="document-name">{{ testDocument.name }}</div>
            <div class="document-size">
              {{ formatFileSize(testDocument.fileSize) }}
            </div>
            <div class="document-url">{{ testDocument.fileUrl }}</div>
          </div>
          <div class="document-actions">
            <el-button type="primary" @click="downloadTestFile">
              <el-icon><Download /></el-icon>
              下载文件
            </el-button>
            <el-button type="success" @click="downloadAsBlob">
              <el-icon><Download /></el-icon>
              下载为Blob
            </el-button>
            <el-button type="warning" @click="downloadAsDataURL">
              <el-icon><Download /></el-icon>
              下载为DataURL
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="no-file">
        <p>请先上传一个文件进行测试</p>
      </div>
    </el-card>

    <el-card class="test-section">
      <template #header>
        <h3>测试日志</h3>
      </template>

      <div class="test-logs">
        <div
          v-for="(log, index) in testLogs"
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Document as DocumentIcon, Download } from "@element-plus/icons-vue";
import FileUpload from "@/components/FileUpload.vue";

// 响应式数据
const uploadedFiles = ref<any[]>([]);
const testDocument = ref<any>(null);
const testLogs = ref<
  Array<{ time: string; message: string; type: "success" | "error" | "info" }>
>([]);

// 处理文件上传
const handleFileUploaded = (file: any) => {
  addLog("info", `文件上传成功: ${file.name}`);
  addLog("info", `文件URL: ${file.url}`);
  addLog("info", `文件大小: ${formatFileSize(file.size)}`);

  testDocument.value = {
    name: file.name,
    fileSize: file.size,
    fileUrl: file.url,
    type: "application",
  };

  addLog("success", `测试文档已设置: ${file.name}`);
};

// 下载测试文件
const downloadTestFile = async () => {
  if (!testDocument.value) {
    ElMessage.warning("请先上传文件");
    return;
  }

  try {
    addLog("info", `开始下载: ${testDocument.value.name}`);

    const link = window.document.createElement("a");
    link.href = testDocument.value.fileUrl;
    link.download = testDocument.value.name;
    link.style.display = "none";

    window.document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.document.body.removeChild(link);
    }, 100);

    addLog("success", `下载完成: ${testDocument.value.name}`);
    ElMessage.success(`下载完成: ${testDocument.value.name}`);
  } catch (error) {
    addLog("error", `下载失败: ${error}`);
    ElMessage.error(`下载失败: ${error}`);
  }
};

// 下载为Blob
const downloadAsBlob = async () => {
  if (!testDocument.value) {
    ElMessage.warning("请先上传文件");
    return;
  }

  try {
    addLog("info", `开始Blob下载: ${testDocument.value.name}`);

    // 从blob URL获取blob
    const response = await fetch(testDocument.value.fileUrl);
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `blob_${testDocument.value.name}`;
    link.style.display = "none";

    window.document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    addLog("success", `Blob下载完成: ${testDocument.value.name}`);
    ElMessage.success(`Blob下载完成: ${testDocument.value.name}`);
  } catch (error) {
    addLog("error", `Blob下载失败: ${error}`);
    ElMessage.error(`Blob下载失败: ${error}`);
  }
};

// 下载为DataURL
const downloadAsDataURL = async () => {
  if (!testDocument.value) {
    ElMessage.warning("请先上传文件");
    return;
  }

  try {
    addLog("info", `开始DataURL下载: ${testDocument.value.name}`);

    // 从blob URL获取blob并转换为data URL
    const response = await fetch(testDocument.value.fileUrl);
    const blob = await response.blob();

    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result as string;

      const link = window.document.createElement("a");
      link.href = dataURL;
      link.download = `dataurl_${testDocument.value.name}`;
      link.style.display = "none";

      window.document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.document.body.removeChild(link);
      }, 100);

      addLog("success", `DataURL下载完成: ${testDocument.value.name}`);
      ElMessage.success(`DataURL下载完成: ${testDocument.value.name}`);
    };

    reader.readAsDataURL(blob);
  } catch (error) {
    addLog("error", `DataURL下载失败: ${error}`);
    ElMessage.error(`DataURL下载失败: ${error}`);
  }
};

// 添加日志
const addLog = (type: "success" | "error" | "info", message: string) => {
  testLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type,
  });

  // 限制日志数量
  if (testLogs.value.length > 20) {
    testLogs.value = testLogs.value.slice(0, 20);
  }
};

// 工具函数
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
</script>

<style scoped>
.test-simple-download {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 20px;
}

.test-section h3 {
  margin: 0;
  color: #2c3e50;
}

.document-info {
  margin-top: 16px;
}

.document-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.document-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 16px;
}

.document-details {
  flex: 1;
}

.document-name {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 500;
}

.document-size {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.document-url {
  font-size: 12px;
  color: #c0c4cc;
  word-break: break-all;
  max-width: 300px;
}

.document-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.no-file {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.test-logs {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #909399;
  min-width: 80px;
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.log-item.success .log-message {
  color: #67c23a;
}

.log-item.error .log-message {
  color: #f56c6c;
}

.log-item.info .log-message {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .document-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .document-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
