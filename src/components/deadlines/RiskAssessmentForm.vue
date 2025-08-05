<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    class="risk-assessment-form"
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

    <el-form-item label="风险评分" prop="riskScore">
      <el-slider
        v-model="form.riskScore"
        :min="0"
        :max="100"
        :step="5"
        show-input
        input-size="small"
      />
    </el-form-item>

    <el-form-item label="风险因素" prop="riskFactors">
      <el-checkbox-group v-model="form.riskFactors">
        <el-checkbox label="已逾期" />
        <el-checkbox label="即将到期" />
        <el-checkbox label="高优先级" />
        <el-checkbox label="年费期限" />
        <el-checkbox label="优先权期限" />
        <el-checkbox label="审查期限" />
      </el-checkbox-group>
    </el-form-item>

    <el-form-item label="缓解措施" prop="mitigationActions">
      <el-checkbox-group v-model="form.mitigationActions">
        <el-checkbox label="立即处理逾期事项" />
        <el-checkbox label="申请延期或补救措施" />
        <el-checkbox label="优先处理此期限" />
        <el-checkbox label="设置紧急提醒" />
        <el-checkbox label="分配专人负责" />
        <el-checkbox label="定期跟进进度" />
        <el-checkbox label="确认缴费金额" />
        <el-checkbox label="准备缴费材料" />
      </el-checkbox-group>
    </el-form-item>

    <el-form-item label="评估备注" prop="notes">
      <el-input
        v-model="form.notes"
        type="textarea"
        :rows="3"
        placeholder="输入评估备注"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        提交评估
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

const form = reactive({
  patentId: 0,
  patentNumber: "",
  patentTitle: "",
  riskLevel: "medium" as "low" | "medium" | "high" | "critical",
  riskScore: 50,
  riskFactors: [] as string[],
  mitigationActions: [] as string[],
  notes: "",
});

const rules: FormRules = {
  patentNumber: [{ required: true, message: "请输入专利号", trigger: "blur" }],
  patentTitle: [{ required: true, message: "请输入专利标题", trigger: "blur" }],
  riskLevel: [{ required: true, message: "请选择风险等级", trigger: "change" }],
  riskScore: [
    { required: true, message: "请输入风险评分", trigger: "blur" },
    {
      type: "number",
      min: 0,
      max: 100,
      message: "风险评分必须在0-100之间",
      trigger: "blur",
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // 生成专利ID
    form.patentId = Date.now();

    const assessmentData = {
      ...form,
      assessmentDate: new Date().toISOString(),
      nextAssessmentDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      assessedBy: "系统用户",
    };

    emit("submit", assessmentData);
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
.risk-assessment-form {
  padding: 20px;
}
</style>
