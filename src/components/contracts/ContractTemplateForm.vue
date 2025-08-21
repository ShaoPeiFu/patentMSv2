<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <el-form-item label="模板名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入模板名称" />
    </el-form-item>

    <el-form-item label="合同类型" prop="type">
      <el-select
        v-model="form.type"
        placeholder="请选择合同类型"
        style="width: 100%"
      >
        <el-option label="专利申请" value="patent_application" />
        <el-option label="专利审查" value="patent_prosecution" />
        <el-option label="专利诉讼" value="patent_litigation" />
        <el-option label="商标" value="trademark" />
        <el-option label="版权" value="copyright" />
        <el-option label="自定义" value="custom" />
      </el-select>
    </el-form-item>

    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="请输入模板描述"
      />
    </el-form-item>

    <el-form-item label="模板内容" prop="content">
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="10"
        placeholder="请输入合同模板内容，可使用 {变量名} 格式定义变量"
      />
    </el-form-item>

    <el-form-item label="变量列表" prop="variables">
      <el-input
        v-model="variablesInput"
        placeholder="请输入变量名，用逗号分隔"
        @input="updateVariables"
      />
      <div class="variables-preview">
        <el-tag
          v-for="variable in form.variables"
          :key="variable"
          size="small"
          style="margin: 4px"
        >
          {{ variable }}
        </el-tag>
      </div>
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select
        v-model="form.status"
        placeholder="请选择状态"
        style="width: 100%"
      >
        <el-option label="草稿" value="draft" />
        <el-option label="活跃" value="active" />
        <el-option label="归档" value="archived" />
      </el-select>
    </el-form-item>

    <el-form-item label="版本" prop="version">
      <el-input v-model="form.version" placeholder="请输入版本号，如 1.0" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ContractTemplate } from "@/types/contract";

const props = defineProps<{
  initialData?: ContractTemplate | null;
}>();

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const formRef = ref<FormInstance>();

const form = ref({
  name: "",
  type: "patent_application" as any,
  description: "",
  content: "",
  variables: [] as string[],
  status: "draft" as "draft" | "active" | "archived",
  version: "1.0",
});

// 确保 variables 始终是数组
const ensureVariablesArray = (data: any) => {
  console.log("ensureVariablesArray: 输入数据:", data);

  if (data && typeof data === "object") {
    const result = {
      ...data,
      variables: Array.isArray(data.variables) ? [...data.variables] : [],
    };
    console.log("ensureVariablesArray: 输出结果:", result);
    return result;
  }

  console.log("ensureVariablesArray: 数据无效，返回默认值");
  return data;
};

const variablesInput = ref("");

const rules: FormRules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择合同类型", trigger: "change" }],
  description: [{ required: true, message: "请输入模板描述", trigger: "blur" }],
  content: [{ required: true, message: "请输入模板内容", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  version: [{ required: true, message: "请输入版本号", trigger: "blur" }],
};

// 更新变量列表
const updateVariables = () => {
  console.log("updateVariables: 输入值:", variablesInput.value);

  if (variablesInput.value && variablesInput.value.trim()) {
    const variables = variablesInput.value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    form.value.variables = variables;
    console.log("updateVariables: 更新后的变量列表:", variables);
  } else {
    form.value.variables = [];
    console.log("updateVariables: 清空变量列表");
  }
};

// 监听初始数据变化
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      console.log("ContractTemplateForm: 接收到初始数据:", newData);
      console.log(
        "ContractTemplateForm: variables 字段类型:",
        typeof newData.variables
      );
      console.log("ContractTemplateForm: variables 字段值:", newData.variables);

      // 使用辅助函数确保数据安全
      const safeData = ensureVariablesArray(newData);
      console.log("ContractTemplateForm: 安全处理后的数据:", safeData);

      Object.assign(form.value, safeData);

      // 更新变量输入框
      if (safeData.variables.length > 0) {
        variablesInput.value = safeData.variables.join(", ");
      } else {
        variablesInput.value = "";
      }
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    emit("submit", form.value);
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.variables-preview {
  margin-top: 8px;
  min-height: 32px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
}
</style>
