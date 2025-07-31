<template>
  <div class="password-change">
    <div class="page-header">
      <el-button @click="$router.go(-1)" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>修改密码</h1>
    </div>

    <el-card class="password-form-card">
      <template #header>
        <div class="card-header">
          <span>密码修改</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="password-form"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            clearable
          />
          <div class="password-tips">
            <p>密码要求：</p>
            <ul>
              <li>长度在 6 到 20 个字符</li>
              <li>必须包含大小写字母和数字</li>
            </ul>
          </div>
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            <el-icon><Check /></el-icon>
            确认修改
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
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { ArrowLeft, Check, Refresh, Close } from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 表单验证规则
const rules: FormRules = {
  oldPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
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
      validator: (
        rule: unknown,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (form.newPassword && value !== form.newPassword) {
          callback(new Error("两次输入密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 验证当前密码
    const isValid = await userStore.verifyPassword(form.oldPassword);
    if (!isValid) {
      ElMessage.error("当前密码不正确");
      return;
    }

    // 更新密码
    loading.value = true;
    const currentUser = userStore.currentUser;
    if (!currentUser) {
      ElMessage.error("用户信息获取失败");
      return;
    }

    await userStore.updateUser(currentUser.id, {
      ...currentUser,
      password: form.newPassword,
    });

    ElMessage.success("密码修改成功");

    // 清空表单
    Object.assign(form, {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    formRef.value.resetFields();

    // 返回上一页
    router.go(-1);
  } catch (error) {
    console.error("密码修改失败:", error);
    ElMessage.error("密码修改失败");
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  Object.assign(form, {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  formRef.value?.resetFields();
};
</script>

<style scoped>
.password-change {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.password-form-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.password-form {
  padding: 20px 0;
}

.password-tips {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.password-tips p {
  margin: 0 0 5px 0;
  font-weight: 600;
}

.password-tips ul {
  margin: 0;
  padding-left: 20px;
}

.password-tips li {
  margin: 2px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .password-change {
    padding: 15px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
