<template>
  <div class="profile-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>个人资料</h2>
        </div>
      </template>

      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="profileForm.realName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="profileForm.phone" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="profileForm.department" style="width: 100%">
                <el-option label="技术部" value="tech" />
                <el-option label="法务部" value="legal" />
                <el-option label="管理部" value="admin" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-input v-model="profileForm.role" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="注册时间">
              <el-input :value="formatDate(profileForm.createdAt)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最后登录">
              <el-input :value="formatDate(profileForm.lastLoginAt)" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleUpdate" :loading="loading">
            保存修改
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码卡片 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <h3>修改密码</h3>
        </div>
      </template>

      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="120px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleChangePassword"
            :loading="passwordLoading"
          >
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const passwordLoading = ref(false);
const profileFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();

const profileForm = reactive({
  username: "",
  email: "",
  realName: "",
  phone: "",
  department: "",
  role: "",
  createdAt: "",
  lastLoginAt: "",
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 表单验证规则
const profileRules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  realName: [
    { required: true, message: "请输入真实姓名", trigger: "blur" },
    { min: 2, max: 10, message: "姓名长度在 2 到 10 个字符", trigger: "blur" },
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
};

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: "密码必须包含大小写字母和数字",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (_, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return "未设置";
  return new Date(dateString).toLocaleString("zh-CN");
};

// 加载用户信息
const loadUserInfo = () => {
  if (userStore.currentUser) {
    Object.assign(profileForm, userStore.currentUser);
  }
};

// 更新个人资料
const handleUpdate = async () => {
  if (!profileFormRef.value) return;

  try {
    await profileFormRef.value.validate();
    loading.value = true;

    // 使用当前登录用户的ID，而不是硬编码的ID
    const currentUserId = userStore.currentUser?.id;
    if (!currentUserId) {
      ElMessage.error("用户未登录或用户信息不完整");
      return;
    }

    await userStore.updateProfile(currentUserId, {
      email: profileForm.email,
      realName: profileForm.realName,
      phone: profileForm.phone,
      department: profileForm.department,
    });

    ElMessage.success("个人资料更新成功");
  } catch (error) {
    ElMessage.error("更新失败");
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  if (profileFormRef.value) {
    profileFormRef.value.resetFields();
  }
  loadUserInfo();
};

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;

  try {
    await passwordFormRef.value.validate();
    passwordLoading.value = true;

    // 使用当前登录用户的ID，而不是硬编码的ID
    const currentUserId = userStore.currentUser?.id;
    if (!currentUserId) {
      ElMessage.error("用户未登录或用户信息不完整");
      return;
    }

    await userStore.changePassword(
      currentUserId,
      passwordForm.oldPassword,
      passwordForm.newPassword
    );

    ElMessage.success("密码修改成功");

    // 清空密码表单
    Object.assign(passwordForm, {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    if (passwordFormRef.value) {
      passwordFormRef.value.resetFields();
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "密码修改失败");
  } finally {
    passwordLoading.value = false;
  }
};

// 组件挂载时加载用户信息
onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2,
.card-header h3 {
  margin: 0;
  color: #2c3e50;
}
</style>
