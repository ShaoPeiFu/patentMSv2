<template>
  <div class="user-add">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>添加用户</h1>
      <el-button @click="$router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <!-- 添加用户表单 -->
    <div class="form-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>用户信息</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          @submit.prevent="handleSubmit"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="form.username"
                  placeholder="请输入用户名"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="真实姓名" prop="realName">
                <el-input
                  v-model="form.realName"
                  placeholder="请输入真实姓名"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input
                  v-model="form.email"
                  placeholder="请输入邮箱地址"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input
                  v-model="form.phone"
                  placeholder="请输入手机号码"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="部门" prop="department">
                <el-select
                  v-model="form.department"
                  placeholder="请选择部门"
                  style="width: 100%"
                >
                  <el-option label="技术部" value="tech" />
                  <el-option label="法务部" value="legal" />
                  <el-option label="管理部" value="admin" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色" prop="role">
                <el-select
                  v-model="form.role"
                  placeholder="请选择角色"
                  style="width: 100%"
                >
                  <el-option label="普通用户" value="user" />
                  <el-option label="管理员" value="admin" />
                  <el-option label="审核员" value="reviewer" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  show-password
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  show-password
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading">
              <el-icon><Check /></el-icon>
              添加用户
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            <el-button @click="$router.go(-1)">
              <el-icon><Close /></el-icon>
              取消
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import { hasPermission } from "@/utils/permissions";

import { ArrowLeft, Check, Refresh, Close } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";

const router = useRouter();
const userStore = useUserStore();

// 权限检查
const checkPermission = () => {
  const currentUser = userStore.currentUser;
  if (!currentUser) {
    ElMessage.error("用户信息获取失败");
    router.push("/login");
    return false;
  }

  if (!hasPermission(currentUser.role, "canAddUsers")) {
    ElMessage.error("您没有添加用户的权限");
    router.push("/dashboard/users");
    return false;
  }

  return true;
};

// 响应式数据
const loading = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const form = reactive({
  username: "",
  realName: "",
  email: "",
  phone: "",
  department: "",
  role: "",
  password: "",
  confirmPassword: "",
});

// 表单验证规则
const rules: FormRules = {
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
    { min: 2, max: 20, message: "姓名长度在 2 到 20 个字符", trigger: "blur" },
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
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (value !== form.password) {
          callback(new Error("两次输入密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 方法
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    loading.value = true;

    // 调用store的添加用户方法
    await userStore.addUser({
      username: form.username,
      realName: form.realName,
      email: form.email,
      phone: form.phone,
      department: form.department,
      role: form.role as "user" | "admin" | "reviewer",
      password: form.password,
    });

    ElMessage.success("用户添加成功");

    // 返回用户列表页面
    router.push("/dashboard/users");
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error("添加用户失败，请检查表单信息");
    }
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 生命周期
onMounted(() => {
  checkPermission();
});
</script>

<style scoped>
.user-add {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.form-section {
  max-width: 800px;
}

.card-header {
  font-weight: 600;
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-col {
    margin-bottom: 10px;
  }
}
</style>
