<template>
  <div class="login-container">
    <!-- 粒子背景动画 -->
    <div class="particles-container">
      <div
        class="particle"
        v-for="i in 80"
        :key="i"
        :style="getParticleStyle(i)"
      ></div>
    </div>

    <!-- 动态光效 -->
    <div class="light-effects">
      <div class="light-beam light-1"></div>
      <div class="light-beam light-2"></div>
      <div class="light-beam light-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-icon">
            <el-icon><DocumentIcon /></el-icon>
          </div>
          <div class="logo-text">
            <h1>欢迎回来</h1>
            <p>专利管理系统</p>
          </div>
        </div>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            prefix-icon="User"
            class="modern-input"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            prefix-icon="Lock"
            show-password
            class="modern-input"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
          />
        </el-form-item>

        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="loginForm.rememberMe" class="modern-checkbox">
              记住我
            </el-checkbox>
            <el-link @click="forgotPassword" class="forgot-link">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            <el-icon v-if="!loading"><User /></el-icon>
            <span>{{ loading ? "登录中..." : "登录" }}</span>
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span class="footer-text">还没有账号？</span>
        <el-link @click="goToRegister" class="footer-link">
          <el-icon><Plus /></el-icon>
          立即注册
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
import {
  User,
  Plus,
  House,
  Document as DocumentIcon,
} from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const loginFormRef = ref<FormInstance>();

const loginForm = reactive({
  username: "",
  password: "",
  rememberMe: false,
});

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 3,
      max: 20,
      message: "用户名长度在 3 到 20 个字符",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
  ],
};

// 粒子样式
const getParticleStyle = (_index: number) => {
  const size = Math.random() * 4 + 2;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const delay = Math.random() * 8;
  const duration = Math.random() * 12 + 8;

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};

// 输入框焦点处理
const handleInputFocus = (event: Event) => {
  const target = event.target as HTMLElement;
  const inputWrapper = target.closest(
    ".el-input__wrapper"
  ) as HTMLElement | null;
  if (inputWrapper) {
    inputWrapper.style.transform = "scale(1.02)";
  }
};

const handleInputBlur = (event: Event) => {
  const target = event.target as HTMLElement;
  const inputWrapper = target.closest(
    ".el-input__wrapper"
  ) as HTMLElement | null;
  if (inputWrapper) {
    inputWrapper.style.transform = "scale(1)";
  }
};

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loading.value = true;

    await userStore.login(loginForm.username, loginForm.password);

    ElMessage.success("登录成功！");
    router.push("/dashboard");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  } finally {
    loading.value = false;
  }
};

// 忘记密码
const forgotPassword = () => {
  ElMessage.info("忘记密码功能开发中...");
};

// 跳转到注册页
const goToRegister = () => {
  router.push("/register");
};

// 返回首页
const goHome = () => {
  router.push("/");
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 粒子背景动画 */
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float-particle linear infinite;
  pointer-events: none;
}

@keyframes float-particle {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* 动态光效 */
.light-effects {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.light-beam {
  position: absolute;
  width: 2px;
  height: 100vh;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: light-sweep 10s linear infinite;
}

.light-1 {
  left: 20%;
  animation-delay: 0s;
}

.light-2 {
  left: 50%;
  animation-delay: 3s;
}

.light-3 {
  left: 80%;
  animation-delay: 6s;
}

@keyframes light-sweep {
  0% {
    transform: translateY(-100vh);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px;
  width: 450px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: slideInUp 0.8s ease-out;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  animation: rotate 20s linear infinite;
  pointer-events: none;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

.login-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
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

.login-form {
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
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

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.modern-checkbox :deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.8);
}

.modern-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #667eea;
  border-color: #667eea;
}

.forgot-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.3s ease;
}

.forgot-link:hover {
  color: white;
  transform: translateY(-1px);
}

.login-button {
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
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.login-button:hover::before {
  left: 100%;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
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
  .login-card {
    padding: 30px 20px;
  }

  .login-footer {
    flex-direction: column;
    gap: 10px;
  }

  .form-options {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
