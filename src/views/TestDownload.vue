<template>
  <div class="test-download">
    <div class="page-header">
      <h1>下载功能测试</h1>
      <el-button @click="$router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>测试文档下载</span>
        </div>
      </template>

      <div class="test-section">
        <h3>单个文档下载测试</h3>
        <div class="test-buttons">
          <el-button type="primary" @click="testDownloadApplication">
            下载申请文件
          </el-button>
          <el-button type="success" @click="testDownloadPublication">
            下载公开文件
          </el-button>
          <el-button type="warning" @click="testDownloadGrant">
            下载授权文件
          </el-button>
          <el-button type="info" @click="testDownloadAmendment">
            下载修改文件
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>批量下载测试</h3>
        <div class="test-buttons">
          <el-button type="primary" @click="testBatchDownload">
            批量下载所有文档
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>模拟专利数据</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="专利标题">
            {{ testPatent.title }}
          </el-descriptions-item>
          <el-descriptions-item label="专利号">
            {{ testPatent.patentNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="申请日期">
            {{ testPatent.applicationDate }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ testPatent.applicants.join(", ") }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>文档列表</h3>
        <el-table :data="testPatent.documents" stripe>
          <el-table-column prop="name" label="文档名称" />
          <el-table-column prop="type" label="类型">
            <template #default="{ row }">
              <el-tag>{{ getDocumentTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="文件大小">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadedAt" label="上传时间">
            <template #default="{ row }">
              {{ formatDate(row.uploadedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                @click="testDownloadDocument(row)"
              >
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { ArrowLeft, Download } from "@element-plus/icons-vue";
import {
  downloadPatentDocument,
  downloadMultipleDocuments,
} from "@/utils/download";
import type { Patent, PatentDocument } from "@/types/patent";

// 测试专利数据
const testPatent = ref<Patent>({
  legalStatus: "active", // 添加缺失的legalStatus字段
  id: 1,
  title: "一种智能专利管理系统",
  description:
    "本发明涉及一种智能专利管理系统，包括专利申请、审核、管理等功能。",
  patentNumber: "SINA2024001",
  applicationNumber: "CN202400100001",
  applicationDate: "2024-01-15",
  publicationDate: "2024-07-15",
  grantDate: "2024-12-15",
  expirationDate: "2034-01-15",
  status: "approved",
  type: "invention",
  categoryId: 1,
  applicants: ["新浪科技有限公司", "张三"],
  inventors: ["李四", "王五"],
  abstract:
    "本发明提供了一种智能专利管理系统，通过人工智能技术实现专利的自动分类、审核和管理，提高了专利管理效率。",
  claims: [
    "1. 一种智能专利管理系统，其特征在于，包括：专利申请模块、审核模块、管理模块。",
    "2. 根据权利要求1所述的系统，其特征在于，所述专利申请模块包括：文档上传、信息填写、自动分类功能。",
    "3. 根据权利要求1所述的系统，其特征在于，所述审核模块包括：智能审核、人工审核、审核流程管理功能。",
  ],
  technicalField: "计算机技术",
  keywords: ["专利管理", "人工智能", "自动化", "审核系统"],
  documents: [
    {
      id: 1,
      patentId: 1,
      name: "专利申请说明书",
      type: "application",
      fileUrl: "/documents/application.pdf",
      fileSize: 1024000, // 1MB
      uploadedAt: "2024-01-15",
      uploadedBy: 1,
    },
    {
      id: 2,
      patentId: 1,
      name: "专利公开说明书",
      type: "publication",
      fileUrl: "/documents/publication.pdf",
      fileSize: 2048000, // 2MB
      uploadedAt: "2024-07-15",
      uploadedBy: 1,
    },
    {
      id: 3,
      patentId: 1,
      name: "专利授权证书",
      type: "grant",
      fileUrl: "/documents/grant.pdf",
      fileSize: 512000, // 512KB
      uploadedAt: "2024-12-15",
      uploadedBy: 1,
    },
    {
      id: 4,
      patentId: 1,
      name: "专利修改文件",
      type: "amendment",
      fileUrl: "/documents/amendment.doc",
      fileSize: 256000, // 256KB
      uploadedAt: "2024-06-15",
      uploadedBy: 1,
    },
  ],
  fees: [],
  timeline: [],
  createdAt: "2024-01-15",
  updatedAt: "2024-12-15",
  createdBy: 1,
  updatedBy: 1,
});

// 测试单个文档下载
const testDownloadDocument = async (document: PatentDocument) => {
  try {
    ElMessage.info(`正在准备下载: ${document.name}`);

    await downloadPatentDocument(document, testPatent.value, {
      filename: `${document.name}_${testPatent.value.patentNumber}`,
      showProgress: true,
    });

    ElMessage.success(`下载完成: ${document.name}`);
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error(`下载失败: ${document.name}`);
  }
};

// 测试申请文件下载
const testDownloadApplication = async () => {
  const document = testPatent.value.documents.find(
    (d) => d.type === "application"
  );
  if (document) {
    await testDownloadDocument(document);
  }
};

// 测试公开文件下载
const testDownloadPublication = async () => {
  const document = testPatent.value.documents.find(
    (d) => d.type === "publication"
  );
  if (document) {
    await testDownloadDocument(document);
  }
};

// 测试授权文件下载
const testDownloadGrant = async () => {
  const document = testPatent.value.documents.find((d) => d.type === "grant");
  if (document) {
    await testDownloadDocument(document);
  }
};

// 测试修改文件下载
const testDownloadAmendment = async () => {
  const document = testPatent.value.documents.find(
    (d) => d.type === "amendment"
  );
  if (document) {
    await testDownloadDocument(document);
  }
};

// 测试批量下载
const testBatchDownload = async () => {
  try {
    ElMessage.info(
      `正在准备批量下载 ${testPatent.value.documents.length} 个文档...`
    );

    await downloadMultipleDocuments(
      testPatent.value.documents,
      testPatent.value,
      {
        showProgress: true,
      }
    );

    ElMessage.success(
      `批量下载完成，共 ${testPatent.value.documents.length} 个文档`
    );
  } catch (error) {
    console.error("批量下载失败:", error);
    ElMessage.error("批量下载失败");
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

const formatDate = (dateString: string): string => {
  if (!dateString) return "未知";
  return new Date(dateString).toLocaleDateString("zh-CN");
};
</script>

<style scoped>
.test-download {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: 600;
  color: #2c3e50;
}

.test-section {
  margin-bottom: 20px;
}

.test-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.test-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-buttons {
    flex-direction: column;
  }
}
</style>
