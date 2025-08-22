<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="合同标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入合同标题" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="合同编号" prop="contractNumber">
          <el-input
            v-model="form.contractNumber"
            placeholder="请输入合同编号"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="合同类型" prop="type">
          <el-select
            v-model="form.type"
            placeholder="请选择合同类型"
            style="width: 100%"
          >
            <el-option label="专利申请" value="patent_application" />
            <el-option label="专利审查" value="patent_prosecution" />
            <el-option label="专利诉讼" value="patent_litigation" />
            <el-option label="商标注册" value="trademark" />
            <el-option label="版权保护" value="copyright" />
            <el-option label="法律咨询" value="legal_consultation" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="合同状态" prop="status">
          <el-select
            v-model="form.status"
            placeholder="请选择合同状态"
            style="width: 100%"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="待签署" value="pending" />
            <el-option label="已签署" value="signed" />
            <el-option label="执行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已终止" value="terminated" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="合同金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            placeholder="请输入合同金额"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="货币类型" prop="currency">
          <el-select
            v-model="form.currency"
            placeholder="选择货币类型"
            style="width: 100%"
          >
            <el-option label="人民币 (CNY)" value="CNY" />
            <el-option label="美元 (USD)" value="USD" />
            <el-option label="欧元 (EUR)" value="EUR" />
            <el-option label="日元 (JPY)" value="JPY" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="合同描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        placeholder="请输入合同描述"
      />
    </el-form-item>

    <el-form-item label="合同条款" prop="terms">
      <el-input
        v-model="form.terms"
        type="textarea"
        :rows="6"
        placeholder="请输入合同条款内容"
      />
    </el-form-item>

    <el-form-item label="合同方" prop="parties">
      <el-input
        v-model="partiesInput"
        placeholder="请输入合同方，用逗号分隔"
        @input="updateParties"
      />
      <div class="parties-preview">
        <el-tag
          v-for="party in form.parties"
          :key="party"
          size="small"
          style="margin: 4px"
        >
          {{ party }}
        </el-tag>
      </div>
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
import type { Contract } from "@/types/contract";

const props = defineProps<{
  initialData?: Contract | null;
}>();

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const formRef = ref<FormInstance>();

const form = ref({
  title: "",
  contractNumber: "",
  type: "patent_application" as any,
  status: "draft" as any,
  startDate: "",
  endDate: "",
  amount: 0,
  currency: "CNY",
  description: "",
  terms: "",
  parties: [] as string[],
});

const partiesInput = ref("");

const rules: FormRules = {
  title: [{ required: true, message: "请输入合同标题", trigger: "blur" }],
  contractNumber: [
    { required: true, message: "请输入合同编号", trigger: "blur" },
  ],
  type: [{ required: true, message: "请选择合同类型", trigger: "change" }],
  status: [{ required: true, message: "请选择合同状态", trigger: "change" }],
  description: [{ required: true, message: "请输入合同描述", trigger: "blur" }],
  terms: [{ required: true, message: "请输入合同条款", trigger: "blur" }],
  amount: [{ required: true, message: "请输入合同金额", trigger: "blur" }],
  currency: [{ required: true, message: "请选择货币类型", trigger: "change" }],
};

// 更新合同方列表
const updateParties = () => {
  if (partiesInput.value && partiesInput.value.trim()) {
    const parties = partiesInput.value
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    form.value.parties = parties;
  } else {
    form.value.parties = [];
  }
};

// 监听初始数据变化
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      console.log("ContractForm: 接收到初始数据:", newData);

      Object.assign(form.value, {
        title: newData.title || "",
        contractNumber: newData.contractNumber || "",
        type: newData.type || "patent_application",
        status: newData.status || "draft",
        startDate: newData.startDate
          ? new Date(newData.startDate).toISOString().split("T")[0]
          : "",
        endDate: newData.endDate
          ? new Date(newData.endDate).toISOString().split("T")[0]
          : "",
        amount: newData.amount || 0,
        currency: newData.currency || "CNY",
        description: newData.description || "",
        terms: newData.terms || "",
        parties: Array.isArray(newData.parties)
          ? newData.parties
          : typeof newData.parties === "string"
          ? JSON.parse(newData.parties || "[]")
          : [],
      });

      // 更新合同方输入框
      if (form.value.parties.length > 0) {
        partiesInput.value = form.value.parties.join(", ");
      }
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 准备提交数据
    const submitData = {
      ...form.value,
      parties: form.value.parties,
      startDate: form.value.startDate
        ? new Date(form.value.startDate).toISOString()
        : null,
      endDate: form.value.endDate
        ? new Date(form.value.endDate).toISOString()
        : null,
    };

    emit("submit", submitData);
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.parties-preview {
  margin-top: 8px;
  min-height: 32px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
}
</style>
