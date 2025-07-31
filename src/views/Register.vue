<template>
  <div class="register-container">
    <!-- 背景动画 -->
    <div class="background-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
      <div class="gradient-overlay"></div>
    </div>

    <!-- 注册卡片 -->
    <div class="register-card">
      <div class="register-header">
        <div class="logo-container">
          <div class="logo-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="logo-text">
            <h1>加入我们</h1>
            <p>专利管理系统</p>
          </div>
        </div>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            size="large"
            prefix-icon="User"
            class="modern-input"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="邮箱"
            size="large"
            prefix-icon="Message"
            class="modern-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
            class="modern-input"
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            prefix-icon="Lock"
            show-password
            class="modern-input"
          />
        </el-form-item>

        <el-form-item prop="realName">
          <el-input
            v-model="registerForm.realName"
            placeholder="真实姓名"
            size="large"
            prefix-icon="User"
            class="modern-input"
          />
        </el-form-item>

        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="手机号码"
            size="large"
            prefix-icon="Phone"
            class="modern-input"
          />
        </el-form-item>

        <el-form-item prop="department">
          <el-select
            v-model="registerForm.department"
            placeholder="选择部门"
            size="large"
            style="width: 100%"
            class="modern-select"
          >
            <el-option label="技术部" value="tech" />
            <el-option label="法务部" value="legal" />
            <el-option label="管理部" value="admin" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item prop="role">
          <el-select
            v-model="registerForm.role"
            placeholder="选择角色"
            size="large"
            style="width: 100%"
            class="modern-select"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
            <el-option label="审核员" value="reviewer" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-checkbox
            v-model="registerForm.agreeTerms"
            class="modern-checkbox"
          >
            我已阅读并同意服务条款
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleRegister"
            class="register-button"
          >
            <el-icon v-if="!loading"><Plus /></el-icon>
            <span>{{ loading ? "注册中..." : "注册" }}</span>
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span class="footer-text">已有账号？</span>
        <el-link @click="goToLogin" class="footer-link">
          <el-icon><User /></el-icon>
          立即登录
        </el-link>
        <el-link @click="goHome" class="footer-link">
          <el-icon><House /></el-icon>
          返回首页
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStore } from "@/stores/user";
import type { RegisterForm } from "@/stores/user";
import { Plus, User, House } from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const registerFormRef = ref<FormInstance>();

const registerForm = reactive<RegisterForm>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  realName: "",
  phone: "",
  department: "",
  role: "user",
  agreeTerms: false,
});

// 表单验证规则
const registerRules: FormRules = {
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
    {
      validator: (rule, value, callback) => {
        if (value && userStore.isUsernameExists(value)) {
          callback(new Error("用户名已存在"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value && userStore.isEmailExists(value)) {
          callback(new Error("邮箱已被注册"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: "密码必须包含大小写字母和数字",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
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
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
};

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  try {
    await registerFormRef.value.validate();

    if (!registerForm.agreeTerms) {
      ElMessage.warning("请先同意服务条款");
      return;
    }

    loading.value = true;

    await userStore.register(registerForm);

    ElMessage.success("注册成功！请登录");
    router.push("/login");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "注册失败");
  } finally {
    loading.value = false;
  }
};

// 跳转到登录页
const goToLogin = () => {
  router.push("/login");
};

// 返回首页
const goHome = () => {
  router.push("/");
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景动画 */
.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.floating-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  left: 80%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 80%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: 70%;
  animation-delay: 1s;
}

.shape-5 {
  width: 90px;
  height: 90px;
  top: 50%;
  left: 5%;
  animation-delay: 3s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
}

.register-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px;
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: slideInUp 0.8s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.logo-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.logo-text h1 {
  margin: 0 0 5px 0;
  color: white;
  font-size: 2em;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo-text p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1em;
}

.register-form {
  margin-bottom: 20px;
}

.modern-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.modern-input :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.modern-input :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.2);
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.modern-input :deep(.el-input__inner) {
  color: white;
}

.modern-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.modern-input :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.8);
}

.modern-select :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.modern-select :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.modern-select :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.2);
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.modern-select :deep(.el-input__inner) {
  color: white;
}

.modern-select :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.modern-checkbox :deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.8);
}

.modern-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #667eea;
  border-color: #667eea;
}

.register-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

.register-button:active {
  transform: translateY(0);
}

.register-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.footer-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.footer-link:hover {
  color: white;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-card {
    padding: 30px 20px;
  }

  .register-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
 