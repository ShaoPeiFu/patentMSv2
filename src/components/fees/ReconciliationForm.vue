<template>
  <div class="reconciliation-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="专利号" prop="patentNumber">
        <el-input
          v-model="form.patentNumber"
          placeholder="输入专利号"
          clearable
        />
      </el-form-item>

      <el-form-item label="专利标题" prop="patentTitle">
        <el-input
          v-model="form.patentTitle"
          placeholder="输入专利标题"
          clearable
        />
      </el-form-item>

      <el-form-item label="费用类型" prop="feeType">
        <el-select
          v-model="form.feeType"
          placeholder="选择费用类型"
          style="width: 100%"
        >
          <el-option label="申请费" value="application" />
          <el-option label="审查费" value="examination" />
          <el-option label="年费" value="maintenance" />
          <el-option label="续展费" value="renewal" />
          <el-option label="优先权费" value="priority" />
          <el-option label="延期费" value="extension" />
          <el-option label="更正费" value="correction" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="预期金额" prop="expectedAmount">
        <el-input-number
          v-model="form.expectedAmount"
          :min="0"
          :precision="2"
          :step="100"
          style="width: 100%"
          placeholder="输入预期金额"
        />
      </el-form-item>

      <el-form-item label="实际金额" prop="actualAmount">
        <el-input-number
          v-model="form.actualAmount"
          :min="0"
          :precision="2"
          :step="100"
          style="width: 100%"
          placeholder="输入实际金额"
        />
      </el-form-item>

      <el-form-item label="差异" prop="difference">
        <el-input-number
          v-model="form.difference"
          :precision="2"
          :step="100"
          style="width: 100%"
          placeholder="自动计算差异"
          :disabled="true"
        />
      </el-form-item>

      <el-form-item label="对账日期" prop="reconciliationDate">
        <el-date-picker
          v-model="form.reconciliationDate"
          type="date"
          placeholder="选择对账日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="form.status"
          placeholder="选择状态"
          style="width: 100%"
        >
          <el-option label="已匹配" value="matched" />
          <el-option label="不匹配" value="unmatched" />
          <el-option label="待处理" value="pending" />
        </el-select>
      </el-form-item>

      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="输入备注信息"
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
import { ref, reactive, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { FeeType } from "@/types/fee";

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
  patentId: 0,
  patentNumber: "",
  patentTitle: "",
  feeType: "" as FeeType,
  expectedAmount: 0,
  actualAmount: 0,
  difference: 0,
  reconciliationDate: "",
  status: "pending" as "matched" | "unmatched" | "pending",
  notes: "",
});

// 如果有初始数据，填充表单
if (props.initialData) {
  Object.assign(form, props.initialData);
}

const rules: FormRules = {
  patentNumber: [{ required: true, message: "请输入专利号", trigger: "blur" }],
  patentTitle: [{ required: true, message: "请输入专利标题", trigger: "blur" }],
  feeType: [{ required: true, message: "请选择费用类型", trigger: "change" }],
  expectedAmount: [
    { required: true, message: "请输入预期金额", trigger: "blur" },
    { type: "number", min: 0, message: "金额必须大于等于0", trigger: "blur" },
  ],
  actualAmount: [
    { required: true, message: "请输入实际金额", trigger: "blur" },
    { type: "number", min: 0, message: "金额必须大于等于0", trigger: "blur" },
  ],
  reconciliationDate: [
    { required: true, message: "请选择对账日期", trigger: "change" },
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

// 监听金额变化，自动计算差异
watch(
  () => [form.expectedAmount, form.actualAmount],
  ([expected, actual]) => {
    form.difference = actual - expected;
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // 生成专利ID（实际应用中应该从专利列表中选择）
    form.patentId = Date.now();

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
.reconciliation-form {
  padding: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
