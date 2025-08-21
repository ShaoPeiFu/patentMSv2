<template>
  <div class="user-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="apple-form"
    >
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="formData.username"
          placeholder="请输入用户名"
          :disabled="!!user"
        />
      </el-form-item>

      <el-form-item label="真实姓名" prop="realName">
        <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="formData.email"
          placeholder="请输入邮箱地址"
          type="email"
        />
      </el-form-item>

      <el-form-item label="手机号码" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入手机号码" />
      </el-form-item>

      <el-form-item label="部门" prop="department">
        <el-select
          v-model="formData.department"
          placeholder="请选择部门"
          style="width: 100%"
        >
          <el-option label="技术部" value="tech" />
          <el-option label="法务部" value="legal" />
          <el-option label="管理部" value="admin" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="角色" prop="role">
        <el-select
          v-model="formData.role"
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option label="普通用户" value="user" />
          <el-option label="管理员" value="admin" />
          <el-option label="审核员" value="reviewer" />
        </el-select>
      </el-form-item>

      <el-form-item label="密码" prop="password" v-if="!user">
        <el-input
          v-model="formData.password"
          placeholder="请输入密码"
          type="password"
          show-password
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword" v-if="!user">
        <el-input
          v-model="formData.confirmPassword"
          placeholder="请确认密码"
          type="password"
          show-password
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio label="active">启用</el-radio>
          <el-radio label="inactive">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <div class="form-actions">
          <AppleButton
            variant="primary"
            @click="handleSubmit"
            :loading="loading"
          >
            保存
          </AppleButton>
          <AppleButton variant="secondary" @click="handleCancel">
            取消
          </AppleButton>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import AppleButton from "@/components/ui/AppleButton.vue";
import type { User } from "@/types/user";

// Props
interface Props {
  user?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
});

// Emits
const emit = defineEmits<{
  submit: [userData: Partial<User>];
  cancel: [];
}>();

// 响应式数据
const formRef = ref();
const loading = ref(false);

// 表单数据
const formData = reactive({
  username: "",
  realName: "",
  email: "",
  phone: "",
  department: "",
  role: "user",
  password: "",
  confirmPassword: "",
  status: "active",
});

// 表单验证规则
const formRules = computed(() => ({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 3,
      max: 20,
      message: "用户名长度在 3 到 20 个字符",
      trigger: "blur",
    },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: "用户名只能包含字母、数字和下划线",
      trigger: "blur",
    },
  ],
  realName: [
    { required: true, message: "请输入真实姓名", trigger: "blur" },
    { min: 2, max: 10, message: "姓名长度在 2 到 10 个字符", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
  phone: [
    { required: true, message: "请输入手机号码", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号码",
      trigger: "blur",
    },
  ],
  department: [{ required: true, message: "请选择部门", trigger: "change" }],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
  password: props.user
    ? []
    : [
        { required: true, message: "请输入密码", trigger: "blur" },
        {
          min: 6,
          max: 20,
          message: "密码长度在 6 到 20 个字符",
          trigger: "blur",
        },
        {
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          message: "密码必须包含大小写字母和数字",
          trigger: "blur",
        },
      ],
  confirmPassword: props.user
    ? []
    : [
        { required: true, message: "请确认密码", trigger: "blur" },
        {
          validator: (_: any, value: string, callback: Function) => {
            if (value !== formData.password) {
              callback(new Error("两次输入密码不一致"));
            } else {
              callback();
            }
          },
          trigger: "blur",
        },
      ],
}));

// 初始化表单数据
onMounted(() => {
  if (props.user) {
    Object.assign(formData, {
      username: props.user.username || "",
      realName: props.user.realName || "",
      email: props.user.email || "",
      phone: props.user.phone || "",
      department: props.user.department || "",
      role: formData.role as "user" | "admin" | "reviewer" | undefined,
    });
  }
});

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const userData: Partial<User> = {
      username: formData.username,
      realName: formData.realName,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      role: formData.role as "user" | "admin" | "reviewer" | undefined,
    };

    // 如果是新用户，添加密码字段
    if (!props.user && formData.password) {
      (userData as any).password = formData.password;
    }

    emit("submit", userData);
  } catch (error) {
    console.error("表单验证失败:", error);
    // 不重新抛出错误，让父组件正常处理
    loading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.user-form {
  padding: 0;
}

.apple-form {
  max-width: 600px;
  margin: 0 auto;
}

.apple-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--apple-text-primary);
}

.apple-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.apple-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--apple-accent);
}

.apple-form :deep(.el-select .el-input__wrapper) {
  border-radius: 12px;
}

.apple-form :deep(.el-radio__label) {
  color: var(--apple-text-primary);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .apple-form :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .apple-form :deep(.el-input__inner) {
    color: var(--apple-text-primary);
  }

  .avatar-uploader .avatar-uploader-icon {
    border-color: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.6);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }

  .apple-form {
    padding: 0 16px;
  }
}
</style>
