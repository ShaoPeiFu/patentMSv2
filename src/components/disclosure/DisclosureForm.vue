<template>
  <div class="disclosure-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
    >
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>{{ isEdit ? "编辑交底书" : "提交交底书" }}</h3>
            <div class="header-actions">
              <el-button @click="generateFileNumber" :loading="generating">
                生成案号
              </el-button>
              <span v-if="form.companyFileNumber" class="file-number">
                案号：{{ form.companyFileNumber }}
              </span>
            </div>
          </div>
        </template>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入交底书标题"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select
                v-model="form.department"
                placeholder="请选择部门"
                style="width: 100%"
              >
                <el-option
                  v-for="dept in departments"
                  :key="dept.value"
                  :label="dept.label"
                  :value="dept.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="技术领域" prop="technicalField">
              <el-input
                v-model="form.technicalField"
                placeholder="请输入技术领域"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关键词" prop="keywords">
              <el-input
                v-model="form.keywords"
                placeholder="请输入关键词，用分号分隔"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="技术描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="请详细描述技术方案、创新点、技术效果等"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="发明人" prop="inventors">
              <el-input
                v-model="form.inventors"
                placeholder="请输入发明人，多人用分号分隔"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人" prop="applicants">
              <el-input
                v-model="form.applicants"
                placeholder="请输入申请人"
                maxlength="200"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="附件">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :before-upload="beforeUpload"
            :auto-upload="false"
            multiple
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、Word、Excel、图片文件，单个文件不超过50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-card>

      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? "更新" : "提交" }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import {
  ElMessage,
  type FormInstance,
  type UploadFile,
  type UploadFiles,
} from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import { useDisclosureStore } from "../../stores/disclosure";
import { useUserStore } from "../../stores/user";
import type {
  DisclosureFormData,
  DisclosureDocument,
} from "../../types/disclosure";

interface Props {
  initialData?: DisclosureDocument;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  success: [disclosure: DisclosureDocument];
  cancel: [];
}>();

const disclosureStore = useDisclosureStore();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const uploadRef = ref();
const submitting = ref(false);
const generating = ref(false);
const fileList = ref<UploadFile[]>([]);

const isEdit = computed(() => !!props.initialData);

// 表单数据
const form = reactive<DisclosureFormData & { companyFileNumber?: string }>({
  title: "",
  department: "",
  technicalField: "",
  description: "",
  keywords: "",
  inventors: "",
  applicants: "",
  attachments: [],
  companyFileNumber: "",
});

// 部门选项
const departments = [
  { label: "管理部", value: "admin" },
  { label: "研发部", value: "research" },
  { label: "开发部", value: "development" },
  { label: "法务部", value: "legal" },
  { label: "市场部", value: "marketing" },
  { label: "财务部", value: "finance" },
  { label: "人事部", value: "hr" },
];

// 表单验证规则
const rules = {
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    { min: 5, max: 200, message: "标题长度应在5-200字符之间", trigger: "blur" },
  ],
  department: [{ required: true, message: "请选择部门", trigger: "change" }],
  description: [
    { required: true, message: "请输入技术描述", trigger: "blur" },
    {
      min: 50,
      max: 2000,
      message: "技术描述应在50-2000字符之间",
      trigger: "blur",
    },
  ],
  inventors: [{ required: true, message: "请输入发明人", trigger: "blur" }],
};

// 监听初始数据变化
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      Object.assign(form, {
        title: newData.title,
        department: newData.department,
        technicalField: newData.technicalField || "",
        description: newData.description,
        keywords: newData.keywords || "",
        inventors: newData.inventors,
        applicants: newData.applicants || "",
        companyFileNumber: newData.companyFileNumber,
      });

      // 处理现有附件
      if (newData.attachments) {
        try {
          const attachments = JSON.parse(newData.attachments);
          fileList.value = attachments.map((file: any, index: number) => ({
            name: file.originalName,
            uid: index,
            status: "success",
            size: file.size,
            response: file,
          }));
        } catch (error) {
          console.error("解析附件失败:", error);
        }
      }
    }
  },
  { immediate: true }
);

// 生成公司案号
const generateFileNumber = async () => {
  if (!form.department) {
    ElMessage.warning("请先选择部门");
    return;
  }

  generating.value = true;
  try {
    const fileNumber = await disclosureStore.generateFileNumber(
      form.department
    );
    form.companyFileNumber = fileNumber;
    ElMessage.success("案号生成成功");
  } catch (error) {
    console.error("生成案号失败:", error);
    ElMessage.error("生成案号失败");
  } finally {
    generating.value = false;
  }
};

// 文件上传处理
const handleFileChange = (file: UploadFile, uploadFiles: UploadFiles) => {
  // 验证文件类型
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];

  if (file.raw && !allowedTypes.includes(file.raw.type)) {
    ElMessage.error("不支持的文件类型");
    return false;
  }

  // 验证文件大小
  if (file.raw && file.raw.size > 50 * 1024 * 1024) {
    ElMessage.error("文件大小不能超过50MB");
    return false;
  }

  fileList.value = uploadFiles;
  form.attachments = uploadFiles.map((f) => f.raw).filter((f) => f) as File[];
};

const handleFileRemove = (file: UploadFile, uploadFiles: UploadFiles) => {
  fileList.value = uploadFiles;
  form.attachments = uploadFiles.map((f) => f.raw).filter((f) => f) as File[];
};

const beforeUpload = () => {
  // 阻止自动上传
  return false;
};

// 表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch (error) {
    ElMessage.error("请检查表单输入");
    return;
  }

  submitting.value = true;
  try {
    let result: DisclosureDocument;

    if (isEdit.value && props.initialData) {
      // 编辑模式
      result = await disclosureStore.updateDisclosure(
        props.initialData.id,
        form
      );
      ElMessage.success("交底书更新成功");
    } else {
      // 新建模式
      if (!form.companyFileNumber) {
        ElMessage.warning("请先生成公司案号");
        return;
      }
      result = await disclosureStore.createDisclosure(form);
      ElMessage.success("交底书提交成功");
    }

    emit("success", result);
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error(isEdit.value ? "更新失败" : "提交失败");
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped lang="scss">
.disclosure-form {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;

  .form-card {
    margin-bottom: 24px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: #303133;
        font-size: 18px;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .file-number {
          font-size: 14px;
          color: #409eff;
          font-weight: 500;
        }
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 24px 0;
  }

  .upload-demo {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 120px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .disclosure-form {
    padding: 16px;

    .card-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .header-actions {
        justify-content: space-between;
      }
    }
  }
}
</style>
