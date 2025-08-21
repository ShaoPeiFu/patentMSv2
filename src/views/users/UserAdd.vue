<template>
  <div class="user-add">
    <div class="page-header">
      <h1>添加用户</h1>
      <p>创建新的系统用户账户</p>
    </div>

    <el-card class="form-card">
      <UserForm :user="null" @submit="handleSubmit" @cancel="handleCancel" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import { authAPI } from "@/utils/api";
import UserForm from "./UserForm.vue";
import type { User } from "@/types/user";

const router = useRouter();
const userStore = useUserStore();

const handleSubmit = async (userData: any) => {
  console.log("🚀 UserAdd - handleSubmit 被调用，用户数据:", userData);

  try {
    // 使用管理员创建用户API
    console.log("📡 调用 authAPI.createUser...");
    const response = await authAPI.createUser(userData);
    console.log("📡 API 响应:", response);

    if (response.success) {
      console.log("✅ 用户创建成功，准备跳转...");
      ElMessage.success("用户创建成功");

      // 刷新用户列表
      console.log("🔄 刷新用户列表...");
      await userStore.fetchUsers();

      // 跳转回用户管理页面
      console.log("🚀 跳转到 /dashboard/users...");
      await router.push("/dashboard/users");
      console.log("✅ 跳转完成");
    } else {
      console.log("❌ API 返回失败:", response.error);
      throw new Error(response.error || "创建用户失败");
    }
  } catch (error: any) {
    console.error("❌ 创建用户失败:", error);
    ElMessage.error(
      error.response?.data?.error || error.message || "创建用户失败"
    );
  }
};

const handleCancel = () => {
  router.push("/dashboard/users");
};
</script>

<style scoped>
.user-add {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.form-card {
  max-width: 800px;
  margin: 0 auto;
}
</style>
