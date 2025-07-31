<template>
  <div class="test-auth">
    <el-card>
      <template #header>
        <h2>用户认证测试页面</h2>
      </template>

      <div class="test-section">
        <h3>当前用户状态</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="登录状态">
            <el-tag :type="userStore.isLoggedIn ? 'success' : 'danger'">
              {{ userStore.isLoggedIn ? "已登录" : "未登录" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前用户">
            {{ userStore.currentUser?.realName || "无" }}
          </el-descriptions-item>
          <el-descriptions-item label="用户名">
            {{ userStore.currentUser?.username || "无" }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="getRoleTagType(userStore.currentUser?.role)">
              {{ getRoleText(userStore.currentUser?.role) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="test-section">
        <h3>注册测试</h3>
        <el-form :model="testRegisterForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input
                  v-model="testRegisterForm.username"
                  placeholder="测试用户名"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input
                  v-model="testRegisterForm.email"
                  placeholder="测试邮箱"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="密码">
                <el-input
                  v-model="testRegisterForm.password"
                  type="password"
                  placeholder="测试密码"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="真实姓名">
                <el-input
                  v-model="testRegisterForm.realName"
                  placeholder="测试姓名"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="primary" @click="testRegister">测试注册</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="test-section">
        <h3>登录测试</h3>
        <el-form :model="testLoginForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input
                  v-model="testLoginForm.username"
                  placeholder="用户名"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码">
                <el-input
                  v-model="testLoginForm.password"
                  type="password"
                  placeholder="密码"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item>
            <el-button type="success" @click="testLogin">测试登录</el-button>
            <el-button @click="testLogout">测试登出</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="test-section">
        <h3>用户列表</h3>
        <el-table :data="userStore.getAllUsers()" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="realName" label="真实姓名" width="120" />
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.role)">{{
                getRoleText(row.role)
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="注册时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="test-section">
        <h3>操作</h3>
        <el-button @click="$router.push('/register')">去注册页面</el-button>
        <el-button @click="$router.push('/login')">去登录页面</el-button>
        <el-button @click="$router.push('/dashboard')">去控制台</el-button>
        <el-button @click="clearAllData">清空所有数据</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import { getRoleTagType } from "@/utils/tagTypes";

const router = useRouter();
const userStore = useUserStore();

const testRegisterForm = reactive({
  username: "testuser",
  email: "test@example.com",
  password: "Test123456",
  realName: "测试用户",
});

const testLoginForm = reactive({
  username: "admin",
  password: "123456",
});

const testRegister = async () => {
  try {
    const form = {
      ...testRegisterForm,
      confirmPassword: testRegisterForm.password,
      department: "tech",
      role: "user",
      agreeTerms: true,
    };

    await userStore.register(form);
    ElMessage.success("注册成功！");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "注册失败");
  }
};

const testLogin = async () => {
  try {
    await userStore.login(testLoginForm.username, testLoginForm.password);
    ElMessage.success("登录成功！");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  }
};

const testLogout = () => {
  userStore.logout();
  ElMessage.success("登出成功！");
};

const clearAllData = () => {
  localStorage.clear();
  location.reload();
};

// 使用统一的getRoleTagType函数

const getRoleText = (role?: string) => {
  const texts: Record<string, string> = {
    user: "普通用户",
    admin: "管理员",
    reviewer: "审核员",
  };
  return texts[role || ""] || role || "未知";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "未设置";
  return new Date(dateString).toLocaleString("zh-CN");
};
</script>

<style scoped>
.test-auth {
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
}

.test-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 2px solid #409eff;
  padding-bottom: 5px;
}
</style>
