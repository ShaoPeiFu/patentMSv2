<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <el-form-item label="律师事务所名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入律师事务所名称" />
    </el-form-item>

    <el-form-item label="联系人" prop="contactPerson">
      <el-input v-model="form.contactPerson" placeholder="请输入联系人姓名" />
    </el-form-item>

    <el-form-item label="联系电话" prop="phone">
      <el-input v-model="form.phone" placeholder="请输入联系电话" />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" placeholder="请输入邮箱地址" />
    </el-form-item>

    <el-form-item label="地址" prop="address">
      <el-input v-model="form.address" placeholder="请输入详细地址" />
    </el-form-item>

    <el-form-item label="专业领域" prop="specialties">
      <el-select
        v-model="form.specialties"
        multiple
        placeholder="请选择专业领域"
        style="width: 100%"
      >
        <el-option label="专利" value="专利" />
        <el-option label="商标" value="商标" />
        <el-option label="版权" value="版权" />
        <el-option label="技术转让" value="技术转让" />
        <el-option label="商业秘密" value="商业秘密" />
        <el-option label="知识产权诉讼" value="知识产权诉讼" />
      </el-select>
    </el-form-item>

    <el-form-item label="服务级别" prop="serviceLevel">
      <el-select
        v-model="form.serviceLevel"
        placeholder="请选择服务级别"
        style="width: 100%"
      >
        <el-option label="高级" value="premium" />
        <el-option label="标准" value="standard" />
        <el-option label="基础" value="basic" />
      </el-select>
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select
        v-model="form.status"
        placeholder="请选择状态"
        style="width: 100%"
      >
        <el-option label="活跃" value="active" />
        <el-option label="非活跃" value="inactive" />
        <el-option label="暂停" value="suspended" />
      </el-select>
    </el-form-item>

    <el-form-item label="评分" prop="rating">
      <el-rate v-model="form.rating" :max="5" show-score />
    </el-form-item>

    <el-form-item label="合同数量" prop="contractCount">
      <el-input-number
        v-model="form.contractCount"
        :min="0"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="总收入" prop="totalRevenue">
      <el-input-number
        v-model="form.totalRevenue"
        :min="0"
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
import { ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { LawFirm } from "@/types/contract";

const props = defineProps<{
  initialData?: LawFirm | null;
}>();

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const formRef = ref<FormInstance>();

const form = ref({
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  specialties: [] as string[],
  serviceLevel: "standard" as "premium" | "standard" | "basic",
  status: "active" as "active" | "inactive" | "suspended",
  rating: 0,
  contractCount: 0,
  totalRevenue: 0,
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入律师事务所名称", trigger: "blur" }],
  contactPerson: [
    { required: true, message: "请输入联系人姓名", trigger: "blur" },
  ],
  phone: [{ required: true, message: "请输入联系电话", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  address: [{ required: true, message: "请输入详细地址", trigger: "blur" }],
  specialties: [
    { required: true, message: "请选择专业领域", trigger: "change" },
  ],
  serviceLevel: [
    { required: true, message: "请选择服务级别", trigger: "change" },
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

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
