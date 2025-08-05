<template>
  <div class="fee-form">
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

      <el-form-item label="金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0"
          :precision="2"
          :step="100"
          style="width: 100%"
          placeholder="输入金额"
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

      <el-form-item label="到期日期" prop="dueDate">
        <el-date-picker
          v-model="form.dueDate"
          type="date"
          placeholder="选择到期日期"
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
          <el-option label="待缴费" value="pending" />
          <el-option label="已缴费" value="paid" />
          <el-option label="逾期" value="overdue" />
          <el-option label="减免" value="waived" />
          <el-option label="已退款" value="refunded" />
        </el-select>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="输入费用描述"
        />
      </el-form-item>

      <el-form-item label="收据号" prop="receiptNumber">
        <el-input
          v-model="form.receiptNumber"
          placeholder="输入收据号"
          clearable
        />
      </el-form-item>

      <el-form-item label="支付方式" prop="paymentMethod">
        <el-select
          v-model="form.paymentMethod"
          placeholder="选择支付方式"
          style="width: 100%"
        >
          <el-option label="银行转账" value="bank_transfer" />
          <el-option label="在线支付" value="online_payment" />
          <el-option label="现金" value="cash" />
          <el-option label="支票" value="check" />
          <el-option label="其他" value="other" />
        </el-select>
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
import type { FeeType, FeeStatus } from "@/types/fee";

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
  amount: 0,
  currency: "CNY",
  dueDate: "",
  status: "pending" as FeeStatus,
  description: "",
  receiptNumber: "",
  paymentMethod: "",
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
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0, message: "金额必须大于0", trigger: "blur" },
  ],
  currency: [{ required: true, message: "请选择货币", trigger: "change" }],
  dueDate: [{ required: true, message: "请选择到期日期", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }],
};

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
.fee-form {
  padding: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
