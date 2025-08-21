<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <el-form-item label="协议描述" prop="description">
      <el-input v-model="form.description" placeholder="请输入费用协议描述" />
    </el-form-item>

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

    <el-form-item label="合同" prop="contractId">
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

    <el-form-item label="费用类型" prop="feeType">
      <el-select
        v-model="form.feeType"
        placeholder="请选择费用类型"
        style="width: 100%"
        clearable
      >
        <el-option label="按小时计费" value="hourly" />
        <el-option label="固定费用" value="fixed" />
        <el-option label="风险代理" value="contingency" />
        <el-option label="混合模式" value="hybrid" />
      </el-select>
    </el-form-item>

    <el-form-item label="金额" prop="amount">
      <el-input-number v-model="form.amount" :min="0" style="width: 100%" />
    </el-form-item>

    <el-form-item label="货币" prop="currency">
      <el-select
        v-model="form.currency"
        placeholder="请选择货币"
        style="width: 100%"
      >
        <el-option label="人民币" value="CNY" />
        <el-option label="美元" value="USD" />
        <el-option label="欧元" value="EUR" />
        <el-option label="日元" value="JPY" />
      </el-select>
    </el-form-item>

    <el-form-item label="付款条件" prop="paymentTerms">
      <el-input
        v-model="form.paymentTerms"
        type="textarea"
        :rows="3"
        placeholder="请输入付款条件"
      />
    </el-form-item>

    <el-form-item label="开始日期" prop="startDate">
      <el-date-picker
        v-model="form.startDate"
        type="date"
        placeholder="请选择开始日期"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="结束日期" prop="endDate">
      <el-date-picker
        v-model="form.endDate"
        type="date"
        placeholder="请选择结束日期"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="已付金额" prop="paidAmount">
      <el-input-number v-model="form.paidAmount" :min="0" style="width: 100%" />
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select
        v-model="form.status"
        placeholder="请选择状态"
        style="width: 100%"
      >
        <el-option label="待付款" value="pending" />
        <el-option label="已付款" value="paid" />
        <el-option label="逾期" value="overdue" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
    </el-form-item>

    <el-form-item label="上次付款日期" prop="lastPaymentDate">
      <el-date-picker
        v-model="form.lastPaymentDate"
        type="date"
        placeholder="请选择上次付款日期"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="下次付款日期" prop="nextPaymentDate">
      <el-date-picker
        v-model="form.nextPaymentDate"
        type="date"
        placeholder="请选择下次付款日期"
        style="width: 100%"
      />
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
import type { FeeAgreement } from "@/types/contract";
import { useContractStore } from "@/stores/contract";

const props = defineProps<{
  initialData?: FeeAgreement | null;
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
  feeType: "fixed" as "hourly" | "fixed" | "contingency" | "hybrid",
  amount: 0,
  currency: "CNY",
  paymentTerms: "",
  startDate: "",
  endDate: "",
  status: "pending" as "pending" | "paid" | "overdue" | "cancelled",
  paidAmount: 0,
  lastPaymentDate: "",
  nextPaymentDate: "",
  description: "",
});

// 确保费用类型有默认值
if (!form.value.feeType) {
  form.value.feeType = "fixed";
}

const rules: FormRules = {
  description: [{ required: true, message: "请输入协议描述", trigger: "blur" }],
  lawFirmId: [
    { required: true, message: "请选择律师事务所", trigger: "change" },
  ],
  contractId: [
    { required: true, message: "请选择相关合同", trigger: "change" },
  ],
  feeType: [{ required: true, message: "请选择费用类型", trigger: "change" }],
  amount: [{ required: true, message: "请输入金额", trigger: "blur" }],
  currency: [{ required: true, message: "请选择货币", trigger: "change" }],
  paymentTerms: [
    { required: true, message: "请输入付款条件", trigger: "blur" },
  ],
  startDate: [{ required: true, message: "请选择开始日期", trigger: "change" }],
  endDate: [{ required: true, message: "请选择结束日期", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

// 获取律师事务所和合同列表
const lawFirms = computed(() => contractStore.lawFirms);
const contracts = computed(() => contractStore.contracts);

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
