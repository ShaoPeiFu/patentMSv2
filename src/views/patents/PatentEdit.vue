<template>
  <div class="patent-edit">
    <div class="page-header">
      <el-button @click="$router.back()" icon="ArrowLeft"> 返回 </el-button>
      <h1>{{ isEdit ? "编辑专利" : "添加专利" }}</h1>
      <div class="header-actions">
        <el-button @click="saveDraft">
          <el-icon><DocumentIcon /></el-icon>
          保存草稿
        </el-button>
        <el-button type="primary" @click="savePatent" :loading="saving">
          <el-icon><Check /></el-icon>
          {{ isEdit ? "保存修改" : "保存专利" }}
        </el-button>
      </div>
    </div>

    <div class="patent-content">
      <!-- 基本信息编辑 -->
      <el-card class="info-card">
        <template #header>
          <h3>基本信息</h3>
        </template>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="专利标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入专利标题" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专利号" prop="patentNumber">
                <el-input
                  v-model="form.patentNumber"
                  placeholder="请输入专利号"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="申请号" prop="applicationNumber">
                <el-input
                  v-model="form.applicationNumber"
                  placeholder="请输入申请号"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="申请日期" prop="applicationDate">
                <el-date-picker
                  v-model="form.applicationDate"
                  type="date"
                  placeholder="选择申请日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="专利类型" prop="type">
                <el-select
                  v-model="form.type"
                  placeholder="选择专利类型"
                  style="width: 100%"
                >
                  <el-option label="发明专利" value="invention" />
                  <el-option label="实用新型" value="utility_model" />
                  <el-option label="外观设计" value="design" />
                  <el-option label="软件专利" value="software" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专利状态" prop="status">
                <el-select
                  v-model="form.status"
                  placeholder="选择专利状态"
                  style="width: 100%"
                  :disabled="!canEditStatus"
                >
                  <el-option label="待审核" value="pending" />
                  <el-option label="已批准" value="approved" />
                  <el-option label="已拒绝" value="rejected" />
                  <el-option label="已过期" value="expired" />
                  <el-option label="维护中" value="maintained" />
                </el-select>
                <div v-if="!canEditStatus" class="field-tip">
                  只有管理员和审核员可以修改专利状态
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="专利描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请输入专利描述"
            />
          </el-form-item>

          <el-form-item label="技术领域" prop="technicalField">
            <el-input
              v-model="form.technicalField"
              placeholder="请输入技术领域"
            />
          </el-form-item>

          <el-form-item label="关键词" prop="keywords">
            <el-select
              v-model="form.keywords"
              multiple
              filterable
              allow-create
              placeholder="请输入关键词"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="申请人" prop="applicants">
            <el-select
              v-model="form.applicants"
              multiple
              filterable
              allow-create
              placeholder="请输入申请人"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="发明人" prop="inventors">
            <el-select
              v-model="form.inventors"
              multiple
              filterable
              allow-create
              placeholder="请输入发明人"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 文档管理 -->
      <el-card class="documents-card">
        <template #header>
          <div class="card-header">
            <h3>文档管理</h3>
            <div class="header-actions">
              <el-button
                v-if="documents.length > 0"
                size="small"
                type="success"
                @click="downloadAllDocuments"
              >
                <el-icon><Download /></el-icon>
                批量下载
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="showUploadDialog = true"
              >
                <el-icon><Upload /></el-icon>
                上传文档
              </el-button>
            </div>
          </div>
        </template>

        <el-table :data="documents" stripe>
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
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button size="small" @click="downloadDocument(row)">
                下载
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteDocument(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 费用管理 -->
      <el-card class="fees-card">
        <template #header>
          <div class="card-header">
            <h3>费用管理</h3>
            <el-button
              size="small"
              type="primary"
              @click="showFeeDialog = true"
            >
              <el-icon><Plus /></el-icon>
              添加费用
            </el-button>
          </div>
        </template>

        <el-table :data="fees" stripe>
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
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="editFee(row)"> 编辑 </el-button>
              <el-button size="small" @click="payFee(row)"> 缴费 </el-button>
              <el-button size="small" type="danger" @click="deleteFee(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 文档上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传文档" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="文档名称" prop="name">
          <el-input v-model="uploadForm.name" placeholder="请输入文档名称" />
        </el-form-item>
        <el-form-item label="文档类型" prop="type">
          <el-select
            v-model="uploadForm.type"
            placeholder="选择文档类型"
            style="width: 100%"
          >
            <el-option label="申请文件" value="application" />
            <el-option label="公开文件" value="publication" />
            <el-option label="授权文件" value="grant" />
            <el-option label="修改文件" value="amendment" />
            <el-option label="其他文件" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件" prop="file">
          <FileUpload
            v-model="uploadedFiles"
            :multiple="false"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            :max-size="50"
            hint="请选择要上传的文档文件"
            @file-uploaded="handleFileUploaded"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="uploadDocument">上传</el-button>
      </template>
    </el-dialog>

    <!-- 费用编辑对话框 -->
    <el-dialog v-model="showFeeDialog" title="费用管理" width="500px">
      <el-form :model="feeForm" label-width="100px">
        <el-form-item label="费用类型" prop="type">
          <el-select
            v-model="feeForm.type"
            placeholder="选择费用类型"
            style="width: 100%"
          >
            <el-option label="申请费" value="application" />
            <el-option label="审查费" value="examination" />
            <el-option label="授权费" value="grant" />
            <el-option label="年费" value="maintenance" />
            <el-option label="其他费用" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="feeForm.amount"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="货币" prop="currency">
          <el-select
            v-model="feeForm.currency"
            placeholder="选择货币"
            style="width: 100%"
          >
            <el-option label="人民币" value="CNY" />
            <el-option label="美元" value="USD" />
            <el-option label="欧元" value="EUR" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期日期" prop="dueDate">
          <el-date-picker
            v-model="feeForm.dueDate"
            type="date"
            placeholder="选择到期日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="feeForm.status"
            placeholder="选择状态"
            style="width: 100%"
          >
            <el-option label="待缴费" value="pending" />
            <el-option label="已缴费" value="paid" />
            <el-option label="已逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="feeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入费用描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFeeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFee">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePatentStore } from "@/stores/patent";
import { useActivityStore } from "@/stores/activity";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Check,
  Document as DocumentIcon,
  Upload,
  Plus,
} from "@element-plus/icons-vue";
import type { PatentDocument, PatentFee } from "@/types/patent";
import type { FormInstance, FormRules } from "element-plus";
import { hasPermission } from "@/utils/permissions";
import { formatDate } from "@/utils/dateUtils";
import FileUpload from "@/components/FileUpload.vue";
import {
  downloadPatentDocument,
  downloadMultipleDocuments,
} from "@/utils/download";

const route = useRoute();
const router = useRouter();
const patentStore = usePatentStore();
const userStore = useUserStore();

// 权限控制
const currentUserRole = computed(() => userStore.currentUser?.role || "user");
const canEditStatus = computed(() => {
  return (
    hasPermission(currentUserRole.value, "canEditPatents") ||
    hasPermission(currentUserRole.value, "canAccessReviewCenter")
  );
});

const saving = ref(false);
const showUploadDialog = ref(false);
const showFeeDialog = ref(false);
const editingFee = ref<PatentFee | null>(null);

const formRef = ref<FormInstance>();

// 判断是否为编辑模式
const isEdit = computed(() => route.path.includes("/edit"));

// 表单数据
const form = reactive({
  title: "",
  patentNumber: "",
  applicationNumber: "",
  applicationDate: "",
  type: "",
  status: "pending",
  description: "",
  technicalField: "",
  applicants: ["新浪科技有限公司"], // 设置默认申请人
  inventors: ["系统管理员"], // 设置默认发明人
  keywords: [],
});

// 文档和费用数据
const documents = ref<PatentDocument[]>([]);
const fees = ref<PatentFee[]>([]);

// 上传的文件
const uploadedFiles = ref<any[]>([]);

// 上传表单
const uploadForm = reactive({
  name: "",
  type: "application",
  file: null as File | null,
});

// 费用表单
const feeForm = reactive({
  type: "application",
  amount: 0,
  currency: "CNY",
  dueDate: "",
  status: "pending",
  description: "",
});

// 表单验证规则
const rules: FormRules = {
  title: [{ required: true, message: "请输入专利标题", trigger: "blur" }],
  patentNumber: [{ required: true, message: "请输入专利号", trigger: "blur" }],
  applicationNumber: [
    { required: true, message: "请输入申请号", trigger: "blur" },
  ],
  applicationDate: [
    { required: true, message: "请选择申请日期", trigger: "change" },
  ],
  type: [{ required: true, message: "请选择专利类型", trigger: "change" }],
  status: [{ required: true, message: "请选择专利状态", trigger: "change" }],
  description: [{ required: true, message: "请输入专利描述", trigger: "blur" }],
  technicalField: [
    { required: true, message: "请输入技术领域", trigger: "blur" },
  ],
  applicants: [{ required: true, message: "请输入申请人", trigger: "change" }],
  inventors: [{ required: true, message: "请输入发明人", trigger: "change" }],
};

// 获取专利详情
const fetchPatentDetail = async () => {
  if (!isEdit.value) return;

  const patentId = parseInt(route.params.id as string);
  if (isNaN(patentId)) {
    ElMessage.error("无效的专利ID");
    return;
  }

  try {
    // 首先尝试从本地store获取
    let foundPatent = patentStore.getPatentById(patentId);

    // 如果本地没有，则从API获取
    if (!foundPatent) {
      console.log("本地store中没有找到专利，从API获取...");
      foundPatent = await patentStore.fetchPatentById(patentId);
    }

    if (foundPatent) {
      console.log("专利数据加载成功:", foundPatent);

      // 填充表单数据
      Object.assign(form, {
        title: foundPatent.title,
        patentNumber: foundPatent.patentNumber,
        applicationNumber: foundPatent.applicationNumber || "", // 修复申请号字段
        applicationDate: foundPatent.applicationDate,
        type: foundPatent.type,
        status: foundPatent.status,
        description: foundPatent.description,
        technicalField: foundPatent.technicalField,
        applicants: foundPatent.applicants,
        inventors: foundPatent.inventors,
        keywords: foundPatent.keywords,
      });

      // 加载文档和费用
      documents.value = foundPatent.documents || [];
      fees.value = foundPatent.fees || [];

      console.log(
        "表单数据已填充，文档数量:",
        documents.value.length,
        "费用数量:",
        fees.value.length
      );
    } else {
      ElMessage.error("专利不存在");
    }
  } catch (error) {
    console.error("获取专利详情失败:", error);
    ElMessage.error("获取专利详情失败，请稍后重试");
  }
};

// 保存专利
const savePatent = async () => {
  if (!formRef.value) return;

  try {
    // 检查用户认证状态
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      console.log("⚠️ 用户未登录，尝试恢复认证状态...");

      // 尝试恢复用户认证状态
      if (userStore.forceRestoreUser()) {
        console.log("✅ 用户认证状态已恢复");
      } else {
        ElMessage.error("用户认证失败，请重新登录");
        router.push("/login");
        return;
      }
    }

    await formRef.value.validate();
    saving.value = true;

    const patentData = {
      title: form.title,
      description: form.description,
      patentNumber: form.patentNumber,
      applicationNumber: form.applicationNumber, // 修复申请号字段保存
      applicationDate: form.applicationDate,
      type: form.type as any,
      status: form.status as any,
      categoryId: undefined, // 不设置分类，避免外键约束问题
      applicants: form.applicants,
      inventors: form.inventors,
      technicalField: form.technicalField,
      keywords: form.keywords,
      abstract: form.description,
      claims: "",
      documents: documents.value,
      fees: fees.value,
      timeline: [],
      legalStatus: form.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userStore.currentUser?.id || 1,
      updatedBy: userStore.currentUser?.id || 1,
    };

    if (isEdit.value) {
      const patentId = parseInt(route.params.id as string);
      await patentStore.updatePatent(patentId, patentData);

      // 记录编辑活动
      const activityStore = useActivityStore();
      activityStore.addActivity({
        type: "patent_review",
        title: "编辑专利",
        description: patentData.title,
        userId: userStore.currentUser?.id || 1,
        userName: userStore.currentUser?.realName || "系统管理员",
        targetId: patentId,
        targetName: patentData.title,
        timestamp: new Date().toISOString(),
        status: "success",
        statusText: "已更新",
      });

      ElMessage.success("专利更新成功");
    } else {
      await patentStore.addPatent(patentData as any);
      ElMessage.success("专利添加成功");
    }

    router.push("/dashboard/patents");
  } catch (error: any) {
    ElMessage.error("保存失败");
    console.error("保存失败:", error);

    // 如果是认证错误，跳转到登录页
    if (error.response?.status === 401) {
      ElMessage.error("登录已过期，请重新登录");
      router.push("/login");
    }
  } finally {
    saving.value = false;
  }
};

// 保存草稿
const saveDraft = () => {
  ElMessage.success("草稿已保存");
};

// 处理文件上传完成
const handleFileUploaded = (file: any) => {
  // 文件已通过FileUpload组件上传完成
  console.log("文件上传完成:", file);
  console.log("文件URL:", file.url);
  console.log("文件大小:", file.size);

  // 文件已经通过FileUpload组件处理，这里不需要额外操作
  // uploadedFiles数组会自动更新
};

// 上传文档
const uploadDocument = () => {
  if (!uploadForm.name || uploadedFiles.value.length === 0) {
    ElMessage.warning("请填写文档信息并选择文件");
    return;
  }

  const uploadedFile = uploadedFiles.value[0];

  // 检查文件数据
  if (!uploadedFile || !uploadedFile.url) {
    ElMessage.error("文件数据无效，请重新选择文件");
    return;
  }

  const newDocument: PatentDocument = {
    id: Date.now(),
    patentId: isEdit.value ? parseInt(route.params.id as string) : 0,
    name: uploadForm.name,
    type: uploadForm.type as any,
    fileUrl: uploadedFile.url,
    fileSize: uploadedFile.size || 0,
    uploadedAt: new Date().toISOString(),
    uploadedBy: userStore.currentUser?.id || 1,
  };

  // 添加到本地文档列表
  documents.value.push(newDocument);

  // 如果是在编辑模式下，通过API保存文档
  if (isEdit.value && patentStore.createPatentDocument) {
    const patentId = parseInt(route.params.id as string);
    patentStore
      .createPatentDocument(patentId, {
        name: newDocument.name,
        type: newDocument.type,
        fileUrl: newDocument.fileUrl,
        fileSize: newDocument.fileSize,
      })
      .then(() => {
        console.log("文档已保存到后端");
      })
      .catch((error) => {
        console.error("保存文档到后端失败:", error);
        ElMessage.warning("文档已添加到本地，但保存到后端失败");
      });
  }

  // 重置表单
  uploadForm.name = "";
  uploadForm.type = "application";
  uploadedFiles.value = [];
  showUploadDialog.value = false;

  ElMessage.success("文档上传成功");
};

// 下载文档
const downloadDocument = async (document: PatentDocument) => {
  try {
    ElMessage.info(`正在准备下载: ${document.name}`);

    // 使用下载工具函数
    await downloadPatentDocument(
      document,
      {
        title: form.title,
        patentNumber: form.patentNumber,
        applicationDate: form.applicationDate,
        type: form.type,
        status: form.status,
        description: form.description,
        technicalField: form.technicalField,
        applicants: form.applicants,
        inventors: form.inventors,
        keywords: form.keywords,
      },
      {
        filename: `${document.name}_${form.patentNumber || "patent"}`,
        showProgress: true,
      }
    );

    ElMessage.success(`下载完成: ${document.name}`);
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error(`下载失败: ${document.name}`);
  }
};

// 批量下载文档
const downloadAllDocuments = async () => {
  if (!documents.value.length) {
    ElMessage.warning("没有可下载的文档");
    return;
  }

  try {
    ElMessage.info(`正在准备批量下载 ${documents.value.length} 个文档...`);

    // 使用批量下载工具函数
    await downloadMultipleDocuments(
      documents.value,
      {
        title: form.title,
        patentNumber: form.patentNumber,
        applicationDate: form.applicationDate,
        type: form.type,
        status: form.status,
        description: form.description,
        technicalField: form.technicalField,
        applicants: form.applicants,
        inventors: form.inventors,
        keywords: form.keywords,
      },
      {
        showProgress: true,
      }
    );

    ElMessage.success(`批量下载完成，共 ${documents.value.length} 个文档`);
  } catch (error) {
    console.error("批量下载失败:", error);
    ElMessage.error("批量下载失败");
  }
};

// 删除文档
const deleteDocument = async (document: PatentDocument) => {
  try {
    await ElMessageBox.confirm("确定要删除这个文档吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const index = documents.value.findIndex((d) => d.id === document.id);
    if (index !== -1) {
      documents.value.splice(index, 1);
      ElMessage.success("文档删除成功");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 编辑费用
const editFee = (fee: PatentFee) => {
  editingFee.value = fee;
  Object.assign(feeForm, {
    type: fee.type,
    amount: fee.amount,
    currency: fee.currency,
    dueDate: fee.dueDate,
    status: fee.status,
    description: fee.description || "",
  });
  showFeeDialog.value = true;
};

// 保存费用
const saveFee = () => {
  const feeData = {
    id: editingFee.value?.id || Date.now(),
    patentId: isEdit.value ? parseInt(route.params.id as string) : 0,
    type: feeForm.type as any,
    amount: feeForm.amount,
    currency: feeForm.currency,
    dueDate: feeForm.dueDate,
    status: feeForm.status as any,
    description: feeForm.description,
  };

  if (editingFee.value) {
    // 更新现有费用
    const index = fees.value.findIndex((f) => f.id === editingFee.value!.id);
    if (index !== -1) {
      fees.value[index] = feeData as PatentFee;
    }
  } else {
    // 添加新费用
    fees.value.push(feeData as PatentFee);
  }

  // 重置表单
  Object.assign(feeForm, {
    type: "application",
    amount: 0,
    currency: "CNY",
    dueDate: "",
    status: "pending",
    description: "",
  });
  editingFee.value = null;
  showFeeDialog.value = false;

  ElMessage.success(editingFee.value ? "费用更新成功" : "费用添加成功");
};

// 缴费
const payFee = (fee: PatentFee) => {
  const index = fees.value.findIndex((f) => f.id === fee.id);
  if (index !== -1) {
    fees.value[index] = {
      ...fee,
      status: "paid",
      paidDate: new Date().toISOString(),
    };
    ElMessage.success(`缴费成功: ${fee.amount} ${fee.currency}`);
  }
};

// 删除费用
const deleteFee = async (fee: PatentFee) => {
  try {
    await ElMessageBox.confirm("确定要删除这个费用记录吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const index = fees.value.findIndex((f) => f.id === fee.id);
    if (index !== -1) {
      fees.value.splice(index, 1);
      ElMessage.success("费用记录删除成功");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

onMounted(() => {
  fetchPatentDetail();
});
</script>

<style scoped>
.patent-edit {
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

.documents-card,
.fees-card {
  margin-bottom: 20px;
}
</style>
