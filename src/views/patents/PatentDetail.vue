<template>
  <div class="patent-detail">
    <div class="page-header">
      <el-button @click="$router.back()" icon="ArrowLeft"> 返回 </el-button>
      <h1>专利详情</h1>
      <div class="header-actions">
        <el-button type="primary" @click="editPatent">
          <el-icon><Edit /></el-icon>
          编辑专利
        </el-button>
      </div>
    </div>

    <div v-if="patent" class="patent-content">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <h3>基本信息</h3>
            <el-tag :type="getStatusType(patent.status)">
              {{ getStatusText(patent.status) }}
            </el-tag>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="专利标题">
            {{ patent.title }}
          </el-descriptions-item>
          <el-descriptions-item label="专利号">
            {{ patent.patentNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="申请号">
            {{ patent.applicationNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="申请日期">
            {{ patent.applicationDate }}
          </el-descriptions-item>
          <el-descriptions-item label="公开日期">
            {{ patent.publicationDate || "未公开" }}
          </el-descriptions-item>
          <el-descriptions-item label="授权日期">
            {{ patent.grantDate || "未授权" }}
          </el-descriptions-item>
          <el-descriptions-item label="到期日期">
            {{ patent.expirationDate || "未设置" }}
          </el-descriptions-item>
          <el-descriptions-item label="专利类型">
            <el-tag>{{ getTypeText(patent.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="技术领域">
            {{ patent.technicalField }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ patent.applicants.join(", ") }}
          </el-descriptions-item>
          <el-descriptions-item label="发明人">
            {{ patent.inventors.join(", ") }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 摘要和权利要求 -->
      <el-row :gutter="20" class="content-row">
        <el-col :span="12">
          <el-card class="content-card">
            <template #header>
              <h3>专利摘要</h3>
            </template>
            <p class="abstract-text">{{ patent.abstract }}</p>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="content-card">
            <template #header>
              <h3>权利要求</h3>
            </template>
            <div class="claims-list">
              <div
                v-for="(claim, index) in patent.claims"
                :key="index"
                class="claim-item"
              >
                <span class="claim-number">{{ index + 1 }}.</span>
                <span class="claim-text">{{ claim }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 关键词 -->
      <el-card class="keywords-card">
        <template #header>
          <h3>关键词</h3>
        </template>
        <div class="keywords-list">
          <el-tag
            v-for="keyword in patent.keywords"
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </el-tag>
        </div>
      </el-card>

      <!-- 文档版本管理 -->
      <el-card class="documents-card">
        <template #header>
          <div class="card-header">
            <h3>文档版本管理</h3>
            <el-switch
              v-model="useAdvancedDocumentManagement"
              active-text="高级版本管理"
              inactive-text="简单文档管理"
              @change="handleDocumentModeChange"
            />
          </div>
        </template>

        <!-- 高级版本管理 -->
        <div v-if="useAdvancedDocumentManagement">
          <DocumentVersionManager :document-id="patentId" />
        </div>

        <!-- 简单文档管理（保留原有功能） -->
        <div v-else>
          <div class="table-header">
            <div class="table-actions">
              <el-button
                type="primary"
                size="small"
                @click="showUploadDialog = true"
              >
                <el-icon><Upload /></el-icon>
                上传文档
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="downloadAllDocuments"
                :disabled="!patent.documents.length"
              >
                <el-icon><Download /></el-icon>
                批量下载
              </el-button>
              <el-button type="success" size="small" @click="testDownload">
                <el-icon><Download /></el-icon>
                测试下载
              </el-button>
            </div>
          </div>

          <el-table :data="patent.documents" stripe>
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
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="downloadDocument(row)"
                  >
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteDocument(row)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- 文件上传对话框 -->
      <el-dialog
        v-model="showUploadDialog"
        title="上传专利文档"
        width="600px"
        :before-close="handleUploadDialogClose"
      >
        <div class="upload-dialog-content">
          <el-form :model="uploadForm" label-width="100px">
            <el-form-item label="文档类型">
              <el-select v-model="uploadForm.type" placeholder="选择文档类型">
                <el-option label="申请文件" value="application" />
                <el-option label="公开文件" value="publication" />
                <el-option label="授权文件" value="grant" />
                <el-option label="修改文件" value="amendment" />
                <el-option label="其他文件" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="文档名称">
              <el-input
                v-model="uploadForm.name"
                placeholder="请输入文档名称"
              />
            </el-form-item>

            <el-form-item label="文档文件">
              <FileUpload
                v-model="uploadForm.files"
                :multiple="false"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                :max-size="20"
                hint="请选择要上传的文档文件"
                @file-uploaded="handleFileUploaded"
              />
            </el-form-item>
          </el-form>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showUploadDialog = false">取消</el-button>
            <el-button
              type="primary"
              @click="handleUploadSubmit"
              :loading="uploading"
            >
              确认上传
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 费用管理 -->
      <el-card class="fees-card">
        <template #header>
          <div class="card-header">
            <h3>费用管理</h3>
          </div>
        </template>

        <el-table :data="patent.fees" stripe>
          <el-table-column prop="type" label="费用类型">
            <template #default="{ row }">
              <el-tag :type="getFeeStatusType(row.status)">
                {{ getFeeTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额">
            <template #default="{ row }">
              {{ row.amount }} {{ row.currency }}
            </template>
          </el-table-column>
          <el-table-column prop="dueDate" label="到期日期">
            <template #default="{ row }">
              {{ formatDate(row.dueDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getFeeStatusType(row.status)">
                {{ getFeeStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 时间线 -->
      <el-card class="timeline-card">
        <template #header>
          <h3>专利时间线</h3>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="event in patent.timeline"
            :key="event.id"
            :timestamp="formatDate(event.date)"
            :type="getTimelineItemType(event.type)"
          >
            <h4>{{ event.title }}</h4>
            <p>{{ event.description }}</p>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <div v-else class="loading-container">
      <el-empty description="专利不存在或已被删除" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePatentStore } from "@/stores/patent";
// import { useDocumentStore } from "@/stores/document";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Download, Upload, Delete } from "@element-plus/icons-vue";
import type { Patent, PatentDocument } from "@/types/patent";
import {
  downloadPatentDocument,
  downloadMultipleDocuments,
} from "@/utils/download";
import FileUpload from "@/components/FileUpload.vue";
import DocumentVersionManager from "@/components/DocumentVersionManager.vue";

const route = useRoute();
const router = useRouter();
const patentStore = usePatentStore();
// const documentStore = useDocumentStore();

const patent = ref<Patent | null>(null);
const patentId = ref<string>("");
const useAdvancedDocumentManagement = ref(true);

// 文件上传相关
const showUploadDialog = ref(false);
const uploading = ref(false);
const uploadForm = ref({
  type: "",
  name: "",
  files: [],
});

// 获取专利详情
const fetchPatentDetail = async () => {
  const patentId = parseInt(route.params.id as string);
  if (isNaN(patentId)) {
    ElMessage.error("无效的专利ID");
    return;
  }

  const foundPatent = patentStore.getPatentById(patentId);
  if (foundPatent) {
    patent.value = foundPatent;
  } else {
    ElMessage.error("专利不存在");
  }
};

// 编辑专利
const editPatent = () => {
  if (patent.value) {
    router.push(`/dashboard/patents/${patent.value.id}/edit`);
  }
};

// 文档管理模式切换
const handleDocumentModeChange = (useAdvanced: boolean) => {
  if (useAdvanced) {
    ElMessage.success("已切换到高级版本管理模式");
  } else {
    ElMessage.success("已切换到简单文档管理模式");
  }
};

// 下载文档
const downloadDocument = async (document: PatentDocument) => {
  try {
    ElMessage.info(`正在准备下载: ${document.name}`);

    // 使用下载工具函数
    await downloadPatentDocument(document, patent.value, {
      filename: `${document.name}_${patent.value?.patentNumber}`,
      showProgress: true,
    });

    ElMessage.success(`下载完成: ${document.name}`);
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error(`下载失败: ${document.name}`);
  }
};

// 批量下载文档
const downloadAllDocuments = async () => {
  if (!patent.value?.documents.length) {
    ElMessage.warning("没有可下载的文档");
    return;
  }

  try {
    ElMessage.info(
      `正在准备批量下载 ${patent.value.documents.length} 个文档...`
    );

    // 使用批量下载工具函数
    await downloadMultipleDocuments(patent.value.documents, patent.value, {
      showProgress: true,
    });

    ElMessage.success(
      `批量下载完成，共 ${patent.value.documents.length} 个文档`
    );
  } catch (error) {
    console.error("批量下载失败:", error);
    ElMessage.error("批量下载失败");
  }
};

// 删除文档
const deleteDocument = async (document: PatentDocument) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档 "${document.name}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 从专利文档列表中移除
    if (patent.value) {
      const index = patent.value.documents.findIndex(
        (d) => d.id === document.id
      );
      if (index !== -1) {
        patent.value.documents.splice(index, 1);

        // 保存到localStorage
        const patents = JSON.parse(localStorage.getItem("patents") || "[]");
        const patentIndex = patents.findIndex(
          (p: any) => p.id === patent.value?.id
        );
        if (patentIndex !== -1) {
          patents[patentIndex] = patent.value;
          localStorage.setItem("patents", JSON.stringify(patents));
        }

        ElMessage.success("文档删除成功");
      }
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除文档失败");
    }
  }
};

// 处理上传对话框关闭
const handleUploadDialogClose = () => {
  showUploadDialog.value = false;
  uploadForm.value = {
    type: "",
    name: "",
    files: [],
  };
};

// 处理文件上传成功
const handleFileUploaded = (file: any) => {
  console.log("文件上传成功:", file);
  console.log("文件URL:", file.url);
  console.log("文件响应:", file.response);
};

// 处理上传提交
const handleUploadSubmit = async () => {
  if (
    !uploadForm.value.type ||
    !uploadForm.value.name ||
    uploadForm.value.files.length === 0
  ) {
    ElMessage.error("请填写完整的文档信息");
    return;
  }

  uploading.value = true;
  try {
    const uploadedFile = uploadForm.value.files[0] as any;

    console.log("上传的文件信息:", uploadedFile);
    console.log("文件URL:", uploadedFile.url);
    console.log("文件响应:", uploadedFile.response);

    // 获取文件URL
    let fileUrl = "";
    if (uploadedFile.url) {
      fileUrl = uploadedFile.url;
    } else if (uploadedFile.response && uploadedFile.response.url) {
      fileUrl = uploadedFile.response.url;
    } else if (uploadedFile.raw) {
      // 如果没有URL，从原始文件创建blob URL
      fileUrl = URL.createObjectURL(uploadedFile.raw);
    }

    console.log("最终文件URL:", fileUrl);

    // 创建新的文档记录
    const newDocument: PatentDocument = {
      id: Date.now(),
      patentId: patent.value?.id || 0,
      name: uploadForm.value.name,
      type: uploadForm.value.type as
        | "application"
        | "publication"
        | "grant"
        | "amendment"
        | "other",
      fileUrl: fileUrl,
      fileSize: uploadedFile.size || 0,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 1, // 当前用户ID
    };

    console.log("创建的文档记录:", newDocument);

    // 添加到专利文档列表
    if (patent.value) {
      patent.value.documents.push(newDocument);

      // 保存到localStorage
      const patents = JSON.parse(localStorage.getItem("patents") || "[]");
      const patentIndex = patents.findIndex(
        (p: any) => p.id === patent.value?.id
      );
      if (patentIndex !== -1) {
        patents[patentIndex] = patent.value;
        localStorage.setItem("patents", JSON.stringify(patents));
      }
    }

    ElMessage.success("文档上传成功");
    showUploadDialog.value = false;
    uploadForm.value = {
      type: "",
      name: "",
      files: [],
    };
  } catch (error) {
    console.error("上传文档失败:", error);
    ElMessage.error("上传文档失败");
  } finally {
    uploading.value = false;
  }
};

// 测试下载功能
const testDownload = () => {
  if (!patent.value?.documents.length) {
    ElMessage.warning("没有可下载的文档");
    return;
  }

  const testDoc = patent.value.documents[0];
  console.log("测试下载文档:", testDoc);
  console.log("文档URL:", testDoc.fileUrl);

  // 直接测试下载
  if (testDoc.fileUrl && testDoc.fileUrl.startsWith("blob:")) {
    const link = window.document.createElement("a");
    link.href = testDoc.fileUrl;
    link.download = testDoc.name;
    link.style.display = "none";

    window.document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      window.document.body.removeChild(link);
    }, 100);

    ElMessage.success("测试下载完成");
  } else {
    ElMessage.error("文档URL无效，无法下载");
  }
};

// 工具函数
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    expired: "info",
    maintained: "primary",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待审核",
    approved: "已批准",
    rejected: "已拒绝",
    expired: "已过期",
    maintained: "维护中",
  };
  return texts[status] || status;
};

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    invention: "发明专利",
    utility_model: "实用新型",
    design: "外观设计",
    software: "软件专利",
  };
  return texts[type] || type;
};

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

const getFeeTypeText = (type: string) => {
  const texts: Record<string, string> = {
    application: "申请费",
    examination: "审查费",
    grant: "授权费",
    maintenance: "年费",
    other: "其他费用",
  };
  return texts[type] || type;
};

const getFeeStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "warning",
    paid: "success",
    overdue: "danger",
  };
  return types[status] || "info";
};

const getFeeStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待缴费",
    paid: "已缴费",
    overdue: "已逾期",
  };
  return texts[status] || status;
};

const getTimelineItemType = (type: string) => {
  const types: Record<string, string> = {
    application: "primary",
    publication: "success",
    examination: "warning",
    grant: "success",
    maintenance: "info",
    amendment: "warning",
  };
  return types[type] || "info";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

onMounted(() => {
  patentId.value = route.params.id as string;
  fetchPatentDetail();
});
</script>

<style scoped>
.patent-detail {
  padding: 20px;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.patent-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
}

.content-row {
  margin-bottom: 20px;
}

.content-card {
  height: 100%;
}

.abstract-text {
  line-height: 1.6;
  color: #666;
  margin: 0;
}

.claims-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.claim-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.claim-number {
  font-weight: bold;
  color: #409eff;
  min-width: 30px;
}

.claim-text {
  flex: 1;
  line-height: 1.5;
}

.keywords-card {
  margin-bottom: 20px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.keyword-tag {
  margin: 0;
}

.table-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.documents-card,
.fees-card,
.timeline-card {
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-buttons .el-button {
  flex-shrink: 0;
}
</style>
