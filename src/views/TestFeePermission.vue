<template>
  <div class="test-fee-permission">
    <h1>费用管理权限控制测试</h1>

    <div class="test-section">
      <h2>当前用户信息</h2>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ userStore.currentUser?.realName || "未知" }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ getRoleText(userStore.currentUser?.role) }}
        </el-descriptions-item>
        <el-descriptions-item label="是否为管理员">
          {{ isAdmin ? "是" : "否" }}
        </el-descriptions-item>
        <el-descriptions-item label="可编辑权限">
          {{ canEdit ? "是" : "否" }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="test-section">
      <h2>权限测试</h2>
      <el-button @click="testEditPermission">测试编辑权限</el-button>
      <el-button @click="testMarkAsPaidPermission"
        >测试标记已缴费权限</el-button
      >
      <el-button @click="testAddPermission">测试添加权限</el-button>
      <p>测试结果: {{ testResult }}</p>
    </div>

    <div class="test-section">
      <h2>角色切换测试</h2>
      <el-button @click="switchToAdmin">切换到管理员</el-button>
      <el-button @click="switchToUser">切换到普通用户</el-button>
      <el-button @click="switchToReviewer">切换到审核员</el-button>
    </div>

    <div class="test-section">
      <h2>权限组件测试</h2>
      <div class="permission-test">
        <h3>编辑按钮</h3>
        <el-button v-if="canEdit" type="primary">编辑 (管理员可见)</el-button>
        <el-tag v-else type="info">仅管理员可编辑</el-tag>

        <h3>标记已缴费按钮</h3>
        <el-button v-if="canMarkAsPaid" type="success"
          >标记已缴费 (管理员可见)</el-button
        >
        <el-tag v-else type="info">仅管理员可标记已缴费</el-tag>

        <h3>添加按钮</h3>
        <el-button v-if="canEdit" type="primary"
          >添加费用 (管理员可见)</el-button
        >
        <el-tag v-else type="info">仅管理员可添加</el-tag>
      </div>
    </div>

    <div class="test-section">
      <h2>权限提示测试</h2>
      <div v-if="!canEdit" class="permission-notice">
        <el-alert
          title="权限提示"
          type="info"
          description="您当前为普通用户，只能查看费用记录。编辑、添加和标记已缴费等操作需要管理员权限。"
          show-icon
          :closable="false"
        />
      </div>
      <div v-else class="permission-notice">
        <el-alert
          title="管理员权限"
          type="success"
          description="您当前为管理员，拥有所有操作权限。"
          show-icon
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";

const userStore = useUserStore();

const testResult = ref("");

// 权限检查
const isAdmin = computed(() => userStore.currentUser?.role === "admin");
const canEdit = computed(() => isAdmin.value);
const canMarkAsPaid = computed(() => isAdmin.value);

const getRoleText = (role?: string) => {
  const texts: Record<string, string> = {
    user: "普通用户",
    admin: "管理员",
    reviewer: "审核员",
  };
  return texts[role || ""] || "未知";
};

const testEditPermission = () => {
  if (canEdit.value) {
    testResult.value = "✅ 编辑权限测试通过 - 管理员可以编辑";
    ElMessage.success("编辑权限测试通过");
  } else {
    testResult.value = "❌ 编辑权限测试失败 - 普通用户不能编辑";
    ElMessage.warning("编辑权限测试失败 - 权限不足");
  }
};

const testMarkAsPaidPermission = () => {
  if (canMarkAsPaid.value) {
    testResult.value = "✅ 标记已缴费权限测试通过 - 管理员可以标记";
    ElMessage.success("标记已缴费权限测试通过");
  } else {
    testResult.value = "❌ 标记已缴费权限测试失败 - 普通用户不能标记";
    ElMessage.warning("标记已缴费权限测试失败 - 权限不足");
  }
};

const testAddPermission = () => {
  if (canEdit.value) {
    testResult.value = "✅ 添加权限测试通过 - 管理员可以添加";
    ElMessage.success("添加权限测试通过");
  } else {
    testResult.value = "❌ 添加权限测试失败 - 普通用户不能添加";
    ElMessage.warning("添加权限测试失败 - 权限不足");
  }
};

const switchToAdmin = () => {
  userStore.currentUser = {
    ...userStore.currentUser!,
    role: "admin",
  };
  ElMessage.success("已切换到管理员角色");
};

const switchToUser = () => {
  userStore.currentUser = {
    ...userStore.currentUser!,
    role: "user",
  };
  ElMessage.success("已切换到普通用户角色");
};

const switchToReviewer = () => {
  userStore.currentUser = {
    ...userStore.currentUser!,
    role: "reviewer",
  };
  ElMessage.success("已切换到审核员角色");
};
</script>

<style scoped>
.test-fee-permission {
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.test-section h2 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.test-section h3 {
  margin: 15px 0 10px 0;
  color: #2c3e50;
  font-size: 1em;
}

.permission-test {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.permission-notice {
  margin-top: 15px;
}

.test-section p {
  margin: 10px 0 0 0;
  color: #666;
  font-weight: 500;
}
</style>
