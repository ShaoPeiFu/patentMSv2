<template>
  <div class="test-simple-download">
    <h1>简单下载测试</h1>
    
    <el-card class="test-section">
      <template #header>
        <h3>文件上传测试</h3>
      </template>
      
      <el-upload
        action="#"
        :before-upload="handleBeforeUpload"
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        :limit="1"
        drag
      >
        <div class="upload-content">
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">
            <span>点击上传</span>
            <span class="upload-tip">或将文件拖拽到此处</span>
          </div>
        </div>
      </el-upload>
      
      <div v-if="selectedFile" class="file-info">
        <h4>已选择文件:</h4>
        <p><strong>文件名:</strong> {{ selectedFile.name }}</p>
        <p><strong>文件大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
        <p><strong>文件类型:</strong> {{ selectedFile.type }}</p>
        
        <el-button type="primary" @click="downloadFile">
          <el-icon><Download /></el-icon>
          下载文件
        </el-button>
      </div>
    </el-card>

    <el-card class="test-section">
      <template #header>
        <h3>测试文档列表</h3>
      </template>
      
      <div class="test-documents">
        <div
          v-for="(doc, index) in testDocuments"
          :key="doc.id"
          class="test-document"
        >
          <div class="doc-info">
            <span class="doc-name">{{ doc.name }}</span>
            <span class="doc-url">{{ doc.fileUrl }}</span>
          </div>
          <el-button size="small" type="primary" @click="downloadTestDoc(doc)">
            下载
          </el-button>
        </div>
      </div>
      
      <div class="test-actions">
        <el-button type="success" @click="addTestDocument">
          添加测试文档
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Upload, Download } from "@element-plus/icons-vue";
import { downloadPatentDocument } from "@/utils/download";

// 响应式数据
const selectedFile = ref<File | null>(null);
const testDocuments = ref<any[]>([]);

// 处理文件选择
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw;
  console.log('选择的文件:', file.raw);
};

// 处理文件上传前
const handleBeforeUpload = (file: File) => {
  console.log('准备上传文件:', file);
  return false; // 阻止自动上传
};

// 下载文件
const downloadFile = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  
  try {
    // 创建 blob URL
    const blobUrl = URL.createObjectURL(selectedFile.value);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = selectedFile.value.name;
    link.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理 blob URL
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    ElMessage.success('文件下载成功');
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败');
  }
};

// 添加测试文档
const addTestDocument = () => {
  const testDoc = {
    id: Date.now(),
    name: `测试文档_${Date.now()}`,
    type: 'application',
    fileUrl: 'data:text/plain;base64,VGVzdCBkb2N1bWVudCBjb250ZW50',
    fileSize: 1024,
    uploadedAt: new Date().toISOString(),
    uploadedBy: 1,
  };
  
  testDocuments.value.push(testDoc);
  ElMessage.success('测试文档已添加');
};

// 下载测试文档
const downloadTestDoc = async (doc: any) => {
  try {
    console.log('下载测试文档:', doc);
    
    const mockPatent = {
      id: 999,
      patentNumber: "TEST001",
      title: "测试专利",
    };
    
    await downloadPatentDocument(doc, mockPatent, {
      filename: `${doc.name}_TEST`,
      showProgress: true,
    });
    
    ElMessage.success(`下载完成: ${doc.name}`);
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error(`下载失败: ${doc.name}`);
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

.file-info {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.file-info h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.file-info p {
  margin: 8px 0;
  color: #606266;
}

.test-documents {
  margin-bottom: 20px;
}

.test-document {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fafafa;
}

.doc-info {
  flex: 1;
}

.doc-name {
  display: block;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.doc-url {
  display: block;
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}

.test-actions {
  margin-top: 16px;
}
</style> 