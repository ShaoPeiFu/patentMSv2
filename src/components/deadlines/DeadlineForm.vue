<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    class="deadline-form"
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

    <el-form-item label="期限类型" prop="deadlineType">
      <el-select
        v-model="form.deadlineType"
        placeholder="选择期限类型"
        style="width: 100%"
      >
        <el-option label="申请期限" value="application" />
        <el-option label="审查期限" value="examination" />
        <el-option label="年费期限" value="maintenance" />
        <el-option label="续展期限" value="renewal" />
        <el-option label="优先权期限" value="priority" />
        <el-option label="延期期限" value="extension" />
        <el-option label="更正期限" value="correction" />
        <el-option label="异议期限" value="opposition" />
        <el-option label="上诉期限" value="appeal" />
        <el-option label="其他期限" value="other" />
      </el-select>
    </el-form-item>

    <el-form-item label="期限日期" prop="deadlineDate">
      <el-date-picker
        v-model="form.deadlineDate"
        type="date"
        placeholder="选择期限日期"
        style="width: 100%"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
      />
    </el-form-item>

    <el-form-item label="优先级" prop="priority">
      <el-select
        v-model="form.priority"
        placeholder="选择优先级"
        style="width: 100%"
      >
        <el-option label="高优先级" value="high" />
        <el-option label="中优先级" value="medium" />
        <el-option label="低优先级" value="low" />
      </el-select>
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select
        v-model="form.status"
        placeholder="选择状态"
        style="width: 100%"
      >
        <el-option label="待处理" value="pending" />
        <el-option label="已完成" value="completed" />
        <el-option label="已逾期" value="overdue" />
        <el-option label="已取消" value="cancelled" />
        <el-option label="已延期" value="extended" />
      </el-select>
    </el-form-item>

    <el-form-item label="风险等级" prop="riskLevel">
      <el-select
        v-model="form.riskLevel"
        placeholder="选择风险等级"
        style="width: 100%"
      >
        <el-option label="低风险" value="low" />
        <el-option label="中风险" value="medium" />
        <el-option label="高风险" value="high" />
        <el-option label="严重风险" value="critical" />
      </el-select>
    </el-form-item>

    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="输入期限描述"
      />
    </el-form-item>

    <el-form-item label="备注" prop="notes">
      <el-input
        v-model="form.notes"
        type="textarea"
        :rows="2"
        placeholder="输入备注信息"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        提交
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { DeadlineType } from "@/types/deadline";

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
  deadlineType: "" as DeadlineType,
  deadlineDate: "",
  priority: "medium" as "high" | "medium" | "low",
  status: "pending" as
    | "pending"
    | "completed"
    | "overdue"
    | "cancelled"
    | "extended",
  riskLevel: "medium" as "low" | "medium" | "high" | "critical",
  description: "",
  notes: "",
});

// 监听initialData变化，填充表单
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      console.log("填充表单数据:", newData);
      Object.assign(form, newData);
    }
  },
  { immediate: true }
);

const rules: FormRules = {
  patentNumber: [{ required: false, message: "请输入专利号", trigger: "blur" }],
  patentTitle: [
    { required: false, message: "请输入专利标题", trigger: "blur" },
  ],
  deadlineType: [
    { required: true, message: "请选择期限类型", trigger: "change" },
  ],
  deadlineDate: [
    { required: true, message: "请选择期限日期", trigger: "change" },
  ],
  priority: [{ required: true, message: "请选择优先级", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  riskLevel: [{ required: true, message: "请选择风险等级", trigger: "change" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // 生成专利ID
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
.deadline-form {
  padding: 20px;
}
</style>
