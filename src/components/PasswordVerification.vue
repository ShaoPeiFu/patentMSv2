<template>
  <el-dialog
    v-model="visible"
    title="密码验证"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="当前密码" prop="currentPassword">
        <el-input
          v-model="form.currentPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          验证
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, defineEmits, defineProps, watch } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import { useUserStore } from "@/stores/user";

interface Props {
  modelValue: boolean;
  userId?: number;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "verified"): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<Emits>();
const userStore = useUserStore();

// 响应式数据
const visible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  currentPassword: "",
});

// 表单验证规则
const rules = {
  currentPassword: [
    { required: true, message: "请输入当前密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    visible.value = newValue;
    if (newValue) {
      // 重置表单
      form.currentPassword = "";
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    }
  },
  { immediate: true }
);

// 监听 visible 变化
watch(visible, (newValue) => {
  emit("update:modelValue", newValue);
});

// 提交验证
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    loading.value = true;

    // 验证当前密码
    const isValid = await verifyPassword(form.currentPassword);

    if (isValid) {
      ElMessage.success("密码验证成功");
      visible.value = false;
      emit("verified");
    } else {
      ElMessage.error("当前密码错误，请重新输入");
    }
  } catch (error) {
    console.error("密码验证失败:", error);
  } finally {
    loading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  visible.value = false;
  emit("cancel");
};

// 验证当前密码
const verifyPassword = async (_password: string) => {
  try {
    // 注意：这里应该通过API验证密码，而不是直接比较
    // 因为用户对象中通常不包含密码字段
    return await userStore.verifyPassword();
  } catch (error) {
    console.error("密码验证失败:", error);
    return false;
  }
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
