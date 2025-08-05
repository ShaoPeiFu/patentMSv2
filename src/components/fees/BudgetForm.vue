<template>
  <div class="budget-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="预算名称" prop="name">
        <el-input v-model="form.name" placeholder="输入预算名称" clearable />
      </el-form-item>

      <el-form-item label="预算类型" prop="type">
        <el-select
          v-model="form.type"
          placeholder="选择预算类型"
          style="width: 100%"
        >
          <el-option label="月度预算" value="monthly" />
          <el-option label="季度预算" value="quarterly" />
          <el-option label="年度预算" value="yearly" />
          <el-option label="项目预算" value="project" />
        </el-select>
      </el-form-item>

      <el-form-item label="预算金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0"
          :precision="2"
          :step="1000"
          style="width: 100%"
          placeholder="输入预算金额"
        />
      </el-form-item>

      <el-form-item label="货币" prop="currency">
        <el-select
          v-model="form.currency"
          placeholder="选择货币"
          style="width: 100%"
        >
          <el-option label="人民币 (CNY)" value="CNY" />
          <el-option label="美元 (USD)" value="USD" />
          <el-option label="欧元 (EUR)" value="EUR" />
          <el-option label="日元 (JPY)" value="JPY" />
        </el-select>
      </el-form-item>

      <el-form-item label="开始日期" prop="startDate">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="选择开始日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="结束日期" prop="endDate">
        <el-date-picker
          v-model="form.endDate"
          type="date"
          placeholder="选择结束日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="输入预算描述"
        />
      </el-form-item>

      <el-form-item label="状态" prop="isActive">
        <el-switch
          v-model="form.isActive"
          active-text="活跃"
          inactive-text="非活跃"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          保存
        </el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { BudgetType } from "@/types/fee";

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  name: "",
  type: "" as BudgetType,
  amount: 0,
  currency: "CNY",
  startDate: "",
  endDate: "",
  description: "",
  isActive: true,
});

// 如果有初始数据，填充表单
if (props.initialData) {
  Object.assign(form, props.initialData);
}

const rules: FormRules = {
  name: [{ required: true, message: "请输入预算名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择预算类型", trigger: "change" }],
  amount: [
    { required: true, message: "请输入预算金额", trigger: "blur" },
    { type: "number", min: 0, message: "金额必须大于0", trigger: "blur" },
  ],
  currency: [{ required: true, message: "请选择货币", trigger: "change" }],
  startDate: [{ required: true, message: "请选择开始日期", trigger: "change" }],
  endDate: [{ required: true, message: "请选择结束日期", trigger: "change" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    emit("submit", { ...form });
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
.budget-form {
  padding: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
