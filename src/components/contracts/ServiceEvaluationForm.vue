<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <el-form-item label="律师事务所" prop="lawFirmId">
      <el-select
        v-model="form.lawFirmId"
        placeholder="请选择律师事务所"
        style="width: 100%"
      >
        <el-option
          v-for="firm in lawFirms"
          :key="firm.id"
          :label="firm.name"
          :value="firm.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="相关合同" prop="contractId">
      <el-select
        v-model="form.contractId"
        placeholder="请选择相关合同"
        style="width: 100%"
      >
        <el-option
          v-for="contract in contracts"
          :key="contract.id"
          :label="contract.title"
          :value="contract.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="评估日期" prop="evaluationDate">
      <el-date-picker
        v-model="form.evaluationDate"
        type="date"
        placeholder="请选择评估日期"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="评估标准">
      <div class="evaluation-criteria">
        <div class="criteria-item">
          <label>响应性</label>
          <el-rate v-model="form.criteria.responsiveness" :max="5" show-score />
        </div>
        <div class="criteria-item">
          <label>服务质量</label>
          <el-rate v-model="form.criteria.quality" :max="5" show-score />
        </div>
        <div class="criteria-item">
          <label>沟通能力</label>
          <el-rate v-model="form.criteria.communication" :max="5" show-score />
        </div>
        <div class="criteria-item">
          <label>及时性</label>
          <el-rate v-model="form.criteria.timeliness" :max="5" show-score />
        </div>
        <div class="criteria-item">
          <label>成本效益</label>
          <el-rate
            v-model="form.criteria.cost_efficiency"
            :max="5"
            show-score
          />
        </div>
      </div>
    </el-form-item>

    <el-form-item label="总体评分" prop="overallScore">
      <el-rate v-model="form.overallScore" :max="5" show-score disabled />
    </el-form-item>

    <el-form-item label="评价意见" prop="comments">
      <el-input
        v-model="form.comments"
        type="textarea"
        :rows="4"
        placeholder="请输入评价意见"
      />
    </el-form-item>

    <el-form-item label="改进建议" prop="recommendations">
      <el-input
        v-model="form.recommendations"
        type="textarea"
        :rows="4"
        placeholder="请输入改进建议"
      />
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select
        v-model="form.status"
        placeholder="请选择状态"
        style="width: 100%"
      >
        <el-option label="待评估" value="pending" />
        <el-option label="已完成" value="completed" />
        <el-option label="逾期" value="overdue" />
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ServiceEvaluation } from "@/types/contract";
import { useContractStore } from "@/stores/contract";

const props = defineProps<{
  initialData?: ServiceEvaluation | null;
}>();

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const contractStore = useContractStore();
const formRef = ref<FormInstance>();

const form = ref({
  lawFirmId: undefined as number | undefined,
  contractId: undefined as number | undefined,
  evaluatorId: 1, // 默认评估者ID
  evaluationDate: "",
  criteria: {
    responsiveness: 0,
    quality: 0,
    communication: 0,
    timeliness: 0,
    cost_efficiency: 0,
  },
  overallScore: 0,
  comments: "",
  recommendations: "",
  status: "pending" as "pending" | "completed" | "overdue",
});

const rules: FormRules = {
  lawFirmId: [
    { required: true, message: "请选择律师事务所", trigger: "change" },
  ],
  contractId: [
    { required: true, message: "请选择相关合同", trigger: "change" },
  ],
  evaluationDate: [
    { required: true, message: "请选择评估日期", trigger: "change" },
  ],
  comments: [{ required: true, message: "请输入评价意见", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

// 获取律师事务所和合同列表
const lawFirms = computed(() => contractStore.lawFirms);
const contracts = computed(() => contractStore.contracts);

// 计算总体评分
const calculateOverallScore = () => {
  const criteria = form.value.criteria;
  const scores = [
    criteria.responsiveness,
    criteria.quality,
    criteria.communication,
    criteria.timeliness,
    criteria.cost_efficiency,
  ];
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  form.value.overallScore = Math.round(average * 10) / 10; // 保留一位小数
};

// 监听评分变化
watch(
  () => form.value.criteria,
  () => {
    calculateOverallScore();
  },
  { deep: true }
);

// 监听初始数据变化
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      Object.assign(form.value, newData);
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
.evaluation-criteria {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.criteria-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.criteria-item label {
  min-width: 80px;
  font-weight: 500;
  color: #606266;
}
</style>
