<template>
  <div class="test-real-file-download">
    <h1>真实文件下载测试</h1>

    <el-card class="test-section">
      <template #header>
        <h3>文件上传测试</h3>
      </template>

      <FileUpload
        v-model="uploadedFiles"
        :multiple="true"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        :max-size="20"
        hint="请选择要上传的测试文件"
        @file-uploaded="handleFileUploaded"
      />
    </el-card>

    <el-card class="test-section">
      <template #header>
        <h3>文档列表测试</h3>
      </template>

      <div class="document-list">
        <div
          v-for="(doc, index) in testDocuments"
          :key="doc.id"
          class="document-item"
        >
          <div class="document-info">
            <el-icon class="document-icon"><Document /></el-icon>
            <div class="document-details">
              <div class="document-name">{{ doc.name }}</div>
              <div class="document-meta">
                <span class="document-type">{{
                  getDocumentTypeText(doc.type)
                }}</span>
                <span class="document-size">{{
                  formatFileSize(doc.fileSize)
                }}</span>
                <span class="document-time">{{
                  formatDate(doc.uploadedAt)
                }}</span>
              </div>
            </div>
          </div>
          <div class="document-actions">
            <el-button
              size="small"
              type="primary"
              @click="downloadTestDocument(doc)"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteTestDocument(index)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>

      <div class="test-actions">
        <el-button type="primary" @click="addTestDocument">
          <el-icon><Plus /></el-icon>
          添加测试文档
        </el-button>
        <el-button type="success" @click="downloadAllTestDocuments">
          <el-icon><Download /></el-icon>
          批量下载
        </el-button>
      </div>
    </el-card>

    <el-card class="test-section">
      <template #header>
        <h3>下载日志</h3>
      </template>

      <div class="download-logs">
        <div
          v-for="(log, index) in downloadLogs"
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
import { Document, Download, Delete, Plus } from "@element-plus/icons-vue";
import FileUpload from "@/components/FileUpload.vue";
import {
  downloadPatentDocument,
  downloadMultipleDocuments,
} from "@/utils/download";
import type { PatentDocument } from "@/types/patent";

// 响应式数据
const uploadedFiles = ref<any[]>([]);
const testDocuments = ref<PatentDocument[]>([]);
const downloadLogs = ref<
  Array<{ time: string; message: string; type: "success" | "error" | "info" }>
>([]);

// 模拟专利数据
const mockPatent = {
  id: 999,
  patentNumber: "TEST001",
  title: "测试专利",
  description: "这是一个测试专利",
  applicationDate: "2024-01-01",
  status: "approved",
  type: "invention",
  categoryId: 1,
  applicants: ["测试公司"],
  inventors: ["测试发明人"],
  technicalField: "测试技术",
  keywords: ["测试"],
  abstract: "这是一个测试专利的摘要",
  claims: ["测试权利要求"],
  documents: [],
  fees: [],
  timeline: [],
  legalStatus: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  createdBy: 1,
  updatedBy: 1,
};

// 处理文件上传
const handleFileUploaded = (file: any) => {
  addLog("info", `文件上传成功: ${file.name}`);

  // 创建测试文档
  const testDoc: PatentDocument = {
    id: Date.now(),
    patentId: mockPatent.id,
    name: file.name,
    type: "application",
    fileUrl: file.url,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: 1,
  };

  testDocuments.value.push(testDoc);
  addLog("success", `测试文档已添加: ${file.name}`);
};

// 添加测试文档
const addTestDocument = () => {
  const testDoc: PatentDocument = {
    id: Date.now(),
    patentId: mockPatent.id,
    name: `测试文档_${Date.now()}`,
    type: "application",
    fileUrl: "data:text/plain;base64,VGVzdCBkb2N1bWVudCBjb250ZW50", // Base64编码的测试内容
    fileSize: 1024,
    uploadedAt: new Date().toISOString(),
    uploadedBy: 1,
  };

  testDocuments.value.push(testDoc);
  addLog("info", `测试文档已添加: ${testDoc.name}`);
};

// 下载测试文档
const downloadTestDocument = async (document: PatentDocument) => {
  try {
    addLog("info", `开始下载: ${document.name}`);

    await downloadPatentDocument(document, mockPatent, {
      filename: `${document.name}_TEST`,
      showProgress: true,
    });

    addLog("success", `下载完成: ${document.name}`);
    ElMessage.success(`下载完成: ${document.name}`);
  } catch (error) {
    addLog("error", `下载失败: ${document.name} - ${error}`);
    ElMessage.error(`下载失败: ${document.name}`);
  }
};

// 批量下载测试文档
const downloadAllTestDocuments = async () => {
  if (testDocuments.value.length === 0) {
    ElMessage.warning("没有可下载的文档");
    return;
  }

  try {
    addLog("info", `开始批量下载 ${testDocuments.value.length} 个文档`);

    await downloadMultipleDocuments(testDocuments.value, mockPatent, {
      showProgress: true,
    });

    addLog("success", `批量下载完成，共 ${testDocuments.value.length} 个文档`);
    ElMessage.success(`批量下载完成，共 ${testDocuments.value.length} 个文档`);
  } catch (error) {
    addLog("error", `批量下载失败: ${error}`);
    ElMessage.error("批量下载失败");
  }
};

// 删除测试文档
const deleteTestDocument = (index: number) => {
  const document = testDocuments.value[index];
  testDocuments.value.splice(index, 1);
  addLog("info", `文档已删除: ${document.name}`);
  ElMessage.success(`文档已删除: ${document.name}`);
};

// 添加日志
const addLog = (type: "success" | "error" | "info", message: string) => {
  downloadLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type,
  });

  // 限制日志数量
  if (downloadLogs.value.length > 50) {
    downloadLogs.value = downloadLogs.value.slice(0, 50);
  }
};

// 工具函数
const getDocumentTypeText = (type: string) => {
  const texts: Record<string, string> = {
    application: "申请文件",
    publication: "公开文件",
    grant: "授权文件",
    amendment: "修改文件",
    other: "其他文件",
  };
  return texts[type] || type;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};
</script>

<style scoped>
.test-real-file-download {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 20px;
}

.test-section h3 {
  margin: 0;
  color: #2c3e50;
}

.document-list {
  margin-bottom: 20px;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fafafa;
}

.document-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.document-icon {
  font-size: 20px;
  color: #409eff;
  margin-right: 12px;
}

.document-details {
  flex: 1;
}

.document-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  font-weight: 500;
}

.document-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.document-type {
  background: #e1f3d8;
  color: #67c23a;
  padding: 2px 6px;
  border-radius: 4px;
}

.document-actions {
  display: flex;
  gap: 8px;
}

.test-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.download-logs {
  max-height: 300px;
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
    width: 100%;
    justify-content: flex-end;
  }

  .test-actions {
    flex-direction: column;
  }
}
</style>
