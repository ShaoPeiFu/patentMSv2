<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    class="batch-operation-form"
  >
    <el-form-item label="操作类型" prop="operationType">
      <el-select
        v-model="form.operationType"
        placeholder="选择操作类型"
        style="width: 100%"
      >
        <el-option label="批量延期" value="extend" />
        <el-option label="批量完成" value="complete" />
        <el-option label="批量取消" value="cancel" />
        <el-option label="批量提醒" value="remind" />
      </el-select>
    </el-form-item>

    <el-form-item label="目标期限" prop="targetDeadlines">
      <el-select
        v-model="form.targetDeadlines"
        multiple
        placeholder="选择目标期限"
        style="width: 100%"
      >
        <el-option
          v-for="deadline in availableDeadlines"
          :key="deadline.id"
          :label="`${deadline.patentNumber} - ${deadline.patentTitle}`"
          :value="deadline.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item
      v-if="form.operationType === 'extend'"
      label="延期天数"
      prop="extensionDays"
    >
      <el-input-number
        v-model="form.extensionDays"
        :min="1"
        :max="365"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        创建批量操作
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

// 模拟可用期限数据
const availableDeadlines = ref([
  { id: 1, patentNumber: "CN202300001", patentTitle: "一种新型传感器技术" },
  { id: 2, patentNumber: "CN202300002", patentTitle: "智能控制系统" },
  { id: 3, patentNumber: "CN202300003", patentTitle: "数据处理方法" },
]);

const form = reactive({
  operationType: "",
  targetDeadlines: [] as number[],
  extensionDays: 30,
});

const rules: FormRules = {
  operationType: [
    { required: true, message: "请选择操作类型", trigger: "change" },
  ],
  targetDeadlines: [
    { required: true, message: "请选择目标期限", trigger: "change" },
  ],
  extensionDays: [
    { required: true, message: "请输入延期天数", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 365,
      message: "延期天数必须在1-365天之间",
      trigger: "blur",
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const operationData = {
      operationType: form.operationType,
      targetDeadlines: form.targetDeadlines,
      parameters:
        form.operationType === "extend"
          ? { extensionDays: form.extensionDays }
          : {},
    };

    emit("submit", operationData);
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.batch-operation-form {
  padding: 20px;
}
</style>
