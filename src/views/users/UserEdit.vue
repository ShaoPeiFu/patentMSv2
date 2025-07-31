<template>
  <div class="user-edit">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>编辑用户</h1>
      <el-button @click="$router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <!-- 编辑用户表单 -->
    <div class="form-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>用户信息</span>
          </div>
        </template>

        <!-- 权限提示 -->
        <el-alert
          v-if="isAdminEditingOthers"
          title="权限提示"
          description="作为管理员，您只能修改其他用户的部门和角色信息。个人信息（姓名、邮箱、手机、头像）只能由用户本人修改。"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          @submit.prevent="handleSubmit"
          v-loading="loading"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="form.username"
                  placeholder="请输入用户名"
                  clearable
                  :disabled="true"
                />
                <div class="field-tip">用户名不可修改</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="真实姓名" prop="realName">
                <el-input
                  v-model="form.realName"
                  placeholder="请输入真实姓名"
                  clearable
                  :disabled="isFieldDisabled.realName"
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
                  :disabled="isFieldDisabled.email"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input
                  v-model="form.phone"
                  placeholder="请输入手机号码"
                  clearable
                  :disabled="isFieldDisabled.phone"
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
                  :disabled="isFieldDisabled.department"
                >
                  <el-option label="技术部" value="tech" />
                  <el-option label="法务部" value="legal" />
                  <el-option label="管理部" value="admin" />
                  <el-option label="其他" value="other" />
                </el-select>
                <div v-if="isFieldDisabled.department" class="field-tip">
                  只有管理员可以修改审核员和普通用户的部门
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色" prop="role">
                <el-select
                  v-model="form.role"
                  placeholder="请选择角色"
                  style="width: 100%"
                  :disabled="isFieldDisabled.role"
                >
                  <el-option label="普通用户" value="user" />
                  <el-option label="管理员" value="admin" />
                  <el-option label="审核员" value="reviewer" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">个人资料</el-divider>

          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="loading">
              <el-icon><Check /></el-icon>
              保存资料
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
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";

import {
  ArrowLeft,
  Plus,
  Check,
  Refresh,
  Close,
} from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type { User } from "@/stores/user";
import {
  canEditUser,
  canChangeUserPassword,
  hasPermission,
  PERMISSION_MESSAGES,
} from "@/utils/permissions";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const formRef = ref<FormInstance>();

// 权限控制
const currentUserId = computed(() => userStore.currentUser?.id || 0);
const currentUserRole = computed(() => userStore.currentUser?.role || "user");
const isEditingSelf = computed(() => {
  const userId = parseInt(route.params.id as string);
  return userId === currentUserId.value;
});

// 检查是否可以编辑用户
const canEditThisUser = computed(() => {
  const userId = parseInt(route.params.id as string);
  return canEditUser(currentUserRole.value, currentUserId.value, userId);
});

// 是否为管理员编辑其他用户（只能改部门和角色）
const isAdminEditingOthers = computed(() => {
  return currentUserRole.value === "admin" && !isEditingSelf.value;
});

// 字段禁用控制
const isFieldDisabled = computed(() => {
  const userId = parseInt(route.params.id as string);
  const targetUser = userStore.getAllUsers().find((u) => u.id === userId);
  const targetUserRole = targetUser?.role || "user";

  // 检查是否可以编辑部门：只有管理员可以编辑审核员和普通用户的部门
  const canEditDepartment =
    currentUserRole.value === "admin" ||
    (targetUserRole !== "reviewer" && targetUserRole !== "user");

  return {
    username: true, // 用户名始终不可编辑
    realName: isAdminEditingOthers.value,
    email: isAdminEditingOthers.value,
    phone: isAdminEditingOthers.value,
    department: !canEditDepartment, // 只有管理员可以编辑审核员和普通用户的部门
    role: !hasPermission(currentUserRole.value, "canEditUserDepartmentAndRole"), // 只有管理员可以编辑角色
  };
});
const originalUser = ref<User | null>(null);

// 表单数据
const form = reactive({
  username: "",
  realName: "",
  email: "",
  phone: "",
  department: "",
  role: "",
});

// 表单验证规则
const rules: FormRules = {
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
};

// 权限检查和表单提交逻辑
const handleSubmit = async () => {
  // 权限检查
  if (!canEditThisUser.value) {
    ElMessage.error(PERMISSION_MESSAGES.NO_EDIT_USER);
    return;
  }

  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    // 提交用户更新
    await submitUserUpdate();
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

// 实际提交用户更新
const submitUserUpdate = async () => {
  loading.value = true;

  try {
    // 准备更新数据
    const updateData: Partial<User> = {};

    // 根据权限控制允许更新的字段
    if (isAdminEditingOthers.value) {
      // 管理员编辑其他用户：只能改部门和角色
      updateData.department = form.department;
      updateData.role = form.role as "user" | "admin" | "reviewer";
    } else {
      // 用户编辑自己：可以改所有个人信息
      updateData.realName = form.realName;
      updateData.email = form.email;
      updateData.phone = form.phone;
      updateData.department = form.department;

      // 角色只有管理员可以修改
      if (
        hasPermission(currentUserRole.value, "canEditUserDepartmentAndRole")
      ) {
        updateData.role = form.role as "user" | "admin" | "reviewer";
      }

      // 如果设置了新密码，则更新密码（只有编辑自己时才能修改密码）
      if (form.newPassword && isEditingSelf.value) {
        // 使用changePassword方法，它会验证原密码
        await userStore.changePassword(form.oldPassword, form.newPassword);
        ElMessage.success("密码修改成功");
      }
    }

    // 调用store的更新用户方法
    await userStore.updateUser(parseInt(route.params.id as string), updateData);

    ElMessage.success("用户信息更新成功");

    // 更新本地表单数据以反映最新状态
    fetchUserDetail();

    // 返回用户详情页面
    router.push(`/dashboard/users/${route.params.id}`);
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error("更新用户信息失败，请检查表单信息");
    }
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  if (originalUser.value) {
    // 重置为原始数据
    Object.assign(form, {
      username: originalUser.value.username,
      realName: originalUser.value.realName,
      email: originalUser.value.email,
      phone: originalUser.value.phone,
      department: originalUser.value.department,
      role: originalUser.value.role,
    });
  }
};

// 获取用户信息
const fetchUserDetail = async () => {
  const userId = parseInt(route.params.id as string);
  if (isNaN(userId)) {
    ElMessage.error("用户ID无效");
    router.push("/dashboard/users");
    return;
  }

  // 权限检查
  if (!canEditThisUser.value) {
    ElMessage.error(PERMISSION_MESSAGES.NO_EDIT_USER);
    router.push("/dashboard/users");
    return;
  }

  loading.value = true;
  try {
    // 从用户store获取用户信息
    const allUsers = userStore.getAllUsers();
    const foundUser = allUsers.find((u) => u.id === userId);

    if (!foundUser) {
      ElMessage.error("用户不存在");
      router.push("/dashboard/users");
      return;
    }

    originalUser.value = foundUser;

    // 填充表单数据
    Object.assign(form, {
      username: foundUser.username,
      realName: foundUser.realName,
      email: foundUser.email,
      phone: foundUser.phone,
      department: foundUser.department,
      role: foundUser.role,
    });
  } catch (error) {
    ElMessage.error("获取用户信息失败");
    router.push("/dashboard/users");
  } finally {
    loading.value = false;
  }
};

// 生命周期
onMounted(() => {
  fetchUserDetail();
});
</script>

<style scoped>
.user-edit {
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

.field-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-col {
    margin-bottom: 10px;
  }
}
</style>
